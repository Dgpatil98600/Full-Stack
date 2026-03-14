import React, { useState, useRef, useEffect } from 'react';
import { RiSendPlane2Fill } from 'react-icons/ri';
import axios from 'axios';

const Chat = ({ setChatPanel }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setChatHistory([{ sender: 'ai', text: "Hello! I'm your inventory assistant. Ask me about products, sales, stock levels, or business insights." }]);
  }, []);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: message };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found. Please login again.');

      const response = await axios.post('/api/chatbot/chat', { message: userMessage.text }, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      setChatHistory(prev => [...prev, {
        sender: 'ai',
        text: response.data.answer || "I processed your request.",
        tableData: response.data.tableData // Capture the table data!
      }]);

    } catch (error) {
      if(error.response && error.response.status === 401) {
          setChatHistory(prev => [...prev, { sender: 'ai', text: "Your session has expired. Please log in again." }]);
      } else {
        setChatHistory(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't process your request right now." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), [chatHistory]);

  const excludeKeys = ['_id', '__v', 'id', 'dateAdded', 'dateUpdated', 'user'];

  return (
    <div className='bg-orange-200 h-full w-full rounded-lg relative flex flex-col justify-between'>
      <button onClick={() => setChatPanel(false)} className='absolute top-2 right-2 text-red-500 text-xl font-bold hover:text-red-700 z-10' title="Close Chat">❌</button>

      <div className="p-4 pt-10 overflow-y-auto flex-1 space-y-3">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`w-full flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-lg text-sm shadow-md whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-green-200 text-right' : 'bg-white text-left'}`}>
              {msg.text}
            </div>

            {/* Smart HTML Table Rendering */}
            {msg.tableData && (() => {
              let renderData = msg.tableData;
              // Extract arrays if nested (like topProducts)
              if (!Array.isArray(renderData) && typeof renderData === 'object' && renderData !== null) {
                const arrayKey = Object.keys(renderData).find(key => Array.isArray(renderData[key]));
                if (arrayKey) renderData = renderData[arrayKey]; 
              }

              return (
              <div className="max-w-[95%] mt-2 overflow-x-auto max-h-72 border border-gray-300 rounded-md bg-white shadow-md">
                
                {/* Array rendering (Products, Bills, AI Suggestions) */}
                {Array.isArray(renderData) && renderData.length > 0 && (
                  <table className="min-w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {Object.keys(renderData[0]).filter(k => !excludeKeys.includes(k)).map(key => (
                          <th key={key} className="px-3 py-2 border-b capitalize whitespace-nowrap">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {renderData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          {Object.entries(row).filter(([k]) => !excludeKeys.includes(k)).map(([k, val]) => (
                            <td key={k} className="px-3 py-2 whitespace-nowrap">
                              {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Single Object rendering (Shop Analysis) */}
                {!Array.isArray(renderData) && typeof renderData === 'object' && renderData !== null && Object.keys(renderData).length > 0 && (
                  <table className="min-w-full text-xs text-left border-collapse">
                    <tbody>
                      {Object.entries(renderData).filter(([k]) => !excludeKeys.includes(k)).map(([key, val], i) => (
                        <tr key={i} className="border-b hover:bg-gray-50">
                          <th className="px-3 py-2 bg-gray-100 capitalize border-r whitespace-nowrap">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              );
            })()}
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
        <input type="text" className="flex-1 px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none" placeholder="Ask about inventory, sales, or insights..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} disabled={isLoading} />
        <button onClick={handleSend} className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 disabled:bg-gray-400" disabled={isLoading}><RiSendPlane2Fill /></button>
      </div>
    </div>
  );
};
export default Chat;