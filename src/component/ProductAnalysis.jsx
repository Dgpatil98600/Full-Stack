import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';


const ranges = [
  { label: 'Last 1 Month', value: '1m' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last 1 Year', value: '1y' },
  { label: 'Last 3 Years', value: '3y' },
  { label: 'Last 4 Years', value: '4y' },
  { label: 'Last 5 Years', value: '5y' },
  { label: 'All Time', value: 'all' },
  { label: 'Custom Date Range', value: 'custom' },
];

const ProductAnalysis = () => {
  const [range, setRange] = useState('1m');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ totalProfit: 0, topProducts: [] });
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [profitCategory, setProfitCategory] = useState('all');
  const [salesCategory, setSalesCategory] = useState('all');

  useEffect(() => {
    axiosInstance.get('/api/product-analysis/categories')
      .then(res => {
        setCategories(res.data);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    let url = '';
    if (range === 'custom' && fromDate && toDate) {
      url = `/api/product-analysis?fromDate=${fromDate}&toDate=${toDate}`;
      console.log('Requesting /api/product-analysis?fromDate=' + fromDate + '&toDate=' + toDate);
    } else {
      url = `/api/product-analysis?range=${range}`;
      console.log('Requesting /api/product-analysis?range=' + range);
    }
    axiosInstance.get(url)
      .then(res => {
        console.log('Product analysis response:', res.data);
        setData(res.data)
      })
      .catch(err => {
        console.error('Product analysis error:', err);
        setError(err.response?.data?.message || 'Error fetching data')
      })
      .finally(() => setLoading(false));
  }, [range, fromDate, toDate]);

  const filteredByProfitCategory = profitCategory === 'all' 
    ? data.topProducts 
    : data.topProducts.filter(p => p.category === profitCategory);

  const filteredBySalesCategory = salesCategory === 'all'
    ? data.topProducts
    : data.topProducts.filter(p => p.category === salesCategory);

  const sortedByProfit = Array.isArray(filteredByProfitCategory) 
    ? [...filteredByProfitCategory].sort((a, b) => (b.totalProfit || 0) - (a.totalProfit || 0)) 
    : [];
  
  const sortedBySales = Array.isArray(filteredBySalesCategory)
    ? [...filteredBySalesCategory].sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 py-10">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-purple-100">
        <h1 className="text-3xl font-extrabold mb-1 text-purple-700 tracking-tight flex items-center gap-2">
          <span className="inline-block"><svg xmlns='http://www.w3.org/2000/svg' className='inline w-8 h-8 text-purple-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7m0 0H7m5 0h5' /></svg></span>
          Your Top Products Analysis
        </h1>
        <p className="mb-6 text-gray-500 text-lg">View profit and sales insights of products</p>
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <span className="font-semibold text-gray-700">Time Range:</span>
          <select value={range} onChange={e => setRange(e.target.value)} className="p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-50 text-purple-800 font-medium transition">
            {ranges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {range === 'custom' && (
            <>
              <label className="ml-4 text-gray-700 font-medium">From: <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-50 text-purple-800 font-medium transition" /></label>
              <label className="ml-2 text-gray-700 font-medium">To: <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-50 text-purple-800 font-medium transition" /></label>
            </>
          )}
        </div>
        {loading ? <div className="text-lg text-purple-600 font-semibold animate-pulse">Loading...</div> : error ? <div className="text-red-500 text-lg font-semibold">{error}</div> : (
          <>
            <div className="mb-8 text-2xl font-bold flex items-center gap-2">
              <span>Total Profit:</span>
              <span className="text-green-600 text-3xl font-extrabold drop-shadow-lg">₹{Number(data.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex flex-colflex-wrap lg:flex-nowrap gap-8">

              <div className="w-full lg:w-1/2 bg-gray-50 p-4 rounded-lg shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-purple-800">Top Products by Profit</h3>
                  <select 
                    value={profitCategory} 
                    onChange={e => setProfitCategory(e.target.value)}
                    className="p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-50 text-purple-800 font-medium transition"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedByProfit} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="displayName" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                    <Legend />
                    <Bar dataKey="totalProfit" fill="#8884d8" name="Profit (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full lg:w-1/2 bg-gray-50 p-4 rounded-lg shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-purple-800">Top Products by Sales Count</h3>
                  <select 
                    value={salesCategory} 
                    onChange={e => setSalesCategory(e.target.value)}
                    className="p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-50 text-purple-800 font-medium transition"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedBySales} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="displayName" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="productCount" fill="#82ca9d" name="Sales Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductAnalysis; 