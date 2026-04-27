import React, { useState } from "react";

const DEMO_DOCS = [
  { id: 1, project: "PROJ-001", client: "Veho Logistics", type: "CMR",    file: "cmr_001.pdf", uploaded: "2026-04-10", status: "ok" },
  { id: 2, project: "PROJ-001", client: "Veho Logistics", type: "Orderis",file: "ord_001.pdf", uploaded: "2026-04-10", status: "ok" },
  { id: 3, project: "PROJ-001", client: "Veho Logistics", type: "Sąskaita",file: "inv_001.pdf", uploaded: "2026-04-11", status: "ok" },
  { id: 4, project: "PROJ-002", client: "DSV Solutions",  type: "CMR",    file: "-",           uploaded: "-",          status: "missing" },
  { id: 5, project: "PROJ-002", client: "DSV Solutions",  type: "Orderis",file: "ord_002.pdf", uploaded: "2026-04-12", status: "ok" },
  { id: 6, project: "PROJ-003", client: "Schenker MB",    type: "CMR",    file: "-",           uploaded: "-",          status: "missing" },
  { id: 7, project: "PROJ-003", client: "Schenker MB",    type: "POD",    file: "-",           uploaded: "-",          status: "missing" },
];

const DOC_TYPES = ["Orderiai", "CMR", "POD", "Sąskaitos", "Kita"];
const stub = () => alert("Funkcija dar neveikia");

const missingCount = DEMO_DOCS.filter(d => d.status === "missing").length;
const missingProjects = [...new Set(DEMO_DOCS.filter(d => d.status === "missing").map(d => d.project))].length;

const StatusIcon = ({ status }) =>
  status === "ok" ? <span style={S.statusOk}>✅ Įkelta</span> : <span style={S.statusMissing}>❌ Trūksta</span>;

