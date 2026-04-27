import React, { useState } from "react";

const DEMO_INVOICES = [
  { id: 1, project: "PROJ-001", client: "Veho Logistics", invoiceNr: "INV-2026-001", amount: 1200, currency: "€", due: "2026-05-10", paid: false },
  { id: 2, project: "PROJ-002", client: "DSV Solutions",  invoiceNr: "INV-2026-002", amount: 2400, currency: "€", due: "2026-06-01", paid: true  },
  { id: 3, project: "PROJ-003", client: "Schenker MB",    invoiceNr: "INV-2026-003", amount: 980,  currency: "€", due: "2026-05-20", paid: false },
  { id: 4, project: "PROJ-004", client: "Rhenus Freight",invoiceNr: "INV-2026-004", amount: 3150, currency: "€", due: "2026-06-15", paid: true  },
];

const DEMO_CARRIER_INVOICES = [
  { id: 1, project: "PROJ-001", carrier: "UAB Transportas", invoiceNr: "CINV-001", amount: 900,  due: "2026-05-15", paid: false },
  { id: 2, project: "PROJ-002", carrier: "Logistics Pro",   invoiceNr: "CINV-002", amount: 1800, due: "2026-06-05", paid: true  },
];

const stub = () => alert("Funkcija dar neveikia");

const TABS = ["Kliento sąskaitos", "Vežėjo sąskaitos", "Mokėjimai"];

const totalUnpaid = DEMO_INVOICES.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);
const totalRevenue = DEMO_INVOICES.reduce((s, i) => s + i.amount, 0);
const totalCost    = DEMO_CARRIER_INVOICES.reduce((s, i) => s + i.amount, 0);
const totalMargin  = totalRevenue - totalCost;

