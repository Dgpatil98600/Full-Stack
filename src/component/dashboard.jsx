import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Card from "./card"
import Chat from './chat'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import 'remixicon/fonts/remixicon.css'

const Dashboard = () => {
  const navigate = useNavigate();
  const chatPanelRef = useRef(null);
  const [chatPanel, setChatPanel] = useState(false);

  useGSAP(() => {
    if (chatPanel) {
      gsap.to(chatPanelRef.current, {
        opacity: 1,
        transform: 'translateY(0%) translateX(0%)',
        duration: 0.5,
        display: 'block'
      });
    } else {
      gsap.to(chatPanelRef.current, {
        opacity: 0,
        transform: 'translateY(100%) translateX(100%)',
        duration: 0.5,
        onComplete: () => {
          gsap.set(chatPanelRef.current, { display: 'none' });
        }
      });
    }
  }, [chatPanel]);

  return (
    <div className='bg-gradient-to-br from-slate-700 to-slate-500 min-h-screen p-4 flex flex-col items-center'>
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

      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
        <Card title="Bill Generator" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
        <Card title="Manage Products" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
        <Card title="Your Bills" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
        <Card title="Product Analysis" image="https://phppot.com/wp-content/uploads/2021/01/ecommerce-purchase-invoice-pdf-output.jpg" />
      </div>

      <div className="w-full flex justify-end mt-8 pr-4">
        <button
          className='bg-green-500 text-white px-4 py-2 rounded-xl shadow-md'
          onClick={() => setChatPanel(!chatPanel)}
        >
          Get Suggestion with AI
        </button>
      </div>

      <div
        ref={chatPanelRef}
        className='fixed bottom-4 right-4 w-80 h-96 bg-white shadow-xl rounded-lg p-3 overflow-hidden z-50'
        style={{ display: 'none', transform: 'translateY(100%) translateX(100%)', opacity: 0 }}
      >
        <Chat setChatPanel={setChatPanel} />
      </div>
    </div>
  )
}

export default Dashboard;
