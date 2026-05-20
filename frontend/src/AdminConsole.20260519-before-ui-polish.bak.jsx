/**
 * TransFlow — Admin Console
 * Atskiras modulis platformos savininkui (isPlatformAdmin === true).
 * Pasiekiamas per viršutinį meniu → "Admin Console".
 * Paprasti company vartotojai (admin/manager/accounting/carrier) šio modulio nemato.
 */

import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// ── Shared styles ─────────────────────────────────────────────────────────────
const btn        = { background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 600 };
const btnSm      = { ...btn, padding: "5px 12px", fontSize: "12px" };
const btnSecondary = { ...btn, background: "#64748b" };
const btnSmSecondary = { ...btnSecondary, padding: "5px 12px", fontSize: "12px" };
const btnSuccess = { ...btn, background: "#16a34a" };
const btnSmSuccess = { ...btnSuccess, padding: "5px 12px", fontSize: "12px" };
const btnSmTeal  = { ...btn, background: "#0f766e", padding: "5px 12px", fontSize: "12px" };
const tbl        = { width: "100%", borderCollapse: "collapse" };
const tHead      = { background: "#f8fafc", padding: "12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" };
const tCell      = { padding: "14px 12px", borderTop: "1px solid #e2e8f0", color: "#1e293b", verticalAlign: "top" };
const lbl        = { fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "8px", display: "block" };
const inp        = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px", width: "100%", boxSizing: "border-box" };
const fGroup     = { display: "flex", flexDirection: "column" };
const fGrid      = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" };

const ROLE_OPTIONS = [
  { value: "admin",      label: "Administratorius" },
  { value: "manager",    label: "Vadybininkas"      },
  { value: "accounting", label: "Buhalterija"       },
  { value: "carrier",    label: "Vežėjas"           },
];

const planLabel  = p => ({ basic: "Basic", pro: "Pro", enterprise: "Enterprise", internal: "Internal" }[p] || p || "—");
const fmtEur     = n  => `${Number(n || 0).toFixed(2)} EUR`;

function StatusBadge({ status }) {
  const m = {
    active:    { bg: "#dcfce7", color: "#166534" },
    trial:     { bg: "#fef9c3", color: "#854d0e" },
    suspended: { bg: "#fee2e2", color: "#991b1b" },
    paid:      { bg: "#dcfce7", color: "#166534" },
    pending:   { bg: "#fef9c3", color: "#854d0e" },
    overdue:   { bg: "#fee2e2", color: "#991b1b" },
  }[status] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: m.bg, color: m.color }}>
      {status || "—"}
    </span>
  );
}

