import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, Image as ImageIcon, RotateCcw, FileDown, Loader, MapPin } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
  reportSummary?: string;
  annotatedImage?: string;
  hospitals?: Hospital[];
}

interface Hospital {
  name: string;
  address: string;
  rating?: number;
  location: {
    lat: number;
    lng: number;
  };
  place_id: string;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "👋 **Welcome to Orthopedic Assistant!**\n\nI'm here to help analyze X-ray images and provide orthopedic suggestions. You can:\n\n- Upload an X-ray image for analysis\n- Ask questions about fractures and treatments\n- Get detailed medical recommendations\n- Download analysis reports as PDF\n- Find nearby orthopedic hospitals\n\nHow can I assist you today?",
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReset = () => {
    setMessages([{
      id: '1',
      text: "👋 **Welcome to Orthopedic Assistant!**\n\nI'm here to help analyze X-ray images and provide orthopedic suggestions. You can:\n\n- Upload an X-ray image for analysis\n- Ask questions about fractures and treatments\n- Get detailed medical recommendations\n- Download analysis reports as PDF\n- Find nearby orthopedic hospitals\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  const handleFindNearbyHospitals = async (messageId: string) => {
    try {
      setIsLocationLoading(true);
      
      // Add a message to indicate we're searching for hospitals
      const userMessage: Message = {
        id: Date.now().toString(),
        text: "Find nearby orthopedic hospitals for me",
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Simulate hospital data for testing/development
      // This avoids CORS and API key issues during development
      const simulatedHospitals = [
        {
          name: "City Orthopedic Hospital",
          address: "123 Medical Center Dr",
          rating: 4.5,
          location: { lat: 37.7749, lng: -122.4194 },
          place_id: "ChIJIQBpAG2ahYAR_6128GcTUEo"
        },
        {
          name: "Central Bone & Joint Clinic",
          address: "456 Healthcare Ave",
          rating: 4.2,
          location: { lat: 37.7749, lng: -122.4194 },
          place_id: "ChIJa8KpAMWfj4ARs7ChHJcockY"
        },
        {
          name: "Advanced Orthopedic Center",
          address: "789 Wellness Blvd",
          rating: 4.8,
          location: { lat: 37.7749, lng: -122.4194 },
          place_id: "ChIJa8KpAMWfj4ARs7ChHJcockY"
        }
      ];
      
      // Create response message with simulated data
      let responseText = "## Nearby Orthopedic Hospitals\n\n";
      responseText += "Here are orthopedic hospitals that may be near your location:\n\n";
      
      simulatedHospitals.forEach((hospital, index) => {
        responseText += `${index + 1}. **${hospital.name}**\n`;
        responseText += `   Address: ${hospital.address}\n`;
        if (hospital.rating) {
          responseText += `   Rating: ${hospital.rating} ⭐\n`;
        }
        responseText += `   [View on Google Maps](https://www.google.com/maps/place/?q=place_id:${hospital.place_id})\n\n`;
      });
      
      // Add a note about simulated data
      responseText += "\n*Note: This is simulated data for development purposes. In production, this would use your actual location to find nearby hospitals.*";
      
      const botMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        hospitals: simulatedHospitals
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLocationLoading(false);
      
      /* 
      // Real implementation commented out for now - uncomment when backend is ready
      // Get user's current location
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }
      
      // Get current position
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Make API call to backend to find nearby hospitals
            const response = await fetch(`${API_BASE_URL}/nearby_hospitals`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ lat: latitude, lng: longitude }),
              credentials: 'include', // Include cookies for CORS
            });
            
            if (!response.ok) {
              throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            const hospitals = data.hospitals || [];
            
            // Create response message
            let responseText = "## Nearby Orthopedic Hospitals\n\n";
            
            if (hospitals.length === 0) {
              responseText += "No orthopedic hospitals found in your area.";
            } else {
              responseText += "Here are orthopedic hospitals near your location:\n\n";
              hospitals.forEach((hospital: Hospital, index: number) => {
                responseText += `${index + 1}. **${hospital.name}**\n`;
                responseText += `   Address: ${hospital.address}\n`;
                if (hospital.rating) {
                  responseText += `   Rating: ${hospital.rating} ⭐\n`;
                }
                responseText += `   [View on Google Maps](https://www.google.com/maps/place/?q=place_id:${hospital.place_id})\n\n`;
              });
            }
            
            const botMessage: Message = {
              id: Date.now().toString(),
              text: responseText,
              sender: 'bot',
              timestamp: new Date(),
              hospitals: hospitals
            };
            
            setMessages(prev => [...prev, botMessage]);
          } catch (error) {
            console.error("Error fetching hospitals:", error);
            const errorMessage: Message = {
              id: Date.now().toString(),
              text: `## Error\n\nFailed to find nearby hospitals: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
          } finally {
            setIsLocationLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          const errorMessage: Message = {
            id: Date.now().toString(),
            text: `## Error\n\nUnable to access your location: ${error.message}. Please allow location access to use this feature.`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      */
      
    } catch (error) {
      console.error("Error in hospital search:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `## Error\n\nFailed to search for hospitals: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLocationLoading(false);
    }
  };

  const handleDownloadPDF = async (reportSummary: string, messageId: string, annotatedImage?: string) => {
    try {
      // Set loading state for this specific message
      setIsPdfLoading(messageId);
      console.log(`Generating PDF for message ${messageId}...`);
      
      // Create a form data object to send the report markdown and image filename
      const formData = new FormData();
      formData.append('report_md', reportSummary);
      
      // Include the annotated image filename if available
      if (annotatedImage) {
        // Extract just the filename from the URL
        const imageName = annotatedImage.split('/').pop();
        if (imageName) {
          formData.append('annotated_image', imageName);
          console.log(`Including annotated image: ${imageName}`);
        }
      }
      
      // Make a request to download the PDF
      const response = await fetch(`${API_BASE_URL}/download_pdf`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      // Check for errors
      if (!response.ok) {
        console.error('PDF generation failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get content type to verify it's a PDF
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Expected PDF but got:', contentType);
        throw new Error(`Server returned ${contentType} instead of PDF`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'fracture_report.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('PDF download completed successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPdfLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    const formData = new FormData();
    if (input.trim()) formData.append('message', input);
    if (selectedFile) formData.append('image', selectedFile);

    // Add chat history to formData
    const chatHistory = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    formData.append('chat_history', JSON.stringify(chatHistory));

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.response) {
        const botMessage: Message = {
          id: Date.now().toString(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date(),
          reportSummary: data.report_summary || null
        };

        if (data.annotated_image_url) {
          botMessage.imageUrl = `${API_BASE_URL}${data.annotated_image_url}`;
          // Store just the filename for use in PDF generation
          botMessage.annotatedImage = data.annotated_image_url;
        }

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "⚠️ **Error**\n\nFailed to get response from server. Please try again.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Orthopedic Assistant</h2>
        <div className="flex space-x-2">
          {/*<button*/}
          {/*  onClick={() => handleFindNearbyHospitals("location")}*/}
          {/*  disabled={isLocationLoading}*/}
          {/*  className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 */}
          {/*          rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"*/}
          {/*  title="Find Nearby Hospitals"*/}
          {/*>*/}
          {/*  {isLocationLoading ? */}
          {/*    <Loader className="h-5 w-5 animate-spin" /> : */}
          {/*    <MapPin className="h-5 w-5" />*/}
          {/*  }*/}
          {/*</button>*/}
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 
                    rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Reset Chat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div 
        ref={chatBoxRef}
        className="h-[600px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800"
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white dark:bg-blue-700'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className={`prose dark:prose-invert ${
                  message.sender === 'user' ? 'prose-white' : ''
                } max-w-none`}>
                  <ReactMarkdown>
                    {message.text}
                  </ReactMarkdown>
                </div>
                {message.imageUrl && (
                  <div className="mt-4">
                    <img 
                      src={message.imageUrl} 
                      alt="Annotated X-ray" 
                      className="max-w-full rounded-lg shadow-md"
                    />
                  </div>
                )}
                {message.sender === 'bot' && message.reportSummary && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleDownloadPDF(
                        message.reportSummary!, 
                        message.id, 
                        message.annotatedImage
                      )}
                      disabled={isPdfLoading === message.id}
                      className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
                    >
                      {isPdfLoading === message.id ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4" />
                          <span>Download Report as PDF{message.imageUrl ? ' with X-ray' : ''}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex space-x-2 p-4 bg-white dark:bg-gray-800 rounded-xl w-24 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce delay-200" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-750">
        <div className="flex space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400
                     hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <Upload className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white
                     focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white/70 dark:bg-gray-700/70 backdrop-blur-sm"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 
                     dark:hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center">
            <ImageIcon className="h-4 w-4 mr-1" />
            {selectedFile.name}
          </div>
        )}
      </form>
    </div>
  );
};