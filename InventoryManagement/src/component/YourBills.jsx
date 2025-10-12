import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const YourBills = () => {
    const [bills, setBills] = useState([]);
    const [filter, setFilter] = useState('all');
    const [totalAmount, setTotalAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

    const filterOptions = [
        { value: 'today', label: "Today's Bills" },
        { value: 'week', label: 'Weekly Bills' },
        { value: 'month', label: "Last Month's Bills" },
        { value: 'year', label: 'Yearly Bills' },
        { value: 'all', label: 'All Bills' }
    ];

    useEffect(() => {
        fetchBills();
    }, [filter]);

    const fetchBills = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('No token found, redirecting to login');
                navigate('/login');
                return;
            }

            console.log('Fetching bills with filter:', filter);
            const response = await axios.get(`/api/bill/list?filter=${filter}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 5000,
                retry: 3, 
                retryDelay: 1000
            });
            
            console.log('Bills response:', response.data);
            
            if (!Array.isArray(response.data)) {
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid response format from server');
            }

            const billsData = response.data;
            console.log('Processed bills data:', billsData);
            
            setBills(billsData);
            calculateTotalAmount(billsData);

            if (billsData.length === 0) {
                console.log('No bills found, creating test bill...');
                try {
                    const testResponse = await axios.post(`/api/bill/test-create`, {}, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        },
                        timeout: 5000,
                        retry: 3,
                        retryDelay: 1000
                    });
                    console.log('Test bill created:', testResponse.data);
                    fetchBills();
                } catch (testError) {
                    console.error('Error creating test bill:', testError);
                }
            }
        } catch (error) {
            console.error('Error fetching bills:', error.response || error);
            if (error.code === 'ECONNABORTED') {
                setError('Request timed out. Please check your connection and try again.');
            } else if (error.code === 'ERR_NETWORK') {
                setError('Network error. Please check if the server is running.');
            } else {
                setError(error.response?.data?.message || 'Failed to fetch bills. Please try again later.');
            }
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalAmount = (billsData) => {
        const total = billsData.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
        console.log('Calculated total amount:', total);
        setTotalAmount(total);
    };

    const getFilterHeading = () => {
        const selectedFilter = filterOptions.find(option => option.value === filter);
        return selectedFilter ? selectedFilter.label : 'All Bills';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading bills...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button 
                        onClick={fetchBills}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-800 text-center flex-grow">
                        {getFilterHeading()}
                    </h1>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mb-8">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full md:w-64 p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {filterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bills && bills.length > 0 ? (
                    bills.map((bill) => (
                        <div
                            key={bill._id}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-4"
                        >
        
                            <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-200">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {bill.billNumber}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(bill.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                    ₹{bill.grandTotal?.toFixed(2) || '0.00'}
                                </span>
                            </div>

                            <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700">
                                    Customer: <span className="text-gray-600">{bill.customerName}</span>
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                    Items: <span className="text-gray-600">{bill.netQuantity || 0}</span>
                                </p>
                            </div>

                            <div className="mt-3 pt-2 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Items:</h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {bill.items && bill.items.map((item, index) => (
                                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                                            <span>{item.productName}</span>
                                            <span className="text-gray-700">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center mt-8">
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <svg 
                                className="w-16 h-16 text-gray-400 mx-auto mb-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                />
                            </svg>
                            <p className="text-gray-500 text-lg">No bills found for the selected period.</p>
                            <p className="text-gray-400 text-sm mt-2">Try selecting a different time period or create a new bill.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YourBills; 