// ── Disclaimer strip ──────────────────────────────────────────────────────────
function BillingDisclaimer() {
  return (
    <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "10px 16px", fontSize: "12px", color: "#92400e", marginBottom: "20px" }}>
      ⚠️ Payments are currently tracked manually. Payment gateway integration will be added later.
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [kpi,     setKpi]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/platform/overview`)
      .then(r => r.json())
      .then(d => { if (d.totalCompanies !== undefined) setKpi(d); else setErr(d.error || "Klaida"); })
      .catch(() => setErr("Serverio klaida"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "40px", color: "#64748b", textAlign: "center" }}>Kraunama...</div>;
  if (err)     return <div style={{ padding: "16px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>❌ {err}</div>;

  const kpiCards = [
    { label: "Total companies",      value: kpi.totalCompanies,          color: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Active companies",     value: kpi.activeCompanies,         color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Trial companies",      value: kpi.trialCompanies,          color: "#854d0e", bg: "#fefce8", border: "#fef08a" },
    { label: "Suspended companies",  value: kpi.suspendedCompanies,      color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
    { label: "Total active users",   value: kpi.totalActiveUsers,        color: "#1e3a8a", bg: "#eff6ff", border: "#bfdbfe" },
    { label: "Monthly recurring revenue", value: fmtEur(kpi.monthlyRecurringRevenue), color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Overdue payments",     value: kpi.overduePaymentsCount,    color: kpi.overduePaymentsCount > 0 ? "#991b1b" : "#475569", bg: kpi.overduePaymentsCount > 0 ? "#fef2f2" : "#f8fafc", border: kpi.overduePaymentsCount > 0 ? "#fecaca" : "#e2e8f0" },
    { label: "Upcoming renewals (30d)", value: kpi.upcomingRenewalsCount, color: "#854d0e", bg: "#fefce8", border: "#fef08a" },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", color: "#1e3a8a" }}>📊 Platform Overview</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
        {kpiCards.map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "12px", padding: "20px 22px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{c.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "20px", fontSize: "12px", color: "#94a3b8" }}>
        KPI skaičiuojami realiu laiku iš companies.json ir users.json.
        Overdue / Upcoming — iš platformPayments.json.
      </div>
    </div>
  );
}

// ── Tab: Companies ────────────────────────────────────────────────────────────
function CompaniesTab() {
  const [companies,   setCompanies]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadErr,     setLoadErr]     = useState("");
  const [showForm,    setShowForm]    = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [showAdminForm, setShowAdminForm] = useState(null);
  const [saving,      setSaving]      = useState(false);

  const emptyCompanyForm = { name: "", code: "", vat: "", billingEmail: "", country: "", phone: "", plan: "basic", status: "active", basePrice: 150, includedUsers: 1, extraUserPrice: 50, currency: "EUR" };
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const emptyAdminForm = { name: "", email: "", password: "", role: "admin", status: "active" };
  const [adminForm,   setAdminForm]   = useState(emptyAdminForm);

  const load = () => {
    setLoading(true); setLoadErr("");
    fetch(`${API_BASE}/api/platform/companies`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCompanies(d); else setLoadErr(d.error || "Klaida"); })
      .catch(() => setLoadErr("Serverio klaida"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditCompany(null); setCompanyForm(emptyCompanyForm); setShowAdminForm(null); setShowForm(true); };
  const openEdit = c => {
    setEditCompany(c);
    setCompanyForm({ name: c.name||"", code: c.code||"", vat: c.vat||"", billingEmail: c.billingEmail||"", country: c.country||"", phone: c.phone||"", plan: c.plan||"basic", status: c.status||"active", basePrice: c.basePrice??150, includedUsers: c.includedUsers??1, extraUserPrice: c.extraUserPrice??50, currency: c.currency||"EUR" });
    setShowAdminForm(null); setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditCompany(null); setCompanyForm(emptyCompanyForm); };

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) { alert("Pavadinimas būtinas"); return; }
    setSaving(true);
    try {
      const url    = editCompany ? `${API_BASE}/api/platform/companies/${editCompany.id}` : `${API_BASE}/api/platform/companies`;
      const method = editCompany ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(companyForm) });
      const data   = await res.json();
      if (!res.ok) { alert(data.error || "Klaida"); return; }
      cancelForm(); load();
    } catch { alert("Serverio klaida"); }
    finally { setSaving(false); }
  };

  const openAdminForm  = id  => { setShowAdminForm(id); setAdminForm(emptyAdminForm); setShowForm(false); };
  const cancelAdminForm = () => { setShowAdminForm(null); setAdminForm(emptyAdminForm); };

  const handleSaveAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) { alert("Privalomi laukai: vardas, el. paštas, slaptažodis"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/platform/companies/${showAdminForm}/admin-user`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adminForm) });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Klaida"); return; }
      alert(`✅ Vartotojas sukurtas: ${data.email}`);
      cancelAdminForm(); load();
    } catch { alert("Serverio klaida"); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: "40px", color: "#64748b", textAlign: "center" }}>Kraunama...</div>;
  if (loadErr) return <div style={{ padding: "16px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>❌ {loadErr}</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>🏢 Companies</h3>
        <button type="button" style={btn} onClick={openNew}>+ Nauja įmonė</button>
      </div>

      <BillingDisclaimer />

      {showForm && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "24px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 18px", color: "#1e3a8a" }}>{editCompany ? "✏️ Redaguoti įmonę" : "➕ Nauja įmonė"}</h4>
          <div style={fGrid}>
            {[{ k:"name",lbl:"Pavadinimas *",type:"text"},{k:"code",lbl:"Įmonės kodas",type:"text"},{k:"vat",lbl:"PVM kodas",type:"text"},{k:"billingEmail",lbl:"Billing email",type:"email"},{k:"country",lbl:"Šalis",type:"text"},{k:"phone",lbl:"Telefonas",type:"text"}].map(({ k, lbl: l, type }) => (
              <div key={k} style={fGroup}><label style={lbl}>{l}</label><input style={inp} type={type} value={companyForm[k]} onChange={e => setCompanyForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div style={fGroup}><label style={lbl}>Planas</label>
              <select style={inp} value={companyForm.plan} onChange={e => setCompanyForm(f => ({ ...f, plan: e.target.value }))}>
                <option value="basic">Basic</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div style={fGroup}><label style={lbl}>Statusas</label>
              <select style={inp} value={companyForm.status} onChange={e => setCompanyForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">✅ Active</option><option value="trial">🟡 Trial</option><option value="suspended">⛔ Suspended</option>
              </select>
            </div>
            {[{k:"basePrice",lbl:"Bazinė kaina (EUR/mėn.)"},{k:"includedUsers",lbl:"Įtraukti vartotojai"},{k:"extraUserPrice",lbl:"Papild. vartotojas (EUR/mėn.)"}].map(({ k, lbl: l }) => (
              <div key={k} style={fGroup}><label style={lbl}>{l}</label><input style={inp} type="number" min="0" value={companyForm[k]} onChange={e => setCompanyForm(f => ({ ...f, [k]: Number(e.target.value) }))} /></div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            <button type="button" style={btnSuccess} onClick={handleSaveCompany} disabled={saving}>{saving ? "Saugoma..." : "💾 Išsaugoti"}</button>
            <button type="button" style={btnSecondary} onClick={cancelForm}>Atšaukti</button>
          </div>
        </div>
      )}

      {showAdminForm && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "24px", marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 16px", color: "#166534" }}>👤 Sukurti admin vartotoją — {companies.find(c => c.id === showAdminForm)?.name}</h4>
          <div style={fGrid}>
            {[{k:"name",lbl:"Vardas *",type:"text"},{k:"email",lbl:"El. paštas *",type:"email"},{k:"password",lbl:"Slaptažodis *",type:"password"}].map(({ k, lbl: l, type }) => (
              <div key={k} style={fGroup}><label style={lbl}>{l}</label><input style={inp} type={type} value={adminForm[k]} autoComplete="new-password" onChange={e => setAdminForm(f => ({ ...f, [k]: e.target.value }))} /></div>
            ))}
            <div style={fGroup}><label style={lbl}>Rolė</label>
              <select style={inp} value={adminForm.role} onChange={e => setAdminForm(f => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
            <button type="button" style={btnSuccess} onClick={handleSaveAdmin} disabled={saving}>{saving ? "Kuriama..." : "👤 Sukurti vartotoją"}</button>
            <button type="button" style={btnSecondary} onClick={cancelAdminForm}>Atšaukti</button>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={tbl}>
          <thead><tr>
            <th style={tHead}>Įmonė</th><th style={tHead}>Statusas</th><th style={tHead}>Planas</th>
            <th style={tHead}>Vartotojai</th><th style={tHead}>Mėn. suma</th><th style={tHead}>Veiksmai</th>
          </tr></thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id}>
                <td style={tCell}>
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  {c.code && <div style={{ fontSize: "12px", color: "#64748b" }}>{c.code}</div>}
                  {c.billingEmail && <div style={{ fontSize: "12px", color: "#64748b" }}>{c.billingEmail}</div>}
                  {c.isBillingExempt && <span style={{ display: "inline-block", marginTop: "4px", padding: "2px 8px", borderRadius: "999px", background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: 700 }}>Internal / Free</span>}
                </td>
                <td style={tCell}><StatusBadge status={c.status} /></td>
                <td style={tCell}>{planLabel(c.plan)}</td>
                <td style={tCell}>
                  <div>{c.activeUsersCount} aktyvūs</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{c.totalUsersCount} iš viso</div>
                </td>
                <td style={tCell}>
                  {c.isBillingExempt
                    ? <span style={{ color: "#166534", fontWeight: 700 }}>0,00 EUR</span>
                    : <span style={{ fontWeight: 700 }}>{Number(c.monthlyTotal || 0).toFixed(2)} {c.currency}</span>}
                </td>
                <td style={tCell}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button type="button" style={btnSm} onClick={() => openEdit(c)}>✏️ Redaguoti</button>
                    <button type="button" style={btnSmTeal} onClick={() => openAdminForm(c.id)}>👤 Admin</button>
                  </div>
                </td>
              </tr>
            ))}
            {companies.length === 0 && <tr><td colSpan={6} style={{ ...tCell, textAlign: "center", color: "#64748b", padding: "40px" }}>Įmonių nėra</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Subscriptions ────────────────────────────────────────────────────────
function SubscriptionsTab() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/platform/companies`)
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) { setErr(d.error || "Klaida"); return; }
        // Derive next billing date: 1st of next month
        const now = new Date();
        const nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString("lt-LT");
        setRows(d.map(c => ({ ...c, nextBillingDate: c.isBillingExempt ? "—" : nextBilling })));
      })
      .catch(() => setErr("Serverio klaida"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "40px", color: "#64748b", textAlign: "center" }}>Kraunama...</div>;
  if (err)     return <div style={{ padding: "16px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>❌ {err}</div>;

  return (
    <div>
      <h3 style={{ margin: "0 0 20px", color: "#1e3a8a" }}>📋 Subscriptions</h3>
      <BillingDisclaimer />
      <div style={{ overflowX: "auto" }}>
        <table style={tbl}>
          <thead><tr>
            <th style={tHead}>Įmonė</th><th style={tHead}>Planas</th><th style={tHead}>Statusas</th>
            <th style={tHead}>Aktyvūs</th><th style={tHead}>Įtraukti</th><th style={tHead}>Papildomi</th>
            <th style={tHead}>Mėn. suma</th><th style={tHead}>Kitas billing</th><th style={tHead}>Billing email</th>
          </tr></thead>
          <tbody>
            {rows.map(c => {
              const extra = c.isBillingExempt ? 0 : Math.max(0, (c.activeUsersCount||0) - (c.includedUsers||1));
              return (
                <tr key={c.id}>
                  <td style={tCell}><div style={{ fontWeight: 700 }}>{c.name}</div>{c.isBillingExempt && <span style={{ display: "inline-block", marginTop: "2px", padding: "2px 6px", borderRadius: "999px", background: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: 700 }}>Free</span>}</td>
                  <td style={tCell}>{planLabel(c.plan)}</td>
                  <td style={tCell}><StatusBadge status={c.status} /></td>
                  <td style={tCell}>{c.activeUsersCount}</td>
                  <td style={tCell}>{c.isBillingExempt ? "∞" : (c.includedUsers ?? 1)}</td>
                  <td style={tCell}>{extra > 0 ? <span style={{ color: "#c2410c", fontWeight: 700 }}>+{extra}</span> : extra}</td>
                  <td style={tCell}>{c.isBillingExempt ? <span style={{ color: "#166534", fontWeight: 700 }}>0,00 EUR</span> : <span style={{ fontWeight: 700 }}>{Number(c.monthlyTotal||0).toFixed(2)} {c.currency}</span>}</td>
                  <td style={tCell}>{c.nextBillingDate}</td>
                  <td style={tCell}>{c.billingEmail || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={9} style={{ ...tCell, textAlign: "center", color: "#64748b", padding: "40px" }}>Nėra duomenų</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Payments ─────────────────────────────────────────────────────────────
function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState("");
  const [marking,  setMarking]  = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/platform/payments`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPayments(d); else setErr(d.error || "Klaida"); })
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

  if (loading) return <div style={{ padding: "40px", color: "#64748b", textAlign: "center" }}>Kraunama...</div>;
  if (err)     return <div style={{ padding: "16px", background: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>❌ {err}</div>;

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", color: "#1e3a8a" }}>💳 Payments</h3>
      <BillingDisclaimer />

      {payments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>💳</div>
          <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>Mokėjimų įrašų nėra</div>
          <div style={{ fontSize: "13px" }}>Mokėjimai bus rodomi čia, kai bus sukurti platformPayments.json įrašai.</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr>
              <th style={tHead}>Įmonė</th><th style={tHead}>Suma</th><th style={tHead}>Valiuta</th>
              <th style={tHead}>Periodas</th><th style={tHead}>Statusas</th>
              <th style={tHead}>Due date</th><th style={tHead}>Paid date</th><th style={tHead}>Veiksmai</th>
            </tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={tCell}>{p.companyName || p.companyId || "—"}</td>
                  <td style={tCell}><span style={{ fontWeight: 700 }}>{Number(p.amount||0).toFixed(2)}</span></td>
                  <td style={tCell}>{p.currency || "EUR"}</td>
                  <td style={tCell}>{p.period || "—"}</td>
                  <td style={tCell}><StatusBadge status={p.status} /></td>
                  <td style={tCell}>{p.dueDate ? new Date(p.dueDate).toLocaleDateString("lt-LT") : "—"}</td>
                  <td style={tCell}>{p.paidDate ? new Date(p.paidDate).toLocaleDateString("lt-LT") : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td style={tCell}>
                    {p.status !== "paid" ? (
                      <button type="button" style={btnSmSuccess} onClick={() => markPaid(p.id)} disabled={marking === p.id}>
                        {marking === p.id ? "..." : "✅ Mark paid"}
                      </button>
                    ) : (
                      <span style={{ color: "#166534", fontSize: "12px", fontWeight: 600 }}>✅ Paid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Tab: Reminders ────────────────────────────────────────────────────────────
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
        // Generate reminder rows for paid companies only
        setRows(
          d
            .filter(c => !c.isBillingExempt && c.status !== "suspended")
            .map(c => ({
              id:           c.id,
              companyName:  c.name,
              billingEmail: c.billingEmail || "—",
              type:         "monthly_invoice",
              dueDate:      nextBilling.toLocaleDateString("lt-LT"),
              status:       c.status === "trial" ? "trial" : "scheduled",
            }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSendReminder = () => {
    alert("ℹ️ Email sending not connected yet.\nThis feature will be available when email integration is configured.");
  };

  if (loading) return <div style={{ padding: "40px", color: "#64748b", textAlign: "center" }}>Kraunama...</div>;

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", color: "#1e3a8a" }}>🔔 Reminders</h3>

      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "12px 16px", fontSize: "13px", color: "#0369a1", marginBottom: "20px" }}>
        ℹ️ Reminder sending is not connected yet. Email integration will be added in a future release.
        Shown rows are derived from active/trial paid companies.
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Nėra mokamų įmonių, kurioms reikėtų priminti.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tbl}>
            <thead><tr>
              <th style={tHead}>Įmonė</th><th style={tHead}>Billing email</th>
              <th style={tHead}>Tipo</th><th style={tHead}>Due date</th>
              <th style={tHead}>Statusas</th><th style={tHead}>Veiksmai</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td style={tCell}><div style={{ fontWeight: 600 }}>{r.companyName}</div></td>
                  <td style={tCell}>{r.billingEmail}</td>
                  <td style={tCell}><span style={{ fontSize: "12px", color: "#475569" }}>Monthly invoice</span></td>
                  <td style={tCell}>{r.dueDate}</td>
                  <td style={tCell}><StatusBadge status={r.status} /></td>
                  <td style={tCell}>
                    <button
                      type="button"
                      style={{ ...btnSmSecondary, opacity: 0.6 }}
                      onClick={handleSendReminder}
                      title="Email sending not connected yet"
                    >
                      📧 Send reminder
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main: Admin Console ───────────────────────────────────────────────────────
export default function AdminConsole() {
  const [tab, setTab] = useState("overview");

  const tabs = [
    { key: "overview",      title: "📊 Overview"      },
    { key: "companies",     title: "🏢 Companies"     },
    { key: "subscriptions", title: "📋 Subscriptions" },
    { key: "payments",      title: "💳 Payments"      },
    { key: "reminders",     title: "🔔 Reminders"     },
  ];

  const renderTab = () => {
    if (tab === "overview")      return <OverviewTab />;
    if (tab === "companies")     return <CompaniesTab />;
    if (tab === "subscriptions") return <SubscriptionsTab />;
    if (tab === "payments")      return <PaymentsTab />;
    if (tab === "reminders")     return <RemindersTab />;
    return null;
  };

  return (
    <div>
      {/* Tab navigation — header provided by AdminApp.jsx outer shell */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding:      "10px 20px",
              borderRadius: "8px",
              border:       "none",
              cursor:       "pointer",
              fontWeight:   600,
              fontSize:     "14px",
              background:   tab === t.key ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "#f1f5f9",
              color:        tab === t.key ? "white" : "#475569",
              boxShadow:    tab === t.key ? "0 2px 8px rgba(30,58,138,0.25)" : "none",
              transition:   "background 0.15s, color 0.15s"
            }}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {renderTab()}
      </div>
    </div>
  );
}
