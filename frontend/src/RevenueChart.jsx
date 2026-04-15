import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function RevenueChart({ monthlyData }) {
  // Mock data for now - will be replaced with real data later
  const data = monthlyData || [
    { month: 'Spa', revenue: 1800 },
    { month: 'Lap', revenue: 2100 },
    { month: 'Kov', revenue: 1950 },
    { month: 'Bal', revenue: 2300 },
    { month: 'Geg', revenue: 2150 },
    { month: 'Bir', revenue: 2400 },
  ];

  return (
    <div style={{ 
      background: 'white', 
      padding: '20px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        📈 Pajamų grafikas (paskutiniai 6 mėnesiai)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`€${value.toFixed(2)}`, 'Pajamos']}
            contentStyle={{ background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#4CAF50" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
