import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function OrderStatusChart({ data }) {
  if (!data) {
    return <div>Nėra duomenų</div>;
  }

  const chartData = [
    { name: 'Aktyvūs', value: data.active, color: '#4CAF50' },
    { name: 'Baigti', value: data.completed, color: '#2196F3' },
    { name: 'Laukiama', value: data.pending, color: '#FF9800' },
    { name: 'Juodraščiai', value: data.draft, color: '#9E9E9E' },
  ].filter(item => item.value > 0);

  return (
    <div style={{ 
      background: 'white', 
      padding: '20px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        📦 Užsakymų pasiskirstymas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap' }}>
        {chartData.map((item, index) => (
          <div key={index} style={{ textAlign: 'center', margin: '10px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.color }}>
              {item.value}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {item.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
