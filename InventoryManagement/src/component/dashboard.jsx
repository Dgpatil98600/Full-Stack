import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from "./card";
import Chat from './chat';
import 'remixicon/fonts/remixicon.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [chatPanel, setChatPanel] = useState(false);
  const [chatWidth, setChatWidth] = useState(400); // initial chat panel width (px)
  const resizerRef = useRef(null);

  // Handle mouse dragging for resizing
  const startResize = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    const startX = e.clientX;
    const startWidth = chatWidth;

    const onMouseMove = (moveEvt) => {
      const diff = startX - moveEvt.clientX;
      let newWidth = startWidth + diff;
      newWidth = Math.max(300, Math.min(newWidth, 700)); // clamp: 300px to 700px
      setChatWidth(newWidth);
    };

    const onMouseUp = () => {
      document.body.style.cursor = 'default';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className='flex h-screen w-screen bg-gradient-to-br from-slate-700 to-slate-500 overflow-hidden'>
      
      {/* Main Dashboard Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-4">
          <span
            className="cursor-pointer text-3xl"
            title="Profile"
            onClick={() => navigate('/profile')}
          >
            <i className="ri-account-circle-line text-white"></i>
          </span>
          <span
            className="cursor-pointer text-3xl"
            title="Notifications"
            onClick={() => navigate('/notifications')}
          >
            🔔
          </span>
        </div>

        {/* Grid Container */}
        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10 transition-all duration-300">
          <Card title="Bill Generator" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
          <Card title="Manage Products" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
          <Card title="Your Bills" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
          <Card title="Product Analysis" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
          <Card title="Shop Analysis" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
        </div>

        {/* AI Button */}
        <div className="w-full flex justify-end mt-8 pr-4">
          <button
            className='bg-green-500 text-white px-4 py-2 rounded-xl shadow-md'
            onClick={() => {
              // 🚀 FIX: Reset the width to default (400) every time we open the panel
              if (!chatPanel) {
                setChatWidth(400); 
              }
              setChatPanel(!chatPanel);
            }}
          >
            {chatPanel ? 'Close AI Suggestion' : 'Get Suggestion with AI'}
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {chatPanel && (
        <div
          className='relative h-full bg-white shadow-xl flex-shrink-0 flex'
          style={{ width: `${chatWidth}px`, minWidth: 300, maxWidth: 700 }}
        >
          {/* Drag handle for resizing */}
          <div
            ref={resizerRef}
            className="w-2 cursor-col-resize hover:bg-gray-300 transition"
            onMouseDown={startResize}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10, background: 'transparent' }}
            title="Resize panel"
          />

          <div className="h-full w-full pl-2">
            <Chat setChatPanel={setChatPanel} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;