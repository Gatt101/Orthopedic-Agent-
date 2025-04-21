from flask import Flask, request, jsonify, send_from_directory, session, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import cv2
from PIL import Image
from ultralytics import YOLO
import requests
import re
import json
from dotenv import load_dotenv
from markdown import markdown
from xhtml2pdf import pisa
from io import BytesIO
import base64
import time

# ==== Load environment variables ====
load_dotenv()

app = Flask(__name__)

# ==== CORS Configuration ====
CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5174"],  # Add your frontend URLs
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

app.secret_key = os.getenv("FLASK_SECRET_KEY", "fallback_dev_key")

# ==== Config ====
UPLOAD_FOLDER = "uploads"
ANNOTATED_FOLDER = "annotated_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ANNOTATED_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ANNOTATED_FOLDER'] = ANNOTATED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# ==== YOLO Model ====
MODEL_PATH = os.getenv("MODEL_PATH", "mnt/data/best.pt")
model = YOLO(MODEL_PATH)

# ==== Groq LLM Setup ====
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set. Please set it in your .env file.")

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json"
}

def check_groq_api_key():
    try:
        # Test API key with a simple request
        test_payload = {
            "model": "qwen-2.5-32b",
            "messages": [{"role": "user", "content": "test"}],
            "max_tokens": 5
        }
        response = requests.post(GROQ_API_URL, headers=HEADERS, json=test_payload)
        if response.status_code == 401:
            raise ValueError("Invalid Groq API key. Please check your API key in the .env file.")
        return True
    except Exception as e:
        print(f"Error testing Groq API key: {str(e)}")
        return False

# Test API key on startup
if not check_groq_api_key():
    print("Warning: Groq API key validation failed. Chat functionality may be limited.")

# ==== Severity Config ====
SEVERITY_THRESHOLD = float(os.getenv("SEVERITY_THRESHOLD", "0.5"))

# ==== Annotation Utility ====
def draw_annotations(image_path, results, output_path):
    img = cv2.imread(image_path)
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            confidence = box.conf[0].item()
            severity = "Severe" if confidence > SEVERITY_THRESHOLD else "Mild"
            color = (0, 0, 255) if severity == "Severe" else (0, 255, 0)
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            label = f"{severity} ({confidence:.2f})"
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    cv2.imwrite(output_path, img)

# ==== Clean response ====
def clean_llm_response(text):
    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    return cleaned

