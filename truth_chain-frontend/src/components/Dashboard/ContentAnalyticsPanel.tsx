// src/components/Dashboard/ContentAnalyticsPanel.tsx
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  period: string;
  views: number;
  verifications: number;
  tips: number;
}

interface ContentTypeData {
  name: string;
  value: number;
  color: string;
}

const ContentAnalyticsPanel: React.FC = () => {
  // Mock data for daily stats - in a real app, this would come from an API
  const [dailyStats, _setDailyStats] = useState<AnalyticsData[]>([
    { period: 'Mar 1', views: 245, verifications: 12, tips: 3 },
    { period: 'Mar 2', views: 312, verifications: 18, tips: 5 },
    { period: 'Mar 3', views: 287, verifications: 14, tips: 2 },
    { period: 'Mar 4', views: 356, verifications: 22, tips: 7 },
    { period: 'Mar 5', views: 429, verifications: 28, tips: 10 },
    { period: 'Mar 6', views: 387, verifications: 25, tips: 8 },
    { period: 'Mar 7', views: 498, verifications: 32, tips: 12 },
    { period: 'Mar 8', views: 456, verifications: 29, tips: 9 },
    { period: 'Mar 9', views: 512, verifications: 35, tips: 15 },
    { period: 'Mar 10', views: 487, verifications: 31, tips: 11 },
    { period: 'Mar 11', views: 523, verifications: 38, tips: 14 },
    { period: 'Mar 12', views: 576, verifications: 42, tips: 18 },
    { period: 'Mar 13', views: 543, verifications: 39, tips: 16 },
    { period: 'Mar 14', views: 598, verifications: 45, tips: 21 }
  ]);

  // Mock data for content types
  const [contentTypeData, _setContentTypeData] = useState<ContentTypeData[]>([
    { name: 'Articles', value: 45, color: '#3B82F6' },
    { name: 'Images', value: 25, color: '#10B981' },
    { name: 'Videos', value: 15, color: '#EF4444' },
    { name: 'Audio', value: 10, color: '#8B5CF6' },
    { name: 'Documents', value: 5, color: '#F59E0B' }
  ]);

  // Mock data for geographic breakdown
  const [geoData, _setGeoData] = useState([
    { name: 'USA', value: 35 },
    { name: 'Europe', value: 25 },
    { name: 'Asia', value: 20 },
    { name: 'Africa', value: 10 },
    { name: 'South America', value: 7 },
    { name: 'Australia', value: 3 }
  ]);

  const [timeFrame, setTimeFrame] = useState<string>('14d');
  const [metricToShow, setMetricToShow] = useState<string>('views');

  // Calculate total metrics
  const totalViews = dailyStats.reduce((sum, day) => sum + day.views, 0);
  const totalVerifications = dailyStats.reduce((sum, day) => sum + day.verifications, 0);
  const totalTips = dailyStats.reduce((sum, day) => sum + day.tips, 0);
  const totalAmount = totalTips * 7.5; // Assuming average tip of 7.5 STX
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-white mb-2 md:mb-0">Content Analytics</h2>
        
        <div className="flex space-x-2">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button className="px-3 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-800 bg-opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-400 text-sm font-medium">Total Views</h3>
              <div className="flex items-baseline">
                <p className="text-white text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-blue-300 text-sm ml-2">
                  +12.5%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-800 bg-opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-400 text-sm font-medium">Verifications</h3>
              <div className="flex items-baseline">
                <p className="text-white text-2xl font-bold">{totalVerifications.toLocaleString()}</p>
                <p className="text-green-300 text-sm ml-2">
                  +8.7%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-800 bg-opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-400 text-sm font-medium">Tips Received</h3>
              <div className="flex items-baseline">
                <p className="text-white text-2xl font-bold">{totalTips.toLocaleString()}</p>
                <p className="text-purple-300 text-sm ml-2">
                  +15.2%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-lg p-4 shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-teal-800 bg-opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-400 text-sm font-medium">Amount Received</h3>
              <div className="flex items-baseline">
                <p className="text-white text-2xl font-bold">{totalAmount.toFixed(2)} STX</p>
                <p className="text-teal-300 text-sm ml-2">
                  +18.4%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric selector buttons */}
      <div className="bg-gray-800 rounded-lg p-4 flex space-x-2 overflow-x-auto">
        <button
          onClick={() => setMetricToShow('views')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            metricToShow === 'views' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Views
        </button>
        <button
          onClick={() => setMetricToShow('verifications')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            metricToShow === 'verifications' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Verifications
        </button>
        <button
          onClick={() => setMetricToShow('tips')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            metricToShow === 'tips' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Tips
        </button>
        <button
          onClick={() => setMetricToShow('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            metricToShow === 'all' ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          All Metrics
        </button>
      </div>

      {/* Main chart */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-6">Performance Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyStats}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem' }} 
                itemStyle={{ color: '#F3F4F6' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              {(metricToShow === 'views' || metricToShow === 'all') && (
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Views"
                />
              )}
              {(metricToShow === 'verifications' || metricToShow === 'all') && (
                <Line
                  type="monotone"
                  dataKey="verifications"
                  stroke="#10B981"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Verifications"
                />
              )}
              {(metricToShow === 'tips' || metricToShow === 'all') && (
                <Line
                  type="monotone"
                  dataKey="tips"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Tips"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Type Distribution */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-6">Content Type Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem' }} 
                  itemStyle={{ color: '#F3F4F6' }}
                  formatter={(value, name, _props) => [`${value}%`, name]}
                />
                <Legend 
                  formatter={(value, _entry, _index) => (
                    <span style={{ color: '#F3F4F6' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-6">Geographic Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={geoData}
                layout="vertical"
                margin={{ top: 5, right: 5, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem' }} 
                  itemStyle={{ color: '#F3F4F6' }}
                  formatter={(value, _name, _props) => [`${value}%`, 'Audience']}
                />
                <Bar dataKey="value" fill="#3B82F6" name="Audience %">
                  {geoData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 30}, 80%, 50%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Most Popular Content */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4">Most Popular Content</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700 bg-opacity-40">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Content
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Views
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Verifications
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tips
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">Climate Change Analysis: 2024 Projections</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900 text-blue-200">
                    Article
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  2,854
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  198
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  45
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">Exclusive Interview with Tech Innovator</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900 text-red-200">
                    Video
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  1,758
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  156
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  32
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">Historic Election Photo Series</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900 text-green-200">
                    Image
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  1,453
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  132
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  28
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">Financial Markets Report Q1 2025</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900 text-yellow-200">
                    Document
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  1,287
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  87
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  19
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">Podcast: Future of Blockchain Technology</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-900 text-purple-200">
                    Audio
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  976
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  62
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  15
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalyticsPanel;