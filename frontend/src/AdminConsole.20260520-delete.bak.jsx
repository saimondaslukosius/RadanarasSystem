/**
 * TransFlow — Admin Console
 * Platform owner dashboard: Overview, Companies, Subscriptions, Payments, Reminders.
 * Rendered inside AdminApp.jsx shell (which provides the top nav bar).
 * All data fetched live from /api/platform/* endpoints.
 */

import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────
const COLOR = {
  blue:        "#1e3a8a",
  blueMid:     "#3b82f6",
  blueLight:   "#eff6ff",
  blueBorder:  "#bfdbfe",
  green:       "#166534",
  greenLight:  "#f0fdf4",
  greenBorder: "#bbf7d0",
  amber:       "#854d0e",
  amberLight:  "#fefce8",
  amberBorder: "#fef08a",
  red:         "#991b1b",
  redLight:    "#fef2f2",
  redBorder:   "#fecaca",
  slate:       "#475569",
  slateLight:  "#f8fafc",
  slateBorder: "#e2e8f0",
  text:        "#0f172a",
  muted:       "#64748b",
  faint:       "#94a3b8",
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_META = {
  active:    { label: "Active",    bg: COLOR.greenLight,  color: COLOR.green,  border: COLOR.greenBorder },
  trial:     { label: "Trial",     bg: COLOR.amberLight,  color: COLOR.amber,  border: COLOR.amberBorder },
  suspended: { label: "Suspended", bg: COLOR.redLight,    color: COLOR.red,    border: COLOR.redBorder   },
  paid:      { label: "Paid",      bg: COLOR.greenLight,  color: COLOR.green,  border: COLOR.greenBorder },
  pending:   { label: "Pending",   bg: COLOR.amberLight,  color: COLOR.amber,  border: COLOR.amberBorder },
  overdue:   { label: "Overdue",   bg: COLOR.redLight,    color: COLOR.red,    border: COLOR.redBorder   },
  scheduled: { label: "Scheduled", bg: COLOR.slateLight,  color: COLOR.slate,  border: COLOR.slateBorder },
};

function Badge({ status, text }) {
  const m = STATUS_META[status] || { label: status || "—", bg: COLOR.slateLight, color: COLOR.slate, border: COLOR.slateBorder };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      whiteSpace: "nowrap"
    }}>
      {text || m.label}
    </span>
  );
}

function Dot({ color }) {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />;
}

function Spinner() {
  return (
    <div style={{ padding: "56px", textAlign: "center", color: COLOR.muted }}>
      <div style={{ fontSize: "13px", fontWeight: 500 }}>Kraunama…</div>
    </div>
  );
}

function ErrBox({ msg }) {
  return (
    <div style={{ padding: "16px 20px", background: COLOR.redLight, color: COLOR.red, border: `1px solid ${COLOR.redBorder}`, borderRadius: "10px", fontSize: "14px" }}>
      ❌ {msg}
    </div>
  );
}

