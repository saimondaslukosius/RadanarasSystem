import React from 'react';

export default function TopClients({ data }) {
  if (!data || data.length === 0) {
    return <div>Nėra duomenų</div>;
  }

  return (
    <div style={{ 
      background: 'white', 
      padding: '20px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        🏆 TOP 5 Klientai (pagal pajamas)
      </h3>
      <div>
        {data.map((client, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            borderBottom: index < data.length - 1 ? '1px solid #eee' : 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#999',
                minWidth: '30px'
              }}>
                {index + 1}.
              </span>
              <span style={{ fontWeight: '500', color: '#333' }}>{client.name}</span>
            </div>
            <span style={{ 
              fontWeight: 'bold', 
              color: '#4CAF50',
              fontSize: '16px'
            }}>
              €{client.revenue.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
