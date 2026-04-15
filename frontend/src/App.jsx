import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal as OrdersModal, Orders as OrdersPage, Settings as SettingsPage } from "./orders_settings_only";
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

const getDaysLeft = (date) => {
  if (!date) return '-';
  const today = new Date();
  const target = new Date(date);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Pasibaigė';
  return diff + ' d.';
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

function App() {
  const [page, setPage] = useState("clients");
  const [clients, setClients] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState({});
  const [imports, setImports] = useState([]);
  const [importSearch, setImportSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [carrierSearch, setCarrierSearch] = useState("");
  const [dashboardStats, setDashboardStats] = useState(null);
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
  const [editingOrder, setEditingOrder] = useState(null);

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
    { name: "Dashboard", key: "dashboard" },
    { name: "Klientai", key: "clients" },
    { name: "Vežėjai", key: "carriers" },
    { name: "Užsakymai", key: "orders" },
    { name: "Nustatymai", key: "settings" },
    { name: "Importas", key: "imports" }
  ];

  const selectedClient = useMemo(() => {
    const found = clients.find(c => String(c.id) === String(selectedClientId));
    if (!found) return null;

    return {
      ...found,
      contacts: found.contacts || [],
      departmentContacts: found.departmentContacts && found.departmentContacts.length > 0
        ? found.departmentContacts
        : defaultDepartments()
    };
  }, [clients, selectedClientId]);

  const selectedCarrier = useMemo(() => {
    const found = carriers.find(c => String(c.id) === String(selectedCarrierId));
    if (!found) return null;

    return {
      ...found,
      managerContacts: found.managerContacts || [],
      documentContacts: found.documentContacts && found.documentContacts.length > 0
        ? found.documentContacts
        : defaultDepartments(),
      documents: found.documents && found.documents.length > 0
        ? found.documents
        : defaultCarrierDocuments(),
      drivers: found.drivers || [],
      trucks: found.trucks || [],
      trailers: found.trailers || []
    };
  }, [carriers, selectedCarrierId]);

  const saveClients = (next) => {
    setClients(next);
    persistUnifiedBucket("clients", next);
  };

  const saveCarriers = (next) => {
    setCarriers(next);
    persistUnifiedBucket("carriers", next);
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
    setClientForm(emptyClientForm);
    setShowClientModal(true);
  };

  const openEditClientModal = (client) => {
    setEditingClientId(client.id);
    setClientForm({
      name: client.name || "",
      clientType: client.clientType || "Ekspeditorius",
      companyCode: client.companyCode || "",
      vatCode: client.vatCode || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      country: client.country || "",
      website: client.website || "",
      contacts:
        client.contacts && client.contacts.length > 0
          ? client.contacts
          : [{ id: 1, name: "", position: "", email: "", phone: "" }],
      departmentContacts:
        client.departmentContacts && client.departmentContacts.length > 0
          ? client.departmentContacts
          : defaultDepartments()
    });
    setShowClientModal(true);
  };

  const openNewCarrierModal = () => {
    setEditingCarrierId(null);
    setCarrierForm(emptyCarrierForm);
    setShowCarrierModal(true);
  };

  const openEditCarrierModal = (carrier) => {
    setEditingCarrierId(carrier.id);
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

  const openOrderModal = (type = "order", order = null) => {
    setOrderModalType(type);
    setEditingOrder(order);
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
    const confirmed = window.confirm(`Ar tikrai nori ištrinti vežėją "${carrier?.name || ""}"?`);

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

    if (editingClientId) {
      const next = clients.map(client =>
        client.id === editingClientId
          ? {
              ...client,
              ...clientForm,
              contacts: cleanedContacts,
              departmentContacts: cleanedDepartments
            }
          : client
      );
      saveClients(next);
    } else {
      const newClient = {
        id: generateId("CL"),
        ...clientForm,
        contacts: cleanedContacts,
        departmentContacts: cleanedDepartments
      };
      saveClients([newClient, ...clients]);
    }

    setClientForm(emptyClientForm);
    setEditingClientId(null);
    setShowClientModal(false);
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

    if (editingCarrierId) {
      const next = carriers.map(carrier =>
        carrier.id === editingCarrierId
          ? {
              ...carrier,
              ...carrierForm,
              managerContacts: cleanedManagers,
              documentContacts: cleanedDepartments,
              documents: cleanedDocuments,
              drivers: cleanedDrivers,
              trucks: cleanedTrucks,
              trailers: cleanedTrailers
            }
          : carrier
      );
      saveCarriers(next);
    } else {
      const newCarrier = {
        id: generateId("CR"),
        ...carrierForm,
        managerContacts: cleanedManagers,
        documentContacts: cleanedDepartments,
        documents: cleanedDocuments,
        drivers: cleanedDrivers,
        trucks: cleanedTrucks,
        trailers: cleanedTrailers
      };
      saveCarriers([newCarrier, ...carriers]);
    }

    setCarrierForm(emptyCarrierForm);
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
    const fmtEur = (val) => val !== undefined
      ? "€" + Number(val).toLocaleString("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";

    return (
      <div>
        <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>Dashboard</h2>

        {/* Financial summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginTop: "20px" }}>
          {/* Revenue — green */}
          <div style={{ ...statCard, background: "linear-gradient(135deg, #15803d, #22c55e)" }}>
            <div style={statTitle}>Pajamos (Revenue)</div>
            <div style={{ ...statValue, fontSize: "32px" }}>{fmtEur(fin.totalRevenue)}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.9 }}>
              ↗ +{fin.revenueChange ?? 15}%
            </div>
          </div>

          {/* Expenses — orange */}
          <div style={{ ...statCard, background: "linear-gradient(135deg, #c2410c, #fb923c)" }}>
            <div style={statTitle}>Išlaidos (Expenses)</div>
            <div style={{ ...statValue, fontSize: "32px" }}>{fmtEur(fin.totalCost)}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.9 }}>
              Marža: {fin.profitMargin ?? 0}%
            </div>
          </div>

          {/* Profit — blue */}
          <div style={{ ...statCard, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)" }}>
            <div style={statTitle}>Pelnas (Profit)</div>
            <div style={{ ...statValue, fontSize: "32px" }}>{fmtEur(fin.totalProfit)}</div>
            <div style={{ marginTop: "10px", fontSize: "13px", opacity: 0.9 }}>
              ↘ Optimizacija
            </div>
          </div>
        </div>

        {/* Operational stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "16px" }}>
          <div style={statCard}>
            <div style={statTitle}>Aktyvūs užsakymai</div>
            <div style={statValue}>{activeOrdersCount}</div>
          </div>
          <div style={statCard}>
            <div style={statTitle}>Viso klientų</div>
            <div style={statValue}>{clients.length}</div>
          </div>
          <div style={statCard}>
            <div style={statTitle}>Viso vežėjų</div>
            <div style={statValue}>{carriers.length}</div>
          </div>
          <div style={statCard}>
            <div style={statTitle}>Juodraščiai</div>
            <div style={statValue}>{draftOrdersCount}</div>
          </div>
        </div>
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

    return (
      <div>
        <div style={pageHeaderRow}>
          <h2 style={{ margin: 0, color: "#1e3a8a" }}>Klientai ({clients.length})</h2>
          <button style={primaryButton} onClick={openNewClientModal}>+ Naujas klientas</button>
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
                <th style={thStyle}>Kontaktų sk.</th>
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
                  <td style={tdStyle}>{item.contacts ? item.contacts.length : 0}</td>
                  <td style={tdStyle}>
                    <button style={smallActionButton} onClick={() => openClientProfile(item.id)}>Peržiūrėti</button>
                    <button style={smallEditButton} onClick={() => openEditClientModal(item)}>Redaguoti</button>
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
    const q = carrierSearch.trim().toLowerCase();
    const filtered = q
      ? carriers.filter(c =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.companyCode || "").toLowerCase().includes(q) ||
          (c.vatCode || "").toLowerCase().includes(q) ||
          (c.address || "").toLowerCase().includes(q)
        )
      : carriers;

    return (
    <div>
      <div style={pageHeaderRow}>
        <h2 style={{ margin: 0, color: "#1e3a8a" }}>Vežėjai ({carriers.length})</h2>
        <button style={primaryButton} onClick={openNewCarrierModal}>+ Pridėti Vežėją</button>
      </div>

      {carriers.length > 0 && (
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

      {carriers.length > 0 && filtered.length === 0 && (
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
              <th style={thStyle}>CMR DRAUDIMAS</th>
              <th style={thStyle}>LICENCIJA</th>
              <th style={thStyle}>DOKUMENTAI</th>
              <th style={thStyle}>KONTAKTAS</th>
              <th style={thStyle}>VEIKSMAI</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => {
              const cmr = item.documents?.find(d => d.title === "CMR draudimas");
              const lic = item.documents?.find(d => d.title === "Transporto licencija");

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
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{cmr?.validUntil ? getDaysLeft(cmr.validUntil) : "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{lic?.validUntil ? getDaysLeft(lic.validUntil) : "-"}</td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
                      {cmr?.link ? <button style={smallActionButton} onClick={() => openCarrierDocumentModal(item, cmr)}>CMR</button> : null}
                      {lic?.link ? <button style={smallActionButton} onClick={() => openCarrierDocumentModal(item, lic)}>LIC</button> : null}
                    </div>
                  </td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.phone || "-"}</td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
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

  const renderOrders = () => {
    return (
      <OrdersPage
        orders={orders}
        saveOrders={saveOrders}
        clients={clients}
        carriers={carriers}
        openModal={openOrderModal}
      />
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
    if (page === "dashboard") return renderDashboard();
    if (page === "clients") return renderClients();
    if (page === "carriers") return renderCarriers();
    if (page === "orders") return renderOrders();
    if (page === "imports") return renderImports();
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
          {menu.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
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
              </div>
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
              <div style={profileGrid}>
                <div><b>Tipas:</b> {selectedCarrier.carrierType || "-"}</div>
                <div><b>Įmonės kodas:</b> {selectedCarrier.companyCode || "-"}</div>
                <div><b>PVM kodas:</b> {selectedCarrier.vatCode || "-"}</div>
                <div><b>Bendras el. paštas:</b> {selectedCarrier.email || "-"}</div>
                <div><b>Telefonas:</b> {selectedCarrier.phone || "-"}</div>
                <div><b>Adresas:</b> {selectedCarrier.address || "-"}</div>
                <div><b>Web puslapis:</b> {selectedCarrier.website || "-"}</div>
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
          }}
          clients={clients}
          carriers={carriers}
          saveOrders={saveOrders}
          saveCarriers={saveCarriers}
          orders={orders}
          settings={settings}
        />
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

export default App;
















































