import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal as OrdersModal, Orders as OrdersPage, Settings as SettingsPage } from "./orders_settings_only";
import Finansai from "./components/Finansai";
import { buildFutureDomainStatePatch, createEmptyFutureDomainBuckets, summarizeFutureDomainBuckets } from "./order_domain_state_adapter";
import { ORDER_DRAFT_PERSIST_TARGETS } from "./order_draft_persistence_adapter";
import { buildLegacyOrderLikeRowsFromFutureBuckets } from "./order_domain_view_adapter";
import { buildReminderSnapshot, createManualReminderUpdate, getCarrierDocumentHealth } from "./missing_data_engine";
import * as XLSX from "xlsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const defaultDepartments = () => ([
  { id: 1, title: "Administracija", phone: "", email: "" },
  { id: 2, title: "Buhalterija", phone: "", email: "" },
  { id: 3, title: "Klientų aptarnavimas", phone: "", email: "" },
  { id: 4, title: "Personalas", phone: "", email: "" },
  { id: 5, title: "Krovinių gabenimas", phone: "", email: "" }
]);

const defaultCarrierDocuments = () => ([
  { id: 1, title: "CMR draudimas", number: "", validUntil: "", link: "" },
  { id: 2, title: "Transporto licencija", number: "", validUntil: "", link: "" }
]);

const getCarrierDocumentStatusMeta = (kind, health) => {
  if (kind === "cmr") {
    if (health.cmrMissing) return { label: "Trūksta CMR", tone: "danger" };
    if (health.cmrExpired) return { label: "CMR pasibaigęs", tone: "danger" };
    if (health.cmrExpiringSoon) return { label: "CMR baigiasi greitai", tone: "warning" };
    return { label: "CMR galioja", tone: "success" };
  }

  if (health.licenseMissing) return { label: "Trūksta licenzijos", tone: "danger" };
  if (health.licenseExpired) return { label: "Licenzija pasibaigusi", tone: "danger" };
  if (health.licenseExpiringSoon) return { label: "Licenzija baigiasi greitai", tone: "warning" };
  return { label: "Licenzija galioja", tone: "success" };
};

const getDocumentStatusBadgeStyle = (tone) => {
  if (tone === "danger") {
    return {
      display: "inline-block",
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    };
  }

  if (tone === "warning") {
    return {
      display: "inline-block",
      background: "#fef3c7",
      color: "#b45309",
      border: "1px solid #fde68a",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    };
  }

  return {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
};

const normalizeClientRecord = (client = {}) => ({
  ...client,
  name: client.name || "",
  clientType: client.clientType || "Ekspeditorius",
  companyCode: client.companyCode || "",
  vatCode: client.vatCode || "",
  email: client.email || "",
  phone: client.phone || "",
  address: client.address || "",
  country: client.country || "",
  website: client.website || "",
  invoiceEmail: client.invoiceEmail || "",
  cmrEmail: client.cmrEmail || "",
  podEmail: client.podEmail || "",
  notes: client.notes || "",
  contacts: Array.isArray(client.contacts) && client.contacts.length > 0
    ? client.contacts
    : [{ id: 1, name: "", position: "", email: "", phone: "" }],
  departmentContacts: Array.isArray(client.departmentContacts) && client.departmentContacts.length > 0
    ? client.departmentContacts
    : defaultDepartments(),
});

const normalizeCarrierRecord = (carrier = {}) => {
  const carrierType = carrier.carrierType || "Vežėjas";
  const isOwnCompany = carrier.isOwnCompany === true || carrierType === "Nuosavas transportas";

  return {
    ...carrier,
    name: carrier.name || "",
    carrierType,
    isOwnCompany,
    companyCode: carrier.companyCode || "",
    vatCode: carrier.vatCode || "",
    email: carrier.email || "",
    phone: carrier.phone || "",
    address: carrier.address || "",
    country: carrier.country || "",
    website: carrier.website || "",
    notes: carrier.notes || "",
    managerContacts: Array.isArray(carrier.managerContacts) && carrier.managerContacts.length > 0
      ? carrier.managerContacts
      : [{ id: 1, name: "", position: "", email: "", phone: "" }],
    documentContacts: Array.isArray(carrier.documentContacts) && carrier.documentContacts.length > 0
      ? carrier.documentContacts
      : defaultDepartments(),
    documents: Array.isArray(carrier.documents) && carrier.documents.length > 0
      ? carrier.documents
      : defaultCarrierDocuments(),
    drivers: Array.isArray(carrier.drivers) ? carrier.drivers : [],
    trucks: Array.isArray(carrier.trucks) ? carrier.trucks : [],
    trailers: Array.isArray(carrier.trailers) ? carrier.trailers : [],
  };
};

const getDaysLeft = (date) => {
  if (!date) return '-';
  const today = new Date();
  const target = new Date(date);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Pasibaigė';
  return diff + ' d.';
};

const isOwnCompanyCarrier = (carrier = {}) =>
  carrier?.isOwnCompany === true || carrier?.carrierType === "Nuosavas transportas";

const matchesCarrierDocumentFilter = (carrier, filterType) => {
  if (!filterType) return true;
  if (isOwnCompanyCarrier(carrier)) return false;

  const health = getCarrierDocumentHealth(carrier);

  if (filterType === "missing_cmr") return health.cmrMissing;
  if (filterType === "expired_cmr") return health.cmrExpired;
  if (filterType === "missing_license") return health.licenseMissing;
  if (filterType === "expired_license") return health.licenseExpired;
  if (filterType === "expiring_soon") return health.cmrExpiringSoon || health.licenseExpiringSoon;
  if (filterType === "complete") {
    return (
      !health.cmrMissing &&
      !health.cmrExpired &&
      !health.cmrExpiringSoon &&
      !health.licenseMissing &&
      !health.licenseExpired &&
      !health.licenseExpiringSoon
    );
  }

  return true;
};

const fmtDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("lt-LT");
};

const storageBuckets = {
  clients: {
    canonicalKey: "radanaras_clients",
    aliases: ["radanaras_clients", "clients"],
    emptyValue: []
  },
  carriers: {
    canonicalKey: "radanaras_carriers",
    aliases: ["radanaras_carriers", "carriers"],
    emptyValue: []
  },
  orders: {
    canonicalKey: "radanaras_orders",
    aliases: ["radanaras_orders", "orders"],
    emptyValue: []
  },
  settings: {
    canonicalKey: "radanaras_settings",
    aliases: ["radanaras_settings", "settings"],
    emptyValue: {}
  },
  imports: {
    canonicalKey: "radanaras_imports",
    aliases: ["radanaras_imports", "imports"],
    emptyValue: []
  }
};


const emptyAppData = () => ({
  clients: [],
  carriers: [],
  orders: [],
  settings: {},
  imports: []
});

const loadFromBackend = async (signal) => {
  try {
    const response = await fetch(`${API_BASE}/api/data`, { signal });
    if (response.ok) {
      const data = await response.json();
      return {
        clients: Array.isArray(data.clients) ? data.clients : [],
        carriers: Array.isArray(data.carriers) ? data.carriers : [],
        orders: Array.isArray(data.orders) ? data.orders : [],
        settings: (data.settings && typeof data.settings === 'object') ? data.settings : {},
        imports: Array.isArray(data.imports) ? data.imports : []
      };
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('⚠️ Failed to load from backend:', error);
    }
  }
  return null;
};

