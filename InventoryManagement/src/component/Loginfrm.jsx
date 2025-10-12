import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

const Login = ({ setModalType }) => {
const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    console.log('Form data before request:', formData);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/login`,
        JSON.stringify(formData),
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('Login response received:', response.data);
      if (response.status === 200 && response.data.token) {
        login(response.data.user, response.data.token);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.log('Backend response:', error.response.data);
        const errMsg = error.response.data.error || 'Invalid request. Check your inputs.';
        setErrorMessage(`⚠️ ${errMsg}`);
      } else {
        setErrorMessage('⚠️ Failed to connect to the server. Check your internet.');
      }
    }
  };
  
  const handleGoogleLogin = () => {
    console.log('Logging in with Google');
    navigate('/dashboard');
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-4 max-w-md w-full rounded-lg shadow-lg relative z-10">
        <button 
          onClick={() => setModalType(null)} 
          className="absolute top-2 left-3 text-3xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-center mb-4 text-xl font-bold">
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="w-full px-3 py-1.5 border rounded-full text-base focus:ring focus:ring-blue-500"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
      
          {errorMessage && (
            <div className="text-red-600 bg-red-100 p-3 rounded-md text-center">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-full text-base font-semibold mb-3 hover:bg-blue-600"
          >
            Login
          </button>

          <button
            type="button"
            className="w-full py-2 border border-red-500 text-red-500 rounded-full text-base font-semibold mb-3 hover:bg-red-50"
            onClick={handleGoogleLogin}
          >
            <i className="bi bi-google me-2"></i>
            Login with Google
          </button>
        </form>

        <div className="text-center mt-3">
          <p className="text-sm">
            Don't have an account?{' '}
            <button 
              className="text-blue-500 underline hover:text-blue-600"
              onClick={() => setModalType('register')}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
