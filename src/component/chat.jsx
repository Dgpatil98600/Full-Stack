import React, { useState, useRef, useEffect } from 'react';
import { RiSendPlane2Fill } from 'react-icons/ri';

const Chat = ({ setChatPanel }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatEndRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;

    const userMessage = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, userMessage]);
    setMessage('');

    // Simulate AI response after a short delay
    setTimeout(() => {
        let aiResponse = '';
        if(userMessage.text == "hii"){
            aiResponse = {
                sender: 'ai',
                text: `Welcome bro, let's grow business with me.`,
              };   
        } else if(userMessage.text == "Which new product should i add") {
            aiResponse = {
                sender: 'ai',
                text: `According to last 1 Month your product ice-cream5 is more sold and good progress in that so I 
                recommended at least for this month you also add more coldrinks product because it have more chances to 
                sold and getting profit as it summer season. Also from history of your sales your tea products are 
                continusoly sold so i recommended you should also add cookies for long time product.`,
              };
        } else if(userMessage.text == "Thank You"){
            aiResponse = {
                sender: 'ai',
                text: `It's my pleasure. and i am always with you. Anytime i will definetly help.`,
              };  
        } else {
               aiResponse = {
                sender: 'ai',
                text: `AI response to: "${userMessage.text}"`,
              };
        }
      setChatHistory((prev) => [...prev, aiResponse]);
    }, 800);
  };

  // Scroll to bottom when chatHistory updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className='bg-gray-100 h-full w-full rounded-lg relative flex flex-col justify-between'>
      {/* ❌ Close button */}
      <button
        onClick={() => setChatPanel(false)}
        className='absolute top-2 right-2 text-red-500 text-xl font-bold hover:text-red-700 z-10'
        title="Close Chat"
      >
        ❌
      </button>

      {/* Chat messages */}
      <div className="p-4 pt-10 overflow-y-auto flex-1 space-y-3">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm shadow-md ${
              msg.sender === 'user'
                ? 'ml-auto bg-green-200 text-right'
                : 'mr-auto bg-white'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message input */}
      <div className="p-2 border-t border-gray-300 flex items-center bg-white rounded-b-lg">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600"
          title="Send"
        >
          <RiSendPlane2Fill />
        </button>
      </div>
    </div>
  );
};

export default Chat;
