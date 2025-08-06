import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_xxxxxxxxxx'; 

function loadRazorpayScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Registration = ({ setModalType }) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    shopType: '',
    contact: '',
    proofFile: null,
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const navigate = useNavigate();
  const [showOtherShopType, setShowOtherShopType] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'proofFile') {
      setFormData({ ...formData, proofFile: files[0] });
    } else if (name === 'contactNumber') {
      const numberPart = value;
      setFormData({
        ...formData,
        contactNumber: numberPart,
        contact: `+91${numberPart}`,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleConfirmPasswordKeyUp = () => {
    setPasswordsMatch(formData.password === formData.confirmPassword);
  };

  const handleShopTypeChange = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setShowOtherShopType(true);
      setFormData({ ...formData, shopType: '' });
    } else {
      setShowOtherShopType(false);
      setFormData({ ...formData, shopType: value });
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const sendOTP = async () => {
    if (formData.contact.trim() === '') {
      setErrorMessage('⚠️ Please enter a valid phone number');
      return;
    }
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        shopName: formData.shopName,
        shopType: formData.shopType,
        contact: formData.contact,
      };
      console.log('Sending OTP with payload:', payload);
      const response = await axios.post(`${API_BASE_URL}/api/send-otp`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('OTP sent:', response.data);
      setOtpSent(true);
      setErrorMessage('');
    } catch (error) {
      console.error('Send OTP error:', error);
      const errMsg = error.response?.data?.error || 'Failed to send OTP.';
      setErrorMessage(`⚠️ ${errMsg}`);
    }
  };

  const verifyOTPOnly = async () => {
    if (otp.trim() === '') {
      setErrorMessage('⚠️ Please enter the OTP.');
      return;
    }
    try {
      const form = new FormData();
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }
      form.append('otp', otp);
      const response = await axios.post(`${API_BASE_URL}/api/verify-otp`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        setOtpVerified(true);
        setVerifyMessage('OTP verified! Now proceed to payment.');
      } else {
        setOtpVerified(false);
        setErrorMessage(`⚠️ ${response.data.error || 'OTP verification failed.'}`);
      }
    } catch (error) {
      setOtpVerified(false);
      const errMsg = error.response?.data?.error || 'OTP verification failed.';
      setErrorMessage(`⚠️ ${errMsg}`);
    }
  };

  const completeRegistration = async () => {
    try {
      const form = new FormData();
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }
      const response = await axios.post(`${API_BASE_URL}/api/register`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('User registered successfully:', response.data);
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setModalType(null);
        navigate('/dashboard');
      } else if (response.data.success) {
        setModalType('login');
        navigate('/dashboard');
      } else {
        setErrorMessage(`⚠️ ${response.data.error || 'Registration failed.'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errMsg = error.response?.data?.error || 'Registration failed.';
      setErrorMessage(`⚠️ ${errMsg}`);
    }
  };

  const handleRazorpayPayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!passwordsMatch) {
      setErrorMessage('⚠️ Passwords do not match');
      return;
    }
    for (const key of ['username', 'email', 'password', 'confirmPassword', 'shopName', 'shopType', 'contact']) {
      if (!formData[key] || formData[key].trim() === '') {
        setErrorMessage('⚠️ Please fill all required fields.');
        return;
      }
    }
    if (!otpSent) {
      setErrorMessage('⚠️ Please send OTP to your phone.');
      return;
    }
    if (!otpVerified) {
      setErrorMessage('⚠️ Please verify OTP before payment.');
      return;
    }
    setPaymentLoading(true);
    const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      setErrorMessage('Failed to load Razorpay SDK.');
      setPaymentLoading(false);
      return;
    }
    try {
      const orderRes = await axios.post(`${API_BASE_URL}/api/razorpay/create-order`, {
        amount: 100, 
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`
      });
      const { order } = orderRes.data;
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Registration Payment',
        description: 'Test Registration Fee',
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await axios.post(`${API_BASE_URL}/api/razorpay/verify-payment`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          if (verifyRes.data.success) {
            setPaymentSuccess(true);
            setErrorMessage('Payment successful! Registering...');
            completeRegistration();
          } else {
            setErrorMessage('Payment verification failed.');
          }
          setPaymentLoading(false);
        },
        prefill: {
          name: formData.username,
          email: formData.email,
          contact: formData.contact
        },
        theme: { color: '#3399cc' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setErrorMessage('Failed to initiate payment.');
      setPaymentLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setErrorMessage('⚠️ Passwords do not match');
      return;
    }
    if (!otpSent) {
      setErrorMessage('⚠️ Please send OTP to your phone.');
      return;
    }
    verifyOTPOnly();
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-4 max-w-md w-full rounded-lg shadow-lg relative z-10 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => setModalType(null)}
          className="absolute top-2 left-3 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-black text-xl font-semibold text-center mb-2">Register</h2>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="mb-2">
            <input
              type="text"
              name="username"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>
        
          <div className="mb-2">
            <input
              type="text"
              name="shopName"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              placeholder="Enter shop name"
              value={formData.shopName}
              onChange={handleInputChange}
              required
            />
          </div>
         
          <div className="mb-2">
            <select
              name="shopType"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              value={formData.shopType}
              onChange={handleShopTypeChange}
              required
            >
              <option value="">Select Shop Type</option>
              <option value="Grocery">Grocery</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {showOtherShopType && (
            <div className="mb-2">
              <input
                type="text"
                name="shopType"
                className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
                placeholder="Enter your shop type"
                value={formData.shopType}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
      
          <div className="mb-2">
            <input
              type="email"
              name="email"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
        
          <div className="mb-2">
            <div className="flex">
              <input
                type={passwordVisible ? 'text' : 'password'}
                name="password"
                className="w-full px-3 py-1.5 border rounded-l-full text-base focus:ring focus:ring-blue-500"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="px-3 py-1.5 bg-gray-200 border-l rounded-r-full"
                onClick={togglePasswordVisibility}
              >
                {passwordVisible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="mb-2">
            <input
              type="password"
              name="confirmPassword"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onKeyUp={handleConfirmPasswordKeyUp}
              required
            />
            {!passwordsMatch && (
              <small className="text-red-500">Passwords do not match</small>
            )}
          </div>
       
          <div className="mb-2 flex">
            <span className="px-3 py-1.5 border border-r-0 rounded-l-full text-base bg-gray-200">
              +91
            </span>
            <input
              type="tel"
              name="contactNumber"
              className="w-full px-3 py-1.5 border border-l-0 rounded-r-full text-base focus:ring focus:ring-blue-500"
              placeholder="9860016336"
              value={formData.contactNumber || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <button 
            type="button"
            className="mt-1 px-3 py-1 bg-green-500 text-white rounded"
            onClick={sendOTP}
          >
            Send OTP
          </button>
          {otpSent && (
            <div className="mb-2 flex gap-2">
              <input 
                type="text"
                name="otp"
                className="w-full px-3 py-1 border rounded-full text-base focus:ring focus:ring-blue-500"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <button
                type="button"
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded"
                onClick={verifyOTPOnly}
                disabled={otpVerified}
              >
                {otpVerified ? 'Verified' : 'Verify OTP'}
              </button>
            </div>
          )}
      
          <div className="mb-2">
            <input
              type="file"
              name="proofFile"
              accept="application/pdf"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              onChange={handleInputChange}
              required
            />
          </div>
          
          {errorMessage && (
            <div className="text-red-600 bg-red-100 p-3 rounded-md text-center">
              {errorMessage}
            </div>
          )}

         {verifyMessage && !errorMessage && (
           <div className="text-red-600 bg-green-200 p-3 rounded-md text-center">
             {verifyMessage}
           </div>
         )}

        
          <button
            type="button"
            className="w-full py-2 bg-green-600 text-white rounded-full text-base font-semibold focus:ring focus:ring-green-500 mt-2"
            onClick={handleRazorpayPayment}
            disabled={paymentLoading || paymentSuccess || !otpVerified}
          >
            {paymentLoading ? 'Processing Payment...' : paymentSuccess ? 'Payment Successful' : 'Pay Amount'}
          </button>
        </form>

        <div className="text-center mt-2">
          <p className="text-black text-sm">
            Already have an account?{' '}
            <button
              className="text-blue-500 underline"
              onClick={() => setModalType('login')}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
