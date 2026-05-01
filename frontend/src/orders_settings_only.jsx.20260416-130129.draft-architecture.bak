
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const pageCard = { background: "white", borderRadius: "12px", padding: "30px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" };
const cardHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #e2e8f0" };
const cardTitle = { fontSize: "22px", color: "#1e3a8a", margin: 0 };
const btn = { background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500, boxShadow: "0 2px 4px rgba(30, 58, 138, 0.3)" };
const btnSecondary = { ...btn, background: "#64748b", boxShadow: "none" };
const btnSuccess = { ...btn, background: "#16a34a", boxShadow: "none" };
const table = { width: "100%", borderCollapse: "collapse" };
const th = { background: "#f8fafc", padding: "12px", textAlign: "left", fontWeight: 600, color: "#475569", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" };
const td = { padding: "14px 12px", borderTop: "1px solid #e2e8f0", color: "#1e293b", verticalAlign: "top" };
const emptyState = { textAlign: "center", padding: "60px 20px", color: "#64748b" };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modal = { background: "white", borderRadius: "12px", padding: "30px", maxWidth: "800px", width: "90%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" };
const modalHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", paddingBottom: "16px", borderBottom: "2px solid #e2e8f0" };
const closeBtn = { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b", padding: 0, width: "32px", height: "32px", borderRadius: "6px" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" };
const formGroup = { display: "flex", flexDirection: "column" };
const label = { fontSize: "14px", fontWeight: 500, color: "#475569", marginBottom: "8px" };
const inputBase = { padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "14px" };
const sectionTitle = { marginBottom: "12px", color: "#1e3a8a", fontSize: "15px" };
const actionButtons = { display: "flex", gap: "10px" };
const actionBtn = { background: "none", border: "none", padding: "6px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "13px" };
const defaultTemplateContent = "<div><h1>Transporto užsakymas {{order_number}}</h1></div>";

/* Shared document CSS — applied identically in Page preview iframes AND print output.
   Both rendering paths reference this constant so preview = print. */
const DOC_CSS = `
  .doc-price-pill { background: linear-gradient(135deg,#667eea 0%,#764ba2 100%) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .doc-terms { font-size: 11px; line-height: 1.65; }
  .doc-terms p { margin: 3px 0 !important; }
  .vezejo-kaina { font-size: 20px !important; font-weight: 700 !important; }
  .doc-info-card, .doc-price-pill, .doc-terms, .doc-parties, .doc-parties-grid { page-break-inside: avoid; break-inside: avoid; }
  .doc-parties-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  /* Hide transparent placeholder when no stamp uploaded */
  img[data-stamp="true"][src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="] { display: none !important; }
`;
const buildDefaultSettings = (source = {}) => ({ environment: source.environment || "test", company: { name: source.company?.name || "", code: source.company?.code || "", vat: source.company?.vat || "", phone: source.company?.phone || "", email: source.company?.email || "", address: source.company?.address || "", bank_name: source.company?.bank_name || "", bank_account: source.company?.bank_account || "", swift: source.company?.swift || "" }, documents: { auto_numbering_format: source.documents?.auto_numbering_format || "RAD-{YEAR}-{NUMBER}", default_language: source.documents?.default_language || "lt", show_vat: source.documents?.show_vat ?? true, terms_lt: source.documents?.terms_lt || "" }, email: { from_address: source.email?.from_address || "", from_name: source.email?.from_name || "", auto_attach_pdf: source.email?.auto_attach_pdf ?? true, always_cc: Array.isArray(source.email?.always_cc) ? source.email.always_cc : [] }, companyStampSignature: source.companyStampSignature || "", templates: Array.isArray(source.templates) ? source.templates : [] });
const createOrderNumber = (orders = []) => {
  let maxSeq = 0;
  for (const o of orders) {
    const m = String(o.orderNumber || "").match(/^RAD(\d+)$/);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  const next = maxSeq > 0 ? maxSeq + 1 : 100001;
  return `RAD${String(next).padStart(6, "0")}`;
};
const euro = (value) => `${Number(value || 0).toFixed(2)} €`;
const badge = (kind) => ({ display: "inline-block", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: kind === "success" ? "#dcfce7" : kind === "danger" ? "#fee2e2" : "#fef3c7", color: kind === "success" ? "#16a34a" : kind === "danger" ? "#dc2626" : "#ca8a04" });
const STATUS_MAP = {
  new:              { bg: "#dbeafe", color: "#1d4ed8", label: "Naujas" },
  confirmed:        { bg: "#fef9c3", color: "#854d0e", label: "Patvirtintas" },
  in_progress:      { bg: "#ffedd5", color: "#9a3412", label: "Vykdomas" },
  delivered:        { bg: "#dcfce7", color: "#15803d", label: "Pristatytas" },
  completed:        { bg: "#bbf7d0", color: "#14532d", label: "Užbaigtas" },
  missing_docs:     { bg: "#fed7aa", color: "#7c2d12", label: "Trūksta dok." },
  missing_invoice:  { bg: "#fecaca", color: "#991b1b", label: "Trūksta sąsk." },
  active:           { bg: "#dcfce7", color: "#15803d", label: "Aktyvus" },
  draft:            { bg: "#fef3c7", color: "#ca8a04", label: "Juodraštis" },
  generated:        { bg: "#fef3c7", color: "#ca8a04", label: "Paruoštas" },
};
const statusBadgeStyle = (status) => { const s = STATUS_MAP[status] || { bg: "#f1f5f9", color: "#475569" }; return { display: "inline-block", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap" }; };
const statusLabel = (status) => (STATUS_MAP[status]?.label || status || "?");
const emptyOrderForm = { orderType: "resale_to_carrier", sendToCarrier: true, clientOrderNumber: "", clientPrice: 0, carrierPrice: 0, carrierPriceWithVAT: false, paymentTerm: "14 dienų", cargoType: "", cargo: "", vehicleCount: "1", vinNumbers: "", truckPlate: "", trailerPlate: "", driverName: "", loadingCompanyName: "", loadingCity: "", loadingStreet: "", loadingPostalCode: "", loadingCoordinates: "", unloadingCompanyName: "", unloadingCity: "", unloadingStreet: "", unloadingPostalCode: "", unloadingCoordinates: "", route: "", loadingDate: "", unloadingDate: "", loadRefLoading: "", loadRefUnloading: "", instructions: "", originalsRequired: false, notes: "", documentUploadLink: "", clientId: "", clientName: "", carrierId: "", carrierName: "", carrierType: "", contactName: "", contactPhone: "", contactEmail: "", status: "new", documents: { cmr: "", pod: "", invoice: "" } };
function readFileAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); }); }

const mmToPx = (mm) => mm * 3.7795275591;
const buildPlaceholderImage = (label, color) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96" viewBox="0 0 320 96"><rect width="320" height="96" rx="12" fill="${color}"/><text x="160" y="54" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="#ffffff">${label}</text></svg>`)}`;
const dynamicFieldCategories = [
  {
    title: "Užsakymas",
    fields: [
      { key: "order_number", label: "Užsakymo numeris" },
      { key: "order_date", label: "Užsakymo data" },
      { key: "status", label: "Statusas" }
    ]
  },
  {
    title: "Klientas",
    fields: [
      { key: "client_name", label: "Kliento pavadinimas" },
      { key: "client_order_number", label: "Kliento užsakymo Nr." },
      { key: "client_price", label: "Kliento kaina" },
      { key: "client_code", label: "Kliento įmonės kodas" },
      { key: "client_vat", label: "Kliento PVM kodas" },
      { key: "client_address", label: "Kliento adresas" },
      { key: "client_email", label: "Kliento email" },
      { key: "client_phone", label: "Kliento telefonas" }
    ]
  },
  {
    title: "Vežėjas",
    fields: [
      { key: "carrier_name", label: "Vežėjo pavadinimas" },
      { key: "carrier_price", label: "Vežėjo kaina" },
      { key: "carrier_code", label: "Vežėjo įmonės kodas" },
      { key: "carrier_vat", label: "Vežėjo PVM kodas" },
      { key: "carrier_address", label: "Vežėjo adresas" },
      { key: "carrier_email", label: "Vežėjo email" },
      { key: "carrier_phone", label: "Vežėjo telefonas" }
    ]
  },
  {
    title: "Maršrutas",
    fields: [
      { key: "route", label: "Maršrutas (pilnas)" },
      { key: "loading_address", label: "Pakrovimo adresas" },
      { key: "loading_date", label: "Pakrovimo data" },
      { key: "unloading_address", label: "Iškrovimo adresas" },
      { key: "unloading_date", label: "Iškrovimo data" }
    ]
  },
  {
    title: "Krovinys",
    fields: [
      { key: "cargo", label: "Krovinio aprašymas" },
      { key: "cargo_type", label: "Krovinio tipas" },
      { key: "cargo_quantity", label: "Kiekis" },
      { key: "cargo_weight", label: "Svoris" },
      { key: "vin_numbers", label: "VIN numeriai" }
    ]
  },
  {
    title: "Transportas",
    fields: [
      { key: "driver_name", label: "Vairuotojas" },
      { key: "truck_number", label: "Vilkiko numeris" },
      { key: "trailer_number", label: "Priekabos numeris" }
    ]
  },
  {
    title: "Papildoma",
    fields: [
      { key: "payment_term", label: "Mokėjimo terminas" },
      { key: "today_date", label: "Šiandienos data" },
      { key: "load_number", label: "Load numeris" },
      { key: "ref_number", label: "Ref numeris" },
      { key: "instructions", label: "Instrukcijos vežėjui" }
    ]
  }
];
const buildPreviewFields = (settings, manualState) => ({
  order_number: "RAD-2026-014",
  today_date: "2026-04-04",
  client_name: "MB Radanaras",
  carrier_name: "UAB Baltic Carrier",
  cargo: "Automobilių pervežimas",
  route: "Hamburg, DE → Vilnius, LT",
  loading_date: "2026-04-07",
  unloading_date: "2026-04-09",
  client_price: "",
  carrier_price: "1180.00 EUR",
  payment_term: "14 dienų",
  company_logo: manualState?.assets?.logoSrc || settings?.company?.logo_url || buildPlaceholderImage("LOGO", "#2563eb"),
  company_stamp_signature: settings?.companyStampSignature || buildPlaceholderImage("STAMP", "#0f766e"),
  instructions_block: `<div style="padding:16px 18px; background:#0f172a; border-radius:18px; color:#ffffff; margin-bottom:20px;"><div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(255,255,255,0.72); margin-bottom:8px;">Instrukcijos vežėjui</div><div style="font-size:13px; line-height:1.7; color:rgba(255,255,255,0.92);">Atvykimą patvirtinti telefonu. CMR ir POD dokumentus pateikti laiku.</div></div>`,
  requires_original_documents_warning: "",
  contact_name: "Jonas Jonaitis",
  contact_phone: "+370 600 00000",
  contact_email: "jonas@carrier.lt"
});
const renderTemplateTokens = (html, values) =>
  String(html || "").replace(/{{\s*([^}]+)\s*}}/g, (_, token) => values[token.trim()] ?? `{{${token.trim()}}}`);
const configureLogoMarkup = (html, assets) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstChild;
  if (!root) return html;
  root.querySelectorAll('[data-logo-wrapper="true"]').forEach((node) => {
    node.style.textAlign = assets.logoAlign || "left";
  });
  root.querySelectorAll('[data-template-logo="true"]').forEach((node) => {
    node.style.width = `${assets.logoWidth || 220}px`;
    node.style.height = `${assets.logoHeight || 80}px`;
    node.style.maxWidth = "100%";
    node.style.objectFit = "fill";
    node.style.display = "inline-block";
  });
  return root.innerHTML;
};
const prepareTemplateSection = (html, manualState, { persistLogo = false } = {}) => {
  let nextHtml = configureLogoMarkup(html, manualState.assets);
  if (persistLogo && manualState.assets.logoSrc) {
    nextHtml = nextHtml.replace(/{{\s*company_logo\s*}}/g, manualState.assets.logoSrc);
  }
  return nextHtml;
};
const modernOrderBodyHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1976d2; font-size: 28px; margin: 0;">TRANSPORTO UŽSAKYMAS</h1>
      <p style="color: #666; font-size: 14px; margin-top: 10px;">Nr. {{order_number}} | Data: {{today_date}}</p>
    </div>

    <div style="margin-bottom: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #1976d2;">SUTARTIES ŠALYS</h3>
      <p><strong>Užsakovas:</strong> {{client_name}} | <strong>Vežėjas:</strong> {{carrier_name}}</p>
      <p><strong>Maršrutas:</strong> {{route}}</p>
    </div>

    <div style="margin-bottom: 25px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #1976d2;">KROVINIO INFORMACIJA</h3>
      <p><strong>Tipas:</strong> {{cargo_type}} | <strong>Kiekis:</strong> {{cargo_quantity}}</p>
      <p><strong>Pakrovimas:</strong> {{loading_date}} - {{loading_address}}</p>
      <p><strong>Iškrovimas:</strong> {{unloading_date}} - {{unloading_address}}</p>
      <p><strong>Vairuotojas:</strong> {{driver_name}} | <strong>Vilkikas:</strong> {{truck_number}} | <strong>Priekaba:</strong> {{trailer_number}}</p>
      <p><strong>VIN numeriai:</strong> {{vin_numbers}}</p>
    </div>

    <div style="margin-bottom: 25px; padding: 15px; background: #fff3cd; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #856404;">INSTRUKCIJOS VEŽĖJUI</h3>
      <p>{{instructions}}</p>
      <p style="font-size: 12px; font-style: italic; color: #856404;">CMR ir POD dokumentus pateikti laiku.</p>
    </div>

    <div style="margin-bottom: 25px; padding: 15px; background: #fff; border: 2px solid #1976d2; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: #1976d2;">FINANSAI</h3>
      <p><strong>Kliento kaina:</strong> {{client_price}} EUR</p>
      <p><strong>Vežėjo kaina:</strong> {{carrier_price}} EUR</p>
      <p><strong>Mokėjimo terminas:</strong> {{payment_term}}</p>
    </div>

    <div style="page-break-before: always; margin-top: 40px; padding: 20px; background: #fff; border: 2px solid #1976d2; border-radius: 8px;">
      <h2 style="text-align: center; color: #1976d2; margin-bottom: 20px;">SĄLYGOS IR ATSAKOMYBĖS</h2>
      <p>Ši vienkartinė krovinio pervežimo sutartis reglamentuoja santykius tarp Užsakovo ir Vežėjo.</p>
      <p><strong>Sutartis įsigalioja</strong> nuo momento, kai Vežėjas patvirtina užsakymą. Jei pasirašyta sutartis negrąžinama per 2 valandas, bet užsakymas vykdomas, laikoma, kad Vežėjas sutinka su visomis sąlygomis.</p>
      <h4 style="color: #1976d2; margin-top: 20px;">CMR DRAUDIMAS</h4>
      <p>Vežėjas turi galiojantį CMR draudimą (min. 600,000 EUR). Nepateikus draudimo - bauda iki 2000 EUR.</p>
      <h4 style="color: #1976d2; margin-top: 20px;">VEŽĖJO ATSAKOMYBĖ</h4>
      <p>Vežėjas atsako už krovinio praradimą, sugadinimą nuo priėmimo iki perdavimo gavėjui.</p>
      <h4 style="color: #1976d2; margin-top: 20px;">BAUDOS</h4>
      <p>Vėlavimas: 30 EUR/val. Neįvykdymas: iki 2000 EUR. Instrukcijų nesilaikymas: iki 2000 EUR.</p>
      <h4 style="color: #1976d2; margin-top: 20px;">KITI REIKALAVIMAI</h4>
      <p>• Transporto priemonė techniškai tvarkinga<br>• VIN numerių tikrinimas prieš pakrovimą<br>• Subrangos draudimas be sutikimo<br>• Krovinio sulaikymo draudimas<br>• Informavimas apie trikdžius per 2val</p>
    </div>

    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <h3 style="text-align: center; color: #1976d2; margin-bottom: 20px;">ŠALIŲ REKVIZITAI</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h4 style="color: #1976d2;">UŽSAKOVAS</h4>
          <p><strong>Pavadinimas:</strong> {{client_name}}</p>
          <p><strong>Kodas:</strong> {{client_code}}</p>
          <p><strong>PVM:</strong> {{client_vat}}</p>
          <p><strong>Adresas:</strong> {{client_address}}</p>
          <p><strong>Tel:</strong> {{client_phone}}</p>
          <p><strong>Email:</strong> {{client_email}}</p>
        </div>
        <div>
          <h4 style="color: #1976d2;">VEŽĖJAS</h4>
          <p><strong>Pavadinimas:</strong> {{carrier_name}}</p>
          <p><strong>Kodas:</strong> {{carrier_code}}</p>
          <p><strong>PVM:</strong> {{carrier_vat}}</p>
          <p><strong>Adresas:</strong> {{carrier_address}}</p>
          <p><strong>Tel:</strong> {{carrier_phone}}</p>
          <p><strong>Email:</strong> {{carrier_email}}</p>
          <div style="margin-top: 20px; padding: 40px; border: 2px dashed #999; text-align: center; color: #999;">
            Parašas ir antspaudas
          </div>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 4px; text-align: center; font-size: 13px;">
        Sutartis įsigalioja nuo užsakymo patvirtinimo. Jei nepasirašoma per 2h, bet vykdoma - laikoma, kad sutinkama su sąlygomis.
      </div>
    </div>
  </div>
