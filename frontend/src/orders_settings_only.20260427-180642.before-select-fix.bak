
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { buildFutureDomainBundleFromDrafts } from "./order_draft_domain_adapter";
import { buildOrderDraftPersistPlan, executeOrderDraftPersistPlan, persistFutureDomainDraftSkeleton } from "./order_draft_persistence_adapter";
import { analyzeCarrierData, analyzeClientData, analyzeDriverData, analyzeTruckData, analyzeTrailerData } from "./missing_data_engine";

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
const observerMiniStat = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "8px 10px",
  color: "#1e3a8a",
  fontWeight: 700,
  fontSize: "12px"
};
const pickerGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "8px",
  marginTop: "8px"
};
const pickerButton = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  borderRadius: "8px",
  padding: "10px 12px",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "13px",
  lineHeight: 1.35
};
const pickerButtonActive = {
  ...pickerButton,
  border: "2px solid #2563eb",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: 700
};
const dataStatusCardBase = {
  marginTop: "14px",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
};
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
const createProjectId = (orders = []) => {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  for (const order of orders) {
    const match = String(order.projectId || "").match(/^PRJ-(\d{4})-(\d{4})$/);
    if (match && Number(match[1]) === year) {
      maxSeq = Math.max(maxSeq, Number(match[2]));
    }
  }
  return `PRJ-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
};
const buildFreshOrderSeed = (orders = [], settings = {}, overrides = {}) => ({
  ...emptyOrderForm,
  projectId: createProjectId(orders),
  orderNumber: createOrderNumber(orders),
  managerName: resolveDefaultManagerName(settings),
  ...overrides,
});
const resolveDefaultManagerName = (settings = {}) => {
  return (
    settings?.email?.from_name ||
    settings?.company?.contact_person ||
    "Saimondas Lukosius"
  );
};
const resolveExecutionCost = (executionDraft = {}) =>
  Number(
    executionDraft.orderType === "own_transport"
      ? executionDraft.executionCost || executionDraft.carrierPrice
      : executionDraft.carrierPrice
  ) || 0;
const buildRouteFromDraft = (projectDraft = {}) => {
  const loading = [projectDraft.loadingCity, projectDraft.loadingCountry].filter(Boolean).join(", ");
  const unloading = [projectDraft.unloadingCity, projectDraft.unloadingCountry].filter(Boolean).join(", ");
  if (loading && unloading) return `${loading} → ${unloading}`;
  if (projectDraft.loadingCity && projectDraft.unloadingCity) return `${projectDraft.loadingCity} → ${projectDraft.unloadingCity}`;
  return projectDraft.route || "";
};
const euro = (value) => `${Number(value || 0).toFixed(2)} €`;
const badge = (kind) => ({ display: "inline-block", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: kind === "success" ? "#dcfce7" : kind === "danger" ? "#fee2e2" : "#fef3c7", color: kind === "success" ? "#16a34a" : kind === "danger" ? "#dc2626" : "#ca8a04" });
const hasClientContactData = (contact = {}) =>
  Boolean(contact?.name || contact?.email || contact?.phone);
const normalizeClientContacts = (contacts = []) =>
  Array.isArray(contacts)
    ? contacts
        .filter((contact) => hasClientContactData(contact))
        .map((contact, index) => ({
          ...contact,
          id: contact?.id ?? `client-contact-${index + 1}`,
        }))
    : [];
const getDefaultClientContact = (client = {}) => {
  const contacts = normalizeClientContacts(client?.contacts);
  if (contacts.length === 0) return null;
  return (
    contacts.find((contact) => contact.isDefault || contact.isPrimary || contact.default === true) ||
    contacts[0]
  );
};
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
const emptyOrderForm = { orderType: "resale_to_carrier", sendToCarrier: true, projectId: "", managerName: "", clientOrderNumber: "", clientContactId: "", clientContactName: "", clientContactPhone: "", clientContactEmail: "", clientPrice: 0, carrierPrice: 0, executionCost: 0, carrierPriceWithVAT: false, vatMode: "without_vat", paymentTerm: "14 dienų", cargoType: "", cargo: "", cargoName: "", quantity: "", ldm: "", weight: "", temperature: "", palletCount: "", cargoNotes: "", vehicleCount: "1", vinNumbers: "", truckPlate: "", trailerPlate: "", driverName: "", loadingCompanyName: "", loadingCity: "", loadingStreet: "", loadingPostalCode: "", loadingCoordinates: "", loadingTime: "", loadingCountry: "Lietuva", loadingContact: "", loadingNotes: "", unloadingCompanyName: "", unloadingCity: "", unloadingStreet: "", unloadingPostalCode: "", unloadingCoordinates: "", unloadingTime: "", unloadingCountry: "Lietuva", unloadingContact: "", unloadingNotes: "", route: "", loadingDate: "", unloadingDate: "", loadRefLoading: "", loadRefUnloading: "", instructions: "", originalsRequired: "not_required", notes: "", internalNotes: "", documentUploadLink: "", clientId: "", clientName: "", carrierId: "", carrierName: "", carrierType: "", contactName: "", contactPhone: "", contactEmail: "", status: "new", documents: { cmr: "", pod: "", invoice: "" } };
const emptyProjectDraft = {
  projectId: "",
  managerName: "",
  clientOrderNumber: "",
  clientId: "",
  clientName: "",
  clientContactId: "",
  clientContactName: "",
  clientContactPhone: "",
  clientContactEmail: "",
  clientCompanyCode: "",
  clientVatCode: "",
  clientPhone: "",
  clientEmail: "",
  clientAddress: "",
  clientPrice: 0,
  cargoType: "",
  cargo: "",
  cargoName: "",
  quantity: "",
  ldm: "",
  weight: "",
  temperature: "",
  palletCount: "",
  cargoNotes: "",
  vehicleCount: "1",
  vinNumbers: "",
  loadingCompanyName: "",
  loadingCity: "",
  loadingStreet: "",
  loadingPostalCode: "",
  loadingCoordinates: "",
  loadingTime: "",
  loadingCountry: "Lietuva",
  loadingContact: "",
  loadingNotes: "",
  unloadingCompanyName: "",
  unloadingCity: "",
  unloadingStreet: "",
  unloadingPostalCode: "",
  unloadingCoordinates: "",
  unloadingTime: "",
  unloadingCountry: "Lietuva",
  unloadingContact: "",
  unloadingNotes: "",
  route: "",
  loadingDate: "",
  unloadingDate: "",
  loadRefLoading: "",
  loadRefUnloading: "",
  originalsRequired: "not_required",
  notes: "",
  internalNotes: "",
  documentUploadLink: "",
  documents: { cmr: "", pod: "", invoice: "" },
};
const emptyExecutionDraft = {
  id: undefined,
  orderNumber: "",
  orderType: "resale_to_carrier",
  status: "new",
  sendToCarrier: true,
  carrierId: "",
  carrierName: "",
  carrierType: "",
  carrierCompanyCode: "",
  carrierVAT: "",
  carrierPhone: "",
  carrierEmail: "",
  carrierAddress: "",
  carrierPrice: 0,
  executionCost: 0,
  carrierPriceWithVAT: false,
  vatMode: "without_vat",
  paymentTerm: "14 dienų",
  truckPlate: "",
  trailerPlate: "",
  driverName: "",
  instructions: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  _selectedTemplateId: "",
};
const normalizeVatMode = (value) => (value === true || value === "with_vat" ? "with_vat" : "without_vat");
const buildDraftsFromOrderForm = (form = {}) => {
  const normalized = {
    ...emptyOrderForm,
    ...form,
    documents: { ...emptyOrderForm.documents, ...(form.documents || {}) },
  };
  const normalizedVatMode = normalizeVatMode(normalized.vatMode ?? normalized.carrierPriceWithVAT);
  const normalizedOriginalsRequired = normalizeOriginalsRequired(normalized.originalsRequired);

  return {
    projectDraft: {
      ...emptyProjectDraft,
      projectId: normalized.projectId || "",
      managerName: normalized.managerName || "",
      clientOrderNumber: normalized.clientOrderNumber,
      clientId: normalized.clientId,
      clientName: normalized.clientName,
      clientContactId: normalized.clientContactId || "",
      clientContactName: normalized.clientContactName || "",
      clientContactPhone: normalized.clientContactPhone || "",
      clientContactEmail: normalized.clientContactEmail || "",
      clientCompanyCode: normalized.clientCompanyCode || "",
      clientVatCode: normalized.clientVatCode || "",
      clientPhone: normalized.clientPhone || "",
      clientEmail: normalized.clientEmail || "",
      clientAddress: normalized.clientAddress || "",
      clientPrice: normalized.clientPrice,
      cargoType: normalized.cargoType,
      cargo: normalized.cargo,
      cargoName: normalized.cargoName || "",
      quantity: normalized.quantity || "",
      ldm: normalized.ldm || "",
      weight: normalized.weight || "",
      temperature: normalized.temperature || "",
      palletCount: normalized.palletCount || "",
      cargoNotes: normalized.cargoNotes || "",
      vehicleCount: normalized.vehicleCount,
      vinNumbers: normalized.vinNumbers,
      loadingCompanyName: normalized.loadingCompanyName,
      loadingCity: normalized.loadingCity,
      loadingStreet: normalized.loadingStreet,
      loadingPostalCode: normalized.loadingPostalCode,
      loadingCoordinates: normalized.loadingCoordinates || "",
      loadingTime: normalized.loadingTime || "",
      loadingCountry: normalized.loadingCountry || "Lietuva",
      loadingContact: normalized.loadingContact || "",
      loadingNotes: normalized.loadingNotes || "",
      unloadingCompanyName: normalized.unloadingCompanyName,
      unloadingCity: normalized.unloadingCity,
      unloadingStreet: normalized.unloadingStreet,
      unloadingPostalCode: normalized.unloadingPostalCode,
      unloadingCoordinates: normalized.unloadingCoordinates || "",
      unloadingTime: normalized.unloadingTime || "",
      unloadingCountry: normalized.unloadingCountry || "Lietuva",
      unloadingContact: normalized.unloadingContact || "",
      unloadingNotes: normalized.unloadingNotes || "",
      route: normalized.route,
      loadingDate: normalized.loadingDate,
      unloadingDate: normalized.unloadingDate,
      loadRefLoading: normalized.loadRefLoading,
      loadRefUnloading: normalized.loadRefUnloading,
      originalsRequired: normalizedOriginalsRequired,
      notes: normalized.notes,
      internalNotes: normalized.internalNotes || "",
      documentUploadLink: normalized.documentUploadLink,
      documents: { ...emptyProjectDraft.documents, ...(normalized.documents || {}) },
    },
    executionDraft: {
      ...emptyExecutionDraft,
      id: normalized.id,
      orderNumber: normalized.orderNumber || "",
      orderType: normalized.orderType,
      status: normalized.status,
      sendToCarrier: normalized.sendToCarrier,
      carrierId: normalized.carrierId,
      carrierName: normalized.carrierName,
      carrierType: normalized.carrierType,
      carrierCompanyCode: normalized.carrierCompanyCode || "",
      carrierVAT: normalized.carrierVAT || "",
      carrierPhone: normalized.carrierPhone || "",
      carrierEmail: normalized.carrierEmail || "",
      carrierAddress: normalized.carrierAddress || "",
      carrierPrice: normalized.carrierPrice,
      executionCost: normalized.executionCost || normalized.carrierPrice || 0,
      carrierPriceWithVAT: normalizedVatMode === "with_vat",
      vatMode: normalizedVatMode,
      paymentTerm: normalized.paymentTerm,
      truckPlate: normalized.truckPlate,
      trailerPlate: normalized.trailerPlate,
      driverName: normalized.driverName,
      instructions: normalized.instructions,
      contactName: normalized.contactName,
      contactPhone: normalized.contactPhone,
      contactEmail: normalized.contactEmail,
      _selectedTemplateId: normalized._selectedTemplateId || "",
    },
  };
};
const buildLegacyOrderFormFromDrafts = (projectDraft = emptyProjectDraft, executionDraft = emptyExecutionDraft, base = {}) => ({
  ...emptyOrderForm,
  ...base,
  ...projectDraft,
  ...executionDraft,
  documents: {
    ...emptyOrderForm.documents,
    ...(projectDraft.documents || {}),
    ...(base.documents || {}),
  },
});
const buildDraftStorageSnapshot = (projectDraft = emptyProjectDraft, executionDraft = emptyExecutionDraft) => ({
  projectDraft: {
    ...emptyProjectDraft,
    ...projectDraft,
    documents: {
      ...emptyProjectDraft.documents,
      ...(projectDraft.documents || {}),
    },
  },
  executionDraft: {
    ...emptyExecutionDraft,
    ...executionDraft,
  },
});
const allowedLegacyCompatibilityKeys = new Set([
  "profit",
  "profitMargin",
  "createdAt",
  "updatedAt",
]);
const pickLegacyCompatibilityState = (source = {}) => {
  const nextState = {};
  Object.entries(source || {}).forEach(([key, value]) => {
    if (allowedLegacyCompatibilityKeys.has(key)) {
      nextState[key] = value;
    }
  });
  return nextState;
};
const buildLegacyOrderPayloadFromDrafts = ({
  projectDraft = emptyProjectDraft,
  executionDraft = emptyExecutionDraft,
  base = {},
  selectedCarrier = {},
  overrides = {},
} = {}) => {
  const basePayload = buildLegacyOrderFormFromDrafts(projectDraft, executionDraft, base);

  return {
    ...basePayload,
    ...overrides,
    projectId: projectDraft.projectId || basePayload.projectId || "",
    managerName: projectDraft.managerName || basePayload.managerName || "",
    clientId: projectDraft.clientId || basePayload.clientId || "",
    clientName: projectDraft.clientName || basePayload.clientName || "",
    clientContactId: projectDraft.clientContactId || basePayload.clientContactId || "",
    clientContactName: projectDraft.clientContactName || basePayload.clientContactName || "",
    clientContactPhone: projectDraft.clientContactPhone || basePayload.clientContactPhone || "",
    clientContactEmail: projectDraft.clientContactEmail || basePayload.clientContactEmail || "",
    clientCompanyCode: projectDraft.clientCompanyCode || basePayload.clientCompanyCode || "",
    clientVatCode: projectDraft.clientVatCode || basePayload.clientVatCode || "",
    clientPhone: projectDraft.clientPhone || basePayload.clientPhone || "",
    clientEmail: projectDraft.clientEmail || basePayload.clientEmail || "",
    clientAddress: projectDraft.clientAddress || basePayload.clientAddress || "",
    carrierId: executionDraft.carrierId || basePayload.carrierId || "",
    carrierName: executionDraft.carrierName || selectedCarrier.name || basePayload.carrierName || "",
    carrierType: executionDraft.carrierType || selectedCarrier.carrierType || basePayload.carrierType || "",
    carrierCompanyCode: selectedCarrier.companyCode || executionDraft.carrierCompanyCode || basePayload.carrierCompanyCode || "",
    carrierVAT: selectedCarrier.vatCode || executionDraft.carrierVAT || basePayload.carrierVAT || "",
    carrierAddress: selectedCarrier.address || executionDraft.carrierAddress || basePayload.carrierAddress || "",
    carrierPhone: selectedCarrier.phone || executionDraft.carrierPhone || basePayload.carrierPhone || "",
    carrierEmail: selectedCarrier.email || executionDraft.carrierEmail || basePayload.carrierEmail || "",
    contactName: executionDraft.contactName || basePayload.contactName || "",
    contactPhone: executionDraft.contactPhone || basePayload.contactPhone || "",
    contactEmail: executionDraft.contactEmail || basePayload.contactEmail || "",
    executionCost: executionDraft.executionCost || basePayload.executionCost || executionDraft.carrierPrice || basePayload.carrierPrice || 0,
    vatMode: executionDraft.vatMode,
    carrierPriceWithVAT: executionDraft.vatMode === "with_vat",
    originalsRequired: projectDraft.originalsRequired,
    carrierPrice:
      executionDraft.orderType === "own_transport"
        ? executionDraft.executionCost || executionDraft.carrierPrice || basePayload.carrierPrice || 0
        : executionDraft.carrierPrice || basePayload.carrierPrice || 0,
    cargoName: projectDraft.cargoName || basePayload.cargoName || "",
    quantity: projectDraft.quantity || basePayload.quantity || "",
    ldm: projectDraft.ldm || basePayload.ldm || "",
    weight: projectDraft.weight || basePayload.weight || "",
    temperature: projectDraft.temperature || basePayload.temperature || "",
    palletCount: projectDraft.palletCount || basePayload.palletCount || "",
    cargoNotes: projectDraft.cargoNotes || basePayload.cargoNotes || "",
    loadingTime: projectDraft.loadingTime || basePayload.loadingTime || "",
    loadingCountry: projectDraft.loadingCountry || basePayload.loadingCountry || "",
    loadingContact: projectDraft.loadingContact || basePayload.loadingContact || "",
    loadingNotes: projectDraft.loadingNotes || basePayload.loadingNotes || "",
    unloadingTime: projectDraft.unloadingTime || basePayload.unloadingTime || "",
    unloadingCountry: projectDraft.unloadingCountry || basePayload.unloadingCountry || "",
    unloadingContact: projectDraft.unloadingContact || basePayload.unloadingContact || "",
    unloadingNotes: projectDraft.unloadingNotes || basePayload.unloadingNotes || "",
    internalNotes: projectDraft.internalNotes || basePayload.internalNotes || "",
    documents: {
      ...emptyOrderForm.documents,
      ...(projectDraft.documents || {}),
      ...(basePayload.documents || {}),
      ...(overrides.documents || {}),
    },
  };
};
const normalizeOptionalText = (value) => String(value ?? "").trim();
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const toHtmlText = (value) => escapeHtml(value).replace(/\r?\n/g, "<br />");
const hasNumericValue = (value) => value !== "" && value !== null && value !== undefined && !Number.isNaN(Number(value));
const normalizeOriginalsRequired = (value) => (value === true || value === "required" ? "required" : "not_required");
const buildOptionalInfoRow = (label, value, { valueColor = "#1f2937", marginBottom = 3 } = {}) => {
  const text = normalizeOptionalText(value);
  if (!text) return "";
  return `<div style="margin-bottom:${marginBottom}px;"><span style="color:#6b7280; font-size:10px; display:block;">${escapeHtml(label)}</span><span style="color:${valueColor}; font-size:11px;">${toHtmlText(text)}</span></div>`;
};
const buildOptionalNoteBlock = (label, value) => {
  const text = normalizeOptionalText(value);
  if (!text) return "";
  return `<div style="margin-top:6px; padding:7px 8px; background:#ffffff; border:1px dashed #d1d5db; border-radius:6px;"><div style="color:#6b7280; font-size:10px; margin-bottom:3px;">${escapeHtml(label)}</div><div style="color:#334155; font-size:11px; line-height:1.45;">${toHtmlText(text)}</div></div>`;
};
const upgradeLegacyOrderTemplateBodyHtml = (html = "") => {
  let nextHtml = String(html || "");
  if (!nextHtml) return nextHtml;
  if (!nextHtml.includes("{{loading_contact_block}}")) {
    nextHtml = nextHtml.replace(
      '<div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#059669; font-weight:600; font-size:11px;">{{loading_date}}</span></div>',
      '<div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#059669; font-weight:600; font-size:11px;">{{loading_date}}</span></div>{{loading_contact_block}}{{loading_ref_number_block}}{{loading_notes_block}}'
    );
  }
  if (!nextHtml.includes("{{unloading_contact_block}}")) {
    nextHtml = nextHtml.replace(
      '<div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#dc2626; font-weight:600; font-size:11px;">{{unloading_date}}</span></div>',
      '<div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#dc2626; font-weight:600; font-size:11px;">{{unloading_date}}</span></div>{{unloading_contact_block}}{{unloading_ref_number_block}}{{unloading_notes_block}}'
    );
  }
  if (!nextHtml.includes("{{execution_transport_block}}")) {
    nextHtml = nextHtml.replace(
      /<div style="background:#eff6ff; padding:8px; border-radius:6px; margin-bottom:8px;">[\s\S]*?<\/div>\s*<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">/,
      '{{execution_transport_block}}<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">'
    );
  }
  if (!nextHtml.includes("{{reference_numbers_block}}")) {
    nextHtml = nextHtml.replace(
      /<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">\s*<div><span style="color:#6b7280; font-size:10px; display:block; margin-bottom:2px;">Load Nr<\/span><span style="color:#1f2937; font-weight:500; font-size:12px;">{{load_number}}<\/span><\/div>\s*<div><span style="color:#6b7280; font-size:10px; display:block; margin-bottom:2px;">Ref Nr<\/span><span style="color:#1f2937; font-weight:500; font-size:12px;">{{ref_number}}<\/span><\/div>\s*<\/div>/,
      '{{reference_numbers_block}}'
    );
  }
  if (!nextHtml.includes("{{vat_mode_badge}}")) {
    nextHtml = nextHtml.replace(
      '<span class="vezejo-kaina" style="color:white; font-size:18px; font-weight:700;">{{carrier_price}}</span>',
      '<div style="display:flex; align-items:center; gap:8px; justify-content:flex-end;"><span class="vezejo-kaina" style="color:white; font-size:18px; font-weight:700;">{{carrier_price}}</span>{{vat_mode_badge}}</div>'
    );
  }
  return nextHtml;
};
const buildDocumentTemplateValuesFromDrafts = ({
  projectDraft = emptyProjectDraft,
  executionDraft = emptyExecutionDraft,
  draftPayload = {},
  selectedCarrier = {},
  settings = {},
  template = null,
} = {}) => {
  const companyProfile = {
    name: settings?.company?.name || "",
    code: settings?.company?.code || "",
    vat: settings?.company?.vat || "",
    phone: settings?.company?.phone || "",
    email: settings?.company?.email || "",
    address: settings?.company?.address || "",
    bankName: settings?.company?.bank_name || "",
    bankAccount: settings?.company?.bank_account || "",
    swift: settings?.company?.swift || "",
  };
  const customerProfile = {
    name: projectDraft.clientName || "",
    code: projectDraft.clientCompanyCode || "",
    vat: projectDraft.clientVatCode || "",
    phone: projectDraft.clientPhone || "",
    email: projectDraft.clientEmail || "",
    address: projectDraft.clientAddress || "",
    contactName: projectDraft.clientContactName || "",
    contactPhone: projectDraft.clientContactPhone || "",
    contactEmail: projectDraft.clientContactEmail || "",
  };
  const carrierProfile = {
    name:
      executionDraft.carrierName ||
      selectedCarrier?.name ||
      (executionDraft.orderType === "own_transport" ? "Nuosavas transportas" : ""),
    code: selectedCarrier?.companyCode || executionDraft.carrierCompanyCode || "",
    vat: selectedCarrier?.vatCode || executionDraft.carrierVAT || "",
    phone: selectedCarrier?.phone || executionDraft.carrierPhone || "",
    email: selectedCarrier?.email || executionDraft.carrierEmail || "",
    address: selectedCarrier?.address || executionDraft.carrierAddress || "",
    contactName: executionDraft.contactName || "",
    contactPhone: executionDraft.contactPhone || "",
    contactEmail: executionDraft.contactEmail || "",
  };
  const companyStampToken = settings?.companyStampSignature || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  const companyContactName = settings?.email?.from_name || projectDraft.managerName || "";
  const companyContactPhone = companyProfile.phone || "";
  const companyContactEmail = settings?.email?.from_address || companyProfile.email || "";
  const originalsRequired = normalizeOriginalsRequired(projectDraft.originalsRequired);
  const vatModeKey = normalizeVatMode(executionDraft.vatMode ?? executionDraft.carrierPriceWithVAT);
  const vatModeLabel = vatModeKey === "with_vat" ? "+ PVM" : "be PVM";
  const loadingContact = normalizeOptionalText(projectDraft.loadingContact);
  const unloadingContact = normalizeOptionalText(projectDraft.unloadingContact);
  const loadingRefNumber = normalizeOptionalText(projectDraft.loadRefLoading);
  const unloadingRefNumber = normalizeOptionalText(projectDraft.loadRefUnloading);
  const loadingNotes = normalizeOptionalText(projectDraft.loadingNotes);
  const unloadingNotes = normalizeOptionalText(projectDraft.unloadingNotes);
  const driverName = normalizeOptionalText(executionDraft.driverName);
  const truckNumber = normalizeOptionalText(executionDraft.truckPlate);
  const trailerNumber = normalizeOptionalText(executionDraft.trailerPlate);
  const instructionLines = [
    executionDraft.instructions ? `<div style="font-size:13px; line-height:1.7; color:rgba(255,255,255,0.92);">${executionDraft.instructions}</div>` : "",
    projectDraft.vinNumbers ? `<div style="font-size:13px; line-height:1.7; color:rgba(255,255,255,0.92); margin-top:8px;"><strong>VIN numeriai:</strong> ${projectDraft.vinNumbers}</div>` : "",
  ].filter(Boolean).join("");
  const executionTransportRows = [
    buildOptionalInfoRow("Vairuotojas", driverName, { valueColor: "#1f2937", marginBottom: 0 }),
    buildOptionalInfoRow("Vilkikas", truckNumber, { valueColor: "#1f2937", marginBottom: 0 }),
    buildOptionalInfoRow("Priekaba", trailerNumber, { valueColor: "#1f2937", marginBottom: 0 }),
  ].filter(Boolean).join("");
  const executionTransportBlock = executionTransportRows
    ? `<div style="background:#eff6ff; padding:8px; border-radius:6px; margin-bottom:8px;"><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">${executionTransportRows}</div></div>`
    : "";
  const referenceNumbersBlock = loadingRefNumber || unloadingRefNumber
    ? `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">${buildOptionalInfoRow("Pakrovimo REF nr.", loadingRefNumber, { marginBottom: 0 })}${buildOptionalInfoRow("Iškrovimo REF nr.", unloadingRefNumber, { marginBottom: 0 })}</div>`
    : "";
  const vatModeBadge = `<span style="display:inline-block; padding:3px 8px; border-radius:999px; background:rgba(255,255,255,0.16); color:#ffffff; font-size:10px; font-weight:700; white-space:nowrap;">${escapeHtml(vatModeLabel)}</span>`;

  return {
    order_number: executionDraft.orderNumber || draftPayload.orderNumber || "—",
    project_id: projectDraft.projectId || draftPayload.projectId || "—",
    client_order_number: projectDraft.clientOrderNumber || "—",
    // Legacy alias: old templates use client_* for our company (ordering party).
    // Canonical templates should use company_* / customer_* / carrier_*.
    client_name: companyProfile.name || "—",
    client_code: companyProfile.code || "—",
    client_vat: companyProfile.vat || "—",
    client_company_code: companyProfile.code || "—",
    client_vat_code: companyProfile.vat || "—",
    client_phone: companyProfile.phone || "—",
    client_email: companyProfile.email || "—",
    client_address: companyProfile.address || "—",
    carrier_name: carrierProfile.name || "—",
    carrier_code: carrierProfile.code || "—",
    carrier_vat: carrierProfile.vat || "—",
    route: projectDraft.route || "—",
    loading_date: projectDraft.loadingDate || "—",
    unloading_date: projectDraft.unloadingDate || "—",
    carrier_price: hasNumericValue(executionDraft.carrierPrice) ? `${Number(executionDraft.carrierPrice).toFixed(2)} EUR ${vatModeLabel}` : "—",
    client_price: hasNumericValue(projectDraft.clientPrice) ? `${Number(projectDraft.clientPrice).toFixed(2)} EUR` : "—",
    payment_term: executionDraft.paymentTerm || "—",
    today_date: new Date().toLocaleDateString("lt-LT"),
    creation_date: new Date().toLocaleDateString("lt-LT"),
    cargo: projectDraft.cargoName || projectDraft.cargo || "—",
    cargo_type: projectDraft.cargoType || projectDraft.cargoName || projectDraft.cargo || "—",
    quantity: projectDraft.quantity || projectDraft.vehicleCount || "—",
    cargo_quantity: projectDraft.quantity || projectDraft.vehicleCount || "—",
    sender_name: projectDraft.loadingCompanyName || "—",
    loading_address: [projectDraft.loadingStreet, projectDraft.loadingCity, projectDraft.loadingPostalCode].filter(Boolean).join(", ") || "—",
    loading_postcode: projectDraft.loadingPostalCode || "",
    loading_contact: loadingContact,
    loading_ref_number: loadingRefNumber,
    loading_notes: loadingNotes,
    receiver_name: projectDraft.unloadingCompanyName || "—",
    unloading_address: [projectDraft.unloadingStreet, projectDraft.unloadingCity, projectDraft.unloadingPostalCode].filter(Boolean).join(", ") || "—",
    unloading_postcode: projectDraft.unloadingPostalCode || "",
    unloading_contact: unloadingContact,
    unloading_ref_number: unloadingRefNumber,
    unloading_notes: unloadingNotes,
    driver_name: driverName || "—",
    truck_number: truckNumber || "—",
    trailer_number: trailerNumber || "—",
    load_number: loadingRefNumber || "—",
    ref_number: unloadingRefNumber || "—",
    vin_numbers: projectDraft.vinNumbers || "—",
    instructions: executionDraft.instructions || "—",
    manager_name: projectDraft.managerName || "—",
    company_name: companyProfile.name || "—",
    company_code: companyProfile.code || "—",
    company_vat: companyProfile.vat || "—",
    company_phone: companyProfile.phone || "—",
    company_email: companyProfile.email || "—",
    company_address: companyProfile.address || "—",
    company_bank_name: companyProfile.bankName || "—",
    company_bank_account: companyProfile.bankAccount || "—",
    company_swift: companyProfile.swift || "—",
    company_contact_name: companyContactName || "—",
    company_contact_phone: companyContactPhone || "—",
    company_contact_email: companyContactEmail || "—",
    customer_name: customerProfile.name || "—",
    customer_company_code: customerProfile.code || "—",
    customer_vat_code: customerProfile.vat || "—",
    customer_phone: customerProfile.phone || "—",
    customer_email: customerProfile.email || "—",
    customer_address: customerProfile.address || "—",
    customer_contact_name: customerProfile.contactName || "—",
    customer_contact_phone: customerProfile.contactPhone || "—",
    customer_contact_email: customerProfile.contactEmail || "—",
    // Legacy alias: old templates often use client_contact_* for the actual customer contact.
    client_contact_name: customerProfile.contactName || "—",
    client_contact_phone: customerProfile.contactPhone || "—",
    client_contact_email: customerProfile.contactEmail || "—",
    carrier_company_code: carrierProfile.code || "—",
    carrier_vat_code: carrierProfile.vat || "—",
    carrier_phone: carrierProfile.phone || "—",
    carrier_email: carrierProfile.email || "—",
    carrier_address: carrierProfile.address || "—",
    carrier_contact_name: carrierProfile.contactName || "—",
    carrier_contact_phone: carrierProfile.contactPhone || "—",
    carrier_contact_email: carrierProfile.contactEmail || "—",
    company_stamp_signature: companyStampToken,
    company_stamp: companyStampToken,
    company_signature: companyStampToken,
    customer_stamp_signature: "",
    customer_stamp: "",
    customer_signature: "",
    carrier_stamp_signature: "",
    carrier_stamp: "",
    carrier_signature: "",
    company_logo: settings?.company?.logo_url || template?.editorState?.manual?.assets?.logoSrc || "",
    instructions_block: instructionLines ? `<div style="padding:16px 18px; background:#0f172a; border-radius:18px; color:#ffffff; margin-bottom:20px;"><div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(255,255,255,0.72); margin-bottom:8px;">Instrukcijos vežėjui</div>${instructionLines}</div>` : "",
    contact_name: carrierProfile.contactName || "—",
    contact_phone: carrierProfile.contactPhone || "—",
    contact_email: carrierProfile.contactEmail || "—",
    loading_contact_block: buildOptionalInfoRow("Kontaktas", loadingContact, { valueColor: "#1f2937" }),
    unloading_contact_block: buildOptionalInfoRow("Kontaktas", unloadingContact, { valueColor: "#1f2937" }),
    loading_ref_number_block: buildOptionalInfoRow("REF nr.", loadingRefNumber, { valueColor: "#1f2937" }),
    unloading_ref_number_block: buildOptionalInfoRow("REF nr.", unloadingRefNumber, { valueColor: "#1f2937" }),
    loading_notes_block: buildOptionalNoteBlock("Pakrovimo pastabos", loadingNotes),
    unloading_notes_block: buildOptionalNoteBlock("Iškrovimo pastabos", unloadingNotes),
    execution_transport_block: executionTransportBlock,
    reference_numbers_block: referenceNumbersBlock,
    vat_mode: vatModeLabel,
    vat_mode_key: vatModeKey,
    vat_mode_badge: vatModeBadge,
    originals_required: originalsRequired,
    originals_required_label: originalsRequired === "required" ? "Reikalingi" : "Nereikalingi",
    requires_original_documents_warning: originalsRequired === "required" ? `<div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%); border-radius:12px; padding:16px 20px; margin:20px 0; box-shadow:0 4px 12px rgba(239,68,68,0.3);"><div style="display:flex; align-items:center; gap:12px;"><span style="font-size:24px;">⚠️</span><span style="color:white; font-size:14px; font-weight:600;">Šiam užsakymui reikalingi originalūs CMR / vykdymo dokumentai.</span></div></div>` : "",
  };
};
const calculateExecutionFinancials = ({ projectDraft = emptyProjectDraft, executionDraft = emptyExecutionDraft } = {}) => {
  const clientPrice = Number(projectDraft.clientPrice) || 0;
  const executionCost = resolveExecutionCost(executionDraft);
  const profit = clientPrice - executionCost;
  const profitMargin = executionCost ? (profit / executionCost) * 100 : 0;

  return {
    clientPrice,
    carrierPrice: executionCost,
    executionCost,
    profit,
    profitMargin,
  };
};
const applyLegacyFinancialsToPayload = (payload = {}) => {
  if (payload.orderType !== "resale_to_carrier") return payload;
  if (!payload.clientPrice || !payload.carrierPrice) return payload;

  const profit = payload.clientPrice - payload.carrierPrice;
  const profitMargin = payload.carrierPrice ? (profit / payload.carrierPrice) * 100 : 0;

  return {
    ...payload,
    profit,
    profitMargin,
  };
};
const validateCarrierOrderGeneration = ({ executionDraft = emptyExecutionDraft } = {}) => {
  if (!executionDraft.orderType) return "Pasirinkite užsakymo tipą.";
  if (executionDraft.orderType !== "resale_to_carrier") return "Orderis vežėjui generuojamas tik pasirinkus pardavimą vežėjui.";
  if (!executionDraft.carrierId) return "Pasirinkite vežėją.";
  return null;
};
const validateDraftBeforeSave = ({ projectDraft = emptyProjectDraft, executionDraft = emptyExecutionDraft } = {}) => {
  if (!executionDraft.orderType) {
    return { error: "Pasirinkite užsakymo tipą.", needsNegativeProfitConfirmation: false, financials: null };
  }

  if (!projectDraft.projectId) {
    return { error: "Nesugeneruotas projekto ID.", needsNegativeProfitConfirmation: false, financials: null };
  }

  if (!projectDraft.clientId || !projectDraft.clientName) {
    return { error: "Pasirinkite projekto klientą.", needsNegativeProfitConfirmation: false, financials: null };
  }

  if (!projectDraft.loadingDate || !projectDraft.unloadingDate) {
    return { error: "Užpildykite pakrovimo ir iškrovimo datas.", needsNegativeProfitConfirmation: false, financials: null };
  }

  if (!projectDraft.loadingCity || !projectDraft.unloadingCity) {
    return { error: "Užpildykite pakrovimo ir iškrovimo miestus.", needsNegativeProfitConfirmation: false, financials: null };
  }

  const financials = calculateExecutionFinancials({ projectDraft, executionDraft });

  if (executionDraft.orderType === "resale_to_carrier") {
    if (!executionDraft.carrierId) {
      return { error: "Perpardavimui būtinas vežėjas.", needsNegativeProfitConfirmation: false, financials };
    }
    if (!executionDraft.carrierPrice) {
      return { error: "Įveskite vežėjo kainą.", needsNegativeProfitConfirmation: false, financials };
    }
    return {
      error: null,
      needsNegativeProfitConfirmation: financials.profit < 0,
      financials,
    };
  }

  if (executionDraft.orderType === "own_transport") {
    if (!executionDraft.driverName) {
      return { error: "Nuosavam transportui pasirinkite arba įveskite vairuotoją.", needsNegativeProfitConfirmation: false, financials };
    }
  }

  return {
    error: null,
    needsNegativeProfitConfirmation: false,
    financials,
  };
};
const projectDraftFieldKeys = new Set(Object.keys(emptyProjectDraft));
const executionDraftFieldKeys = new Set(Object.keys(emptyExecutionDraft));
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
    title: "Mūsų įmonė",
    fields: [
      { key: "company_name", label: "Įmonės pavadinimas" },
      { key: "company_code", label: "Įmonės kodas" },
      { key: "company_vat", label: "Įmonės PVM kodas" },
      { key: "company_address", label: "Įmonės adresas" },
      { key: "company_email", label: "Įmonės email" },
      { key: "company_phone", label: "Įmonės telefonas" },
      { key: "company_contact_name", label: "Įmonės kontaktas" },
      { key: "company_contact_email", label: "Įmonės kontakto email" },
      { key: "company_contact_phone", label: "Įmonės kontakto telefonas" },
      { key: "company_stamp_signature", label: "Įmonės antspaudas / parašas" },
      { key: "company_logo", label: "Įmonės logotipas" },
      { key: "client_name", label: "Legacy alias: company_name" },
      { key: "client_code", label: "Legacy alias: company_code" },
      { key: "client_vat", label: "Legacy alias: company_vat" },
      { key: "client_company_code", label: "Legacy alias: company_code" },
      { key: "client_vat_code", label: "Legacy alias: company_vat" },
      { key: "client_address", label: "Legacy alias: company_address" },
      { key: "client_email", label: "Legacy alias: company_email" },
      { key: "client_phone", label: "Legacy alias: company_phone" }
    ]
  },
  {
    title: "Projekto klientas",
    fields: [
      { key: "client_order_number", label: "Kliento užsakymo Nr." },
      { key: "client_price", label: "Kliento kaina" },
      { key: "customer_name", label: "Kliento pavadinimas" },
      { key: "customer_company_code", label: "Kliento įmonės kodas" },
      { key: "customer_vat_code", label: "Kliento PVM kodas" },
      { key: "customer_address", label: "Kliento adresas" },
      { key: "customer_email", label: "Kliento email" },
      { key: "customer_phone", label: "Kliento telefonas" },
      { key: "customer_contact_name", label: "Kliento kontaktas" },
      { key: "customer_contact_email", label: "Kliento kontakto email" },
      { key: "customer_contact_phone", label: "Kliento kontakto telefonas" },
      { key: "client_contact_name", label: "Legacy alias: customer_contact_name" },
      { key: "client_contact_email", label: "Legacy alias: customer_contact_email" },
      { key: "client_contact_phone", label: "Legacy alias: customer_contact_phone" }
    ]
  },
  {
    title: "Vežėjas",
    fields: [
      { key: "carrier_name", label: "Vežėjo pavadinimas" },
      { key: "carrier_price", label: "Vežėjo kaina" },
      { key: "carrier_company_code", label: "Vežėjo įmonės kodas" },
      { key: "carrier_vat_code", label: "Vežėjo PVM kodas" },
      { key: "carrier_address", label: "Vežėjo adresas" },
      { key: "carrier_email", label: "Vežėjo email" },
      { key: "carrier_phone", label: "Vežėjo telefonas" },
      { key: "carrier_contact_name", label: "Vežėjo kontaktas" },
      { key: "carrier_contact_email", label: "Vežėjo kontakto email" },
      { key: "carrier_contact_phone", label: "Vežėjo kontakto telefonas" },
      { key: "carrier_code", label: "Legacy alias: carrier_company_code" },
      { key: "carrier_vat", label: "Legacy alias: carrier_vat_code" },
      { key: "carrier_signature", label: "Vežėjo parašas" },
      { key: "carrier_stamp", label: "Vežėjo antspaudas" }
    ]
  },
  {
    title: "Maršrutas",
    fields: [
      { key: "route", label: "Maršrutas (pilnas)" },
      { key: "loading_address", label: "Pakrovimo adresas" },
      { key: "loading_date", label: "Pakrovimo data" },
      { key: "loading_postcode", label: "Pakrovimo pašto kodas" },
      { key: "loading_contact", label: "Pakrovimo kontaktas" },
      { key: "loading_ref_number", label: "Pakrovimo REF nr." },
      { key: "loading_notes", label: "Pakrovimo pastabos" },
      { key: "unloading_address", label: "Iškrovimo adresas" },
      { key: "unloading_date", label: "Iškrovimo data" },
      { key: "unloading_postcode", label: "Iškrovimo pašto kodas" },
      { key: "unloading_contact", label: "Iškrovimo kontaktas" },
      { key: "unloading_ref_number", label: "Iškrovimo REF nr." },
      { key: "unloading_notes", label: "Iškrovimo pastabos" }
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
      { key: "vat_mode", label: "PVM režimas" },
      { key: "originals_required", label: "Originalų režimas" },
      { key: "loading_contact_block", label: "Pakrovimo kontaktas (blokas)" },
      { key: "unloading_contact_block", label: "Iškrovimo kontaktas (blokas)" },
      { key: "loading_ref_number_block", label: "Pakrovimo REF (blokas)" },
      { key: "unloading_ref_number_block", label: "Iškrovimo REF (blokas)" },
      { key: "loading_notes_block", label: "Pakrovimo pastabos (blokas)" },
      { key: "unloading_notes_block", label: "Iškrovimo pastabos (blokas)" },
      { key: "reference_numbers_block", label: "REF numeriai (blokas)" },
      { key: "execution_transport_block", label: "Transporto blokas" },
      { key: "vat_mode_badge", label: "PVM žyma" },
      { key: "instructions", label: "Instrukcijos vežėjui" }
    ]
  }
];
const buildPreviewFields = (settings, manualState) => ({
  order_number: "RAD-2026-014",
  today_date: "2026-04-04",
  company_name: settings?.company?.name || "MB Radanaras",
  company_code: settings?.company?.code || "302000000",
  company_vat: settings?.company?.vat || "LT100000000000",
  company_address: settings?.company?.address || "Vilnius, Lietuva",
  company_email: settings?.company?.email || "info@radanaras.lt",
  company_phone: settings?.company?.phone || "+370 600 00000",
  company_contact_name: settings?.email?.from_name || "Saimondas Lukosius",
  company_contact_email: settings?.email?.from_address || settings?.company?.email || "info@radanaras.lt",
  company_contact_phone: settings?.company?.phone || "+370 600 00000",
  client_name: settings?.company?.name || "MB Radanaras",
  client_code: settings?.company?.code || "302000000",
  client_vat: settings?.company?.vat || "LT100000000000",
  client_company_code: settings?.company?.code || "302000000",
  client_vat_code: settings?.company?.vat || "LT100000000000",
  client_address: settings?.company?.address || "Vilnius, Lietuva",
  client_email: settings?.company?.email || "info@radanaras.lt",
  client_phone: settings?.company?.phone || "+370 600 00000",
  customer_name: "UAB Kliento Projektas",
  customer_company_code: "304000000",
  customer_vat_code: "LT100000000001",
  customer_address: "Kaunas, Lietuva",
  customer_email: "transport@customer.lt",
  customer_phone: "+370 611 11111",
  customer_contact_name: "Projektų vadybininkė",
  customer_contact_email: "transport@customer.lt",
  customer_contact_phone: "+370 611 11111",
  client_contact_name: "Projektų vadybininkė",
  client_contact_email: "transport@customer.lt",
  client_contact_phone: "+370 611 11111",
  carrier_name: "UAB Baltic Carrier",
  carrier_company_code: "305555555",
  carrier_vat_code: "LT100000000123",
  carrier_code: "305555555",
  carrier_vat: "LT100000000123",
  carrier_address: "Klaipėda, Lietuva",
  carrier_email: "ops@carrier.lt",
  carrier_phone: "+370 622 22222",
  carrier_contact_name: "Jonas Jonaitis",
  carrier_contact_email: "jonas@carrier.lt",
  carrier_contact_phone: "+370 600 00000",
  cargo: "Automobilių pervežimas",
  route: "Hamburg, DE → Vilnius, LT",
  loading_date: "2026-04-07",
  unloading_date: "2026-04-09",
  client_price: "",
  carrier_price: "1180.00 EUR + PVM",
  payment_term: "14 dienų",
  company_logo: manualState?.assets?.logoSrc || settings?.company?.logo_url || buildPlaceholderImage("LOGO", "#2563eb"),
  company_stamp_signature: settings?.companyStampSignature || buildPlaceholderImage("STAMP", "#0f766e"),
  company_stamp: settings?.companyStampSignature || buildPlaceholderImage("STAMP", "#0f766e"),
  company_signature: settings?.companyStampSignature || buildPlaceholderImage("STAMP", "#0f766e"),
  customer_stamp_signature: "",
  customer_stamp: "",
  customer_signature: "",
  carrier_stamp_signature: "",
  carrier_stamp: "",
  carrier_signature: "",
  loading_postcode: "20457",
  unloading_postcode: "02100",
  loading_contact: "Jonas, +37060000000",
  unloading_contact: "Sandėlis, +37061111111",
  loading_ref_number: "LOAD-001",
  unloading_ref_number: "UNLOAD-001",
  loading_notes: "Skambinti 30 min. prieš atvykimą.",
  unloading_notes: "Atvykus kreiptis į apsaugą.",
  loading_contact_block: `<div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Kontaktas</span><span style="color:#1f2937; font-size:11px;">Jonas, +37060000000</span></div>`,
  unloading_contact_block: `<div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Kontaktas</span><span style="color:#1f2937; font-size:11px;">Sandėlis, +37061111111</span></div>`,
  loading_ref_number_block: `<div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">REF nr.</span><span style="color:#1f2937; font-size:11px;">LOAD-001</span></div>`,
  unloading_ref_number_block: `<div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">REF nr.</span><span style="color:#1f2937; font-size:11px;">UNLOAD-001</span></div>`,
  loading_notes_block: `<div style="margin-top:6px; padding:7px 8px; background:#ffffff; border:1px dashed #d1d5db; border-radius:6px;"><div style="color:#6b7280; font-size:10px; margin-bottom:3px;">Pakrovimo pastabos</div><div style="color:#334155; font-size:11px; line-height:1.45;">Skambinti 30 min. prieš atvykimą.</div></div>`,
  unloading_notes_block: `<div style="margin-top:6px; padding:7px 8px; background:#ffffff; border:1px dashed #d1d5db; border-radius:6px;"><div style="color:#6b7280; font-size:10px; margin-bottom:3px;">Iškrovimo pastabos</div><div style="color:#334155; font-size:11px; line-height:1.45;">Atvykus kreiptis į apsaugą.</div></div>`,
  reference_numbers_block: `<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;"><div style="margin-bottom:0;"><span style="color:#6b7280; font-size:10px; display:block;">Pakrovimo REF nr.</span><span style="color:#1f2937; font-size:11px;">LOAD-001</span></div><div style="margin-bottom:0;"><span style="color:#6b7280; font-size:10px; display:block;">Iškrovimo REF nr.</span><span style="color:#1f2937; font-size:11px;">UNLOAD-001</span></div></div>`,
  execution_transport_block: `<div style="background:#eff6ff; padding:8px; border-radius:6px; margin-bottom:8px;"><div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;"><div style="margin-bottom:0;"><span style="color:#6b7280; font-size:10px; display:block;">Vairuotojas</span><span style="color:#1f2937; font-size:11px;">Jonas Jonaitis</span></div><div style="margin-bottom:0;"><span style="color:#6b7280; font-size:10px; display:block;">Vilkikas</span><span style="color:#1f2937; font-size:11px;">ABC123</span></div><div style="margin-bottom:0;"><span style="color:#6b7280; font-size:10px; display:block;">Priekaba</span><span style="color:#1f2937; font-size:11px;">TRL501</span></div></div></div>`,
  vat_mode: "+ PVM",
  vat_mode_badge: `<span style="display:inline-block; padding:3px 8px; border-radius:999px; background:rgba(255,255,255,0.16); color:#ffffff; font-size:10px; font-weight:700; white-space:nowrap;">+ PVM</span>`,
  originals_required: "required",
  instructions_block: `<div style="padding:16px 18px; background:#0f172a; border-radius:18px; color:#ffffff; margin-bottom:20px;"><div style="font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(255,255,255,0.72); margin-bottom:8px;">Instrukcijos vežėjui</div><div style="font-size:13px; line-height:1.7; color:rgba(255,255,255,0.92);">Atvykimą patvirtinti telefonu. CMR ir POD dokumentus pateikti laiku.</div></div>`,
  requires_original_documents_warning: `<div style="background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%); border-radius:12px; padding:16px 20px; margin:20px 0; box-shadow:0 4px 12px rgba(239,68,68,0.3);"><div style="display:flex; align-items:center; gap:12px;"><span style="font-size:24px;">⚠️</span><span style="color:white; font-size:14px; font-weight:600;">Šiam užsakymui reikalingi originalūs CMR / vykdymo dokumentai.</span></div></div>`,
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
      <p><strong>Mūsų įmonė:</strong> {{company_name}} | <strong>Vežėjas:</strong> {{carrier_name}}</p>
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
          <p><strong>Pavadinimas:</strong> {{company_name}}</p>
          <p><strong>Kodas:</strong> {{company_code}}</p>
          <p><strong>PVM:</strong> {{company_vat}}</p>
          <p><strong>Adresas:</strong> {{company_address}}</p>
          <p><strong>Tel:</strong> {{company_phone}}</p>
          <p><strong>Email:</strong> {{company_email}}</p>
        </div>
        <div>
          <h4 style="color: #1976d2;">VEŽĖJAS</h4>
          <p><strong>Pavadinimas:</strong> {{carrier_name}}</p>
          <p><strong>Kodas:</strong> {{carrier_company_code}}</p>
          <p><strong>PVM:</strong> {{carrier_vat_code}}</p>
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
                  <div><strong style="color:#ffffff;">Vežėjo vadybininkas:</strong> {{contact_name}}</div>
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
          Tarp <strong>{{carrier_name}}</strong>, toliau Vežėjas, ir <strong>{{company_name}}</strong>, toliau Užsakovas, sudaromas šis transporto užsakymas.
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
            {{loading_contact_block}}
            {{loading_ref_number_block}}
            {{loading_notes_block}}
          </div>
          <div style="background:#f9fafb; padding:8px; border-radius:6px; border-left:3px solid #ef4444;">
            <div style="color:#dc2626; font-weight:600; font-size:11px; margin-bottom:4px;">IŠKROVIMAS</div>
            <div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Gavėjas</span><span style="color:#1f2937; font-weight:500; font-size:11px;">{{receiver_name}}</span></div>
            <div style="margin-bottom:3px;"><span style="color:#6b7280; font-size:10px; display:block;">Adresas</span><span style="color:#1f2937; font-size:11px;">{{unloading_address}}</span></div>
            <div><span style="color:#6b7280; font-size:10px; display:block;">Data</span><span style="color:#dc2626; font-weight:600; font-size:11px;">{{unloading_date}}</span></div>
            {{unloading_contact_block}}
            {{unloading_ref_number_block}}
            {{unloading_notes_block}}
          </div>
        </div>
        {{execution_transport_block}}
        {{reference_numbers_block}}
      </div>
      <div class="doc-price-pill" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); border-radius:10px; padding:10px 16px; margin:10px 0; box-shadow:0 3px 8px rgba(102,126,234,0.3);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:white; font-size:12px; font-weight:500;">Vežėjo kaina</span>
          <div style="display:flex; align-items:center; gap:8px; justify-content:flex-end;"><span class="vezejo-kaina" style="color:white; font-size:18px; font-weight:700;">{{carrier_price}}</span>{{vat_mode_badge}}</div>
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
            <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:8px;">{{company_name}}</div>
            <div style="font-size:12px; color:#475569; line-height:1.9;">
              <div>Įmonės kodas: {{company_code}}</div>
              <div>PVM kodas: {{company_vat}}</div>
              <div>Tel: {{company_phone}}</div>
              <div>Email: {{company_email}}</div>
              <div>Adresas: {{company_address}}</div>
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
  const bodyContent = String(prepareTemplateSection(upgradeLegacyOrderTemplateBodyHtml(state.bodyHtml), state, { persistLogo: true }) || "").replace(
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
const ORDER_PAGE_SPLIT_REGEX = /<div[^>]+data-page-break="true"[^>]*>[\s\S]*?<\/div>/;
const WORD_LOGO_MAX_HEIGHT_PX = 56;
const WORD_LOGO_MAX_WIDTH_PX = 160;
const getOrderDocumentPageSize = (orientation = "portrait") =>
  orientation === "landscape"
    ? { widthPx: 1123, heightPx: 794, widthMm: 297, heightMm: 210 }
    : { widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297 };
const splitOrderDocumentPages = (html = "") => {
  const pages = String(html || "").split(ORDER_PAGE_SPLIT_REGEX);
  const trimmed = pages.map((page) => page.trim()).filter(Boolean);
  return trimmed.length > 0 ? trimmed : [String(html || "")];
};
const buildOrderDocumentPageMarkup = ({
  headerHtml = "",
  bodyHtml = "",
  footerHtml = "",
  layout = {},
} = {}) => {
  const pageSize = getOrderDocumentPageSize(layout.orientation);
  const pagePadding = `${layout.marginTop}mm ${layout.marginRight}mm ${layout.marginBottom}mm ${layout.marginLeft}mm`;
  const contentHeightMm = Math.max(
    20,
    pageSize.heightMm - (Number(layout.marginTop || 0) + Number(layout.marginBottom || 0))
  );
  return `
    <section data-order-page="true" data-orientation="${layout.orientation || "portrait"}" style="width:${pageSize.widthMm}mm; height:${pageSize.heightMm}mm; min-height:${pageSize.heightMm}mm; overflow:hidden; box-sizing:border-box;">
      <div data-order-page-inner="true" style="height:${pageSize.heightMm}mm; min-height:${pageSize.heightMm}mm; box-sizing:border-box; padding:${pagePadding}; overflow:hidden;">
        <div data-order-page-content="true" style="height:${contentHeightMm}mm; min-height:${contentHeightMm}mm; display:flex; flex-direction:column; overflow:hidden;">
          <div data-template-header style="flex:0 0 auto; margin-bottom:${layout.headerSpacing || 0}mm;">${headerHtml}</div>
          <div data-template-body style="flex:1 1 auto; min-height:0; overflow:hidden;">${bodyHtml}</div>
          <div data-template-footer style="flex:0 0 auto; margin-top:${layout.footerSpacing || 0}mm;">${footerHtml}</div>
        </div>
      </div>
    </section>
  `;
};
const buildOrderDocumentPagesMarkup = ({ pages = [], headerHtml = "", footerHtml = "", layout = {} } = {}) =>
  `
    <div data-order-pages-root="true">
      ${pages.map((page) => buildOrderDocumentPageMarkup({ headerHtml, bodyHtml: page, footerHtml, layout })).join("")}
    </div>
  `;
const buildCanonicalOrderDocumentCss = () => `
  ${DOC_CSS}

  [data-order-pages-root="true"] {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  [data-order-page="true"] {
    width: 210mm;
    min-height: 297mm;
    background: #ffffff;
    box-sizing: border-box;
  }
  [data-order-page="true"][data-orientation="landscape"] {
    width: 297mm;
    min-height: 210mm;
  }
  [data-order-page-inner="true"] {
    background: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
  }
  [data-order-page-content="true"] {
    overflow: hidden;
  }
  [data-template-body] {
    min-height: 0;
    overflow: hidden;
  }

  @media screen {
    html { background: #525659; }
    body { margin: 0; padding: 24px 0 40px; background: #525659; }
    [data-order-page="true"] {
        box-shadow: 0 2px 12px rgba(0,0,0,0.5);
    }
    [data-template-root] { width: auto; box-shadow: none; }
    [data-page-break="true"] { display: none !important; }
  }

  @media print {
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    [data-order-pages-root="true"] { display: block; }
    [data-order-page="true"] {
      width: 210mm !important;
      height: 297mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      page-break-after: always;
      break-after: page;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    [data-order-page="true"][data-orientation="landscape"] {
      width: 297mm !important;
      height: 210mm !important;
      min-height: 210mm !important;
    }
    [data-order-page="true"]:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    [data-order-page-inner="true"] {
      height: 100% !important;
      min-height: 100% !important;
      overflow: hidden !important;
    }
    [data-order-page-content="true"] { overflow: hidden !important; }
    [data-template-body] { overflow: hidden !important; }
    [data-template-root] { width: auto; box-shadow: none; }
    [data-page-break="true"] { display: none !important; }
  }
`;
const buildOrderDocumentFullHtml = ({ html = "", css = "", title = "Dokumentas" } = {}) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${String(title || "Dokumentas")}</title><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;}${css}</style></head><body>${html}</body></html>`;
const buildOrderDocumentFrameHtml = ({
  html = "",
  css = "",
  title = "Dokumentas",
  bodyStyle = "margin:0;padding:0;background:#fff;",
  extraCss = "",
} = {}) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${String(title || "Dokumentas")}</title><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;}${css}
html,body{${bodyStyle}}
[data-order-pages-root="true"]{display:block !important;gap:0 !important;}
[data-order-page="true"]{margin:0 auto !important;box-shadow:none !important;}
[data-order-page-inner="true"]{background:#fff !important;}
[data-template-root]{box-shadow:none !important;}
${extraCss}
</style></head><body>${html}</body></html>`;
const buildOrderDocumentPageDocHtml = ({
  pageHtml = "",
  headerHtml = "",
  footerHtml = "",
  layout = {},
  title = "Dokumentas",
} = {}) => {
  const pageMarkup = buildOrderDocumentPageMarkup({
    headerHtml,
    bodyHtml: pageHtml,
    footerHtml,
    layout,
  });
  const pageCss = `
*{box-sizing:border-box;}
html,body{margin:0;padding:0;overflow:hidden;background:#fff;}
body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;}
${buildCanonicalOrderDocumentCss()}
[data-order-pages-root="true"]{display:block !important;}
[data-order-page="true"]{margin:0 !important;box-shadow:none !important;overflow:hidden !important;}
[data-order-page-inner="true"]{overflow:hidden !important;}
[data-order-page-content="true"]{overflow:hidden !important;}
[data-template-body]{overflow:hidden !important;}
[data-page-break="true"]{display:none!important;}
img[data-template-logo="true"]{
  max-width:100% !important;
  max-height:${layout.logoMaxHeight || 80}px !important;
  width:auto !important;
  height:auto !important;
  display:block !important;
  object-fit:contain !important;
}
img[data-stamp="true"]{
  max-width:180px !important;
  max-height:92px !important;
  width:auto !important;
  height:auto !important;
  display:block !important;
  object-fit:contain !important;
}
`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${String(title || "Dokumentas")}</title><style>${pageCss}</style></head><body>${pageMarkup}</body></html>`;
};
const buildOrderDocumentWordHtml = ({ html = "", css = "", title = "Uzsakymas" } = {}) =>
  `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${String(title || "Uzsakymas")}</title><style>body{margin:0;font-family:Arial,Helvetica,sans-serif;}${css}
html,body{margin:0;padding:0;background:#fff !important;}
[data-order-pages-root="true"]{display:block !important;gap:0 !important;}
[data-order-page="true"]{margin:0 auto 12mm auto !important;box-shadow:none !important;page-break-after:always;break-after:page;}
[data-order-page="true"]:last-child{page-break-after:auto;break-after:auto;}
[data-order-page-inner="true"]{background:#fff !important;}
[data-order-page-content="true"]{overflow:hidden !important;}
[data-template-body]{overflow:hidden !important;}
[data-template-root]{box-shadow:none !important;}
[data-page-break="true"]{display:none !important;}
img[data-template-logo="true"]{
  max-width:${WORD_LOGO_MAX_WIDTH_PX}px !important;
  max-height:${WORD_LOGO_MAX_HEIGHT_PX}px !important;
  width:auto !important;
  height:auto !important;
  display:block !important;
  object-fit:contain !important;
}
img[data-stamp="true"]{
  max-width:180px !important;
  max-height:92px !important;
  width:auto !important;
  height:auto !important;
  display:block !important;
  object-fit:contain !important;
}
</style></head><body>${html}</body></html>`;
const renderOrderDocument = ({
  projectDraft = emptyProjectDraft,
  executionDraft = emptyExecutionDraft,
  settings = {},
  carriers = [],
  draftPayload = {},
  templateId = null,
  title = "Dokumentas",
} = {}) => {
  const resolvedTemplateId = templateId || executionDraft._selectedTemplateId || settings.templates?.find((item) => item.isDefault)?.id || settings.templates?.[0]?.id;
  const template = settings.templates?.find((item) => String(item.id) === String(resolvedTemplateId));
  if (!template) {
    return { error: "Pasirinkite šabloną." };
  }
  const selectedCarrier = carriers.find((carrier) => String(carrier.id) === String(executionDraft.carrierId || draftPayload.carrierId));
  const values = buildDocumentTemplateValuesFromDrafts({
    projectDraft,
    executionDraft,
    draftPayload,
    selectedCarrier,
    settings,
    template,
  });
  const editorManual = template.editorState?.manual;
  const css = buildCanonicalOrderDocumentCss();
  const manualState = editorManual
    ? {
        ...defaultManualTemplateState(),
        ...editorManual,
        layout: { ...defaultManualTemplateState().layout, ...(editorManual.layout || {}) },
        assets: { ...defaultManualTemplateState().assets, ...(editorManual.assets || {}) },
      }
    : null;
  let documentHtml = "";
  let pageHtmlDocs = [];
  let pageBodies = [];
  let renderedHeaderHtml = "";
  let renderedFooterHtml = "";
  let pageSize = getOrderDocumentPageSize(manualState?.layout?.orientation || "portrait");

  if (manualState) {
    renderedHeaderHtml = renderTemplateTokens(prepareTemplateSection(manualState.headerHtml, manualState, { persistLogo: true }), values);
    const renderedBody = renderTemplateTokens(prepareTemplateSection(upgradeLegacyOrderTemplateBodyHtml(manualState.bodyHtml), manualState, { persistLogo: true }), values);
    renderedFooterHtml = renderTemplateTokens(prepareTemplateSection(manualState.footerHtml, manualState, { persistLogo: true }), values);
    const pages = splitOrderDocumentPages(renderedBody);
    pageBodies = pages;
    documentHtml = buildOrderDocumentPagesMarkup({
      pages,
      headerHtml: renderedHeaderHtml,
      footerHtml: renderedFooterHtml,
      layout: manualState.layout,
    });
    pageSize = getOrderDocumentPageSize(manualState.layout.orientation);
    pageHtmlDocs = pages.map((page) =>
      buildOrderDocumentPageDocHtml({
        pageHtml: page,
        headerHtml: renderedHeaderHtml,
        footerHtml: renderedFooterHtml,
        layout: manualState.layout,
        title,
      })
    );
  } else {
    const compiledHtml = String(template.content || "");
    const legacyHtml = compiledHtml.replace(/{{\s*([^}]+)\s*}}/g, (_, key) => values[key.trim()] ?? "");
    documentHtml = legacyHtml;
    pageBodies = [legacyHtml];
    pageHtmlDocs = [buildOrderDocumentFrameHtml({ html: legacyHtml, css, title })];
  }
  return {
    html: documentHtml,
    css,
    fullHtml: buildOrderDocumentFullHtml({ html: documentHtml, css, title }),
    pageHtmlDocs,
    pageBodies,
    renderedHeaderHtml,
    renderedFooterHtml,
    layout: manualState?.layout || null,
    pageSize,
    template,
    values,
    draftPayload,
    selectedCarrier,
  };
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
  const renderedBody = useMemo(() => renderTemplateTokens(prepareTemplateSection(upgradeLegacyOrderTemplateBodyHtml(manualState.bodyHtml), manualState), previewFields), [manualState, previewFields]);
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
export function Orders({
  orders,
  saveOrders,
  clients,
  carriers,
  openModal,
  title = "Užsakymai",
  showCreateButton = true,
  createButtonLabel = "+ Naujas Užsakymas",
  onCreate = null,
  emptyTitle = "Nėra užsakymų",
  emptyDescription = "Sukurkite pirmą užsakymą",
  variant = "default",
}) {
  const deleteOrder = (id) => {
    if (window.confirm("Ar tikrai norite ištrinti šį užsakymą?")) {
      saveOrders(orders.filter((item) => item.id !== id));
    }
  };

  const resolveTypeLabel = (order) => {
    if (order.orderType === "own_transport") return "Own fleet";
    return "Ekspedijavimas";
  };

  const resolveExecutorLabel = (order) => {
    if (order.orderType === "own_transport") {
      const truck = order.truckPlate || "—";
      const driver = order.driverName || "—";
      return `Radanaras MB / ${truck} / ${driver}`;
    }

    return order.carrierName || "—";
  };

  const resolveProjectId = (order) =>
    order.projectId || order.projectNumber || order.id || order.orderNumber || "—";

  const resolveExecutionCost = (order) => {
    if (order.carrierPrice || order.carrierPrice === 0) return Number(order.carrierPrice || 0);
    if (order.executionCost || order.executionCost === 0) return Number(order.executionCost || 0);
    return null;
  };

  const resolveProfit = (order) => {
    const clientPrice = Number(order.clientPrice || 0);
    const executionCost = resolveExecutionCost(order);
    if (executionCost === null || !clientPrice) return null;
    return clientPrice - executionCost;
  };

  const resolveDocState = (rawState, fallback) => {
    if (rawState === "present" || rawState === "uploaded" || rawState === "verified" || rawState === true) return "present";
    if (rawState === "missing" || rawState === false) return "missing";
    if (rawState === "not_applicable" || rawState === "n/a") return "na";
    return fallback;
  };

  const getCmrState = (order) =>
    resolveDocState(order.cmrStatus, order.documents?.cmr ? "present" : "missing");

  const getCarrierInvoiceState = (order) => {
    if (order.orderType === "own_transport") return "na";
    return resolveDocState(order.carrierInvoiceStatus, order.documents?.carrierInvoice ? "present" : "missing");
  };

  const getClientInvoiceState = (order) =>
    resolveDocState(order.clientInvoiceStatus, order.documents?.invoice ? "present" : "missing");

  const renderTrafficLight = (state, labelMap = { present: "Yra", missing: "Nėra", na: "N/A" }) => {
    const meta = state === "present"
      ? { bg: "#dcfce7", color: "#166534", border: "#86efac" }
      : state === "missing"
        ? { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" }
        : { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "999px",
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.border}`,
          fontSize: "12px",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: meta.color,
            display: "inline-block",
          }}
        />
        {labelMap[state] || labelMap.na}
      </span>
    );
  };

  const renderPrice = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return euro(value);
  };

  const renderProfit = (order) => {
    const profit = resolveProfit(order);
    if (profit === null) return "—";

    return (
      <span style={{ fontWeight: 700, color: profit >= 0 ? "#059669" : "#dc2626" }}>
        {profit >= 0 ? "+" : ""}
        {profit.toFixed(2)} €
      </span>
    );
  };

  const renderActions = (order) => (
    <div style={actionButtons}>
      {order.__demo ? (
        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Demo</span>
      ) : variant === "projects" || variant === "expedition" ? (
        <button style={actionBtn} onClick={() => openModal("order", order)} title="Atidaryti projektą">✎</button>
      ) : (
        <>
          <button style={actionBtn} onClick={() => openModal("order", order)} title="Atidaryti / redaguoti">✎</button>
          <button style={actionBtn} onClick={() => deleteOrder(order.id)} title="Ištrinti">🗑</button>
        </>
      )}
    </div>
  );

  const renderProjectsTable = () => (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Projekto ID</th>
          <th style={th}>Mūsų Nr.</th>
          <th style={th}>Kliento užsakymo Nr.</th>
          <th style={th}>Klientas</th>
          <th style={th}>Tipas</th>
          <th style={th}>Vykdytojas</th>
          <th style={th}>Maršrutas</th>
          <th style={th}>Pakrovimas</th>
          <th style={th}>Iškrovimas</th>
          <th style={th}>Kliento kaina</th>
          <th style={th}>Vykdymo kaina</th>
          <th style={th}>Pelnas</th>
          <th style={th}>CMR</th>
          <th style={th}>Vežėjo SF</th>
          <th style={th}>Kliento SF</th>
          <th style={th}>Statusas</th>
          <th style={th}>Veiksmai</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td style={td}><strong>{resolveProjectId(order)}</strong></td>
            <td style={td}>
              {order.__demo ? (
                <span>{order.orderNumber || "—"} <span style={{ color: "#64748b", fontSize: "11px" }}>(demo)</span></span>
              ) : (
                <strong style={{ cursor: "pointer", color: "#3b82f6", textDecoration: "underline" }} onClick={() => openModal("order", order)}>
                  {order.orderNumber || "—"}
                </strong>
              )}
            </td>
            <td style={{ ...td, fontSize: "12px" }}>{order.clientOrderNumber || "—"}</td>
            <td style={td}>{order.clientName || "—"}</td>
            <td style={td}>
              <span style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "999px",
                background: order.orderType === "own_transport" ? "#dcfce7" : "#dbeafe",
                color: order.orderType === "own_transport" ? "#166534" : "#1d4ed8",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
                {resolveTypeLabel(order)}
              </span>
            </td>
            <td style={{ ...td, maxWidth: "220px" }}>{resolveExecutorLabel(order)}</td>
            <td style={{ ...td, fontSize: "12px", maxWidth: "180px" }}>{order.route || "—"}</td>
            <td style={td}>{order.loadingDate || "—"}</td>
            <td style={td}>{order.unloadingDate || "—"}</td>
            <td style={td}>{renderPrice(order.clientPrice)}</td>
            <td style={td}>{renderPrice(resolveExecutionCost(order))}</td>
            <td style={td}>{renderProfit(order)}</td>
            <td style={td}>{renderTrafficLight(getCmrState(order), { present: "Yra", missing: "Nėra", na: "N/A" })}</td>
            <td style={td}>{renderTrafficLight(getCarrierInvoiceState(order), { present: "Yra", missing: "Nėra", na: "N/A" })}</td>
            <td style={td}>{renderTrafficLight(getClientInvoiceState(order), { present: "Yra", missing: "Nėra", na: "N/A" })}</td>
            <td style={td}><span style={statusBadgeStyle(order.status)}>{statusLabel(order.status)}</span></td>
            <td style={td}>{renderActions(order)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderExpeditionTable = () => (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Projekto ID</th>
          <th style={th}>Kliento užsakymo Nr.</th>
          <th style={th}>Klientas</th>
          <th style={th}>Vežėjas</th>
          <th style={th}>Maršrutas</th>
          <th style={th}>Pakrovimas</th>
          <th style={th}>Iškrovimas</th>
          <th style={th}>Kliento kaina</th>
          <th style={th}>Vežėjo kaina</th>
          <th style={th}>Pelnas</th>
          <th style={th}>CMR</th>
          <th style={th}>Statusas</th>
          <th style={th}>Veiksmai</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td style={td}><strong>{resolveProjectId(order)}</strong></td>
            <td style={{ ...td, fontSize: "12px" }}>{order.clientOrderNumber || "—"}</td>
            <td style={td}>{order.clientName || "—"}</td>
            <td style={td}>{order.carrierName || "—"}</td>
            <td style={{ ...td, fontSize: "12px", maxWidth: "180px" }}>{order.route || "—"}</td>
            <td style={td}>{order.loadingDate || "—"}</td>
            <td style={td}>{order.unloadingDate || "—"}</td>
            <td style={td}>{renderPrice(order.clientPrice)}</td>
            <td style={td}>{renderPrice(resolveExecutionCost(order))}</td>
            <td style={td}>{renderProfit(order)}</td>
            <td style={td}>{renderTrafficLight(getCmrState(order), { present: "Yra", missing: "Nėra", na: "N/A" })}</td>
            <td style={td}><span style={statusBadgeStyle(order.status)}>{statusLabel(order.status)}</span></td>
            <td style={td}>{renderActions(order)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderOwnFleetTable = () => (
    <table style={table}>
      <thead>
        <tr>
          <th style={th}>Projekto ID</th>
          <th style={th}>Mūsų Nr.</th>
          <th style={th}>Kliento užsakymo Nr.</th>
          <th style={th}>Klientas</th>
          <th style={th}>Vairuotojas</th>
          <th style={th}>Vilkikas</th>
          <th style={th}>Priekaba</th>
          <th style={th}>Maršrutas</th>
          <th style={th}>Pakrovimas</th>
          <th style={th}>Iškrovimas</th>
          <th style={th}>Kliento kaina</th>
          <th style={th}>Savikaina</th>
          <th style={th}>Pelnas</th>
          <th style={th}>CMR</th>
          <th style={th}>Kliento SF</th>
          <th style={th}>Statusas</th>
          <th style={th}>Veiksmai</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td style={td}><strong>{resolveProjectId(order)}</strong></td>
            <td style={td}>
              {order.__demo ? (
                <span>{order.orderNumber || "—"} <span style={{ color: "#64748b", fontSize: "11px" }}>(demo)</span></span>
              ) : (
                <strong style={{ cursor: "pointer", color: "#3b82f6", textDecoration: "underline" }} onClick={() => openModal("order", order)}>
                  {order.orderNumber || "—"}
                </strong>
              )}
            </td>
            <td style={{ ...td, fontSize: "12px" }}>{order.clientOrderNumber || "—"}</td>
            <td style={td}>{order.clientName || "—"}</td>
            <td style={td}>{order.driverName || "—"}</td>
            <td style={td}>{order.truckPlate || "—"}</td>
            <td style={td}>{order.trailerPlate || "—"}</td>
            <td style={{ ...td, fontSize: "12px", maxWidth: "180px" }}>{order.route || "—"}</td>
            <td style={td}>{order.loadingDate || "—"}</td>
            <td style={td}>{order.unloadingDate || "—"}</td>
            <td style={td}>{renderPrice(order.clientPrice)}</td>
            <td style={td}>{renderPrice(resolveExecutionCost(order))}</td>
            <td style={td}>{renderProfit(order)}</td>
            <td style={td}>{renderTrafficLight(getCmrState(order), { present: "Yra", missing: "Nėra", na: "N/A" })}</td>
            <td style={td}>{renderTrafficLight(getClientInvoiceState(order), { present: "Yra", missing: "Nėra", na: "N/A" })}</td>
            <td style={td}><span style={statusBadgeStyle(order.status)}>{statusLabel(order.status)}</span></td>
            <td style={td}>{renderActions(order)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div style={pageCard}>
      <div style={cardHeader}>
        <h2 style={cardTitle}>{title} ({orders.length})</h2>
        {showCreateButton ? (
          <button style={btn} onClick={() => (onCreate ? onCreate() : openModal("order", null))}>{createButtonLabel}</button>
        ) : null}
      </div>
      {orders.length > 0 ? (
        variant === "projects"
          ? renderProjectsTable()
          : variant === "expedition"
            ? renderExpeditionTable()
            : variant === "own_fleet"
              ? renderOwnFleetTable()
            : renderProjectsTable()
      ) : <div style={emptyState}><div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>📦</div><h3>{emptyTitle}</h3><p>{emptyDescription}</p></div>}
    </div>
  );
}
export function Modal({ type, initialData, onClose, clients, carriers, saveOrders, saveCarriers, saveClients, orders, settings, persistFutureDomain, persistTarget, workflowMode = "default" }) {
  const [projectDraft, setProjectDraft] = useState(() => buildDraftsFromOrderForm(emptyOrderForm).projectDraft);
  const [executionDraft, setExecutionDraft] = useState(() => buildDraftsFromOrderForm(emptyOrderForm).executionDraft);
  const [legacyCompatibilityState, setLegacyCompatibilityState] = useState({});
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [formActionMessage, setFormActionMessage] = useState("");
  const [clientPickerSearch, setClientPickerSearch] = useState("");
  const [carrierPickerSearch, setCarrierPickerSearch] = useState("");
  const [selectedClientContactId, setSelectedClientContactId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState("");
  const [selectedTrailerId, setSelectedTrailerId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState({ name: "", companyCode: "", vatCode: "", email: "", phone: "", address: "", contactName: "", contactEmail: "", contactPhone: "" });
  const [entityEditModal, setEntityEditModal] = useState(null);
  const lastPreparedFutureBundleRef = useRef(null);
  // quickAdd: null | { type: "manager"|"driver"|"truck"|"trailer", fields: {...} }
  const [quickAdd, setQuickAdd] = useState(null);

  const applyLegacyCompatibleForm = (nextForm) => {
    const drafts = buildDraftsFromOrderForm(nextForm);
    setProjectDraft(drafts.projectDraft);
    setExecutionDraft(drafts.executionDraft);
    setLegacyCompatibilityState(pickLegacyCompatibilityState(nextForm));
  };

  const buildLegacyPayloadFromDrafts = (overrides = {}) => {
    const selectedCarrier = carriers.find((c) => String(c.id) === String(executionDraft.carrierId)) || {};
    return buildLegacyOrderPayloadFromDrafts({
      projectDraft,
      executionDraft,
      base: legacyCompatibilityState,
      selectedCarrier,
      overrides,
    });
  };
  const buildPreparedSaveArtifacts = ({ status, id, orderNumber, overrides = {} } = {}) => {
    const draftPayload = buildLegacyPayloadFromDrafts();
    const resolvedId = id ?? executionDraft.id ?? draftPayload.id ?? Date.now();
    const resolvedOrderNumber = orderNumber ?? executionDraft.orderNumber ?? draftPayload.orderNumber ?? createOrderNumber(orders);
    const legacyPayload = applyLegacyFinancialsToPayload(buildLegacyPayloadFromDrafts({
      ...overrides,
      id: resolvedId,
      orderNumber: resolvedOrderNumber,
      ...(status ? { status } : {}),
    }));
    const futureBundle = buildFutureDomainBundleFromDrafts({
      projectDraft,
      executionDraft: {
        ...executionDraft,
        ...overrides,
        id: resolvedId,
        orderNumber: resolvedOrderNumber,
        ...(status ? { status } : {}),
      },
      settings,
      selectedCarrier,
      idFactory: () => Date.now().toString(36),
      now: new Date().toISOString(),
    });

    return {
      legacyPayload,
      futureBundle,
    };
  };
  const buildFinalLegacyOrderPayload = ({ status, id, orderNumber, overrides = {} } = {}) => {
    return buildPreparedSaveArtifacts({
      status,
      id,
      orderNumber,
      overrides,
    }).legacyPayload;
  };
  const persistLegacyOrderFromDrafts = ({
    status,
    id,
    orderNumber,
    overrides = {},
    afterSave = null,
    syncDraftState = true,
    persistTarget,
  } = {}) => {
    const { legacyPayload, futureBundle } = buildPreparedSaveArtifacts({
      status,
      id,
      orderNumber,
      overrides,
    });
    const persistPlan = buildOrderDraftPersistPlan({
      legacyPayload,
      futureBundle,
      target: persistTarget,
    });
    lastPreparedFutureBundleRef.current = persistPlan.futureBundle;
    const persistResult = executeOrderDraftPersistPlan({
      persistPlan,
      persistLegacy: upsertOrder,
      persistFutureDomain: persistFutureDomain || persistFutureDomainDraftSkeleton,
    });
    const saved = persistResult.saved || {
      id: legacyPayload.id,
      orderNumber: legacyPayload.orderNumber,
      status: legacyPayload.status,
    };

    if (syncDraftState && saved) {
      updateFormData({
        id: saved.id,
        orderNumber: saved.orderNumber,
        status: saved.status,
      });
    }

    if (typeof afterSave === "function") {
      afterSave(saved, persistPlan.futureBundle, persistResult);
    }

    return {
      saved,
      futureBundle: persistPlan.futureBundle,
      persistPlan,
      persistResult,
    };
  };

  const selectedCarrier = useMemo(
    () => carriers.find((c) => String(c.id) === String(executionDraft.carrierId)) || null,
    [carriers, executionDraft.carrierId]
  );
  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === String(projectDraft.clientId)) || null,
    [clients, projectDraft.clientId]
  );
  const ownFleetCarrier = useMemo(
    () => carriers.find((carrier) => carrier.isOwnCompany) || null,
    [carriers]
  );
  const selectedClientContacts = useMemo(
    () => normalizeClientContacts(selectedClient?.contacts),
    [selectedClient]
  );
  const executionParty = executionDraft.orderType === "own_transport" ? ownFleetCarrier : selectedCarrier;
  const selectedCarrierManagers = selectedCarrier?.managerContacts || [];
  const selectedExecutionTrucks = executionParty?.trucks || [];
  const selectedExecutionTrailers = executionParty?.trailers || [];
  const selectedExecutionDrivers = executionParty?.drivers || [];
  const filteredClientOptions = useMemo(() => {
    const query = clientPickerSearch.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((client) =>
      (client.name || "").toLowerCase().includes(query) ||
      (client.companyCode || "").toLowerCase().includes(query) ||
      (client.vatCode || "").toLowerCase().includes(query) ||
      (client.email || "").toLowerCase().includes(query)
    );
  }, [clients, clientPickerSearch]);
  const filteredCarrierOptions = useMemo(() => {
    const query = carrierPickerSearch.trim().toLowerCase();
    const baseOptions = carriers.filter((carrier) => !carrier.isOwnCompany);
    if (!query) return baseOptions;
    return baseOptions.filter((carrier) =>
      (carrier.name || "").toLowerCase().includes(query) ||
      (carrier.companyCode || "").toLowerCase().includes(query) ||
      (carrier.vatCode || "").toLowerCase().includes(query) ||
      (carrier.email || "").toLowerCase().includes(query) ||
      (carrier.phone || "").toLowerCase().includes(query)
    );
  }, [carriers, carrierPickerSearch]);
  const matchedClientContactId = useMemo(() => {
    const matchedContact = selectedClientContacts.find((contact) =>
      (contact.name || "") === (projectDraft.clientContactName || "") &&
      (contact.phone || "") === (projectDraft.clientContactPhone || "") &&
      (contact.email || "") === (projectDraft.clientContactEmail || "")
    );
    return matchedContact ? String(matchedContact.id) : "";
  }, [selectedClientContacts, projectDraft.clientContactName, projectDraft.clientContactPhone, projectDraft.clientContactEmail]);
  const matchedManagerId = useMemo(() => {
    const matchedManager = selectedCarrierManagers.find((manager) =>
      (manager.name || "") === (executionDraft.contactName || "") &&
      (manager.phone || "") === (executionDraft.contactPhone || "") &&
      (manager.email || "") === (executionDraft.contactEmail || "")
    );
    return matchedManager ? String(matchedManager.id) : "";
  }, [selectedCarrierManagers, executionDraft.contactName, executionDraft.contactPhone, executionDraft.contactEmail]);
  const matchedTruckId = useMemo(() => {
    const matchedTruck = selectedExecutionTrucks.find(
      (truck) => String(truck.licensePlate || "").toUpperCase() === String(executionDraft.truckPlate || "").toUpperCase()
    );
    return matchedTruck ? String(matchedTruck.id) : "";
  }, [selectedExecutionTrucks, executionDraft.truckPlate]);
  const matchedTrailerId = useMemo(() => {
    const matchedTrailer = selectedExecutionTrailers.find(
      (trailer) => String(trailer.licensePlate || "").toUpperCase() === String(executionDraft.trailerPlate || "").toUpperCase()
    );
    return matchedTrailer ? String(matchedTrailer.id) : "";
  }, [selectedExecutionTrailers, executionDraft.trailerPlate]);
  const matchedDriverId = useMemo(() => {
    const matchedDriver = selectedExecutionDrivers.find(
      (driver) => String(driver.name || "").trim() === String(executionDraft.driverName || "").trim()
    );
    return matchedDriver ? String(matchedDriver.id) : "";
  }, [selectedExecutionDrivers, executionDraft.driverName]);
  const selectedDriverRecord = useMemo(
    () => selectedExecutionDrivers.find((driver) => String(driver.id || "") === String(selectedDriverId || matchedDriverId))
      || selectedExecutionDrivers.find((driver) => String(driver.name || "").trim() === String(executionDraft.driverName || "").trim())
      || null,
    [selectedExecutionDrivers, selectedDriverId, matchedDriverId, executionDraft.driverName]
  );
  const selectedTruckRecord = useMemo(
    () => selectedExecutionTrucks.find((truck) => String(truck.id || "") === String(selectedTruckId || matchedTruckId))
      || selectedExecutionTrucks.find((truck) => String(truck.licensePlate || "").toUpperCase() === String(executionDraft.truckPlate || "").toUpperCase())
      || null,
    [selectedExecutionTrucks, selectedTruckId, matchedTruckId, executionDraft.truckPlate]
  );
  const selectedTrailerRecord = useMemo(
    () => selectedExecutionTrailers.find((trailer) => String(trailer.id || "") === String(selectedTrailerId || matchedTrailerId))
      || selectedExecutionTrailers.find((trailer) => String(trailer.licensePlate || "").toUpperCase() === String(executionDraft.trailerPlate || "").toUpperCase())
      || null,
    [selectedExecutionTrailers, selectedTrailerId, matchedTrailerId, executionDraft.trailerPlate]
  );
  const companyProfile = settings?.company || {};
  const selectedClientHealth = useMemo(
    () => (selectedClient ? analyzeClientData(selectedClient) : null),
    [selectedClient]
  );
  const selectedCarrierHealth = useMemo(
    () => (selectedCarrier ? analyzeCarrierData(selectedCarrier) : null),
    [selectedCarrier]
  );
  const selectedDriverHealth = useMemo(
    () => (selectedDriverRecord ? analyzeDriverData(selectedDriverRecord) : null),
    [selectedDriverRecord]
  );
  const selectedTruckHealth = useMemo(
    () => (selectedTruckRecord ? analyzeTruckData(selectedTruckRecord) : null),
    [selectedTruckRecord]
  );
  const selectedTrailerHealth = useMemo(
    () => (selectedTrailerRecord ? analyzeTrailerData(selectedTrailerRecord) : null),
    [selectedTrailerRecord]
  );
  const currentFinancials = calculateExecutionFinancials({ projectDraft, executionDraft });
  const currentProfit = currentFinancials.profit;
  const currentMargin = currentFinancials.profitMargin;
  const vatModeValue = executionDraft.vatMode || "without_vat";
  console.log('🟡 vatModeValue calculated:', vatModeValue, 'from executionDraft.vatMode:', executionDraft.vatMode);
  const originalsRequiredValue = projectDraft.originalsRequired || "not_required";
  console.log('🟠 originalsRequiredValue calculated:', originalsRequiredValue, 'from projectDraft.originalsRequired:', projectDraft.originalsRequired);
  const documentPreviewContext = useMemo(() => ({
    orderNumber: executionDraft.orderNumber || "Naujas užsakymas",
    carrierLabel: executionDraft.carrierName || selectedCarrier?.name || "vežėjas nepasirinktas",
    carrierEmail: selectedCarrier?.email || executionDraft.carrierEmail || "",
    wordFileName: `uzsakymas_${executionDraft.orderNumber || "doc"}.doc`,
    mailSubject: `Transporto užsakymas ${executionDraft.orderNumber || ""}`,
  }), [executionDraft.orderNumber, executionDraft.carrierName, executionDraft.carrierEmail, selectedCarrier]);
  const forcedExecutionMode = workflowMode === "expedition"
    ? "resale_to_carrier"
    : workflowMode === "own_transport"
      ? "own_transport"
      : null;
  const isWorkflowLocked = Boolean(forcedExecutionMode);
  const workflowTitle = forcedExecutionMode === "resale_to_carrier"
    ? "Ekspedijavimo workflow"
    : forcedExecutionMode === "own_transport"
      ? "Nuosavo transporto workflow"
      : "Universalus užsakymo workflow";
  const workflowDescription = forcedExecutionMode === "resale_to_carrier"
    ? "Projektas kuriamas ekspedijavimo modulyje. Čia pildomi projekto kliento duomenys ir išorinio vežėjo vykdymo dalis."
    : forcedExecutionMode === "own_transport"
      ? "Projektas kuriamas nuosavo transporto modulyje. Čia pildomi projekto kliento duomenys ir mūsų fleet vykdymo dalis."
      : "Pereinamasis bendras workflow. Vėliau visi kūrimo keliai bus pilnai atskirti pagal modulį.";
  const customerLabel = projectDraft.clientName || selectedClient?.name || "Klientas nepasirinktas";
  const executionLabel = executionDraft.orderType === "own_transport"
    ? (executionDraft.driverName || executionDraft.truckPlate || ownFleetCarrier?.name || "Fleet vykdytojas nepasirinktas")
    : (executionDraft.carrierName || selectedCarrier?.name || "Vežėjas nepasirinktas");
  const currentManagerName = useMemo(() => resolveDefaultManagerName(settings), [settings]);
  const executionCostLabel = executionDraft.orderType === "own_transport" ? "Savikaina" : "Vykdymo kaina";
  const workflowEntityLabel = executionDraft.orderType === "own_transport" ? "own_fleet projektas" : "expedicijos projektas";
  const saveButtonLabel = initialData?.id
    ? "Išsaugoti pakeitimus"
    : executionDraft.orderType === "own_transport"
      ? "Išsaugoti own_fleet projektą"
      : "Išsaugoti ekspedicijos projektą";
  const isCarrierDocumentBlocked = executionDraft.orderType === "resale_to_carrier" && Boolean(selectedCarrierHealth?.hasCriticalIssues);
  const carrierBlockingReasons = selectedCarrierHealth?.missingCriticalFields || [];

  useEffect(() => {
    if (type !== "order" || initialData?.id || projectDraft.projectId) return;
    setProjectDraft((prev) => ({ ...prev, projectId: createProjectId(orders) }));
  }, [type, initialData?.id, projectDraft.projectId, orders]);

  useEffect(() => {
    if (type !== "order" || initialData?.id || executionDraft.orderNumber) return;
    setExecutionDraft((prev) => ({ ...prev, orderNumber: createOrderNumber(orders) }));
  }, [type, initialData?.id, executionDraft.orderNumber, orders]);

  useEffect(() => {
    if (type !== "order" || projectDraft.managerName) return;
    setProjectDraft((prev) => ({ ...prev, managerName: currentManagerName }));
  }, [type, projectDraft.managerName, currentManagerName]);

  /* REDUNDANT: normalization already happens in updateFormData at the write site
  useEffect(() => {
    const normalizedVatMode = normalizeVatMode(executionDraft.vatMode ?? executionDraft.carrierPriceWithVAT);
    const normalizedCarrierPriceWithVat = normalizedVatMode === "with_vat";
    if (
      executionDraft.vatMode !== normalizedVatMode ||
      Boolean(executionDraft.carrierPriceWithVAT) !== normalizedCarrierPriceWithVat
    ) {
      setExecutionDraft((prev) => ({
        ...prev,
        vatMode: normalizedVatMode,
        carrierPriceWithVAT: normalizedCarrierPriceWithVat,
      }));
    }
  }, [executionDraft.vatMode, executionDraft.carrierPriceWithVAT]);
  */

  /* REDUNDANT: normalization already happens in updateFormData at the write site
  useEffect(() => {
    const normalizedOriginalsRequired = normalizeOriginalsRequired(projectDraft.originalsRequired);
    if (projectDraft.originalsRequired !== normalizedOriginalsRequired) {
      setProjectDraft((prev) => ({
        ...prev,
        originalsRequired: normalizedOriginalsRequired,
      }));
    }
  }, [projectDraft.originalsRequired]);
  */

  useEffect(() => {
    const nextRoute = buildRouteFromDraft(projectDraft);
    if (nextRoute !== (projectDraft.route || "")) {
      setProjectDraft((prev) => ({ ...prev, route: nextRoute }));
    }
  }, [projectDraft.loadingCity, projectDraft.loadingCountry, projectDraft.unloadingCity, projectDraft.unloadingCountry]);

  useEffect(() => {
    if (type !== "order") return;
    lastPreparedFutureBundleRef.current = null;
    if (initialData) {
      applyLegacyCompatibleForm({ ...emptyOrderForm, ...initialData });
      return;
    }
    if (workflowMode === "expedition") {
      applyLegacyCompatibleForm(buildFreshOrderSeed(orders, settings, { orderType: "resale_to_carrier", sendToCarrier: true }));
      return;
    }
    if (workflowMode === "own_transport") {
      applyLegacyCompatibleForm(buildFreshOrderSeed(orders, settings, { orderType: "own_transport", sendToCarrier: false }));
      return;
    }
    try {
      const savedDraft = JSON.parse(localStorage.getItem("currentOrderDraftForm") || "null");
      if (savedDraft?.projectDraft || savedDraft?.executionDraft) {
        const mergedProjectDraft = {
          ...emptyProjectDraft,
          projectId: createProjectId(orders),
          managerName: resolveDefaultManagerName(settings),
          ...(savedDraft.projectDraft || {}),
          documents: {
            ...emptyProjectDraft.documents,
            ...(savedDraft.projectDraft?.documents || {}),
          },
        };
        const mergedExecutionDraft = {
          ...emptyExecutionDraft,
          orderNumber: createOrderNumber(orders),
          ...(savedDraft.executionDraft || {}),
        };

        setProjectDraft(mergedProjectDraft);
        setExecutionDraft(mergedExecutionDraft);
        setLegacyCompatibilityState({});
        return;
      }
      if (savedDraft) {
        applyLegacyCompatibleForm(buildFreshOrderSeed(orders, settings, savedDraft));
        return;
      }
    } catch {}
    applyLegacyCompatibleForm(buildFreshOrderSeed(orders, settings));
  }, [type, initialData, workflowMode]);

  useEffect(() => {
    if (type === "order") {
      localStorage.setItem("currentOrderDraftForm", JSON.stringify(buildDraftStorageSnapshot(projectDraft, executionDraft)));
    }
  }, [type, projectDraft, executionDraft]);

  useEffect(() => {
    setSelectedManagerId("");
    setSelectedTruckId("");
    setSelectedTrailerId("");
    setSelectedDriverId("");
  }, [executionDraft.carrierId, executionDraft.orderType]);

  const updateFormData = (updates) => {
    console.log('🔵 updateFormData called with:', JSON.stringify(updates, null, 2));
    const projectUpdates = {};
    const executionUpdates = {};
    const legacyOnlyUpdates = {};

    Object.entries(updates || {}).forEach(([key, value]) => {
      if (key === "documents") {
        projectUpdates.documents = {
          ...(projectDraft.documents || {}),
          ...(value || {}),
        };
        return;
      }

      if (key === "vatMode") {
        const normalizedVatMode = normalizeVatMode(value);
        executionUpdates.vatMode = normalizedVatMode;
        executionUpdates.carrierPriceWithVAT = normalizedVatMode === "with_vat";
        return;
      }

      if (key === "carrierPriceWithVAT") {
        const normalizedVatMode = normalizeVatMode(value);
        executionUpdates.carrierPriceWithVAT = normalizedVatMode === "with_vat";
        executionUpdates.vatMode = normalizedVatMode;
        return;
      }

      if (key === "originalsRequired") {
        projectUpdates.originalsRequired = normalizeOriginalsRequired(value);
        return;
      }

      if (projectDraftFieldKeys.has(key)) {
        projectUpdates[key] = value;
        return;
      }

      if (executionDraftFieldKeys.has(key)) {
        executionUpdates[key] = value;
        return;
      }

      legacyOnlyUpdates[key] = value;
    });

    const nextProjectDraft = {
      ...projectDraft,
      ...projectUpdates,
      documents: projectUpdates.documents || projectDraft.documents,
    };
    const nextExecutionDraft = {
      ...executionDraft,
      ...executionUpdates,
    };
    const nextLegacyCompatibilityState = pickLegacyCompatibilityState({
      ...legacyCompatibilityState,
      ...legacyOnlyUpdates,
    });

    setProjectDraft(nextProjectDraft);
    setExecutionDraft(nextExecutionDraft);
    console.log('🟢 executionDraft updated:', JSON.stringify(executionUpdates, null, 2));
    console.log('🟢 BEFORE update, executionDraft.vatMode was:', executionDraft.vatMode);
    setLegacyCompatibilityState(nextLegacyCompatibilityState);
  };

  const saveQuickAddEntity = () => {
    const targetCarrierId = executionDraft.orderType === "own_transport"
      ? ownFleetCarrier?.id
      : executionDraft.carrierId;
    if (!quickAdd || !targetCarrierId) return;
    const carrier = carriers.find((c) => String(c.id) === String(targetCarrierId));
    if (!carrier) return;

    const fieldMap = { manager: "managerContacts", driver: "drivers", truck: "trucks", trailer: "trailers" };
    const field = fieldMap[quickAdd.type];
    const newItem = { ...quickAdd.fields, id: Date.now() };
    const updatedCarrier = { ...carrier, [field]: [...(carrier[field] || []), newItem] };

    if (saveCarriers) {
      saveCarriers(carriers.map((c) => String(c.id) === String(targetCarrierId) ? updatedCarrier : c));
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

  const applySelectedClientContact = (contactId) => {
    const contact = selectedClientContacts.find((item) => String(item.id) === String(contactId));
    if (!contact) {
      setSelectedClientContactId("");
      updateFormData({
        clientContactId: "",
        clientContactName: "",
        clientContactPhone: "",
        clientContactEmail: "",
      });
      return;
    }
    setSelectedClientContactId(String(contact.id));
    updateFormData({
      clientContactId: String(contact.id),
      clientContactName: contact.name || "",
      clientContactPhone: contact.phone || "",
      clientContactEmail: contact.email || "",
    });
  };

  const saveNewClientIntoBase = () => {
    if (!saveClients) return;
    if (!newClientDraft.name.trim()) {
      window.alert("Įveskite kliento pavadinimą.");
      return;
    }
    const clientId = `CL-${Date.now()}`;
    const createdClient = {
      id: clientId,
      name: newClientDraft.name.trim(),
      clientType: "Tiesioginis klientas",
      companyCode: newClientDraft.companyCode.trim(),
      vatCode: newClientDraft.vatCode.trim(),
      email: newClientDraft.email.trim(),
      phone: newClientDraft.phone.trim(),
      address: newClientDraft.address.trim(),
      invoiceEmail: newClientDraft.email.trim(),
      cmrEmail: newClientDraft.email.trim(),
      podEmail: newClientDraft.email.trim(),
      contacts: [
        {
          id: 1,
          name: newClientDraft.contactName.trim(),
          position: "",
          email: newClientDraft.contactEmail.trim(),
          phone: newClientDraft.contactPhone.trim(),
        },
      ],
      departmentContacts: [],
      notes: "",
    };
    saveClients([...clients, createdClient]);
    setShowNewClientModal(false);
    setNewClientDraft({ name: "", companyCode: "", vatCode: "", email: "", phone: "", address: "", contactName: "", contactEmail: "", contactPhone: "" });
    applySelectedClient(clientId);
  };

  const applySelectedClient = (clientId) => {
    const client = clients.find((c) => String(c.id) === String(clientId));
    if (!client) {
      setFormActionMessage("");
      updateFormData({
        clientId: "",
        clientName: "",
        clientCompanyCode: "",
        clientVatCode: "",
        clientPhone: "",
        clientEmail: "",
        clientAddress: "",
        clientContactId: "",
        clientContactName: "",
        clientContactPhone: "",
        clientContactEmail: "",
      });
      return;
    }

    const defaultContact = getDefaultClientContact(client);

    updateFormData({
      clientId: String(client.id),
      clientName: client.name || "",
      clientCompanyCode: client.companyCode || "",
      clientVatCode: client.vatCode || "",
      clientPhone: client.phone || "",
      clientEmail: client.email || "",
      clientAddress: client.address || "",
      clientContactId: defaultContact ? String(defaultContact.id) : "",
      clientContactName: defaultContact?.name || "",
      clientContactPhone: defaultContact?.phone || "",
      clientContactEmail: defaultContact?.email || "",
    });
    setSelectedClientContactId(defaultContact ? String(defaultContact.id) : "");
    setFormActionMessage(`Pasirinktas klientas: ${client.name || "be pavadinimo"}`);
  };

  const openEntityEditModal = (entityType) => {
    if (entityType === "client" && selectedClient) {
      const contact = selectedClientHealth?.defaultContact || selectedClientContacts[0] || {};
      setEntityEditModal({
        entityType,
        draft: {
          name: selectedClient.name || "",
          companyCode: selectedClient.companyCode || "",
          vatCode: selectedClient.vatCode || "",
          email: selectedClient.email || "",
          phone: selectedClient.phone || "",
          address: selectedClient.address || "",
          contactName: contact.name || "",
          contactEmail: contact.email || "",
          contactPhone: contact.phone || "",
        },
      });
      return;
    }

    if (entityType === "carrier" && selectedCarrier) {
      const manager = selectedCarrierHealth?.defaultContact || selectedCarrierManagers[0] || {};
      const cmrDocument = selectedCarrierHealth?.documentHealth?.cmrDocument || {};
      const licenseDocument = selectedCarrierHealth?.documentHealth?.licenseDocument || {};
      setEntityEditModal({
        entityType,
        draft: {
          name: selectedCarrier.name || "",
          companyCode: selectedCarrier.companyCode || "",
          vatCode: selectedCarrier.vatCode || "",
          email: selectedCarrier.email || "",
          phone: selectedCarrier.phone || "",
          address: selectedCarrier.address || "",
          contactName: manager.name || "",
          contactEmail: manager.email || "",
          contactPhone: manager.phone || "",
          cmrExpiry: cmrDocument.validUntil || "",
          licenseExpiry: licenseDocument.validUntil || "",
        },
      });
      return;
    }

    if (entityType === "driver" && (selectedDriverRecord || executionDraft.driverName)) {
      setEntityEditModal({
        entityType,
        draft: {
          name: selectedDriverRecord?.name || executionDraft.driverName || "",
          phone: selectedDriverRecord?.phone || "",
        },
      });
      return;
    }

    if (entityType === "truck" && (selectedTruckRecord || executionDraft.truckPlate)) {
      setEntityEditModal({
        entityType,
        draft: {
          licensePlate: selectedTruckRecord?.licensePlate || executionDraft.truckPlate || "",
          status: selectedTruckRecord?.status || "",
          model: selectedTruckRecord?.model || "",
        },
      });
      return;
    }

    if (entityType === "trailer" && (selectedTrailerRecord || executionDraft.trailerPlate)) {
      setEntityEditModal({
        entityType,
        draft: {
          licensePlate: selectedTrailerRecord?.licensePlate || executionDraft.trailerPlate || "",
          status: selectedTrailerRecord?.status || "",
          model: selectedTrailerRecord?.model || "",
        },
      });
    }
  };

  const updateEntityEditDraft = (field, value) => {
    setEntityEditModal((prev) => (prev ? { ...prev, draft: { ...prev.draft, [field]: value } } : prev));
  };

  const saveEntityEditModal = () => {
    if (!entityEditModal) return;

    if (entityEditModal.entityType === "client" && selectedClient && saveClients) {
      const primaryContact = {
        id: selectedClient.contacts?.[0]?.id || 1,
        ...(selectedClient.contacts?.[0] || {}),
        name: entityEditModal.draft.contactName || "",
        email: entityEditModal.draft.contactEmail || "",
        phone: entityEditModal.draft.contactPhone || "",
      };
      const updatedClient = {
        ...selectedClient,
        name: entityEditModal.draft.name || "",
        companyCode: entityEditModal.draft.companyCode || "",
        vatCode: entityEditModal.draft.vatCode || "",
        email: entityEditModal.draft.email || "",
        phone: entityEditModal.draft.phone || "",
        address: entityEditModal.draft.address || "",
        contacts: [primaryContact, ...(selectedClient.contacts || []).slice(1)],
      };
      saveClients(clients.map((client) => String(client.id) === String(selectedClient.id) ? updatedClient : client));
      updateFormData({
        clientId: String(updatedClient.id),
        clientName: updatedClient.name || "",
        clientCompanyCode: updatedClient.companyCode || "",
        clientVatCode: updatedClient.vatCode || "",
        clientPhone: updatedClient.phone || "",
        clientEmail: updatedClient.email || "",
        clientAddress: updatedClient.address || "",
        clientContactId: String(primaryContact.id || ""),
        clientContactName: primaryContact.name || "",
        clientContactPhone: primaryContact.phone || "",
        clientContactEmail: primaryContact.email || "",
      });
      setSelectedClientContactId(String(primaryContact.id || ""));
      setEntityEditModal(null);
      return;
    }

    if (entityEditModal.entityType === "carrier" && selectedCarrier && saveCarriers) {
      const cmrIndex = (selectedCarrier.documents || []).findIndex((doc) => String(doc.title || "").toLowerCase().includes("cmr"));
      const licenseIndex = (selectedCarrier.documents || []).findIndex((doc) => String(doc.title || "").toLowerCase().includes("licenc"));
      const nextDocuments = [...(selectedCarrier.documents || [])];
      const ensureDoc = (index, title, validUntil) => {
        if (index >= 0) {
          nextDocuments[index] = { ...nextDocuments[index], title, validUntil };
        } else {
          nextDocuments.push({ id: Date.now() + nextDocuments.length, title, number: "", validUntil, link: "" });
        }
      };
      ensureDoc(cmrIndex, "CMR draudimas", entityEditModal.draft.cmrExpiry || "");
      ensureDoc(licenseIndex, "Transporto licencija", entityEditModal.draft.licenseExpiry || "");

      const primaryManager = {
        id: selectedCarrier.managerContacts?.[0]?.id || 1,
        ...(selectedCarrier.managerContacts?.[0] || {}),
        name: entityEditModal.draft.contactName || "",
        email: entityEditModal.draft.contactEmail || "",
        phone: entityEditModal.draft.contactPhone || "",
      };

      const updatedCarrier = {
        ...selectedCarrier,
        name: entityEditModal.draft.name || "",
        companyCode: entityEditModal.draft.companyCode || "",
        vatCode: entityEditModal.draft.vatCode || "",
        email: entityEditModal.draft.email || "",
        phone: entityEditModal.draft.phone || "",
        address: entityEditModal.draft.address || "",
        managerContacts: [primaryManager, ...(selectedCarrier.managerContacts || []).slice(1)],
        documents: nextDocuments,
      };

      saveCarriers(carriers.map((carrier) => String(carrier.id) === String(selectedCarrier.id) ? updatedCarrier : carrier));
      updateFormData({
        carrierId: String(updatedCarrier.id),
        carrierName: updatedCarrier.name || "",
        carrierCompanyCode: updatedCarrier.companyCode || "",
        carrierVAT: updatedCarrier.vatCode || "",
        carrierEmail: updatedCarrier.email || "",
        carrierPhone: updatedCarrier.phone || "",
        carrierAddress: updatedCarrier.address || "",
        contactName: primaryManager.name || "",
        contactPhone: primaryManager.phone || "",
        contactEmail: primaryManager.email || "",
      });
      setEntityEditModal(null);
      return;
    }

    const targetCarrier = executionDraft.orderType === "own_transport" ? ownFleetCarrier : selectedCarrier;
    if (!targetCarrier || !saveCarriers) {
      setEntityEditModal(null);
      return;
    }

    const entityMap = {
      driver: {
        field: "drivers",
        match: (item) => String(item.id || "") === String(selectedDriverRecord?.id || "") || String(item.name || "").trim() === String(selectedDriverRecord?.name || executionDraft.driverName || "").trim(),
        applyToDraft: (item) => updateFormData({ driverName: item.name || "" }),
      },
      truck: {
        field: "trucks",
        match: (item) => String(item.id || "") === String(selectedTruckRecord?.id || "") || String(item.licensePlate || "").toUpperCase() === String(selectedTruckRecord?.licensePlate || executionDraft.truckPlate || "").toUpperCase(),
        applyToDraft: (item) => updateFormData({ truckPlate: String(item.licensePlate || "").toUpperCase() }),
      },
      trailer: {
        field: "trailers",
        match: (item) => String(item.id || "") === String(selectedTrailerRecord?.id || "") || String(item.licensePlate || "").toUpperCase() === String(selectedTrailerRecord?.licensePlate || executionDraft.trailerPlate || "").toUpperCase(),
        applyToDraft: (item) => updateFormData({ trailerPlate: String(item.licensePlate || "").toUpperCase() }),
      },
    };

    const config = entityMap[entityEditModal.entityType];
    if (!config) {
      setEntityEditModal(null);
      return;
    }

    const updatedList = (targetCarrier[config.field] || []).map((item) =>
      config.match(item) ? { ...item, ...entityEditModal.draft } : item
    );
    const updatedCarrier = { ...targetCarrier, [config.field]: updatedList };
    saveCarriers(carriers.map((carrier) => String(carrier.id) === String(targetCarrier.id) ? updatedCarrier : carrier));
    const updatedEntity = updatedList.find((item) => config.match(item));
    if (updatedEntity) {
      config.applyToDraft(updatedEntity);
    }
    setEntityEditModal(null);
  };

  const renderEntityHealthBlock = ({
    title,
    result,
    criticalPrefix = "Kritinė problema",
    recommendedPrefix = "Trūksta duomenų",
    okLabel = "Duomenys pilni",
    onEdit,
    extraActions = null,
  }) => {
    if (!result) return null;

    const hasCritical = result.hasCriticalIssues;
    const hasRecommended = result.missingRecommendedFields.length > 0;
    const style = hasCritical
      ? { ...dataStatusCardBase, background: "#fef2f2", borderColor: "#fca5a5" }
      : hasRecommended
        ? { ...dataStatusCardBase, background: "#fff7ed", borderColor: "#fdba74" }
        : { ...dataStatusCardBase, background: "#ecfdf5", borderColor: "#86efac" };

    return (
      <div style={style}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: hasCritical ? "#991b1b" : hasRecommended ? "#9a3412" : "#166534", marginBottom: "8px" }}>
          {title}
        </div>
        {hasCritical ? (
          <div style={{ color: "#991b1b", fontSize: "13px", lineHeight: 1.6 }}>
            <strong>{criticalPrefix}:</strong> {result.missingCriticalFields.join(", ")}
          </div>
        ) : hasRecommended ? (
          <div style={{ color: "#9a3412", fontSize: "13px", lineHeight: 1.6 }}>
            <strong>{recommendedPrefix}:</strong> {result.missingRecommendedFields.join(", ")}
          </div>
        ) : (
          <div style={{ color: "#166534", fontSize: "13px", lineHeight: 1.6 }}>{okLabel}</div>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
          {onEdit ? (
            <button type="button" style={{ ...btnSecondary, fontSize: "12px", padding: "7px 14px" }} onClick={onEdit}>
              Papildyti dabar
            </button>
          ) : null}
          {extraActions}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!projectDraft.clientId) {
      if (selectedClientContactId) {
        setSelectedClientContactId("");
      }
      return;
    }

    if (selectedClientContacts.length === 0) {
      if (
        projectDraft.clientContactId ||
        projectDraft.clientContactName ||
        projectDraft.clientContactPhone ||
        projectDraft.clientContactEmail ||
        selectedClientContactId
      ) {
        setSelectedClientContactId("");
        updateFormData({
          clientContactId: "",
          clientContactName: "",
          clientContactPhone: "",
          clientContactEmail: "",
        });
      }
      return;
    }

    const activeContactId = projectDraft.clientContactId || selectedClientContactId || matchedClientContactId;
    const matchedContact = selectedClientContacts.find((contact) => String(contact.id) === String(activeContactId));
    if (matchedContact) {
      if (String(selectedClientContactId || "") !== String(matchedContact.id)) {
        setSelectedClientContactId(String(matchedContact.id));
      }
      return;
    }

    const defaultContact = getDefaultClientContact(selectedClient);
    if (!defaultContact) return;

    setSelectedClientContactId(String(defaultContact.id));
    updateFormData({
      clientContactId: String(defaultContact.id),
      clientContactName: defaultContact.name || "",
      clientContactPhone: defaultContact.phone || "",
      clientContactEmail: defaultContact.email || "",
    });
  }, [
    projectDraft.clientId,
    projectDraft.clientContactId,
    projectDraft.clientContactName,
    projectDraft.clientContactPhone,
    projectDraft.clientContactEmail,
    selectedClient,
    selectedClientContacts,
    selectedClientContactId,
    matchedClientContactId,
  ]);

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
    const { saved } = persistLegacyOrderFromDrafts({
      status,
      id: executionDraft.id,
      orderNumber: executionDraft.orderNumber || createOrderNumber(orders),
      persistTarget,
    });
    setFormActionMessage(`Juodraštis išsaugotas (${saved.orderNumber})`);
    if (!silent) window.alert(`Juodraštis išsaugotas (${saved.orderNumber})`);
    return saved;
  };

  const closePreview = () => {
    setPreviewHtml(null);
    setPreviewDocument(null);
  };

  const renderDocumentFromDrafts = () => {
    const renderedDocument = renderOrderDocument({
      projectDraft,
      executionDraft,
      settings,
      carriers,
      draftPayload: buildLegacyPayloadFromDrafts(),
      title: documentPreviewContext.orderNumber || "Dokumentas",
    });
    if (renderedDocument.error) {
      window.alert(renderedDocument.error);
      return null;
    }
    return renderedDocument;
  };
  const openRenderedDocumentWindow = (renderedDocument, { autoPrint = false, title = "Dokumentas" } = {}) => {
    const win = window.open("", "_blank");
    if (!win) return null;
    const printableHtml = autoPrint
      ? renderedDocument.fullHtml.replace("</body>", "<script>window.onload=()=>window.print();<\/script></body>")
      : renderedDocument.fullHtml;
    win.document.write(printableHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`));
    win.document.close();
    return win;
  };
  const openPreviewFromDrafts = () => {
    if (isCarrierDocumentBlocked) {
      window.alert(`Pirmiausia atnaujinkite vežėjo dokumentus prieš generuojant užsakymą.\n\n${carrierBlockingReasons.join("\n")}`);
      return;
    }
    const renderedDocument = renderDocumentFromDrafts();
    if (renderedDocument) {
      setPreviewDocument(renderedDocument);
      setPreviewHtml(renderedDocument.html);
      setFormActionMessage("Dokumento peržiūra sugeneruota.");
    }
  };
  const sendPreviewToCarrier = () => {
    if (!documentPreviewContext.carrierEmail) {
      return window.alert("Vežėjo el. paštas nenurodytas.");
    }
    window.location.href = `mailto:${documentPreviewContext.carrierEmail}?subject=${documentPreviewContext.mailSubject}&body=Prašome rasti pridėtą transporto užsakymą.`;
  };
  const printPreviewDocument = () => {
    const renderedDocument = previewDocument || renderDocumentFromDrafts();
    if (!renderedDocument) return;
    openRenderedDocumentWindow(renderedDocument, { autoPrint: true, title: "Dokumentas" });
  };
  const exportPreviewAsWord = () => {
    const renderedDocument = previewDocument || renderDocumentFromDrafts();
    if (!renderedDocument) return;
    const wordHtmlSource =
      renderedDocument.pageBodies?.length && renderedDocument.layout
        ? buildOrderDocumentPagesMarkup({
            pages: renderedDocument.pageBodies,
            headerHtml: renderedDocument.renderedHeaderHtml || "",
            footerHtml: renderedDocument.renderedFooterHtml || "",
            layout: renderedDocument.layout,
          })
        : renderedDocument.html;
    const docHtml = buildOrderDocumentWordHtml({
      html: wordHtmlSource,
      css: renderedDocument.css,
      title: documentPreviewContext.orderNumber || "Uzsakymas",
    });
    const blob = new Blob([docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = documentPreviewContext.wordFileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };
  const savePreviewAsPdf = () => {
    const renderedDocument = previewDocument || renderDocumentFromDrafts();
    if (!renderedDocument) return;
    openRenderedDocumentWindow(renderedDocument, { autoPrint: true, title: "Uzsakymas_PDF" });
  };
  const previewPageSize = previewDocument?.pageSize || getOrderDocumentPageSize("portrait");
  const previewPageScale = Math.max(0.25, previewZoom / 100);
  const previewPageDocs = previewDocument?.pageHtmlDocs?.length
    ? previewDocument.pageHtmlDocs
    : previewDocument?.fullHtml
      ? [previewDocument.fullHtml]
      : [];

  const generateCarrierOrder = () => {
    if (isCarrierDocumentBlocked) {
      return window.alert(`Vežėjo užsakymo generuoti negalima.\n\n${carrierBlockingReasons.join("\n")}`);
    }
    const validationError = validateCarrierOrderGeneration({ executionDraft });
    if (validationError) return window.alert(validationError);
    saveOrderAsDraft("generated", true);
    setFormActionMessage("Užsakymas pažymėtas kaip paruoštas siuntimui.");
    window.alert("Užsakymas pažymėtas kaip paruoštas siuntimui.");
  };

  const saveToDb = () => {
    if (isCarrierDocumentBlocked) {
      return window.alert(`Negalima tęsti su šiuo vežėju, kol nebus atnaujinti dokumentai.\n\n${carrierBlockingReasons.join("\n")}`);
    }
    const validation = validateDraftBeforeSave({ projectDraft, executionDraft });
    if (validation.error) return window.alert(validation.error);
    if (validation.needsNegativeProfitConfirmation && !window.confirm(`DĖMESIO: Neigiamas pelnas (${validation.financials.profit.toFixed(2)} EUR). Ar tikrai norite tęsti?`)) return;
    persistLegacyOrderFromDrafts({
      status: "active",
      persistTarget,
      afterSave: () => {
        setFormActionMessage("Užsakymas išsaugotas.");
        localStorage.removeItem("currentOrderDraftForm");
        closePreview();
        onClose();
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveToDb();
  };

  if (type !== "order") return null;
  return (
    <>
    <div style={modalOverlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeader}>
          <h2 style={{ fontSize: "20px", color: "#1e3a8a", margin: 0 }}>
            {initialData?.id
              ? "Redaguoti krovinį"
              : workflowMode === "expedition"
                ? "Naujas ekspedicijos krovinys"
                : workflowMode === "own_transport"
                  ? "Naujas nuosavo transporto krovinys"
                  : "Naujas krovinys"}
          </h2>
          <button style={closeBtn} onClick={onClose}>×</button>
        </div>
        <form onSubmit={(e) => e.preventDefault()}>
          <div style={{ marginBottom: "20px", padding: "18px", background: "linear-gradient(135deg, #eff6ff, #f8fafc)", border: "1px solid #bfdbfe", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "#2563eb", marginBottom: "6px" }}>
                  {workflowTitle}
                </div>
                <div style={{ fontSize: "14px", color: "#334155", lineHeight: 1.55, maxWidth: "760px" }}>
                  {workflowDescription}
                </div>
              </div>
              {!isWorkflowLocked && (
                <div style={{ minWidth: "260px" }}>
                  <label style={{ display: "block", marginBottom: "10px", fontWeight: 600, color: "#1e3a8a" }}>Užsakymo tipas *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                    {["own_transport", "resale_to_carrier"].map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => updateFormData({ orderType: choice })}
                        style={{
                          padding: "14px",
                          border: `2px solid ${executionDraft.orderType === choice ? "#3b82f6" : "#e2e8f0"}`,
                          borderRadius: "10px",
                          cursor: "pointer",
                          background: executionDraft.orderType === choice ? "#dbeafe" : "#fff",
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        {choice === "own_transport" ? "Nuosavas transportas" : "Ekspedijavimas"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: "10px", marginTop: "16px" }}>
              <div style={observerMiniStat}>Modulis: {forcedExecutionMode === "resale_to_carrier" ? "Ekspedijavimas" : forcedExecutionMode === "own_transport" ? "Nuosavas transportas" : "Bendras"}</div>
              <div style={observerMiniStat}>Klientas: {customerLabel}</div>
              <div style={observerMiniStat}>Vykdymas: {executionLabel}</div>
              <div style={observerMiniStat}>Projektų registras: įrašas po išsaugojimo</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "18px", marginBottom: "18px" }}>
            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>1. PROJEKTAS</div>
              <div style={formGrid}>
                <div style={formGroup}>
                  <label style={label}>Projekto ID</label>
                  <input style={{ ...inputBase, background: "#f8fafc" }} value={projectDraft.projectId || ""} readOnly />
                </div>
                <div style={formGroup}>
                  <label style={label}>Mūsų Nr.</label>
                  <input style={{ ...inputBase, background: "#f8fafc" }} value={executionDraft.orderNumber || ""} readOnly />
                </div>
                <div style={formGroup}>
                  <label style={label}>Projekto tipas</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                    {[
                      { value: "resale_to_carrier", label: "Ekspedijavimas" },
                      { value: "own_transport", label: "Nuosavas transportas" },
                    ].map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        disabled={isWorkflowLocked}
                        onClick={() => updateFormData({ orderType: choice.value })}
                        style={{
                          ...((executionDraft.orderType === choice.value) ? pickerButtonActive : pickerButton),
                          textAlign: "center",
                          opacity: isWorkflowLocked ? 0.8 : 1,
                          cursor: isWorkflowLocked ? "not-allowed" : "pointer",
                        }}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={formGroup}>
                  <label style={label}>Vadybininkas</label>
                  <input style={{ ...inputBase, background: "#f8fafc" }} value={projectDraft.managerName || currentManagerName} readOnly />
                </div>
              </div>
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>2. KLIENTAS</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>Klientas pasirenkamas tik iš bendros bazės.</div>
                </div>
                <button type="button" style={{ ...btnSecondary, fontSize: "13px" }} onClick={() => setShowNewClientModal(true)}>+ Naujas klientas</button>
              </div>
              <div style={formGrid}>
                <div style={{ ...formGroup, gridColumn: "span 2" }}>
                  <label style={label}>Klientas *</label>
                  <input style={{ ...inputBase, marginBottom: "10px" }} value={clientPickerSearch} onChange={(e) => setClientPickerSearch(e.target.value)} placeholder="Ieškoti kliento pagal pavadinimą, kodą, PVM ar email..." />
                  <div style={{ ...pickerGrid, maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                    {filteredClientOptions.map((client) => {
                      const isActive = String(projectDraft.clientId || "") === String(client.id);
                      return (
                        <button key={client.id} type="button" style={isActive ? pickerButtonActive : pickerButton} onClick={() => applySelectedClient(String(client.id))}>
                          <div>{client.name}</div>
                          <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>{client.companyCode || client.vatCode || client.email || "Kliento įrašas"}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={formGroup}>
                  <label style={label}>Kontaktas</label>
                  {selectedClientContacts.length > 0 ? (
                    <div style={pickerGrid}>
                      {selectedClientContacts.map((contact) => {
                        const isActive = (selectedClientContactId || matchedClientContactId) === String(contact.id);
                        return (
                          <button key={contact.id} type="button" style={isActive ? pickerButtonActive : pickerButton} onClick={() => applySelectedClientContact(String(contact.id))}>
                            <div>{contact.name || "Kontaktas"}</div>
                            <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>{contact.email || contact.phone || "Kontaktinė informacija"}</div>
                          </button>
                        );
                      })}
                    </div>
                  ) : <div style={{ padding: "12px", border: "1px dashed #cbd5e1", borderRadius: "10px", color: "#64748b", fontSize: "12px" }}>Kliento kontaktų nėra, naudokite bendrus duomenis.</div>}
                </div>
                <div style={formGroup}>
                  <label style={label}>Kliento užsakymo nr.</label>
                  <input style={inputBase} value={projectDraft.clientOrderNumber || ""} onChange={(e) => updateFormData({ clientOrderNumber: e.target.value })} placeholder="pvz. PO-2026-0042" />
                </div>
                <div style={formGroup}>
                  <label style={label}>Kliento kaina</label>
                  <input style={inputBase} type="number" step="0.01" value={projectDraft.clientPrice || ""} onChange={(e) => updateFormData({ clientPrice: parseFloat(e.target.value) || 0 })} placeholder="1200.00" />
                </div>
              </div>
              {(selectedClient || projectDraft.clientId) && renderEntityHealthBlock({
                title: "Kliento duomenų būsena",
                result: selectedClientHealth || analyzeClientData({
                  name: projectDraft.clientName,
                  companyCode: projectDraft.clientCompanyCode,
                  vatCode: projectDraft.clientVatCode,
                  email: projectDraft.clientEmail,
                  phone: projectDraft.clientPhone,
                  address: projectDraft.clientAddress,
                  contacts: projectDraft.clientContactName || projectDraft.clientContactEmail || projectDraft.clientContactPhone
                    ? [{
                        id: projectDraft.clientContactId || "draft-contact",
                        name: projectDraft.clientContactName,
                        email: projectDraft.clientContactEmail,
                        phone: projectDraft.clientContactPhone,
                      }]
                    : [],
                }),
                onEdit: selectedClient ? () => openEntityEditModal("client") : null,
              })}
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>3. KROVINYS</div>
              <div style={formGrid}>
                <div style={formGroup}><label style={label}>Krovinio tipas</label><input style={inputBase} value={projectDraft.cargoType || projectDraft.cargoName || projectDraft.cargo || ""} onChange={(e) => updateFormData({ cargoType: e.target.value, cargoName: e.target.value, cargo: e.target.value })} placeholder="pvz. Automobiliai" /></div>
                <div style={formGroup}><label style={label}>Kiekis</label><input style={inputBase} value={projectDraft.quantity || projectDraft.vehicleCount || ""} onChange={(e) => updateFormData({ quantity: e.target.value, vehicleCount: e.target.value })} placeholder="pvz. 6 vnt." /></div>
                <div style={formGroup}><label style={label}>LDM</label><input style={inputBase} value={projectDraft.ldm || ""} onChange={(e) => updateFormData({ ldm: e.target.value })} placeholder="pvz. 10.5" /></div>
                <div style={formGroup}><label style={label}>Svoris</label><input style={inputBase} value={projectDraft.weight || ""} onChange={(e) => updateFormData({ weight: e.target.value })} placeholder="pvz. 12500 kg" /></div>
                <div style={formGroup}><label style={label}>Temperatūra</label><input style={inputBase} value={projectDraft.temperature || ""} onChange={(e) => updateFormData({ temperature: e.target.value })} placeholder="pvz. +2 / +8" /></div>
                <div style={formGroup}><label style={label}>Palečių sk.</label><input style={inputBase} value={projectDraft.palletCount || ""} onChange={(e) => updateFormData({ palletCount: e.target.value })} placeholder="pvz. 33" /></div>
                <div style={{ ...formGroup, gridColumn: "1 / -1" }}><label style={label}>Pastabos</label><textarea rows="3" style={inputBase} value={projectDraft.cargoNotes || ""} onChange={(e) => updateFormData({ cargoNotes: e.target.value })} placeholder="Papildoma informacija apie krovinį." /></div>
              </div>
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>4. PAKROVIMAS</div>
              <div style={formGrid}>
                <div style={formGroup}><label style={label}>Data *</label><input style={inputBase} type="date" value={projectDraft.loadingDate || ""} onChange={(e) => updateFormData({ loadingDate: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Laikas</label><input style={inputBase} type="time" value={projectDraft.loadingTime || ""} onChange={(e) => updateFormData({ loadingTime: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Įmonė</label><input style={inputBase} value={projectDraft.loadingCompanyName || ""} onChange={(e) => updateFormData({ loadingCompanyName: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Adresas</label><input style={inputBase} value={projectDraft.loadingStreet || ""} onChange={(e) => updateFormData({ loadingStreet: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Miestas *</label><input style={inputBase} value={projectDraft.loadingCity || ""} onChange={(e) => { const loadingCity = e.target.value; updateFormData({ loadingCity, route: loadingCity && projectDraft.unloadingCity ? `${loadingCity} → ${projectDraft.unloadingCity}` : "" }); }} /></div>
                <div style={formGroup}><label style={label}>Pašto kodas</label><input style={inputBase} value={projectDraft.loadingPostalCode || ""} onChange={(e) => updateFormData({ loadingPostalCode: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Šalis</label><input style={inputBase} value={projectDraft.loadingCountry || ""} onChange={(e) => updateFormData({ loadingCountry: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Kontaktas</label><input style={inputBase} value={projectDraft.loadingContact || ""} onChange={(e) => updateFormData({ loadingContact: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>REF numeris</label><input style={inputBase} value={projectDraft.loadRefLoading || ""} onChange={(e) => updateFormData({ loadRefLoading: e.target.value })} placeholder="pvz. LOAD-001" /></div>
                <div style={{ ...formGroup, gridColumn: "1 / -1" }}><label style={label}>Pastabos</label><textarea rows="2" style={inputBase} value={projectDraft.loadingNotes || ""} onChange={(e) => updateFormData({ loadingNotes: e.target.value })} /></div>
              </div>
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>5. IŠKROVIMAS</div>
              <div style={formGrid}>
                <div style={formGroup}><label style={label}>Data *</label><input style={inputBase} type="date" value={projectDraft.unloadingDate || ""} onChange={(e) => updateFormData({ unloadingDate: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Laikas</label><input style={inputBase} type="time" value={projectDraft.unloadingTime || ""} onChange={(e) => updateFormData({ unloadingTime: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Įmonė</label><input style={inputBase} value={projectDraft.unloadingCompanyName || ""} onChange={(e) => updateFormData({ unloadingCompanyName: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Adresas</label><input style={inputBase} value={projectDraft.unloadingStreet || ""} onChange={(e) => updateFormData({ unloadingStreet: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Miestas *</label><input style={inputBase} value={projectDraft.unloadingCity || ""} onChange={(e) => { const unloadingCity = e.target.value; updateFormData({ unloadingCity, route: projectDraft.loadingCity && unloadingCity ? `${projectDraft.loadingCity} → ${unloadingCity}` : "" }); }} /></div>
                <div style={formGroup}><label style={label}>Pašto kodas</label><input style={inputBase} value={projectDraft.unloadingPostalCode || ""} onChange={(e) => updateFormData({ unloadingPostalCode: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Šalis</label><input style={inputBase} value={projectDraft.unloadingCountry || ""} onChange={(e) => updateFormData({ unloadingCountry: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>Kontaktas</label><input style={inputBase} value={projectDraft.unloadingContact || ""} onChange={(e) => updateFormData({ unloadingContact: e.target.value })} /></div>
                <div style={formGroup}><label style={label}>REF numeris</label><input style={inputBase} value={projectDraft.loadRefUnloading || ""} onChange={(e) => updateFormData({ loadRefUnloading: e.target.value })} placeholder="pvz. UNLOAD-001" /></div>
                <div style={{ ...formGroup, gridColumn: "1 / -1" }}><label style={label}>Pastabos</label><textarea rows="2" style={inputBase} value={projectDraft.unloadingNotes || ""} onChange={(e) => updateFormData({ unloadingNotes: e.target.value })} /></div>
              </div>
              <div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>Maršrutas</label><input style={{ ...inputBase, background: "#f8fafc" }} value={projectDraft.route || ""} readOnly /></div>
            </div>

            <div style={{ padding: "18px", background: "#fff", border: `1px solid ${executionDraft.orderType === "own_transport" ? "#bfdbfe" : "#fdba74"}`, borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>6. VYKDYMAS</div>
              {executionDraft.orderType === "resale_to_carrier" ? (
                <div style={formGrid}>
                  <div style={{ ...formGroup, gridColumn: "span 2" }}>
                    <label style={label}>Vežėjas *</label>
                    <input style={{ ...inputBase, marginBottom: "10px" }} value={carrierPickerSearch} onChange={(e) => setCarrierPickerSearch(e.target.value)} placeholder="Ieškoti vežėjo..." />
                    <div style={{ ...pickerGrid, maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                      {filteredCarrierOptions.map((carrier) => {
                        const isActive = String(executionDraft.carrierId || "") === String(carrier.id);
                        return (
                          <button
                            key={carrier.id}
                            type="button"
                            style={isActive ? pickerButtonActive : pickerButton}
                            onClick={() => {
                              const firstManager = carrier?.managerContacts?.find((contact) => contact.name || contact.email || contact.phone);
                              setSelectedManagerId(firstManager ? String(firstManager.id) : "");
                              updateFormData({
                                carrierId: String(carrier.id),
                                carrierName: carrier.name || "",
                                carrierType: carrier.carrierType || "",
                                carrierCompanyCode: carrier.companyCode || "",
                                carrierVAT: carrier.vatCode || "",
                                carrierPhone: carrier.phone || "",
                                carrierEmail: carrier.email || "",
                                carrierAddress: carrier.address || "",
                                contactName: firstManager?.name || "",
                                contactPhone: firstManager?.phone || "",
                                contactEmail: firstManager?.email || "",
                              });
                            }}
                          >
                            <div>{carrier.name}</div>
                            <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>{carrier.companyCode || carrier.email || carrier.phone || "Vežėjo įrašas"}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={formGroup}><label style={label}>Vežėjo vadybininkas / kontaktas</label><input style={inputBase} value={executionDraft.contactName || ""} onChange={(e) => updateFormData({ contactName: e.target.value })} placeholder="Kontaktinis asmuo" /></div>
                  <div style={formGroup}><label style={label}>Vežėjo vairuotojas</label><input style={inputBase} value={executionDraft.driverName || ""} onChange={(e) => updateFormData({ driverName: e.target.value })} placeholder="Vardas Pavardė" /></div>
                  <div style={formGroup}><label style={label}>Vilkikas</label><input style={{ ...inputBase, textTransform: "uppercase" }} value={executionDraft.truckPlate || ""} onChange={(e) => updateFormData({ truckPlate: e.target.value.toUpperCase() })} placeholder="ABC123" /></div>
                  <div style={formGroup}><label style={label}>Priekaba</label><input style={{ ...inputBase, textTransform: "uppercase" }} value={executionDraft.trailerPlate || ""} onChange={(e) => updateFormData({ trailerPlate: e.target.value.toUpperCase() })} placeholder="TRL501" /></div>
                  <div style={formGroup}><label style={label}>Vežėjo kaina</label><input style={inputBase} type="number" step="0.01" value={executionDraft.carrierPrice || ""} onChange={(e) => updateFormData({ carrierPrice: parseFloat(e.target.value) || 0 })} placeholder="1000.00" /></div>
                </div>
              ) : (
                <div style={formGrid}>
                  <div style={formGroup}><label style={label}>Vairuotojas *</label><input style={inputBase} value={executionDraft.driverName || ""} onChange={(e) => updateFormData({ driverName: e.target.value })} placeholder="Vairuotojas" /></div>
                  <div style={formGroup}><label style={label}>Vilkikas</label><input style={{ ...inputBase, textTransform: "uppercase" }} value={executionDraft.truckPlate || ""} onChange={(e) => updateFormData({ truckPlate: e.target.value.toUpperCase() })} placeholder="ABC123" /></div>
                  <div style={formGroup}><label style={label}>Priekaba</label><input style={{ ...inputBase, textTransform: "uppercase" }} value={executionDraft.trailerPlate || ""} onChange={(e) => updateFormData({ trailerPlate: e.target.value.toUpperCase() })} placeholder="TRL501" /></div>
                  <div style={formGroup}><label style={label}>Savikaina</label><input style={inputBase} type="number" step="0.01" value={executionDraft.executionCost || executionDraft.carrierPrice || ""} onChange={(e) => { const value = parseFloat(e.target.value) || 0; updateFormData({ executionCost: value, carrierPrice: value }); }} placeholder="850.00" /></div>
                </div>
              )}
              {executionDraft.orderType === "resale_to_carrier" && (selectedCarrier || executionDraft.carrierId) && (
                <>
                  {renderEntityHealthBlock({
                    title: "Vežėjo duomenų būsena",
                    result: selectedCarrierHealth || analyzeCarrierData({
                      name: executionDraft.carrierName,
                      companyCode: executionDraft.carrierCompanyCode,
                      vatCode: executionDraft.carrierVAT,
                      email: executionDraft.carrierEmail,
                      phone: executionDraft.carrierPhone,
                      address: executionDraft.carrierAddress,
                      managerContacts: executionDraft.contactName || executionDraft.contactEmail || executionDraft.contactPhone
                        ? [{
                            id: "draft-manager",
                            name: executionDraft.contactName,
                            email: executionDraft.contactEmail,
                            phone: executionDraft.contactPhone,
                          }]
                        : [],
                      documents: selectedCarrier?.documents || [],
                    }),
                    criticalPrefix: "Kritinė problema",
                    onEdit: selectedCarrier ? () => openEntityEditModal("carrier") : null,
                    extraActions: selectedCarrier ? (
                      <button type="button" style={{ ...btn, background: "#b91c1c", fontSize: "12px", padding: "7px 14px" }} onClick={() => openEntityEditModal("carrier")}>
                        Atidaryti vežėjo profilį
                      </button>
                    ) : null,
                  })}
                  {isCarrierDocumentBlocked && (
                    <div style={{ ...dataStatusCardBase, background: "#991b1b", borderColor: "#fca5a5", color: "#fff" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "8px" }}>Pirmiausia atnaujinkite vežėjo dokumentus prieš generuojant užsakymą.</div>
                      <div style={{ fontSize: "13px", lineHeight: 1.6 }}>{carrierBlockingReasons.join(", ")}</div>
                    </div>
                  )}
                </>
              )}
              {executionDraft.orderType === "own_transport" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(220px, 1fr))", gap: "12px", marginTop: "14px" }}>
                  {renderEntityHealthBlock({
                    title: "Vairuotojo duomenys",
                    result: selectedDriverHealth || analyzeDriverData({ name: executionDraft.driverName }),
                    onEdit: (selectedDriverRecord || executionDraft.driverName) ? () => openEntityEditModal("driver") : null,
                  })}
                  {renderEntityHealthBlock({
                    title: "Vilkiko duomenys",
                    result: selectedTruckHealth || analyzeTruckData({ licensePlate: executionDraft.truckPlate }),
                    onEdit: (selectedTruckRecord || executionDraft.truckPlate) ? () => openEntityEditModal("truck") : null,
                  })}
                  {renderEntityHealthBlock({
                    title: "Priekabos duomenys",
                    result: selectedTrailerHealth || analyzeTrailerData({ licensePlate: executionDraft.trailerPlate }),
                    onEdit: (selectedTrailerRecord || executionDraft.trailerPlate) ? () => openEntityEditModal("trailer") : null,
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>7. FINANSAI</div>
              <div style={formGrid}>
                <div style={formGroup}><label style={label}>Kliento kaina</label><input style={inputBase} type="number" step="0.01" value={projectDraft.clientPrice || ""} onChange={(e) => updateFormData({ clientPrice: parseFloat(e.target.value) || 0 })} /></div>
                <div style={formGroup}><label style={label}>{executionCostLabel}</label><input style={inputBase} type="number" step="0.01" value={executionDraft.orderType === "own_transport" ? (executionDraft.executionCost || executionDraft.carrierPrice || "") : (executionDraft.carrierPrice || "")} onChange={(e) => { const value = parseFloat(e.target.value) || 0; updateFormData(executionDraft.orderType === "own_transport" ? { executionCost: value, carrierPrice: value } : { carrierPrice: value }); }} /></div>
                <div style={formGroup}><label style={label}>PVM režimas</label><select style={inputBase} value={vatModeValue} onChange={(e) => { const newValue = e.target.options[e.target.selectedIndex].value; console.log('🔴 PVM select onChange:', newValue); updateFormData({ vatMode: newValue, carrierPriceWithVAT: newValue === "with_vat" }); }}><option value="without_vat">Be PVM</option><option value="with_vat">Su PVM</option></select></div>
                <div style={formGroup}><label style={label}>Automatinis pelnas</label><div style={{ ...inputBase, background: currentProfit >= 0 ? "#ecfdf5" : "#fef2f2", color: currentProfit >= 0 ? "#166534" : "#991b1b", fontWeight: 700 }}>{currentProfit.toFixed(2)} EUR</div></div>
              </div>
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>8. DOKUMENTAI</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px", lineHeight: 1.55 }}>
                CMR ir kiti vykdymo dokumentai čia yra neprivalomi kuriant naują krovinį. Jie paprastai keliami po vykdymo arba vėlesniame etape.
              </div>
              <div style={formGrid}>
                <div style={formGroup}><label style={label}>CMR (po vykdymo, optional)</label><input style={inputBase} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const dataUrl = await readFileAsDataUrl(file); updateFormData({ documents: { ...(projectDraft.documents || {}), cmr: dataUrl } }); }} /></div>
                <div style={formGroup}><label style={label}>Kiti vykdymo dokumentai (optional)</label><input style={inputBase} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const dataUrl = await readFileAsDataUrl(file); updateFormData({ documents: { ...(projectDraft.documents || {}), pod: dataUrl } }); }} /></div>
                <div style={formGroup}><label style={label}>Preview</label><button type="button" style={{ ...btn, background: "#7c3aed" }} onClick={openPreviewFromDrafts}>Atidaryti preview</button></div>
                <div style={formGroup}><label style={label}>Originalai reikalingi</label><select style={inputBase} value={originalsRequiredValue} onChange={(e) => updateFormData({ originalsRequired: e.target.value })}><option value="not_required">Nereikalingi</option><option value="required">Reikalingi</option></select></div>
              </div>
            </div>

            <div style={{ padding: "18px", background: "#fff", border: "1px solid #dbeafe", borderRadius: "14px" }}>
              <div style={{ marginBottom: "14px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>9. PASTABOS</div>
              <div style={formGrid}>
                <div style={{ ...formGroup, gridColumn: "1 / -1" }}><label style={label}>Vidinės pastabos</label><textarea rows="3" style={inputBase} value={projectDraft.internalNotes || projectDraft.notes || ""} onChange={(e) => updateFormData({ internalNotes: e.target.value, notes: e.target.value })} placeholder="Vidinės komandos pastabos." /></div>
                <div style={{ ...formGroup, gridColumn: "1 / -1" }}><label style={label}>{executionDraft.orderType === "own_transport" ? "Instrukcijos vairuotojui" : "Instrukcijos vežėjui"}</label><textarea rows="3" style={inputBase} value={executionDraft.instructions || ""} onChange={(e) => updateFormData({ instructions: e.target.value })} placeholder="Instrukcijos vykdytojui." /></div>
              </div>
            </div>
          </div>

          <div style={{ display: "none" }}>

          {executionDraft.orderType === "resale_to_carrier" && (
            <div style={{ marginBottom: "20px", padding: "16px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#9a3412", marginBottom: "8px" }}>Dokumento siuntėjas visada yra mūsų įmonė</div>
              <div style={{ fontSize: "13px", color: "#7c2d12", lineHeight: 1.55, marginBottom: "10px" }}>
                Vežėjui generuojamas užsakymas formuojamas tarp <strong>{companyProfile.name || "įmonės iš nustatymų"}</strong> ir pasirinkto vežėjo.
                Projekto klientas yra atskiras projekto dalies objektas.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(160px, 1fr))", gap: "10px" }}>
                <div style={observerMiniStat}>Įmonė: {companyProfile.name || "—"}</div>
                <div style={observerMiniStat}>Kodas: {companyProfile.code || "—"}</div>
                <div style={observerMiniStat}>PVM: {companyProfile.vat || "—"}</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "4px", marginBottom: "10px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>
            A. Projekto / kliento dalis
          </div>
          <div style={{ padding: "18px", background: "#ffffff", border: "1px solid #dbeafe", borderRadius: "14px", marginBottom: "18px" }}>
            <div style={formGrid}>
              <div style={{ ...formGroup, gridColumn: "span 2" }}>
                <label style={label}>Klientas (užsakovas) *</label>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                  Pirmiausia ieškokite kliento bendroje bazėje. Jei įrašo nėra, vėliau pridėsime quick-add tame pačiame workflow.
                </div>
                <input
                  style={{ ...inputBase, marginTop: "8px" }}
                  value={clientPickerSearch}
                  onChange={(e) => setClientPickerSearch(e.target.value)}
                  placeholder="Ieškoti kliento pagal pavadinimą, kodą, PVM ar email..."
                />
                <div style={{ ...pickerGrid, maxHeight: "180px", overflowY: "auto", paddingRight: "4px", marginTop: "10px" }}>
                  {filteredClientOptions.map((client) => {
                    const isActive = String(projectDraft.clientId || "") === String(client.id);
                    return (
                      <button
                        key={client.id}
                        type="button"
                        style={isActive ? pickerButtonActive : pickerButton}
                        onClick={() => applySelectedClient(String(client.id))}
                      >
                        <div>{client.name}</div>
                        <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>
                          {client.companyCode || client.vatCode || client.email || "Kliento įrašas"}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {filteredClientOptions.length === 0 && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                    Pagal paiešką klientų nerasta.
                  </div>
                )}
              </div>
              <div style={formGroup}>
                <label style={label}>Kliento užsakymo numeris</label>
                <input style={inputBase} value={projectDraft.clientOrderNumber || ""} onChange={(e) => updateFormData({ clientOrderNumber: e.target.value })} placeholder="pvz. PO-2026-0042" />
              </div>
              <div style={formGroup}>
                <label style={label}>Kliento kaina (EUR) *</label>
                <input style={inputBase} type="number" step="0.01" required value={projectDraft.clientPrice || ""} onChange={(e) => updateFormData({ clientPrice: parseFloat(e.target.value) || 0 })} placeholder="1200.00" />
              </div>
            </div>

            {(projectDraft.clientId || projectDraft.clientName) && (
              <div style={{ marginTop: "14px", padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "12px", color: "#475569", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                  Pasirinktas projekto klientas: {projectDraft.clientName || selectedClient?.name || "—"}
                </div>
                {(projectDraft.clientCompanyCode || selectedClient?.companyCode) ? <div>Įmonės kodas: {projectDraft.clientCompanyCode || selectedClient?.companyCode}</div> : null}
                {(projectDraft.clientVatCode || selectedClient?.vatCode) ? <div>PVM kodas: {projectDraft.clientVatCode || selectedClient?.vatCode}</div> : null}
                {(projectDraft.clientEmail || selectedClient?.email) ? <div>El. paštas: {projectDraft.clientEmail || selectedClient?.email}</div> : null}
                {(projectDraft.clientPhone || selectedClient?.phone) ? <div>Telefonas: {projectDraft.clientPhone || selectedClient?.phone}</div> : null}
                {(projectDraft.clientAddress || selectedClient?.address) ? <div>Adresas: {projectDraft.clientAddress || selectedClient?.address}</div> : null}
              </div>
            )}
          </div>

          <div style={{ marginTop: "8px", marginBottom: "10px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>
            B. Vykdymo dalis
          </div>

          {executionDraft.orderType === "resale_to_carrier" && (
            <>
              <div style={{ marginBottom: "12px", padding: "14px 16px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "10px", color: "#9a3412", fontSize: "13px", lineHeight: 1.5 }}>
                Šiame režime projektą vykdo išorinis vežėjas arba subrangovas. Žemiau pildoma tik vežėjo vykdymo informacija ir komercinės sąlygos.
              </div>
              <div style={{ ...formGrid, marginTop: "16px", padding: "18px", background: "#ffffff", border: "1px solid #fed7aa", borderRadius: "14px" }}>
                <div style={formGroup}>
                  <label style={label}>Vežėjas (vykdytojas) *</label>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                    Rodomi tik išoriniai vežėjai. Spauskite vežėją iš sąrašo.
                  </div>
                  <input
                    style={{ ...inputBase, marginTop: "8px" }}
                    value={carrierPickerSearch}
                    onChange={(e) => setCarrierPickerSearch(e.target.value)}
                    placeholder="Ieškoti vežėjo pagal pavadinimą, kodą, PVM, email ar telefoną..."
                  />
                  <div style={{ ...pickerGrid, maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                    {filteredCarrierOptions.map((c) => {
                        const isActive = String(executionDraft.carrierId || "") === String(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            style={isActive ? pickerButtonActive : pickerButton}
                            onClick={() => {
                              const mgr = c?.managerContacts?.[0];
                              setQuickAdd(null);
                              setSelectedManagerId("");
                              setSelectedTruckId("");
                              setSelectedTrailerId("");
                              setSelectedDriverId("");
                              updateFormData({
                                carrierId: String(c.id),
                                carrierName: c?.name || "",
                                carrierType: c?.carrierType || "",
                                carrierCompanyCode: c?.companyCode || "",
                                carrierVAT: c?.vatCode || "",
                                carrierPhone: c?.phone || "",
                                carrierEmail: c?.email || "",
                                carrierAddress: c?.address || "",
                                contactName: mgr?.name || "",
                                contactPhone: mgr?.phone || "",
                                contactEmail: mgr?.email || "",
                                driverName: "",
                                truckPlate: "",
                                trailerPlate: ""
                              });
                              setFormActionMessage(c?.name ? `Pasirinktas vežėjas: ${c.name}` : "");
                            }}
                          >
                            <div>{c.name} 🚛</div>
                            <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>
                              {c.companyCode || c.email || c.phone || "Vežėjo įrašas"}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                  {filteredCarrierOptions.length === 0 && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                      Pagal paiešką vežėjų nerasta.
                    </div>
                  )}
                  {(executionDraft.carrierId || executionDraft.carrierName) && (
                    <div style={{ marginTop: "8px", padding: "10px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", color: "#475569", lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>
                        Pasirinktas vežėjas: {executionDraft.carrierName || selectedCarrier?.name || "—"}
                      </div>
                      {(executionDraft.carrierCompanyCode || selectedCarrier?.companyCode) ? <div>Įmonės kodas: {executionDraft.carrierCompanyCode || selectedCarrier?.companyCode}</div> : null}
                      {(executionDraft.carrierEmail || selectedCarrier?.email) ? <div>El. paštas: {executionDraft.carrierEmail || selectedCarrier?.email}</div> : null}
                      {(executionDraft.carrierPhone || selectedCarrier?.phone) ? <div>Telefonas: {executionDraft.carrierPhone || selectedCarrier?.phone}</div> : null}
                      {(executionDraft.carrierAddress || selectedCarrier?.address) ? <div>Adresas: {executionDraft.carrierAddress || selectedCarrier?.address}</div> : null}
                    </div>
                  )}
                </div>
                <div style={formGroup}>
                  <label style={label}>Vadybininkas</label>
                  {selectedCarrierManagers.length > 0 ? (
                    <div style={pickerGrid}>
                      {selectedCarrierManagers.map((m) => {
                        const isActive = (selectedManagerId || matchedManagerId) === String(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            style={isActive ? pickerButtonActive : pickerButton}
                            onClick={() => {
                              setSelectedManagerId(String(m.id));
                              updateFormData({ contactName: m.name || "", contactPhone: m.phone || "", contactEmail: m.email || "" });
                            }}
                          >
                            <div>{m.name || "Be vardo"}</div>
                            <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>
                              {m.position || m.email || m.phone || "Vadybininkas"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {executionDraft.carrierId && selectedCarrierManagers.length === 0 && !quickAdd?.type && (
                    <div style={{ marginTop: "8px", padding: "10px 12px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", fontSize: "12px", color: "#92400e", lineHeight: 1.45 }}>
                      Šiam vežėjui vadybininkų sąrašo nėra. Kontaktus galite įvesti ranka žemiau arba pridėti naują vadybininką.
                    </div>
                  )}
                  {executionDraft.carrierId && (
                    <button
                      type="button"
                      style={{ ...btnSecondary, marginTop: "8px", fontSize: "12px", padding: "6px 12px" }}
                      onClick={() => {
                        setSelectedManagerId("");
                        setQuickAdd({ type: "manager", fields: { name: "", phone: "", email: "", position: "" } });
                      }}
                    >
                      + Pridėti naują vadybininką
                    </button>
                  )}
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
                    <input style={inputBase} value={executionDraft.contactName || ""} onChange={(e) => { setSelectedManagerId(""); updateFormData({ contactName: e.target.value }); }} placeholder="Jonas Jonaitis" />
                  </div>
                  <div>
                    <label style={label}>Vadybininko tel.</label>
                    <input style={inputBase} value={executionDraft.contactPhone || ""} onChange={(e) => { setSelectedManagerId(""); updateFormData({ contactPhone: e.target.value }); }} placeholder="+370 600 00000" />
                  </div>
                  <div>
                    <label style={label}>Vadybininko el. paštas</label>
                    <input style={inputBase} value={executionDraft.contactEmail || ""} onChange={(e) => { setSelectedManagerId(""); updateFormData({ contactEmail: e.target.value }); }} placeholder="jonas@carrier.lt" />
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
                      value={executionDraft.carrierPrice || ""}
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
                      {/* DUPLICATE CONTROL COMMENTED OUT — select at line ~4631 is the single source
                      <input
                        type="checkbox"
                        checked={vatModeValue === "with_vat"}
                        onChange={(e) => updateFormData({ vatMode: e.target.checked ? "with_vat" : "without_vat", carrierPriceWithVAT: e.target.checked })}
                      />
                      */}
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
                    value={executionDraft.paymentTerm || "14 dienų"}
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
                    {/* DUPLICATE CONTROL COMMENTED OUT — select at line ~4645 is the single source
                    <input
                      type="checkbox"
                      checked={originalsRequiredValue === "required"}
                      onChange={(e) => updateFormData({ originalsRequired: e.target.checked ? "required" : "not_required" })}
                    />
                    */}
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      Originalūs dokumentai reikalingi
                    </span>
                  </label>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px", marginLeft: "24px" }}>
                    CMR su pasirašymais turi būti pateikti originalūs
                  </div>
                </div>
              </div>
              {projectDraft.clientPrice > 0 && executionDraft.carrierPrice > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "16px",
                    background: currentProfit < 0 ? "#fee2e2" : "#d1fae5",
                    border: `2px solid ${
                      currentProfit < 0 ? "#ef4444" : "#10b981"
                    }`,
                    borderRadius: "8px"
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>
                    💰 PELNAS: {currentProfit.toFixed(2)} EUR
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Marža: {currentMargin.toFixed(2)}%
                  </div>
                  {currentProfit < 0 && (
                    <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                      ⚠️ DĖMESIO: Neigiamas pelnas!
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {executionDraft.orderType === "own_transport" && (
            <div style={{ marginTop: "12px", marginBottom: "12px", padding: "14px 16px", background: "#ecfdf5", border: "1px solid #86efac", borderRadius: "10px", color: "#166534", fontSize: "13px", lineHeight: 1.5 }}>
              Šiame režime projektą vykdo nuosavas transportas. Vežėjo blokas nenaudojamas, o žemiau pildoma mūsų fleet, vairuotojo ir vidaus vykdymo informacija.
            </div>
          )}
          {executionDraft.orderType === "own_transport" && !ownFleetCarrier && (
            <div style={{ marginTop: "12px", marginBottom: "12px", padding: "14px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", color: "#991b1b", fontSize: "13px", lineHeight: 1.5 }}>
              Nuosavo transporto įrašas bendroje vežėjų bazėje dar nerastas. Kad fleet pasirinkimai veiktų pilnai, bendroje bazėje turi būti mūsų įmonės transporto kortelė su `isOwnCompany`.
            </div>
          )}
          <div style={{ marginTop: "20px", marginBottom: "10px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>
            C. Krovinys ir maršrutas
          </div>
          <div style={{ marginTop: "16px" }}>
            <h4 style={sectionTitle}>🚚 Krovinio informacija</h4>
            <div style={formGrid}><div style={formGroup}><label style={label}>Krovinio tipas *</label><select style={inputBase} required value={projectDraft.cargoType || ""} onChange={(e) => { const value = e.target.value; value !== "custom" ? updateFormData({ cargoType: value, cargo: value }) : updateFormData({ cargoType: value }); }}><option value="">Pasirinkite...</option><option value="Automobiliai">🚗 Automobiliai</option><option value="Neutralus krovinys">📦 Neutralus krovinys</option><option value="custom">✨ Kitas (įvesti rankiniu būdu)</option></select></div>{projectDraft.cargoType === "custom" && <div style={formGroup}><label style={label}>Krovinio pavadinimas *</label><input style={inputBase} required value={projectDraft.cargo || ""} placeholder="pvz. Baldai, Padangos..." onChange={(e) => updateFormData({ cargo: e.target.value })} /></div>}<div style={formGroup}><label style={label}>Automobilių skaičius</label><select style={inputBase} value={projectDraft.vehicleCount || "1"} onChange={(e) => updateFormData({ vehicleCount: e.target.value })}>{[1,2,3,4,5,6,7,8,9,10].map((num) => <option key={num} value={String(num)}>{num} vnt.</option>)}</select></div><div style={formGroup}><label style={label}>VIN numeriai (nebūtina)</label><textarea rows="3" style={{ ...inputBase, fontFamily: "monospace", fontSize: "11px" }} value={projectDraft.vinNumbers || ""} placeholder="Įveskite VIN numerius, kiekvienas naujoje eilutėje" onChange={(e) => updateFormData({ vinNumbers: e.target.value })} /></div></div>
            <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}><h5 style={{ marginBottom: "12px", color: "#1e3a8a", fontSize: "14px" }}>📨 Pakrovimo vieta (Siuntėjas)</h5><div style={formGrid}><div style={formGroup}><label style={label}>Įmonės pavadinimas</label><input style={inputBase} value={projectDraft.loadingCompanyName || ""} placeholder="pvz. BMW AG" onChange={(e) => updateFormData({ loadingCompanyName: e.target.value })} /></div><div style={formGroup}><label style={label}>Miestas *</label><input style={inputBase} required value={projectDraft.loadingCity || ""} placeholder="pvz. Hamburg" onChange={(e) => { const loadingCity = e.target.value; updateFormData({ loadingCity, route: loadingCity && projectDraft.unloadingCity ? `${loadingCity} → ${projectDraft.unloadingCity}` : projectDraft.route }); }} /></div><div style={formGroup}><label style={label}>Gatvė ir nr.</label><input style={inputBase} value={projectDraft.loadingStreet || ""} placeholder="pvz. Hauptstraße 123" onChange={(e) => updateFormData({ loadingStreet: e.target.value })} /></div><div style={formGroup}><label style={label}>Pašto kodas</label><input style={inputBase} value={projectDraft.loadingPostalCode || ""} placeholder="pvz. 20095" onChange={(e) => updateFormData({ loadingPostalCode: e.target.value })} /></div><div style={formGroup}><label style={label}>Koordinatės (nebūtina)</label><input style={inputBase} value={projectDraft.loadingCoordinates || ""} placeholder="pvz. 53.551086, 9.993682" onChange={(e) => updateFormData({ loadingCoordinates: e.target.value })} /></div></div></div>
            <div style={{ marginTop: "12px", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}><h5 style={{ marginBottom: "12px", color: "#1e3a8a", fontSize: "14px" }}>📨 Iškrovimo vieta (Gavėjas)</h5><div style={formGrid}><div style={formGroup}><label style={label}>Įmonės pavadinimas</label><input style={inputBase} value={projectDraft.unloadingCompanyName || ""} placeholder="pvz. UAB Automobiliai" onChange={(e) => updateFormData({ unloadingCompanyName: e.target.value })} /></div><div style={formGroup}><label style={label}>Miestas *</label><input style={inputBase} required value={projectDraft.unloadingCity || ""} placeholder="pvz. Vilnius" onChange={(e) => { const unloadingCity = e.target.value; updateFormData({ unloadingCity, route: projectDraft.loadingCity && unloadingCity ? `${projectDraft.loadingCity} → ${unloadingCity}` : projectDraft.route }); }} /></div><div style={formGroup}><label style={label}>Gatvė ir nr.</label><input style={inputBase} value={projectDraft.unloadingStreet || ""} placeholder="pvz. Gedimino pr. 1" onChange={(e) => updateFormData({ unloadingStreet: e.target.value })} /></div><div style={formGroup}><label style={label}>Pašto kodas</label><input style={inputBase} value={projectDraft.unloadingPostalCode || ""} placeholder="pvz. 01103" onChange={(e) => updateFormData({ unloadingPostalCode: e.target.value })} /></div><div style={formGroup}><label style={label}>Koordinatės (nebūtina)</label><input style={inputBase} value={projectDraft.unloadingCoordinates || ""} placeholder="pvz. 54.687157, 25.279652" onChange={(e) => updateFormData({ unloadingCoordinates: e.target.value })} /></div></div></div>
            <div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>Maršrutas (auto-generuojamas)</label><input style={{ ...inputBase, background: "#f8fafc", cursor: "not-allowed" }} value={projectDraft.route || ""} placeholder="Užpildykite adresus - maršrutas sugeneruosis automatiškai" readOnly /></div>
          </div>
          {executionDraft.orderType === "own_transport" && (
          <div style={{ marginTop: "20px" }}>
            <h4 style={sectionTitle}>🚛 Nuosavo transporto vykdymas</h4>
            <div style={formGrid}>
              {/* Truck */}
              <div style={formGroup}>
                <label style={label}>Vilkikas (valst. nr.)</label>
                {selectedExecutionTrucks.length > 0 && (
                  <div style={pickerGrid}>
                    {selectedExecutionTrucks.map((t) => {
                      const isActive = (selectedTruckId || matchedTruckId) === String(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          style={isActive ? pickerButtonActive : pickerButton}
                          onClick={() => {
                            setSelectedTruckId(String(t.id));
                            updateFormData({ truckPlate: String(t.licensePlate || "").toUpperCase() });
                          }}
                        >
                          <div>{t.licensePlate || "Be numerio"}</div>
                          <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>
                            {t.model || "Vilkikas"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <input style={{ ...inputBase, textTransform: "uppercase" }} value={executionDraft.truckPlate || ""} placeholder="pvz. ABC123" onChange={(e) => { setSelectedTruckId(""); updateFormData({ truckPlate: e.target.value.toUpperCase() }); }} />
                {ownFleetCarrier && selectedExecutionTrucks.length === 0 && (
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
                {selectedExecutionTrailers.length > 0 && (
                  <div style={pickerGrid}>
                    {selectedExecutionTrailers.map((t) => {
                      const isActive = (selectedTrailerId || matchedTrailerId) === String(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          style={isActive ? pickerButtonActive : pickerButton}
                          onClick={() => {
                            setSelectedTrailerId(String(t.id));
                            updateFormData({ trailerPlate: String(t.licensePlate || "").toUpperCase() });
                          }}
                        >
                          <div>{t.licensePlate || "Be numerio"}</div>
                          <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>
                            {t.model || "Priekaba"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <input style={{ ...inputBase, textTransform: "uppercase" }} value={executionDraft.trailerPlate || ""} placeholder="pvz. XYZ789" onChange={(e) => { setSelectedTrailerId(""); updateFormData({ trailerPlate: e.target.value.toUpperCase() }); }} />
                {ownFleetCarrier && selectedExecutionTrailers.length === 0 && (
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
                {selectedExecutionDrivers.length > 0 && (
                  <div style={pickerGrid}>
                    {selectedExecutionDrivers.map((d) => {
                      const isActive = (selectedDriverId || matchedDriverId) === String(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          style={isActive ? pickerButtonActive : pickerButton}
                          onClick={() => {
                            setSelectedDriverId(String(d.id));
                            updateFormData({ driverName: d.name || "" });
                          }}
                        >
                          <div>{d.name || "Be vardo"}</div>
                          <div style={{ fontSize: "11px", color: isActive ? "#1d4ed8" : "#64748b", marginTop: "4px" }}>
                            {d.phone || d.licenseNumber || "Vairuotojas"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <input style={inputBase} value={executionDraft.driverName || ""} placeholder="pvz. Jonas Jonaitis" onChange={(e) => { setSelectedDriverId(""); updateFormData({ driverName: e.target.value }); }} />
                {ownFleetCarrier && selectedExecutionDrivers.length === 0 && (
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
          )}
          <div style={{ marginTop: "20px", marginBottom: "10px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>
            D. Datos ir vykdymo instrukcijos
          </div>
          <div style={{ marginTop: "16px" }}><h4 style={sectionTitle}>📅 Datos</h4><div style={formGrid}><div style={formGroup}><label style={label}>Pakrovimo data *</label><input style={inputBase} type="date" required value={projectDraft.loadingDate || ""} onChange={(e) => updateFormData({ loadingDate: e.target.value })} /></div><div style={formGroup}><label style={label}>Iškrovimo data *</label><input style={inputBase} type="date" required value={projectDraft.unloadingDate || ""} onChange={(e) => updateFormData({ unloadingDate: e.target.value })} /></div></div>{projectDraft.loadingDate && projectDraft.unloadingDate && (() => { const start = new Date(projectDraft.loadingDate); const end = new Date(projectDraft.unloadingDate); const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)); return <div style={{ marginTop: "8px", padding: "12px", background: days >= 0 ? "#eff6ff" : "#fee2e2", border: `1px solid ${days >= 0 ? "#3b82f6" : "#ef4444"}`, borderRadius: "6px", fontSize: "13px" }}>{days >= 0 ? <>ℹ️ Trukmė: <strong>{days} {days === 1 ? "diena" : days < 10 ? "dienos" : "dienų"}</strong></> : <span style={{ color: "#dc2626" }}>⚠️ Iškrovimo data ankstesnė už pakrovimo!</span>}</div>; })()}</div>
          <div style={{ marginTop: "16px" }}><h4 style={sectionTitle}>📋 Papildoma informacija</h4><div style={formGrid}><div style={formGroup}><label style={label}>Load/Ref numeris (pakrovimui)</label><input style={inputBase} value={projectDraft.loadRefLoading || ""} placeholder="pvz. LRN-2024-001" onChange={(e) => updateFormData({ loadRefLoading: e.target.value })} /></div><div style={formGroup}><label style={label}>Load/Ref numeris (iškrovimui)</label><input style={inputBase} value={projectDraft.loadRefUnloading || ""} placeholder="pvz. DLV-2024-001" onChange={(e) => updateFormData({ loadRefUnloading: e.target.value })} /></div></div><div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>VIN numeriai automobilių (atskirti kableliais)</label><textarea rows="2" style={{ ...inputBase, fontFamily: "monospace", fontSize: "12px" }} value={projectDraft.vinNumbers || ""} placeholder="pvz. WBA1234567890ABCD, WBA9876543210EFGH, ..." onChange={(e) => updateFormData({ vinNumbers: e.target.value })} /></div><div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>{executionDraft.orderType === "own_transport" ? "Instrukcijos vairuotojui" : "Instrukcijos vežėjui"}</label><textarea rows="3" style={inputBase} value={executionDraft.instructions || ""} placeholder="pvz. Skambinti prieš 1h iki pakrovimo. Automobiliai turi būti dengti..." onChange={(e) => updateFormData({ instructions: e.target.value })} /></div><div style={{ ...formGrid, marginTop: "12px" }}><div style={formGroup}><label style={label}>Originalūs dokumentai</label><select style={inputBase} value={originalsRequiredValue} onChange={(e) => updateFormData({ originalsRequired: e.target.value })}><option value="not_required">Nereikalingi</option><option value="required">Reikalingi</option></select></div><div style={formGroup}><label style={label}>Statusas</label><select style={inputBase} value={executionDraft.status || "new"} onChange={(e) => updateFormData({ status: e.target.value })}>{Object.entries(STATUS_MAP).filter(([k]) => !["active","draft","generated"].includes(k)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div></div><div style={{ ...formGroup, marginTop: "12px" }}><label style={label}>Pastabos</label><textarea rows="2" style={inputBase} value={projectDraft.notes || ""} placeholder="Papildomos pastabos..." onChange={(e) => updateFormData({ notes: e.target.value })} /></div></div>
          {executionDraft.orderType === "resale_to_carrier" && executionDraft.carrierId && <div style={{ marginTop: "16px" }}><label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}><input type="checkbox" checked={executionDraft.sendToCarrier !== false} onChange={(e) => updateFormData({ sendToCarrier: e.target.checked })} />📧 Siųsti orderį vežėjui el. paštu</label></div>}

          <div style={{ marginTop: "20px", marginBottom: "10px", fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>
            E. Dokumentai ir veiksmai
          </div>
          </div>

          {Array.isArray(settings?.templates) && settings.templates.length > 0 && (
            <div style={{ marginTop: "20px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <label style={{ ...label, marginBottom: "10px", display: "block" }}>📄 Generuoti dokumentą iš šablono</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  style={{ ...inputBase, flex: 1, minWidth: "200px" }}
                  value={executionDraft._selectedTemplateId || ""}
                  onChange={(e) => updateFormData({ _selectedTemplateId: e.target.value })}
                >
                  <option value="">Pasirinkite šabloną...</option>
                  {settings.templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}{t.isDefault ? " ★" : ""}</option>
                  ))}
                </select>
                <button
                  type="button"
                  style={{ ...btn, background: isCarrierDocumentBlocked ? "#94a3b8" : "#7c3aed", whiteSpace: "nowrap", cursor: isCarrierDocumentBlocked ? "not-allowed" : "pointer" }}
                  onClick={openPreviewFromDrafts}
                  disabled={isCarrierDocumentBlocked}
                >
                  📄 Generuoti dokumentą
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Užsakymą galima išsaugoti tiesiai iš formos apačios arba prieš tai sugeneruoti dokumento peržiūrą.
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" style={btnSecondary} onClick={onClose}>Atšaukti</button>
              <button type="button" style={{ ...btnSecondary, borderColor: "#cbd5e1", color: "#1e3a8a" }} onClick={() => saveOrderAsDraft("draft")}>📝 Išsaugoti juodraštį</button>
              <button type="button" style={{ ...btn, background: isCarrierDocumentBlocked ? "#94a3b8" : "#7c3aed", cursor: isCarrierDocumentBlocked ? "not-allowed" : "pointer" }} onClick={openPreviewFromDrafts} disabled={isCarrierDocumentBlocked}>📄 Generuoti dokumentą</button>
              <button type="button" style={{ ...btnSuccess, minWidth: "170px", opacity: isCarrierDocumentBlocked ? 0.7 : 1, cursor: isCarrierDocumentBlocked ? "not-allowed" : "pointer" }} onClick={saveToDb} disabled={isCarrierDocumentBlocked}>💾 {saveButtonLabel}</button>
            </div>
          </div>
          {formActionMessage ? (
            <div style={{ marginTop: "12px", padding: "10px 12px", background: "#ecfdf5", border: "1px solid #86efac", borderRadius: "8px", color: "#166534", fontSize: "13px", fontWeight: 600 }}>
              {formActionMessage}
            </div>
          ) : null}
        </form>
      </div>
    </div>

    {showNewClientModal && (
      <div style={modalOverlay} onClick={() => setShowNewClientModal(false)}>
        <div style={{ ...modal, maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeader}>
            <h3 style={{ margin: 0, color: "#1e3a8a" }}>Naujas klientas</h3>
            <button type="button" style={closeBtn} onClick={() => setShowNewClientModal(false)}>×</button>
          </div>
          <div style={formGrid}>
            <div style={formGroup}><label style={label}>Pavadinimas *</label><input style={inputBase} value={newClientDraft.name} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, name: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>Įmonės kodas</label><input style={inputBase} value={newClientDraft.companyCode} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, companyCode: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>PVM kodas</label><input style={inputBase} value={newClientDraft.vatCode} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, vatCode: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>El. paštas</label><input style={inputBase} value={newClientDraft.email} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, email: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>Telefonas</label><input style={inputBase} value={newClientDraft.phone} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, phone: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>Adresas</label><input style={inputBase} value={newClientDraft.address} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, address: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>Kontaktinis asmuo</label><input style={inputBase} value={newClientDraft.contactName} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, contactName: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>Kontaktinis el. paštas</label><input style={inputBase} value={newClientDraft.contactEmail} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, contactEmail: e.target.value }))} /></div>
            <div style={formGroup}><label style={label}>Kontaktinis telefonas</label><input style={inputBase} value={newClientDraft.contactPhone} onChange={(e) => setNewClientDraft((prev) => ({ ...prev, contactPhone: e.target.value }))} /></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" style={btnSecondary} onClick={() => setShowNewClientModal(false)}>Atšaukti</button>
            <button type="button" style={btnSuccess} onClick={saveNewClientIntoBase}>Išsaugoti klientą</button>
          </div>
        </div>
      </div>
    )}

    {entityEditModal && (
      <div style={modalOverlay} onClick={() => setEntityEditModal(null)}>
        <div style={{ ...modal, maxWidth: "760px" }} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeader}>
            <h3 style={{ margin: 0, color: "#1e3a8a" }}>Papildyti duomenis</h3>
            <button type="button" style={closeBtn} onClick={() => setEntityEditModal(null)}>×</button>
          </div>

          {entityEditModal.entityType === "client" && (
            <div style={formGrid}>
              <div style={formGroup}><label style={label}>Pavadinimas</label><input style={inputBase} value={entityEditModal.draft.name || ""} onChange={(e) => updateEntityEditDraft("name", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Įmonės kodas</label><input style={inputBase} value={entityEditModal.draft.companyCode || ""} onChange={(e) => updateEntityEditDraft("companyCode", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>PVM kodas</label><input style={inputBase} value={entityEditModal.draft.vatCode || ""} onChange={(e) => updateEntityEditDraft("vatCode", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Email</label><input style={inputBase} value={entityEditModal.draft.email || ""} onChange={(e) => updateEntityEditDraft("email", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Telefonas</label><input style={inputBase} value={entityEditModal.draft.phone || ""} onChange={(e) => updateEntityEditDraft("phone", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Adresas</label><input style={inputBase} value={entityEditModal.draft.address || ""} onChange={(e) => updateEntityEditDraft("address", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Numatytasis kontaktas</label><input style={inputBase} value={entityEditModal.draft.contactName || ""} onChange={(e) => updateEntityEditDraft("contactName", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Kontakto email</label><input style={inputBase} value={entityEditModal.draft.contactEmail || ""} onChange={(e) => updateEntityEditDraft("contactEmail", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Kontakto telefonas</label><input style={inputBase} value={entityEditModal.draft.contactPhone || ""} onChange={(e) => updateEntityEditDraft("contactPhone", e.target.value)} /></div>
            </div>
          )}

          {entityEditModal.entityType === "carrier" && (
            <div style={formGrid}>
              <div style={formGroup}><label style={label}>Pavadinimas</label><input style={inputBase} value={entityEditModal.draft.name || ""} onChange={(e) => updateEntityEditDraft("name", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Įmonės kodas</label><input style={inputBase} value={entityEditModal.draft.companyCode || ""} onChange={(e) => updateEntityEditDraft("companyCode", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>PVM kodas</label><input style={inputBase} value={entityEditModal.draft.vatCode || ""} onChange={(e) => updateEntityEditDraft("vatCode", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Email</label><input style={inputBase} value={entityEditModal.draft.email || ""} onChange={(e) => updateEntityEditDraft("email", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Telefonas</label><input style={inputBase} value={entityEditModal.draft.phone || ""} onChange={(e) => updateEntityEditDraft("phone", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Adresas</label><input style={inputBase} value={entityEditModal.draft.address || ""} onChange={(e) => updateEntityEditDraft("address", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Numatytasis kontaktas</label><input style={inputBase} value={entityEditModal.draft.contactName || ""} onChange={(e) => updateEntityEditDraft("contactName", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Kontakto email</label><input style={inputBase} value={entityEditModal.draft.contactEmail || ""} onChange={(e) => updateEntityEditDraft("contactEmail", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Kontakto telefonas</label><input style={inputBase} value={entityEditModal.draft.contactPhone || ""} onChange={(e) => updateEntityEditDraft("contactPhone", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>CMR galioja iki</label><input style={inputBase} type="date" value={entityEditModal.draft.cmrExpiry || ""} onChange={(e) => updateEntityEditDraft("cmrExpiry", e.target.value)} /></div>
              <div style={formGroup}><label style={label}>Licenzija galioja iki</label><input style={inputBase} type="date" value={entityEditModal.draft.licenseExpiry || ""} onChange={(e) => updateEntityEditDraft("licenseExpiry", e.target.value)} /></div>
            </div>
          )}

          {["driver", "truck", "trailer"].includes(entityEditModal.entityType) && (
            <div style={formGrid}>
              {(entityEditModal.entityType === "driver") ? (
                <>
                  <div style={formGroup}><label style={label}>Vardas</label><input style={inputBase} value={entityEditModal.draft.name || ""} onChange={(e) => updateEntityEditDraft("name", e.target.value)} /></div>
                  <div style={formGroup}><label style={label}>Telefonas</label><input style={inputBase} value={entityEditModal.draft.phone || ""} onChange={(e) => updateEntityEditDraft("phone", e.target.value)} /></div>
                </>
              ) : (
                <>
                  <div style={formGroup}><label style={label}>Valst. numeris</label><input style={inputBase} value={entityEditModal.draft.licensePlate || ""} onChange={(e) => updateEntityEditDraft("licensePlate", e.target.value.toUpperCase())} /></div>
                  <div style={formGroup}><label style={label}>Statusas</label><input style={inputBase} value={entityEditModal.draft.status || ""} onChange={(e) => updateEntityEditDraft("status", e.target.value)} placeholder="pvz. active" /></div>
                  <div style={formGroup}><label style={label}>Modelis</label><input style={inputBase} value={entityEditModal.draft.model || ""} onChange={(e) => updateEntityEditDraft("model", e.target.value)} /></div>
                </>
              )}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <button type="button" style={btnSecondary} onClick={() => setEntityEditModal(null)}>Atšaukti</button>
            <button type="button" style={btnSuccess} onClick={saveEntityEditModal}>Išsaugoti</button>
          </div>
        </div>
      </div>
    )}

    {previewHtml && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 3000, display: "flex", flexDirection: "column", animation: "fadeIn 0.18s ease" }} onClick={closePreview}>
        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* HEADER */}
        <div style={{ background: "#0f172a", padding: "14px 20px", display: "flex", alignItems: "center", flexShrink: 0, borderBottom: "1px solid #1e293b" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#f1f5f9", fontSize: "15px", fontWeight: 700 }}>Užsakymo peržiūra</div>
            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>{documentPreviewContext.orderNumber} · {documentPreviewContext.carrierLabel}</div>
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
            onClick={(e) => { e.stopPropagation(); closePreview(); }}
            style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", fontSize: "20px", lineHeight: 1, cursor: "pointer", padding: "4px 10px", borderRadius: "6px" }}
            title="Uždaryti"
          >×</button>
        </div>

        {/* BODY — document iframe, scrollable outer div */}
        <div style={{ flex: 1, overflowY: "auto", background: "#525659", padding: "24px 20px 36px" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            {previewPageDocs.map((pageDoc, index) => (
              <div key={index} style={{ width: `${previewPageSize.widthPx * previewPageScale}px` }}>
                <div style={{ color: "#cbd5e1", fontSize: "12px", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.02em" }}>
                  Puslapis {index + 1} / {previewPageDocs.length}
                </div>
                <div style={{ width: `${previewPageSize.widthPx * previewPageScale}px`, height: `${previewPageSize.heightPx * previewPageScale}px`, overflow: "hidden", background: "#fff", border: "1px solid #64748b", boxShadow: "0 18px 36px rgba(15,23,42,0.28)" }}>
                  <iframe
                    srcDoc={pageDoc}
                    scrolling="no"
                    style={{ width: `${previewPageSize.widthPx}px`, height: `${previewPageSize.heightPx}px`, border: "none", display: "block", transform: `scale(${previewPageScale})`, transformOrigin: "top left" }}
                    title={`Dokumento peržiūra ${index + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER — 5 action buttons */}
        <div style={{ background: "#0f172a", borderTop: "1px solid #1e293b", padding: "12px 20px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", flexShrink: 0, animation: "slideUp 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            style={{ ...btn, background: "#3b82f6", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); sendPreviewToCarrier(); }}
          >📧 Siųsti vežėjui</button>
          <button
            type="button"
            style={{ ...btn, background: "#0f766e", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); printPreviewDocument(); }}
          >🖨️ Spausdinti</button>
          <button
            type="button"
            style={{ ...btnSuccess, fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); saveToDb(); }}
          >💾 Išsaugoti</button>
          <button
            type="button"
            style={{ ...btn, background: "#7c3aed", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); savePreviewAsPdf(); }}
          >📄 Išsaugoti PDF</button>
          <button
            type="button"
            style={{ ...btn, background: "#1d4ed8", fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); exportPreviewAsWord(); }}
          >📝 Word</button>
          <button
            type="button"
            style={{ ...btnSecondary, fontSize: "13px", padding: "10px 18px", minWidth: "140px" }}
            onClick={(e) => { e.stopPropagation(); closePreview(); }}
          >✏️ Redaguoti</button>
        </div>
      </div>
    )}
    </>
  );
}
