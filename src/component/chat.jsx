import React, { useState, useRef, useEffect } from 'react';
import { RiSendPlane2Fill } from 'react-icons/ri';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

const Chat = ({ setChatPanel }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContextLoading, setIsContextLoading] = useState(true);
  const [inventoryContext, setInventoryContext] = useState(null);
  const chatEndRef = useRef(null);
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  useEffect(() => {
    const fetchContext = async () => {
      setIsContextLoading(true);
      setChatHistory([
        { sender: 'ai', text: "Hello! I'm preparing your latest inventory data..." }
      ]);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found. Please log in again.');
        const response = await axios.get('/api/ai/context', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventoryContext(response.data);
        setChatHistory([
          {
            sender: 'ai',
            text: "Hello! I'm your AI business assistant. I have your latest inventory and sales data. How can I help you with management or suggest growth strategies today?"
          }
        ]);
      } catch (error) {
        setChatHistory([
          {
            sender: 'ai',
            text: "Hello! I couldn't load your inventory data, but I'm still here to help with general advice. How can I assist you?"
          }
        ]);
      } finally {
        setIsContextLoading(false);
      }
    };
    fetchContext();
  }, []);

  const handleSend = async () => {
    if (!message.trim() || isLoading || isContextLoading) return;
    const userMessage = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    try {
      let prompt = '';
      if (inventoryContext) {
        const contextString = `
          Here is the current status of the shop's inventory and recent sales.
          Analyze this data to provide the best possible advice.

          ## Current Products:
          ${JSON.stringify(inventoryContext.products, null, 2)}

          ## Recent Bills (last 30 days):
          ${JSON.stringify(inventoryContext.bills, null, 2)}

          ## Top Products This Month:
          ${JSON.stringify(inventoryContext.topProductbyMonth, null, 2)}
          ## All-Time Top Products:
          ${JSON.stringify(inventoryContext.overALLtopProducts, null, 2)}
        `;
        prompt = `
          You are an expert inventory management and business growth assistant for a small shop owner.
          Based on the following data, provide actionable advice to the user's question. Identify trends, suggest strategies to increase sales and profit.
          Format your response clearly using markdown (e.g., lists with '*' and bold text with **). Keep your responses helpful and concise.
          
          ---
          CONTEXT DATA:
          ${contextString}
          ---

          USER'S QUESTION:
          ${userMessage.text}
        `;
      } else {
        prompt = `
          You are an expert inventory management and business growth assistant for a small shop owner. Provide actionable advice, identify trends, and suggest strategies to increase sales and profit. Format your response clearly using markdown (e.g., lists with '*' and bold text with **). Keep your responses helpful and concise.

          USER'S QUESTION:
          ${userMessage.text}
        `;
      }
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      const aiResponse = { sender: 'ai', text: response.text };
      setChatHistory((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage = { sender: 'ai', text: "Sorry, I'm having trouble generating a response. Please check your API key and try again later." };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className='bg-orange-200 h-full w-full rounded-lg relative flex flex-col justify-between'>
      <button
        onClick={() => setChatPanel(false)}
        className='absolute top-2 right-2 text-red-500 text-xl font-bold hover:text-red-700 z-10'
        title="Close Chat"
      >
        ❌
      </button>
      <div className="p-4 pt-10 overflow-y-auto flex-1 space-y-3">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`w-full flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg text-sm shadow-md whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-green-200 text-right'
                  : 'bg-white text-left'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto max-w-[80%] px-4 py-2 rounded-lg text-sm shadow-md bg-white">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="p-2 border-t border-gray-300 flex items-center bg-white rounded-b-lg">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none"
          placeholder={isContextLoading ? 'Loading inventory data...' : 'Ask for suggestions...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isLoading || isContextLoading}
        />
        <button
          onClick={handleSend}
          className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 disabled:bg-gray-400"
          title="Send"
          disabled={isLoading || isContextLoading}
        >
          <RiSendPlane2Fill />
        </button>
      </div>
    </div>
  );
};

export default Chat;