function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
      <div>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: COLOR.text }}>{title}</h3>
        {sub && <p style={{ margin: "4px 0 0", fontSize: "13px", color: COLOR.muted }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const infoNote = (msg, type = "info") => {
  const map = {
    info:    { bg: "#f0f9ff", border: "#bae6fd", color: "#0369a1" },
    warning: { bg: "#fffbeb", border: "#fcd34d", color: "#92400e" },
    success: { bg: COLOR.greenLight, border: COLOR.greenBorder, color: COLOR.green },
  };
  const s = map[type] || map.info;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: s.color, marginBottom: "20px", lineHeight: 1.6 }}>
      {msg}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Form helpers
// ─────────────────────────────────────────────────────────────────────────────
const inp = {
  padding: "9px 12px", border: `1.5px solid ${COLOR.slateBorder}`, borderRadius: "7px",
  fontSize: "14px", width: "100%", boxSizing: "border-box", outline: "none",
  color: COLOR.text, background: "white", transition: "border-color 0.15s",
};
const lbl    = { fontSize: "13px", fontWeight: 600, color: COLOR.slate, marginBottom: "6px", display: "block" };
const fGroup = { display: "flex", flexDirection: "column" };
const fGrid  = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" };

// ─────────────────────────────────────────────────────────────────────────────
// Button primitives
// ─────────────────────────────────────────────────────────────────────────────
const btnBase = { border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px", transition: "opacity 0.15s, background 0.15s", whiteSpace: "nowrap" };
const btnPrimary   = { ...btnBase, background: `linear-gradient(135deg, ${COLOR.blue}, ${COLOR.blueMid})`, color: "white", padding: "9px 18px", fontSize: "14px", boxShadow: "0 2px 6px rgba(30,58,138,0.25)" };
const btnSuccess   = { ...btnBase, background: "#16a34a", color: "white", padding: "9px 18px", fontSize: "14px" };
const btnGhost     = { ...btnBase, background: COLOR.slateLight, color: COLOR.slate, border: `1px solid ${COLOR.slateBorder}`, padding: "9px 18px", fontSize: "14px" };
const btnSmPrimary = { ...btnPrimary,  padding: "5px 12px", fontSize: "12px", boxShadow: "none" };
const btnSmTeal    = { ...btnBase, background: "#0f766e", color: "white", padding: "5px 12px", fontSize: "12px" };
const btnSmSuccess = { ...btnBase, background: "#16a34a", color: "white", padding: "5px 12px", fontSize: "12px" };
const btnSmGhost   = { ...btnGhost, padding: "5px 12px", fontSize: "12px" };
const btnDanger    = { ...btnBase, background: "#dc2626", color: "white", padding: "9px 18px", fontSize: "14px" };

// ─────────────────────────────────────────────────────────────────────────────
// Table primitives
// ─────────────────────────────────────────────────────────────────────────────
const tblWrap = { overflowX: "auto", borderRadius: "10px", border: `1px solid ${COLOR.slateBorder}` };
const tbl     = { width: "100%", borderCollapse: "collapse" };
const tHead   = { padding: "11px 14px", textAlign: "left", fontWeight: 700, color: COLOR.muted, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.6px", background: "#f8fafc", borderBottom: `1px solid ${COLOR.slateBorder}`, whiteSpace: "nowrap" };
const tCell   = { padding: "13px 14px", borderBottom: `1px solid #f1f5f9`, color: COLOR.text, verticalAlign: "middle", fontSize: "14px" };
const tCellLast = { ...tCell, borderBottom: "none" };

function TRow({ children, last }) {
  return <tr style={{ transition: "background 0.1s" }}>{React.Children.map(children, (child, i) => child)}</tr>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  { value: "admin",      label: "Administratorius" },
  { value: "manager",    label: "Vadybininkas"      },
  { value: "accounting", label: "Buhalterija"       },
  { value: "carrier",    label: "Vežėjas"           },
];

const planLabel = p => ({ basic: "Basic", pro: "Pro", enterprise: "Enterprise", internal: "Internal" }[p] || p || "—");
const fmtEur    = n  => `€${Number(n || 0).toFixed(2)}`;

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible form panel
// ─────────────────────────────────────────────────────────────────────────────
function Panel({ title, accent = COLOR.blue, children, onClose }) {
  return (
    <div style={{
      background: "white", border: `1.5px solid ${accent === COLOR.green ? COLOR.greenBorder : COLOR.blueBorder}`,
      borderRadius: "12px", padding: "24px", marginBottom: "24px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: accent }}>{title}</h4>
        <button onClick={onClose} style={{ ...btnGhost, padding: "4px 10px", fontSize: "13px" }}>✕</button>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Overview
// ─────────────────────────────────────────────────────────────────────────────
// Activity type metadata
const ACTIVITY_META = {
  company_created:   { label: "Sukurta įmonė",       dot: "#3b82f6", bg: "#eff6ff", color: "#1d4ed8"  },
  company_updated:   { label: "Atnaujinta įmonė",    dot: "#94a3b8", bg: "#f8fafc", color: "#475569"  },
  company_suspended: { label: "Sustabdyta įmonė",    dot: "#ef4444", bg: "#fef2f2", color: "#991b1b"  },
  company_activated: { label: "Aktyvuota įmonė",     dot: "#16a34a", bg: "#f0fdf4", color: "#166534"  },
  admin_created:     { label: "Sukurtas admin",       dot: "#7c3aed", bg: "#f5f3ff", color: "#5b21b6"  },
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `prieš ${diff}s`;
  if (diff < 3600) return `prieš ${Math.floor(diff / 60)} min.`;
  if (diff < 86400) return `prieš ${Math.floor(diff / 3600)} val.`;
  return `prieš ${Math.floor(diff / 86400)} d.`;
}

function OverviewTab() {
  const [kpi,      setKpi]      = useState(null);
  const [activity, setActivity] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/platform/overview`).then(r => r.json()),
      fetch(`${API_BASE}/api/platform/activity?limit=10`).then(r => r.json()),
      fetch(`${API_BASE}/api/platform/companies`).then(r => r.json()),
    ]).then(([kpiData, actData, compData]) => {
      if (kpiData.totalCompanies !== undefined) setKpi(kpiData); else setErr(kpiData.error || "Klaida");
      if (Array.isArray(actData))  setActivity(actData);
      if (Array.isArray(compData)) setCompanies(compData);
    }).catch(() => setErr("Serverio klaida"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err)     return <ErrBox msg={err} />;

  // ── Derived data ─────────────────────────────────────────────────────────
  const kpiCards = [
    { label: "Viso įmonių",           value: kpi.totalCompanies,       icon: "🏢", accent: COLOR.blue,  bg: COLOR.blueLight,  border: COLOR.blueBorder  },
    { label: "Aktyvios",              value: kpi.activeCompanies,      icon: "✅", accent: COLOR.green, bg: COLOR.greenLight, border: COLOR.greenBorder },
    { label: "Bandomosios",           value: kpi.trialCompanies,       icon: "🟡", accent: COLOR.amber, bg: COLOR.amberLight, border: COLOR.amberBorder },
    { label: "Sustabdytos",           value: kpi.suspendedCompanies,   icon: "⛔", accent: kpi.suspendedCompanies > 0 ? COLOR.red : COLOR.slate, bg: kpi.suspendedCompanies > 0 ? COLOR.redLight : COLOR.slateLight, border: kpi.suspendedCompanies > 0 ? COLOR.redBorder : COLOR.slateBorder },
    { label: "Aktyvūs vartotojai",    value: kpi.totalActiveUsers,     icon: "👤", accent: COLOR.blue,  bg: COLOR.blueLight,  border: COLOR.blueBorder  },
    { label: "Mėnesinės pajamos",     value: fmtEur(kpi.monthlyRecurringRevenue), icon: "💰", accent: COLOR.green, bg: COLOR.greenLight, border: COLOR.greenBorder },
    { label: "Vėluojantys mokėjimai", value: kpi.overduePaymentsCount, icon: "⚠️", accent: kpi.overduePaymentsCount > 0 ? COLOR.red : COLOR.slate, bg: kpi.overduePaymentsCount > 0 ? COLOR.redLight : COLOR.slateLight, border: kpi.overduePaymentsCount > 0 ? COLOR.redBorder : COLOR.slateBorder },
    { label: "Artėjantys pratęsimai", value: kpi.upcomingRenewalsCount, icon: "🔄", accent: COLOR.amber, bg: COLOR.amberLight, border: COLOR.amberBorder },
  ];

  // Alerts
  const alerts = [];
  if (kpi.suspendedCompanies > 0)  alerts.push({ type: "error",   text: `${kpi.suspendedCompanies} sustabdyta(-os) įmonė(-ės)` });
  if (kpi.overduePaymentsCount > 0) alerts.push({ type: "error",  text: `${kpi.overduePaymentsCount} vėluojantis mokėjimas` });
  if (kpi.upcomingRenewalsCount > 0) alerts.push({ type: "warning", text: `${kpi.upcomingRenewalsCount} pratęsimas artėja per 7 d.` });
  if (kpi.trialCompanies > 0)      alerts.push({ type: "warning", text: `${kpi.trialCompanies} bandomoji paskyra aktyvios` });

  // Recent companies (last 5 by createdAt)
  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const alertColors = {
    error:   { bg: COLOR.redLight,   border: COLOR.redBorder,   dot: "#ef4444", text: COLOR.red   },
    warning: { bg: COLOR.amberLight, border: COLOR.amberBorder, dot: "#f59e0b", text: COLOR.amber },
    info:    { bg: COLOR.blueLight,  border: COLOR.blueBorder,  dot: "#3b82f6", text: COLOR.blue  },
  };

  const systemItems = [
    { label: "API serveris",        status: "ok"           },
    { label: "JWT / Autentikacija", status: "ok"           },
    { label: "Apmokėjimas",         status: "manual"       },
    { label: "El. paštas",          status: "not_connected"},
    { label: "Duomenų bazė (JSON)", status: "ok"           },
  ];
  const statusMeta = {
    ok:            { dot: "#16a34a", label: "Veikia",      color: COLOR.green },
    manual:        { dot: "#f59e0b", label: "Rankinis",    color: COLOR.amber },
    not_connected: { dot: "#94a3b8", label: "Neprijungta", color: COLOR.muted },
  };

  // ── Card style helper ──────────────────────────────────────────────────
  const card = (extra = {}) => ({
    background: "white", border: `1px solid ${COLOR.slateBorder}`,
    borderRadius: "14px", overflow: "hidden", ...extra,
  });
  const cardHead = (icon, title) => (
    <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLOR.slateBorder}`, display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "14px" }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: "14px", color: COLOR.text }}>{title}</span>
    </div>
  );

  return (
    <div>
      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: COLOR.text }}>Platformos apžvalga</h3>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: COLOR.muted }}>Realaus laiko duomenys iš JSON failų</p>
      </div>

      {/* ── KPI strip — compact 4+4 ────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {kpiCards.map(c => (
          <div key={c.label} style={{
            background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px",
            padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: COLOR.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>{c.label}</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color: c.accent, lineHeight: 1 }}>{c.value}</div>
            </div>
            <span style={{ fontSize: "24px", opacity: 0.7 }}>{c.icon}</span>
          </div>
        ))}
      </div>

      {/* ── 2-column main layout ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", alignItems: "start" }}>

        {/* ── LEFT column ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Paskutinės įmonės */}
          <div style={card()}>
            {cardHead("🏢", "Paskutinės įmonės")}
            <div>
              {recentCompanies.length === 0 && (
                <div style={{ padding: "24px", textAlign: "center", color: COLOR.muted, fontSize: "13px" }}>Įmonių dar nėra</div>
              )}
              {recentCompanies.map((c, i) => (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 20px",
                  borderBottom: i < recentCompanies.length - 1 ? `1px solid #f1f5f9` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "8px", flexShrink: 0,
                      background: `linear-gradient(135deg, ${COLOR.blue}, ${COLOR.blueMid})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 800, color: "white",
                    }}>
                      {(c.name || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: COLOR.text }}>{c.name}</div>
                      <div style={{ fontSize: "11px", color: COLOR.muted, marginTop: "1px" }}>
                        {c.code || c.billingEmail || c.id}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Badge status={c.status} />
                    {c.isBillingExempt
                      ? <span style={{ fontSize: "12px", fontWeight: 700, color: "#1d4ed8" }}>€0</span>
                      : <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.text }}>{fmtEur(c.monthlyTotal)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sistemos būsena */}
          <div style={card()}>
            {cardHead("🛡️", "Sistemos būsena")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
              {systemItems.map((item, i) => {
                const m = statusMeta[item.status];
                const isRight = i % 2 === 1;
                const isLastRow = i >= systemItems.length - (systemItems.length % 2 === 0 ? 2 : 1);
                return (
                  <div key={item.label} style={{
                    padding: "14px 20px",
                    borderRight: !isRight ? `1px solid ${COLOR.slateBorder}` : "none",
                    borderBottom: !isLastRow ? `1px solid ${COLOR.slateBorder}` : "none",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Dot color={m.dot} />
                      <span style={{ fontSize: "13px", fontWeight: 600, color: COLOR.text }}>{item.label}</span>
                    </div>
                    <span style={{
                      fontSize: "11px", fontWeight: 700, color: m.color,
                      background: item.status === "ok" ? COLOR.greenLight : COLOR.slateLight,
                      padding: "2px 8px", borderRadius: "999px",
                    }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT column ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Platformos perspėjimai */}
          <div style={card()}>
            {cardHead("🔔", "Platformos perspėjimai")}
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {alerts.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: COLOR.greenLight, borderRadius: "8px", border: `1px solid ${COLOR.greenBorder}` }}>
                  <Dot color="#16a34a" />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: COLOR.green }}>Jokių perspėjimų</span>
                </div>
              )}
              {alerts.map((a, i) => {
                const s = alertColors[a.type];
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: s.bg, borderRadius: "8px", border: `1px solid ${s.border}` }}>
                    <Dot color={s.dot} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: s.text }}>{a.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Veiklos žurnalas */}
          <div style={card()}>
            {cardHead("📋", "Paskutinė veikla")}
            <div style={{ maxHeight: "340px", overflowY: "auto" }}>
              {activity.length === 0 && (
                <div style={{ padding: "32px 20px", textAlign: "center", color: COLOR.muted, fontSize: "13px" }}>
                  Veiklos įrašų dar nėra.<br />
                  <span style={{ fontSize: "12px" }}>Jie atsiras sukūrus ar pakeitus įmonę.</span>
                </div>
              )}
              {activity.map((a, i) => {
                const m = ACTIVITY_META[a.type] || ACTIVITY_META.company_updated;
                return (
                  <div key={a.id} style={{
                    display: "flex", gap: "12px", padding: "11px 16px",
                    borderBottom: i < activity.length - 1 ? `1px solid #f1f5f9` : "none",
                    alignItems: "flex-start",
                  }}>
                    <div style={{ marginTop: "3px", flexShrink: 0 }}>
                      <Dot color={m.dot} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: m.color, background: m.bg, display: "inline-block", padding: "1px 7px", borderRadius: "999px", marginBottom: "3px" }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: "13px", color: COLOR.text, fontWeight: 500, lineHeight: 1.35 }}>{a.message}</div>
                      {a.companyName && a.type !== "company_created" && (
                        <div style={{ fontSize: "11px", color: COLOR.muted, marginTop: "2px" }}>{a.companyName}</div>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: COLOR.faint, whiteSpace: "nowrap", flexShrink: 0, marginTop: "2px" }}>
                      {timeAgo(a.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Companies
// ─────────────────────────────────────────────────────────────────────────────

// Internal company badge (blue/slate)
function InternalBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 800,
      background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe",
      letterSpacing: "0.4px", whiteSpace: "nowrap",
    }}>
      INTERNAL · FREE
    </span>
  );
}