`;
const defaultManualTemplateState = () => ({
  templateId: null,
  name: "Modernus transporto orderis",
  headerHtml: `
    <div style="padding:12px 16px; border:1px solid #dbeafe; border-radius:16px; background:linear-gradient(180deg,#fbfdff,#eef5ff); margin-bottom:8px;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="width:58%; vertical-align:top; padding-right:12px;">
            <div data-logo-wrapper="true" style="text-align:left; margin-bottom:10px;">
              <img data-template-logo="true" src="{{company_logo}}" alt="Logo" style="width:180px; max-width:100%; height:80px; object-fit:fill; display:inline-block;" />
            </div>
            <div style="font-size:22px; line-height:1.1; font-weight:800; color:#0f172a; letter-spacing:-0.03em;">Transporto užsakymas</div>
            <div style="font-size:11px; color:#475569; margin-top:4px; line-height:1.3;">Vienkartinė krovinio pervežimo sutartis profesionaliam vežėjui</div>
          </td>
          <td style="width:42%; vertical-align:top;">
            <div style="padding:12px 14px; background:#0f172a; color:#ffffff; border-radius:14px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);">
              <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.14em; opacity:0.72; margin-bottom:6px;">Order summary</div>
              <div style="font-size:20px; font-weight:800; letter-spacing:-0.03em; margin-bottom:6px;">{{order_number}}</div>
              <div style="display:grid; gap:4px; font-size:12px; color:rgba(255,255,255,0.88);">
                <div><strong style="color:#ffffff;">Data:</strong> {{today_date}}</div>
                <div><strong style="color:#ffffff;">Vežėjas:</strong> {{carrier_name}}</div>
                <div style="margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.15);">
                  <div><strong style="color:#ffffff;">Vadybininkas:</strong> {{contact_name}}</div>
                  <div><strong style="color:#ffffff;">Tel:</strong> {{contact_phone}}</div>
                  <div><strong style="color:#ffffff;">Email:</strong> {{contact_email}}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `,
  bodyHtml: `
    <div style="font-size:12px; color:#0f172a;">
      <div style="padding:8px 12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:10px;">
        <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:4px;">Sutarties šalys</div>
        <div style="font-size:12px; line-height:1.5;">
          Tarp <strong>{{carrier_name}}</strong>, toliau Vežėjas, ir <strong>{{client_name}}</strong>, toliau Užsakovas, sudaromas šis transporto užsakymas.
        </div>
      </div>
      <div class="doc-info-card" style="background:white; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin:10px 0;">
        <h3 style="margin:0 0 8px 0; color:#1f2937; font-size:13px; font-weight:600; border-bottom:2px solid #3b82f6; padding-bottom:6px;">PAGRINDINĖ INFORMACIJA</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #f3f4f6;">
          <div><span style="color:#6b7280; font-size:10px; display:block; margin-bottom:2px;">Krovinio tipas</span><span style="color:#1f2937; font-weight:500; font-size:12px;">{{cargo_type}}</span></div>
          <div><span style="color:#6b7280; font-size:10px; display:block; margin-bottom:2px;">Kiekis</span><span style="color:#1f2937; font-weight:500; font-size:12px;">{{quantity}} vnt</span></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px solid #f3f4f6;">
          <div style="background:#f9fafb; padding:8px; border-radius:6px; border-left:3px solid #10b981;">
            <div style="color:#059669; font-weight:600; font-size:11px; margin-bottom:4px;">PAKROVIMAS</div>
            <div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Siuntėjas</span><span style="color:#1f2937; font-weight:500; font-size:11px;">{{sender_name}}</span></div>
            <div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Adresas</span><span style="color:#1f2937; font-size:11px;">{{loading_address}}</span></div>
            <div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#059669; font-weight:600; font-size:11px;">{{loading_date}}</span></div>
          </div>
          <div style="background:#f9fafb; padding:8px; border-radius:6px; border-left:3px solid #ef4444;">
            <div style="color:#dc2626; font-weight:600; font-size:11px; margin-bottom:4px;">IŠKROVIMAS</div>
            <div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Gavėjas</span><span style="color:#1f2937; font-weight:500; font-size:11px;">{{receiver_name}}</span></div>
            <div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Adresas</span><span style="color:#1f2937; font-size:11px;">{{unloading_address}}</span></div>
            <div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#dc2626; font-weight:600; font-size:11px;">{{unloading_date}}</span></div>
          </div>
        </div>
        <div style="background:#eff6ff; padding:8px; border-radius:6px; margin-bottom:8px;">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
            <div><span style="color:#1e40af; font-size:10px; display:block; margin-bottom:2px;">Vairuotojas</span><span style="color:#1f2937; font-weight:500; font-size:11px;">{{driver_name}}</span></div>
            <div><span style="color:#1e40af; font-size:10px; display:block; margin-bottom:2px;">Vilkikas</span><span style="color:#1f2937; font-weight:500; font-size:11px;">{{truck_number}}</span></div>
            <div><span style="color:#1e40af; font-size:10px; display:block; margin-bottom:2px;">Priekaba</span><span style="color:#1f2937; font-weight:500; font-size:11px;">{{trailer_number}}</span></div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <div><span style="color:#6b7280; font-size:10px; display:block; margin-bottom:2px;">Load Nr</span><span style="color:#1f2937; font-weight:500; font-size:12px;">{{load_number}}</span></div>
          <div><span style="color:#6b7280; font-size:10px; display:block; margin-bottom:2px;">Ref Nr</span><span style="color:#1f2937; font-weight:500; font-size:12px;">{{ref_number}}</span></div>
        </div>
      </div>
      <div class="doc-price-pill" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); border-radius:10px; padding:10px 16px; margin:10px 0; box-shadow:0 3px 8px rgba(102,126,234,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:white; font-size:12px; font-weight:500;">Vežėjo kaina</span>
          <span class="vezejo-kaina" style="color:white; font-size:18px; font-weight:700;">{{carrier_price}}</span>
        </div>
      </div>
      {{requires_original_documents_warning}}

      {{instructions_block}}

      <div data-page-break="true" style="page-break-before:always; border-top:2px dashed #cbd5e1; color:#64748b; text-align:center; font-size:12px; padding:10px 0; margin:20px 0;">
        Naujas puslapis
      </div>

      <div class="doc-terms" style="padding:22px 24px; border:1px solid #e2e8f0; border-radius:22px; background:#ffffff; margin-bottom:18px;">
        <div style="font-size:24px; font-weight:800; color:#0f172a; margin-bottom:18px;">Sąlygos ir atsakomybės</div>
        <div style="font-size:12px; color:#1e293b; line-height:1.85; display:grid; gap:10px;">
          <p style="margin:0;">Ši vienkartinė krovinio pervežimo sutartis (toliau – Sutartis) reglamentuoja santykius tarp Užsakovo ir Vežėjo, susijusius su krovinio pervežimu.</p>
          <p style="margin:0;">Vežėjas įsipareigoja savo rizika ir atsakomybe priimti, pervežti ir pristatyti krovinį į Sutartyje nurodytą vietą bei perduoti jį teisėtam gavėjui, o Užsakovas įsipareigoja sumokėti už tinkamai įvykdytą paslaugą Sutartyje nustatytomis sąlygomis.</p>
          <p style="margin:0;">Sutartis laikoma sudaryta ir galiojančia nuo jos pasirašymo momento arba nuo momento, kai Vežėjas patvirtina užsakymą elektroninėmis priemonėmis, pradeda vykdyti pervežimą ar priima krovinį. Jei pasirašyta Sutartis negrąžinama per 2 valandas nuo jos gavimo, tačiau Vežėjas pradeda vykdyti užsakymą, laikoma, kad Vežėjas pilnai sutinka su visomis Sutarties sąlygomis.</p>
          <p style="margin:0;">Vežėjas patvirtina, kad turi visus teisės aktuose numatytus leidimus, licencijas ir galiojantį vežėjo civilinės atsakomybės (CMR) draudimą, kurio suma negali būti mažesnė nei 600 000 EUR vienam įvykiui, ir kuris galioja visam pervežimo maršrutui, įskaitant kabotažinius vežimus. Nepateikus galiojančio draudimo dokumentų, Užsakovas turi teisę taikyti baudą iki 2000 EUR ir atsisakyti vykdyti užsakymą.</p>
          <p style="margin:0;">Vežėjas visiškai atsako už krovinio praradimą, sugadinimą, vertės sumažėjimą ar bet kokius kitus nuostolius nuo krovinio priėmimo momento iki jo perdavimo gavėjui. Žalos dydis nustatomas pagal Užsakovo, jo kliento, krovinio savininko ar gamintojo pateiktus skaičiavimus, įskaitant administracines išlaidas, vertės netekimą bei kitas susijusias išlaidas, ir laikomas privalomu Vežėjui.</p>
          <p style="margin:0;">Vežėjas privalo pateikti techniškai tvarkingą transporto priemonę, atitinkančią visus teisės aktų ir saugumo reikalavimus, bei užtikrinti, kad vairuotojai turi visus reikalingus dokumentus, laikosi darbo ir poilsio režimo bei kitų taikomų teisinių reikalavimų. Už šių reikalavimų nesilaikymą gali būti taikoma bauda iki 2000 EUR už kiekvieną pažeidimą.</p>
          <p style="margin:0;">Vežėjas privalo prieš pakrovimą patikrinti krovinio būklę, komplektaciją, VIN numerius bei kitus identifikacinius duomenis ir visus neatitikimus ar pažeidimus nedelsiant pažymėti CMR dokumentuose. Jei tokios pastabos nepadaromos, laikoma, kad krovinys buvo priimtas tvarkingas, o visi vėliau nustatyti pažeidimai atsirado pervežimo metu dėl Vežėjo kaltės.</p>
          <p style="margin:0;">Vežėjas privalo laikytis visų Užsakovo, siuntėjo, gavėjo ar krovinio savininko pateiktų instrukcijų, įskaitant papildomus reikalavimus, naudojamas sistemas ar programėles. Už instrukcijų nesilaikymą gali būti taikoma bauda iki 2000 EUR, o visi dėl to atsiradę nuostoliai tenka Vežėjui.</p>
        </div>
      </div>

      <div data-page-break="true" style="page-break-before:always; border-top:2px dashed #cbd5e1; color:#64748b; text-align:center; font-size:12px; padding:10px 0; margin:20px 0;">
        Naujas puslapis
      </div>

      <div class="doc-terms" style="padding:22px 24px; border:1px solid #e2e8f0; border-radius:22px; background:#ffffff; margin-bottom:18px;">
        <div style="font-size:12px; color:#1e293b; line-height:1.85; display:grid; gap:10px;">
          <p style="margin:0;">Vežėjas privalo nedelsiant, bet ne vėliau kaip per 2 valandas, informuoti Užsakovą apie bet kokius trikdžius, vėlavimus, incidentus ar krovinio pažeidimus. Neinformavus laiku, visa atsakomybė už pasekmes tenka Vežėjui.</p>
          <p style="margin:0;">Vežėjui vėluojant į pakrovimo ar iškrovimo vietą, gali būti taikoma 30 EUR bauda už kiekvieną vėlavimo valandą. Neatvykus laiku ar neįvykdžius užsakymo, Užsakovas turi teisę taikyti baudą iki 2000 EUR ir reikalauti visų patirtų nuostolių atlyginimo.</p>
          <p style="margin:0;">Vežėjas neturi teisės perduoti užsakymo vykdymo tretiesiems asmenims (subrangovams) be išankstinio raštiško Užsakovo sutikimo. Pažeidus šią sąlygą, Vežėjas prisiima visą atsakomybę ir gali netekti teisės į apmokėjimą.</p>
          <p style="margin:0;">Vežėjui draudžiama sulaikyti krovinį ar kitaip riboti jo pristatymą. Tokiu atveju Vežėjas netenka teisės į frachtą ir privalo atlyginti visus Užsakovo nuostolius.</p>
          <p style="margin:0;">Apmokėjimas už pervežimą atliekamas tik po to, kai Užsakovui pateikiami visi tinkamai užpildyti dokumentai, įskaitant CMR originalą ir kitus su pervežimu susijusius dokumentus. Užsakovas turi teisę sulaikyti mokėjimą arba atlikti užskaitą, jei yra pateiktos pretenzijos ar patirti nuostoliai.</p>
          <p style="margin:0;">Visos Sutartyje numatytos baudos laikomos minimaliais Užsakovo nuostoliais ir jų dydžio papildomai įrodinėti nereikia. Jei faktiniai nuostoliai viršija nustatytas baudas, Vežėjas įsipareigoja atlyginti visą nuostolių sumą.</p>
          <p style="margin:0;">Vežėjas patvirtina, kad yra susipažinęs su visais taikomais teisės aktais, tarptautinėmis konvencijomis (įskaitant CMR), taip pat su krovinio siuntėjo, gavėjo ar gamintojo nustatytomis taisyklėmis, ir įsipareigoja jų laikytis viso pervežimo metu.</p>
          <p style="margin:0;">Visi ginčai sprendžiami derybų būdu, o nepavykus susitarti – kompetentingame teisme pagal Užsakovo registracijos vietą.</p>
        </div>
      </div>

      <div data-page-break="true" style="page-break-before:always; border-top:2px dashed #cbd5e1; color:#64748b; text-align:center; font-size:12px; padding:10px 0; margin:20px 0;">
        Naujas puslapis
      </div>

      <div class="doc-parties" style="padding:22px 24px; border:1px solid #e2e8f0; border-radius:22px; background:linear-gradient(180deg,#ffffff,#fbfdff);">
        <div style="font-size:24px; font-weight:800; color:#0f172a; margin-bottom:8px;">Siuntėjo ir vežėjo detalės</div>
        <div style="font-size:13px; color:#64748b; margin-bottom:18px;">Trečias puslapis skirtas kontaktams, patvirtinimams ir parašų zonoms.</div>
        <div class="doc-parties-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
          <div style="padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:10px;">Užsakovas</div>
            <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:8px;">{{client_name}}</div>
            <div style="font-size:12px; color:#475569; line-height:1.9;">
              <div>Įmonės kodas: {{client_company_code}}</div>
              <div>PVM kodas: {{client_vat_code}}</div>
              <div>Tel: {{client_phone}}</div>
              <div>Email: {{client_email}}</div>
              <div>Adresas: {{client_address}}</div>
            </div>
          </div>
          <div style="padding:18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:18px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:10px;">Vežėjas</div>
            <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:8px;">{{carrier_name}}</div>
            <div style="font-size:12px; color:#475569; line-height:1.9;">
              <div>Įmonės kodas: {{carrier_company_code}}</div>
              <div>PVM kodas: {{carrier_vat_code}}</div>
              <div>Tel: {{carrier_phone}}</div>
              <div>Email: {{carrier_email}}</div>
              <div>Adresas: {{carrier_address}}</div>
            </div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div style="padding:18px; border:1px dashed #94a3b8; border-radius:18px; min-height:160px; display:flex; flex-direction:column; justify-content:space-between; align-items:flex-start;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b;">Užsakovo antspaudas / parašas</div>
            <img data-stamp="true" src="{{company_stamp_signature}}" alt="Stamp" style="max-height:92px; max-width:180px; object-fit:contain;" />
            <div style="font-size:12px; color:#475569;">Užsakovas</div>
          </div>
          <div style="padding:18px; border:1px dashed #94a3b8; border-radius:18px; min-height:160px;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:#64748b; margin-bottom:14px;">Vežėjo parašas</div>
            <div style="margin-top:78px; border-top:1px solid #cbd5e1; padding-top:8px; font-size:12px; color:#475569;">Vardas, pavardė, pareigos</div>
          </div>
        </div>
      </div>
    </div>
  `,
  footerHtml: `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b;">
      <div>Sukūrimo data: {{creation_date}}</div>
      <div>Užsakymo Nr: {{order_number}}</div>
    </div>
  `,
  layout: {
    orientation: "portrait",
    marginTop: 14,
    marginRight: 14,
    marginBottom: 14,
    marginLeft: 14,
    headerSpacing: 8,
    footerSpacing: 8,
    pageGap: 20,
    zoom: 60
  },
  assets: {
    logoSrc: "",
    logoWidth: 220,
    logoHeight: 80,
    logoAlign: "left"
  }
});
const buildTemplateMarkup = (state) => {
  const { layout } = state;
  const padding = `${layout.marginTop}mm ${layout.marginRight}mm ${layout.marginBottom}mm ${layout.marginLeft}mm`;
  const bodyContent = String(prepareTemplateSection(state.bodyHtml, state, { persistLogo: true }) || "").replace(
    /<div[^>]*data-page-break="true"[^>]*>[\s\S]*?<\/div>/g,
    '<div data-page-break="true" style="page-break-before:always; height:0; overflow:hidden;"></div>'
  );
  const headerContent = prepareTemplateSection(state.headerHtml, state, { persistLogo: true });
  const footerContent = prepareTemplateSection(state.footerHtml, state, { persistLogo: true });
  return `
    <div data-template-root="manual-order-template" data-orientation="${layout.orientation}" style="font-family:Arial, Helvetica, sans-serif; color:#0f172a; width:100%; background:#ffffff;">
      <div style="padding:${padding}; box-sizing:border-box;">
        <div data-template-header style="margin-bottom:${layout.headerSpacing}mm;">${headerContent}</div>
        <div data-template-body>${bodyContent}</div>
        <div data-template-footer style="margin-top:${layout.footerSpacing}mm;">${footerContent}</div>
      </div>
    </div>
  `;
};
const restoreManualTemplateState = (template) => {
  const defaults = defaultManualTemplateState();
  if (!template) return defaults;
  if (template.editorState?.manual) {
    return {
      ...defaults,
      ...template.editorState.manual,
      templateId: template.id ?? null,
      name: template.name || defaults.name,
      layout: { ...defaults.layout, ...(template.editorState.manual.layout || {}) },
      assets: { ...defaults.assets, ...(template.editorState.manual.assets || {}) }
    };
  }
  return {
    ...defaults,
    templateId: template.id ?? null,
    name: template.name || defaults.name,
    bodyHtml: template.content || defaults.bodyHtml
  };
};

export function TemplateManager({ settings, saveSettings }) {
  const [manualState, setManualState] = useState(() => defaultManualTemplateState());
  const [mode, setMode] = useState("manual");
  const [activeEditor, setActiveEditor] = useState("body");
  // previewPages is computed — never stored — so it always reflects the current template
  const [previewMode, setPreviewMode] = useState("canvas");
  const [textColor, setTextColor] = useState("#0f172a");
  const [fontScale, setFontScale] = useState("3");
  const templates = useMemo(() => (Array.isArray(settings?.templates) ? settings.templates : []), [settings]);
  const headerRef = useRef(null);
  const bodyRef = useRef(null);
  const footerRef = useRef(null);
  const previewHeaderRef = useRef(null);
  const previewBodyRef = useRef(null);
  const previewFooterRef = useRef(null);
  const imageInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const previewViewportRef = useRef(null);
  const activeEditableRef = useRef(null);
  const savedSelectionRef = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSelectionRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const previewFields = useMemo(() => buildPreviewFields(settings, manualState), [settings, manualState]);
  const renderedHeader = useMemo(() => renderTemplateTokens(prepareTemplateSection(manualState.headerHtml, manualState), previewFields), [manualState, previewFields]);
  const renderedBody = useMemo(() => renderTemplateTokens(prepareTemplateSection(manualState.bodyHtml, manualState), previewFields), [manualState, previewFields]);
  const renderedFooter = useMemo(() => renderTemplateTokens(prepareTemplateSection(manualState.footerHtml, manualState), previewFields), [manualState, previewFields]);
  /* Split rendered body at every [data-page-break="true"] div — each chunk is one A4 page */
  const previewPages = useMemo(() => {
    const pages = renderedBody.split(/<div[^>]+data-page-break="true"[^>]*>[\s\S]*?<\/div>/);
    const trimmed = pages.map((s) => s.trim()).filter(Boolean);
    return trimmed.length > 0 ? trimmed : [""];
  }, [renderedBody]);
  const pageSize = manualState.layout.orientation === "portrait" ? { width: 794, height: 1123 } : { width: 1123, height: 794 };
  const previewScale = Math.max(0.25, manualState.layout.zoom / 100);
  const tiptapTestEditor = useEditor({
    extensions: [StarterKit],
    content: "<p>Test editor</p>",
    immediatelyRender: false
  });
  const editorRefs = {
    header: [headerRef, previewHeaderRef],
    body: [bodyRef, previewBodyRef],
    footer: [footerRef, previewFooterRef]
  };

  const updateManualState = (updates) => {
    setManualState((prev) => ({ ...prev, ...updates }));
  };

  const updateLayout = (key, value) => {
    setManualState((prev) => ({
      ...prev,
      layout: {
        ...prev.layout,
        [key]: value
      }
    }));
  };

  const syncSectionState = (key, html) => {
    setManualState((prev) => ({ ...prev, [`${key}Html`]: html }));
  };

  const syncDomFromState = (key) => {
    const html = key === "header" ? manualState.headerHtml : key === "body" ? manualState.bodyHtml : manualState.footerHtml;
    editorRefs[key].forEach((ref) => {
      if (!ref.current) return;
      if (document.activeElement === ref.current) return;
      if (ref.current.innerHTML !== html) ref.current.innerHTML = html;
    });
  };

  const focusEditor = (key = activeEditor, preferred = "source") => {
    const primary = preferred === "preview" ? editorRefs[key][1]?.current : editorRefs[key][0]?.current;
    const fallback = preferred === "preview" ? editorRefs[key][0]?.current : editorRefs[key][1]?.current;
    const ref = primary || fallback;
    if (ref) {
      ref.focus();
      activeEditableRef.current = ref;
      setActiveEditor(key);
    }
  };

  const onEditableFocus = (key, ref) => {
    setActiveEditor(key);
    activeEditableRef.current = ref.current;
  };

  const inputDebounceRef = useRef(null);
  const onEditableInput = (key, ref) => {
    clearTimeout(inputDebounceRef.current);
    inputDebounceRef.current = setTimeout(() => {
      if (ref.current) syncSectionState(key, ref.current.innerHTML || "");
    }, 300);
  };

  useEffect(() => {
    ["header", "body", "footer"].forEach(syncDomFromState);
  }, [manualState.headerHtml, manualState.bodyHtml, manualState.footerHtml]);

  const exec = (command, value = null) => {
    focusEditor(activeEditor, previewMode === "canvas" ? "preview" : "source");
    document.execCommand(command, false, value);
    if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || "");
  };

  const insertHtml = (html, target = activeEditor) => {
    focusEditor(target, previewMode === "canvas" ? "preview" : "source");
    document.execCommand("insertHTML", false, html);
    if (activeEditableRef.current) syncSectionState(target, activeEditableRef.current.innerHTML || "");
  };

  const insertField = (key) => insertHtml(`{{${key}}}`);

  const insertTemplateBlock = (variant) => {
    if (variant === "infoTable") {
      insertHtml(`
        <table style="width:100%; border-collapse:collapse; margin:12px 0;">
          <tr>
            <td style="border:1px solid #1e293b; padding:8px; font-weight:700; background:#f8fafc;">Laukas</td>
            <td style="border:1px solid #1e293b; padding:8px;">Reikšmė</td>
          </tr>
          <tr>
            <td style="border:1px solid #1e293b; padding:8px; font-weight:700; background:#f8fafc;">Maršrutas</td>
            <td style="border:1px solid #1e293b; padding:8px;">{{route}}</td>
          </tr>
        </table>
      `);
      return;
    }
    if (variant === "priceTable") {
      insertHtml(`
        <table style="width:100%; border-collapse:collapse; margin:12px 0;">
          <tr>
            <th style="border:1px solid #1e293b; padding:8px; background:#eff6ff; text-align:left;">Pozicija</th>
            <th style="border:1px solid #1e293b; padding:8px; background:#eff6ff; text-align:left;">Suma</th>
          </tr>
          <tr>
            <td style="border:1px solid #1e293b; padding:8px;">Vežėjo kaina</td>
            <td style="border:1px solid #1e293b; padding:8px;">{{carrier_price}}</td>
          </tr>
          <tr>
            <td style="border:1px solid #1e293b; padding:8px;">Mokėjimo terminas</td>
            <td style="border:1px solid #1e293b; padding:8px;">{{payment_term}}</td>
          </tr>
        </table>
      `);
      return;
    }
    if (variant === "heroCard") {
      insertHtml(`
        <div style="padding:18px; border-radius:18px; background:linear-gradient(180deg,#0f172a,#1e293b); color:#ffffff; margin:12px 0;">
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; opacity:0.72; margin-bottom:10px;">Svarbi informacija</div>
          <div style="font-size:22px; font-weight:800; margin-bottom:6px;">{{order_number}}</div>
          <div style="font-size:13px; color:rgba(255,255,255,0.88);">Maršrutas: {{route}}</div>
        </div>
      `);
      return;
    }
    if (variant === "pageBreak") {
      insertHtml(`
        <div data-page-break="true" style="page-break-before:always; border-top:2px dashed #cbd5e1; color:#64748b; text-align:center; font-size:12px; padding:10px 0; margin:20px 0;">
          Naujas puslapis
        </div>
      `);
    }
  };

  const findAncestor = (node, tags) => {
    let current = node;
    while (current) {
      if (current.nodeType === 1 && tags.includes(current.tagName)) return current;
      current = current.parentNode;
    }
    return null;
  };

  const getTableContext = () => {
    const selection = window.getSelection();
    if (!selection?.anchorNode) return null;
    const cell = findAncestor(selection.anchorNode, ["TD", "TH"]);
    const row = findAncestor(selection.anchorNode, ["TR"]);
    const table = findAncestor(selection.anchorNode, ["TABLE"]);
    if (!cell || !row || !table) return null;
    return { cell, row, table };
  };

  const mutateActiveSection = () => {
    if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || "");
  };

  const addTableRow = () => {
    const context = getTableContext();
    if (!context) return;
    const newRow = context.row.cloneNode(true);
    Array.from(newRow.children).forEach((cell) => { cell.innerHTML = "&nbsp;"; });
    context.row.after(newRow);
    mutateActiveSection();
  };

  const addTableColumn = () => {
    const context = getTableContext();
    if (!context) return;
    const columnIndex = Array.from(context.row.children).indexOf(context.cell);
    Array.from(context.table.rows).forEach((row) => {
      const referenceCell = row.children[columnIndex];
      const nextCell = document.createElement(referenceCell?.tagName || "TD");
      nextCell.innerHTML = "&nbsp;";
      nextCell.style.cssText = referenceCell?.style?.cssText || "border:1px solid #1e293b; padding:8px;";
      if (referenceCell && referenceCell.nextSibling) row.insertBefore(nextCell, referenceCell.nextSibling);
      else row.appendChild(nextCell);
    });
    mutateActiveSection();
  };

  const deleteTableRow = () => {
    const context = getTableContext();
    if (!context) return;
    if (context.table.rows.length <= 1) context.table.remove();
    else context.row.remove();
    mutateActiveSection();
  };

  const handleInlineImage = async (event, target = activeEditor) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    insertHtml(`<img src="${dataUrl}" alt="Template asset" style="max-width:100%; height:auto; display:block; margin:12px 0;" />`, target);
    event.target.value = "";
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setManualState((prev) => ({ ...prev, assets: { ...prev.assets, logoSrc: dataUrl } }));
    event.target.value = "";
  };

  const updateLogoSetting = (key, value) => {
    setManualState((prev) => ({ ...prev, assets: { ...prev.assets, [key]: value } }));
  };

  const saveTemplate = () => {
    const nextSettings = buildDefaultSettings(settings);
    const now = new Date().toISOString();
    const templateId = manualState.templateId || Date.now();
    const compiledContent = buildTemplateMarkup(manualState);
    const nextTemplate = {
      id: templateId,
      name: manualState.name || "Šablonas",
      content: compiledContent,
      createdAt: templates.find((template) => template.id === templateId)?.createdAt || now,
      updatedAt: now,
      editorState: {
        manual: {
          name: manualState.name,
          headerHtml: manualState.headerHtml,
          bodyHtml: manualState.bodyHtml,
          footerHtml: manualState.footerHtml,
          layout: manualState.layout,
          assets: manualState.assets
        }
      }
    };
    const existingIndex = templates.findIndex((template) => template.id === templateId);
    const nextTemplates = [...templates];
    if (existingIndex >= 0) {
      nextTemplates[existingIndex] = { ...nextTemplates[existingIndex], ...nextTemplate };
    } else {
      nextTemplates.unshift(nextTemplate);
    }
    saveSettings({ ...nextSettings, templates: nextTemplates });
    setManualState((prev) => ({ ...prev, templateId }));
    window.alert(existingIndex >= 0 ? "Šablonas atnaujintas." : "Šablonas išsaugotas.");
  };

  const handleWordExport = () => {
    const markup = buildTemplateMarkup(manualState);
    const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${manualState.name || "Šablonas"}</title></head><body>${markup}</body></html>`;
    const blob = new Blob([docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(manualState.name || "sablonas").replace(/\s+/g, "_")}.doc`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const loadTemplate = (template) => {
    setManualState(restoreManualTemplateState(template));
    setMode("manual");
    setActiveEditor("body");
    setPreviewMode("canvas");
  };

  const createNewTemplate = () => {
    setManualState(defaultManualTemplateState());
    setActiveEditor("body");
    setPreviewMode("canvas");
  };

  const zoomIn = () => updateLayout("zoom", Math.min(160, manualState.layout.zoom + 10));
  const zoomOut = () => updateLayout("zoom", Math.max(30, manualState.layout.zoom - 10));
  const fitPreview = () => {
    const viewport = previewViewportRef.current;
    if (!viewport) return;
    const nextZoom = Math.max(30, Math.min(120, Math.floor(((viewport.clientWidth - 40) / pageSize.width) * 100)));
    updateLayout("zoom", nextZoom);
  };


  const setDefaultTemplate = (templateId) => {
    const nextSettings = buildDefaultSettings(settings);
    const nextTemplates = templates.map((t) => ({ ...t, isDefault: t.id === templateId }));
    saveSettings({ ...nextSettings, templates: nextTemplates });
  };

  return (
    <div>
      <h3 style={{ marginBottom: "16px", color: "#1e3a8a" }}>📝 Užsakymų šablonai</h3>

      {templates.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#475569", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Išsaugoti šablonai</div>
          <div className="templates-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card" style={{ border: `2px solid ${manualState.templateId === template.id ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "12px", padding: "16px", background: "#fff", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
                {template.isDefault && (
                  <span className="default-badge" style={{ position: "absolute", top: "10px", right: "10px", background: "#fef9c3", color: "#854d0e", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "8px", border: "1px solid #fde68a" }}>★ Numatytasis</span>
                )}
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "14px", paddingRight: "80px" }}>{template.name}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {template.updatedAt ? `Atnaujinta ${new Date(template.updatedAt).toLocaleDateString("lt-LT")}` : template.createdAt ? `Sukurta ${new Date(template.createdAt).toLocaleDateString("lt-LT")}` : "Be datos"}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "auto" }}>
                  <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "6px 12px" }} onClick={() => loadTemplate(template)}>✎ Redaguoti</button>
                  {!template.isDefault && (
                    <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "6px 12px", background: "#0f766e" }} onClick={() => setDefaultTemplate(template.id)}>★ Numatytas</button>
                  )}
                  <button
                    type="button"
                    style={{ ...btnSecondary, fontSize: "12px", padding: "6px 12px", background: "#dc2626" }}
                    onClick={() => {
                      if (!window.confirm("Ar tikrai norite ištrinti šį šabloną?")) return;
                      const nextSettings = buildDefaultSettings(settings);
                      saveSettings({ ...nextSettings, templates: templates.filter((item) => item.id !== template.id) });
                      if (manualState.templateId === template.id) createNewTemplate();
                    }}
                  >🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button type="button" style={mode === "manual" ? btn : btnSecondary} onClick={() => setMode("manual")}>
          🛠 Manual tools
        </button>
        <button type="button" style={mode === "ai" ? btn : btnSecondary} onClick={() => setMode("ai")}>
          ✨ AI generation
        </button>
      </div>

      {mode === "manual" && (
        <>
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px"
            }}
          >
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a8a", marginBottom: "6px" }}>
              Profesionalus rankinis šablonų redaktorius
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Redaguokite antraštę, turinį ir poraštę atskirai, naudokite formatavimo įrankius ir iš karto matykite A4 peržiūrą prieš išsaugant.
            </div>
          </div>

          <div>
            <EditorContent editor={tiptapTestEditor} />
          </div>

          <div style={{ ...formGrid, gridTemplateColumns: "minmax(320px, 1.2fr) minmax(360px, 0.8fr)", alignItems: "start" }}>
            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ ...formGrid, gridTemplateColumns: "1.2fr 0.8fr", marginBottom: 0 }}>
                  <div style={formGroup}>
                    <label style={label}>Šablono pavadinimas</label>
                    <input
                      style={inputBase}
                      value={manualState.name}
                      onChange={(e) => updateManualState({ name: e.target.value })}
                      placeholder="pvz. Profesionalus vežėjo orderis"
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "end", gap: "10px", flexWrap: "wrap" }}>
                    <button type="button" style={btnSecondary} onClick={createNewTemplate}>Naujas</button>
                    <button type="button" style={btnSuccess} onClick={saveTemplate}>💾 Išsaugoti</button>
                  </div>
                </div>
              </div>

              <div className="template-editor-toolbar" style={{
                position: "sticky",
                top: "60px",
                zIndex: 100,
                background: "white",
                padding: "15px",
                borderBottom: "2px solid #e0e0e0",
                marginBottom: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a" }}>Įrankių juosta</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Aktyvi sekcija: {activeEditor === "header" ? "Antraštė" : activeEditor === "body" ? "Turinys" : "Poraštė"}</div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <select
                    title="Pasirinkti teksto stilių"
                    style={{ ...inputBase, width: "auto" }}
                    value="p"
                    onMouseDown={saveSelection}
                    onChange={(e) => {
                      const val = e.target.value;
                      focusEditor(activeEditor, previewMode === "canvas" ? "preview" : "source");
                      restoreSelection();
                      document.execCommand("formatBlock", false, val);
                      if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || "");
                    }}
                  >
                    <option value="p">Pastraipa</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Quote</option>
                  </select>
                  <select
                    title="Font Size"
                    style={{ ...inputBase, width: "auto" }}
                    value={fontScale}
                    onMouseDown={saveSelection}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFontScale(val);
                      focusEditor(activeEditor, previewMode === "canvas" ? "preview" : "source");
                      restoreSelection();
                      document.execCommand("fontSize", false, val);
                      if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || "");
                    }}
                  >
                    <option value="2">Tekstas S</option>
                    <option value="3">Tekstas M</option>
                    <option value="4">Tekstas L</option>
                    <option value="5">Tekstas XL</option>
                    <option value="6">Tekstas XXL</option>
                  </select>
                  <input
                    title="Text Color"
                    type="color"
                    value={textColor}
                    onMouseDown={saveSelection}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextColor(val);
                      focusEditor(activeEditor, previewMode === "canvas" ? "preview" : "source");
                      restoreSelection();
                      document.execCommand("foreColor", false, val);
                      if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || "");
                    }}
                    style={{ width: "46px", height: "42px", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "4px", background: "#fff" }}
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px", fontWeight: "bold" }}
                    title="Bold (Ctrl+B)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px", fontStyle: "italic" }}
                    title="Italic (Ctrl+I)"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("underline", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px", textDecoration: "underline" }}
                    title="Underline (Ctrl+U)"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertUnorderedList", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Bulleted List"
                  >
                    •
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertOrderedList", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Numbered List"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("justifyLeft", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Align Left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("justifyCenter", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Align Center"
                  >
                    ↔
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("justifyRight", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Align Right"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("undo", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Undo (Ctrl+Z)"
                  >↩</button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); document.execCommand("redo", false, null); if (activeEditableRef.current) syncSectionState(activeEditor, activeEditableRef.current.innerHTML || ""); }}
                    style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px", minWidth: "42px" }}
                    title="Redo (Ctrl+Y)"
                  >↪</button>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <button title="Įterpti informacinę lentelę" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("infoTable"); }}>Info lentelė</button>
                  <button title="Įterpti kainų lentelę" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("priceTable"); }}>Kainų lentelė</button>
                  <button title="Įterpti hero bloką" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("heroCard"); }}>Hero blokas</button>
                  <button title="Naujas puslapis (A4)" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); insertTemplateBlock("pageBreak"); }}>Puslapio lūžis</button>
                  <button title="Įterpti paveikslėlį" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}>Įkelti paveikslą</button>
                  <button title="Pridėti lentelės eilutę" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); addTableRow(); }}>+ Eilutė</button>
                  <button title="Pridėti lentelės stulpelį" type="button" style={{ ...btnSecondary, padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); addTableColumn(); }}>+ Stulpelis</button>
                  <button title="Pašalinti lentelės eilutę" type="button" style={{ ...btnSecondary, background: "#b91c1c", padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); deleteTableRow(); }}>− Eilutė</button>
                  <button title="Spausdinti šabloną (peržiūra)" type="button" style={{ ...btnSecondary, background: "#0f766e", color: "#fff", border: "none", padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => { e.preventDefault(); }} onClick={() => { const css = `body{margin:0;font-family:Arial,Helvetica,sans-serif;}@media print{@page{size:A4;margin:15mm;}}[data-page-break="true"]{page-break-before:always;break-before:page;display:block!important;height:0!important;}`; const html = [manualState.headerHtml, manualState.bodyHtml, manualState.footerHtml].join(""); const win = window.open("","_blank"); if(win){win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Šablonas</title><style>${css}</style></head><body>${html}<script>window.onload=()=>window.print();<\/script></body></html>`); win.document.close();} }}>🖨️ Spausdinti</button>
                  <button title="Parsisiųsti kaip Word (.doc)" type="button" style={{ ...btnSecondary, background: "#1d4ed8", color: "#fff", border: "none", padding: "8px 12px", fontSize: "12px" }} onMouseDown={(e) => e.preventDefault()} onClick={handleWordExport}>📄 Word</button>
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { void handleInlineImage(e, activeEditor); }} />
                <div style={{ position: "relative", display: "inline-block" }}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      const dropdown = e.currentTarget.nextElementSibling;
                      if (!dropdown) return;
                      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
                    }}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      background: "#4CAF50",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600"
                    }}
                  >
                    Dinaminiai laukai
                  </button>

                  <div style={{
                    display: "none",
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    minWidth: "300px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    zIndex: 1001,
                    marginTop: "5px"
                  }}>
                    {dynamicFieldCategories.map((category) => (
                      <div key={category.title}>
                        <div style={{ padding: "12px", borderBottom: "2px solid #e0e0e0", background: "#f5f5f5", fontWeight: "bold", color: "#333", marginTop: category.title === "Užsakymas" ? 0 : "8px" }}>
                          {category.title}
                        </div>
                        {category.fields.map((field) => (
                          <button
                            key={field.key}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              insertField(field.key);
                              const dropdown = e.currentTarget.parentElement?.parentElement;
                              if (dropdown) dropdown.style.display = "none";
                            }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 15px", border: "none", background: "white", cursor: "pointer", fontSize: "14px" }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "#f0f0f0"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "white"; }}
                          >
                            {field.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", marginBottom: "12px" }}>Logo ir asset valdymas</div>
                <div style={{ ...formGrid, gridTemplateColumns: "1fr 1fr", marginBottom: "12px" }}>
                  <div style={formGroup}>
                    <label style={label}>Logotipas</label>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button type="button" style={btnSecondary} onClick={() => logoInputRef.current?.click()}>Įkelti logo</button>
                      <button type="button" style={{ ...btnSecondary, background: "#b91c1c" }} onClick={() => updateLogoSetting("logoSrc", "")}>Pašalinti</button>
                    </div>
                    <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { void handleLogoUpload(e); }} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Logo plotis (px)</label>
                    <input style={inputBase} type="number" min="40" value={manualState.assets.logoWidth} onChange={(e) => updateLogoSetting("logoWidth", Math.max(40, Number(e.target.value) || 220))} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Logo aukštis (px)</label>
                    <input style={inputBase} type="number" min="20" value={manualState.assets.logoHeight ?? 80} onChange={(e) => updateLogoSetting("logoHeight", Math.max(20, Number(e.target.value) || 80))} />
                  </div>
                </div>
                <div style={{ ...formGrid, gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
                  <div style={formGroup}>
                    <label style={label}>Logo lygiavimas</label>
                    <select style={inputBase} value={manualState.assets.logoAlign} onChange={(e) => updateLogoSetting("logoAlign", e.target.value)}>
                      <option value="left">Kairėje</option>
                      <option value="center">Centre</option>
                      <option value="right">Dešinėje</option>
                    </select>
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Logo peržiūra</label>
                    <div style={{ padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", minHeight: "96px", display: "flex", justifyContent: manualState.assets.logoAlign === "left" ? "flex-start" : manualState.assets.logoAlign === "center" ? "center" : "flex-end", alignItems: "center" }}>
                      <img src={manualState.assets.logoSrc || previewFields.company_logo} alt="Logo preview" style={{ width: `${manualState.assets.logoWidth}px`, height: `${manualState.assets.logoHeight || 80}px`, maxWidth: "100%", objectFit: "fill" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", marginBottom: "12px" }}>Puslapio nustatymai</div>
                <div style={{ ...formGrid, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 0 }}>
                  <div style={formGroup}>
                    <label style={label}>Orientacija</label>
                    <select style={inputBase} value={manualState.layout.orientation} onChange={(e) => updateLayout("orientation", e.target.value)}>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Viršus (mm)</label>
                    <input style={inputBase} type="number" value={manualState.layout.marginTop} onChange={(e) => updateLayout("marginTop", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Dešinė (mm)</label>
                    <input style={inputBase} type="number" value={manualState.layout.marginRight} onChange={(e) => updateLayout("marginRight", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Apačia (mm)</label>
                    <input style={inputBase} type="number" value={manualState.layout.marginBottom} onChange={(e) => updateLayout("marginBottom", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Kairė (mm)</label>
                    <input style={inputBase} type="number" value={manualState.layout.marginLeft} onChange={(e) => updateLayout("marginLeft", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Tarpas po antrašte (mm)</label>
                    <input style={inputBase} type="number" value={manualState.layout.headerSpacing} onChange={(e) => updateLayout("headerSpacing", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Tarpas iki poraštės (mm)</label>
                    <input style={inputBase} type="number" value={manualState.layout.footerSpacing} onChange={(e) => updateLayout("footerSpacing", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Puslapių tarpas (px)</label>
                    <input style={inputBase} type="number" value={manualState.layout.pageGap} onChange={(e) => updateLayout("pageGap", Number(e.target.value) || 0)} />
                  </div>
                  <div style={formGroup}>
                    <label style={label}>Peržiūros mastelis (%)</label>
                    <input style={inputBase} type="number" value={manualState.layout.zoom} onChange={(e) => updateLayout("zoom", Number(e.target.value) || 10)} />
                  </div>
                </div>
              </div>

              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ display: "grid", gap: "16px" }}>
                  {[
                    ["header", "Antraštė", headerRef, manualState.headerHtml],
                    ["body", "Pagrindinis turinys", bodyRef, manualState.bodyHtml],
                    ["footer", "Poraštė", footerRef, manualState.footerHtml]
                  ].map(([key, title, ref, html]) => (
                    <div key={key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <label style={{ ...label, marginBottom: 0 }}>{title}</label>
                        <button
                          type="button"
                          style={activeEditor === key ? btn : btnSecondary}
                          onClick={() => focusEditor(key, "source")}
                        >
                          Aktyvuoti
                        </button>
                      </div>
                      {key === "body" ? (
                        <div
                          ref={ref}
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => onEditableFocus(key, ref)}
                          onInput={() => onEditableInput("body", ref)}
                          style={{
                            minHeight: "400px",
                            border: "1px solid #ddd",
                            padding: "15px",
                            borderRadius: "4px",
                            background: "white",
                            lineHeight: "1.6"
                          }}
                        />
                      ) : (
                        <div
                          ref={ref}
                          contentEditable
                          suppressContentEditableWarning
                          onFocus={() => onEditableFocus(key, ref)}
                          onInput={() => onEditableInput(key, ref)}
                          style={{
                            minHeight: "140px",
                            border: activeEditor === key ? "2px solid #3b82f6" : "1px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "14px",
                            background: "#ffffff",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            outline: "none"
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            <div style={{ position: "sticky", top: "12px" }}>
              <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a" }}>Vizuali A4 peržiūra</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {previewMode === "canvas" ? "Tiesiogiai redaguojama drobė" : `Paginuota peržiūra • ${previewPages.length} psl.`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" style={previewMode === "canvas" ? btn : btnSecondary} onClick={() => setPreviewMode("canvas")}>Edit preview</button>
                    <button type="button" style={previewMode === "pages" ? btn : btnSecondary} onClick={() => setPreviewMode("pages")}>Page preview</button>
                    <button type="button" style={btnSecondary} onClick={zoomOut}>−</button>
                    <button type="button" style={btnSecondary} onClick={fitPreview}>Fit</button>
                    <button type="button" style={btnSecondary} onClick={zoomIn}>+</button>
                  </div>
                </div>
                <div ref={previewViewportRef} style={{ maxHeight: "calc(100vh - 180px)", overflow: "auto", paddingRight: "4px", background: "#e2e8f0", borderRadius: "10px", padding: "16px" }}>
                  {previewMode === "canvas" && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <div style={{ background: "#fff", border: "1px solid #cbd5e1", boxShadow: "0 18px 36px rgba(15,23,42,0.14)", width: `${pageSize.width}px`, minHeight: `${pageSize.height}px`, zoom: previewScale }}>
                        <div style={{ padding: `${manualState.layout.marginTop}mm ${manualState.layout.marginRight}mm ${manualState.layout.marginBottom}mm ${manualState.layout.marginLeft}mm`, boxSizing: "border-box", minHeight: `${pageSize.height}px`, fontFamily: "Arial, Helvetica, sans-serif" }}>
                          <div
                            ref={previewHeaderRef}
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => onEditableFocus("header", previewHeaderRef)}
                            onInput={() => onEditableInput("header", previewHeaderRef)}
                            style={{ outline: activeEditor === "header" ? "2px solid #3b82f6" : "1px dashed transparent", borderRadius: "10px", marginBottom: `${manualState.layout.headerSpacing}mm`, minHeight: "80px" }}
                          />
                          <div
                            ref={previewBodyRef}
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => onEditableFocus("body", previewBodyRef)}
                            onInput={() => onEditableInput("body", previewBodyRef)}
                            style={{ outline: activeEditor === "body" ? "2px solid #3b82f6" : "1px dashed transparent", borderRadius: "10px", minHeight: `${pageSize.height - 280}px` }}
                          />
                          <div
                            ref={previewFooterRef}
                            contentEditable
                            suppressContentEditableWarning
                            onFocus={() => onEditableFocus("footer", previewFooterRef)}
                            onInput={() => onEditableInput("footer", previewFooterRef)}
                            style={{ outline: activeEditor === "footer" ? "2px solid #3b82f6" : "1px dashed transparent", borderRadius: "10px", marginTop: `${manualState.layout.footerSpacing}mm`, minHeight: "44px" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {previewMode === "pages" && previewPages.map((pageHtml, index) => (
                    <div key={index} style={{ marginBottom: `${manualState.layout.pageGap}px` }}>
                      <div style={{ fontSize: "12px", color: "#475569", marginBottom: "8px", fontWeight: 600 }}>Puslapis {index + 1} / {previewPages.length}</div>
                      {/* Outer box is the scaled size; iframe inside is full A4, then CSS-transformed down */}
                      <div style={{ width: `${pageSize.width * previewScale}px`, height: `${pageSize.height * previewScale}px`, overflow: "hidden", background: "#fff", border: "1px solid #cbd5e1", boxShadow: "0 10px 30px rgba(15,23,42,0.12)" }}>
                        <iframe
                          srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;}${DOC_CSS}[data-page-break="true"]{display:none!important;}</style></head><body><div style="padding:${manualState.layout.marginTop}mm ${manualState.layout.marginRight}mm ${manualState.layout.marginBottom}mm ${manualState.layout.marginLeft}mm;">${renderedHeader}<div style="margin-top:${manualState.layout.headerSpacing}mm;">${pageHtml}</div><div style="margin-top:${manualState.layout.footerSpacing}mm;">${renderedFooter}</div></div></body></html>`}
                          style={{ width: `${pageSize.width}px`, height: `${pageSize.height}px`, border: "none", display: "block", transform: `scale(${previewScale})`, transformOrigin: "top left" }}
                          title={`Puslapis ${index + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {mode === "ai" && (
        <div>
          <div
            style={{
              marginBottom: "20px",
              padding: "16px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px"
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1e3a8a", marginBottom: "6px" }}>
              AI šablonų generavimas
            </div>
            <div style={{ fontSize: "12px", color: "#475569" }}>
              UI paruošta AI generavimui. Šiame etape palikta tik struktūra ir laukų išdėstymas.
            </div>
          </div>
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Šablono paskirtis</label>
              <input style={inputBase} placeholder="pvz. Vežėjo užsakymo forma" disabled />
            </div>
            <div style={formGroup}>
              <label style={label}>Kalba ir tonas</label>
              <input style={inputBase} placeholder="pvz. LT, formalus" disabled />
            </div>
          </div>
          <div style={formGroup}>
            <label style={label}>Reikalingos sekcijos</label>
            <textarea
              rows="5"
              style={{ ...inputBase, resize: "vertical" }}
              placeholder="pvz. Užsakymo numeris, klientas, vežėjas, maršrutas, kainos, sąlygos..."
              disabled
            />
          </div>
          <button type="button" style={{ ...btnSecondary, marginTop: "20px", opacity: 0.8, cursor: "not-allowed" }} disabled>
            Greitai bus galima generuoti su AI
          </button>
        </div>
      )}
    </div>
  );
}

export function Settings({ settings, saveSettings }) {
  const [formData, setFormData] = useState(() => buildDefaultSettings(settings));
  const [section, setSection] = useState("company");
  const sectionButtons = [
    { key: "company", title: "🏢 Įmonės duomenys" },
    { key: "documents", title: "📄 Dokumentai" },
    { key: "email", title: "📧 El. paštas" },
    { key: "templates", title: "📝 Užsakymų šablonai" }
  ];

  useEffect(() => {
    setFormData(buildDefaultSettings(settings));
  }, [settings]);

  const persist = (next = formData) => {
    const merged = buildDefaultSettings(next);
    setFormData(merged);
    saveSettings(merged);
    window.alert("✅ Nustatymai išsaugoti!");
  };

  const uploadStamp = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      window.alert("⚠️ Failas per didelis! Maksimalus dydis: 500 KB");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, companyStampSignature: dataUrl }));
    } catch {
      window.alert("❌ Klaida įkeliant failą");
    }
  };

  return (
    <div style={pageCard}>
      <div style={cardHeader}>
        <h2 style={cardTitle}>⚙️ Nustatymai</h2>
      </div>

      <div style={{ display: "flex", gap: "20px", marginBottom: "24px", flexWrap: "wrap" }}>
        {sectionButtons.map((item) => (
          <button
            key={item.key}
            type="button"
            style={section === item.key ? btn : btnSecondary}
            onClick={() => setSection(item.key)}
          >
            {item.title}
          </button>
        ))}
      </div>

      {section === "company" && (
        <div>
          <h3 style={{ marginBottom: "16px", color: "#1e3a8a" }}>🏢 Įmonės duomenys</h3>

          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Aplinka</label>
              <select
                style={inputBase}
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              >
                <option value="test">🧪 Test / Demo</option>
                <option value="production">🚀 Production / Reali</option>
              </select>
            </div>
          </div>

          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Pavadinimas *</label>
              <input
                style={inputBase}
                value={formData.company.name}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, name: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Įmonės kodas *</label>
              <input
                style={inputBase}
                value={formData.company.code}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, code: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>PVM kodas *</label>
              <input
                style={inputBase}
                value={formData.company.vat}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, vat: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Telefonas *</label>
              <input
                style={inputBase}
                value={formData.company.phone}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, phone: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Email *</label>
              <input
                style={inputBase}
                type="email"
                value={formData.company.email}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, email: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Adresas</label>
              <input
                style={inputBase}
                value={formData.company.address}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, address: e.target.value } })}
              />
            </div>
          </div>

          <h4 style={{ marginTop: "24px", marginBottom: "12px", color: "#1e3a8a" }}>Banko duomenys</h4>
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Bankas</label>
              <input
                style={inputBase}
                value={formData.company.bank_name}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, bank_name: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Sąskaitos nr.</label>
              <input
                style={inputBase}
                value={formData.company.bank_account}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, bank_account: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>SWIFT</label>
              <input
                style={inputBase}
                value={formData.company.swift}
                onChange={(e) => setFormData({ ...formData, company: { ...formData.company, swift: e.target.value } })}
              />
            </div>
          </div>

          <h4 style={{ marginTop: "24px", marginBottom: "12px", color: "#1e3a8a" }}>Įmonės antspaudas ir parašas</h4>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
              Įkelkite įmonės antspaudą su direktoriaus parašu
            </label>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
              Šis antspaudas bus automatiškai įterpiamas į visus orderius vežėjams. Rekomenduojamas PNG formatas su permatomu fonu.
            </div>

            {formData.companyStampSignature ? (
              <div style={{ marginBottom: "12px" }}>
                <div
                  style={{
                    padding: "16px",
                    background: "#f8fafc",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    display: "inline-block"
                  }}
                >
                  <img
                    src={formData.companyStampSignature}
                    style={{ maxHeight: "120px", maxWidth: "200px", display: "block" }}
                    alt="Company Stamp"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    style={{ ...btnSecondary, marginTop: "10px", fontSize: "13px" }}
                    onClick={() => {
                      if (window.confirm("Ar tikrai norite pašalinti antspaudą?")) {
                        setFormData({ ...formData, companyStampSignature: "" });
                      }
                    }}
                  >
                    🗑️ Pašalinti antspaudą
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "12px" }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={uploadStamp}
                  style={{
                    padding: "10px",
                    border: "2px dashed #cbd5e1",
                    borderRadius: "6px",
                    cursor: "pointer",
                    width: "100%",
                    maxWidth: "400px",
                    background: "#fff"
                  }}
                />
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                  ✓ Formatai: PNG, JPG | ✓ Maks. dydis: 500 KB | ✓ Rekomenduojamas: PNG su permatomu fonu
                </div>
              </div>
            )}
          </div>

          <button type="button" style={{ ...btnSuccess, marginTop: "20px" }} onClick={() => persist()}>
            💾 Išsaugoti Įmonės Duomenis
          </button>
        </div>
      )}

      {section === "documents" && (
        <div>
          <h3 style={{ marginBottom: "16px", color: "#1e3a8a" }}>📄 Dokumentų nustatymai</h3>
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Numeracijos formatas</label>
              <input
                style={inputBase}
                value={formData.documents.auto_numbering_format}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documents: { ...formData.documents, auto_numbering_format: e.target.value }
                  })
                }
                placeholder="RAD-{YEAR}-{NUMBER}"
              />
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Pvz: RAD-2026-001</div>
            </div>
            <div style={formGroup}>
              <label style={label}>Kalba pagal nutylėjimą</label>
              <select
                style={inputBase}
                value={formData.documents.default_language}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documents: { ...formData.documents, default_language: e.target.value }
                  })
                }
              >
                <option value="lt">🇱🇹 Lietuvių</option>
                <option value="en">🇬🇧 English</option>
                <option value="pl">🇵🇱 Polski</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.documents.show_vat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documents: { ...formData.documents, show_vat: e.target.checked }
                  })
                }
              />
              Rodyti PVM dokumentuose
            </label>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={label}>Sąlygų tekstas (LT)</label>
            <textarea
              rows="6"
              style={{ ...inputBase, width: "100%", resize: "vertical" }}
              value={formData.documents.terms_lt}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  documents: { ...formData.documents, terms_lt: e.target.value }
                })
              }
            />
          </div>

          <button type="button" style={{ ...btnSuccess, marginTop: "20px" }} onClick={() => persist()}>
            💾 Išsaugoti Dokumentų Nustatymus
          </button>
        </div>
      )}

      {section === "email" && (
        <div>
          <h3 style={{ marginBottom: "16px", color: "#1e3a8a" }}>📧 El. pašto nustatymai</h3>
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Siuntėjo adresas</label>
              <input
                style={inputBase}
                type="email"
                value={formData.email.from_address}
                onChange={(e) => setFormData({ ...formData, email: { ...formData.email, from_address: e.target.value } })}
              />
            </div>
            <div style={formGroup}>
              <label style={label}>Siuntėjo vardas</label>
              <input
                style={inputBase}
                value={formData.email.from_name}
                onChange={(e) => setFormData({ ...formData, email: { ...formData.email, from_name: e.target.value } })}
              />
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={formData.email.auto_attach_pdf}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: { ...formData.email, auto_attach_pdf: e.target.checked }
                  })
                }
              />
              Automatiškai prisegti PDF
            </label>
          </div>

          <div style={{ ...formGroup, marginTop: "16px" }}>
            <label style={label}>Visada CC (atskirti kableliais)</label>
            <input
              style={inputBase}
              value={formData.email.always_cc.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  email: {
                    ...formData.email,
                    always_cc: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  }
                })
              }
              placeholder="email1@example.com, email2@example.com"
            />
          </div>

          <button type="button" style={{ ...btnSuccess, marginTop: "20px" }} onClick={() => persist()}>
            💾 Išsaugoti Email Nustatymus
          </button>
        </div>
      )}

      {section === "templates" && (
        <TemplateManager
          settings={formData}
          saveSettings={(next) => {
            const merged = buildDefaultSettings(next);
            setFormData(merged);
            saveSettings(merged);
          }}
        />
      )}
    </div>
  );
}
export function Orders({ orders, saveOrders, clients, carriers, openModal }) {
  const deleteOrder = (id) => {
    if (window.confirm("Ar tikrai norite ištrinti šį užsakymą?")) {
      saveOrders(orders.filter((item) => item.id !== id));
    }
  };

  return (
    <div style={pageCard}>
      <div style={cardHeader}>
        <h2 style={cardTitle}>Užsakymai ({orders.length})</h2>
        <button style={btn} onClick={() => openModal("order", null)}>+ Naujas Užsakymas</button>
      </div>
      {orders.length > 0 ? (() => {
        const totalClient = orders.reduce((s, o) => s + (Number(o.clientPrice) || 0), 0);
        const totalCarrier = orders.reduce((s, o) => s + (Number(o.carrierPrice) || 0), 0);
        const totalProfit = totalClient - totalCarrier;
        return (
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Mūsų Užs. Nr.</th>
                <th style={th}>Kl. Užs. Nr.</th>
                <th style={th}>Klientas</th>
                <th style={th}>Vežėjas</th>
                <th style={th}>Maršrutas</th>
                <th style={th}>Kl. Kaina</th>
                <th style={th}>Vež. Kaina</th>
                <th style={th}>Pelnas</th>
                <th style={th}>Statusas</th>
                <th style={th}>Veiksmai</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const profit = (order.clientPrice || 0) - (order.carrierPrice || 0);
                const margin = order.carrierPrice ? ((profit / order.carrierPrice) * 100).toFixed(1) : 0;
                return (
                  <tr key={order.id}>
                    <td style={td}><strong style={{ cursor: "pointer", color: "#3b82f6", textDecoration: "underline" }} onClick={() => openModal("order", order)}>{order.orderNumber || "-"}</strong></td>
                    <td style={{ ...td, fontSize: "12px" }}>{order.clientOrderNumber || "-"}</td>
                    <td style={td}>{order.clientName || "-"}</td>
                    <td style={td}>{order.carrierName || "-"}</td>
                    <td style={{ ...td, fontSize: "12px", maxWidth: "160px" }}>{order.route || "-"}</td>
                    <td style={td}>{order.clientPrice ? euro(order.clientPrice) : "-"}</td>
                    <td style={td}>{order.carrierPrice ? euro(order.carrierPrice) : "-"}</td>
                    <td style={td}>
                      {order.clientPrice && order.carrierPrice
                        ? <span style={{ fontWeight: 600, color: profit >= 0 ? "#059669" : "#dc2626" }}>
                            {profit >= 0 ? "+" : ""}{profit.toFixed(2)} €
                            <div style={{ fontSize: "10px", color: "#64748b" }}>({margin}%)</div>
                          </span>
                        : "-"}
                    </td>
                    <td style={td}><span style={statusBadgeStyle(order.status)}>{statusLabel(order.status)}</span></td>
                    <td style={td}>
                      <div style={actionButtons}>
                        <button style={actionBtn} onClick={() => openModal("order", order)} title="Redaguoti">✎</button>
                        <button style={actionBtn} onClick={() => deleteOrder(order.id)} title="Ištrinti">🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f9fafb", fontWeight: 600, borderTop: "2px solid #e5e7eb" }}>
                <td colSpan={5} style={{ ...td, textAlign: "right", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Iš viso ({orders.length} užs.):</td>
                <td style={{ ...td, color: "#059669", fontWeight: 700 }}>{totalClient.toFixed(2)} €</td>
                <td style={{ ...td, color: "#3b82f6", fontWeight: 700 }}>{totalCarrier.toFixed(2)} €</td>
                <td style={{ ...td, fontWeight: 700, color: totalProfit >= 0 ? "#059669" : "#dc2626" }}>{totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)} €</td>
                <td colSpan={2} style={td}></td>
              </tr>
            </tfoot>
          </table>
        );
      })() : <div style={emptyState}><div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>📦</div><h3>Nėra užsakymų</h3><p>Sukurkite pirmą užsakymą</p></div>}
    </div>
  );
}
export function Modal({ type, initialData, onClose, clients, carriers, saveOrders, saveCarriers, orders, settings }) {
  const [formData, setFormData] = useState(emptyOrderForm);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  // quickAdd: null | { type: "manager"|"driver"|"truck"|"trailer", fields: {...} }
  const [quickAdd, setQuickAdd] = useState(null);

  const companyAsClient = {
    clientId: "COMPANY_SETTINGS",
    clientName: settings?.company?.name || "",
    clientCompanyCode: settings?.company?.code || "",
    clientVatCode: settings?.company?.vat || "",
    clientPhone: settings?.company?.phone || "",
    clientEmail: settings?.company?.email || "",
    clientAddress: settings?.company?.address || "",
  };

  useEffect(() => {
    if (type !== "order") return;
    if (initialData) {
      setFormData((prev) => ({ ...prev, ...companyAsClient, ...initialData, ...companyAsClient }));
      return;
    }
    try {
      const savedDraft = JSON.parse(localStorage.getItem("currentOrderDraftForm") || "null");
      if (savedDraft) {
        setFormData((prev) => ({ ...prev, ...savedDraft, ...companyAsClient }));
        return;
      }
    } catch {}
    setFormData({ ...emptyOrderForm, ...companyAsClient });
  }, [type, initialData]);

  useEffect(() => {
    if (type === "order") {
      localStorage.setItem("currentOrderDraftForm", JSON.stringify(formData));
    }
  }, [type, formData]);

  const updateFormData = (updates) => setFormData((prev) => ({ ...prev, ...updates }));

  const saveQuickAddEntity = () => {
    if (!quickAdd || !formData.carrierId) return;
    const carrier = carriers.find((c) => String(c.id) === String(formData.carrierId));
    if (!carrier) return;

    const fieldMap = { manager: "managerContacts", driver: "drivers", truck: "trucks", trailer: "trailers" };
    const field = fieldMap[quickAdd.type];
    const newItem = { ...quickAdd.fields, id: Date.now() };
    const updatedCarrier = { ...carrier, [field]: [...(carrier[field] || []), newItem] };

    if (saveCarriers) {
      saveCarriers(carriers.map((c) => String(c.id) === String(formData.carrierId) ? updatedCarrier : c));
    }

    // Auto-fill the order form with the newly created entity
    if (quickAdd.type === "manager") {
      updateFormData({ contactName: newItem.name || "", contactPhone: newItem.phone || "", contactEmail: newItem.email || "" });
    } else if (quickAdd.type === "driver") {
      updateFormData({ driverName: newItem.name || "", driverPhone: newItem.phone || "" });
    } else if (quickAdd.type === "truck") {
      updateFormData({ truckPlate: (newItem.licensePlate || "").toUpperCase() });
    } else if (quickAdd.type === "trailer") {
      updateFormData({ trailerPlate: (newItem.licensePlate || "").toUpperCase() });
    }

    setQuickAdd(null);
  };

  const upsertOrder = (payload) => {
    const existingIndex = orders.findIndex((item) => item.id === payload.id);
    if (existingIndex >= 0) {
      const updated = [...orders];
      updated[existingIndex] = { ...updated[existingIndex], ...payload, updatedAt: new Date().toISOString() };
      saveOrders(updated);
      return updated[existingIndex];
    }
    const created = { ...payload, id: payload.id || Date.now(), createdAt: new Date().toISOString() };
    saveOrders([...orders, created]);
    return created;
  };

  const saveOrderAsDraft = (status = "draft", silent = false) => {
    const selectedCarrier = carriers.find((c) => c.id == formData.carrierId) || {};
    const payload = { ...formData, id: formData.id, orderNumber: formData.orderNumber || createOrderNumber(orders), status, clientName: formData.clientName || "", carrierName: formData.carrierName || selectedCarrier.name || "", carrierCompanyCode: selectedCarrier.companyCode || formData.carrierCompanyCode || "", carrierVAT: selectedCarrier.vatCode || formData.carrierVAT || "", carrierAddress: selectedCarrier.address || formData.carrierAddress || "", carrierPhone: selectedCarrier.phone || formData.carrierPhone || "", carrierEmail: selectedCarrier.email || formData.carrierEmail || "" };
    if (payload.orderType === "resale_to_carrier" && payload.clientPrice && payload.carrierPrice) {
      payload.profit = payload.clientPrice - payload.carrierPrice;
      payload.profitMargin = payload.carrierPrice ? (payload.profit / payload.carrierPrice) * 100 : 0;
    }
    const saved = upsertOrder(payload);
    setFormData((prev) => ({ ...prev, id: saved.id, orderNumber: saved.orderNumber }));
    if (!silent) window.alert(`Juodraštis išsaugotas (${saved.orderNumber})`);
    return saved;
  };

  const buildDocumentHtml = () => {
    const templateId = formData._selectedTemplateId || settings.templates?.find((t) => t.isDefault)?.id || settings.templates?.[0]?.id;
    const template = settings.templates?.find((t) => String(t.id) === String(templateId));
    if (!template) { window.alert("Pasirinkite šabloną."); return null; }
    const _instrLines = [
      formData.instructions ? `<div style="font-size:13px; line-height:1.7; color:rgba(255,255,255,0.92);">${formData.instructions}</div>` : "",
      formData.vinNumbers ? `<div style="font-size:13px; line-height:1.7; color:rgba(255,255,255,0.92); margin-top:8px;"><strong>VIN numeriai:</strong> ${formData.vinNumbers}</div>` : "",
    ].filter(Boolean).join("");
    const values = {
      order_number: formData.orderNumber || "—",
      client_order_number: formData.clientOrderNumber || "—",
      client_name: formData.clientName || "—",
      carrier_name: formData.carrierName || "—",
      route: formData.route || "—",
      loading_date: formData.loadingDate || "—",
      unloading_date: formData.unloadingDate || "—",
      carrier_price: formData.carrierPrice ? `${Number(formData.carrierPrice).toFixed(2)} EUR${formData.carrierPriceWithVAT ? " + PVM" : ""}` : "—",
      client_price: formData.clientPrice ? `${Number(formData.clientPrice).toFixed(2)} EUR` : "—",
      payment_term: formData.paymentTerm || "—",
      today_date: new Date().toLocaleDateString("lt-LT"),
      creation_date: new Date().toLocaleDateString("lt-LT"),
      cargo: formData.cargo || "—",
      cargo_type: formData.cargoType || formData.cargo || "—",
      quantity: formData.vehicleCount || "—",
      sender_name: formData.loadingCompanyName || "—",
      loading_address: [formData.loadingStreet, formData.loadingCity, formData.loadingPostalCode].filter(Boolean).join(", ") || "—",
      receiver_name: formData.unloadingCompanyName || "—",
      unloading_address: [formData.unloadingStreet, formData.unloadingCity, formData.unloadingPostalCode].filter(Boolean).join(", ") || "—",
      driver_name: formData.driverName || "—",
      truck_number: formData.truckPlate || "—",
      trailer_number: formData.trailerPlate || "—",
      load_number: formData.loadRefLoading || "—",
      ref_number: formData.loadRefUnloading || "—",
      vin_numbers: formData.vinNumbers || "—",
      instructions: formData.instructions || "—",
      client_company_code: formData.clientCompanyCode || "—",
      client_vat_code: formData.clientVatCode || "—",
      client_phone: formData.clientPhone || "—",
      client_email: formData.clientEmail || "—",
      client_address: formData.clientAddress || "—",
      carrier_company_code: carriers.find((c) => String(c.id) === String(formData.carrierId))?.companyCode || formData.carrierCompanyCode || "—",
      carrier_vat_code: carriers.find((c) => String(c.id) === String(formData.carrierId))?.vatCode || "—",
      carrier_phone: carriers.find((c) => String(c.id) === String(formData.carrierId))?.phone || formData.carrierPhone || "—",
      carrier_email: carriers.find((c) => String(c.id) === String(formData.carrierId))?.email || formData.carrierEmail || "—",
      carrier_address: carriers.find((c) => String(c.id) === String(formData.carrierId))?.address || formData.carrierAddress || "—",
      // Transparent 1×1 PNG when stamp not set — prevents broken-image icon in the output.
      // The CSS in DOC_CSS hides these via img[data-stamp][src^="data:image/png;base64,iVBOR"].
      company_stamp_signature: settings?.companyStampSignature || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      company_logo: settings?.company?.logo_url || template.editorState?.manual?.assets?.logoSrc || "",
      instructions_block: _instrLines ? `<div style="padding:16px 18px; background:#0f172a; border-radius:18px; color:#ffffff; margin-bottom:20px;"><div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(255,255,255,0.72); margin-bottom:8px;">Instrukcijos vežėjui</div>${_instrLines}</div>` : "",
      contact_name: formData.contactName || "—",
      contact_phone: formData.contactPhone || "—",
      contact_email: formData.contactEmail || "—",
      requires_original_documents_warning: formData.originalsRequired === "required" ? `<div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%); border-radius:12px; padding:16px 20px; margin:20px 0; box-shadow:0 4px 12px rgba(239,68,68,0.3);"><div style="display:flex; align-items:center; gap:12px;"><span style="font-size:24px;">⚠️</span><span style="color:white; font-size:14px; font-weight:600;">Šiam užsakymui bus reikalingi originalūs dokumentai</span></div></div>` : "",
    };
    // Re-compile from editorState.manual so the rendered document always contains the full
    // current token set (stamp, logo, etc.) regardless of when template.content was last saved.
    // Fall back to template.content for legacy templates that have no editorState.
    const editorManual = template.editorState?.manual;
    const compiledHtml = editorManual
      ? buildTemplateMarkup({
          ...defaultManualTemplateState(),
          ...editorManual,
          layout: { ...defaultManualTemplateState().layout, ...(editorManual.layout || {}) },
          assets: { ...defaultManualTemplateState().assets, ...(editorManual.assets || {}) },
        })
      : String(template.content || "");
    return compiledHtml.replace(/{{\s*([^}]+)\s*}}/g, (_, k) => values[k.trim()] ?? "");
  };

  const generateCarrierOrder = () => {
    if (!formData.orderType) return window.alert("Pasirinkite užsakymo tipą.");
    if (formData.orderType !== "resale_to_carrier") return window.alert("Orderis vežėjui generuojamas tik pasirinkus pardavimą vežėjui.");
    if (!formData.carrierId) return window.alert("Pasirinkite vežėją.");
    saveOrderAsDraft("generated", true);
    window.alert("Užsakymas pažymėtas kaip paruoštas siuntimui.");
  };

  const saveToDb = () => {
    if (!formData.orderType) return window.alert("Pasirinkite užsakymo tipą.");
    if (formData.orderType === "resale_to_carrier") {
      if (!formData.carrierId) return window.alert("Perpardavimui būtinas vežėjas.");
      if (!formData.carrierPrice) return window.alert("Įveskite vežėjo kainą.");
      const profit = (formData.clientPrice || 0) - (formData.carrierPrice || 0);
      if (profit < 0 && !window.confirm(`DĖMESIO: Neigiamas pelnas (${profit.toFixed(2)} EUR). Ar tikrai norite tęsti?`)) return;
    }
    const selectedCarrier = carriers.find((c) => c.id === formData.carrierId);
    const newItem = { ...formData, id: formData.id || Date.now(), orderNumber: formData.orderNumber || createOrderNumber(orders), status: "active", clientName: formData.clientName || "", carrierName: selectedCarrier?.name || formData.carrierName || "" };
    if (newItem.orderType === "resale_to_carrier" && newItem.clientPrice && newItem.carrierPrice) {
      newItem.profit = newItem.clientPrice - newItem.carrierPrice;
      newItem.profitMargin = (newItem.profit / newItem.carrierPrice) * 100;
    }
    upsertOrder(newItem);
    localStorage.removeItem("currentOrderDraftForm");
    setPreviewHtml(null);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveToDb();
  };

  const printCss = `
    /* ── Shared document classes (identical to Page preview iframes) ─ */
    ${DOC_CSS}

    /* ── SCREEN: single scrollable document on grey desk ─────── */
    @media screen {
      html { background: #525659; }
      body { margin: 0; padding: 24px 0 40px; background: #525659; }
      [data-template-root] {
        width: 210mm;
        margin: 0 auto;
        background: #fff;
        box-shadow: 0 2px 12px rgba(0,0,0,0.5);
      }
      /* Page-break divs become visible grey bands between pages */
      [data-page-break="true"] {
        display: block !important;
        height: 24px !important;
        overflow: visible !important;
        background: #525659;
        margin: 0 -14mm;
        box-shadow: inset 0 2px 3px rgba(0,0,0,0.2), inset 0 -2px 3px rgba(0,0,0,0.2);
      }
    }

    /* ── PRINT: native A4 output ─────────────────────────────── */
    @media print {
      @page { size: A4; margin: 15mm; }
      html, body { margin: 0; padding: 0; background: #fff; }
      [data-template-root] { width: auto; box-shadow: none; }
      [data-page-break="true"] { page-break-before: always; break-before: page; display: block !important; height: 0 !important; background: transparent !important; margin: 0 !important; box-shadow: none !important; overflow: hidden !important; }
    }
  `;

  /* No JavaScript page splitting — CSS handles the layout. */
  const previewScript = ``;

  if (type !== "order") return null;
  return (
    <>
    <div style={modalOverlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: "20px", color: "#1e3a8a", margin: 0 }}>{initialData ? "Redaguoti Užsakymą" : "Naujas Užsakymas"}</h2>
          <button style={closeBtn} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "12px", fontWeight: 600, color: "#1e3a8a" }}>1. Užsakymo tipas *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
              {["own_transport", "resale_to_carrier"].map((choice) => (
                <div key={choice} onClick={() => updateFormData({ orderType: choice })} style={{ padding: "16px", border: `2px solid ${formData.orderType === choice ? "#3b82f6" : "#e2e8f0"}`, borderRadius: "8px", cursor: "pointer", background: formData.orderType === choice ? "#eff6ff" : "#fff", textAlign: "center" }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{choice === "own_transport" ? "🚛" : "🔄"}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{choice === "own_transport" ? "Nuosavas transportas" : "Pardavimas vežėjui"}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>Kliento užsakymo numeris</label>
              <input style={inputBase} value={formData.clientOrderNumber || ""} onChange={(e) => updateFormData({ clientOrderNumber: e.target.value })} placeholder="pvz. PO-2026-0042" />
            </div>
            <div style={formGroup}>
              <label style={label}>Statusas</label>
              <select style={inputBase} value={formData.status || "new"} onChange={(e) => updateFormData({ status: e.target.value })}>
                {Object.entries(STATUS_MAP).filter(([k]) => !["active","draft","generated"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={formGrid}>
            <div style={formGroup}>
              <label style={label}>2. Klientas (užsakovas)</label>
              <input style={{ ...inputBase, background: "#f3f4f6", cursor: "not-allowed", color: "#374151", fontWeight: 500 }} type="text" value={formData.clientName || settings?.company?.name || ""} disabled />
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Automatiškai užpildyta iš Nustatymų → Įmonės duomenys</div>
            </div>
            <div style={formGroup}><label style={label}>Kliento kaina (EUR) *</label><input style={inputBase} type="number" step="0.01" required value={formData.clientPrice || ""} onChange={(e) => updateFormData({ clientPrice: parseFloat(e.target.value) || 0 })} placeholder="1200.00" /></div>
          </div>
          {formData.orderType === "resale_to_carrier" && (
            <>
              <div style={{ ...formGrid, marginTop: "16px" }}>
                <div style={formGroup}>
                  <label style={label}>3. Vežėjas (vykdytojas) *</label>
                  <select
                    style={inputBase}
                    required
                    value={formData.carrierId || ""}
                    onChange={(e) => {
                      const carrier = carriers.find((c) => String(c.id) === String(e.target.value));
                      const mgr = carrier?.managerContacts?.[0];
                      setQuickAdd(null);
                      updateFormData({
                        carrierId: e.target.value,
                        carrierName: carrier?.name || "",
                        carrierType: carrier?.carrierType || "",
                        contactName: mgr?.name || "",
                        contactPhone: mgr?.phone || "",
                        contactEmail: mgr?.email || "",
                        driverName: "",
                        truckPlate: "",
                        trailerPlate: ""
                      });
                    }}
                  >
                    <option value="">Pasirinkite...</option>
                    {carriers
                      .filter((c) => !c.isOwnCompany)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} 🚛
                        </option>
                      ))}
                  </select>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Rodomi tik išoriniai vežėjai
                  </div>
                </div>
                <div style={formGroup}>
                  <label style={label}>Vadybininkas</label>
                  <select
                    style={inputBase}
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      if (e.target.value === "__add__") {
                        setQuickAdd({ type: "manager", fields: { name: "", phone: "", email: "", position: "" } });
                        return;
                      }
                      const mgr = (carriers.find((c) => String(c.id) === String(formData.carrierId))?.managerContacts || []).find((m) => String(m.id) === e.target.value);
                      if (mgr) updateFormData({ contactName: mgr.name || "", contactPhone: mgr.phone || "", contactEmail: mgr.email || "" });
                    }}
                  >
                    <option value="">— Pasirinkite vadybininką —</option>
                    {(carriers.find((c) => String(c.id) === String(formData.carrierId))?.managerContacts || []).map((m) => (
                      <option key={m.id} value={String(m.id)}>{m.name}{m.position ? ` · ${m.position}` : ""}</option>
                    ))}
                    {formData.carrierId && <option value="__add__">+ Pridėti naują vadybininką</option>}
                  </select>
                  {quickAdd?.type === "manager" && (
                    <div style={{ marginTop: "8px", padding: "12px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px" }}>
                      <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "13px", color: "#1e3a8a" }}>Naujas vadybininkas</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <input style={inputBase} placeholder="Vardas Pavardė *" value={quickAdd.fields.name} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, name: e.target.value } }))} />
                        <input style={inputBase} placeholder="Pareigos" value={quickAdd.fields.position} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, position: e.target.value } }))} />
                        <input style={inputBase} placeholder="Telefonas" value={quickAdd.fields.phone} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, phone: e.target.value } }))} />
                        <input style={inputBase} placeholder="El. paštas" value={quickAdd.fields.email} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, email: e.target.value } }))} />
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        <button type="button" style={{ ...btn, background: "#16a34a", fontSize: "12px", padding: "5px 14px" }} onClick={saveQuickAddEntity} disabled={!quickAdd.fields.name.trim()}>Išsaugoti</button>
                        <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "5px 14px" }} onClick={() => setQuickAdd(null)}>Atšaukti</button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", ...formGroup }}>
                  <div>
                    <label style={label}>Vadybininko vardas</label>
                    <input style={inputBase} value={formData.contactName || ""} onChange={(e) => updateFormData({ contactName: e.target.value })} placeholder="Jonas Jonaitis" />
                  </div>
                  <div>
                    <label style={label}>Vadybininko tel.</label>
                    <input style={inputBase} value={formData.contactPhone || ""} onChange={(e) => updateFormData({ contactPhone: e.target.value })} placeholder="+370 600 00000" />
                  </div>
                  <div>
                    <label style={label}>Vadybininko el. paštas</label>
                    <input style={inputBase} value={formData.contactEmail || ""} onChange={(e) => updateFormData({ contactEmail: e.target.value })} placeholder="jonas@carrier.lt" />
                  </div>
                </div>
                <div style={formGroup}>
                  <label style={label}>Vežėjo kaina (savikaina EUR) *</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      style={{ ...inputBase, flex: 1 }}
                      type="number"
                      step="0.01"
                      required
                      value={formData.carrierPrice || ""}
                      onChange={(e) => updateFormData({ carrierPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="1000.00"
                    />
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "13px",
                        whiteSpace: "nowrap",
                        cursor: "pointer"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.carrierPriceWithVAT || false}
                        onChange={(e) => updateFormData({ carrierPriceWithVAT: e.target.checked })}
                      />
                      +PVM
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ ...formGrid, marginTop: "12px" }}>
                <div style={formGroup}>
                  <label style={label}>Mokėjimo terminas vežėjui</label>
                  <select
                    style={inputBase}
                    value={formData.paymentTerm || "14 dienų"}
                    onChange={(e) => updateFormData({ paymentTerm: e.target.value })}
                  >
                    {[
                      "1 diena",
                      "5 dienos",
                      "7 dienos",
                      "10 dienų",
                      "14 dienų",
                      "15 dienų",
                      "20 dienų",
                      "25 dienos",
                      "30 dienų",
                      "35 dienos",
                      "40 dienų",
                      "45 dienos",
                      "50 dienų",
                      "55 dienos",
                      "60 dienų"
                    ].map((term) => (
                      <option key={term} value={term}>
                        {term}
                        {term === "14 dienų" ? " (numatyta)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={formGroup}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      paddingTop: "8px"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.originalsRequired === true}
                      onChange={(e) => updateFormData({ originalsRequired: e.target.checked })}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      Originalūs dokumentai reikalingi
                    </span>
                  </label>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", marginLeft: "24px" }}>
                    CMR su pasirašymais turi būti pateikti originalūs
                  </div>
                </div>
              </div>
              {formData.clientPrice > 0 && formData.carrierPrice > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "16px",
                    background: (formData.clientPrice - formData.carrierPrice) < 0 ? "#fee2e2" : "#d1fae5",
                    border: `2px solid ${
                      (formData.clientPrice - formData.carrierPrice) < 0 ? "#ef4444" : "#10b981"
                    }`,
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                    💰 PELNAS: {(formData.clientPrice - formData.carrierPrice).toFixed(2)} EUR
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Marža: {(((formData.clientPrice - formData.carrierPrice) / formData.carrierPrice) * 100).toFixed(2)}%
                  </div>
                  {(formData.clientPrice - formData.carrierPrice) < 0 && (
                    <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                      ⚠️ DĖMESIO: Neigiamas pelnas!
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          <div style={{ marginTop: "16px" }}>
            <h4 style={sectionTitle}>🚚 Krovinio informacija</h4>
            <div style={formGrid}><div style={formGroup}><label style={label}>Krovinio tipas *</label><select style={inputBase} required value={formData.cargoType || ""} onChange={(e) => { const value = e.target.value; value !== "custom" ? updateFormData({ cargoType: value, cargo: value }) : updateFormData({ cargoType: value }); }}><option value="">Pasirinkite...</option><option value="Automobiliai">🚗 Automobiliai</option><option value="Neutralus krovinys">📦 Neutralus krovinys</option><option value="custom">✨ Kitas (įvesti rankiniu būdu)</option></select></div>{formData.cargoType === "custom" && <div style={formGroup}><label style={label}>Krovinio pavadinimas *</label><input style={inputBase} required value={formData.cargo || ""} placeholder="pvz. Baldai, Padangos..." onChange={(e) => updateFormData({ cargo: e.target.value })} /></div>}<div style={formGroup}><label style={label}>Automobilių skaičius</label><select style={inputBase} value={formData.vehicleCount || "1"} onChange={(e) => updateFormData({ vehicleCount: e.target.value })}>{[1,2,3,4,5,6,7,8,9,10].map((num) => <option key={num} value={String(num)}>{num} vnt.</option>)}</select></div><div style={formGroup}><label style={label}>VIN numeriai (nebūtina)</label><textarea rows="3" style={{ ...inputBase, fontFamily: "monospace", fontSize: "11px" }} value={formData.vinNumbers || ""} placeholder="Įveskite VIN numerius, kiekvienas naujoje eilutėje" onChange={(e) => updateFormData({ vinNumbers: e.target.value })} /></div></div>
            <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}><h5 style={{ marginBottom: "12px", color: "#1e3a8a", fontSize: "14px" }}>📨 Pakrovimo vieta (Siuntėjas)</h5><div style={formGrid}><div style={formGroup}><label style={label}>Įmonės pavadinimas</label><input style={inputBase} value={formData.loadingCompanyName || ""} placeholder="pvz. BMW AG" onChange={(e) => updateFormData({ loadingCompanyName: e.target.value })} /></div><div style={formGroup}><label style={label}>Miestas *</label><input style={inputBase} required value={formData.loadingCity || ""} placeholder="pvz. Hamburg" onChange={(e) => { const loadingCity = e.target.value; updateFormData({ loadingCity, route: loadingCity && formData.unloadingCity ? `${loadingCity} → ${formData.unloadingCity}` : formData.route }); }} /></div><div style={formGroup}><label style={label}>Gatvė ir nr.</label><input style={inputBase} value={formData.loadingStreet || ""} placeholder="pvz. Hauptstraße 123" onChange={(e) => updateFormData({ loadingStreet: e.target.value })} /></div><div style={formGroup}><label style={label}>Pašto kodas</label><input style={inputBase} value={formData.loadingPostalCode || ""} placeholder="pvz. 20095" onChange={(e) => updateFormData({ loadingPostalCode: e.target.value })} /></div><div style={formGroup}><label style={label}>Koordinatės (nebūtina)</label><input style={inputBase} value={formData.loadingCoordinates || ""} placeholder="pvz. 53.551086, 9.993682" onChange={(e) => updateFormData({ loadingCoordinates: e.target.value })} /></div></div></div>
            <div style={{ marginTop: "12px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}><h5 style={{ marginBottom: "12px", color: "#1e3a8a", fontSize: "14px" }}>📨 Iškrovimo vieta (Gavėjas)</h5><div style={formGrid}><div style={formGroup}><label style={label}>Įmonės pavadinimas</label><input style={inputBase} value={formData.unloadingCompanyName || ""} placeholder="pvz. UAB Automobiliai" onChange={(e) => updateFormData({ unloadingCompanyName: e.target.value })} /></div><div style={formGroup}><label style={label}>Miestas *</label><input style={inputBase} required value={formData.unloadingCity || ""} placeholder="pvz. Vilnius" onChange={(e) => { const unloadingCity = e.target.value; updateFormData({ unloadingCity, route: formData.loadingCity && unloadingCity ? `${formData.loadingCity} → ${unloadingCity}` : formData.route }); }} /></div><div style={formGroup}><label style={label}>Gatvė ir nr.</label><input style={inputBase} value={formData.unloadingStreet || ""} placeholder="pvz. Gedimino pr. 1" onChange={(e) => updateFormData({ unloadingStreet: e.target.value })} /></div><div style={formGroup}><label style={label}>Pašto kodas</label><input style={inputBase} value={formData.unloadingPostalCode || ""} placeholder="pvz. 01103" onChange={(e) => updateFormData({ unloadingPostalCode: e.target.value })} /></div><div style={formGroup}><label style={label}>Koordinatės (nebūtina)</label><input style={inputBase} value={formData.unloadingCoordinates || ""} placeholder="pvz. 54.687157, 25.279652" onChange={(e) => updateFormData({ unloadingCoordinates: e.target.value })} /></div></div></div>
            <div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>Maršrutas (auto-generuojamas)</label><input style={{ ...inputBase, background: "#f8fafc", cursor: "not-allowed" }} value={formData.route || ""} placeholder="Užpildykite adresus - maršrutas sugeneruosis automatiškai" readOnly /></div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <h4 style={sectionTitle}>🚛 Transportas ir vairuotojas</h4>
            <div style={formGrid}>
              {/* Truck */}
              <div style={formGroup}>
                <label style={label}>Vilkikas (valst. nr.)</label>
                {formData.carrierId && (carriers.find((c) => String(c.id) === String(formData.carrierId))?.trucks || []).length > 0 && (
                  <select style={{ ...inputBase, marginBottom: "6px" }} value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      if (e.target.value === "__add__") { setQuickAdd({ type: "truck", fields: { licensePlate: "", model: "", year: "" } }); return; }
                      updateFormData({ truckPlate: e.target.value });
                    }}>
                    <option value="">— Pasirinkite vilkiką —</option>
                    {(carriers.find((c) => String(c.id) === String(formData.carrierId))?.trucks || []).map((t) => (
                      <option key={t.id} value={t.licensePlate}>{t.licensePlate}{t.model ? ` · ${t.model}` : ""}</option>
                    ))}
                    <option value="__add__">+ Pridėti naują vilkiką</option>
                  </select>
                )}
                <input style={{ ...inputBase, textTransform: "uppercase" }} value={formData.truckPlate || ""} placeholder="pvz. ABC123" onChange={(e) => updateFormData({ truckPlate: e.target.value.toUpperCase() })} />
                {formData.carrierId && (carriers.find((c) => String(c.id) === String(formData.carrierId))?.trucks || []).length === 0 && (
                  <button type="button" style={{ marginTop: "6px", background: "none", border: "1px dashed #93c5fd", color: "#2563eb", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
                    onClick={() => setQuickAdd({ type: "truck", fields: { licensePlate: "", model: "", year: "" } })}>+ Pridėti vilkiką</button>
                )}
                {quickAdd?.type === "truck" && (
                  <div style={{ marginTop: "8px", padding: "12px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "13px", color: "#1e3a8a" }}>Naujas vilkikas</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: "8px" }}>
                      <input style={inputBase} placeholder="Valst. numeris *" value={quickAdd.fields.licensePlate} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, licensePlate: e.target.value } }))} />
                      <input style={inputBase} placeholder="Modelis" value={quickAdd.fields.model} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, model: e.target.value } }))} />
                      <input style={inputBase} placeholder="Metai" type="number" value={quickAdd.fields.year} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, year: e.target.value } }))} />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="button" style={{ ...btn, background: "#16a34a", fontSize: "12px", padding: "5px 14px" }} onClick={saveQuickAddEntity} disabled={!quickAdd.fields.licensePlate.trim()}>Išsaugoti</button>
                      <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "5px 14px" }} onClick={() => setQuickAdd(null)}>Atšaukti</button>
                    </div>
                  </div>
                )}
              </div>
              {/* Trailer */}
              <div style={formGroup}>
                <label style={label}>Priekaba (valst. nr.)</label>
                {formData.carrierId && (carriers.find((c) => String(c.id) === String(formData.carrierId))?.trailers || []).length > 0 && (
                  <select style={{ ...inputBase, marginBottom: "6px" }} value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      if (e.target.value === "__add__") { setQuickAdd({ type: "trailer", fields: { licensePlate: "", model: "", year: "" } }); return; }
                      updateFormData({ trailerPlate: e.target.value });
                    }}>
                    <option value="">— Pasirinkite priekabą —</option>
                    {(carriers.find((c) => String(c.id) === String(formData.carrierId))?.trailers || []).map((t) => (
                      <option key={t.id} value={t.licensePlate}>{t.licensePlate}{t.model ? ` · ${t.model}` : ""}</option>
                    ))}
                    <option value="__add__">+ Pridėti naują priekabą</option>
                  </select>
                )}
                <input style={{ ...inputBase, textTransform: "uppercase" }} value={formData.trailerPlate || ""} placeholder="pvz. XYZ789" onChange={(e) => updateFormData({ trailerPlate: e.target.value.toUpperCase() })} />
                {formData.carrierId && (carriers.find((c) => String(c.id) === String(formData.carrierId))?.trailers || []).length === 0 && (
                  <button type="button" style={{ marginTop: "6px", background: "none", border: "1px dashed #93c5fd", color: "#2563eb", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
                    onClick={() => setQuickAdd({ type: "trailer", fields: { licensePlate: "", model: "", year: "" } })}>+ Pridėti priekabą</button>
                )}
                {quickAdd?.type === "trailer" && (
                  <div style={{ marginTop: "8px", padding: "12px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "13px", color: "#1e3a8a" }}>Nauja priekaba</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: "8px" }}>
                      <input style={inputBase} placeholder="Valst. numeris *" value={quickAdd.fields.licensePlate} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, licensePlate: e.target.value } }))} />
                      <input style={inputBase} placeholder="Modelis" value={quickAdd.fields.model} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, model: e.target.value } }))} />
                      <input style={inputBase} placeholder="Metai" type="number" value={quickAdd.fields.year} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, year: e.target.value } }))} />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="button" style={{ ...btn, background: "#16a34a", fontSize: "12px", padding: "5px 14px" }} onClick={saveQuickAddEntity} disabled={!quickAdd.fields.licensePlate.trim()}>Išsaugoti</button>
                      <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "5px 14px" }} onClick={() => setQuickAdd(null)}>Atšaukti</button>
                    </div>
                  </div>
                )}
              </div>
              {/* Driver */}
              <div style={formGroup}>
                <label style={label}>Vairuotojas</label>
                {formData.carrierId && (carriers.find((c) => String(c.id) === String(formData.carrierId))?.drivers || []).length > 0 && (
                  <select style={{ ...inputBase, marginBottom: "6px" }} value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      if (e.target.value === "__add__") { setQuickAdd({ type: "driver", fields: { name: "", phone: "", licenseNumber: "" } }); return; }
                      const drv = (carriers.find((c) => String(c.id) === String(formData.carrierId))?.drivers || []).find((d) => String(d.id) === e.target.value);
                      if (drv) updateFormData({ driverName: drv.name || "" });
                    }}>
                    <option value="">— Pasirinkite vairuotoją —</option>
                    {(carriers.find((c) => String(c.id) === String(formData.carrierId))?.drivers || []).map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name}{d.phone ? ` · ${d.phone}` : ""}</option>
                    ))}
                    <option value="__add__">+ Pridėti naują vairuotoją</option>
                  </select>
                )}
                <input style={inputBase} value={formData.driverName || ""} placeholder="pvz. Jonas Jonaitis" onChange={(e) => updateFormData({ driverName: e.target.value })} />
                {formData.carrierId && (carriers.find((c) => String(c.id) === String(formData.carrierId))?.drivers || []).length === 0 && (
                  <button type="button" style={{ marginTop: "6px", background: "none", border: "1px dashed #93c5fd", color: "#2563eb", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}
                    onClick={() => setQuickAdd({ type: "driver", fields: { name: "", phone: "", licenseNumber: "" } })}>+ Pridėti vairuotoją</button>
                )}
                {quickAdd?.type === "driver" && (
                  <div style={{ marginTop: "8px", padding: "12px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "8px" }}>
                    <div style={{ fontWeight: 600, marginBottom: "8px", fontSize: "13px", color: "#1e3a8a" }}>Naujas vairuotojas</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input style={inputBase} placeholder="Vardas Pavardė *" value={quickAdd.fields.name} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, name: e.target.value } }))} />
                      <input style={inputBase} placeholder="Telefonas" value={quickAdd.fields.phone} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, phone: e.target.value } }))} />
                      <input style={{ ...inputBase, gridColumn: "1 / -1" }} placeholder="Pažymėjimo Nr." value={quickAdd.fields.licenseNumber} onChange={(e) => setQuickAdd((q) => ({ ...q, fields: { ...q.fields, licenseNumber: e.target.value } }))} />
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="button" style={{ ...btn, background: "#16a34a", fontSize: "12px", padding: "5px 14px" }} onClick={saveQuickAddEntity} disabled={!quickAdd.fields.name.trim()}>Išsaugoti</button>
                      <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "5px 14px" }} onClick={() => setQuickAdd(null)}>Atšaukti</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: "16px" }}><h4 style={sectionTitle}>📅 Datos</h4><div style={formGrid}><div style={formGroup}><label style={label}>Pakrovimo data *</label><input style={inputBase} type="date" required value={formData.loadingDate || ""} onChange={(e) => updateFormData({ loadingDate: e.target.value })} /></div><div style={formGroup}><label style={label}>Iškrovimo data *</label><input style={inputBase} type="date" required value={formData.unloadingDate || ""} onChange={(e) => updateFormData({ unloadingDate: e.target.value })} /></div></div>{formData.loadingDate && formData.unloadingDate && (() => { const start = new Date(formData.loadingDate); const end = new Date(formData.unloadingDate); const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); return <div style={{ marginTop: "8px", padding: "12px", background: days >= 0 ? "#eff6ff" : "#fee2e2", border: `1px solid ${days >= 0 ? "#3b82f6" : "#ef4444"}`, borderRadius: "6px", fontSize: "13px" }}>{days >= 0 ? <>ℹ️ Trukmė: <strong>{days} {days === 1 ? "diena" : days < 10 ? "dienos" : "dienų"}</strong></> : <span style={{ color: "#dc2626" }}>⚠️ Iškrovimo data ankstesnė už pakrovimo!</span>}</div>; })()}</div>
          <div style={{ marginTop: "16px" }}><h4 style={sectionTitle}>📋 Papildoma informacija</h4><div style={formGrid}><div style={formGroup}><label style={label}>Load/Ref numeris (pakrovimui)</label><input style={inputBase} value={formData.loadRefLoading || ""} placeholder="pvz. LRN-2024-001" onChange={(e) => updateFormData({ loadRefLoading: e.target.value })} /></div><div style={formGroup}><label style={label}>Load/Ref numeris (iškrovimui)</label><input style={inputBase} value={formData.loadRefUnloading || ""} placeholder="pvz. DLV-2024-001" onChange={(e) => updateFormData({ loadRefUnloading: e.target.value })} /></div></div><div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>VIN numeriai automobilių (atskirti kableliais)</label><textarea rows="2" style={{ ...inputBase, fontFamily: "monospace", fontSize: "12px" }} value={formData.vinNumbers || ""} placeholder="pvz. WBA1234567890ABCD, WBA9876543210EFGH, ..." onChange={(e) => updateFormData({ vinNumbers: e.target.value })} /></div><div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>Instrukcijos vežėjui</label><textarea rows="3" style={inputBase} value={formData.instructions || ""} placeholder="pvz. Skambinti prieš 1h iki pakrovimo. Automobiliai turi būti dengti..." onChange={(e) => updateFormData({ instructions: e.target.value })} /></div><div style={{ ...formGrid, marginTop: "12px" }}><div style={formGroup}><label style={label}>Originalūs dokumentai</label><select style={inputBase} value={formData.originalsRequired === true ? "required" : formData.originalsRequired || "not_required"} onChange={(e) => updateFormData({ originalsRequired: e.target.value })}><option value="not_required">Nereikalingi</option><option value="required">Reikalingi</option></select></div></div><div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>Pastabos</label><textarea rows="2" style={inputBase} value={formData.notes || ""} placeholder="Papildomos pastabos..." onChange={(e) => updateFormData({ notes: e.target.value })} /></div></div>
          {formData.orderType === "resale_to_carrier" && formData.carrierId && <div style={{ marginTop: "16px" }}><label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}><input type="checkbox" checked={formData.sendToCarrier !== false} onChange={(e) => updateFormData({ sendToCarrier: e.target.checked })} />📧 Siųsti orderį vežėjui el. paštu</label></div>}

          {Array.isArray(settings?.templates) && settings.templates.length > 0 && (
            <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <label style={{ ...label, marginBottom: "10px", display: "block" }}>📄 Generuoti dokumentą iš šablono</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  style={{ ...inputBase, flex: 1, minWidth: "200px" }}
                  value={formData._selectedTemplateId || ""}
                  onChange={(e) => updateFormData({ _selectedTemplateId: e.target.value })}
                >
                  <option value="">Pasirinkite šabloną...</option>
                  {settings.templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " ★" : ""}</option>
                  ))}
                </select>
                <button
                  type="button"
                  style={{ ...btn, background: "#7c3aed", whiteSpace: "nowrap" }}
                  onClick={() => { const html = buildDocumentHtml(); if (html) setPreviewHtml(html); }}
                >
                  📄 Generuoti dokumentą
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
            <button type="button" style={btnSecondary} onClick={onClose}>Atšaukti</button>
          </div>
        </form>
      </div>
    </div>

    {previewHtml && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", flexDirection: "column", animation: "fadeIn 0.18s ease" }} onClick={() => setPreviewHtml(null)}>
        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* HEADER */}
        <div style={{ background: "#0f172a", padding: "14px 20px", display: "flex", alignItems: "center", flexShrink: 0, borderBottom: "1px solid #1e293b" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: 700 }}>Užsakymo peržiūra</div>
            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>{formData.orderNumber || "Naujas užsakymas"} · {formData.carrierName || "vežėjas nepasirinktas"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginRight: "10px" }}>
            {[50, 75, 100, 125, 150].map((z) => (
              <button key={z} type="button" onClick={(e) => { e.stopPropagation(); setPreviewZoom(z); }}
                style={{ background: previewZoom === z ? "#3b82f6" : "#1e293b", border: "1px solid #334155", color: previewZoom === z ? "#fff" : "#94a3b8", fontSize: "11px", cursor: "pointer", padding: "3px 7px", borderRadius: "4px" }}
              >{z}%</button>
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPreviewHtml(null); }}
            style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", fontSize: "20px", lineHeight: 1, cursor: "pointer", padding: "4px 10px", borderRadius: "6px" }}
            title="Uždaryti"
          >×</button>
        </div>

        {/* BODY — document iframe, scrollable outer div */}
        <div style={{ flex: 1, overflowY: "auto", background: "#525659" }} onClick={(e) => e.stopPropagation()}>
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;}${printCss}</style></head><body>${previewHtml}<script>${previewScript}<\/script></body></html>`}
            style={{ width: "100%", border: "none", display: "block", zoom: previewZoom / 100 }}
            onLoad={(e) => {
              try {
                const doc = e.target.contentDocument || e.target.contentWindow?.document;
                const h = doc?.documentElement?.scrollHeight || doc?.body?.scrollHeight || 0;
                if (h > 0) e.target.style.height = h + "px";
              } catch (_) {}
            }}
            title="Dokumento peržiūra"
          />
        </div>

        {/* FOOTER — 5 action buttons */}
        <div style={{ background: "#0f172a", borderTop: "1px solid #1e293b", padding: "12px 20px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", flexShrink: 0, animation: "slideUp 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={{ ...btn, background: "#3b82f6", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); const carrier = carriers.find((c) => String(c.id) === String(formData.carrierId)); const email = carrier?.email || formData.carrierEmail || ""; if (!email) return window.alert("Vežėjo el. paštas nenurodytas."); window.location.href = `mailto:${email}?subject=Transporto užsakymas ${formData.orderNumber || ""}&body=Prašome rasti pridėtą transporto užsakymą.`; }}
          >📧 Siųsti vežėjui</button>
          <button
            type="button"
            style={{ ...btn, background: "#0f766e", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); const win = window.open("", "_blank"); if (win) { win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dokumentas</title><style>body{margin:0;font-family:Arial,sans-serif;}${printCss}</style></head><body>${previewHtml}<script>window.onload=()=>window.print();<\/script></body></html>`); win.document.close(); } }}
          >🖨️ Spausdinti</button>
          <button
            type="button"
            style={{ ...btnSuccess, fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); saveToDb(); }}
          >💾 Išsaugoti</button>
          <button
            type="button"
            style={{ ...btn, background: "#7c3aed", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); window.alert("PDF eksportavimas bus pridėtas netrukus."); }}
          >📄 Išsaugoti PDF</button>
          <button
            type="button"
            style={{ ...btn, background: "#1d4ed8", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => {
              e.stopPropagation();
              const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Uzsakymas</title></head><body>${previewHtml}</body></html>`;
              const blob = new Blob([docHtml], { type: "application/msword" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `uzsakymas_${formData.orderNumber || "doc"}.doc`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 5000);
            }}
          >📝 Word</button>
          <button
            type="button"
            style={{ ...btnSecondary, fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); setPreviewHtml(null); }}
          >✏️ Redaguoti</button>
        </div>
      </div>
    )}
    </>
  );
}
