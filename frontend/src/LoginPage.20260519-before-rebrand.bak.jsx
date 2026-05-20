import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error || 'Prisijungti nepavyko');
      }
    } catch {
      setError('Serverio klaida. Patikrinkite ryšį su backend (port 3001).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily:      'Arial, sans-serif'
    }}>
      <div style={{
        background:   'white',
        borderRadius: '16px',
        padding:      '44px 40px',
        width:        '100%',
        maxWidth:     '400px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.20)'
      }}>
        {/* Antraštė */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e3a8a', letterSpacing: '-0.5px' }}>
            Radanaras MB
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Logistikos valdymo sistema
          </div>
        </div>

        {/* Forma */}
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              El. paštas
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
              placeholder="vardas@radanaras.com"
              style={{
                width:        '100%',
                padding:      '10px 14px',
                border:       '1.5px solid #d1d5db',
                borderRadius: '8px',
                fontSize:     '14px',
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.15s'
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={e  => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Slaptažodis
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width:        '100%',
                padding:      '10px 14px',
                border:       '1.5px solid #d1d5db',
                borderRadius: '8px',
                fontSize:     '14px',
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.15s'
              }}
              onFocus={e => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={e  => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {error && (
            <div style={{
              background:   '#fee2e2',
              color:        '#991b1b',
              border:       '1px solid #fecaca',
              padding:      '10px 14px',
              borderRadius: '8px',
              fontSize:     '13px',
              marginBottom: '18px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width:        '100%',
              padding:      '12px',
              background:   loading ? '#93c5fd' : 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
              color:        'white',
              border:       'none',
              borderRadius: '8px',
              fontSize:     '15px',
              fontWeight:   '700',
              cursor:       loading ? 'not-allowed' : 'pointer',
              transition:   'opacity 0.15s'
            }}
          >
            {loading ? 'Jungiamasi...' : 'Prisijungti'}
          </button>

        </form>

        {/* Footer */}
        <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          Radanaras MB &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
