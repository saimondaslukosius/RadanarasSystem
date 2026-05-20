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
  const initials = (adminUser.name || adminUser.email || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Arial, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        background:     'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        padding:        '0 32px',
        height:         '64px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        boxShadow:      '0 2px 16px rgba(15,23,42,0.4)',
        borderBottom:   '1px solid rgba(255,255,255,0.07)',
        position:       'sticky',
        top:            0,
        zIndex:         100,
      }}>

        {/* ── Left: brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {/* Logo box */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
            background: 'rgba(255,255,255,0.13)', border: '1px solid rgba(255,255,255,0.22)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '900', letterSpacing: '0.5px' }}>TF</span>
          </div>

          {/* Vertical divider */}
          <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.15)', margin: '0 18px' }} />

          {/* Title block */}
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
              TransFlow Admin Console
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '2px', letterSpacing: '0.1px' }}>
              Platform administration
            </div>
          </div>

          {/* Restricted badge */}
          <div style={{
            marginLeft: '16px',
            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '999px', padding: '3px 11px',
            fontSize: '10px', fontWeight: 700, color: '#fca5a5', letterSpacing: '0.6px',
          }}>
            PLATFORM ADMIN
          </div>
        </div>

        {/* ── Right: user + actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Avatar */}
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            border: '2px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: 'white', letterSpacing: '0.3px',
          }}>
            {initials}
          </div>

          {/* Name + email */}
          <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>
              {adminUser.name || adminUser.email}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px' }}>
              {adminUser.email}
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              padding:      '7px 15px',
              background:   'rgba(255,255,255,0.1)',
              color:        'rgba(255,255,255,0.88)',
              border:       '1px solid rgba(255,255,255,0.18)',
              borderRadius: '8px',
              fontSize:     '13px',
              fontWeight:   '600',
              cursor:       'pointer',
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          >
            Atsijungti
          </button>

          {/* Back to company app */}
          <button
            onClick={() => { window.location.hash = ''; window.location.reload(); }}
            title="Grįžti į įmonės app"
            style={{
              padding:      '7px 14px',
              background:   'transparent',
              color:        'rgba(255,255,255,0.45)',
              border:       '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize:     '12px',
              fontWeight:   '500',
              cursor:       'pointer',
              transition:   'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
            }}
          >
            ← Company app
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ width: '100%', padding: '28px 32px', boxSizing: 'border-box' }}>
        <div style={{
          background:   'white',
          borderRadius: '16px',
          padding:      '28px 32px',
          boxShadow:    '0 4px 16px rgba(0,0,0,0.07)',
          border:       '1px solid #e2e8f0',
          minWidth:     0,
        }}>
          <AdminConsole />
        </div>
      </div>
    </div>
  );
}