# ==== Medical Suggestion ====
def generate_suggestion(severity, confidence, chat_history=None):
    try:
        context = ""
        if chat_history:
            context = "**Previous conversation:**\n"
            for msg in chat_history[-5:]:
                context += f"**{msg['role']}:** {msg['content']}\n"
            context += "\n"

        prompt = f"""
        {context}
        A patient has a bone fracture detected via X-ray.
        The model confidence is {confidence:.2f} and severity is classified as {severity}.

        Please provide a structured orthopedic medical recommendation in markdown format with these sections:
        - **Severity Assessment**
        - **Urgency Level**
        - **Recommendations** (as a bulleted list)
        - **Treatment Complexity** (High, Moderate, Low, None)

        Format your response in markdown with proper headers and bullet points.
        """

        payload = {
            "model": "qwen-2.5-32b",
            "messages": [
                {"role": "system", "content": "You are an expert orthopedic AI assistant providing structured medical reports in markdown format."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.5,
            "max_tokens": 300
        }

        response = requests.post(GROQ_API_URL, headers=HEADERS, json=payload)
        if response.status_code == 200:
            content = response.json()['choices'][0]['message']['content'].strip()
            return content
        else:
            raise Exception(f"Groq API Error: {response.status_code}")

    except Exception as e:
        return f"""## Error
{str(e)}

## Severity Assessment
{severity} Fracture Detected

## Urgency Level
{"Consult a doctor immediately." if severity == "Severe" else "Schedule a doctor's appointment."}

## Recommendations
- Avoid putting weight on the affected area
- Use ice packs to reduce swelling
- Take over-the-counter pain relievers if necessary

## Treatment Complexity
{"High" if severity == "Severe" else "Moderate"}"""

# ==== Chatbot with History ====
def generate_chatbot_response(user_input, chat_history=None):
    system_prompt = (
        "You are an expert orthopedic AI assistant. "
        "Help with fracture assessments, image interpretation, and treatment suggestions. "
        "Consider the conversation history to provide contextually relevant responses. "
        "Format your responses in markdown with proper headers, bullet points, and emphasis where appropriate. "
        "Do NOT include <think> tags, internal thoughts, or reasoning steps. "
        "Only return the final response directly to the user."
    )

    messages_for_llm = [{"role": "system", "content": system_prompt}]
    
    if chat_history:
        messages_for_llm.extend(chat_history[-10:])
    
    messages_for_llm.append({"role": "user", "content": user_input})

    payload = {
        "model": "qwen-2.5-32b",
        "messages": messages_for_llm,
        "temperature": 0.7,
        "max_tokens": 300
    }

    response = requests.post(GROQ_API_URL, headers=HEADERS, json=payload)
    if response.status_code == 200:
        raw_text = response.json()['choices'][0]['message']['content'].strip()
        cleaned = clean_llm_response(raw_text)
        return cleaned
    else:
        return f"## Error\nFailed to get response from server (Status: {response.status_code})"

# ==== Conversational Endpoint ====
@app.route("/chat", methods=["POST"])
def chat():
    try:
        print("Received chat request")
        # Handle both JSON and form data
        if request.is_json:
            print("Processing JSON request")
            data = request.get_json()
            message = data.get("message", "")
            chat_history = data.get("chat_history", [])
            file_data = data.get("image", None)
        else:
            print("Processing form data request")
            message = request.form.get("message", "")
            chat_history_str = request.form.get("chat_history", "[]")
            try:
                chat_history = json.loads(chat_history_str)
            except json.JSONDecodeError as e:
                print(f"Error decoding chat history: {e}")
                chat_history = []
            
            file = request.files.get("image", None)
            file_data = file

        print(f"Message: {message}")
        print(f"Chat history length: {len(chat_history)}")
        print(f"File data present: {bool(file_data)}")

        # Initialize variables
        filename = None
        report_summary, annotated_url = "", ""

        if file_data:
            try:
                # Handle file upload (either from form or base64)
                if isinstance(file_data, str):  # Base64 encoded
                    print("Processing base64 image")
                    # Decode base64 image
                    header, encoded = file_data.split(",", 1)
                    file_bytes = base64.b64decode(encoded)
                    filename = f"upload_{int(time.time())}.png"
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    with open(filepath, "wb") as f:
                        f.write(file_bytes)
                else:  # Regular file upload
                    print("Processing regular file upload")
                    filename = secure_filename(file_data.filename)
                    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file_data.save(filepath)

                # Process image
                print(f"Processing image: {filepath}")
                image = Image.open(filepath)
                results = model(image)
                detections, highest_confidence, most_severe = [], 0, "No Fracture"

                for result in results:
                    for box in result.boxes:
                        confidence = box.conf[0].item()
                        severity = "Severe" if confidence > SEVERITY_THRESHOLD else "Mild"
                        if confidence > highest_confidence:
                            highest_confidence = confidence
                        if severity == "Severe":
                            most_severe = "Severe"

                report = generate_suggestion(most_severe, highest_confidence, chat_history)
                report_summary = report

                annotated_path = os.path.join(app.config['ANNOTATED_FOLDER'], filename)
                draw_annotations(filepath, results, annotated_path)
                annotated_url = f"/get_annotated/{filename}"
                print(f"Generated annotated image: {annotated_url}")

            except Exception as e:
                print(f"Error processing image: {str(e)}")
                return jsonify({
                    "error": f"Image analysis failed: {str(e)}",
                    "details": {
                        "filename": filename,
                        "error_type": type(e).__name__
                    }
                }), 500

        final_prompt = f"{report_summary}\n\nUser says: {message}" if report_summary else message
        print(f"Generating chatbot response for prompt: {final_prompt[:100]}...")
        reply = generate_chatbot_response(final_prompt, chat_history)

        response_data = {
            "response": reply,
            "report_summary": report_summary,
            "annotated_image_url": annotated_url
        }
        print("Sending response")
        return jsonify(response_data)

    except Exception as e:
        print(f"Server error: {str(e)}")
        return jsonify({
            "error": f"Server error: {str(e)}",
            "details": {
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
        }), 500

# ==== Download Annotated Image ====
@app.route("/get_annotated/<filename>")
def get_annotated_image(filename):
    return send_from_directory(ANNOTATED_FOLDER, filename)

# ==== Clear Chat History ====
@app.route("/clear_history", methods=["POST"])
def clear_history():
    session.pop("history", None)
    return jsonify({"message": "Chat history cleared."})

def generate_pdf_from_markdown(md_content):
    try:
        html_content = markdown(md_content)
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)
        if pisa_status.err:
            return None, "PDF generation failed"
        pdf_buffer.seek(0)
        return pdf_buffer, None
    except Exception as e:
        return None, str(e)

# ==== Download PDF ====
@app.route("/download_pdf", methods=["POST"])
def download_pdf():
    report_md = request.form.get("report_md", "")
    if not report_md:
        return jsonify({"error": "No report content provided."}), 400

    try:
        # Generate PDF from markdown
        pdf_buffer, error = generate_pdf_from_markdown(report_md)
        if error:
            return jsonify({"error": error}), 500

        # Return the PDF as a response
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='fracture_report.pdf'
        )
    except Exception as e:
        app.logger.error(f"PDF generation error: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ==== Run the App ====
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True) 