export default function Dokumentai() {
  const [activeType, setActiveType] = useState("all");

  const filtered = activeType === "all"
    ? DEMO_DOCS
    : DEMO_DOCS.filter(d => d.type === activeType);

  return (
    <div>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h2 style={S.pageTitle}>📄 Dokumentai</h2>
          <p style={S.pageSubtitle}>CMR, POD, orderiai, sąskaitos ir kiti dokumentai</p>
        </div>
        <button style={S.uploadBtn} onClick={stub}>⬆️ Įkelti dokumentą</button>
      </div>

      {/* Warning */}
      <div style={S.warningBox}>
        <span style={{ fontSize: "20px" }}>🚧</span>
        <div>
          <strong>Modulis kūrimo stadijoje</strong>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>
            Dokumentų valdymo funkcijos dar neįgyvendintos. Rodomi demonstraciniai duomenys.
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={S.cardGrid}>
        <SummaryCard icon="📁" label="Viso dokumentų" value={DEMO_DOCS.filter(d => d.status === "ok").length} color="#1e3a8a" />
        <SummaryCard icon="❌" label="Trūkstami" value={missingCount} color="#b91c1c" />
        <SummaryCard icon="🗂️" label="Projektai su trūkumais" value={missingProjects} color="#b45309" />
        <SummaryCard icon="✅" label="Pilni projektai" value={3 - missingProjects} color="#15803d" />
      </div>

      {/* Type filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
        <button
          style={{ ...S.chip, ...(activeType === "all" ? S.chipActive : {}) }}
          onClick={() => setActiveType("all")}
        >
          Visi
        </button>
        {DOC_TYPES.map(t => (
          <button
            key={t}
            style={{ ...S.chip, ...(activeType === t ? S.chipActive : {}) }}
            onClick={() => setActiveType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={S.tHead}>
              <th style={S.th}>Projektas</th>
              <th style={S.th}>Klientas</th>
              <th style={S.th}>Tipas</th>
              <th style={S.th}>Failas</th>
              <th style={S.th}>Įkelta</th>
              <th style={S.th}>Statusas</th>
              <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => (
              <tr key={doc.id} style={{ background: doc.status === "missing" ? "#fff7f7" : i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={S.td}><strong style={{ color: "#1e3a8a" }}>{doc.project}</strong></td>
                <td style={S.td}>{doc.client}</td>
                <td style={S.td}><TypeBadge type={doc.type} /></td>
                <td style={S.td}>
                  {doc.file !== "-"
                    ? <span style={S.fileName}>📎 {doc.file}</span>
                    : <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                  }
                </td>
                <td style={S.td}>{doc.uploaded}</td>
                <td style={S.td}><StatusIcon status={doc.status} /></td>
                <td style={{ ...S.td, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    {doc.status === "ok"
                      ? <button style={S.iconBtn} onClick={stub} title="Peržiūrėti">👁️</button>
                      : <button style={{ ...S.iconBtn, background: "#eff6ff" }} onClick={stub} title="Įkelti">⬆️</button>
                    }
                    <button style={{ ...S.iconBtn, background: "#ede9fe" }} onClick={stub} title="Redaguoti">✏️</button>
                    <button style={{ ...S.iconBtn, background: "#fee2e2" }} onClick={stub} title="Ištrinti">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={S.footerNote}>
        Trūksta dokumentų: <strong>{missingProjects} projektai</strong>
        <span style={{ margin: "0 16px", color: "#d1d5db" }}>|</span>
        🚧 Demo duomenys — dokumentų įkėlimas neveikia
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ ...S.summaryCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function TypeBadge({ type }) {
  const map = {
    CMR:      { bg: "#dbeafe", color: "#1d4ed8" },
    POD:      { bg: "#dcfce7", color: "#15803d" },
    Orderis:  { bg: "#fef3c7", color: "#b45309" },
    Sąskaita: { bg: "#fae8ff", color: "#7e22ce" },
    Kita:     { bg: "#f1f5f9", color: "#475569" },
  };
  const s = map[type] || map.Kita;
  return <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: s.bg, color: s.color }}>{type}</span>;
}

const S = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  pageTitle: { margin: 0, fontSize: "22px", fontWeight: 700, color: "#1e3a8a" },
  pageSubtitle: { margin: "4px 0 0", fontSize: "13px", color: "#64748b" },
  uploadBtn: {
    background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
    color: "white", border: "none", padding: "11px 18px",
    borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "13px",
  },
  warningBox: {
    display: "flex", alignItems: "center", gap: "12px",
    background: "#FEF3C7", border: "2px solid #F59E0B",
    borderRadius: "8px", padding: "16px", marginBottom: "20px",
    color: "#92400e", fontSize: "14px",
  },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" },
  summaryCard: { background: "#f8fafc", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  chip: {
    background: "#f1f5f9", color: "#475569",
    border: "1px solid #e2e8f0", padding: "6px 14px",
    borderRadius: "20px", cursor: "pointer",
    fontWeight: 500, fontSize: "13px",
  },
  chipActive: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #93c5fd", fontWeight: 700 },
  tableWrap: { borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: "16px" },
  table: { width: "100%", borderCollapse: "collapse", background: "white" },
  tHead: { background: "#f8fafc" },
  th: {
    padding: "11px 14px", textAlign: "left", fontSize: "12px",
    fontWeight: 700, color: "#475569", textTransform: "uppercase",
    letterSpacing: "0.4px", borderBottom: "2px solid #e2e8f0",
  },
  td: { padding: "11px 14px", fontSize: "13px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", verticalAlign: "middle" },
  fileName: { fontSize: "12px", color: "#1d4ed8", fontWeight: 500 },
  iconBtn: { background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "14px" },
  statusOk: { display: "inline-block", padding: "3px 9px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "#f0fdf4", color: "#15803d" },
  statusMissing: { display: "inline-block", padding: "3px 9px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "#fef2f2", color: "#b91c1c" },
  footerNote: {
    textAlign: "center", padding: "14px",
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: "8px", fontSize: "13px", color: "#475569",
  },
};
