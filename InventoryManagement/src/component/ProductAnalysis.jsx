import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Custom colors (Recharts does not provide COLORS)
const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1",
  "#a4de6c", "#d0ed57", "#d62728", "#2ca02c", "#1f77b4"
];

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
  const [p, setP] = useState(0);

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

  const top10Profit = sortedByProfit.slice(0, 10);
  const top10Sales  = sortedBySales.slice(0, 10);
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      {/* Decorative background elements */}
      <Link to="/dashboard" className="text-blue-500 hover:underline">
          <button className="bg-gray-600 text-white px-2 py-1 mb-3 rounded-lg hover:bg-gray-300">← Back to Dashboard</button>
      </Link>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-purple-500/30 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 text-white tracking-tight flex items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl backdrop-blur-sm">
                    <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 sm:w-7 sm:h-7 text-purple-200' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7m0 0H7m5 0h5' /></svg>
                  </span>
                  Your Top Products Analysis
                </h1>
                <p className="text-purple-100 text-sm sm:text-base lg:text-lg">View profit and sales insights of products</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/20">
                <p className="text-xs sm:text-sm text-purple-200 font-medium mb-1">Total Profit</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-green-400 drop-shadow-lg">₹{data.totalProfit?.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selection */}
        <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
            <span className="font-semibold text-white text-sm sm:text-base">⏱️ Time Range:</span>
            <select 
              value={range} 
              onChange={e => setRange(e.target.value)} 
              className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-sm sm:text-base"
            >
              {ranges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {range === 'custom' && (
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3 sm:gap-2">
                <label className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
                  📅 From: 
                  <input 
                    type="date" 
                    value={fromDate} 
                    onChange={e => setFromDate(e.target.value)} 
                    className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-xs sm:text-sm" 
                  />
                </label>
                <label className="flex items-center gap-2 text-white font-medium text-sm sm:text-base">
                  📅 To: 
                  <input 
                    type="date" 
                    value={toDate} 
                    onChange={e => setToDate(e.target.value)} 
                    className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-xs sm:text-sm" 
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Loading & Error States */}
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-400 border-t-white mx-auto mb-4"></div>
              <p className="text-white text-lg sm:text-xl font-semibold">Loading your analytics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 sm:p-6 text-red-200 text-sm sm:text-base">
            <p className="font-semibold">⚠️ Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Bar Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Profit Chart */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 hover:border-purple-400/50 hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">📊 Top Products by Profit</h3>
                    <p className="text-xs sm:text-sm text-purple-200 mt-1">Based on total profit generated</p>
                  </div>
                  <select 
                    value={profitCategory} 
                    onChange={e => setProfitCategory(e.target.value)}
                    className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sortedByProfit} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(214, 230, 214, 0.1)" />
                      <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                      <YAxis dataKey="displayName" type="category" width={60} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }} />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: '8px', color: '#fff' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: 'rgba(255,255,255,0.7)' }} />
                      <Bar dataKey="totalProfit" fill="#8884d8" name="Profit (₹)" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales Count Chart */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 hover:border-green-400/50 hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">📈 Top Products by Sales Count</h3>
                    <p className="text-xs sm:text-sm text-purple-200 mt-1">Based on number of sales transactions</p>
                  </div>
                  <select 
                    value={salesCategory} 
                    onChange={e => setSalesCategory(e.target.value)}
                    className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/20 rounded-xl p-3 sm:p-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={sortedBySales} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(22, 21, 20, 0.1)" />
                      <XAxis type="number" stroke="rgba(255, 255, 255, 1)" />
                      <YAxis dataKey="displayName" type="category" width={60} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(18, 16, 16, 0.8)', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: '8px', color: '#fff' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: 'rgba(255,255,255,0.7)' }} />
                      <Bar dataKey="productCount" fill="#82ca9d" name="Sales Count" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pie Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Profit Distribution Pie */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 hover:border-purple-400/50 hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">🥧 Profit Distribution</h3>
                    <p className="text-xs sm:text-sm text-purple-200 mt-1">Top 10 products profit breakdown</p>
                  </div>
                  <select 
                    value={profitCategory} 
                    onChange={e => setProfitCategory(e.target.value)}
                    className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/20 rounded-xl p-3 sm:p-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(168, 85, 247, 0.5)', borderRadius: '8px', color: '#fff' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: 'rgba(255, 255, 255, 0.7)' }} />
                      <Pie
                        data={top10Profit}
                        dataKey="totalProfit"
                        nameKey="displayName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        minAngle={20}
                        paddingAngle={3}
                        isAnimationActive={true}
                        animationDuration={1200}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {top10Profit.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sales Distribution Pie */}
              <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 shadow-xl border border-white/20 hover:border-green-400/50 hover:bg-white/15 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">🥧 Sales Distribution</h3>
                    <p className="text-xs sm:text-sm text-purple-200 mt-1">Top 10 products sales breakdown</p>
                  </div>
                  <select 
                    value={salesCategory} 
                    onChange={e => setSalesCategory(e.target.value)}
                    className="px-3 sm:px-4 py-2 border-2 border-purple-400/50 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-purple-500/30 text-white font-medium transition hover:bg-purple-500/40 cursor-pointer text-xs sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-black/20 rounded-xl p-3 sm:p-4 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(32, 31, 31, 0.8)', border: '1px solid rgba(243, 236, 236, 0.5)', borderRadius: '8px', color: '#f9f1f1ff' }} />
                      <Legend wrapperStyle={{ paddingTop: '10px', color: 'rgba(255,255,255,0.7)' }} />
                      <Pie
                        data={top10Sales}
                        dataKey="productCount"
                        nameKey="displayName"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        minAngle={5}
                        paddingAngle={3}
                        isAnimationActive={true}
                        animationDuration={1200}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                      >
                        {top10Sales.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductAnalysis;