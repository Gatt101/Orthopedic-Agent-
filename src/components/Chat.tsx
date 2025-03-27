import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { API_BASE_URL } from '../config';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string;
}

export const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "👋 **Welcome to Orthopedic Assistant!**\n\nI'm here to help analyze X-ray images and provide orthopedic suggestions. You can:\n\n- Upload an X-ray image for analysis\n- Ask questions about fractures and treatments\n- Get detailed medical recommendations\n\nHow can I assist you today?",
    sender: 'bot',
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReset = () => {
    setMessages([{
      id: '1',
      text: "👋 **Welcome to Orthopedic Assistant!**\n\nI'm here to help analyze X-ray images and provide orthopedic suggestions. You can:\n\n- Upload an X-ray image for analysis\n- Ask questions about fractures and treatments\n- Get detailed medical recommendations\n\nHow can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }]);
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
          timestamp: new Date()
        };

        if (data.annotated_image_url) {
          botMessage.imageUrl = `${API_BASE_URL}${data.annotated_image_url}`;
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
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Orthopedic Assistant</h2>
        <button
          onClick={handleReset}
          className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 
                   rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Reset Chat"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      <div 
        ref={chatBoxRef}
        className="h-[600px] overflow-y-auto p-6 space-y-4"
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
                className={`max-w-[80%] p-4 rounded-xl ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
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
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex space-x-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl w-24"
            >
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-700">
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
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <Upload className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <ImageIcon className="inline-block h-4 w-4 mr-1" />
            {selectedFile.name}
          </div>
        )}
      </form>
    </div>
  );
};