// Summary stat chip
function StatChip({ label, value, color, bg, border }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "14px 22px", background: bg || "#f8fafc",
      border: `1px solid ${border || COLOR.slateBorder}`, borderRadius: "10px",
      minWidth: "90px",
    }}>
      <span style={{ fontSize: "22px", fontWeight: 900, color: color || COLOR.text, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: "11px", color: COLOR.muted, marginTop: "5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
    </div>
  );
}

function CompaniesTab() {
  const [companies,     setCompanies]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadErr,       setLoadErr]       = useState("");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [planFilter,    setPlanFilter]    = useState("all");
  const [showForm,      setShowForm]      = useState(false);
  const [editCompany,   setEditCompany]   = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [actioning,     setActioning]     = useState(null); // companyId being activated/suspended

  const emptyCompanyForm = { name: "", code: "", vat: "", billingEmail: "", country: "", phone: "", plan: "basic", status: "active", basePrice: 150, includedUsers: 1, extraUserPrice: 50, currency: "EUR" };
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const emptyAdminForm = { name: "", email: "", password: "", role: "admin", status: "active" };
  const [adminForm,   setAdminForm]   = useState(emptyAdminForm);

  const load = () => {
    setLoading(true); setLoadErr("");
    fetch(`${API_BASE}/api/platform/companies`)
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setCompanies(d) : setLoadErr(d.error || "Klaida"))
      .catch(() => setLoadErr("Serverio klaida"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  // ── Forms ───────────────────────────────────────────────────────────────────
  const openNew  = () => {
    setEditCompany(null); setCompanyForm(emptyCompanyForm);
    setShowAdminForm(null); setShowForm(true);
  };
  const openEdit = c => {
    setEditCompany(c);
    setCompanyForm({
      name: c.name||"", code: c.code||"", vat: c.vat||"",
      billingEmail: c.billingEmail||"", country: c.country||"", phone: c.phone||"",
      plan: c.plan||"basic", status: c.status||"active",
      basePrice: c.basePrice??150, includedUsers: c.includedUsers??1,
      extraUserPrice: c.extraUserPrice??50, currency: c.currency||"EUR",
    });
    setShowAdminForm(null); setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditCompany(null); };

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) { alert("Įmonės pavadinimas yra privalomas"); return; }
    setSaving(true);
    try {
      const url    = editCompany ? `${API_BASE}/api/platform/companies/${editCompany.id}` : `${API_BASE}/api/platform/companies`;
      const method = editCompany ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(companyForm) });
      const data   = await res.json();
      if (!res.ok) { alert(data.error || "Klaida išsaugant"); return; }
      cancelForm(); load();
    } catch { alert("Serverio klaida"); }
    finally { setSaving(false); }
  };

  const openAdminForm   = id  => { setShowAdminForm(id); setAdminForm(emptyAdminForm); setShowForm(false); };
  const cancelAdminForm = ()  => { setShowAdminForm(null); };

  const handleSaveAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      alert("Vardas, el. paštas ir slaptažodis yra privalomi"); return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/platform/companies/${showAdminForm}/admin-user`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Klaida"); return; }
      alert(`✅ Administratorius sukurtas: ${data.email}`);
      cancelAdminForm(); load();
    } catch { alert("Serverio klaida"); }
    finally { setSaving(false); }
  };

  // ── Quick status change (Activate / Suspend) ────────────────────────────────
  const handleStatusChange = async (company, newStatus) => {
    if (company.isBillingExempt && newStatus === "suspended") return; // guard
    setActioning(company.id);
    try {
      const res  = await fetch(`${API_BASE}/api/platform/companies/${company.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...company, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Klaida"); return; }
      load();
    } catch { alert("Serverio klaida"); }
    finally { setActioning(null); }
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filtered = companies.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || c.name.toLowerCase().includes(q)
      || (c.code||"").toLowerCase().includes(q)
      || (c.vat||"").toLowerCase().includes(q)
      || (c.billingEmail||"").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchPlan   = planFilter   === "all"
      || (planFilter === "internal" ? c.isBillingExempt : c.plan === planFilter);
    return matchSearch && matchStatus && matchPlan;
  });

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalMRR     = companies.reduce((s, c) => s + (!c.isBillingExempt ? Number(c.monthlyTotal||0) : 0), 0);
  const countActive  = companies.filter(c => c.status === "active").length;
  const countTrial   = companies.filter(c => c.status === "trial").length;
  const countSusp    = companies.filter(c => c.status === "suspended").length;

  const hasFilters = search || statusFilter !== "all" || planFilter !== "all";

  if (loading) return <Spinner />;
  if (loadErr) return <ErrBox msg={loadErr} />;

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <SectionHead
        title="Įmonės"
        sub={`${companies.length} įmonės paskyra${companies.length !== 1 ? " (-os)" : ""} platformoje`}
        action={<button type="button" style={btnPrimary} onClick={openNew}>＋ Nauja įmonė</button>}
      />

      {infoNote("Mokėjimai šiuo metu sekami rankiniu būdu. Mokėjimų sistemos integracija bus pridėta vėliau.", "warning")}

      {/* ── Summary row ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
        <StatChip label="Viso"        value={companies.length} color={COLOR.blue}  bg={COLOR.blueLight}  border={COLOR.blueBorder}  />
        <StatChip label="Aktyvios"    value={countActive}      color={COLOR.green} bg={COLOR.greenLight} border={COLOR.greenBorder} />
        <StatChip label="Bandomosios" value={countTrial}       color={COLOR.amber} bg={COLOR.amberLight} border={COLOR.amberBorder} />
        <StatChip label="Sustabdytos" value={countSusp}        color={countSusp > 0 ? COLOR.red : COLOR.slate} bg={countSusp > 0 ? COLOR.redLight : COLOR.slateLight} border={countSusp > 0 ? COLOR.redBorder : COLOR.slateBorder} />
        <div style={{ flex: 1, minWidth: "160px" }} />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center",
          padding: "14px 22px", background: `linear-gradient(135deg, ${COLOR.blue}, ${COLOR.blueMid})`,
          borderRadius: "10px", minWidth: "140px",
        }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "white", lineHeight: 1 }}>{fmtEur(totalMRR)}</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", marginTop: "5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Mėn. pajamos</span>
        </div>
      </div>

      {/* ── Company form ───────────────────────────────────────────────────── */}
      {showForm && (
        <Panel
          title={editCompany ? `✏️ Redaguoti: ${editCompany.name}` : "➕ Nauja įmonės paskyra"}
          onClose={cancelForm}
        >
          <div style={{ ...fGrid, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { k: "name",         l: "Įmonės pavadinimas *", t: "text"  },
              { k: "code",         l: "Įmonės kodas",         t: "text"  },
              { k: "vat",          l: "PVM kodas",            t: "text"  },
              { k: "billingEmail", l: "Sąskaitų el. paštas",  t: "email" },
              { k: "country",      l: "Šalis",                t: "text"  },
              { k: "phone",        l: "Telefonas",            t: "text"  },
            ].map(({ k, l, t }) => (
              <div key={k} style={fGroup}>
                <label style={lbl}>{l}</label>
                <input style={inp} type={t} value={companyForm[k]}
                  onChange={e => setCompanyForm(f => ({ ...f, [k]: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = COLOR.blueMid; }}
                  onBlur={e  => { e.target.style.borderColor = COLOR.slateBorder; }}
                />
              </div>
            ))}
            <div style={fGroup}>
              <label style={lbl}>Planas</label>
              <select style={inp} value={companyForm.plan} onChange={e => setCompanyForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div style={fGroup}>
              <label style={lbl}>Būsena</label>
              <select style={inp} value={companyForm.status} onChange={e => setCompanyForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Aktyvi</option>
                <option value="trial">Bandomoji</option>
                <option value="suspended">Sustabdyta</option>
              </select>
            </div>
            {[
              { k: "basePrice",      l: "Bazinė kaina (€/mėn.)"         },
              { k: "includedUsers",  l: "Įtraukti vartotojai"            },
              { k: "extraUserPrice", l: "Papild. vartotojo kaina (€/mėn.)" },
            ].map(({ k, l }) => (
              <div key={k} style={fGroup}>
                <label style={lbl}>{l}</label>
                <input style={inp} type="number" min="0" value={companyForm[k]}
                  onChange={e => setCompanyForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                  onFocus={e => { e.target.style.borderColor = COLOR.blueMid; }}
                  onBlur={e  => { e.target.style.borderColor = COLOR.slateBorder; }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${COLOR.slateBorder}` }}>
            <button type="button" style={btnSuccess} onClick={handleSaveCompany} disabled={saving}>
              {saving ? "Saugoma…" : "💾 Išsaugoti"}
            </button>
            <button type="button" style={btnGhost} onClick={cancelForm}>Atšaukti</button>
          </div>
        </Panel>
      )}

      {/* ── Admin user form ─────────────────────────────────────────────────── */}
      {showAdminForm && (
        <Panel
          title={`👤 Sukurti administratorių — ${companies.find(c => c.id === showAdminForm)?.name || ""}`}
          accent={COLOR.green}
          onClose={cancelAdminForm}
        >
          <div style={{ ...fGrid, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { k: "name",     l: "Vardas Pavardė *",  t: "text"     },
              { k: "email",    l: "El. paštas *",      t: "email"    },
              { k: "password", l: "Slaptažodis *",     t: "password" },
            ].map(({ k, l, t }) => (
              <div key={k} style={fGroup}>
                <label style={lbl}>{l}</label>
                <input style={inp} type={t} value={adminForm[k]} autoComplete="new-password"
                  onChange={e => setAdminForm(f => ({ ...f, [k]: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor = COLOR.blueMid; }}
                  onBlur={e  => { e.target.style.borderColor = COLOR.slateBorder; }}
                />
              </div>
            ))}
            <div style={fGroup}>
              <label style={lbl}>Rolė</label>
              <select style={inp} value={adminForm.role} onChange={e => setAdminForm(f => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${COLOR.slateBorder}` }}>
            <button type="button" style={btnSuccess} onClick={handleSaveAdmin} disabled={saving}>
              {saving ? "Kuriama…" : "👤 Sukurti vartotoją"}
            </button>
            <button type="button" style={btnGhost} onClick={cancelAdminForm}>Atšaukti</button>
          </div>
        </Panel>
      )}

      {/* ── Search + filter bar ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: "380px" }}>
          <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width="16" height="16" fill="none" viewBox="0 0 20 20">
            <path stroke="#94a3b8" strokeWidth="1.5" d="M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM17 17l-3.5-3.5"/>
          </svg>
          <input
            style={{ ...inp, paddingLeft: "34px" }}
            placeholder="Ieškoti pagal pavadinimą, kodą, PVM, el. paštą…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <select style={{ ...inp, flex: "0 0 auto", width: "150px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Visos būsenos</option>
          <option value="active">Aktyvios</option>
          <option value="trial">Bandomosios</option>
          <option value="suspended">Sustabdytos</option>
        </select>

        {/* Plan filter */}
        <select style={{ ...inp, flex: "0 0 auto", width: "150px" }} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="all">Visi planai</option>
          <option value="internal">Vidinės</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button type="button" style={btnGhost} onClick={() => { setSearch(""); setStatusFilter("all"); setPlanFilter("all"); }}>
            ✕ Išvalyti filtrus
          </button>
        )}

        {/* Counter */}
        <span style={{ marginLeft: "auto", fontSize: "13px", color: COLOR.muted, whiteSpace: "nowrap" }}>
          {filtered.length === companies.length
            ? `${companies.length} įmonių`
            : `Rodoma ${filtered.length} iš ${companies.length}`}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div style={tblWrap}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={tHead}>Įmonė</th>
              <th style={tHead}>Kodas / PVM</th>
              <th style={tHead}>Būsena</th>
              <th style={tHead}>Planas</th>
              <th style={{ ...tHead, textAlign: "right" }}>Vartotojai</th>
              <th style={{ ...tHead, textAlign: "right" }}>Mėn. mokestis</th>
              <th style={tHead}>Sąskaitų el. paštas</th>
              <th style={{ ...tHead, textAlign: "right" }}>Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div style={{ padding: "56px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>🔍</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, marginBottom: "6px" }}>
                      Nė viena įmonė neatitinka pasirinktų filtrų
                    </div>
                    <div style={{ fontSize: "13px", color: COLOR.muted }}>
                      Pabandykite išvalyti paiešką arba pakeisti būsenos / plano filtrus.
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((c, idx) => {
              const isLast   = idx === filtered.length - 1;
              const cell     = isLast ? tCellLast : tCell;
              const isInternal = !!c.isBillingExempt;
              const isBusy   = actioning === c.id;

              return (
                <tr key={c.id} style={{ background: "white" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>

                  {/* Company name */}
                  <td style={cell}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: COLOR.text }}>{c.name}</span>
                      {isInternal && <InternalBadge />}
                    </div>
                  </td>

                  {/* Code / VAT */}
                  <td style={cell}>
                    {c.code
                      ? <div style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600, color: COLOR.text }}>{c.code}</div>
                      : <span style={{ color: COLOR.faint }}>—</span>}
                    {c.vat
                      ? <div style={{ fontFamily: "monospace", fontSize: "12px", color: COLOR.muted, marginTop: "2px" }}>{c.vat}</div>
                      : null}
                  </td>

                  {/* Status badge */}
                  <td style={cell}><Badge status={c.status} /></td>

                  {/* Plan */}
                  <td style={cell}>
                    <span style={{
                      fontSize: "12px", fontWeight: 700, padding: "3px 10px",
                      borderRadius: "999px",
                      background: c.plan === "enterprise" ? "#f5f3ff" : c.plan === "pro" ? "#eff6ff" : COLOR.slateLight,
                      color:      c.plan === "enterprise" ? "#6d28d9"  : c.plan === "pro" ? COLOR.blue   : COLOR.slate,
                      border:     `1px solid ${c.plan === "enterprise" ? "#ddd6fe" : c.plan === "pro" ? COLOR.blueBorder : COLOR.slateBorder}`,
                    }}>
                      {planLabel(c.plan)}
                    </span>
                  </td>

                  {/* Users */}
                  <td style={{ ...cell, textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: "15px" }}>{c.activeUsersCount}</div>
                    <div style={{ fontSize: "11px", color: COLOR.muted }}>{c.totalUsersCount} iš viso</div>
                  </td>

                  {/* Monthly total */}
                  <td style={{ ...cell, textAlign: "right" }}>
                    {isInternal
                      ? <span style={{ fontWeight: 800, color: "#1d4ed8" }}>€0.00</span>
                      : <span style={{ fontWeight: 900, fontSize: "15px", color: COLOR.text }}>{fmtEur(c.monthlyTotal)}</span>}
                    {!isInternal && <div style={{ fontSize: "11px", color: COLOR.muted }}>/ mėn.</div>}
                  </td>

                  {/* Billing email */}
                  <td style={cell}>
                    {c.billingEmail
                      ? <span style={{ fontSize: "13px", color: COLOR.text }}>{c.billingEmail}</span>
                      : <span style={{ color: COLOR.faint }}>—</span>}
                  </td>

                  {/* Actions */}
                  <td style={{ ...cell, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {/* Redaguoti */}
                      <button type="button" style={btnSmPrimary} onClick={() => openEdit(c)}>
                        ✏️ Redaguoti
                      </button>
                      {/* Sukurti administratorių */}
                      <button type="button" style={btnSmTeal} onClick={() => openAdminForm(c.id)}>
                        👤 Admin
                      </button>
                      {/* Aktyvuoti (rodoma tik kai ne aktyvus) */}
                      {c.status !== "active" && (
                        <button
                          type="button"
                          style={{ ...btnSmSuccess, opacity: isBusy ? 0.6 : 1 }}
                          disabled={isBusy}
                          onClick={() => handleStatusChange(c, "active")}
                        >
                          {isBusy ? "…" : "✅ Aktyvuoti"}
                        </button>
                      )}
                      {/* Sustabdyti (negalima vidinėms) */}
                      {c.status !== "suspended" && !isInternal && (
                        <button
                          type="button"
                          style={{ ...btnSmGhost, color: COLOR.red, borderColor: COLOR.redBorder, opacity: isBusy ? 0.6 : 1 }}
                          disabled={isBusy}
                          onClick={() => {
                            if (window.confirm(`Sustabdyti „${c.name}"? Jų vartotojai praras prieigą.`)) {
                              handleStatusChange(c, "suspended");
                            }
                          }}
                        >
                          {isBusy ? "…" : "⛔ Sustabdyti"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Subscriptions
// ─────────────────────────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/platform/companies`)
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) { setErr(d.error || "Klaida"); return; }
        const now         = new Date();
        const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("lt-LT");
        setRows(d.map(c => ({ ...c, nextBillingDate: c.isBillingExempt ? null : nextBilling })));
      })
      .catch(() => setErr("Serverio klaida"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err)     return <ErrBox msg={err} />;

  const mrr = rows.reduce((s, c) => s + (!c.isBillingExempt ? Number(c.monthlyTotal || 0) : 0), 0);

  return (
    <div>
      <SectionHead
        title="Abonementai"
        sub="Apmokėjimų apžvalga visose įmonių paskyrose"
      />

      {infoNote("Mokėjimai šiuo metu sekami rankiniu būdu. Mokėjimų sistemos integracija bus pridėta vėliau.", "warning")}

      {/* MRR summary card */}
      <div style={{
        background: `linear-gradient(135deg, ${COLOR.blue} 0%, ${COLOR.blueMid} 100%)`,
        borderRadius: "12px", padding: "22px 26px", marginBottom: "24px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
            Bendros mėnesinės pajamos (MRR)
          </div>
          <div style={{ fontSize: "36px", fontWeight: 900, color: "white", lineHeight: 1 }}>{fmtEur(mrr)}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
            Skaičiuojama iš {rows.filter(r => !r.isBillingExempt).length} mokančių paskyrų
          </div>
        </div>
        <div style={{ fontSize: "48px", opacity: 0.25 }}>💳</div>
      </div>

      <div style={tblWrap}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={tHead}>Įmonė</th>
              <th style={tHead}>Planas</th>
              <th style={tHead}>Būsena</th>
              <th style={{ ...tHead, textAlign: "right" }}>Aktyvūs</th>
              <th style={{ ...tHead, textAlign: "right" }}>Įtraukta</th>
              <th style={{ ...tHead, textAlign: "right" }}>Papild.</th>
              <th style={{ ...tHead, textAlign: "right" }}>Mėn. mokestis</th>
              <th style={tHead}>Kita sąskaita</th>
              <th style={tHead}>Sąskaitų el. paštas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, idx) => {
              const isLast = idx === rows.length - 1;
              const cell   = isLast ? tCellLast : tCell;
              const extra  = c.isBillingExempt ? 0 : Math.max(0, (c.activeUsersCount || 0) - (c.includedUsers || 1));
              return (
                <tr key={c.id} style={{ background: "white" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background = "white"}>
                  <td style={cell}>
                    <div style={{ fontWeight: 700 }}>{c.name}</div>
                    {c.isBillingExempt && (
                      <span style={{ display: "inline-block", marginTop: "3px", padding: "1px 7px", borderRadius: "999px", background: COLOR.greenLight, color: COLOR.green, border: `1px solid ${COLOR.greenBorder}`, fontSize: "10px", fontWeight: 800 }}>INTERNAL · FREE</span>
                    )}
                  </td>
                  <td style={cell}><span style={{ fontWeight: 600, fontSize: "13px" }}>{planLabel(c.plan)}</span></td>
                  <td style={cell}><Badge status={c.status} /></td>
                  <td style={{ ...cell, textAlign: "right", fontWeight: 700 }}>{c.activeUsersCount}</td>
                  <td style={{ ...cell, textAlign: "right" }}>{c.isBillingExempt ? <span style={{ color: COLOR.muted }}>∞</span> : (c.includedUsers ?? 1)}</td>
                  <td style={{ ...cell, textAlign: "right" }}>
                    {extra > 0
                      ? <span style={{ color: "#c2410c", fontWeight: 800 }}>+{extra}</span>
                      : <span style={{ color: COLOR.muted }}>0</span>}
                  </td>
                  <td style={{ ...cell, textAlign: "right" }}>
                    {c.isBillingExempt
                      ? <span style={{ color: COLOR.green, fontWeight: 800 }}>€0.00</span>
                      : <span style={{ fontWeight: 900, fontSize: "15px", color: COLOR.blue }}>{fmtEur(c.monthlyTotal)}</span>}
                  </td>
                  <td style={cell}>{c.nextBillingDate || <span style={{ color: COLOR.faint }}>—</span>}</td>
                  <td style={cell}>{c.billingEmail || <span style={{ color: COLOR.faint }}>—</span>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: "48px", textAlign: "center", color: COLOR.muted }}>Nėra abonementų duomenų</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Payments
// ─────────────────────────────────────────────────────────────────────────────
function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [marking,  setMarking]  = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/platform/payments`)
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setPayments(d) : setErr(d.error || "Klaida"))
      .catch(() => setErr("Serverio klaida"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    setMarking(id);
    try {
      const res  = await fetch(`${API_BASE}/api/platform/payments/${id}/mark-paid`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Klaida"); return; }
      load();
    } catch { alert("Serverio klaida"); }
    finally { setMarking(null); }
  };

  if (loading) return <Spinner />;
  if (err)     return <ErrBox msg={err} />;

  return (
    <div>
      <SectionHead
        title="Mokėjimai"
        sub="Rankinis mokėjimų sekimas — automatinis apmokėjimas neprijungtas"
      />

      {infoNote("Mokėjimai šiuo metu sekami rankiniu būdu. Mokėjimų sistemos integracija bus pridėta vėliau.", "warning")}

      {payments.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 32px",
          background: COLOR.slateLight, borderRadius: "12px", border: `1px dashed ${COLOR.slateBorder}`
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>💳</div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: COLOR.text, marginBottom: "8px" }}>
            Mokėjimų įrašų dar nėra
          </div>
          <div style={{ fontSize: "14px", color: COLOR.muted, maxWidth: "420px", margin: "0 auto", lineHeight: 1.6 }}>
            Mokėjimų įrašai atsiras čia kai bus sukonfigūruota mokėjimų sistema
            arba kai mokėjimai bus pridėti rankiniu būdu į <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>platformPayments.json</code>.
          </div>
        </div>
      ) : (
        <div style={tblWrap}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={tHead}>Įmonė</th>
                <th style={{ ...tHead, textAlign: "right" }}>Suma</th>
                <th style={tHead}>Laikotarpis</th>
                <th style={tHead}>Būsena</th>
                <th style={tHead}>Mokėjimo terminas</th>
                <th style={tHead}>Apmokėta</th>
                <th style={{ ...tHead, textAlign: "right" }}>Veiksmas</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => {
                const isLast = idx === payments.length - 1;
                const cell   = isLast ? tCellLast : tCell;
                return (
                  <tr key={p.id} style={{ background: "white" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}>
                    <td style={cell}><span style={{ fontWeight: 700 }}>{p.companyName || p.companyId || "—"}</span></td>
                    <td style={{ ...cell, textAlign: "right", fontWeight: 800, fontSize: "15px" }}>{fmtEur(p.amount)} <span style={{ fontSize: "12px", fontWeight: 500, color: COLOR.muted }}>{p.currency || "EUR"}</span></td>
                    <td style={cell}>{p.period || "—"}</td>
                    <td style={cell}><Badge status={p.status} /></td>
                    <td style={cell}>{p.dueDate ? new Date(p.dueDate).toLocaleDateString("lt-LT") : "—"}</td>
                    <td style={cell}>{p.paidDate ? new Date(p.paidDate).toLocaleDateString("lt-LT") : <span style={{ color: COLOR.faint }}>—</span>}</td>
                    <td style={{ ...cell, textAlign: "right" }}>
                      {p.status !== "paid"
                        ? <button type="button" style={btnSmSuccess} onClick={() => markPaid(p.id)} disabled={marking === p.id}>{marking === p.id ? "…" : "✅ Pažymėti apmokėtu"}</button>
                        : <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.green }}>✅ Apmokėta</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab: Reminders
// ─────────────────────────────────────────────────────────────────────────────
function RemindersTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/platform/companies`)
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return;
        const now = new Date();
        const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        setRows(
          d
            .filter(c => !c.isBillingExempt && c.status !== "suspended")
            .map(c => ({
              id: c.id, name: c.name, billingEmail: c.billingEmail || "—",
              dueDate: nextBilling.toLocaleDateString("lt-LT"),
              status: c.status,
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <SectionHead
        title="Priminimai"
        sub="Automatiniai apmokėjimo priminimai — laukiama el. pašto integracijos"
      />

      {/* Future state notice */}
      <div style={{
        background: "white", border: `1px solid ${COLOR.slateBorder}`, borderRadius: "12px",
        padding: "32px", marginBottom: "24px", display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap"
      }}>
        <div style={{ fontSize: "40px", flexShrink: 0 }}>📧</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "16px", color: COLOR.text, marginBottom: "6px" }}>
            Automatiniai priminimai bus galimi po el. pašto paslaugos integracijos
          </div>
          <div style={{ fontSize: "14px", color: COLOR.muted, lineHeight: 1.7, marginBottom: "16px" }}>
            Kai bus prijungtas el. pašto tiekėjas (SMTP / SendGrid / Mailgun), platforma galės
            automatiškai siųsti apmokėjimo priminimus, sąskaitų pranešimus ir įspėjimus apie vėlavimus.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["SMTP", "SendGrid", "Mailgun", "Postmark"].map(s => (
              <span key={s} style={{ padding: "4px 12px", borderRadius: "999px", background: COLOR.slateLight, border: `1px solid ${COLOR.slateBorder}`, fontSize: "12px", fontWeight: 600, color: COLOR.muted }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Preview of who would receive reminders */}
      {rows.length > 0 && (
        <>
          <div style={{ fontSize: "13px", fontWeight: 700, color: COLOR.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
            Paskyros, kurios gautų priminimus ({rows.length})
          </div>
          <div style={tblWrap}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={tHead}>Įmonė</th>
                  <th style={tHead}>Sąskaitų el. paštas</th>
                  <th style={tHead}>Tipas</th>
                  <th style={tHead}>Kita data</th>
                  <th style={tHead}>Būsena</th>
                  <th style={{ ...tHead, textAlign: "right" }}>Veiksmas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const isLast = idx === rows.length - 1;
                  const cell   = isLast ? tCellLast : tCell;
                  return (
                    <tr key={r.id} style={{ background: "white" }}>
                      <td style={cell}><span style={{ fontWeight: 700 }}>{r.name}</span></td>
                      <td style={cell}>{r.billingEmail}</td>
                      <td style={cell}><span style={{ fontSize: "12px", color: COLOR.muted, fontWeight: 600 }}>Mėnesinė sąskaita</span></td>
                      <td style={cell}>{r.dueDate}</td>
                      <td style={cell}><Badge status={r.status} /></td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        <button
                          type="button"
                          style={{ ...btnSmGhost, opacity: 0.5, cursor: "not-allowed" }}
                          title="El. pašto paslauga dar neprijungta"
                          onClick={() => alert("ℹ️ El. pašto paslauga dar neprijungta.\nŠis mygtukas veiks po el. pašto integracijos sukonfigūravimo.")}
                        >
                          📧 Siųsti priminimą
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {rows.length === 0 && (
        <div style={{ padding: "32px", textAlign: "center", color: COLOR.muted, fontSize: "14px" }}>
          Nėra mokančių paskyrų, tinkamų priminiams.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: Admin Console
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",      label: "Apžvalga",     icon: "📊" },
  { key: "companies",     label: "Įmonės",       icon: "🏢" },
  { key: "subscriptions", label: "Abonementai",  icon: "📋" },
  { key: "payments",      label: "Mokėjimai",    icon: "💳" },
  { key: "reminders",     label: "Priminimai",   icon: "🔔" },
];

export default function AdminConsole() {
  const [tab, setTab] = useState("overview");

  const renderTab = () => {
    if (tab === "overview")      return <OverviewTab />;
    if (tab === "companies")     return <CompaniesTab />;
    if (tab === "subscriptions") return <SubscriptionsTab />;
    if (tab === "payments")      return <PaymentsTab />;
    if (tab === "reminders")     return <RemindersTab />;
    return null;
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: "0", marginBottom: "32px",
        borderBottom: `2px solid ${COLOR.slateBorder}`,
        overflowX: "auto",
      }}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding:       "12px 22px",
                border:        "none",
                borderBottom:  active ? `3px solid ${COLOR.blueMid}` : "3px solid transparent",
                marginBottom:  "-2px",
                background:    "transparent",
                cursor:        "pointer",
                fontWeight:    active ? 800 : 500,
                fontSize:      "14px",
                color:         active ? COLOR.blue : COLOR.muted,
                whiteSpace:    "nowrap",
                transition:    "color 0.15s, border-color 0.15s",
                display:       "flex",
                alignItems:    "center",
                gap:           "7px",
                letterSpacing: active ? "-0.2px" : "0",
              }}
            >
              <span style={{ fontSize: "15px" }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content area — full width */}
      <div style={{ width: "100%" }}>
        {renderTab()}
      </div>
    </div>
  );
}
