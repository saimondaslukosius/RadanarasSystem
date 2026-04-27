import React, { useState } from "react";

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_DRIVERS = [
  { id: 1, name: "Jonas Jonaitis",     phone: "+370 600 11111", license: "LT-DRV-001", expiry: "2027-06-30", truck: "ABC 123", status: "active" },
  { id: 2, name: "Petras Petraitis",   phone: "+370 600 22222", license: "LT-DRV-002", expiry: "2026-12-15", truck: "DEF 789", status: "active" },
  { id: 3, name: "Antanas Antanaitis", phone: "+370 600 33333", license: "LT-DRV-003", expiry: "2028-03-20", truck: "-",       status: "idle" },
  { id: 4, name: "Rimas Rimkus",       phone: "+370 600 44444", license: "LT-DRV-004", expiry: "2025-11-01", truck: "-",       status: "leave" },
];

const DEMO_TRUCKS = [
  { id: 1, plate: "ABC 123", model: "Volvo FH16",  year: "2021", mileage: "285 000 km", nextService: "2026-07-01", driver: "Jonas Jonaitis",     status: "active" },
  { id: 2, plate: "DEF 789", model: "Scania R500", year: "2020", mileage: "412 000 km", nextService: "2026-05-15", driver: "Petras Petraitis",   status: "active" },
  { id: 3, plate: "GHI 345", model: "MAN TGX",     year: "2022", mileage: "97 000 km",  nextService: "2026-04-20", driver: "-",                  status: "service" },
];

const DEMO_TRAILERS = [
  { id: 1, plate: "XYZ 456", model: "Schmitz Cargobull SCS", year: "2021", type: "Tentinė", nextService: "2026-08-10", status: "active" },
  { id: 2, plate: "UVW 012", model: "Krone Cool Liner",      year: "2020", type: "Šaldytuvinė", nextService: "2026-06-20", status: "active" },
  { id: 3, plate: "RST 678", model: "Wielton NS",            year: "2019", type: "Tentinė", nextService: "2026-05-01", status: "service" },
];

const DEMO_ASSIGNMENTS = [
  { id: 1, driver: "Jonas Jonaitis", truck: "ABC 123", trailer: "XYZ 456", route: "Vilnius → Berlin",  from: "2026-04-16", to: "2026-04-17", status: "in_progress" },
  { id: 2, driver: "Petras Petraitis", truck: "DEF 789", trailer: "UVW 012", route: "Kaunas → Warsaw", from: "2026-04-17", to: "2026-04-17", status: "scheduled" },
];

const stub = () => alert("Funkcija dar neveikia");

// ── Sub-components ────────────────────────────────────────────────────────────
const WarnBadge = () => (
  <span style={S.notImplBadge}>⚠️ Dar neįgyvendinta</span>
);

const StatusBadge = ({ status, map }) => {
  const s = map[status] || { bg: "#f1f5f9", color: "#475569", label: status };
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: s.bg, color: s.color }}>{s.label}</span>;
};

const driverStatusMap = {
  active: { bg: "#f0fdf4", color: "#15803d", label: "Aktyvus" },
  idle:   { bg: "#f8fafc", color: "#475569", label: "Laisvas" },
  leave:  { bg: "#fef3c7", color: "#b45309", label: "Atostogos" },
};
const vehicleStatusMap = {
  active:  { bg: "#f0fdf4", color: "#15803d", label: "Aktyvus" },
  service: { bg: "#fff7ed", color: "#c2410c", label: "Tech. aptarnavimas" },
  idle:    { bg: "#f8fafc", color: "#475569", label: "Laisvas" },
};
const tripStatusMap = {
  in_progress: { bg: "#fff7ed", color: "#c2410c",  label: "Vykdomas" },
  scheduled:   { bg: "#eff6ff", color: "#1d4ed8",  label: "Suplanuotas" },
  completed:   { bg: "#f0fdf4", color: "#15803d",  label: "Baigtas" },
};

const ActionBtns = () => (
  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
    <button style={S.iconBtn}                          onClick={stub} title="Peržiūrėti">👁️</button>
    <button style={{ ...S.iconBtn, background: "#ede9fe" }} onClick={stub} title="Redaguoti">✏️</button>
    <button style={{ ...S.iconBtn, background: "#fee2e2" }} onClick={stub} title="Ištrinti">🗑️</button>
  </div>
);

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "drivers",     label: "👤 Vairuotojai" },
  { key: "trucks",      label: "🚛 Vilkikai" },
  { key: "trailers",    label: "🚚 Priekabos" },
  { key: "assignments", label: "📋 Priskyrimai" },
];

