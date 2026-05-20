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
      <div style={{ fontSize: "13px", fontWeight: 500 }}>Loading…</div>
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
function OverviewTab() {
  const [kpi, setKpi]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/platform/overview`)
      .then(r => r.json())
      .then(d => d.totalCompanies !== undefined ? setKpi(d) : setErr(d.error || "Error"))
      .catch(() => setErr("Server error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err)     return <ErrBox msg={err} />;

  const kpiCards = [
    { label: "Total Companies",    value: kpi.totalCompanies,       icon: "🏢", accent: COLOR.blue,  bg: COLOR.blueLight,  border: COLOR.blueBorder  },
    { label: "Active",             value: kpi.activeCompanies,      icon: "✅", accent: COLOR.green, bg: COLOR.greenLight, border: COLOR.greenBorder },
    { label: "Trial",              value: kpi.trialCompanies,       icon: "🟡", accent: COLOR.amber, bg: COLOR.amberLight, border: COLOR.amberBorder },
    { label: "Suspended",          value: kpi.suspendedCompanies,   icon: "⛔", accent: kpi.suspendedCompanies > 0 ? COLOR.red : COLOR.slate, bg: kpi.suspendedCompanies > 0 ? COLOR.redLight : COLOR.slateLight, border: kpi.suspendedCompanies > 0 ? COLOR.redBorder : COLOR.slateBorder },
    { label: "Active Users",       value: kpi.totalActiveUsers,     icon: "👤", accent: COLOR.blue,  bg: COLOR.blueLight,  border: COLOR.blueBorder  },
    { label: "Monthly Revenue",    value: fmtEur(kpi.monthlyRecurringRevenue), icon: "💰", accent: COLOR.green, bg: COLOR.greenLight, border: COLOR.greenBorder },
    { label: "Overdue Payments",   value: kpi.overduePaymentsCount, icon: "⚠️", accent: kpi.overduePaymentsCount > 0 ? COLOR.red : COLOR.slate, bg: kpi.overduePaymentsCount > 0 ? COLOR.redLight : COLOR.slateLight, border: kpi.overduePaymentsCount > 0 ? COLOR.redBorder : COLOR.slateBorder },
    { label: "Upcoming Renewals",  value: kpi.upcomingRenewalsCount, icon: "🔄", accent: COLOR.amber, bg: COLOR.amberLight, border: COLOR.amberBorder },
  ];

  const healthItems = [
    { label: "Auth service",       status: "ok",             note: "JWT / bcrypt — operational"         },
    { label: "Billing mode",       status: "manual",         note: "Manual tracking — no gateway"       },
    { label: "Email reminders",    status: "not_connected",  note: "Email service not configured"       },
    { label: "Payment gateway",    status: "not_connected",  note: "Integration not configured"         },
  ];
  const healthMeta = {
    ok:            { dot: "#16a34a", label: "OK",            color: COLOR.green },
    manual:        { dot: "#f59e0b", label: "Manual",        color: COLOR.amber },
    not_connected: { dot: "#94a3b8", label: "Not connected", color: COLOR.muted },
  };

  return (
    <div>
      <SectionHead
        title="Platform Overview"
        sub="Real-time metrics from companies.json and users.json"
      />

      {/* KPI grid — 4 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "18px", marginBottom: "36px" }}>
        {kpiCards.map(c => (
          <div key={c.label} style={{
            background: c.bg, border: `1px solid ${c.border}`, borderRadius: "14px",
            padding: "24px 26px", display: "flex", flexDirection: "column", gap: "14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: COLOR.muted, textTransform: "uppercase", letterSpacing: "0.7px", lineHeight: 1.4 }}>{c.label}</span>
              <span style={{ fontSize: "22px", lineHeight: 1 }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, color: c.accent, lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Platform health — full width, 4 columns */}
      <div style={{ background: "white", border: `1px solid ${COLOR.slateBorder}`, borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLOR.slateBorder}`, display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px" }}>🛡️</span>
          <span style={{ fontWeight: 800, fontSize: "15px", color: COLOR.text }}>Platform Health</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
          {healthItems.map((item, i) => {
            const m = healthMeta[item.status];
            return (
              <div key={item.label} style={{
                padding: "20px 24px",
                borderRight: i < healthItems.length - 1 ? `1px solid ${COLOR.slateBorder}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Dot color={m.dot} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: COLOR.text }}>{item.label}</span>
                </div>
                <div style={{ marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: m.color, background: item.status === "ok" ? COLOR.greenLight : COLOR.slateLight, padding: "2px 8px", borderRadius: "999px" }}>{m.label}</span>
                </div>
                <div style={{ fontSize: "12px", color: COLOR.muted, lineHeight: 1.5 }}>{item.note}</div>
              </div>
            );
          })}
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
      .then(d => Array.isArray(d) ? setCompanies(d) : setLoadErr(d.error || "Error"))
      .catch(() => setLoadErr("Server error"))
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
    if (!companyForm.name.trim()) { alert("Company name is required"); return; }
    setSaving(true);
    try {
      const url    = editCompany ? `${API_BASE}/api/platform/companies/${editCompany.id}` : `${API_BASE}/api/platform/companies`;
      const method = editCompany ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(companyForm) });
      const data   = await res.json();
      if (!res.ok) { alert(data.error || "Error saving"); return; }
      cancelForm(); load();
    } catch { alert("Server error"); }
    finally { setSaving(false); }
  };

  const openAdminForm   = id  => { setShowAdminForm(id); setAdminForm(emptyAdminForm); setShowForm(false); };
  const cancelAdminForm = ()  => { setShowAdminForm(null); };

  const handleSaveAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      alert("Name, email and password are required"); return;
    }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/platform/companies/${showAdminForm}/admin-user`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error"); return; }
      alert(`✅ Admin user created: ${data.email}`);
      cancelAdminForm(); load();
    } catch { alert("Server error"); }
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
      if (!res.ok) { alert(data.error || "Error"); return; }
      load();
    } catch { alert("Server error"); }
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
        title="Companies"
        sub={`${companies.length} company account${companies.length !== 1 ? "s" : ""} registered on the platform`}
        action={<button type="button" style={btnPrimary} onClick={openNew}>＋ New Company</button>}
      />

      {infoNote("Payments are currently tracked manually. Payment gateway integration will be added later.", "warning")}

      {/* ── Summary row ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
        <StatChip label="Total" value={companies.length} color={COLOR.blue} bg={COLOR.blueLight} border={COLOR.blueBorder} />
        <StatChip label="Active"    value={countActive} color={COLOR.green} bg={COLOR.greenLight} border={COLOR.greenBorder} />
        <StatChip label="Trial"     value={countTrial}  color={COLOR.amber} bg={COLOR.amberLight} border={COLOR.amberBorder} />
        <StatChip label="Suspended" value={countSusp}   color={countSusp > 0 ? COLOR.red : COLOR.slate} bg={countSusp > 0 ? COLOR.redLight : COLOR.slateLight} border={countSusp > 0 ? COLOR.redBorder : COLOR.slateBorder} />
        <div style={{ flex: 1, minWidth: "160px" }} />
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center",
          padding: "14px 22px", background: `linear-gradient(135deg, ${COLOR.blue}, ${COLOR.blueMid})`,
          borderRadius: "10px", minWidth: "140px",
        }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: "white", lineHeight: 1 }}>{fmtEur(totalMRR)}</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", marginTop: "5px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total MRR</span>
        </div>
      </div>

      {/* ── Company form ───────────────────────────────────────────────────── */}
      {showForm && (
        <Panel
          title={editCompany ? `✏️ Edit company: ${editCompany.name}` : "➕ New Company Account"}
          onClose={cancelForm}
        >
          <div style={{ ...fGrid, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { k: "name",         l: "Company name *",  t: "text"  },
              { k: "code",         l: "Company code",    t: "text"  },
              { k: "vat",          l: "VAT number",      t: "text"  },
              { k: "billingEmail", l: "Billing email",   t: "email" },
              { k: "country",      l: "Country",         t: "text"  },
              { k: "phone",        l: "Phone",           t: "text"  },
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
              <label style={lbl}>Plan</label>
              <select style={inp} value={companyForm.plan} onChange={e => setCompanyForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div style={fGroup}>
              <label style={lbl}>Status</label>
              <select style={inp} value={companyForm.status} onChange={e => setCompanyForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            {[
              { k: "basePrice",      l: "Base price (€/mo)"       },
              { k: "includedUsers",  l: "Included users"          },
              { k: "extraUserPrice", l: "Extra user price (€/mo)" },
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
              {saving ? "Saving…" : "💾 Save company"}
            </button>
            <button type="button" style={btnGhost} onClick={cancelForm}>Cancel</button>
          </div>
        </Panel>
      )}

      {/* ── Admin user form ─────────────────────────────────────────────────── */}
      {showAdminForm && (
        <Panel
          title={`👤 Create Admin User — ${companies.find(c => c.id === showAdminForm)?.name || ""}`}
          accent={COLOR.green}
          onClose={cancelAdminForm}
        >
          <div style={{ ...fGrid, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {[
              { k: "name",     l: "Full name *",     t: "text"     },
              { k: "email",    l: "Email address *", t: "email"    },
              { k: "password", l: "Password *",      t: "password" },
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
              <label style={lbl}>Role</label>
              <select style={inp} value={adminForm.role} onChange={e => setAdminForm(f => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "24px", paddingTop: "20px", borderTop: `1px solid ${COLOR.slateBorder}` }}>
            <button type="button" style={btnSuccess} onClick={handleSaveAdmin} disabled={saving}>
              {saving ? "Creating…" : "👤 Create user"}
            </button>
            <button type="button" style={btnGhost} onClick={cancelAdminForm}>Cancel</button>
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
            placeholder="Search name, code, VAT, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <select style={{ ...inp, flex: "0 0 auto", width: "150px" }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
        </select>

        {/* Plan filter */}
        <select style={{ ...inp, flex: "0 0 auto", width: "150px" }} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="all">All plans</option>
          <option value="internal">Internal</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button type="button" style={btnGhost} onClick={() => { setSearch(""); setStatusFilter("all"); setPlanFilter("all"); }}>
            ✕ Clear filters
          </button>
        )}

        {/* Counter */}
        <span style={{ marginLeft: "auto", fontSize: "13px", color: COLOR.muted, whiteSpace: "nowrap" }}>
          {filtered.length === companies.length
            ? `${companies.length} companies`
            : `${filtered.length} of ${companies.length} shown`}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div style={tblWrap}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={tHead}>Company</th>
              <th style={tHead}>Code / VAT</th>
              <th style={tHead}>Status</th>
              <th style={tHead}>Plan</th>
              <th style={{ ...tHead, textAlign: "right" }}>Users</th>
              <th style={{ ...tHead, textAlign: "right" }}>Monthly</th>
              <th style={tHead}>Billing email</th>
              <th style={{ ...tHead, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div style={{ padding: "56px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>🔍</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: COLOR.text, marginBottom: "6px" }}>
                      No companies match selected filters
                    </div>
                    <div style={{ fontSize: "13px", color: COLOR.muted }}>
                      Try clearing the search or adjusting status / plan filters.
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
                    <div style={{ fontSize: "11px", color: COLOR.muted }}>{c.totalUsersCount} total</div>
                  </td>

                  {/* Monthly total */}
                  <td style={{ ...cell, textAlign: "right" }}>
                    {isInternal
                      ? <span style={{ fontWeight: 800, color: "#1d4ed8" }}>€0.00</span>
                      : <span style={{ fontWeight: 900, fontSize: "15px", color: COLOR.text }}>{fmtEur(c.monthlyTotal)}</span>}
                    {!isInternal && <div style={{ fontSize: "11px", color: COLOR.muted }}>/ month</div>}
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
                      {/* Edit */}
                      <button type="button" style={btnSmPrimary} onClick={() => openEdit(c)}>
                        ✏️ Edit
                      </button>
                      {/* Create admin user */}
                      <button type="button" style={btnSmTeal} onClick={() => openAdminForm(c.id)}>
                        👤 Admin
                      </button>
                      {/* Activate (show only when suspended or trial) */}
                      {c.status !== "active" && (
                        <button
                          type="button"
                          style={{ ...btnSmSuccess, opacity: isBusy ? 0.6 : 1 }}
                          disabled={isBusy}
                          onClick={() => handleStatusChange(c, "active")}
                        >
                          {isBusy ? "…" : "✅ Activate"}
                        </button>
                      )}
                      {/* Suspend (not allowed for internal) */}
                      {c.status !== "suspended" && !isInternal && (
                        <button
                          type="button"
                          style={{ ...btnSmGhost, color: COLOR.red, borderColor: COLOR.redBorder, opacity: isBusy ? 0.6 : 1 }}
                          disabled={isBusy}
                          onClick={() => {
                            if (window.confirm(`Suspend "${c.name}"? Their users will lose access.`)) {
                              handleStatusChange(c, "suspended");
                            }
                          }}
                        >
                          {isBusy ? "…" : "⛔ Suspend"}
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
        if (!Array.isArray(d)) { setErr(d.error || "Error"); return; }
        const now         = new Date();
        const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("lt-LT");
        setRows(d.map(c => ({ ...c, nextBillingDate: c.isBillingExempt ? null : nextBilling })));
      })
      .catch(() => setErr("Server error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (err)     return <ErrBox msg={err} />;

  const mrr = rows.reduce((s, c) => s + (!c.isBillingExempt ? Number(c.monthlyTotal || 0) : 0), 0);

  return (
    <div>
      <SectionHead
        title="Subscriptions"
        sub="Billing overview across all company accounts"
      />

      {infoNote("Payments are currently tracked manually. Payment gateway integration will be added later.", "warning")}

      {/* MRR summary card */}
      <div style={{
        background: `linear-gradient(135deg, ${COLOR.blue} 0%, ${COLOR.blueMid} 100%)`,
        borderRadius: "12px", padding: "22px 26px", marginBottom: "24px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px"
      }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>
            Total Monthly Recurring Revenue
          </div>
          <div style={{ fontSize: "36px", fontWeight: 900, color: "white", lineHeight: 1 }}>{fmtEur(mrr)}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "6px" }}>
            Calculated from {rows.filter(r => !r.isBillingExempt).length} paid account{rows.filter(r => !r.isBillingExempt).length !== 1 ? "s" : ""}
          </div>
        </div>
        <div style={{ fontSize: "48px", opacity: 0.25 }}>💳</div>
      </div>

      <div style={tblWrap}>
        <table style={tbl}>
          <thead>
            <tr>
              <th style={tHead}>Company</th>
              <th style={tHead}>Plan</th>
              <th style={tHead}>Status</th>
              <th style={{ ...tHead, textAlign: "right" }}>Active</th>
              <th style={{ ...tHead, textAlign: "right" }}>Included</th>
              <th style={{ ...tHead, textAlign: "right" }}>Extra</th>
              <th style={{ ...tHead, textAlign: "right" }}>Monthly Total</th>
              <th style={tHead}>Next Billing</th>
              <th style={tHead}>Billing Email</th>
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
              <tr><td colSpan={9} style={{ padding: "48px", textAlign: "center", color: COLOR.muted }}>No subscription data</td></tr>
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
      .then(d => Array.isArray(d) ? setPayments(d) : setErr(d.error || "Error"))
      .catch(() => setErr("Server error"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    setMarking(id);
    try {
      const res  = await fetch(`${API_BASE}/api/platform/payments/${id}/mark-paid`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error"); return; }
      load();
    } catch { alert("Server error"); }
    finally { setMarking(null); }
  };

  if (loading) return <Spinner />;
  if (err)     return <ErrBox msg={err} />;

  return (
    <div>
      <SectionHead
        title="Payments"
        sub="Manual payment tracking — no automated billing"
      />

      {infoNote("Payments are currently tracked manually. Payment gateway integration will be added later.", "warning")}

      {payments.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 32px",
          background: COLOR.slateLight, borderRadius: "12px", border: `1px dashed ${COLOR.slateBorder}`
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>💳</div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: COLOR.text, marginBottom: "8px" }}>
            No payments recorded yet
          </div>
          <div style={{ fontSize: "14px", color: COLOR.muted, maxWidth: "400px", margin: "0 auto", lineHeight: 1.6 }}>
            Payment records will appear here once payment gateway integration is configured,
            or when payments are added manually to <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px", fontSize: "13px" }}>platformPayments.json</code>.
          </div>
        </div>
      ) : (
        <div style={tblWrap}>
          <table style={tbl}>
            <thead>
              <tr>
                <th style={tHead}>Company</th>
                <th style={{ ...tHead, textAlign: "right" }}>Amount</th>
                <th style={tHead}>Period</th>
                <th style={tHead}>Status</th>
                <th style={tHead}>Due Date</th>
                <th style={tHead}>Paid Date</th>
                <th style={{ ...tHead, textAlign: "right" }}>Action</th>
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
                        ? <button type="button" style={btnSmSuccess} onClick={() => markPaid(p.id)} disabled={marking === p.id}>{marking === p.id ? "…" : "✅ Mark paid"}</button>
                        : <span style={{ fontSize: "12px", fontWeight: 700, color: COLOR.green }}>✅ Paid</span>}
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
        title="Reminders"
        sub="Automated billing reminders — pending email service integration"
      />

      {/* Future state notice */}
      <div style={{
        background: "white", border: `1px solid ${COLOR.slateBorder}`, borderRadius: "12px",
        padding: "32px", marginBottom: "24px", display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap"
      }}>
        <div style={{ fontSize: "40px", flexShrink: 0 }}>📧</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "16px", color: COLOR.text, marginBottom: "6px" }}>
            Automated reminders will be available after email service integration
          </div>
          <div style={{ fontSize: "14px", color: COLOR.muted, lineHeight: 1.7, marginBottom: "16px" }}>
            Once an email provider is connected (SMTP / SendGrid / Mailgun), the platform will be able to
            automatically send billing reminders, invoice notifications and overdue alerts to company billing contacts.
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
            Accounts that would receive reminders ({rows.length})
          </div>
          <div style={tblWrap}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={tHead}>Company</th>
                  <th style={tHead}>Billing Email</th>
                  <th style={tHead}>Type</th>
                  <th style={tHead}>Next Due</th>
                  <th style={tHead}>Status</th>
                  <th style={{ ...tHead, textAlign: "right" }}>Action</th>
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
                      <td style={cell}><span style={{ fontSize: "12px", color: COLOR.muted, fontWeight: 600 }}>Monthly invoice</span></td>
                      <td style={cell}>{r.dueDate}</td>
                      <td style={cell}><Badge status={r.status} /></td>
                      <td style={{ ...cell, textAlign: "right" }}>
                        <button
                          type="button"
                          style={{ ...btnSmGhost, opacity: 0.5, cursor: "not-allowed" }}
                          title="Email sending not connected yet"
                          onClick={() => alert("ℹ️ Email service not connected yet.\nThis button will be functional after email integration is configured.")}
                        >
                          📧 Send reminder
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
          No paid accounts eligible for reminders.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: Admin Console
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",      label: "Overview",       icon: "📊" },
  { key: "companies",     label: "Companies",      icon: "🏢" },
  { key: "subscriptions", label: "Subscriptions",  icon: "📋" },
  { key: "payments",      label: "Payments",       icon: "💳" },
  { key: "reminders",     label: "Reminders",      icon: "🔔" },
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