export default function Finansai() {
  const [activeTab, setActiveTab] = useState("Kliento sąskaitos");

  return (
    <div>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h2 style={S.pageTitle}>💰 Finansai</h2>
          <p style={S.pageSubtitle}>Sąskaitų valdymas, mokėjimai ir finansinė ataskaita</p>
        </div>
      </div>

      {/* Warning */}
      <div style={S.warningBox}>
        <span style={{ fontSize: "20px" }}>🚧</span>
        <div>
          <strong>Modulis kūrimo stadijoje</strong>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>
            Finansų valdymo funkcijos dar neįgyvendintos. Žemiau rodomi demonstraciniai duomenys.
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={S.cardGrid}>
        <SummaryCard icon="📥" label="Viso pajamų" value={`${totalRevenue.toLocaleString("lt-LT")} €`} color="#15803d" />
        <SummaryCard icon="📤" label="Viso išlaidų" value={`${totalCost.toLocaleString("lt-LT")} €`} color="#c2410c" />
        <SummaryCard icon="💹" label="Bendra marža" value={`${totalMargin.toLocaleString("lt-LT")} €`} color="#1e3a8a" />
        <SummaryCard icon="⏳" label="Neapmokėta" value={`${totalUnpaid.toLocaleString("lt-LT")} €`} color="#b45309" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        {TABS.map(label => (
          <button
            key={label}
            style={{ ...S.tabBtn, ...(activeTab === label ? S.tabBtnActive : {}) }}
            onClick={() => setActiveTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {activeTab === "Kliento sąskaitos" && (
        <div>
          <div style={S.tableActions}>
            <span style={{ fontWeight: 600, color: "#1e3a8a" }}>Kliento sąskaitos ({DEMO_INVOICES.length})</span>
            <button style={S.addBtn} onClick={stub}>+ Nauja sąskaita</button>
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr style={S.tHead}>
                  <th style={S.th}>Projektas</th>
                  <th style={S.th}>Klientas</th>
                  <th style={S.th}>Sąsk. Nr.</th>
                  <th style={S.th}>Suma</th>
                  <th style={S.th}>Terminas</th>
                  <th style={S.th}>Apmokėta</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_INVOICES.map((inv, i) => (
                  <tr key={inv.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                    <td style={S.td}><strong style={{ color: "#1e3a8a" }}>{inv.project}</strong></td>
                    <td style={S.td}>{inv.client}</td>
                    <td style={S.td}><code style={S.code}>{inv.invoiceNr}</code></td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{inv.amount.toLocaleString("lt-LT")} {inv.currency}</td>
                    <td style={S.td}>{inv.due}</td>
                    <td style={S.td}>{inv.paid ? "✅" : "❌"}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button style={S.iconBtn} onClick={stub} title="Peržiūrėti">👁️</button>
                        <button style={{ ...S.iconBtn, background: "#ede9fe" }} onClick={stub} title="Redaguoti">✏️</button>
                        <button style={{ ...S.iconBtn, background: "#fee2e2" }} onClick={stub} title="Ištrinti">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Vežėjo sąskaitos" && (
        <div>
          <div style={S.tableActions}>
            <span style={{ fontWeight: 600, color: "#1e3a8a" }}>Vežėjo sąskaitos ({DEMO_CARRIER_INVOICES.length})</span>
            <button style={S.addBtn} onClick={stub}>+ Nauja sąskaita</button>
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr style={S.tHead}>
                  <th style={S.th}>Projektas</th>
                  <th style={S.th}>Vežėjas</th>
                  <th style={S.th}>Sąsk. Nr.</th>
                  <th style={S.th}>Suma</th>
                  <th style={S.th}>Terminas</th>
                  <th style={S.th}>Apmokėta</th>
                  <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CARRIER_INVOICES.map((inv, i) => (
                  <tr key={inv.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                    <td style={S.td}><strong style={{ color: "#1e3a8a" }}>{inv.project}</strong></td>
                    <td style={S.td}>{inv.carrier}</td>
                    <td style={S.td}><code style={S.code}>{inv.invoiceNr}</code></td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{inv.amount.toLocaleString("lt-LT")} €</td>
                    <td style={S.td}>{inv.due}</td>
                    <td style={S.td}>{inv.paid ? "✅" : "❌"}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button style={S.iconBtn} onClick={stub} title="Peržiūrėti">👁️</button>
                        <button style={{ ...S.iconBtn, background: "#ede9fe" }} onClick={stub} title="Redaguoti">✏️</button>
                        <button style={{ ...S.iconBtn, background: "#fee2e2" }} onClick={stub} title="Ištrinti">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "Mokėjimai" && (
        <div style={S.emptyState}>
          <div style={{ fontSize: "48px", marginBottom: "14px" }}>💳</div>
          <div style={{ fontSize: "16px", fontWeight: 600, color: "#1e3a8a", marginBottom: "8px" }}>
            Mokėjimų sąrašas
          </div>
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            🚧 Mokėjimų valdymo funkcija bus pridėta Phase 2
          </div>
          <button style={{ ...S.addBtn, marginTop: "20px" }} onClick={stub}>+ Registruoti mokėjimą</button>
        </div>
      )}

      {/* Summary row */}
      <div style={S.summaryRow}>
        <div style={S.summaryItem}>
          <span style={{ color: "#64748b" }}>Viso neapmokėta:</span>
          <strong style={{ color: "#c2410c", marginLeft: "8px" }}>{totalUnpaid.toLocaleString("lt-LT")} €</strong>
        </div>
        <div style={S.summaryItem}>
          <span style={{ color: "#64748b" }}>Viso marža:</span>
          <strong style={{ color: "#15803d", marginLeft: "8px" }}>{totalMargin.toLocaleString("lt-LT")} €</strong>
        </div>
        <div style={S.summaryItem}>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>🚧 Demo duomenys — funkcija neveikia</span>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ ...S.summaryCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "24px", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

const S = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  pageTitle: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#1e3a8a" },
  pageSubtitle: { margin: "4px 0 0", fontSize: "13px", color: "#64748b" },
  warningBox: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#FEF3C7", border: "2px solid #F59E0B",
    borderRadius: "8px", padding: "16px", marginBottom: "20px",
    color: "#92400e", fontSize: "14px",
  },
  cardGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
    gap: "14px", marginBottom: "22px",
  },
  summaryCard: {
    background: "#f8fafc", borderRadius: "12px",
    padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  tabBtn: {
    background: "#f1f5f9", color: "#475569",
    border: "1px solid #e2e8f0", padding: "9px 18px",
    borderRadius: "8px", cursor: "pointer",
    fontWeight: 500, fontSize: "13px",
  },
  tabBtnActive: {
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    color: "white", border: "1px solid transparent", fontWeight: 700,
  },
  tableActions: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "12px",
  },
  addBtn: {
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    color: "white", border: "none", padding: "9px 16px",
    borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  tableWrap: { borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "16px" },
  table: { width: "100%", borderCollapse: "collapse", background: "white" },
  tHead: { background: "#f8fafc" },
  th: {
    padding: "11px 14px", textAlign: "left", fontSize: "12px",
    fontWeight: 700, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.4px", borderBottom: "2px solid #e2e8f0",
  },
  td: { padding: "11px 14px", fontSize: "13px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", verticalAlign: "middle" },
  code: { background: "#eff6ff", color: "#1d4ed8", padding: "2px 7px", borderRadius: "5px", fontSize: "12px", fontFamily: "monospace", fontWeight: 700 },
  iconBtn: { background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "14px" },
  emptyState: {
    textAlign: "center", padding: "50px 20px",
    background: "#f8fafc", borderRadius: "12px",
    border: "1px solid #e2e8f0", marginBottom: "16px",
  },
  summaryRow: {
    display: "flex", gap: "24px", alignItems: "center",
    padding: "14px 18px", background: "#f8fafc",
    borderRadius: "10px", border: "1px solid #e2e8f0",
  },
  summaryItem: { display: "flex", alignItems: "center", fontSize: "14px" },
};
