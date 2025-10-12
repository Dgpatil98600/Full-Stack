import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import axiosInstance from '../utils/axios';

const ShopAnalysis = () => {
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      options.push({ value, label });
    }
    return options;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Clear existing data before fetching to trigger re-render
        setData(null);
        
        const response = await axiosInstance.get(`/api/shop-analysis?month=${selectedMonth}`);
        console.log('Shop analysis response:', response.data);
        
        // Ensure all numeric values are properly parsed
        const parsedData = {
          ...response.data,
          profit: Number(response.data.profit) || 0,
          remaining_stock: Number(response.data.remaining_stock) || 0,
          turnOver: Number(response.data.turnOver) || 0,
          final_gain: Number(response.data.final_gain) || 0,
          dailyStats: (response.data.dailyStats || []).map(day => ({
            ...day,
            sales: Number(day.sales) || 0,
            profit: Number(day.profit) || 0
          }))
        };
        
        console.log('Parsed data:', parsedData);
        setData(parsedData);
      } catch (error) {
        console.error('Shop analysis error:', error);
      }
    };
    
    // Set up an interval to fetch data every 30 seconds
    fetchData();
    const interval = setInterval(fetchData, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [selectedMonth]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-3xl font-bold text-gray-800">Shop Analysis</h1>


        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric Cards */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg p-6 border border-green-200"
            >
              <h3 className="text-green-800 text-sm font-medium mb-1">Total Profit</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(data.profit)}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200"
            >
              <h3 className="text-blue-800 text-sm font-medium mb-1">Stock Value</h3>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.remaining_stock)}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-lg p-6 border border-purple-200"
            >
              <h3 className="text-purple-800 text-sm font-medium mb-1">Current Turnover</h3>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.turnOver)}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg p-6 border border-amber-200"
            >
              <h3 className="text-amber-800 text-sm font-medium mb-1">Potential Gain</h3>
              <p className="text-xs font-bold text-amber-600">When you Sold all current products(stock)</p>
              <p className="text-3xl font-bold text-amber-600">{formatCurrency(data.final_gain + data.profit)}</p>
            </motion.div>
          </div>
        )}


            {/* Month Selector */}
        <div className="flex items-center space-x-4">
          <label htmlFor="month" className="text-gray-600 font-medium">Select Month:</label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {generateMonthOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Chart Section */}
        {data && data.dailyStats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-6 mt-6"
          >
            <h2 className="text-xl font-semibold mb-4">Daily Sales & Profit</h2>
            {data.dailyStats.some(day => day.sales > 0 || day.profit > 0) ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) => new Date(date).getDate()}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      label={{ 
                        position: 'top',
                        fontSize: 10,
                        formatter: (value) => formatCurrency(value)
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      label={{ 
                        position: 'bottom',
                        fontSize: 10,
                        formatter: (value) => formatCurrency(value)
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                No sales recorded for this month
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ShopAnalysis;