const persistUnifiedBucket = (bucketName, value) => {
  const bucket = storageBuckets[bucketName];
  const normalizedValue = value ?? bucket.emptyValue;
  const serializedValue = JSON.stringify(normalizedValue);

  fetch(`${API_BASE}/api/data/${bucketName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: serializedValue
  }).then((res) => {
    if (!res.ok) {
      res.text().then(t => console.error(`❌ Backend rejected PUT /${bucketName}: ${res.status}`, t));
    }
  }).catch((error) => {
    console.error(`❌ Failed to persist ${bucketName} to backend`, error);
  });
};


const dedupeImports = (importsList, carriersList, clientsList) => {
  const names = new Set([
    ...carriersList.map(c => c.name?.toLowerCase().trim()).filter(Boolean),
    ...clientsList.map(c => c.name?.toLowerCase().trim()).filter(Boolean),
  ]);
  const vats = new Set([
    ...carriersList.map(c => c.vatCode?.trim()).filter(Boolean),
    ...clientsList.map(c => c.vatCode?.trim()).filter(Boolean),
  ]);
  return importsList.filter(imp => {
    const name = imp.name?.toLowerCase().trim();
    const vat = imp.vatCode?.trim();
    if (name && names.has(name)) return false;
    if (vat && vats.has(vat)) return false;
    return true;
  });
};

const OBSERVER_MAX_EVENTS = 200;

const formatObserverTime = (date = new Date()) =>
  date.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

const getObserverTargetDescriptor = (target) => {
  if (!(target instanceof Element)) {
    return { label: "unknown", detail: "" };
  }

  const tag = target.tagName?.toLowerCase() || "element";
  const role = target.getAttribute("role") || "";
  const type = target.getAttribute("type") || "";
  const name = target.getAttribute("name") || "";
  const placeholder = target.getAttribute("placeholder") || "";
  const title = target.getAttribute("title") || "";
  const text = (target.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const id = target.id ? `#${target.id}` : "";
  const classes = typeof target.className === "string"
    ? target.className.split(/\s+/).filter(Boolean).slice(0, 3).join(".")
    : "";
  const classSuffix = classes ? `.${classes}` : "";
  const label = [tag + id + classSuffix, text || title || placeholder || name || type || role]
    .filter(Boolean)
    .join(" | ");

  return {
    label: label || tag,
    detail: [name && `name=${name}`, type && `type=${type}`, role && `role=${role}`].filter(Boolean).join(", ")
  };
};

const summarizeObserverValue = (target) => {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
    return "";
  }

  if (target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")) {
    return `${target.checked}`;
  }

  const value = String(target.value ?? "").replace(/\s+/g, " ").trim();
  if (!value) return "";
  return value.length > 80 ? `${value.slice(0, 80)}...` : value;
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [databaseSection, setDatabaseSection] = useState("imports");
  const [clients, setClients] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [imports, setImports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [documentRules, setDocumentRules] = useState([]);
  const [financeStates, setFinanceStates] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [projectHistoryEvents, setProjectHistoryEvents] = useState([]);
  const [importSearch, setImportSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [carrierSearch, setCarrierSearch] = useState("");
  const [carriersFilter, setCarriersFilter] = useState(null);
  const [projectRegistryFilter, setProjectRegistryFilter] = useState("all");
  const [ownTransportTab, setOwnTransportTab] = useState("projects");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [reminderOverrides, setReminderOverrides] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("businessReminderOverrides") || "[]");
    } catch {
      return [];
    }
  });
  const [showReminderCenter, setShowReminderCenter] = useState(false);
  const [reminderCenterScope, setReminderCenterScope] = useState("all");
  const importFileRef = useRef(null);

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState(null);
  const [selectedCarrierDocument, setSelectedCarrierDocument] = useState(null);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showCarrierProfile, setShowCarrierProfile] = useState(false);
  const [showCarrierDocumentModal, setShowCarrierDocumentModal] = useState(false);
  const [editingCarrierId, setEditingCarrierId] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalType, setOrderModalType] = useState("order");
  const [orderWorkflowMode, setOrderWorkflowMode] = useState("default");
  const [editingOrder, setEditingOrder] = useState(null);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [migrationDryRunVisible, setMigrationDryRunVisible] = useState(false);
  const [migrationDryRunLoading, setMigrationDryRunLoading] = useState(false);
  const [migrationDryRunReport, setMigrationDryRunReport] = useState(null);
  const [migrationDryRunPreview, setMigrationDryRunPreview] = useState(null);
  const [migrationDryRunWarnings, setMigrationDryRunWarnings] = useState([]);
  const [migrationDryRunUnresolved, setMigrationDryRunUnresolved] = useState([]);
  const [migrationDryRunSkipped, setMigrationDryRunSkipped] = useState([]);
  const [migrationDryRunErrors, setMigrationDryRunErrors] = useState(null);
  const [migrationDryRunRanAt, setMigrationDryRunRanAt] = useState(null);
  const [orderPersistTarget, setOrderPersistTarget] = useState(ORDER_DRAFT_PERSIST_TARGETS.LEGACY);
  const [lastFuturePersistInfo, setLastFuturePersistInfo] = useState(null);
  const [appObserverVisible, setAppObserverVisible] = useState(false);
  const [appObserverEvents, setAppObserverEvents] = useState([]);
  const [appObserverErrorCount, setAppObserverErrorCount] = useState(0);
  const [appObserverFetchErrorCount, setAppObserverFetchErrorCount] = useState(0);
  const [appObserverCopyStatus, setAppObserverCopyStatus] = useState("");
  const isDev = import.meta.env.DEV;
  const modalVisibilityRef = useRef({
    showOrderModal: false,
    showClientModal: false,
    showCarrierModal: false,
    showCarrierProfile: false,
    showClientProfile: false,
    showTransportModal: false,
    migrationDryRunVisible: false
  });

  const pushAppObserverEvent = (type, label, detail = "", level = "info") => {
    const event = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      time: formatObserverTime(),
      type,
      label,
      detail,
      level
    };

    setAppObserverEvents((prev) => [event, ...prev].slice(0, OBSERVER_MAX_EVENTS));
  };

  const clearAppObserverEvents = () => {
    setAppObserverEvents([]);
    setAppObserverErrorCount(0);
    setAppObserverFetchErrorCount(0);
    setAppObserverCopyStatus("");
  };

  React.useEffect(() => {
    // Clear all legacy localStorage keys to prevent QuotaExceededError
    if (typeof window !== "undefined") {
      Object.keys(window.localStorage)
        .filter(k => k.startsWith("radanaras"))
        .forEach(k => window.localStorage.removeItem(k));
    }

    const abortController = new AbortController();

    const loadData = async () => {
      const backendData = await loadFromBackend(abortController.signal);
      if (abortController.signal.aborted) return;

      if (backendData) {
        const cleanedImports = dedupeImports(backendData.imports, backendData.carriers, backendData.clients);
        if (cleanedImports.length !== backendData.imports.length) {
          persistUnifiedBucket("imports", cleanedImports);
        }
        setClients(backendData.clients);
        setCarriers(backendData.carriers);
        setOrders(backendData.orders);
        setSettings(backendData.settings);
        setImports(cleanedImports);
      } else {
        console.warn("⚠️ Backend unavailable — data not loaded");
        const empty = emptyAppData();
        setClients(empty.clients);
        setCarriers(empty.carriers);
        setOrders(empty.orders);
        setSettings(empty.settings);
        setImports(empty.imports);
      }

      try {
        const statsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/stats`, { signal: abortController.signal });
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          if (statsJson.success) setDashboardStats(statsJson.data);
        }
      } catch (e) {
        if (!abortController.signal.aborted) console.warn("Dashboard stats fetch failed:", e.message);
      }
    };

    loadData();
    return () => abortController.abort();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("businessReminderOverrides", JSON.stringify(reminderOverrides));
    } catch {}
  }, [reminderOverrides]);

  useEffect(() => {
    if (!isDev || typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const handleClickCapture = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-debug-monitor='true']")) {
        return;
      }
      const descriptor = getObserverTargetDescriptor(target);
      pushAppObserverEvent("click", descriptor.label, descriptor.detail);
    };

    const handleChangeCapture = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-debug-monitor='true']")) {
        return;
      }
      const descriptor = getObserverTargetDescriptor(target);
      pushAppObserverEvent("change", descriptor.label, summarizeObserverValue(target));
    };

    const handleSubmitCapture = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-debug-monitor='true']")) {
        return;
      }
      const descriptor = getObserverTargetDescriptor(target);
      pushAppObserverEvent("submit", descriptor.label, descriptor.detail);
    };

    const handleWindowError = (event) => {
      setAppObserverErrorCount((count) => count + 1);
      pushAppObserverEvent("js_error", event.message || "Unhandled error", event.filename ? `${event.filename}:${event.lineno || ""}` : "", "error");
    };

    const handleUnhandledRejection = (event) => {
      setAppObserverErrorCount((count) => count + 1);
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason || "Promise rejection");
      pushAppObserverEvent("promise_error", reason, "", "error");
    };

    const originalFetch = window.fetch.bind(window);
    const wrappedFetch = async (...args) => {
      const [resource, init] = args;
      const method = init?.method || "GET";
      const url = typeof resource === "string" ? resource : resource?.url || "unknown";

      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          setAppObserverFetchErrorCount((count) => count + 1);
          pushAppObserverEvent("fetch_error", `${method} ${url}`, `HTTP ${response.status}`, "error");
        }
        return response;
      } catch (error) {
        setAppObserverFetchErrorCount((count) => count + 1);
        pushAppObserverEvent("fetch_error", `${method} ${url}`, error?.message || "Network error", "error");
        throw error;
      }
    };

    document.addEventListener("click", handleClickCapture, true);
    document.addEventListener("change", handleChangeCapture, true);
    document.addEventListener("submit", handleSubmitCapture, true);
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.fetch = wrappedFetch;

    return () => {
      document.removeEventListener("click", handleClickCapture, true);
      document.removeEventListener("change", handleChangeCapture, true);
      document.removeEventListener("submit", handleSubmitCapture, true);
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      if (window.fetch === wrappedFetch) {
        window.fetch = originalFetch;
      }
    };
  }, [isDev]);

  useEffect(() => {
    if (!isDev) return;
    pushAppObserverEvent("navigation", `Page -> ${page}`);
  }, [page]);

  useEffect(() => {
    if (!isDev) return;
    const currentModalState = {
      showOrderModal,
      showClientModal,
      showCarrierModal,
      showCarrierProfile,
      showClientProfile,
      showTransportModal,
      migrationDryRunVisible
    };

    Object.entries(currentModalState).forEach(([key, value]) => {
      if (modalVisibilityRef.current[key] !== value) {
        pushAppObserverEvent("modal", `${key} -> ${value ? "open" : "closed"}`);
      }
    });

    modalVisibilityRef.current = currentModalState;
  }, [
    isDev,
    showOrderModal,
    showClientModal,
    showCarrierModal,
    showCarrierProfile,
    showClientProfile,
    showTransportModal,
    migrationDryRunVisible
  ]);

  useEffect(() => {
    if (!isDev) return;
    pushAppObserverEvent(
      "persist_target",
      `Persist Target -> ${orderPersistTarget === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN ? "Future Domain" : "Legacy"}`
    );
  }, [isDev, orderPersistTarget]);

  const handleFileUpload = async (file, type, id) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/upload/${type}/${id}`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
      return data;
  };

  const moveImportToCarriers = (importId) => {
    console.group(`🚚 moveImportToCarriers(${importId})`);
    console.log("BEFORE — imports:", imports.length, "| carriers:", carriers.length);

    const importItem = imports.find((imp) => imp.id === importId);
    if (!importItem) {
      console.error("❌ importItem NOT FOUND for id:", importId);
      console.groupEnd();
      return;
    }
    console.log("Moving item:", importItem.name, "| id:", importItem.id);

    const newCarrier = {
      ...importItem,
      carrierType: "Vežėjas",
      country: importItem.country || importItem._country || "",
      managerContacts: importItem.managerContacts || importItem.contacts || [{ id: 1, name: "", position: "", email: "", phone: "" }],
      documentContacts: importItem.documentContacts || defaultDepartments(),
      documents: importItem.documents || defaultCarrierDocuments()
    };
    console.log("newCarrier constructed:", newCarrier.name, "| id:", newCarrier.id);

    const updatedImports = imports.filter((imp) => imp.id !== importId);
    const updatedCarriers = [...carriers, newCarrier];
    console.log("AFTER compute — updatedImports:", updatedImports.length, "| updatedCarriers:", updatedCarriers.length);
    console.log("Last carrier in updatedCarriers:", updatedCarriers[updatedCarriers.length - 1]?.name);

    setImports(updatedImports);
    setCarriers(updatedCarriers);
    console.log("✅ setState called for imports and carriers");

    persistUnifiedBucket("imports", updatedImports);
    console.log("📡 persistUnifiedBucket('imports') called with", updatedImports.length, "items");
    persistUnifiedBucket("carriers", updatedCarriers);
    console.log("📡 persistUnifiedBucket('carriers') called with", updatedCarriers.length, "items");
    console.groupEnd();
  };

  const moveImportToClients = (importId) => {
    console.group(`👤 moveImportToClients(${importId})`);
    console.log("BEFORE — imports:", imports.length, "| clients:", clients.length);

    const importItem = imports.find((imp) => imp.id === importId);
    if (!importItem) {
      console.error("❌ importItem NOT FOUND for id:", importId);
      console.groupEnd();
      return;
    }
    console.log("Moving item:", importItem.name, "| id:", importItem.id);

    const { documents, documentContacts, carrierType, ...clientBase } = importItem;
    const newClient = {
      ...clientBase,
      clientType: carrierType === "Nenustatyta" ? "Klientas" : (carrierType || "Klientas"),
      country: importItem.country || importItem._country || "",
      contacts: importItem.contacts || importItem.managerContacts || [{ id: 1, name: "", position: "", email: "", phone: "" }],
      departmentContacts: importItem.departmentContacts || defaultDepartments()
    };
    console.log("newClient constructed:", newClient.name, "| id:", newClient.id);

    const updatedImports = imports.filter((imp) => imp.id !== importId);
    const updatedClients = [...clients, newClient];
    console.log("AFTER compute — updatedImports:", updatedImports.length, "| updatedClients:", updatedClients.length);
    console.log("Last client in updatedClients:", updatedClients[updatedClients.length - 1]?.name);

    setImports(updatedImports);
    setClients(updatedClients);
    console.log("✅ setState called for imports and clients");

    persistUnifiedBucket("imports", updatedImports);
    console.log("📡 persistUnifiedBucket('imports') called with", updatedImports.length, "items");
    persistUnifiedBucket("clients", updatedClients);
    console.log("📡 persistUnifiedBucket('clients') called with", updatedClients.length, "items");
    console.groupEnd();
  };

  const deleteImport = (importId) => {
    const updatedImports = imports.filter((imp) => imp.id !== importId);
    setImports(updatedImports);
    persistUnifiedBucket("imports", updatedImports);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const newImports = rows.map((row) => {
        const get = (...keys) => {
          for (const k of keys) {
            const found = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
            if (found && row[found] !== "") return String(row[found]).trim();
          }
          return "";
        };
        const address = get("Adresas", "Address", "adresas");
        const addressParts = address.split(",").map(s => s.trim());
        return {
          id: "IMP" + Date.now() + Math.floor(Math.random() * 10000),
          name: get("Pavadinimas", "Name", "Įmonė", "Company", "pavadinimas"),
          carrierType: get("Tipas", "Type", "carrierType") || "Nenustatyta",
          companyCode: get("Įmonės kodas", "Kodas", "companyCode", "Company Code", "Reg No"),
          vatCode: get("PVM kodas", "VAT", "vatCode", "PVM"),
          email: get("El. paštas", "Email", "email"),
          phone: get("Telefonas", "Tel", "Phone", "phone"),
          address,
          website: get("Svetainė", "Website", "website"),
          notes: get("Pastabos", "Notes", "notes"),
          _country: addressParts.length > 1 ? addressParts[addressParts.length - 1] : "",
          _city: addressParts.length > 1 ? addressParts[addressParts.length - 2] || addressParts[0] : addressParts[0] || "",
          _importSource: "manual",
          managerContacts: [{ id: 1, name: "", position: "", email: get("El. paštas", "Email", "email"), phone: get("Telefonas", "Tel", "Phone", "phone") }],
          documentContacts: defaultDepartments(),
          documents: defaultCarrierDocuments()
        };
      }).filter(imp => imp.name);
      if (newImports.length === 0) {
        alert("Nerasta jokių įmonių. Patikrinkite failo formatą.");
        return;
      }
      const updatedImports = [...imports, ...newImports];
      setImports(updatedImports);
      persistUnifiedBucket("imports", updatedImports);
      alert(`✅ Importuota ${newImports.length} įmonių.`);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const emptyClientForm = {
    name: "",
    clientType: "Ekspeditorius",
    companyCode: "",
    vatCode: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    website: "",
    invoiceEmail: "",
    cmrEmail: "",
    podEmail: "",
    notes: "",
    contacts: [
      { id: 1, name: "", position: "", email: "", phone: "" }
    ],
    departmentContacts: defaultDepartments()
  };

  const emptyCarrierForm = {
    name: "",
    carrierType: "Vežėjas",
    companyCode: "",
    vatCode: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    website: "",
    managerContacts: [
      { id: 1, name: "", position: "", email: "", phone: "" }
    ],
    documentContacts: defaultDepartments(),
    documents: defaultCarrierDocuments(),
    drivers: [],
    trucks: [],
    trailers: [],
    notes: ""
  };

  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [carrierForm, setCarrierForm] = useState(emptyCarrierForm);

  const menu = [
    { name: "Dashboard", key: "dashboard", title: "Pagrindinė suvestinė su greitais perėjimais į pagrindinius modulius." },
    { name: "Projektai", key: "projektai", title: "Esama projektų ir užsakymų lentelė su pagrindiniais įrašais." },
    { name: "Ekspedijavimas", key: "ekspedijavimas", title: "Ekspedijavimo shell ekranas. Pilnas workflow bus išplėstas kitame etape." },
    { name: "Nuosavas transportas", key: "nuosavas-transportas", title: "Esamas transporto karkasas. Vėliau bus pajungti gyvi fleet duomenys." },
    { name: "Finansai", key: "finansai", title: "Esamas finansų ekranas. Dalis turinio šiuo metu dar demo." },
    { name: "Duomenų bazė", key: "importas", title: "Bendra klientų, vežėjų ir importo bazė visai sistemai." },
    { name: "Įmonės nustatymai", key: "settings", title: "Įmonės duomenys, dokumentų ir šablonų nustatymai." }
  ];

  const openDatabaseSection = (section, carrierFilter = null) => {
    setDatabaseSection(section);
    setCarriersFilter(section === "carriers" ? carrierFilter : null);
    setPage("importas");
  };

  const handleMenuNavigation = (nextPage) => {
    if (nextPage === "importas") {
      setDatabaseSection("imports");
      setPage("importas");
      return;
    }

    setPage(nextPage);
  };

  const activeMenu = [
    { name: "Dashboard", key: "dashboard", title: "Pagrindinė suvestinė su greitais perėjimais į pagrindinius modulius." },
    { name: "Projektai", key: "projektai", title: "Centrinis visų expedition ir own_fleet projektų registras." },
    { name: "Ekspedijavimas", key: "ekspedijavimas", title: "Workflow modulis išoriniams vežėjams ir subrangovams." },
    { name: "Nuosavas transportas", key: "nuosavas-transportas", title: "Workflow modulis mūsų fleet, vairuotojams ir transporto priemonėms." },
    { name: "Finansai", key: "finansai", title: "Finansinė suvestinė iš projektų, sąskaitų ir terminų duomenų." },
    { name: "Importas", key: "importas", title: "Importo ir vidinių master-data bazių modulis klientams, vežėjams ir kontaktams." },
    { name: "Įmonės nustatymai", key: "settings", title: "Įmonės duomenys, dokumentų ir šablonų nustatymai." }
  ];

  const handleRunMigrationDryRun = async () => {
    setMigrationDryRunLoading(true);
    setMigrationDryRunErrors(null);

    try {
      const existingOrders = Array.isArray(orders) ? [...orders] : [];
      const sharedClients = Array.isArray(clients) ? [...clients] : [];
      const sharedCarriers = Array.isArray(carriers) ? [...carriers] : [];
      const { runLegacyOrdersMigrationDryRun } = await import("./domain-migrations");

      const dryRun = runLegacyOrdersMigrationDryRun(existingOrders, {
        organizationId: "radanaras-dry-run",
        defaultCurrency: "EUR",
        defaultSourceType: "manual",
        sharedClients,
        sharedCarriers,
      });

      setMigrationDryRunReport(dryRun.report ?? null);
      setMigrationDryRunPreview(dryRun.storagePreview ?? null);
      setMigrationDryRunWarnings(dryRun.warnings ?? []);
      setMigrationDryRunUnresolved(dryRun.unresolvedItems ?? []);
      setMigrationDryRunSkipped(dryRun.skippedItems ?? []);
      setMigrationDryRunRanAt(new Date().toISOString());
      setMigrationDryRunVisible(true);
    } catch (error) {
      setMigrationDryRunErrors(
        error instanceof Error ? error.message : "Unknown migration dry-run error"
      );
      setMigrationDryRunVisible(true);
    } finally {
      setMigrationDryRunLoading(false);
    }
  };

  const getFutureDomainBucketsSnapshot = () => ({
    projects,
    executions,
    documentRules,
    financeStates,
    attachments,
    projectHistoryEvents,
  });

  const applyFutureDomainStatePatchToApp = (futureDomainPayload) => {
    const statePatch = buildFutureDomainStatePatch({
      currentBuckets: getFutureDomainBucketsSnapshot(),
      futureDomainPayload,
    });

    setProjects(statePatch.projects);
    setExecutions(statePatch.executions);
    setDocumentRules(statePatch.documentRules);
    setFinanceStates(statePatch.financeStates);
    setAttachments(statePatch.attachments);
    setProjectHistoryEvents(statePatch.projectHistoryEvents);

    return statePatch;
  };

  const persistFutureDomainToAppState = (futureDomainPayload) => {
    const statePatch = applyFutureDomainStatePatchToApp(futureDomainPayload);
    const summary = summarizeFutureDomainBuckets(statePatch);
    const info = {
      ranAt: new Date().toLocaleString("lt-LT"),
      summary,
      ids: {
        projectId: futureDomainPayload?.projects?.[0]?.id || "",
        executionId: futureDomainPayload?.executions?.[0]?.id || "",
        documentRulesId: futureDomainPayload?.documentRules?.[0]?.id || "",
        financeStateId: futureDomainPayload?.financeStates?.[0]?.id || "",
        historyId: futureDomainPayload?.projectHistoryEvents?.[0]?.id || ""
      }
    };

    setLastFuturePersistInfo(info);
    if (isDev) {
      pushAppObserverEvent(
        "future_persist",
        "Future domain payload applied to app state",
        `projects=${summary.projects}, executions=${summary.executions}, finance=${summary.financeStates}`
      );
    }

    return {
      preparedOnly: true,
      statePatch,
      summary,
    };
  };

  const resetFutureDomainState = () => {
    const emptyBuckets = createEmptyFutureDomainBuckets();
    setProjects(emptyBuckets.projects);
    setExecutions(emptyBuckets.executions);
    setDocumentRules(emptyBuckets.documentRules);
    setFinanceStates(emptyBuckets.financeStates);
    setAttachments(emptyBuckets.attachments);
    setProjectHistoryEvents(emptyBuckets.projectHistoryEvents);
    setLastFuturePersistInfo(null);
  };

  const futureDomainStateSummary = useMemo(
    () => summarizeFutureDomainBuckets(getFutureDomainBucketsSnapshot()),
    [projects, executions, documentRules, financeStates, attachments, projectHistoryEvents]
  );
  const futureDomainOrderRows = useMemo(
    () =>
      buildLegacyOrderLikeRowsFromFutureBuckets({
        projects,
        executions,
        financeStates,
      }),
    [projects, executions, financeStates]
  );
  const baseRegistryOrdersForView = futureDomainOrderRows.length > 0 ? futureDomainOrderRows : orders;
  const baseExpeditionOrdersForView = futureDomainOrderRows.length > 0
    ? futureDomainOrderRows.filter((order) => order.orderType !== "own_transport")
    : orders.filter((order) => order.orderType !== "own_transport");
  const baseOwnTransportOrdersForView = futureDomainOrderRows.length > 0
    ? futureDomainOrderRows.filter((order) => order.orderType === "own_transport")
    : orders.filter((order) => order.orderType === "own_transport");
  const ownFleetDemoProjects = useMemo(() => {
    if (baseOwnTransportOrdersForView.length >= 3) {
      return [];
    }

    return [
      {
        id: "demo-own-001",
        projectId: "PRJ-OWN-001",
        orderNumber: "RAD-OWN-001",
        clientOrderNumber: "CL-78451",
        clientName: "Veho Lietuva, UAB",
        orderType: "own_transport",
        carrierName: "Radanaras MB",
        route: "Vilnius → Kaunas",
        loadingDate: "2026-04-21",
        unloadingDate: "2026-04-21",
        clientPrice: 1450,
        carrierPrice: 980,
        driverName: "Jonas Jonaitis",
        truckPlate: "ABC123",
        trailerPlate: "TRL501",
        status: "in_progress",
        cmrStatus: "present",
        carrierInvoiceStatus: "not_applicable",
        clientInvoiceStatus: "missing",
        documents: { cmr: "uploaded", invoice: "" },
        __demo: true,
      },
      {
        id: "demo-own-002",
        projectId: "PRJ-OWN-002",
        orderNumber: "RAD-OWN-002",
        clientOrderNumber: "CL-78488",
        clientName: "Mercedes-Benz Lietuva",
        orderType: "own_transport",
        carrierName: "Radanaras MB",
        route: "Kaunas → Ryga",
        loadingDate: "2026-04-22",
        unloadingDate: "2026-04-23",
        clientPrice: 1680,
        carrierPrice: 1100,
        driverName: "Petras Petrauskas",
        truckPlate: "DEF456",
        trailerPlate: "TRL502",
        status: "confirmed",
        cmrStatus: "missing",
        carrierInvoiceStatus: "not_applicable",
        clientInvoiceStatus: "present",
        documents: { cmr: "", invoice: "issued" },
        __demo: true,
      },
      {
        id: "demo-own-003",
        projectId: "PRJ-OWN-003",
        orderNumber: "RAD-OWN-003",
        clientOrderNumber: "CL-78511",
        clientName: "Delamode Baltics",
        orderType: "own_transport",
        carrierName: "Radanaras MB",
        route: "Klaipėda → Vilnius",
        loadingDate: "2026-04-24",
        unloadingDate: "2026-04-24",
        clientPrice: 1320,
        carrierPrice: 860,
        driverName: "Mantas Mikalauskas",
        truckPlate: "GHI789",
        trailerPlate: "TRL503",
        status: "completed",
        cmrStatus: "present",
        carrierInvoiceStatus: "not_applicable",
        clientInvoiceStatus: "present",
        documents: { cmr: "uploaded", invoice: "issued" },
        __demo: true,
      },
    ].slice(0, Math.max(0, 3 - baseOwnTransportOrdersForView.length));
  }, [baseOwnTransportOrdersForView.length]);
  const ownTransportOrdersForView = [...baseOwnTransportOrdersForView, ...ownFleetDemoProjects];
  const expeditionOrdersForView = baseExpeditionOrdersForView;
  const registryOrdersForView = [...baseRegistryOrdersForView, ...ownFleetDemoProjects];
  const reminderSnapshot = useMemo(
    () =>
      buildReminderSnapshot({
        carriers,
        projects: registryOrdersForView,
        overrides: reminderOverrides,
      }),
    [carriers, registryOrdersForView, reminderOverrides]
  );
  const carrierUsageMap = useMemo(() => {
    const usage = new Map();

    registryOrdersForView.forEach((order) => {
      const keys = [
        order.carrierId ? `id:${String(order.carrierId)}` : null,
        order.carrierName ? `name:${String(order.carrierName).trim().toLowerCase()}` : null,
      ].filter(Boolean);

      keys.forEach((key) => {
        usage.set(key, (usage.get(key) || 0) + 1);
      });
    });

    return usage;
  }, [registryOrdersForView]);
  const clientUsageMap = useMemo(() => {
    const usage = new Map();

    registryOrdersForView.forEach((order) => {
      const keys = [
        order.clientId ? `id:${String(order.clientId)}` : null,
        order.clientName ? `name:${String(order.clientName).trim().toLowerCase()}` : null,
      ].filter(Boolean);

      keys.forEach((key) => {
        usage.set(key, (usage.get(key) || 0) + 1);
      });
    });

    return usage;
  }, [registryOrdersForView]);

  const appObserverSummary = useMemo(() => ({
    total: appObserverEvents.length,
    clicks: appObserverEvents.filter((event) => event.type === "click").length,
    changes: appObserverEvents.filter((event) => event.type === "change").length,
    submits: appObserverEvents.filter((event) => event.type === "submit").length,
    errors: appObserverErrorCount,
    fetchErrors: appObserverFetchErrorCount
  }), [appObserverEvents, appObserverErrorCount, appObserverFetchErrorCount]);

  const copyAppObserverLog = async () => {
    const lines = [
      "Globalus App Monitorius",
      `Page: ${page}`,
      `Errors: ${appObserverSummary.errors}`,
      `Fetch Errors: ${appObserverSummary.fetchErrors}`,
      `Clicks: ${appObserverSummary.clicks}`,
      `Changes: ${appObserverSummary.changes}`,
      `Submits: ${appObserverSummary.submits}`,
      `Projects: ${futureDomainStateSummary.projects}`,
      `Executions: ${futureDomainStateSummary.executions}`,
      `Doc Rules: ${futureDomainStateSummary.documentRules}`,
      `Finance: ${futureDomainStateSummary.financeStates}`,
      `Attachments: ${futureDomainStateSummary.attachments}`,
      `History: ${futureDomainStateSummary.projectHistoryEvents}`,
      "",
      "Paskutiniai įvykiai:"
    ];

    appObserverEvents.slice(0, 30).forEach((event, index) => {
      lines.push(
        `${index + 1}. [${event.time}] ${event.type} | ${event.label}${event.detail ? ` | ${event.detail}` : ""}`
      );
    });

    const text = lines.join("\n");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setAppObserverCopyStatus("Copied");
      window.setTimeout(() => setAppObserverCopyStatus(""), 1800);
    } catch (error) {
      setAppObserverCopyStatus("Copy failed");
      window.setTimeout(() => setAppObserverCopyStatus(""), 2200);
      pushAppObserverEvent("copy_error", "Copy debug log failed", error?.message || "", "error");
    }
  };

  const openReminderCenter = (scope = "all") => {
    setReminderCenterScope(scope);
    setShowReminderCenter(true);
  };

  const handleSendReminder = (reminder, channel = "email") => {
    const update = createManualReminderUpdate(reminder, channel);
    setReminderOverrides((prev) => {
      const key = `${update.entityType}:${update.entityId}:${update.reminderType}`;
      const next = prev.filter((item) => `${item.entityType}:${item.entityId}:${item.reminderType}` !== key);
      return [...next, update];
    });
    if (isDev) {
      pushAppObserverEvent("reminder_sent", reminder.title || reminder.reminderType, `${channel} -> ${reminder.detail || reminder.entityId}`);
    }
    window.alert(`Priminimas pažymėtas kaip išsiųstas (${channel}).`);
  };

  const selectedClient = useMemo(() => {
    const found = clients.find(c => String(c.id) === String(selectedClientId));
    if (!found) return null;
    return normalizeClientRecord(found);
  }, [clients, selectedClientId]);

  const selectedCarrier = useMemo(() => {
    const found = carriers.find(c => String(c.id) === String(selectedCarrierId));
    if (!found) return null;
    return normalizeCarrierRecord(found);
  }, [carriers, selectedCarrierId]);

  const saveClients = (next) => {
    const normalized = (Array.isArray(next) ? next : []).map(normalizeClientRecord);
    setClients(normalized);
    persistUnifiedBucket("clients", normalized);
  };

  const saveCarriers = (next) => {
    const normalized = (Array.isArray(next) ? next : []).map(normalizeCarrierRecord);
    setCarriers(normalized);
    persistUnifiedBucket("carriers", normalized);
  };

  const saveOrders = (next) => {
    setOrders(next);
    persistUnifiedBucket("orders", next);
  };

  const saveSettings = (next) => {
    setSettings(next);
    persistUnifiedBucket("settings", next);
  };

  const generateId = (prefix) => {
    const now = new Date();
    const stamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");
    return prefix + stamp;
  };

  const openNewClientModal = () => {
    setEditingClientId(null);
    setClientForm(normalizeClientRecord(emptyClientForm));
    setShowClientModal(true);
  };

  const openEditClientModal = (client) => {
    setEditingClientId(client.id);
    setClientForm(normalizeClientRecord(client));
    setShowClientModal(true);
  };

  const openNewCarrierModal = () => {
    setEditingCarrierId(null);
    setCarrierForm(normalizeCarrierRecord(emptyCarrierForm));
    setShowCarrierModal(true);
  };

  const openEditCarrierModal = (carrier) => {
    setEditingCarrierId(carrier.id);
    setCarrierForm(normalizeCarrierRecord(carrier));
    setShowCarrierModal(true);
    return;
    setCarrierForm({
      name: carrier.name || "",
      carrierType: carrier.carrierType || "Vežėjas",
      companyCode: carrier.companyCode || "",
      vatCode: carrier.vatCode || "",
      email: carrier.email || "",
      phone: carrier.phone || "",
      address: carrier.address || "",
      country: carrier.country || "",
      website: carrier.website || "",
      managerContacts:
        carrier.managerContacts && carrier.managerContacts.length > 0
          ? carrier.managerContacts
          : [{ id: 1, name: "", position: "", email: "", phone: "" }],
      documentContacts:
        carrier.documentContacts && carrier.documentContacts.length > 0
          ? carrier.documentContacts
          : defaultDepartments(),
      documents:
        carrier.documents && carrier.documents.length > 0
          ? carrier.documents
          : defaultCarrierDocuments(),
      drivers: carrier.drivers || [],
      trucks: carrier.trucks || [],
      trailers: carrier.trailers || [],
      notes: carrier.notes || ""
    });
    setShowCarrierModal(true);
  };

  const openCarrierProfile = (carrierId) => {
    setSelectedCarrierId(carrierId);
    setShowCarrierProfile(true);
  };

  const openOrderModal = (type = "order", order = null, options = {}) => {
    setOrderModalType(type);
    setEditingOrder(order);
    setOrderWorkflowMode(options.workflowMode || "default");
    setShowOrderModal(true);
  };

  const normalizeCarrierDocumentLink = (link) => {
    if (!link) return "";
    if (link.startsWith("http://") || link.startsWith("https://")) return link;
    if (link.startsWith("/uploads/")) return `${API_BASE}${link}`;
    if (link.startsWith("uploads/")) return `${API_BASE}/${link}`;
    return link;
  };

  const openCarrierDocumentModal = (carrier, doc) => {
    setSelectedCarrierId(carrier.id);

    setSelectedCarrierDocument({
      ...doc,
      link: normalizeCarrierDocumentLink(doc.link || ""),
      carrierName: carrier.name
    });
    setShowCarrierDocumentModal(true);
  };

  const handleDeleteCarrier = (carrierId) => {
    const carrier = carriers.find(item => item.id === carrierId);
    const usageCount =
      carrierUsageMap.get(`id:${String(carrierId)}`) ||
      carrierUsageMap.get(`name:${String(carrier?.name || "").trim().toLowerCase()}`) ||
      0;
    const warning = usageCount > 0
      ? `Vežėjas naudojamas ${usageCount} projekto(-ų) įrašuose.\n\n`
      : "";
    const confirmed = window.confirm(`${warning}Ar tikrai nori ištrinti vežėją "${carrier?.name || ""}"?`);

    if (!confirmed) return;

    const next = carriers.filter(item => item.id !== carrierId);
    saveCarriers(next);

    if (String(selectedCarrierId) === String(carrierId)) {
      setSelectedCarrierId(null);
      setShowCarrierProfile(false);
    }
  };

  const handleClientFieldChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCarrierFieldChange = (field, value) => {
    setCarrierForm(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (contactId, field, value) => {
    setClientForm(prev => ({
      ...prev,
      contacts: prev.contacts.map(contact =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const handleCarrierManagerChange = (contactId, field, value) => {
    setCarrierForm(prev => ({
      ...prev,
      managerContacts: prev.managerContacts.map(contact =>
        contact.id === contactId ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const addContactRow = () => {
    setClientForm(prev => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          id: Date.now(),
          name: "",
          position: "",
          email: "",
          phone: ""
        }
      ]
    }));
  };

  const addCarrierManagerRow = () => {
    setCarrierForm(prev => ({
      ...prev,
      managerContacts: [
        ...prev.managerContacts,
        {
          id: Date.now(),
          name: "",
          position: "",
          email: "",
          phone: ""
        }
      ]
    }));
  };

  const removeContactRow = (contactId) => {
    setClientForm(prev => {
      const filtered = prev.contacts.filter(c => c.id !== contactId);
      return {
        ...prev,
        contacts:
          filtered.length > 0
            ? filtered
            : [{ id: 1, name: "", position: "", email: "", phone: "" }]
      };
    });
  };

  const removeCarrierManagerRow = (contactId) => {
    setCarrierForm(prev => {
      const filtered = prev.managerContacts.filter(c => c.id !== contactId);
      return {
        ...prev,
        managerContacts:
          filtered.length > 0
            ? filtered
            : [{ id: 1, name: "", position: "", email: "", phone: "" }]
      };
    });
  };

  const handleDepartmentChange = (departmentId, field, value) => {
    setClientForm(prev => ({
      ...prev,
      departmentContacts: prev.departmentContacts.map(dep =>
        dep.id === departmentId ? { ...dep, [field]: value } : dep
      )
    }));
  };

  const handleCarrierDepartmentChange = (departmentId, field, value) => {
    setCarrierForm(prev => ({
      ...prev,
      documentContacts: prev.documentContacts.map(dep =>
        dep.id === departmentId ? { ...dep, [field]: value } : dep
      )
    }));
  };

  const addDepartmentRow = () => {
    setClientForm(prev => ({
      ...prev,
      departmentContacts: [
        ...prev.departmentContacts,
        { id: Date.now(), title: "", phone: "", email: "" }
      ]
    }));
  };

  const addCarrierDepartmentRow = () => {
    setCarrierForm(prev => ({
      ...prev,
      documentContacts: [
        ...prev.documentContacts,
        { id: Date.now(), title: "", phone: "", email: "" }
      ]
    }));
  };

  const removeDepartmentRow = (departmentId) => {
    setClientForm(prev => {
      const filtered = prev.departmentContacts.filter(dep => dep.id !== departmentId);
      return {
        ...prev,
        departmentContacts: filtered.length > 0 ? filtered : defaultDepartments()
      };
    });
  };

  const removeCarrierDepartmentRow = (departmentId) => {
    setCarrierForm(prev => {
      const filtered = prev.documentContacts.filter(dep => dep.id !== departmentId);
      return {
        ...prev,
        documentContacts: filtered.length > 0 ? filtered : defaultDepartments()
      };
    });
  };

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const handleCarrierDriverChange = (id, field, value) => {
    setCarrierForm(prev => ({ ...prev, drivers: prev.drivers.map(d => d.id === id ? { ...d, [field]: value } : d) }));
  };
  const addCarrierDriverRow = () => {
    setCarrierForm(prev => ({ ...prev, drivers: [...(prev.drivers || []), { id: Date.now(), name: "", phone: "", licenseNumber: "" }] }));
  };
  const removeCarrierDriverRow = (id) => {
    setCarrierForm(prev => ({ ...prev, drivers: (prev.drivers || []).filter(d => d.id !== id) }));
  };

  // ── Trucks ───────────────────────────────────────────────────────────────────
  const handleCarrierTruckChange = (id, field, value) => {
    setCarrierForm(prev => ({ ...prev, trucks: prev.trucks.map(t => t.id === id ? { ...t, [field]: value } : t) }));
  };
  const addCarrierTruckRow = () => {
    setCarrierForm(prev => ({ ...prev, trucks: [...(prev.trucks || []), { id: Date.now(), licensePlate: "", model: "", year: "" }] }));
  };
  const removeCarrierTruckRow = (id) => {
    setCarrierForm(prev => ({ ...prev, trucks: (prev.trucks || []).filter(t => t.id !== id) }));
  };

  // ── Trailers ─────────────────────────────────────────────────────────────────
  const handleCarrierTrailerChange = (id, field, value) => {
    setCarrierForm(prev => ({ ...prev, trailers: prev.trailers.map(t => t.id === id ? { ...t, [field]: value } : t) }));
  };
  const addCarrierTrailerRow = () => {
    setCarrierForm(prev => ({ ...prev, trailers: [...(prev.trailers || []), { id: Date.now(), licensePlate: "", model: "", year: "" }] }));
  };
  const removeCarrierTrailerRow = (id) => {
    setCarrierForm(prev => ({ ...prev, trailers: (prev.trailers || []).filter(t => t.id !== id) }));
  };

  const handleCarrierDocumentChange = (documentId, field, value) => {
    setCarrierForm(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId ? { ...doc, [field]: value } : doc
      )
    }));
  };

  const getCarrierDocumentNumberInputValue = (doc) => {
    const value = doc?.number || "";
    console.log("NUMBER INPUT VALUE SOURCE: doc.number");
    console.log("NUMBER INPUT VALUE STRING:", JSON.stringify(value));
    return value;
  };

  const getCarrierDocumentValidUntilInputValue = (doc) => {
    const value = doc?.validUntil || "";
    console.log("VALIDUNTIL INPUT VALUE SOURCE: doc.validUntil");
    console.log("VALIDUNTIL INPUT VALUE STRING:", JSON.stringify(value));
    return value;
  };

  const applyUploadedCarrierDocumentData = (documentId, fileName, uploadData) => {
    const nextDocumentData = {
      link: uploadData?.fileUrl || "",
      fileName,
      number: uploadData?.extracted?.number || "",
      validUntil: uploadData?.extracted?.validUntil || ""
    };

    setCarrierForm(prev => {
      const nextDocuments = prev.documents.map(doc => ({ ...doc }));
      const targetIndex = nextDocuments.findIndex(doc => doc.id === documentId);

      if (targetIndex === -1) {
        return { ...prev, documents: [...nextDocuments] };
      }

      nextDocuments[targetIndex] = {
        ...nextDocuments[targetIndex],
        ...nextDocumentData
      };

      return {
        ...prev,
        documents: nextDocuments
      };
    });

    setSelectedCarrierDocument(prev =>
      prev && prev.id === documentId
        ? {
            ...prev,
            ...nextDocumentData
          }
        : prev
    );
  };

  const addCarrierDocumentRow = () => {
    setCarrierForm(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        { id: Date.now(), title: "", number: "", validUntil: "", link: "" }
      ]
    }));
  };

  const removeCarrierDocumentRow = (documentId) => {
    setCarrierForm(prev => {
      const filtered = prev.documents.filter(doc => doc.id !== documentId);
      return {
        ...prev,
        documents: filtered.length > 0 ? filtered : defaultCarrierDocuments()
      };
    });
  };

  const handleSaveClient = () => {
    if (!clientForm.name.trim()) {
      alert("Įvesk kliento pavadinimą");
      return;
    }

    const cleanedContacts = clientForm.contacts.filter(c =>
      c.name.trim() || c.position.trim() || c.email.trim() || c.phone.trim()
    );

    const cleanedDepartments = clientForm.departmentContacts.filter(dep =>
      dep.title.trim() || dep.phone.trim() || dep.email.trim()
    );
    const trimmedName = clientForm.name.trim();
    const duplicateClient = clients.find((client) =>
      client.id !== editingClientId &&
      String(client.name || "").trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateClient) {
      alert(`Klientas "${duplicateClient.name}" jau yra bendroje bazėje.`);
      return;
    }

    if (editingClientId) {
      const next = clients.map(client =>
        client.id === editingClientId
          ? {
              ...client,
              ...clientForm,
              name: trimmedName,
              contacts: cleanedContacts,
              departmentContacts: cleanedDepartments,
              updatedAt: new Date().toISOString(),
            }
          : client
      );
      saveClients(next);
    } else {
      const newClient = {
        id: generateId("CL"),
        ...clientForm,
        name: trimmedName,
        contacts: cleanedContacts,
        departmentContacts: cleanedDepartments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveClients([newClient, ...clients]);
    }

    setClientForm(normalizeClientRecord(emptyClientForm));
    setEditingClientId(null);
    setShowClientModal(false);
  };

  const handleDeleteClient = (clientId) => {
    const client = clients.find((item) => String(item.id) === String(clientId));
    if (!client) return;

    const usageCount =
      clientUsageMap.get(`id:${String(client.id)}`) ||
      clientUsageMap.get(`name:${String(client.name || "").trim().toLowerCase()}`) ||
      0;

    const warning = usageCount > 0
      ? `Klientas naudojamas ${usageCount} projekto(-ų) įrašuose.\n\n`
      : "";

    const confirmed = window.confirm(`${warning}Ar tikrai nori ištrinti klientą "${client.name}"?`);
    if (!confirmed) return;

    const next = clients.filter((item) => String(item.id) !== String(clientId));
    saveClients(next);

    if (String(selectedClientId) === String(clientId)) {
      setSelectedClientId(null);
      setShowClientProfile(false);
    }
  };

  const handleSaveCarrier = () => {
    if (!carrierForm.name.trim()) {
      alert("Įvesk vežėjo pavadinimą");
      return;
    }

    const cleanedManagers = carrierForm.managerContacts.filter(c =>
      c.name.trim() || c.position.trim() || c.email.trim() || c.phone.trim()
    );

    const cleanedDepartments = carrierForm.documentContacts.filter(dep =>
      dep.title.trim() || dep.phone.trim() || dep.email.trim()
    );

    const cleanedDocuments = carrierForm.documents.filter(doc =>
      doc.title.trim() || doc.number.trim() || doc.validUntil.trim() || doc.link.trim() || doc.fileName
    );

    const cleanedDrivers = (carrierForm.drivers || []).filter(d => d.name?.trim() || d.phone?.trim() || d.licenseNumber?.trim());
    const cleanedTrucks = (carrierForm.trucks || []).filter(t => t.licensePlate?.trim() || t.model?.trim());
    const cleanedTrailers = (carrierForm.trailers || []).filter(t => t.licensePlate?.trim() || t.model?.trim());
    const trimmedName = carrierForm.name.trim();
    const duplicateCarrier = carriers.find((carrier) =>
      carrier.id !== editingCarrierId &&
      String(carrier.name || "").trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateCarrier) {
      alert(`Vežėjas "${duplicateCarrier.name}" jau yra bendroje bazėje.`);
      return;
    }

    if (editingCarrierId) {
      const next = carriers.map(carrier =>
        carrier.id === editingCarrierId
          ? {
              ...carrier,
              ...carrierForm,
              name: trimmedName,
              isOwnCompany: carrierForm.carrierType === "Nuosavas transportas",
              managerContacts: cleanedManagers,
              documentContacts: cleanedDepartments,
              documents: cleanedDocuments,
              drivers: cleanedDrivers,
              trucks: cleanedTrucks,
              trailers: cleanedTrailers,
              updatedAt: new Date().toISOString()
            }
          : carrier
      );
      saveCarriers(next);
    } else {
      const newCarrier = {
        id: generateId("CR"),
        ...carrierForm,
        name: trimmedName,
        isOwnCompany: carrierForm.carrierType === "Nuosavas transportas",
        managerContacts: cleanedManagers,
        documentContacts: cleanedDepartments,
        documents: cleanedDocuments,
        drivers: cleanedDrivers,
        trucks: cleanedTrucks,
        trailers: cleanedTrailers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCarriers([newCarrier, ...carriers]);
    }

    setCarrierForm(normalizeCarrierRecord(emptyCarrierForm));
    setEditingCarrierId(null);
    setShowCarrierModal(false);
  };

  const openClientProfile = (clientId) => {
    setSelectedClientId(clientId);
    setShowClientProfile(true);
  };

  const renderDashboard = () => {
    const activeOrdersCount = orders.filter(o => o.status !== "Juodraštis").length;
    const draftOrdersCount = orders.filter(o => o.status === "Juodraštis").length;
    const fin = dashboardStats?.financial || {};
    const carrierDocs = reminderSnapshot.carrierDocuments;
    const reminderStats = reminderSnapshot.reminderStats;
    const fmtEur = (val) => val !== undefined
      ? "€" + Number(val).toLocaleString("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";
    const cardBaseStyle = {
      cursor: "pointer",
      transition: "transform 0.16s ease, box-shadow 0.16s ease",
    };

    return (
      <div>
        <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>Dashboard</h2>

        {/* Financial summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
          {/* Revenue — green */}
          <div
            title="Rodo bendras pajamas. Atidaro Finansų ekraną."
            onClick={() => setPage("finansai")}
            style={{ ...statCard, ...cardBaseStyle, background: "linear-gradient(135deg, #15803d, #22c55e)" }}
          >
            <div style={statTitle}>Pajamos (Revenue)</div>
            <div style={{ ...statValue, fontSize: "32px" }}>{fmtEur(fin.totalRevenue)}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.9 }}>
              ↗ +{fin.revenueChange ?? 15}%
            </div>
          </div>

          {/* Expenses — orange */}
          <div
            title="Rodo bendras išlaidas. Atidaro Finansų ekraną."
            onClick={() => setPage("finansai")}
            style={{ ...statCard, ...cardBaseStyle, background: "linear-gradient(135deg, #c2410c, #fb923c)" }}
          >
            <div style={statTitle}>Išlaidos (Expenses)</div>
            <div style={{ ...statValue, fontSize: "32px" }}>{fmtEur(fin.totalCost)}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.9 }}>
              Marža: {fin.profitMargin ?? 0}%
            </div>
          </div>

          {/* Profit — blue */}
          <div
            title="Rodo bendrą pelną. Atidaro Finansų ekraną."
            onClick={() => setPage("finansai")}
            style={{ ...statCard, ...cardBaseStyle, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}
          >
            <div style={statTitle}>Pelnas (Profit)</div>
            <div style={{ ...statValue, fontSize: "32px" }}>{fmtEur(fin.totalProfit)}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.9 }}>
              ↘ Optimizacija
            </div>
          </div>
        </div>

        {/* Operational stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "16px" }}>
          <div
            title="Rodo aktyvių projektų ir užsakymų kiekį. Atidaro Projektų ekraną."
            onClick={() => setPage("projektai")}
            style={{ ...statCard, ...cardBaseStyle }}
          >
            <div style={statTitle}>Aktyvūs užsakymai</div>
            <div style={statValue}>{activeOrdersCount}</div>
          </div>
          <div
            title="Rodo bendrą klientų kiekį. Atidaro Projektų ekraną."
            onClick={() => setPage("projektai")}
            style={{ ...statCard, ...cardBaseStyle }}
          >
            <div style={statTitle}>Viso klientų</div>
            <div style={statValue}>{clients.length}</div>
          </div>
          <div
            title="Rodo bendrą vežėjų kiekį. Atidaro Ekspedijavimo ekraną."
            onClick={() => setPage("ekspedijavimas")}
            style={{ ...statCard, ...cardBaseStyle }}
          >
            <div style={statTitle}>Viso vežėjų</div>
            <div style={statValue}>{carriers.length}</div>
          </div>
          <div
            title="Rodo juodraščių kiekį. Atidaro Projektų ekraną."
            onClick={() => setPage("projektai")}
            style={{ ...statCard, ...cardBaseStyle }}
          >
            <div style={statTitle}>Juodraščiai</div>
            <div style={statValue}>{draftOrdersCount}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginTop: "16px" }}>
          <div
            title="Rodo vežėjų dokumentų būseną ir atidaro priminimų sąrašą."
            style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: "12px", padding: "18px 22px" }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#991b1b", marginBottom: "12px" }}>Vežėjų dokumentai</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div onClick={() => openDatabaseSection("carriers", "missing_cmr")} style={cardBaseStyle}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Nėra CMR</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>{carrierDocs.missingCmrCount}</div>
              </div>
              <div onClick={() => openDatabaseSection("carriers", "expired_cmr")} style={cardBaseStyle}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Pasibaigę CMR</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>{carrierDocs.expiredCmrCount}</div>
              </div>
              <div onClick={() => openDatabaseSection("carriers", "missing_license")} style={cardBaseStyle}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Nėra licenzijos</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>{carrierDocs.missingLicenseCount}</div>
              </div>
              <div onClick={() => openDatabaseSection("carriers", "expired_license")} style={cardBaseStyle}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Pasibaigusios licenzijos</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>{carrierDocs.expiredLicenseCount}</div>
              </div>
              <div onClick={() => openDatabaseSection("carriers", "expiring_soon")} style={cardBaseStyle}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Artėja pabaiga</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#b45309" }}>{carrierDocs.expiringSoonCount}</div>
              </div>
              <div onClick={() => openDatabaseSection("carriers", "complete")} style={cardBaseStyle}>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Pilni dokumentai</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#15803d" }}>{carrierDocs.completeCarrierCount}</div>
              </div>
            </div>
          </div>
          <div
            title="Rodo dokumentų priminimus ir atidaro priminimų sąrašą."
            onClick={() => openReminderCenter("project_documents")}
            style={{ ...cardBaseStyle, background: "#fff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px 22px" }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a8a", marginBottom: "12px" }}>Dokumentų priminimai</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>CMR neįkelta per 24h</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>{reminderSnapshot.projectDocuments.cmrMissingAfter24hCount}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Išsiųsti priminimai</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#2563eb" }}>{reminderStats.sentCount}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Neišsiųsti priminimai</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#b45309" }}>{reminderStats.pendingCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today widget */}
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a8a" }}>📦 Šiandien</span>
            <span style={{ fontSize: "12px", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: "6px", padding: "2px 8px", fontWeight: 600 }}>🚧 Demo duomenys</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div
              title="Rodo šiandienos pakrovimus. Atidaro Projektų ekraną."
              onClick={() => setPage("projektai")}
              style={{ ...cardBaseStyle, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "18px 22px" }}
            >
              <div style={{ fontSize: "13px", color: "#15803d", fontWeight: 600, marginBottom: "6px" }}>🟢 Pakrovimai</div>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#15803d" }}>3</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>suplanuoti šiandien</div>
            </div>
            <div
              title="Rodo šiandienos iškrovimus. Atidaro Projektų ekraną."
              onClick={() => setPage("projektai")}
              style={{ ...cardBaseStyle, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px 22px" }}
            >
              <div style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: 600, marginBottom: "6px" }}>🔵 Iškrovimai</div>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#1d4ed8" }}>5</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>suplanuoti šiandien</div>
            </div>
          </div>
        </div>

        {/* Attention required widget */}
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a8a" }}>⚠️ Dėmesio reikalauja</span>
            <span style={{ fontSize: "12px", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: "6px", padding: "2px 8px", fontWeight: 600 }}>🚧 Demo duomenys</span>
          </div>
          <div
            title="Demo suvestinė. Vėliau čia bus realūs perspėjimai apie dokumentus, vėlavimus ir apmokėjimus."
            style={{ background: "#fff7ed", border: "2px solid #fed7aa", borderRadius: "12px", padding: "18px 22px", display: "flex", gap: "32px", flexWrap: "wrap" }}
          >
            <div>
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Trūksta dokumentų</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#c2410c" }}>2</div>
            </div>
            <div style={{ borderLeft: "1px solid #fed7aa", paddingLeft: "32px" }}>
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Vėluoja</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#b91c1c" }}>1</div>
            </div>
            <div style={{ borderLeft: "1px solid #fed7aa", paddingLeft: "32px" }}>
              <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>Laukia apmokėjimo</div>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#b45309" }}>3</div>
            </div>
          </div>
        </div>

        {/* Top carriers widget */}
        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e3a8a" }}>📊 TOP Vežėjai</span>
            <span style={{ fontSize: "12px", background: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: "6px", padding: "2px 8px", fontWeight: 600 }}>🚧 Demo duomenys — funkcija neveikia</span>
          </div>
          <div
            title="Demo blokas. Vėliau čia bus realus vežėjų reitingavimas ir našumo duomenys."
            style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: "11px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "2px solid #e2e8f0" }}>Vežėjas</th>
                  <th style={{ padding: "11px 16px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "2px solid #e2e8f0" }}>Reitingas</th>
                  <th style={{ padding: "11px 16px", textAlign: "center", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.4px", borderBottom: "2px solid #e2e8f0" }}>Užsakymai</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Schenker MB", rating: "⭐ 4.8", orders: 156 },
                  { name: "DSV Solutions", rating: "⭐ 4.6", orders: 78 },
                  { name: "Rhenus Freight", rating: "⭐ 4.4", orders: 54 },
                ].map((row, i) => (
                  <tr key={row.name} style={{ background: i % 2 === 0 ? "white" : "#f8fafc" }}>
                    <td style={{ padding: "11px 16px", fontSize: "14px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>{row.name}</td>
                    <td style={{ padding: "11px 16px", textAlign: "center", fontSize: "14px", color: "#b45309", borderBottom: "1px solid #e2e8f0" }}>{row.rating}</td>
                    <td style={{ padding: "11px 16px", textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#1e3a8a", borderBottom: "1px solid #e2e8f0" }}>{row.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderEkspedijavimasShell = () => {
    const externalCarriers = carriers.filter((carrier) => !carrier.isOwnCompany);
    const expeditionOrders = orders.filter((order) => order.orderType !== "own_transport");

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Ekspedijavimas</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Shell ekranas ekspedicijos workflow navigacijai. Pilnas procesas bus detalinamas ETAPAS 2.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              title="Atidaro esamą naujo užsakymo formą ekspedicijos workflow pradžiai."
              style={primaryButton}
              onClick={() => openOrderModal("order", null)}
            >
              + Naujas užsakymas
            </button>
            <button
              type="button"
              title="Atidaro bendrą vežėjų bazę, naudojamą ekspedijavimo formose."
              style={secondaryButton}
              onClick={() => openDatabaseSection("carriers")}
            >
              Atidaryti vežėjų bazę
            </button>
          </div>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", marginBottom: "6px" }}>
            Ekspedijavimo logika šiame etape jau perkelta į teisingą navigacijos vietą
          </div>
          <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.5 }}>
            Senas demonstracinis ekranas su atskirais tabais nebenaudojamas. Šis puslapis kol kas veikia kaip pereinamasis wrapperis į esamą užsakymo formą ir projektų sąrašą.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div title="Rodo dabartinį ekspedicinių projektų skaičių." style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
            <div style={statTitle}>Projektai ekspedicijai</div>
            <div style={statValue}>{expeditionOrders.length}</div>
          </div>
          <div
            title="Rodo galimų išorinių vežėjų kiekį bendroje bazėje. Atidaro vežėjų poskyrį."
            onClick={() => openDatabaseSection("carriers")}
            style={{ ...statCard, cursor: "pointer", background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}
          >
            <div style={statTitle}>Išoriniai vežėjai</div>
            <div style={statValue}>{externalCarriers.length}</div>
          </div>
          <div title="Šiuo metu tai pereinamasis ekranas. Pilnas ekspedijavimo workflow bus išplėstas vėliau." style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }}>
            <div style={statTitle}>Workflow būsena</div>
            <div style={{ ...statValue, fontSize: "24px" }}>Paruoštas shell</div>
          </div>
        </div>
      </div>
    );
  };

  const renderEkspedijavimasWorkflow = () => {
    const externalCarriers = carriers.filter((carrier) => !carrier.isOwnCompany);

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Ekspedijavimas</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Čia kuriami visi projektai, kuriuos vykdo išorinis vežėjas arba subrangovas.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              title="Rankinis naujo ekspedicijos užsakymo kūrimas."
              style={primaryButton}
              onClick={() => openOrderModal("order", null, { workflowMode: "expedition" })}
            >
              + Naujas užsakymas
            </button>
            <button
              type="button"
              title="Atidaro bendrą klientų bazę, iš kurios pasirenkamas projekto užsakovas."
              style={secondaryButton}
              onClick={() => openDatabaseSection("clients")}
            >
              Klientų bazė
            </button>
            <button
              type="button"
              title="Atidaro bendrą vežėjų bazę, naudojamą ekspedijavimo formose."
              style={secondaryButton}
              onClick={() => openDatabaseSection("carriers")}
            >
              Vežėjų bazė
            </button>
            <button
              type="button"
              title="Paruoštas intake kelias kūrimui iš kliento laiško, PDF ar screenshot. Pilna analizė bus pajungta vėliau."
              style={secondaryButton}
              onClick={() => openDatabaseSection("imports")}
            >
              Iš email / PDF / screenshot
            </button>
          </div>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e3a8a", marginBottom: "6px" }}>
            Ekspedijavimo kūrimas jau perkeltas į teisingą vietą
          </div>
          <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.5 }}>
            Projektai šiame modelyje nebėra kūrimo vieta. Naujas ekspedicinis įrašas kuriamas čia, o į Projektų registrą patenka kaip bendras projekto įrašas.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div title="Rodo dabartinį ekspedicinių projektų skaičių." style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
            <div style={statTitle}>Ekspedicijos projektai</div>
            <div style={statValue}>{expeditionOrdersForView.length}</div>
          </div>
          <div
            title="Rodo galimų išorinių vežėjų kiekį bendroje bazėje. Atidaro vežėjų poskyrį."
            onClick={() => openDatabaseSection("carriers")}
            style={{ ...statCard, cursor: "pointer", background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}
          >
            <div style={statTitle}>Išoriniai vežėjai</div>
            <div style={statValue}>{externalCarriers.length}</div>
          </div>
          <div
            title="Atidaro bendrą importo srautą, iš kurio vėliau bus kuriami projektai iš laiško, PDF ar screenshot."
            onClick={() => openDatabaseSection("imports")}
            style={{ ...statCard, cursor: "pointer", background: "linear-gradient(135deg, #b45309, #f59e0b)" }}
          >
            <div style={statTitle}>Import intake</div>
            <div style={{ ...statValue, fontSize: "24px" }}>Ready</div>
          </div>
        </div>

        <OrdersPage
          orders={expeditionOrdersForView}
          saveOrders={saveOrders}
          clients={clients}
          carriers={carriers}
          openModal={openOrderModal}
          title="Ekspedicijos projektai"
          showCreateButton={false}
          emptyTitle="Nėra ekspedicijos projektų"
          emptyDescription="Kurti naują ekspedicijos projektą reikia šiame modulyje."
        />
      </div>
    );
  };

  const renderOwnFleetBase = (ownFleetCarrier) => {
    const drivers = Array.isArray(ownFleetCarrier?.drivers) ? ownFleetCarrier.drivers : [];
    const trucks = Array.isArray(ownFleetCarrier?.trucks) ? ownFleetCarrier.trucks : [];
    const trailers = Array.isArray(ownFleetCarrier?.trailers) ? ownFleetCarrier.trailers : [];

    const projectCountByDriver = new Map();
    const projectCountByTruck = new Map();
    const projectCountByTrailer = new Map();

    ownTransportOrdersForView.forEach((project) => {
      const driverKey = String(project.driverName || "").trim().toLowerCase();
      const truckKey = String(project.truckPlate || "").trim().toUpperCase();
      const trailerKey = String(project.trailerPlate || "").trim().toUpperCase();

      if (driverKey) projectCountByDriver.set(driverKey, (projectCountByDriver.get(driverKey) || 0) + 1);
      if (truckKey) projectCountByTruck.set(truckKey, (projectCountByTruck.get(truckKey) || 0) + 1);
      if (trailerKey) projectCountByTrailer.set(trailerKey, (projectCountByTrailer.get(trailerKey) || 0) + 1);
    });

    return (
      <div style={{ marginTop: "20px" }}>
        <div style={pageHeaderRow}>
          <div>
            <h3 style={{ margin: 0, color: "#1e3a8a" }}>Fleet bazÄ—</h3>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              RealÅ«s vairuotojÅ³, vilkikÅ³ ir priekabÅ³ duomenys iÅ bendros veÅ¾Ä—jÅ³ bazÄ—s. Å is blokas pakeiÄ¨ia ankstesnÄÆ demo transporto ekranÄ….
            </div>
          </div>
          <button
            type="button"
            title="Atidaro vidinÄÆ fleet ÄÆraÅÄ… veÅ¾Ä—jÅ³ bazÄ—je."
            style={secondaryButton}
            onClick={() => openDatabaseSection("carriers")}
          >
            Atidaryti fleet bazÄ™
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #166534, #22c55e)" }}>
            <div style={statTitle}>Vairuotojai</div>
            <div style={statValue}>{drivers.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
            <div style={statTitle}>Vilkikai</div>
            <div style={statValue}>{trucks.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
            <div style={statTitle}>Priekabos</div>
            <div style={statValue}>{trailers.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }}>
            <div style={statTitle}>Priskirti projektai</div>
            <div style={statValue}>{ownTransportOrdersForView.length}</div>
          </div>
        </div>

        {!ownFleetCarrier && (
          <div style={{ marginBottom: "18px", padding: "18px 20px", background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px", color: "#9a3412" }}>
            Nuosavo transporto fleet dar nesukonfigÅ«ruotas. Sukurkite arba atnaujinkite veÅ¾Ä—jo ÄÆraÅÄ… su tipu <strong>Nuosavas transportas</strong> bendroje bazÄ—je.
          </div>
        )}

        {ownFleetCarrier && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
            {[
              {
                title: "Vairuotojai",
                color: "#166534",
                items: drivers.slice(0, 8).map((driver) => ({
                  key: driver.id || driver.name,
                  primary: driver.name || "-",
                  secondary: driver.phone || driver.email || "-",
                  count: projectCountByDriver.get(String(driver.name || "").trim().toLowerCase()) || 0,
                })),
              },
              {
                title: "Vilkikai",
                color: "#1e3a8a",
                items: trucks.slice(0, 8).map((truck) => {
                  const plate = truck.plateNumber || truck.plate || "-";
                  return {
                    key: truck.id || plate,
                    primary: plate,
                    secondary: truck.make || truck.model || "-",
                    count: projectCountByTruck.get(String(plate).trim().toUpperCase()) || 0,
                  };
                }),
              },
              {
                title: "Priekabos",
                color: "#0f766e",
                items: trailers.slice(0, 8).map((trailer) => {
                  const plate = trailer.plateNumber || trailer.plate || "-";
                  return {
                    key: trailer.id || plate,
                    primary: plate,
                    secondary: trailer.type || trailer.model || "-",
                    count: projectCountByTrailer.get(String(plate).trim().toUpperCase()) || 0,
                  };
                }),
              },
            ].map((group) => (
              <div key={group.title} style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: group.color, fontWeight: 700 }}>{group.title}</div>
                {group.items.length === 0 ? (
                  <div style={{ padding: "18px 16px", color: "#94a3b8" }}>NÄ—ra suvestÅ³ ÄÆraÅÅ³.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.key}>
                          <td style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.primary}</div>
                            <div style={{ color: "#64748b", fontSize: "12px" }}>{item.secondary}</div>
                          </td>
                          <td style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9", textAlign: "right", color: "#475569", whiteSpace: "nowrap" }}>
                            {item.count} projektai
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOwnTransportWorkflow = () => {
    const ownFleetCarrier = carriers.find((carrier) => carrier.isOwnCompany) || null;

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Nuosavas transportas</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Čia kuriami visi projektai, kuriuos vykdo mūsų fleet, vairuotojai ir transporto priemonės.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              title="Rankinis naujo nuosavo transporto užsakymo kūrimas."
              style={primaryButton}
              onClick={() => openOrderModal("order", null, { workflowMode: "own_transport" })}
            >
              + Naujas užsakymas
            </button>
            <button
              type="button"
              title="Atidaro bendrą klientų bazę, iš kurios pasirenkamas projekto užsakovas."
              style={secondaryButton}
              onClick={() => openDatabaseSection("clients")}
            >
              Klientų bazė
            </button>
            <button
              type="button"
              title="Paruoštas intake kelias kūrimui iš kliento laiško, PDF ar screenshot. Pilna analizė bus pajungta vėliau."
              style={secondaryButton}
              onClick={() => openDatabaseSection("imports")}
            >
              Iš email / PDF / screenshot
            </button>
          </div>
        </div>

        <div style={{ background: "#ecfdf5", border: "1px solid #86efac", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#166534", marginBottom: "6px" }}>
            Nuosavo transporto kūrimas jau atskirtas nuo ekspedicijos
          </div>
          <div style={{ color: "#475569", fontSize: "14px", lineHeight: 1.5 }}>
            Projektai šiame modelyje tik centralizuoja informaciją. Visi mūsų fleet vykdomi projektai turi būti kuriami šiame modulyje, su vairuotojo ir transporto priskyrimu.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #166534, #22c55e)" }} title="Rodo kiek projektų šiuo metu vykdo nuosavas transportas.">
            <div style={statTitle}>Fleet projektai</div>
            <div style={statValue}>{ownTransportOrdersForView.length}</div>
          </div>
          <div
            style={{ ...statCard, cursor: "pointer", background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}
            title="Rodo kiek mūsų fleet įrašų yra bendroje vežėjų bazėje. Atidaro vežėjų bazę."
            onClick={() => openDatabaseSection("carriers")}
          >
            <div style={statTitle}>Fleet bazė</div>
            <div style={statValue}>{ownFleetCarrier ? 1 : 0}</div>
          </div>
          <div
            style={{ ...statCard, cursor: "pointer", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}
            title="Naudoja esamą transporto karkasą, kuris toliau bus pildomas gyvais fleet duomenimis."
            onClick={() => openDatabaseSection("carriers")}
          >
            <div style={statTitle}>Fleet modulis</div>
            <div style={statValue}>Active</div>
          </div>
        </div>

        <OrdersPage
          orders={ownTransportOrdersForView}
          saveOrders={saveOrders}
          clients={clients}
          carriers={carriers}
          openModal={openOrderModal}
          title="Nuosavo transporto projektai"
          showCreateButton={false}
          emptyTitle="Nėra nuosavo transporto projektų"
          emptyDescription="Kurti naują fleet projektą reikia šiame modulyje."
        />

        <div style={{ marginTop: "20px" }}>
          {renderOwnFleetBase(ownFleetCarrier)}
        </div>
      </div>
    );
  };

  const renderOwnTransportBusinessWorkflow = () => {
    const ownFleetCarrier = carriers.find((carrier) => carrier.isOwnCompany) || null;
    const fallbackDrivers = ownTransportOrdersForView.map((project, index) => ({
      id: `demo-driver-${index}`,
      name: project.driverName || `Vairuotojas ${index + 1}`,
      phone: `+37060000${String(index + 1).padStart(2, "0")}`,
    }));
    const fallbackTrucks = ownTransportOrdersForView.map((project, index) => ({
      id: `demo-truck-${index}`,
      plateNumber: project.truckPlate || `TRK${index + 1}`,
      make: "Volvo",
      model: "FH",
    }));
    const fallbackTrailers = ownTransportOrdersForView.map((project, index) => ({
      id: `demo-trailer-${index}`,
      plateNumber: project.trailerPlate || `TRL${index + 1}`,
      type: "Tent",
      model: "Schmitz",
    }));

    const drivers = (Array.isArray(ownFleetCarrier?.drivers) && ownFleetCarrier.drivers.length > 0 ? ownFleetCarrier.drivers : fallbackDrivers)
      .filter((driver, index, list) => list.findIndex((item) => String(item.name || "").trim().toLowerCase() === String(driver.name || "").trim().toLowerCase()) === index);
    const trucks = (Array.isArray(ownFleetCarrier?.trucks) && ownFleetCarrier.trucks.length > 0 ? ownFleetCarrier.trucks : fallbackTrucks)
      .filter((truck, index, list) => list.findIndex((item) => String(item.plateNumber || item.plate || "").trim().toUpperCase() === String(truck.plateNumber || truck.plate || "").trim().toUpperCase()) === index);
    const trailers = (Array.isArray(ownFleetCarrier?.trailers) && ownFleetCarrier.trailers.length > 0 ? ownFleetCarrier.trailers : fallbackTrailers)
      .filter((trailer, index, list) => list.findIndex((item) => String(item.plateNumber || item.plate || "").trim().toUpperCase() === String(trailer.plateNumber || trailer.plate || "").trim().toUpperCase()) === index);

    const activeOwnFleetProjects = ownTransportOrdersForView.filter((project) => !["completed", "cancelled"].includes(String(project.status || "").toLowerCase()));
    const activeDriverNames = new Set(activeOwnFleetProjects.map((project) => String(project.driverName || "").trim().toLowerCase()).filter(Boolean));
    const activeTruckPlates = new Set(activeOwnFleetProjects.map((project) => String(project.truckPlate || "").trim().toUpperCase()).filter(Boolean));
    const busyTodayCount = activeOwnFleetProjects.filter((project) => project.loadingDate || project.unloadingDate).length;

    const driverRows = drivers.map((driver) => {
      const driverName = String(driver.name || "").trim();
      const normalizedDriverName = driverName.toLowerCase();
      const currentProject = activeOwnFleetProjects.find((project) => String(project.driverName || "").trim().toLowerCase() === normalizedDriverName);
      const assignedTruck = currentProject?.truckPlate || "—";
      const projectCount = ownTransportOrdersForView.filter((project) => String(project.driverName || "").trim().toLowerCase() === normalizedDriverName).length;
      const status = currentProject ? "Važiuoja" : projectCount > 0 ? "Laukia krovinio" : "Laisvas";

      return {
        id: driver.id || driverName,
        name: driverName || "—",
        phone: driver.phone || driver.email || "—",
        status,
        assignedTruck,
        projectCount,
      };
    });

    const fleetRows = trucks.map((truck) => {
      const truckPlate = truck.plateNumber || truck.plate || "—";
      const currentProject = activeOwnFleetProjects.find((project) => String(project.truckPlate || "").trim().toUpperCase() === String(truckPlate).trim().toUpperCase());
      const trailer = currentProject?.trailerPlate || "—";
      const driver = currentProject?.driverName || "—";
      const status = currentProject ? "Užimtas" : "Laisvas";

      return {
        id: truck.id || truckPlate,
        truckPlate,
        trailer,
        driver,
        status,
        currentProject: currentProject?.projectId || currentProject?.orderNumber || "—",
      };
    });

    const occupancyGroups = {
      moving: activeOwnFleetProjects.filter((project) => ["in_progress", "active"].includes(String(project.status || "").toLowerCase())),
      free: driverRows.filter((driver) => driver.status === "Laisvas"),
      waiting: driverRows.filter((driver) => driver.status === "Laukia krovinio"),
      busyToday: activeOwnFleetProjects,
    };

    const ownFleetFinanceSummary = ownTransportOrdersForView.reduce(
      (acc, project) => {
        const income = Number(project.clientPrice || 0);
        const cost = Number(project.carrierPrice || project.executionCost || 0);
        acc.income += income;
        acc.cost += cost;
        acc.profit += income - cost;
        if (!["completed", "cancelled"].includes(String(project.status || "").toLowerCase())) {
          acc.active += 1;
        }
        return acc;
      },
      { income: 0, cost: 0, profit: 0, active: 0 }
    );

    const tabs = [
      { key: "projects", label: "Projektai" },
      { key: "drivers", label: "Vairuotojai" },
      { key: "fleet", label: "Vilkikai / priekabos" },
      { key: "occupancy", label: "Užimtumas" },
      { key: "profitability", label: "Pelningumas" },
    ];

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Nuosavas transportas</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Čia valdomi projektai, kuriuos vykdo mūsų įmonės transportas, vairuotojai ir fleet.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" title="Sukurti naują own_fleet projektą rankiniu būdu." style={primaryButton} onClick={() => openOrderModal("order", null, { workflowMode: "own_transport" })}>+ Naujas krovinys</button>
            <button type="button" title="Atidaro bendrą fleet bazę." style={secondaryButton} onClick={() => openDatabaseSection("carriers")}>Fleet bazė</button>
            <button type="button" title="Perjungia į vairuotojų poskyrį." style={secondaryButton} onClick={() => setOwnTransportTab("drivers")}>Vairuotojai</button>
            <button type="button" title="Atidaro importo srautą laiškui, PDF ar screenshot." style={secondaryButton} onClick={() => openDatabaseSection("imports")}>Iš email / PDF / screenshot</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #166534, #22c55e)" }}>
            <div style={statTitle}>Aktyvūs own_fleet projektai</div>
            <div style={statValue}>{activeOwnFleetProjects.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
            <div style={statTitle}>Aktyvūs vairuotojai</div>
            <div style={statValue}>{activeDriverNames.size}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
            <div style={statTitle}>Aktyvūs vilkikai</div>
            <div style={statValue}>{activeTruckPlates.size}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }}>
            <div style={statTitle}>Šiandien užimti</div>
            <div style={statValue}>{busyTodayCount}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setOwnTransportTab(tab.key)}
              style={{
                background: ownTransportTab === tab.key ? "linear-gradient(135deg, #166534, #22c55e)" : "#f8fafc",
                color: ownTransportTab === tab.key ? "white" : "#475569",
                border: ownTransportTab === tab.key ? "none" : "1px solid #e2e8f0",
                padding: "8px 16px",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {ownTransportTab === "projects" && (
          <OrdersPage
            orders={ownTransportOrdersForView}
            saveOrders={saveOrders}
            clients={clients}
            carriers={carriers}
            openModal={openOrderModal}
            title="Own_fleet projektai"
            showCreateButton={false}
            emptyTitle="Nėra own_fleet projektų"
            emptyDescription="Kurti naują own_fleet projektą reikia šiame modulyje."
            variant="own_fleet"
          />
        )}

        {ownTransportTab === "drivers" && (
          <div style={pageCard}>
            <div style={cardHeader}>
              <h2 style={cardTitle}>Vairuotojai ({driverRows.length})</h2>
            </div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Vardas Pavardė</th>
                  <th style={th}>Telefonas</th>
                  <th style={th}>Statusas</th>
                  <th style={th}>Priskirtas vilkikas</th>
                  <th style={th}>Aktyvūs projektai</th>
                  <th style={th}>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {driverRows.map((driver) => (
                  <tr key={driver.id}>
                    <td style={td}>{driver.name}</td>
                    <td style={td}>{driver.phone}</td>
                    <td style={td}><span style={statusBadgeStyle(driver.status === "Važiuoja" ? "in_progress" : driver.status === "Laukia krovinio" ? "confirmed" : "draft")}>{driver.status}</span></td>
                    <td style={td}>{driver.assignedTruck}</td>
                    <td style={td}>{driver.projectCount}</td>
                    <td style={td}><button type="button" style={smallActionButton} onClick={() => openDatabaseSection("carriers")}>Atidaryti fleet bazę</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ownTransportTab === "fleet" && (
          <div style={pageCard}>
            <div style={cardHeader}>
              <h2 style={cardTitle}>Vilkikai / priekabos ({fleetRows.length})</h2>
            </div>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Vilkikas</th>
                  <th style={th}>Priekaba</th>
                  <th style={th}>Vairuotojas</th>
                  <th style={th}>Statusas</th>
                  <th style={th}>Dabartinis projektas</th>
                  <th style={th}>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {fleetRows.map((row) => (
                  <tr key={row.id}>
                    <td style={td}>{row.truckPlate}</td>
                    <td style={td}>{row.trailer}</td>
                    <td style={td}>{row.driver}</td>
                    <td style={td}><span style={statusBadgeStyle(row.status === "Užimtas" ? "in_progress" : "draft")}>{row.status}</span></td>
                    <td style={td}>{row.currentProject}</td>
                    <td style={td}><button type="button" style={smallActionButton} onClick={() => openDatabaseSection("carriers")}>Atidaryti fleet bazę</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ownTransportTab === "occupancy" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              { title: "Kas dabar važiuoja", items: occupancyGroups.moving.map((project) => `${project.driverName || "—"} / ${project.route || "—"}`), color: "#166534" },
              { title: "Kas laisvas", items: occupancyGroups.free.map((driver) => driver.name), color: "#475569" },
              { title: "Kas laukia krovinio", items: occupancyGroups.waiting.map((driver) => driver.name), color: "#b45309" },
              { title: "Kas užimtas šiandien", items: occupancyGroups.busyToday.map((project) => `${project.truckPlate || "—"} / ${project.loadingDate || "—"}`), color: "#1e3a8a" },
            ].map((group) => (
              <div key={group.title} style={{ background: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", padding: "18px 20px" }}>
                <div style={{ fontWeight: 800, color: group.color, marginBottom: "12px" }}>{group.title}</div>
                {group.items.length === 0 ? (
                  <div style={{ color: "#94a3b8" }}>Nėra įrašų</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {group.items.map((item) => (
                      <div key={item} style={{ padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", color: "#334155", fontSize: "13px" }}>{item}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {ownTransportTab === "profitability" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
              <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}><div style={statTitle}>Pajamos</div><div style={statValue}>{ownFleetFinanceSummary.income.toFixed(0)} €</div></div>
              <div style={{ ...statCard, background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}><div style={statTitle}>Savikaina</div><div style={statValue}>{ownFleetFinanceSummary.cost.toFixed(0)} €</div></div>
              <div style={{ ...statCard, background: "linear-gradient(135deg, #166534, #22c55e)" }}><div style={statTitle}>Pelnas</div><div style={statValue}>{ownFleetFinanceSummary.profit.toFixed(0)} €</div></div>
              <div style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }}><div style={statTitle}>Aktyvūs projektai</div><div style={statValue}>{ownFleetFinanceSummary.active}</div></div>
            </div>

            <div style={pageCard}>
              <div style={cardHeader}>
                <h2 style={cardTitle}>Own_fleet pelningumas</h2>
              </div>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Projektas</th>
                    <th style={th}>Klientas</th>
                    <th style={th}>Pajamos</th>
                    <th style={th}>Savikaina</th>
                    <th style={th}>Pelnas</th>
                    <th style={th}>Statusas</th>
                  </tr>
                </thead>
                <tbody>
                  {ownTransportOrdersForView.map((project) => {
                    const income = Number(project.clientPrice || 0);
                    const cost = Number(project.carrierPrice || project.executionCost || 0);
                    const profit = income - cost;
                    return (
                      <tr key={project.id}>
                        <td style={td}>{project.projectId || project.orderNumber || "—"}</td>
                        <td style={td}>{project.clientName || "—"}</td>
                        <td style={td}>{income.toFixed(2)} €</td>
                        <td style={td}>{cost.toFixed(2)} €</td>
                        <td style={{ ...td, fontWeight: 700, color: profit >= 0 ? "#059669" : "#dc2626" }}>{profit.toFixed(2)} €</td>
                        <td style={td}><span style={statusBadgeStyle(project.status)}>{statusLabel(project.status)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDatabase = () => {
    const tabs = [
      { key: "clients", label: "Klientai", title: "Bendra klientų bazė visai sistemai." },
      { key: "carriers", label: "Vežėjai", title: "Bendra vežėjų bazė visai sistemai." },
      { key: "imports", label: "Importas", title: "Importas, pildantis tas pačias bendras bazes." }
    ];

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Duomenų bazė</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Bendra klientų, vežėjų ir importo bazė, naudojama Projektuose, Ekspedijavime ir Nuosavame transporte.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              title={tab.title}
              onClick={() => openDatabaseSection(tab.key)}
              style={{
                background: databaseSection === tab.key ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "#f8fafc",
                color: databaseSection === tab.key ? "white" : "#475569",
                border: databaseSection === tab.key ? "none" : "1px solid #e2e8f0",
                padding: "10px 18px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "18px", padding: "16px 18px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", color: "#334155", fontSize: "14px", lineHeight: 1.5 }}>
          Šios bazės yra bendros visai sistemai. Iš jų turi būti renkami klientai ir vežėjai kuriant projektus bei užsakymus, o importas turi pildyti tas pačias bendras duomenų struktūras.
        </div>

        {databaseSection === "clients" && renderClients()}
        {databaseSection === "carriers" && renderCarriers()}
        {databaseSection === "imports" && renderImports()}
      </div>
    );
  };

  const renderImportHub = () => {
    const tabs = [
      { key: "imports", label: "Importas", title: "Importas, pildantis tas pačias bendras bazes." },
      { key: "clients", label: "Klientai", title: "Bendra klientų bazė visai sistemai." },
      { key: "carriers", label: "Vežėjai", title: "Bendra vežėjų, fleet ir kontaktų bazė visai sistemai." }
    ];

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Importas</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Importo ir master-data modulis, iš kurio pildomos bendros klientų, vežėjų, fleet ir kontaktų bazės visai sistemai.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              title={tab.title}
              onClick={() => openDatabaseSection(tab.key)}
              style={{
                background: databaseSection === tab.key ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "#f8fafc",
                color: databaseSection === tab.key ? "white" : "#475569",
                border: databaseSection === tab.key ? "none" : "1px solid #e2e8f0",
                padding: "10px 18px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "18px", padding: "16px 18px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "12px", color: "#334155", fontSize: "14px", lineHeight: 1.5 }}>
          Šiame modulyje nebelieka atskiro top-level „Duomenų bazė“ ekrano. Importas, klientai ir vežėjai yra vienas bendras vidinis duomenų šaltinis, naudojamas Projektuose, Ekspedijavime ir Nuosavame transporte.
        </div>

        {databaseSection === "imports" && renderImports()}
        {databaseSection === "clients" && renderClients()}
        {databaseSection === "carriers" && renderCarriers()}
      </div>
    );
  };

  const renderClients = () => {
    const q = clientSearch.trim().toLowerCase();
    const filtered = q
      ? clients.filter(c =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.companyCode || "").toLowerCase().includes(q) ||
          (c.vatCode || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
        )
      : clients;
    const directClientsCount = clients.filter((client) => client.clientType === "Tiesioginis klientas").length;
    const forwarderClientsCount = clients.filter((client) => client.clientType === "Ekspeditorius").length;
    const activeClientsCount = clients.filter((client) => {
      const byId = clientUsageMap.get(`id:${String(client.id)}`) || 0;
      const byName = clientUsageMap.get(`name:${String(client.name || "").trim().toLowerCase()}`) || 0;
      return Math.max(byId, byName) > 0;
    }).length;

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Klientai ({clients.length})</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Bendra klientų bazė visam app: Projektams, Ekspedijavimui ir Nuosavam transportui.
            </div>
          </div>
          <button style={primaryButton} onClick={openNewClientModal}>+ Naujas klientas</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "18px" }}>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }} title="Bendras klientų kiekis sistemoje.">
            <div style={statTitle}>Viso klientų</div>
            <div style={statValue}>{clients.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #0f766e, #14b8a6)" }} title="Tiesioginių klientų kiekis bendroje bazėje.">
            <div style={statTitle}>Tiesioginiai</div>
            <div style={statValue}>{directClientsCount}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #7c3aed, #a855f7)" }} title="Ekspeditorių tipo klientų kiekis bendroje bazėje.">
            <div style={statTitle}>Ekspeditoriai</div>
            <div style={statValue}>{forwarderClientsCount}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }} title="Kiek klientų šiuo metu susieta su projektų įrašais.">
            <div style={statTitle}>Naudojami projektuose</div>
            <div style={statValue}>{activeClientsCount}</div>
          </div>
        </div>

        {clients.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Ieškoti pagal pavadinimą, kodą, PVM ar el. paštą..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 14px", fontSize: "14px", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
        )}

        {clients.length === 0 && <p style={emptyText}>Kol kas nėra klientų.</p>}

        {clients.length > 0 && filtered.length === 0 && (
          <p style={emptyText}>Nerasta klientų pagal paiešką.</p>
        )}

        {filtered.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ ...thStyle, textAlign: "right", width: "48px", color: "#94a3b8" }}>Nr.</th>
                <th style={thStyle}>Pavadinimas</th>
                <th style={thStyle}>Tipas</th>
                <th style={thStyle}>Įmonės kodas</th>
                <th style={thStyle}>PVM kodas</th>
                <th style={thStyle}>El. paštas</th>
                <th style={thStyle}>Kontaktai</th>
                <th style={thStyle}>Skyriai</th>
                <th style={thStyle}>Projektai</th>
                <th style={thStyle}>Veiksmai</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id}>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#94a3b8", fontSize: "13px" }}>{index + 1}</td>
                  <td style={tdStyle}>
                    <button onClick={() => openClientProfile(item.id)} style={linkButtonStyle}>
                      {item.name}
                    </button>
                  </td>
                  <td style={tdStyle}>{item.clientType || "-"}</td>
                  <td style={tdStyle}>{item.companyCode}</td>
                  <td style={tdStyle}>{item.vatCode}</td>
                  <td style={tdStyle}>{item.email}</td>
                  <td style={tdStyle}>{item.contacts ? item.contacts.filter((contact) => contact.name || contact.email || contact.phone).length : 0}</td>
                  <td style={tdStyle}>{item.departmentContacts ? item.departmentContacts.filter((dep) => dep.title || dep.phone || dep.email).length : 0}</td>
                  <td style={tdStyle}>
                    {clientUsageMap.get(`id:${String(item.id)}`) || clientUsageMap.get(`name:${String(item.name || "").trim().toLowerCase()}`) || 0}
                  </td>
                  <td style={tdStyle}>
                    <button style={smallActionButton} onClick={() => openClientProfile(item.id)}>Peržiūrėti</button>
                    <button style={smallEditButton} onClick={() => openEditClientModal(item)}>Redaguoti</button>
                    <button style={dangerActionButton} onClick={() => handleDeleteClient(item.id)}>Šalinti</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderCarriers = () => {
    const safeCarriers = Array.isArray(carriers) ? carriers : [];
    const q = carrierSearch.trim().toLowerCase();
    const filteredBySearch = q
      ? safeCarriers.filter(c =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.companyCode || "").toLowerCase().includes(q) ||
          (c.vatCode || "").toLowerCase().includes(q) ||
          (c.address || "").toLowerCase().includes(q)
        )
      : safeCarriers;
    const filtered = filteredBySearch.filter((carrier) => matchesCarrierDocumentFilter(carrier, carriersFilter));
    const ownFleetCount = safeCarriers.filter((carrier) => carrier.isOwnCompany || carrier.carrierType === "Nuosavas transportas").length;
    const externalCarrierCount = safeCarriers.length - ownFleetCount;
    const activeCarrierCount = safeCarriers.filter((carrier) => {
      const byId = carrierUsageMap.get(`id:${String(carrier.id)}`) || 0;
      const byName = carrierUsageMap.get(`name:${String(carrier.name || "").trim().toLowerCase()}`) || 0;
      return Math.max(byId, byName) > 0;
    }).length;

    return (
    <div>
      <div style={pageHeaderRow}>
        <div>
          <h2 style={{ margin: 0, color: "#1e3a8a" }}>Vežėjai ({carriers.length})</h2>
          <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
            Bendra vežėjų ir fleet bazė ekspedicijai, nuosavam transportui ir vykdymo workflow.
          </div>
        </div>
        <button style={primaryButton} onClick={openNewCarrierModal}>+ Pridėti Vežėją</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "18px" }}>
        <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
          <div style={statTitle}>Viso vežėjų</div>
          <div style={statValue}>{carriers.length}</div>
        </div>
        <div style={{ ...statCard, background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
          <div style={statTitle}>Išoriniai</div>
          <div style={statValue}>{externalCarrierCount}</div>
        </div>
        <div style={{ ...statCard, background: "linear-gradient(135deg, #166534, #22c55e)" }}>
          <div style={statTitle}>Nuosavas fleet</div>
          <div style={statValue}>{ownFleetCount}</div>
        </div>
        <div style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }}>
          <div style={statTitle}>Naudojami projektuose</div>
          <div style={statValue}>{activeCarrierCount}</div>
        </div>
      </div>

      {safeCarriers.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Ieškoti pagal pavadinimą, kodą, PVM ar miestą..."
            value={carrierSearch}
            onChange={(e) => setCarrierSearch(e.target.value)}
            style={{ width: "100%", padding: "9px 14px", fontSize: "14px", border: "1px solid #cbd5e1", borderRadius: "6px", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}

      {carriers.length === 0 && <p style={emptyText}>Kol kas nėra vežėjų.</p>}

      {safeCarriers.length > 0 && filtered.length === 0 && (
        <p style={emptyText}>Nerasta vežėjų pagal paiešką.</p>
      )}

      {filtered.length > 0 && (
        <table style={{ ...tableStyle, tableLayout: "auto" }}>
          <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ ...thStyle, textAlign: "right", width: "48px", color: "#94a3b8" }}>Nr.</th>
                <th style={thStyle}>PAVADINIMAS</th>
                <th style={thStyle}>TIPAS</th>
                <th style={thStyle}>ĮMONĖS KODAS</th>
                <th style={thStyle}>PVM KODAS</th>
                <th style={thStyle}>PROJEKTAI</th>
                <th style={thStyle}>VADYB.</th>
                <th style={thStyle}>FLEET</th>
                <th style={thStyle}>CMR DRAUDIMAS</th>
                <th style={thStyle}>LICENCIJA</th>
                <th style={thStyle}>DOKUMENTŲ BŪKLĖ</th>
                <th style={thStyle}>KONTAKTAS</th>
                <th style={thStyle}>VEIKSMAI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => {
              const health = getCarrierDocumentHealth(item);
              const cmr = health.cmrDocument;
              const lic = health.licenseDocument;
              const cmrStatus = getCarrierDocumentStatusMeta("cmr", health);
              const licenseStatus = getCarrierDocumentStatusMeta("license", health);

              return (
                <tr key={item.id} style={{ background: "#f8fafc" }}>
                  <td style={{ ...tdStyle, textAlign: "right", color: "#94a3b8", fontSize: "13px", whiteSpace: "nowrap" }}>{index + 1}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap", fontWeight: "700" }}><button onClick={() => openCarrierProfile(item.id)} style={linkButtonStyle}>{item.name || "-"}</button></td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                      {item.carrierType === "Nuosavas transportas" ? "Nuosavas" : item.carrierType || "-"}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.companyCode || "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.vatCode || "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {carrierUsageMap.get(`id:${String(item.id)}`) || carrierUsageMap.get(`name:${String(item.name || "").trim().toLowerCase()}`) || 0}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.managerContacts?.filter((contact) => contact.name || contact.email || contact.phone).length || 0}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    {(item.trucks?.length || 0) + (item.trailers?.length || 0) + (item.drivers?.length || 0)}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={getDocumentStatusBadgeStyle(cmrStatus.tone)}>{cmrStatus.label}</span>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        {cmr?.validUntil ? `Galioja iki ${fmtDate(cmr.validUntil)}` : "Dokumentas neįkeltas"}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={getDocumentStatusBadgeStyle(licenseStatus.tone)}>{licenseStatus.label}</span>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        {lic?.validUntil ? `Galioja iki ${fmtDate(lic.validUntil)}` : "Dokumentas neįkeltas"}
                      </span>
                    </div>
                  </td>

                  <td style={{ ...tdStyle, minWidth: "240px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ fontSize: "13px", color: cmrStatus.tone === "danger" ? "#991b1b" : cmrStatus.tone === "warning" ? "#b45309" : "#166534", fontWeight: 700 }}>
                        CMR: {cmrStatus.label}
                      </div>
                      <div style={{ fontSize: "13px", color: licenseStatus.tone === "danger" ? "#991b1b" : licenseStatus.tone === "warning" ? "#b45309" : "#166534", fontWeight: 700 }}>
                        Licenzija: {licenseStatus.label}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        {cmr?.link ? <button style={smallActionButton} onClick={() => openCarrierDocumentModal(item, cmr)}>CMR</button> : null}
                        {lic?.link ? <button style={smallActionButton} onClick={() => openCarrierDocumentModal(item, lic)}>LIC</button> : null}
                      </div>
                    </div>
                  </td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.phone || "-"}</td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <button style={smallActionButton} onClick={() => openEditCarrierModal(item)}>Papildyti dokumentus</button>
                      <button style={smallEditButton} onClick={() => openEditCarrierModal(item)}>Redaguoti</button>
                      <button style={dangerActionButton} onClick={() => handleDeleteCarrier(item.id)}>Šalinti</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

  const matchesProjectRegistryFilter = (order, filterKey) => {
    const status = String(order.status || "").toLowerCase();
    const cmrMissing = !order.cmrStatus || order.cmrStatus === "missing";
    const carrierInvoiceMissing = order.orderType !== "own_transport" && (!order.carrierInvoiceStatus || order.carrierInvoiceStatus === "missing");
    const clientInvoiceMissing = !order.clientInvoiceStatus || order.clientInvoiceStatus === "missing";

    if (filterKey === "all") return true;
    if (filterKey === "expedition") return order.orderType !== "own_transport";
    if (filterKey === "own_fleet") return order.orderType === "own_transport";
    if (filterKey === "active") return !["completed", "cancelled"].includes(status);
    if (filterKey === "docs_pending") return cmrMissing;
    if (filterKey === "unpaid") return carrierInvoiceMissing || clientInvoiceMissing;
    if (filterKey === "completed") return status === "completed";
    return true;
  };

  const renderOrders = () => {
    const orderFilters = ["Visi", "Šiandien", "Vėluojantys", "Laukia dokumentų", "Neapmokėta"];
    return (
      <div>
        {import.meta.env.DEV && (
          <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: "8px", minWidth: "360px", flex: "1 1 360px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }} title="BÅ«simÅ³ projektÅ³ bucket diagnostinÄ— suvestinÄ—.">
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Projects</div>
                <div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.projects}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }} title="BÅ«simÅ³ execution bucket diagnostinÄ— suvestinÄ—.">
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Executions</div>
                <div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.executions}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }} title="BÅ«simÅ³ document rules bucket diagnostinÄ— suvestinÄ—.">
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Doc Rules</div>
                <div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.documentRules}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }} title="BÅ«simÅ³ finansÅ³ bucket diagnostinÄ— suvestinÄ—.">
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Finance</div>
                <div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.financeStates}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }} title="BÅ«simÅ³ prisegtÅ³ dokumentÅ³ bucket diagnostinÄ— suvestinÄ—.">
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Attachments</div>
                <div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.attachments}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }} title="BÅ«simÅ³ projekto istorijos bucket diagnostinÄ— suvestinÄ—.">
                <div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>History</div>
                <div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.projectHistoryEvents}</div>
              </div>
            </div>
            {lastFuturePersistInfo && (
              <div style={{ minWidth: "360px", flex: "1 1 360px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "10px 12px" }} title="Paskutinio Future Domain save diagnostinė santrauka.">
                <div style={{ color: "#1e3a8a", fontSize: "12px", fontWeight: 800, marginBottom: "6px" }}>Last Future Persist</div>
                <div style={{ color: "#475569", fontSize: "12px", marginBottom: "6px" }}>{lastFuturePersistInfo.ranAt}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(90px, 1fr))", gap: "6px", marginBottom: "8px" }}>
                  <div style={observerMiniStat}>P: {lastFuturePersistInfo.summary.projects}</div>
                  <div style={observerMiniStat}>E: {lastFuturePersistInfo.summary.executions}</div>
                  <div style={observerMiniStat}>F: {lastFuturePersistInfo.summary.financeStates}</div>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.45 }}>
                  projectId: {lastFuturePersistInfo.ids.projectId || "—"}<br />
                  executionId: {lastFuturePersistInfo.ids.executionId || "—"}
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={resetFutureDomainState}
              title="Išvalo tik future-domain bucketus ir paskutinio persist diagnostiką. Legacy orders neliečiami."
              style={secondaryButton}
            >
              Clear Future Buckets
            </button>
            <button
              type="button"
              onClick={() =>
                setOrderPersistTarget((current) =>
                  current === ORDER_DRAFT_PERSIST_TARGETS.LEGACY
                    ? ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN
                    : ORDER_DRAFT_PERSIST_TARGETS.LEGACY
                )
              }
              title="Perjungia tik diagnostinÄÆ order persist target. Default iÅlieka legacy."
              style={{
                ...secondaryButton,
                background: orderPersistTarget === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN ? "#b45309" : secondaryButton.background,
              }}
            >
              Persist Target: {orderPersistTarget === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN ? "Future Domain" : "Legacy"}
            </button>
            <button
              type="button"
              onClick={handleRunMigrationDryRun}
              disabled={migrationDryRunLoading}
              title="Paleidžia tik diagnostinį legacy orders dry-run. Nieko nerašo į aktyvų state."
              style={secondaryButton}
            >
              {migrationDryRunLoading ? "Running..." : "Run migration dry-run"}
            </button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          {orderFilters.map((label, idx) => (
            <button
              key={label}
              onClick={() => alert("Funkcija dar neveikia")}
              style={{
                background: idx === 0 ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "#f1f5f9",
                color: idx === 0 ? "white" : "#475569",
                border: idx === 0 ? "none" : "1px solid #e2e8f0",
                padding: "7px 16px",
                borderRadius: "20px",
                cursor: "pointer",
                fontWeight: idx === 0 ? 700 : 500,
                fontSize: "13px"
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <OrdersPage
          orders={registryOrdersForView}
          saveOrders={saveOrders}
          clients={clients}
          carriers={carriers}
          openModal={openOrderModal}
          title="Projektų registras"
          showCreateButton={false}
          emptyTitle="Projektų registre įrašų nėra"
          emptyDescription="Projektai kuriami tik Ekspedijavimo arba Nuosavo transporto moduliuose."
        />
      </div>
    );
  };

  const renderProjectsRegistry = () => {
    const projectFilters = [
      { key: "all", label: "Visi" },
      { key: "expedition", label: "Ekspedijavimas" },
      { key: "own_fleet", label: "Nuosavas transportas" },
      { key: "active", label: "Aktyvūs" },
      { key: "docs_pending", label: "Laukia dokumentų" },
      { key: "unpaid", label: "Neapmokėta" },
      { key: "completed", label: "Užbaigti" },
    ];
    const filteredRegistryOrders = registryOrdersForView.filter((order) =>
      matchesProjectRegistryFilter(order, projectRegistryFilter)
    );

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Projektai</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Čia matomi visi kroviniai / projektai: tiek ekspedijavimas, tiek nuosavas transportas.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
          {projectFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setProjectRegistryFilter(filter.key)}
              style={{
                background: projectRegistryFilter === filter.key ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "#f8fafc",
                color: projectRegistryFilter === filter.key ? "white" : "#475569",
                border: projectRegistryFilter === filter.key ? "none" : "1px solid #e2e8f0",
                padding: "8px 16px",
                borderRadius: "999px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px"
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <OrdersPage
          orders={filteredRegistryOrders}
          saveOrders={saveOrders}
          clients={clients}
          carriers={carriers}
          openModal={openOrderModal}
          title="Projektų registras"
          showCreateButton={false}
          emptyTitle="Projektų registre įrašų nėra"
          emptyDescription="Projektai kuriami tik Ekspedijavimo arba Nuosavo transporto moduliuose."
          variant="projects"
        />

        {import.meta.env.DEV && (
          <details style={{ marginTop: "18px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 16px" }}>
            <summary style={{ cursor: "pointer", color: "#475569", fontWeight: 700 }}>Techninė informacija</summary>
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(120px, 1fr))", gap: "8px", minWidth: "360px", flex: "1 1 360px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>Projects</div><div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.projects}</div></div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>Executions</div><div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.executions}</div></div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>Doc Rules</div><div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.documentRules}</div></div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>Finance</div><div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.financeStates}</div></div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>Attachments</div><div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.attachments}</div></div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}><div style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase" }}>History</div><div style={{ color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>{futureDomainStateSummary.projectHistoryEvents}</div></div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={resetFutureDomainState} style={secondaryButton}>Clear Future Buckets</button>
                <button
                  type="button"
                  onClick={() =>
                    setOrderPersistTarget((current) =>
                      current === ORDER_DRAFT_PERSIST_TARGETS.LEGACY
                        ? ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN
                        : ORDER_DRAFT_PERSIST_TARGETS.LEGACY
                    )
                  }
                  style={{
                    ...secondaryButton,
                    background: orderPersistTarget === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN ? "#b45309" : secondaryButton.background,
                  }}
                >
                  Persist Target: {orderPersistTarget === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN ? "Future Domain" : "Legacy"}
                </button>
                <button type="button" onClick={handleRunMigrationDryRun} disabled={migrationDryRunLoading} style={secondaryButton}>
                  {migrationDryRunLoading ? "Running..." : "Run migration dry-run"}
                </button>
              </div>
            </div>
          </details>
        )}
      </div>
    );
  };

  const renderEkspedijavimasBusinessWorkflow = () => {
    const externalCarriers = carriers.filter((carrier) => !carrier.isOwnCompany);

    const actionCards = [
      {
        title: "Naujas rankinis krovinys",
        text: "Sukurti naują projektą rankiniu būdu iš formos.",
        button: "+ Naujas krovinys",
        onClick: () => openOrderModal("order", null, { workflowMode: "expedition" }),
        accent: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
      },
      {
        title: "Iš kliento laiško / PDF",
        text: "Įkelti laišką, PDF ar screenshot ir paruošti juodraštį iš dokumento.",
        button: "Atidaryti importą",
        onClick: () => openDatabaseSection("imports"),
        accent: "linear-gradient(135deg, #b45309, #f59e0b)",
      },
      {
        title: "Iš duomenų bazės",
        text: "Pasirinkti klientą ir vežėją iš esamos bazės.",
        button: "Atidaryti bazes",
        onClick: () => openDatabaseSection("clients"),
        accent: "linear-gradient(135deg, #0f766e, #14b8a6)",
      },
    ];

    return (
      <div>
        <div style={pageHeaderRow}>
          <div>
            <h2 style={{ margin: 0, color: "#1e3a8a" }}>Ekspedijavimas</h2>
            <div style={{ marginTop: "6px", color: "#64748b", fontSize: "14px" }}>
              Čia kuriami projektai, kuriuos vykdo išoriniai vežėjai.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" title="Sukurti naują ekspedicinį projektą rankiniu būdu." style={primaryButton} onClick={() => openOrderModal("order", null, { workflowMode: "expedition" })}>+ Naujas krovinys</button>
            <button type="button" title="Atidaro bendrą klientų bazę." style={secondaryButton} onClick={() => openDatabaseSection("clients")}>Klientų bazė</button>
            <button type="button" title="Atidaro bendrą vežėjų bazę." style={secondaryButton} onClick={() => openDatabaseSection("carriers")}>Vežėjų bazė</button>
            <button type="button" title="Atidaro importo srautą laiškui, PDF ar screenshot." style={secondaryButton} onClick={() => openDatabaseSection("imports")}>Iš email / PDF / screenshot</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", marginBottom: "20px" }}>
          {actionCards.map((card) => (
            <div key={card.title} style={{ background: "white", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: card.accent, marginBottom: "14px" }} />
              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "16px", marginBottom: "8px" }}>{card.title}</div>
              <div style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.5, minHeight: "42px", marginBottom: "16px" }}>{card.text}</div>
              <button type="button" style={secondaryButton} onClick={card.onClick}>{card.button}</button>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
            <div style={statTitle}>Ekspedicijos projektai</div>
            <div style={statValue}>{expeditionOrdersForView.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #0f766e, #14b8a6)" }}>
            <div style={statTitle}>Vežėjų bazė</div>
            <div style={statValue}>{externalCarriers.length}</div>
          </div>
          <div style={{ ...statCard, background: "linear-gradient(135deg, #b45309, #f59e0b)" }}>
            <div style={statTitle}>Laukia CMR / SF</div>
            <div style={statValue}>{expeditionOrdersForView.filter((order) => matchesProjectRegistryFilter(order, "docs_pending") || matchesProjectRegistryFilter(order, "unpaid")).length}</div>
          </div>
        </div>

        <OrdersPage
          orders={expeditionOrdersForView}
          saveOrders={saveOrders}
          clients={clients}
          carriers={carriers}
          openModal={openOrderModal}
          title="Ekspedicijos projektai"
          showCreateButton={false}
          emptyTitle="Nėra ekspedicijos projektų"
          emptyDescription="Nauji ekspedicijos projektai kuriami šiame modulyje."
          variant="expedition"
        />
      </div>
    );
  };

  const renderSettings = () => {
    return <SettingsPage settings={settings} saveSettings={saveSettings} />;
  };

  const renderImports = () => {
    const q = importSearch.trim().toLowerCase();
    const filtered = q
      ? imports.filter(imp =>
          (imp.name || "").toLowerCase().includes(q) ||
          (imp._country || "").toLowerCase().includes(q) ||
          (imp._city || "").toLowerCase().includes(q) ||
          (imp.companyCode || "").toLowerCase().includes(q) ||
          (imp.vatCode || "").toLowerCase().includes(q)
        )
      : imports;

    return (
      <div>
        <div style={pageHeaderRow}>
          <h2 style={{ margin: 0, color: "#1e3a8a" }}>Importas ({imports.length})</h2>
          <div>
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
            <button
              onClick={() => importFileRef.current.click()}
              style={{
                padding: "8px 16px",
                backgroundColor: "#1e3a8a",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = "#1e40af"; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = "#1e3a8a"; }}
            >
              + Importuoti
            </button>
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Ieškoti pagal pavadinimą, šalį, miestą ar kodą..."
            value={importSearch}
            onChange={(e) => setImportSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px",
              fontSize: "14px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              outline: "none",
              boxSizing: "border-box"
            }}
          />
        </div>

        {imports.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: "16px" }}>
            Nėra importuotų įmonių
          </div>
        )}

        {imports.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: "16px" }}>
            Nerasta įmonių pagal paiešką
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ backgroundColor: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                  <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#94a3b8", width: "48px" }}>Nr.</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Pavadinimas</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Šalis</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Miestas</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>Įmonės kodas</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: 600 }}>PVM kodas</th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>Veiksmai</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((imp, index) => (
                  <tr
                    key={imp.id}
                    style={{
                      borderBottom: "1px solid #dee2e6",
                      backgroundColor: index % 2 === 0 ? "white" : "#f8f9fa"
                    }}
                  >
                    <td style={{ padding: "12px", textAlign: "right", color: "#94a3b8", fontSize: "13px" }}>{index + 1}</td>
                    <td style={{ padding: "12px" }}>{imp.name}</td>
                    <td style={{ padding: "12px" }}>{imp._country || "-"}</td>
                    <td style={{ padding: "12px" }}>{imp._city || "-"}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>{imp.companyCode || "-"}</td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "#666" }}>{imp.vatCode || "-"}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => moveImportToClients(imp.id)}
                        style={{ padding: "6px 12px", marginRight: "8px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = "#218838"; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = "#28a745"; }}
                      >
                        → Klientai
                      </button>
                      <button
                        onClick={() => moveImportToCarriers(imp.id)}
                        style={{ padding: "6px 12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = "#0056b3"; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = "#007bff"; }}
                      >
                        → Vežėjai
                      </button>
                      <button
                        onClick={() => deleteImport(imp.id)}
                        title="Ištrinti"
                        style={{ padding: "6px 10px", marginLeft: "8px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: 700, lineHeight: 1 }}
                        onMouseOver={(e) => { e.target.style.backgroundColor = "#b02a37"; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = "#dc3545"; }}
                      >
                        ×
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
  };

  const renderPage = () => {
    if (page === "dashboard")      return renderDashboard();
    if (page === "projektai")      return renderProjectsRegistry();
    if (page === "ekspedijavimas") return renderEkspedijavimasBusinessWorkflow();
    if (page === "nuosavas-transportas") return renderOwnTransportBusinessWorkflow();
    if (page === "finansai")       return <Finansai />;
    if (page === "importas")       return renderImportHub();
    return renderSettings();
  };

  const currentSelectedCarrierDocument = useMemo(() => {
    if (!selectedCarrierDocument) {
      return null;
    }

    const liveDocument = selectedCarrier?.documents?.find(
      doc => String(doc.id) === String(selectedCarrierDocument.id)
    );

    if (!liveDocument) {
      return {
        ...selectedCarrierDocument,
        link: normalizeCarrierDocumentLink(selectedCarrierDocument.link || "")
      };
    }

    return {
      ...selectedCarrierDocument,
      ...liveDocument,
      link: normalizeCarrierDocumentLink(liveDocument.link || selectedCarrierDocument.link || ""),
      carrierName: selectedCarrierDocument.carrierName
    };
  }, [selectedCarrier, selectedCarrierDocument]);

  const documentPreviewLink = normalizeCarrierDocumentLink(currentSelectedCarrierDocument?.link || "");
  const canPreviewDocument = !!documentPreviewLink && documentPreviewLink.startsWith("http");

  useEffect(() => {
    if (!currentSelectedCarrierDocument) {
      return;
    }

    console.log("currentSelectedCarrierDocument.id", currentSelectedCarrierDocument.id);
    console.log("currentSelectedCarrierDocument.number", JSON.stringify(currentSelectedCarrierDocument.number || ""));
    console.log("currentSelectedCarrierDocument.validUntil", JSON.stringify(currentSelectedCarrierDocument.validUntil || ""));
  }, [currentSelectedCarrierDocument]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "Arial, sans-serif",
      padding: "12px 16px"
    }}>
      <div style={{ maxWidth: "100%", width: "100%" }}>
        <div style={{
          background: "white",
          borderRadius: "14px",
          padding: "20px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
          marginBottom: "18px"
        }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e3a8a" }}>Radanaras MB</div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Your Cargo, Our Commitment</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "600", color: "#1e3a8a" }}>Saimondas Lukosius</div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Head of International Freight</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "18px", flexWrap: "wrap" }}>
          {activeMenu.map((item) => (
            <button
              key={item.key}
              title={item.title}
              onClick={() => handleMenuNavigation(item.key)}
              style={{
                background: page === item.key ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "white",
                color: page === item.key ? "white" : "#475569",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                fontWeight: "500"
              }}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div style={{
          background: "white",
          borderRadius: "14px",
          padding: "28px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.10)"
        }}>
          {renderPage()}
        </div>
      </div>

      {isDev && (
        <>
          <button
            type="button"
            data-debug-monitor="true"
            title="Atidaro globalų app stebėjimo monitorių. Jis rodo paspaudimus, pakeitimus, klaidas ir fetch klaidas visame appse."
            onClick={() => setAppObserverVisible((visible) => !visible)}
            style={{
              position: "fixed",
              right: "18px",
              bottom: "18px",
              zIndex: 1200,
              border: "none",
              borderRadius: "999px",
              padding: "12px 16px",
              cursor: "pointer",
              background: appObserverErrorCount || appObserverFetchErrorCount
                ? "linear-gradient(135deg, #b91c1c, #ef4444)"
                : "linear-gradient(135deg, #0f172a, #1e3a8a)",
              color: "white",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.35)",
              fontWeight: 700
            }}
          >
            Debug Monitor ({appObserverSummary.total})
          </button>

          {appObserverVisible && (
            <div
              data-debug-monitor="true"
              style={{
                position: "fixed",
                right: "18px",
                bottom: "74px",
                width: "420px",
                maxHeight: "70vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                zIndex: 1200,
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #cbd5e1",
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.28)"
              }}
            >
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>Globalus App Monitorius</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Fiksuoja paspaudimus, formų pakeitimus, navigaciją ir runtime klaidas.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    data-debug-monitor="true"
                    onClick={copyAppObserverLog}
                    style={{ border: "1px solid #bfdbfe", background: "#eff6ff", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", fontWeight: 700, color: "#1e3a8a" }}
                  >
                    Copy debug log
                  </button>
                  <button
                    type="button"
                    data-debug-monitor="true"
                    onClick={clearAppObserverEvents}
                    style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", fontWeight: 600, color: "#334155" }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    data-debug-monitor="true"
                    onClick={() => setAppObserverVisible(false)}
                    style={{ border: "none", background: "#e2e8f0", borderRadius: "8px", padding: "8px 10px", cursor: "pointer", fontWeight: 700, color: "#0f172a" }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {appObserverCopyStatus ? (
                <div style={{ padding: "8px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 700, color: appObserverCopyStatus === "Copied" ? "#15803d" : "#b91c1c" }}>
                  {appObserverCopyStatus}
                </div>
              ) : null}

              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div style={observerMetricCard}>
                  <div style={observerMetricLabel}>Page</div>
                  <div style={observerMetricValue}>{page}</div>
                </div>
                <div style={observerMetricCard}>
                  <div style={observerMetricLabel}>Errors</div>
                  <div style={observerMetricValue}>{appObserverSummary.errors}</div>
                </div>
                <div style={observerMetricCard}>
                  <div style={observerMetricLabel}>Fetch Errors</div>
                  <div style={observerMetricValue}>{appObserverSummary.fetchErrors}</div>
                </div>
                <div style={observerMetricCard}>
                  <div style={observerMetricLabel}>Clicks</div>
                  <div style={observerMetricValue}>{appObserverSummary.clicks}</div>
                </div>
                <div style={observerMetricCard}>
                  <div style={observerMetricLabel}>Changes</div>
                  <div style={observerMetricValue}>{appObserverSummary.changes}</div>
                </div>
                <div style={observerMetricCard}>
                  <div style={observerMetricLabel}>Submits</div>
                  <div style={observerMetricValue}>{appObserverSummary.submits}</div>
                </div>
              </div>

              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 700 }}>Naujo domeno bucket santrauka</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "12px" }}>
                  <div style={observerMiniStat}>Projects: {futureDomainStateSummary.projects}</div>
                  <div style={observerMiniStat}>Executions: {futureDomainStateSummary.executions}</div>
                  <div style={observerMiniStat}>Doc Rules: {futureDomainStateSummary.documentRules}</div>
                  <div style={observerMiniStat}>Finance: {futureDomainStateSummary.financeStates}</div>
                  <div style={observerMiniStat}>Attach: {futureDomainStateSummary.attachments}</div>
                  <div style={observerMiniStat}>History: {futureDomainStateSummary.projectHistoryEvents}</div>
                </div>
              </div>

              <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b" }}>
                Paskutiniai įvykiai. Jei kažkas lūžta, parašyk man paskutinius 10-20 įrašų iš šio lango.
              </div>

              <div style={{ overflowY: "auto", padding: "8px 0" }}>
                {appObserverEvents.length === 0 ? (
                  <div style={{ padding: "16px", color: "#64748b", fontSize: "13px" }}>
                    Dar nėra įvykių. Paspausk bet kur appse ir čia iškart matysis logas.
                  </div>
                ) : (
                  appObserverEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        background: event.level === "error" ? "#fef2f2" : "white"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "4px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 800, color: event.level === "error" ? "#b91c1c" : "#1e3a8a", textTransform: "uppercase" }}>
                          {event.type}
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{event.time}</div>
                      </div>
                      <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: 600, lineHeight: 1.35 }}>{event.label}</div>
                      {event.detail ? (
                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#64748b", lineHeight: 1.35 }}>{event.detail}</div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showClientModal && (
        <div style={overlayStyle}>
          <div style={largeModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>
                {editingClientId ? "Redaguoti klientą" : "Naujas klientas"}
              </h2>
              <button onClick={() => setShowClientModal(false)} style={closeButton}>✕</button>
            </div>

            <div style={sectionTitle}>Įmonės informacija</div>
            <div style={twoCol}>
              <div style={formGroup}>
                <label style={labelStyle}>Pavadinimas *</label>
                <input style={inputStyle} value={clientForm.name} onChange={(e) => handleClientFieldChange("name", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Kliento tipas</label>
                <select style={inputStyle} value={clientForm.clientType} onChange={(e) => handleClientFieldChange("clientType", e.target.value)}>
                  <option>Ekspeditorius</option>
                  <option>Tiesioginis klientas</option>
                </select>
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Įmonės kodas</label>
                <input style={inputStyle} value={clientForm.companyCode} onChange={(e) => handleClientFieldChange("companyCode", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>PVM kodas</label>
                <input style={inputStyle} value={clientForm.vatCode} onChange={(e) => handleClientFieldChange("vatCode", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Bendras el. paštas</label>
                <input style={inputStyle} value={clientForm.email} onChange={(e) => handleClientFieldChange("email", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Telefonas</label>
                <input style={inputStyle} value={clientForm.phone} onChange={(e) => handleClientFieldChange("phone", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Adresas</label>
                <input style={inputStyle} value={clientForm.address} onChange={(e) => handleClientFieldChange("address", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Šalis</label>
                <input style={inputStyle} value={clientForm.country} onChange={(e) => handleClientFieldChange("country", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Web puslapis</label>
                <input style={inputStyle} value={clientForm.website} onChange={(e) => handleClientFieldChange("website", e.target.value)} />
              </div>
            </div>

            <div style={sectionTitle}>Dokumentų ir komunikacijos kanalai</div>
            <div style={twoCol}>
              <div style={formGroup}>
                <label style={labelStyle}>Invoice el. paštas</label>
                <input style={inputStyle} value={clientForm.invoiceEmail} onChange={(e) => handleClientFieldChange("invoiceEmail", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>CMR el. paštas</label>
                <input style={inputStyle} value={clientForm.cmrEmail} onChange={(e) => handleClientFieldChange("cmrEmail", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>POD el. paštas</label>
                <input style={inputStyle} value={clientForm.podEmail} onChange={(e) => handleClientFieldChange("podEmail", e.target.value)} />
              </div>
              <div style={{ ...formGroup, gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Pastabos</label>
                <textarea style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }} value={clientForm.notes} onChange={(e) => handleClientFieldChange("notes", e.target.value)} />
              </div>
            </div>

            <div style={sectionTitle}>Vadybininkų kontaktai</div>

            {clientForm.contacts.map((contact, index) => (
              <div key={contact.id} style={contactCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", color: "#1e3a8a" }}>Kontaktas #{index + 1}</div>
                  <button style={dangerSmallButton} onClick={() => removeContactRow(contact.id)}>Pašalinti</button>
                </div>

                <div style={twoCol}>
                  <div style={formGroup}>
                    <label style={labelStyle}>Vardas, pavardė</label>
                    <input style={inputStyle} value={contact.name} onChange={(e) => handleContactChange(contact.id, "name", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Pareigos</label>
                    <input style={inputStyle} value={contact.position} onChange={(e) => handleContactChange(contact.id, "position", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>El. paštas</label>
                    <input style={inputStyle} value={contact.email} onChange={(e) => handleContactChange(contact.id, "email", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Telefonas</label>
                    <input style={inputStyle} value={contact.phone} onChange={(e) => handleContactChange(contact.id, "phone", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "14px" }}>
              <button style={secondaryButton} onClick={addContactRow}>+ Pridėti vadybininką</button>
            </div>

            <div style={sectionTitle}>Papildomi kontaktai / skyriai</div>
            <div style={departmentsGrid}>
              {clientForm.departmentContacts.map((dep) => (
                <div key={dep.id} style={departmentCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <input
                      style={{ ...inputStyle, fontWeight: "700" }}
                      value={dep.title}
                      onChange={(e) => handleDepartmentChange(dep.id, "title", e.target.value)}
                      placeholder="Skyriaus pavadinimas"
                    />
                    <button style={dangerSmallButton} onClick={() => removeDepartmentRow(dep.id)}>Pašalinti</button>
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Telefonas</label>
                    <input style={inputStyle} value={dep.phone} onChange={(e) => handleDepartmentChange(dep.id, "phone", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>El. paštas</label>
                    <input style={inputStyle} value={dep.email} onChange={(e) => handleDepartmentChange(dep.id, "email", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px" }}>
              <button style={secondaryButton} onClick={addDepartmentRow}>+ Pridėti skyrių</button>
            </div>

            <div style={buttonRowRight}>
              <button style={secondaryButton} onClick={() => setShowClientModal(false)}>Uždaryti</button>
              <button style={primaryButton} onClick={handleSaveClient}>Išsaugoti</button>
            </div>
          </div>
        </div>
      )}

      {showClientProfile && selectedClient && (
        <div style={overlayStyle}>
          <div style={profileModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>Kliento profilis</h2>
              <button onClick={() => setShowClientProfile(false)} style={closeButton}>✕</button>
            </div>

            <div style={profileBlock}>
              <div style={profileTitle}>{selectedClient.name}</div>
              <div style={profileGrid}>
                <div><b>Tipas:</b> {selectedClient.clientType || "-"}</div>
                <div><b>Įmonės kodas:</b> {selectedClient.companyCode || "-"}</div>
                <div><b>PVM kodas:</b> {selectedClient.vatCode || "-"}</div>
                <div><b>Bendras el. paštas:</b> {selectedClient.email || "-"}</div>
                <div><b>Telefonas:</b> {selectedClient.phone || "-"}</div>
                <div><b>Adresas:</b> {selectedClient.address || "-"}</div>
                <div><b>Web puslapis:</b> {selectedClient.website || "-"}</div>
                <div><b>Invoice el. paštas:</b> {selectedClient.invoiceEmail || "-"}</div>
                <div><b>CMR el. paštas:</b> {selectedClient.cmrEmail || "-"}</div>
                <div><b>POD el. paštas:</b> {selectedClient.podEmail || "-"}</div>
                <div><b>Naudojamas projektuose:</b> {clientUsageMap.get(`id:${String(selectedClient.id)}`) || clientUsageMap.get(`name:${String(selectedClient.name || "").trim().toLowerCase()}`) || 0}</div>
              </div>
              {selectedClient.notes ? (
                <div style={{ marginTop: "12px", padding: "12px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", color: "#475569", lineHeight: 1.5 }}>
                  <b>Pastabos:</b> {selectedClient.notes}
                </div>
              ) : null}
            </div>

            <div style={sectionTitle}>Vadybininkų kontaktai</div>

            {selectedClient.contacts && selectedClient.contacts.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Vardas</th>
                    <th style={thStyle}>Pareigos</th>
                    <th style={thStyle}>El. paštas</th>
                    <th style={thStyle}>Telefonas</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedClient.contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td style={tdStyle}>{contact.name || "-"}</td>
                      <td style={tdStyle}>{contact.position || "-"}</td>
                      <td style={tdStyle}>{contact.email || "-"}</td>
                      <td style={tdStyle}>{contact.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={emptyText}>Kontaktų nėra.</p>
            )}

            <div style={sectionTitle}>Papildomi kontaktai / skyriai</div>
            <div style={departmentsGrid}>
              {selectedClient.departmentContacts && selectedClient.departmentContacts.length > 0 ? (
                selectedClient.departmentContacts.map((dep) => (
                  <DepartmentViewCard
                    key={dep.id}
                    title={dep.title}
                    phone={dep.phone}
                    email={dep.email}
                  />
                ))
              ) : (
                <p style={emptyText}>Papildomų skyrių nėra.</p>
              )}
            </div>

            <div style={buttonRowRight}>
              <button
                style={dangerActionButton}
                onClick={() => handleDeleteClient(selectedClient.id)}
              >
                Šalinti
              </button>
              <button style={secondaryButton} onClick={() => setShowClientProfile(false)}>Uždaryti</button>
              <button
                style={primaryButton}
                onClick={() => {
                  setShowClientProfile(false);
                  openEditClientModal(selectedClient);
                }}
              >
                Redaguoti
              </button>
            </div>
          </div>
        </div>
      )}

      {showCarrierModal && (
        <div style={overlayStyle}>
          <div style={largeModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>
                {editingCarrierId ? "Redaguoti vežėją" : "Naujas vežėjas"}
              </h2>
              <button onClick={() => setShowCarrierModal(false)} style={closeButton}>✕</button>
            </div>

            <div style={sectionTitle}>Įmonės informacija</div>
            <div style={twoCol}>
              <div style={formGroup}>
                <label style={labelStyle}>Pavadinimas *</label>
                <input style={inputStyle} value={carrierForm.name} onChange={(e) => handleCarrierFieldChange("name", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Vežėjo tipas</label>
                <select style={inputStyle} value={carrierForm.carrierType} onChange={(e) => handleCarrierFieldChange("carrierType", e.target.value)}>
                  <option>Vežėjas</option>
                  <option>Vežėjas-ekspeditorius</option>
                  <option>Nuosavas transportas</option>
                </select>
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Fleet statusas</label>
                <div style={{ ...inputStyle, background: "#f8fafc", color: "#334155", display: "flex", alignItems: "center" }}>
                  {carrierForm.carrierType === "Nuosavas transportas" ? "Tai mūsų fleet / vidinis vykdytojas" : "Išorinis vežėjas / partneris"}
                </div>
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Įmonės kodas</label>
                <input style={inputStyle} value={carrierForm.companyCode} onChange={(e) => handleCarrierFieldChange("companyCode", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>PVM kodas</label>
                <input style={inputStyle} value={carrierForm.vatCode} onChange={(e) => handleCarrierFieldChange("vatCode", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Bendras el. paštas</label>
                <input style={inputStyle} value={carrierForm.email} onChange={(e) => handleCarrierFieldChange("email", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Telefonas</label>
                <input style={inputStyle} value={carrierForm.phone} onChange={(e) => handleCarrierFieldChange("phone", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Adresas</label>
                <input style={inputStyle} value={carrierForm.address} onChange={(e) => handleCarrierFieldChange("address", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Šalis</label>
                <input style={inputStyle} value={carrierForm.country} onChange={(e) => handleCarrierFieldChange("country", e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Web puslapis</label>
                <input style={inputStyle} value={carrierForm.website} onChange={(e) => handleCarrierFieldChange("website", e.target.value)} />
              </div>
            </div>

            <div style={sectionTitle}>Vadybininkų kontaktai</div>

            {carrierForm.managerContacts.map((contact, index) => (
              <div key={contact.id} style={contactCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", color: "#1e3a8a" }}>Kontaktas #{index + 1}</div>
                  <button style={dangerSmallButton} onClick={() => removeCarrierManagerRow(contact.id)}>Pašalinti</button>
                </div>

                <div style={twoCol}>
                  <div style={formGroup}>
                    <label style={labelStyle}>Vardas, pavardė</label>
                    <input style={inputStyle} value={contact.name} onChange={(e) => handleCarrierManagerChange(contact.id, "name", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Pareigos</label>
                    <input style={inputStyle} value={contact.position} onChange={(e) => handleCarrierManagerChange(contact.id, "position", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>El. paštas</label>
                    <input style={inputStyle} value={contact.email} onChange={(e) => handleCarrierManagerChange(contact.id, "email", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Telefonas</label>
                    <input style={inputStyle} value={contact.phone} onChange={(e) => handleCarrierManagerChange(contact.id, "phone", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "14px" }}>
              <button style={secondaryButton} onClick={addCarrierManagerRow}>+ Pridėti kontaktą</button>
            </div>

            <div style={sectionTitle}>Papildomi kontaktai / skyriai</div>
            <div style={departmentsGrid}>
              {carrierForm.documentContacts.map((dep) => (
                <div key={dep.id} style={departmentCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <input
                      style={{ ...inputStyle, fontWeight: "700" }}
                      value={dep.title}
                      onChange={(e) => handleCarrierDepartmentChange(dep.id, "title", e.target.value)}
                      placeholder="Skyriaus pavadinimas"
                    />
                    <button style={dangerSmallButton} onClick={() => removeCarrierDepartmentRow(dep.id)}>Pašalinti</button>
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Telefonas</label>
                    <input style={inputStyle} value={dep.phone} onChange={(e) => handleCarrierDepartmentChange(dep.id, "phone", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>El. paštas</label>
                    <input style={inputStyle} value={dep.email} onChange={(e) => handleCarrierDepartmentChange(dep.id, "email", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "14px" }}>
              <button style={secondaryButton} onClick={addCarrierDepartmentRow}>+ Pridėti skyrių</button>
            </div>

            <div style={sectionTitle}>Dokumentai</div>

            {carrierForm.documents.map((doc, index) => (
              <div key={doc.id} style={contactCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", color: "#1e3a8a" }}>Dokumentas #{index + 1}</div>
                  <button style={dangerSmallButton} onClick={() => removeCarrierDocumentRow(doc.id)}>Pašalinti</button>
                </div>

                <div style={twoCol}>
                  <div style={formGroup}>
                    <label style={labelStyle}>Pavadinimas</label>
                    <input style={inputStyle} value={doc.title} onChange={(e) => handleCarrierDocumentChange(doc.id, "title", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Numeris</label>
                    <input style={inputStyle} value={getCarrierDocumentNumberInputValue(doc)} onChange={(e) => handleCarrierDocumentChange(doc.id, "number", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Galioja iki</label>
                    <input type="date" style={inputStyle} value={getCarrierDocumentValidUntilInputValue(doc)} onChange={(e) => handleCarrierDocumentChange(doc.id, "validUntil", e.target.value)} />
                  </div>
                  <div style={formGroup}>
  <label style={labelStyle}>Nuoroda</label>
  <input style={inputStyle} value={doc.link} readOnly />
</div>

<div style={formGroup}>
  <label style={labelStyle}>Įkelti dokumentą</label>

  <div
    style={{
      border: "2px dashed #cbd5e1",
      borderRadius: "10px",
      padding: "32px 20px",
      textAlign: "center",
                        minHeight: "90px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
      cursor: "pointer",
      userSelect: "none"
    }}
    onDragEnter={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDragOver={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onDrop={async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const file = e.dataTransfer?.files && e.dataTransfer.files.length > 0 ? e.dataTransfer.files[0] : null;
      if (!file) return;

      if ((doc.fileName || doc.link) && !window.confirm("Šiam dokumentui failas jau yra. Ar pakeisti esamą failą?")) return;

      const uploadData = await handleFileUpload(file, "carrier", editingCarrierId || "TEST123");
      console.log("uploadData.extracted", JSON.stringify(uploadData?.extracted || {}));
      console.log("uploadData.extracted.number", JSON.stringify(uploadData?.extracted?.number || ""));
      console.log("uploadData.extracted.validUntil", JSON.stringify(uploadData?.extracted?.validUntil || ""));
      applyUploadedCarrierDocumentData(doc.id, file.name, uploadData);
    }}
  >
    Drag & Drop arba pasirink failą
  </div>

  <input
    type="file"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if ((doc.fileName || doc.link) && !window.confirm("Šiam dokumentui failas jau yra. Ar pakeisti esamą failą?")) return;

      const uploadData = await handleFileUpload(file, "carrier", editingCarrierId || "TEST123");
      console.log("uploadData.extracted", JSON.stringify(uploadData?.extracted || {}));
      console.log("uploadData.extracted.number", JSON.stringify(uploadData?.extracted?.number || ""));
      console.log("uploadData.extracted.validUntil", JSON.stringify(uploadData?.extracted?.validUntil || ""));
      applyUploadedCarrierDocumentData(doc.id, file.name, uploadData);
    }}
  />

  {doc.fileName ? (
    <div>
      <div style={{ marginTop: "6px", fontSize: "12px", color: "#16a34a", wordBreak: "break-all" }}>
        ✔ {doc.fileName}
      </div>
      <button
        type="button"
        style={{ marginTop: "6px", background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" }}
        onClick={() => {
          handleCarrierDocumentChange(doc.id, "link", "");
          handleCarrierDocumentChange(doc.id, "fileName", "");
          handleCarrierDocumentChange(doc.id, "number", "");
          handleCarrierDocumentChange(doc.id, "validUntil", "");
        }}
      >
        Pašalinti failą
      </button>
    </div>
  ) : doc.link ? (
    <div style={{ marginTop: "6px", fontSize: "12px", color: "#475569", wordBreak: "break-all" }}>
      Įkelta: {doc.link.split("/").pop()}
    </div>
  ) : null}
</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: "14px" }}>
              <button style={secondaryButton} onClick={addCarrierDocumentRow}>+ Pridėti dokumentą</button>
            </div>

            <div style={sectionTitle}>Vairuotojai</div>
            {(carrierForm.drivers || []).map((driver, index) => (
              <div key={driver.id} style={contactCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", color: "#1e3a8a" }}>Vairuotojas #{index + 1}</div>
                  <button style={dangerSmallButton} onClick={() => removeCarrierDriverRow(driver.id)}>Pašalinti</button>
                </div>
                <div style={twoCol}>
                  <div style={formGroup}><label style={labelStyle}>Vardas, pavardė *</label><input style={inputStyle} value={driver.name || ""} onChange={(e) => handleCarrierDriverChange(driver.id, "name", e.target.value)} /></div>
                  <div style={formGroup}><label style={labelStyle}>Telefonas</label><input style={inputStyle} value={driver.phone || ""} onChange={(e) => handleCarrierDriverChange(driver.id, "phone", e.target.value)} /></div>
                  <div style={formGroup}><label style={labelStyle}>Pažymėjimo Nr.</label><input style={inputStyle} value={driver.licenseNumber || ""} onChange={(e) => handleCarrierDriverChange(driver.id, "licenseNumber", e.target.value)} /></div>
                </div>
              </div>
            ))}
            {(carrierForm.drivers || []).length === 0 && <p style={emptyText}>Vairuotojų nėra.</p>}
            <div style={{ marginTop: "10px" }}><button style={secondaryButton} onClick={addCarrierDriverRow}>+ Pridėti vairuotoją</button></div>

            <div style={sectionTitle}>Vilkikai</div>
            {(carrierForm.trucks || []).map((truck, index) => (
              <div key={truck.id} style={contactCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", color: "#1e3a8a" }}>Vilkikas #{index + 1}</div>
                  <button style={dangerSmallButton} onClick={() => removeCarrierTruckRow(truck.id)}>Pašalinti</button>
                </div>
                <div style={twoCol}>
                  <div style={formGroup}><label style={labelStyle}>Valst. numeris *</label><input style={inputStyle} value={truck.licensePlate || ""} onChange={(e) => handleCarrierTruckChange(truck.id, "licensePlate", e.target.value)} /></div>
                  <div style={formGroup}><label style={labelStyle}>Modelis</label><input style={inputStyle} value={truck.model || ""} onChange={(e) => handleCarrierTruckChange(truck.id, "model", e.target.value)} /></div>
                  <div style={formGroup}><label style={labelStyle}>Metai</label><input type="number" style={inputStyle} value={truck.year || ""} onChange={(e) => handleCarrierTruckChange(truck.id, "year", e.target.value)} /></div>
                </div>
              </div>
            ))}
            {(carrierForm.trucks || []).length === 0 && <p style={emptyText}>Vilkikų nėra.</p>}
            <div style={{ marginTop: "10px" }}><button style={secondaryButton} onClick={addCarrierTruckRow}>+ Pridėti vilkiką</button></div>

            <div style={sectionTitle}>Priekabos</div>
            {(carrierForm.trailers || []).map((trailer, index) => (
              <div key={trailer.id} style={contactCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontWeight: "700", color: "#1e3a8a" }}>Priekaba #{index + 1}</div>
                  <button style={dangerSmallButton} onClick={() => removeCarrierTrailerRow(trailer.id)}>Pašalinti</button>
                </div>
                <div style={twoCol}>
                  <div style={formGroup}><label style={labelStyle}>Valst. numeris *</label><input style={inputStyle} value={trailer.licensePlate || ""} onChange={(e) => handleCarrierTrailerChange(trailer.id, "licensePlate", e.target.value)} /></div>
                  <div style={formGroup}><label style={labelStyle}>Modelis</label><input style={inputStyle} value={trailer.model || ""} onChange={(e) => handleCarrierTrailerChange(trailer.id, "model", e.target.value)} /></div>
                  <div style={formGroup}><label style={labelStyle}>Metai</label><input type="number" style={inputStyle} value={trailer.year || ""} onChange={(e) => handleCarrierTrailerChange(trailer.id, "year", e.target.value)} /></div>
                </div>
              </div>
            ))}
            {(carrierForm.trailers || []).length === 0 && <p style={emptyText}>Priekabų nėra.</p>}
            <div style={{ marginTop: "10px" }}><button style={secondaryButton} onClick={addCarrierTrailerRow}>+ Pridėti priekabą</button></div>

            <div style={sectionTitle}>Pastabos</div>
            <div style={formGroup}>
              <textarea
                style={{ ...inputStyle, minHeight: "110px", resize: "vertical" }}
                value={carrierForm.notes}
                onChange={(e) => handleCarrierFieldChange("notes", e.target.value)}
              />
            </div>

            <div style={buttonRowRight}>
              <button style={secondaryButton} onClick={() => setShowCarrierModal(false)}>Uždaryti</button>
              <button style={primaryButton} onClick={handleSaveCarrier}>Išsaugoti</button>
            </div>
          </div>
        </div>
      )}

      {showCarrierProfile && selectedCarrier && (
        <div style={overlayStyle}>
          <div style={profileModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>Vežėjo profilis</h2>
              <button onClick={() => setShowCarrierProfile(false)} style={closeButton}>✕</button>
            </div>

            <div style={profileBlock}>
              <div style={profileTitle}>{selectedCarrier.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(120px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                <div style={observerMiniStat}>Projektai: {carrierUsageMap.get(`id:${String(selectedCarrier.id)}`) || carrierUsageMap.get(`name:${String(selectedCarrier.name || "").trim().toLowerCase()}`) || 0}</div>
                <div style={observerMiniStat}>Vadyb.: {selectedCarrier.managerContacts?.filter((contact) => contact.name || contact.email || contact.phone).length || 0}</div>
                <div style={observerMiniStat}>Vairuotojai: {selectedCarrier.drivers?.length || 0}</div>
                <div style={observerMiniStat}>Fleet: {(selectedCarrier.trucks?.length || 0) + (selectedCarrier.trailers?.length || 0)}</div>
              </div>
              <div style={profileGrid}>
                <div><b>Tipas:</b> {selectedCarrier.carrierType || "-"}</div>
                <div><b>Fleet statusas:</b> {selectedCarrier.isOwnCompany ? "Mūsų įmonės fleet" : "Išorinis partneris"}</div>
                <div><b>Įmonės kodas:</b> {selectedCarrier.companyCode || "-"}</div>
                <div><b>PVM kodas:</b> {selectedCarrier.vatCode || "-"}</div>
                <div><b>Bendras el. paštas:</b> {selectedCarrier.email || "-"}</div>
                <div><b>Telefonas:</b> {selectedCarrier.phone || "-"}</div>
                <div><b>Adresas:</b> {selectedCarrier.address || "-"}</div>
                <div><b>Web puslapis:</b> {selectedCarrier.website || "-"}</div>
                <div><b>Sukurta:</b> {selectedCarrier.createdAt ? new Date(selectedCarrier.createdAt).toLocaleDateString("lt-LT") : "-"}</div>
                <div><b>Atnaujinta:</b> {selectedCarrier.updatedAt ? new Date(selectedCarrier.updatedAt).toLocaleDateString("lt-LT") : "-"}</div>
              </div>
            </div>

            <div style={sectionTitle}>Vadybininkų kontaktai</div>

            {selectedCarrier.managerContacts && selectedCarrier.managerContacts.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Vardas</th>
                    <th style={thStyle}>Pareigos</th>
                    <th style={thStyle}>El. paštas</th>
                    <th style={thStyle}>Telefonas</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCarrier.managerContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td style={tdStyle}>{contact.name || "-"}</td>
                      <td style={tdStyle}>{contact.position || "-"}</td>
                      <td style={tdStyle}>{contact.email || "-"}</td>
                      <td style={tdStyle}>{contact.phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={emptyText}>Kontaktų nėra.</p>
            )}

            <div style={sectionTitle}>Papildomi kontaktai / skyriai</div>
            <div style={departmentsGrid}>
              {selectedCarrier.documentContacts && selectedCarrier.documentContacts.length > 0 ? (
                selectedCarrier.documentContacts.map((dep) => (
                  <DepartmentViewCard
                    key={dep.id}
                    title={dep.title}
                    phone={dep.phone}
                    email={dep.email}
                  />
                ))
              ) : (
                <p style={emptyText}>Papildomų skyrių nėra.</p>
              )}
            </div>

            <div style={sectionTitle}>Dokumentai</div>

            {selectedCarrier.documents && selectedCarrier.documents.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Pavadinimas</th>                    <th style={thStyle}>Numeris</th>                    <th style={thStyle}>Galioja iki</th>                    <th style={thStyle}>Liko</th>                    <th style={thStyle}>Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCarrier.documents.map((doc) => (
                    <tr key={doc.id}>
                      <td style={tdStyle}>{doc.title || "-"}</td>
                      <td style={tdStyle}>{doc.number || "-"}</td>
                      <td style={tdStyle}>{doc.validUntil || "-"}</td>                      <td style={tdStyle}>{getDaysLeft(doc.validUntil)}</td>                      <td style={tdStyle}>
                        <button
                          style={smallActionButton}
                          onClick={() => openCarrierDocumentModal(selectedCarrier, doc)}
                        >
                          Peržiūrėti
                        </button>
                        {doc.link ? (
                          <a
                            href={doc.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ ...docLinkStyle, marginLeft: "8px" }}
                          >
                            Atidaryti
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={emptyText}>Dokumentų nėra.</p>
            )}

            <div style={sectionTitle}>Vairuotojai</div>
            {selectedCarrier.drivers && selectedCarrier.drivers.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Vardas</th>
                    <th style={thStyle}>Telefonas</th>
                    <th style={thStyle}>Pažymėjimo Nr.</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCarrier.drivers.map((d) => (
                    <tr key={d.id}>
                      <td style={tdStyle}>{d.name || "-"}</td>
                      <td style={tdStyle}>{d.phone || "-"}</td>
                      <td style={tdStyle}>{d.licenseNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={emptyText}>Vairuotojų nėra.</p>
            )}

            <div style={sectionTitle}>Vilkikai</div>
            {selectedCarrier.trucks && selectedCarrier.trucks.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Valst. numeris</th>
                    <th style={thStyle}>Modelis</th>
                    <th style={thStyle}>Metai</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCarrier.trucks.map((t) => (
                    <tr key={t.id}>
                      <td style={tdStyle}>{t.licensePlate || "-"}</td>
                      <td style={tdStyle}>{t.model || "-"}</td>
                      <td style={tdStyle}>{t.year || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={emptyText}>Vilkikų nėra.</p>
            )}

            <div style={sectionTitle}>Priekabos</div>
            {selectedCarrier.trailers && selectedCarrier.trailers.length > 0 ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Valst. numeris</th>
                    <th style={thStyle}>Modelis</th>
                    <th style={thStyle}>Metai</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCarrier.trailers.map((t) => (
                    <tr key={t.id}>
                      <td style={tdStyle}>{t.licensePlate || "-"}</td>
                      <td style={tdStyle}>{t.model || "-"}</td>
                      <td style={tdStyle}>{t.year || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={emptyText}>Priekabų nėra.</p>
            )}

            <div style={sectionTitle}>Pastabos</div>
            <div style={profileBlock}>
              {selectedCarrier.notes ? selectedCarrier.notes : "Pastabų nėra."}
            </div>

            <div style={buttonRowRight}>
              <button style={dangerActionButton} onClick={() => handleDeleteCarrier(selectedCarrier.id)}>Ištrinti</button>
              <button style={secondaryButton} onClick={() => setShowCarrierProfile(false)}>Uždaryti</button>
              <button
                style={primaryButton}
                onClick={() => {
                  setShowCarrierProfile(false);
                  openEditCarrierModal(selectedCarrier);
                }}
              >
                Redaguoti
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <OrdersModal
          type={orderModalType}
          initialData={editingOrder}
          onClose={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
            setOrderWorkflowMode("default");
          }}
          clients={clients}
          carriers={carriers}
          saveOrders={saveOrders}
          saveCarriers={saveCarriers}
          saveClients={saveClients}
          orders={orders}
          settings={settings}
          persistFutureDomain={persistFutureDomainToAppState}
          persistTarget={orderPersistTarget}
          workflowMode={orderWorkflowMode}
        />
      )}

      {showReminderCenter && (
        <div style={overlayStyle}>
          <div style={largeModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>Priminimai ir dokumentų kontrolė</h2>
              <button type="button" style={closeButton} onClick={() => setShowReminderCenter(false)}>×</button>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
              {[
                { key: "all", label: "Visi" },
                { key: "carrier_documents", label: "Vežėjų dokumentai" },
                { key: "project_documents", label: "Projekto CMR" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  style={reminderCenterScope === item.key ? primaryButton : secondaryButton}
                  onClick={() => setReminderCenterScope(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div style={{ ...pageCard, padding: "18px", boxShadow: "none", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "18px" }}>
                <div style={observerMiniStat}>Pending: {reminderSnapshot.reminderStats.pendingCount}</div>
                <div style={observerMiniStat}>Sent: {reminderSnapshot.reminderStats.sentCount}</div>
                <div style={observerMiniStat}>Overdue: {reminderSnapshot.reminderStats.overdueCount}</div>
                <div style={observerMiniStat}>Resolved: {reminderSnapshot.reminderStats.resolvedCount}</div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={thStyle}>Tipas</th>
                    <th style={thStyle}>Objektas</th>
                    <th style={thStyle}>Būsena</th>
                    <th style={thStyle}>Terminas</th>
                    <th style={thStyle}>Kanalas</th>
                    <th style={thStyle}>Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {reminderSnapshot.reminders
                    .filter((item) => reminderCenterScope === "all"
                      ? true
                      : reminderCenterScope === "carrier_documents"
                        ? item.entityType === "carrier"
                        : item.entityType === "project"
                    )
                    .map((item) => (
                      <tr key={`${item.entityType}:${item.entityId}:${item.reminderType}`}>
                        <td style={tdStyle}>{item.title || item.reminderType}</td>
                        <td style={tdStyle}>{item.detail || item.entityId}</td>
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: item.status === "pending" ? "#fef3c7" : item.status === "sent" ? "#dbeafe" : "#e2e8f0",
                            color: item.status === "pending" ? "#92400e" : item.status === "sent" ? "#1d4ed8" : "#475569",
                          }}>
                            {item.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{item.dueAt ? new Date(item.dueAt).toLocaleDateString("lt-LT") : "—"}</td>
                        <td style={tdStyle}>{item.channel || "email"}</td>
                        <td style={tdStyle}>
                          {item.status === "pending" ? (
                            <button type="button" style={smallActionButton} onClick={() => handleSendReminder(item, "email")}>
                              Siųsti priminimą
                            </button>
                          ) : (
                            <span style={{ color: "#64748b", fontSize: "12px" }}>
                              {item.sentAt ? `Išsiųsta ${new Date(item.sentAt).toLocaleDateString("lt-LT")}` : "Jau apdorota"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  {reminderSnapshot.reminders.filter((item) => reminderCenterScope === "all" ? true : reminderCenterScope === "carrier_documents" ? item.entityType === "carrier" : item.entityType === "project").length === 0 && (
                    <tr>
                      <td style={{ ...tdStyle, textAlign: "center", color: "#64748b" }} colSpan={6}>Aktyvių priminimų nėra.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showCarrierDocumentModal && currentSelectedCarrierDocument && (
        <div style={overlayStyle}>
          <div style={documentModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>
                {currentSelectedCarrierDocument.title || "Dokumento peržiūra"} - {currentSelectedCarrierDocument.carrierName || "-"}
              </h2>
              <button onClick={() => setShowCarrierDocumentModal(false)} style={closeButton}>✕</button>
            </div>

            <div style={documentInfoBox}>
              <div style={{ fontWeight: "700", color: "#1e3a8a", marginBottom: "6px" }}>
                {currentSelectedCarrierDocument.title || "-"}
              </div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                Galioja iki: {currentSelectedCarrierDocument.validUntil || "-"}
              </div>
            </div>

            <div style={{ marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {currentSelectedCarrierDocument.link ? (
                <a href={currentSelectedCarrierDocument.link} target="_blank" rel="noreferrer" style={primaryLinkButton}>
                  Atidaryti dokumentą
                </a>
              ) : null}
            </div>

            {canPreviewDocument ? (
              <iframe
                title="carrier-document-preview"
                src={documentPreviewLink}
                style={documentFrameStyle}
              />
            ) : (
              <div style={documentEmptyState}>
                Dokumento nuoroda nenurodyta arba netinkama.
              </div>
            )}

            <div style={buttonRowRight}>
              <button style={secondaryButton} onClick={() => setShowCarrierDocumentModal(false)}>Uždaryti</button>
            </div>
          </div>
        </div>
      )}

      {migrationDryRunVisible && (
        <div style={overlayStyle}>
          <div style={largeModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>Migration Dry-Run</h2>
              <button onClick={() => setMigrationDryRunVisible(false)} style={closeButton}>×</button>
            </div>

            {migrationDryRunRanAt && (
              <div style={{ marginBottom: "12px", color: "#64748b", fontSize: "13px" }}>
                Last run: {migrationDryRunRanAt}
              </div>
            )}

            {migrationDryRunErrors ? (
              <div style={{ color: "#b91c1c", fontWeight: 600, marginBottom: "16px" }}>
                {migrationDryRunErrors}
              </div>
            ) : (
              <>
                {migrationDryRunReport && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                    <div style={statCard}>
                      <div style={statTitle}>Migrated</div>
                      <div style={statValue}>{migrationDryRunReport.migratedCount}</div>
                    </div>
                    <div style={statCard}>
                      <div style={statTitle}>Skipped</div>
                      <div style={statValue}>{migrationDryRunReport.skippedCount}</div>
                    </div>
                    <div style={statCard}>
                      <div style={statTitle}>Unresolved</div>
                      <div style={statValue}>{migrationDryRunReport.unresolvedCount}</div>
                    </div>
                    <div style={statCard}>
                      <div style={statTitle}>Warnings</div>
                      <div style={statValue}>{migrationDryRunReport.warningsCount}</div>
                    </div>
                  </div>
                )}

                {migrationDryRunPreview && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>Storage Preview</h3>
                    <pre style={previewBoxStyle}>
{JSON.stringify({
  projects: migrationDryRunPreview.projects?.length || 0,
  executions: migrationDryRunPreview.executions?.length || 0,
  documentRules: migrationDryRunPreview.documentRules?.length || 0,
  financeStates: migrationDryRunPreview.financeStates?.length || 0,
  projectHistoryEvents: migrationDryRunPreview.projectHistoryEvents?.length || 0,
  driverTasks: migrationDryRunPreview.driverTasks?.length || 0,
  attachments: migrationDryRunPreview.attachments?.length || 0,
}, null, 2)}
                    </pre>
                  </div>
                )}

                {migrationDryRunReport?.executionModeBreakdown?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>Execution Mode Breakdown</h3>
                    <pre style={previewBoxStyle}>
{JSON.stringify(migrationDryRunReport.executionModeBreakdown, null, 2)}
                    </pre>
                  </div>
                )}

                {migrationDryRunReport?.legacyStatusBreakdown?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>Legacy Status Breakdown</h3>
                    <pre style={previewBoxStyle}>
{JSON.stringify(migrationDryRunReport.legacyStatusBreakdown, null, 2)}
                    </pre>
                  </div>
                )}

                {migrationDryRunReport?.warningBreakdown?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>Top Warning Codes</h3>
                    <pre style={previewBoxStyle}>
{JSON.stringify(migrationDryRunReport.warningBreakdown.slice(0, 10), null, 2)}
                    </pre>
                  </div>
                )}

                {migrationDryRunReport?.unresolvedBreakdown?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginTop: 0, color: "#1e3a8a" }}>Top Unresolved Fields</h3>
                    <pre style={previewBoxStyle}>
{JSON.stringify(migrationDryRunReport.unresolvedBreakdown.slice(0, 10), null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {!migrationDryRunErrors && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "8px" }}>Warnings</div>
                  <div style={{ color: "#475569", fontSize: "14px" }}>{migrationDryRunWarnings.length}</div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "8px" }}>Unresolved Items</div>
                  <div style={{ color: "#475569", fontSize: "14px" }}>{migrationDryRunUnresolved.length}</div>
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px" }}>
                  <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "8px" }}>Skipped Items</div>
                  <div style={{ color: "#475569", fontSize: "14px" }}>{migrationDryRunSkipped.length}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DepartmentViewCard({ title, phone, email }) {
  return (
    <div style={departmentViewCard}>
      <div style={departmentTitle}>{title || "-"}</div>
      <div style={departmentLine}><b>T:</b> {phone || "-"}</div>
      <div style={departmentLine}><b>E:</b> {email || "-"}</div>
    </div>
  );
}

const pageHeaderRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const primaryButton = {
  background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  color: "white",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600"
};

const secondaryButton = {
  background: "#e2e8f0",
  color: "#334155",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600"
};

const smallActionButton = {  padding: "6px 8px",  fontSize: "11px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "none",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  marginRight: "6px"
};

const smallEditButton = {
  background: "#ede9fe",
  color: "#6d28d9",
  border: "none",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  marginRight: "6px"
};

const dangerActionButton = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px"
};

const dangerSmallButton = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "8px 10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  marginLeft: "8px",
  flexShrink: 0
};

const closeButton = {
  background: "transparent",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#64748b"
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  width: "100%",
  boxSizing: "border-box"
};

const tableStyle = {  tableLayout: "fixed",
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: "10px",
  overflow: "hidden"
};

const thStyle = {  whiteSpace: "nowrap",  fontSize: "12px",  padding: "12px 10px",
  padding: "32px 20px",
  textAlign: "left",
  fontSize: "13px",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0"
};

const tdStyle = {  fontSize: "13px",  padding: "10px 10px",
  padding: "32px 20px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
  color: "#1e293b"
};

const statCard = {
  background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  color: "white",
  padding: "22px",
  borderRadius: "14px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.10)"
};

const statTitle = {
  fontSize: "14px",
  opacity: 0.9,
  marginBottom: "10px"
};

const statValue = {
  fontSize: "38px",
  fontWeight: "700"
};

const emptyText = {
  color: "#64748b",
  fontSize: "16px"
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000
};

const largeModalStyle = {
  background: "white",
  width: "100%",
  maxWidth: "1100px",
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: "16px",
  padding: "12px 16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.20)"
};

const profileModalStyle = {
  background: "white",
  width: "100%",
  maxWidth: "1100px",
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: "16px",
  padding: "12px 16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.20)"
};

const documentModalStyle = {
  background: "white",
  width: "100%",
  maxWidth: "1200px",
  maxHeight: "92vh",
  overflowY: "auto",
  borderRadius: "16px",
  padding: "12px 16px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.20)"
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const buttonRowRight = {
  marginTop: "20px",
  display: "flex",
  gap: "10px",
  justifyContent: "flex-end"
};

const formGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const labelStyle = {
  fontSize: "13px",
  color: "#334155",
  fontWeight: "600"
};

const sectionTitle = {
  marginTop: "18px",
  marginBottom: "12px",
  color: "#1e3a8a",
  fontWeight: "700",
  fontSize: "15px"
};

const twoCol = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px"
};

const linkButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#1d4ed8",
  cursor: "pointer",
  padding: 0,
  fontWeight: "600"
};

const contactCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "14px"
};

const profileBlock = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "18px",
  marginBottom: "16px"
};

const profileTitle = {
  fontSize: "20px",
  fontWeight: "700",
  color: "#1e3a8a",
  marginBottom: "14px"
};

const profileGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  color: "#334155"
};

const departmentsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "16px",
  marginTop: "8px"
};

const departmentCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const departmentViewCard = {
  background: "#dbe7ff",
  borderRadius: "14px",
  padding: "18px",
  minHeight: "110px"
};

const departmentTitle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1e3a8a",
  marginBottom: "12px"
};

const departmentLine = {
  color: "#334155",
  marginBottom: "6px"
};

const docLinkStyle = {
  display: "inline-block",
  color: "#1d4ed8",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: "600"
};

const primaryLinkButton = {
  display: "inline-block",
  background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  color: "white",
  padding: "10px 14px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px"
};

const documentInfoBox = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "14px"
};

const documentFrameStyle = {
  width: "100%",
  height: "65vh",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  background: "#fff"
};

const documentEmptyState = {
  minHeight: "240px",
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  background: "#f8fafc"
};

const previewBoxStyle = {
  background: "#0f172a",
  color: "#e2e8f0",
  padding: "14px",
  borderRadius: "10px",
  overflowX: "auto",
  fontSize: "12px",
  lineHeight: 1.5,
  marginBottom: "14px"
};

const observerMetricCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "10px"
};

const observerMetricLabel = {
  fontSize: "11px",
  color: "#64748b",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "4px"
};

const observerMetricValue = {
  fontSize: "16px",
  color: "#0f172a",
  fontWeight: 800
};

const observerMiniStat = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  padding: "8px 10px",
  color: "#1e3a8a",
  fontWeight: 700
};

export default App;
















