// ── Main page component ───────────────────────────────────────────────────────
export default function TransportManagement() {
  const [activeTab, setActiveTab] = useState("drivers");

  const activeCount    = DEMO_DRIVERS.filter(d => d.status === "active").length;
  const trucksActive   = DEMO_TRUCKS.filter(t => t.status === "active").length;
  const inService      = [...DEMO_TRUCKS, ...DEMO_TRAILERS].filter(v => v.status === "service").length;
  const assignedNow    = DEMO_ASSIGNMENTS.filter(a => a.status === "in_progress").length;

  return (
    <div>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h2 style={S.pageTitle}>🚛 Transportas</h2>
          <p style={S.pageSubtitle}>Vairuotojų, vilkikų, priekabų ir priskyrimo valdymas</p>
        </div>
      </div>

      {/* Global notice */}
      <div style={S.warningBox}>
        <span style={{ fontSize: "20px" }}>🚧</span>
        <div>
          <strong>Modulis kūrimo stadijoje</strong>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>
            Transporto valdymo funkcijos dar neįgyvendintos. Žemiau rodomi demonstraciniai duomenys.
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={S.cardGrid}>
        <SummaryCard icon="👤" label="Aktyvūs vairuotojai" value={activeCount}  color="#1e3a8a" />
        <SummaryCard icon="🚛" label="Aktyvūs vilkikai"     value={trucksActive} color="#15803d" />
        <SummaryCard icon="🔧" label="Tech. aptarnavime"    value={inService}    color="#c2410c" />
        <SummaryCard icon="📋" label="Šiuo metu vykdo"      value={assignedNow}  color="#7c3aed" />
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button
            key={t.key}
            style={{ ...S.tab, ...(activeTab === t.key ? S.tabActive : {}) }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "drivers"     && <DriversTab />}
      {activeTab === "trucks"      && <TrucksTab />}
      {activeTab === "trailers"    && <TrailersTab />}
      {activeTab === "assignments" && <AssignmentsTab />}
    </div>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color }) {
  return (
    <div style={{ ...S.summaryCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: "24px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

// ── Drivers tab ───────────────────────────────────────────────────────────────
function DriversTab() {
  return (
    <div>
      <div style={S.tabHeader}>
        <h3 style={S.tabTitle}>👤 Vairuotojai</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <WarnBadge />
          <button style={S.addBtn} onClick={stub}>+ Naujas vairuotojas</button>
        </div>
      </div>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={S.tHead}>
              <th style={S.th}>Vardas, pavardė</th>
              <th style={S.th}>Telefonas</th>
              <th style={S.th}>Licencija</th>
              <th style={S.th}>Galioja iki</th>
              <th style={S.th}>Priskirtas vilkikas</th>
              <th style={S.th}>Statusas</th>
              <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_DRIVERS.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={{ ...S.td, fontWeight: 600 }}>{d.name}</td>
                <td style={S.td}>{d.phone}</td>
                <td style={S.td}><code style={S.code}>{d.license}</code></td>
                <td style={S.td}>{d.expiry}</td>
                <td style={S.td}>{d.truck !== "-" ? <code style={S.plate}>{d.truck}</code> : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                <td style={S.td}><StatusBadge status={d.status} map={driverStatusMap} /></td>
                <td style={S.td}><ActionBtns /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Trucks tab ────────────────────────────────────────────────────────────────
function TrucksTab() {
  return (
    <div>
      <div style={S.tabHeader}>
        <h3 style={S.tabTitle}>🚛 Vilkikai</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <WarnBadge />
          <button style={S.addBtn} onClick={stub}>+ Naujas vilkikas</button>
        </div>
      </div>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={S.tHead}>
              <th style={S.th}>Valst. nr.</th>
              <th style={S.th}>Modelis</th>
              <th style={S.th}>Metai</th>
              <th style={S.th}>Rida</th>
              <th style={S.th}>Kitas tech.</th>
              <th style={S.th}>Vairuotojas</th>
              <th style={S.th}>Statusas</th>
              <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TRUCKS.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={S.td}><code style={S.plate}>{t.plate}</code></td>
                <td style={{ ...S.td, fontWeight: 600 }}>{t.model}</td>
                <td style={S.td}>{t.year}</td>
                <td style={S.td}>{t.mileage}</td>
                <td style={S.td}>{t.nextService}</td>
                <td style={S.td}>{t.driver !== "-" ? t.driver : <span style={{ color: "#94a3b8" }}>—</span>}</td>
                <td style={S.td}><StatusBadge status={t.status} map={vehicleStatusMap} /></td>
                <td style={S.td}><ActionBtns /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Trailers tab ──────────────────────────────────────────────────────────────
function TrailersTab() {
  return (
    <div>
      <div style={S.tabHeader}>
        <h3 style={S.tabTitle}>🚚 Priekabos</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <WarnBadge />
          <button style={S.addBtn} onClick={stub}>+ Nauja priekaba</button>
        </div>
      </div>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={S.tHead}>
              <th style={S.th}>Valst. nr.</th>
              <th style={S.th}>Modelis</th>
              <th style={S.th}>Tipas</th>
              <th style={S.th}>Metai</th>
              <th style={S.th}>Kitas tech.</th>
              <th style={S.th}>Statusas</th>
              <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_TRAILERS.map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={S.td}><code style={S.plate}>{t.plate}</code></td>
                <td style={{ ...S.td, fontWeight: 600 }}>{t.model}</td>
                <td style={S.td}>{t.type}</td>
                <td style={S.td}>{t.year}</td>
                <td style={S.td}>{t.nextService}</td>
                <td style={S.td}><StatusBadge status={t.status} map={vehicleStatusMap} /></td>
                <td style={S.td}><ActionBtns /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Assignments tab ───────────────────────────────────────────────────────────
function AssignmentsTab() {
  return (
    <div>
      <div style={S.tabHeader}>
        <h3 style={S.tabTitle}>📋 Priskyrimai</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <WarnBadge />
          <button style={S.addBtn} onClick={stub}>+ Naujas priskyrimas</button>
        </div>
      </div>
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr style={S.tHead}>
              <th style={S.th}>Vairuotojas</th>
              <th style={S.th}>Vilkikas</th>
              <th style={S.th}>Priekaba</th>
              <th style={S.th}>Maršrutas</th>
              <th style={S.th}>Nuo</th>
              <th style={S.th}>Iki</th>
              <th style={S.th}>Statusas</th>
              <th style={{ ...S.th, textAlign: "center" }}>Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_ASSIGNMENTS.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                <td style={{ ...S.td, fontWeight: 600 }}>{a.driver}</td>
                <td style={S.td}><code style={S.plate}>{a.truck}</code></td>
                <td style={S.td}><code style={S.plate}>{a.trailer}</code></td>
                <td style={S.td}>{a.route}</td>
                <td style={S.td}>{a.from}</td>
                <td style={S.td}>{a.to}</td>
                <td style={S.td}><StatusBadge status={a.status} map={tripStatusMap} /></td>
                <td style={S.td}><ActionBtns /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={S.demoNote}>🚧 Demo duomenys — priskyrimų valdymas dar neveikia</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" },
  summaryCard: { background: "#f8fafc", borderRadius: "12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" },
  tabBar: {
    display: "flex", gap: "6px",
    borderBottom: "2px solid #e2e8f0", marginBottom: "20px",
  },
  tab: {
    background: "transparent", border: "none",
    borderBottom: "3px solid transparent",
    padding: "10px 16px", cursor: "pointer",
    fontSize: "14px", fontWeight: 500, color: "#64748b",
    marginBottom: "-2px", borderRadius: "6px 6px 0 0",
  },
  tabActive: {
    color: "#1e3a8a", fontWeight: 700,
    borderBottom: "3px solid #1e3a8a", background: "#eff6ff",
  },
  tabHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  tabTitle: { margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e3a8a" },
  notImplBadge: {
    display: "inline-block", background: "#fff7ed", color: "#c2410c",
    border: "1px solid #fed7aa", borderRadius: "8px",
    padding: "4px 10px", fontSize: "12px", fontWeight: 600,
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
  plate: { background: "#eff6ff", color: "#1d4ed8", padding: "2px 7px", borderRadius: "5px", fontSize: "12px", fontFamily: "monospace", fontWeight: 700 },
  iconBtn: { background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", fontSize: "14px" },
  demoNote: {
    textAlign: "center", padding: "12px",
    background: "#FEF3C7", border: "1px solid #fcd34d",
    borderRadius: "8px", fontSize: "13px", color: "#92400e", fontWeight: 500,
  },
};
