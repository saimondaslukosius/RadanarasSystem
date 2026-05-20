/**
 * TransFlow Admin Login
 * Atskiras login screen platformos adminui.
 * Pasiekiamas per: http://localhost:5173/#/admin
 * Leidžia prisijungti tik vartotojams su isPlatformAdmin === true.
 */

import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function AdminLoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_BASE}/api/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || 'Prisijungti nepavyko');
        return;
      }

      // Platform admin tik
      if (data.user?.isPlatformAdmin !== true) {
        setError('Prieiga leidžiama tik platformos administratoriams.');
        return;
      }

      onLogin(data.user, data.token);
    } catch {
      setError('Serverio klaida. Patikrinkite ryšį su backend (port 3001).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      fontFamily:     'Arial, sans-serif'
    }}>
      <div style={{
        background:   'white',
        borderRadius: '16px',
        padding:      '44px 40px',
        width:        '100%',
        maxWidth:     '400px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.35)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            marginBottom: '14px', boxShadow: '0 4px 14px rgba(15,23,42,0.45)'
          }}>
            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>TF</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
            TransFlow administravimas
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            Platformos administravimo konsolė
          </div>
          <div style={{
            display: 'inline-block', marginTop: '10px',
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '999px', padding: '3px 12px',
            fontSize: '11px', fontWeight: 700, color: '#991b1b', letterSpacing: '0.5px'
          }}>
            RIBOTA PRIEIGA
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              El. paštas
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus autoComplete="email"
              placeholder="admin@example.com"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#1e3a8a'; }}
              onBlur={e  => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Slaptažodis
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#1e3a8a'; }}
              onBlur={e  => { e.target.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#64748b' : 'linear-gradient(135deg, #0f172a, #1e3a8a)',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Jungiamasi…' : '🔐 Prisijungti'}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          Įmonės sistema:{' '}
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }} onClick={e => { e.preventDefault(); window.location.hash = ''; window.location.reload(); }}>
            transflow.app
          </a>
        </div>
      </div>
    </div>
  );
}
