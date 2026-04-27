import React, { useState } from "react";

const DEMO_PROJECTS = [
  { id: "PROJ-001", client: "Veho Logistics", route: "Vilnius → Berlin", carrier: "-", orderId: "-", portalLink: "-", status: "new" },
  { id: "PROJ-002", client: "DSV Solutions",  route: "Kaunas → Warsaw",  carrier: "-", orderId: "-", portalLink: "-", status: "new" },
  { id: "PROJ-003", client: "Schenker MB",    route: "Klaipėda → Hamburg", carrier: "-", orderId: "-", portalLink: "-", status: "new" },
];

const stub = () => alert("Funkcija dar neveikia");

const NotReady = ({ text = "Dar neįgyvendinta" }) => (
  <span style={S.notReady}>⚠️ {text}</span>
);

const StatusBadge = ({ status }) => {
  const map = {
    new:         { bg: "#eff6ff", color: "#1d4ed8", label: "Naujas" },
    assigned:    { bg: "#f0fdf4", color: "#15803d", label: "Priskirtas" },
    in_progress: { bg: "#fff7ed", color: "#c2410c", label: "Vykdomas" },
    done:        { bg: "#bbf7d0", color: "#14532d", label: "Baigtas" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return <span style={{ ...S.badge, background: s.bg, color: s.color }}>{s.label}</span>;
};

const TABS = ["Vežėjo priskyrimas", "Orderio generavimas", "Portalas"];

export default function Ekspedijavimas() {
  const [activeTab, setActiveTab] = useState("Vežėjo priskyrimas");

  return (
    <div>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h2 style={S.pageTitle}>📦 Ekspedijavimas</h2>
          <p style={S.pageSubtitle}>Vežėjų priskyrimas, orderių generavimas ir portalų valdymas</p>
        </div>
      </div>

      {/* Global warning */}
      <div style={S.warningBox}>
        <span style={{ fontSize: "20px" }}>🚧</span>
        <div>
          <strong>Modulis kūrimo stadijoje</strong>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>
            Ekspedijavimo funkcijos bus įdiegtos Phase 2. Žemiau rodomi demonstraciniai duomenys.
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {TABS.map(label => (
          <button
            key={label}
            style={{ ...S.tabBtn, ...(activeTab === label ? S.tabBtnActive : {}) }}
            onClick={() => { setActiveTab(label); stub(); }}
          >
            {label === "Vežėjo priskyrimas" && "🚛 "}
            {label === "Orderio generavimas" && "📄 "}
            {label === "Portalas" && "🔗 "}
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={S.tHead}>
              <th style={S.th}>Projekto Nr.</th>
              <th style={S.th}>Klientas</th>
              <th style={S.th}>Maršrutas</th>
              <th style={S.th}>Vežėjas</th>
              <th style={S.th}>Orderis</th>
              <th style={S.th}>Portalas</th>
              <th style={S.th}>Statusas</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PROJECTS.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={S.td}><strong style={{ color: "#1e3a8a" }}>{p.id}</strong></td>
                <td style={S.td}>{p.client}</td>
                <td style={S.td}>{p.route}</td>
                <td style={S.td}>
                  <button style={S.assignBtn} onClick={stub}>+ Priskirti</button>
                </td>
                <td style={S.td}>
                  <button style={S.generateBtn} onClick={stub}>📄 Gen.</button>
                </td>
                <td style={S.td}>
                  <button style={S.portalBtn} onClick={stub}>🔗 Link</button>
                </td>
                <td style={S.td}><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div style={S.footerNote}>
        ⚠️ Funkcijos bus įdiegtos Phase 2 — visi veiksmai kol kas neaktyvūs
      </div>
    </div>
  );
}

const S = {
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 700,
    color: "#1e3a8a",
  },
  pageSubtitle: {
    margin: "4px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },
  warningBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#FEF3C7",
    border: "2px solid #F59E0B",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px",
    color: "#92400e",
    fontSize: "14px",
  },
  tabBtn: {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    padding: "9px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "13px",
  },
  tabBtnActive: {
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    color: "white",
    border: "1px solid transparent",
    fontWeight: 700,
  },
  tableWrap: {
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    marginBottom: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "white",
  },
  tHead: {
    background: "#f8fafc",
  },
  th: {
    padding: "11px 14px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    borderBottom: "2px solid #e2e8f0",
  },
  td: {
    padding: "12px 14px",
    fontSize: "13px",
    color: "#1e293b",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "middle",
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
  },
  assignBtn: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  generateBtn: {
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: "6px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  portalBtn: {
    background: "#faf5ff",
    color: "#7c3aed",
    border: "1px solid #ddd6fe",
    borderRadius: "6px",
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  notReady: {
    display: "inline-block",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    borderRadius: "8px",
    padding: "3px 10px",
    fontSize: "12px",
    fontWeight: 600,
  },
  footerNote: {
    textAlign: "center",
    padding: "14px",
    background: "#FEF3C7",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#92400e",
    fontWeight: 500,
  },
};
