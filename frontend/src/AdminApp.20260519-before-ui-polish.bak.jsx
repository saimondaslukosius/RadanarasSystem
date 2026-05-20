/**
 * TransFlow Admin App Shell
 * Sudėtinis komponentas platform adminui.
 * Rodomas tik kai URL hash prasideda nuo #/admin.
 *
 * Auth flow:
 *   1. Tikrina rauth_token → /api/auth/me
 *   2. Jei isPlatformAdmin → rodo AdminConsole
 *   3. Jei ne → rodo AdminLoginPage
 *
 * Naudoja tą patį rauth_token ir JWT kaip įmonės app,
 * bet UI yra visiškai atskirtas.
 */

import React, { useEffect, useState } from 'react';
import AdminLoginPage from './AdminLoginPage.jsx';
import AdminConsole   from './AdminConsole.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export default function AdminApp() {
  const [adminUser,    setAdminUser]    = useState(null);
  const [authLoading,  setAuthLoading]  = useState(true);

  // ── On mount: check if there's a valid platform-admin token ─────────────────
  useEffect(() => {
    const token = localStorage.getItem('rauth_token');
    if (!token) { setAuthLoading(false); return; }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.user?.isPlatformAdmin === true) {
          setAdminUser(data.user);
        }
        // If token exists but user is NOT platform admin: stay on login
      })
      .catch(() => {
        // Invalid/expired token — clear it
        localStorage.removeItem('rauth_token');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem('rauth_token', token);
    setAdminUser(user);
  };

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('rauth_token')}` } }); } catch {}
    localStorage.removeItem('rauth_token');
    setAdminUser(null);
  };

  // ── Loading splash ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Kraunama...</div>
      </div>
    );
  }

  // ── Not authenticated → show admin login ─────────────────────────────────────
  if (!adminUser) {
    return <AdminLoginPage onLogin={handleLogin} />;
  }

  // ── Authenticated platform admin → show Admin Console ───────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Arial, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background:   'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        padding:      '0 28px',
        height:       '60px',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        boxShadow:    '0 2px 12px rgba(15,23,42,0.35)'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '900' }}>TF</span>
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', letterSpacing: '-0.3px' }}>
              TransFlow Admin Console
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginTop: '1px' }}>
              Platform administration
            </div>
          </div>
          <div style={{
            background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '999px', padding: '2px 10px',
            fontSize: '10px', fontWeight: 700, color: '#fca5a5', letterSpacing: '0.5px'
          }}>
            PLATFORM ADMIN
          </div>
        </div>

        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{adminUser.name || adminUser.email}</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginTop: '1px' }}>{adminUser.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding:      '7px 16px',
              background:   'rgba(255,255,255,0.1)',
              color:        'rgba(255,255,255,0.85)',
              border:       '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              fontSize:     '13px',
              fontWeight:   '600',
              cursor:       'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            Atsijungti
          </button>
          <button
            onClick={() => { window.location.hash = ''; window.location.reload(); }}
            style={{
              padding:      '7px 16px',
              background:   'transparent',
              color:        'rgba(255,255,255,0.55)',
              border:       '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              fontSize:     '12px',
              cursor:       'pointer'
            }}
            title="Grįžti į įmonės app"
          >
            ← Company app
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px' }}>
        <div style={{
          background:   'white',
          borderRadius: '14px',
          padding:      '28px',
          boxShadow:    '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <AdminConsole />
        </div>
      </div>
    </div>
  );
}
