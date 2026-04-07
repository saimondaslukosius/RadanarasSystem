import { useMemo, useState } from "react";

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

function App() {
  const [page, setPage] = useState("clients");

  const [clients, setClients] = useState(() => {
    return JSON.parse(localStorage.getItem("radanaras_clients") || "[]");
  });

  const [carriers, setCarriers] = useState(() => {
    return JSON.parse(localStorage.getItem("radanaras_carriers") || "[]");
  });

  const [orders] = useState(() => {
    return JSON.parse(localStorage.getItem("radanaras_orders") || "[]");
  });

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

  const handleFileUpload = async (file, type, id) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`http://localhost:3001/upload/${type}/${id}`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    return data.fileUrl;
  };

  const emptyClientForm = {
    name: "",
    clientType: "Ekspeditorius",
    companyCode: "",
    vatCode: "",
    email: "",
    phone: "",
    address: "",
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
    website: "",
    managerContacts: [
      { id: 1, name: "", position: "", email: "", phone: "" }
    ],
    documentContacts: defaultDepartments(),
    documents: defaultCarrierDocuments(),
    notes: ""
  };

  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [carrierForm, setCarrierForm] = useState(emptyCarrierForm);

  const menu = [
    { name: "Dashboard", key: "dashboard" },
    { name: "Klientai", key: "clients" },
    { name: "Vežėjai", key: "carriers" },
    { name: "Užsakymai", key: "orders" },
    { name: "Nustatymai", key: "settings" }
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
        : defaultCarrierDocuments()
    };
  }, [carriers, selectedCarrierId]);

  const saveClients = (next) => {
    setClients(next);
    localStorage.setItem("radanaras_clients", JSON.stringify(next));
  };

  const saveCarriers = (next) => {
    setCarriers(next);
    localStorage.setItem("radanaras_carriers", JSON.stringify(next));
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
      notes: carrier.notes || ""
    });
    setShowCarrierModal(true);
  };

  const openCarrierProfile = (carrierId) => {
    setSelectedCarrierId(carrierId);
    setShowCarrierProfile(true);
  };

  const openCarrierDocumentModal = (carrier, doc) => {
    setSelectedCarrierId(carrier.id);

    let resolvedLink = doc.link || "";

    if (!resolvedLink || !resolvedLink.includes("localhost:3001/uploads/")) {
      if (doc.title === "CMR draudimas") {
        resolvedLink = "http://localhost:3001/uploads/carrier/TEST123/1775076534747-20250907_CMR_certificate_RadanarasMB-1.pdf";
      } else if (doc.title === "Transporto licencija") {
        resolvedLink = "http://localhost:3001/uploads/carrier/TEST123/1775076936627-20250907_CMR_certificate_RadanarasMB-1.pdf";
      }
    }

    setSelectedCarrierDocument({
      ...doc,
      link: resolvedLink,
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

  const handleCarrierDocumentChange = (documentId, field, value) => {
    setCarrierForm(prev => ({
      ...prev,
      documents: prev.documents.map(doc =>
        doc.id === documentId ? { ...doc, [field]: value } : doc
      )
    }));
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

    if (editingCarrierId) {
      const next = carriers.map(carrier =>
        carrier.id === editingCarrierId
          ? {
              ...carrier,
              ...carrierForm,
              managerContacts: cleanedManagers,
              documentContacts: cleanedDepartments,
              documents: cleanedDocuments
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
        documents: cleanedDocuments
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

    return (
      <div>
        <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>Dashboard</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "20px" }}>
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
    return (
      <div>
        <div style={pageHeaderRow}>
          <h2 style={{ margin: 0, color: "#1e3a8a" }}>Klientai</h2>
          <button style={primaryButton} onClick={openNewClientModal}>+ Naujas klientas</button>
        </div>

        {clients.length === 0 ? (
          <p style={emptyText}>Kol kas nėra klientų.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
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
              {clients.map((item) => (
                <tr key={item.id}>
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
  return (
    <div>
      <div style={pageHeaderRow}>
        <h2 style={{ margin: 0, color: "#1e3a8a" }}>Vežėjai ({carriers.length})</h2>
        <button style={primaryButton} onClick={openNewCarrierModal}>+ Pridėti Vežėją</button>
      </div>

      {carriers.length === 0 ? (
        <p style={emptyText}>Kol kas nėra vežėjų.</p>
      ) : (
        <table style={{ ...tableStyle, tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
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
            {carriers.map((item) => {
              const cmr = item.documents?.find(d => d.title === "CMR draudimas");
              const lic = item.documents?.find(d => d.title === "Transporto licencija");

              return (
                <tr key={item.id} style={{ background: "#f8fafc" }}>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap", fontWeight: "700" }}><button onClick={() => openCarrierProfile(item.id)} style={linkButtonStyle}>{item.name || "-"}</button></td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: "#dbeafe",
                        color: "#1e40af",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {item.carrierType === "Nuosavas transportas" ? "Nuosavas" : item.carrierType || "-"}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.companyCode || "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{item.vatCode || "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{cmr?.validUntil ? getDaysLeft(cmr.validUntil) : "-"}</td>
                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>{lic?.validUntil ? getDaysLeft(lic.validUntil) : "-"}</td>

                  <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "nowrap" }}>
                      {cmr?.link ? (
                        <button style={smallActionButton} onClick={() => openCarrierDocumentModal(item, cmr)}>CMR</button>
                      ) : null}
                      {lic?.link ? (
                        <button style={smallActionButton} onClick={() => openCarrierDocumentModal(item, lic)}>LIC</button>
                      ) : null}
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

  const renderSettings = () => {
    return <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>Nustatymai</h2>;
  };

  const renderPage = () => {
    if (page === "dashboard") return renderDashboard();
    if (page === "clients") return renderClients();
    if (page === "carriers") return renderCarriers();
    if (page === "orders") return renderOrders();
    return renderSettings();
  };

  const documentPreviewLink = selectedCarrierDocument?.link || "";
  const canPreviewDocument = documentPreviewLink.startsWith("http");

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
                    <input style={inputStyle} value={doc.number} onChange={(e) => handleCarrierDocumentChange(doc.id, "number", e.target.value)} />
                  </div>
                  <div style={formGroup}>
                    <label style={labelStyle}>Galioja iki</label>
                    <input type="date" style={inputStyle} value={doc.validUntil} onChange={(e) => handleCarrierDocumentChange(doc.id, "validUntil", e.target.value)} />
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

      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      const fileUrl = await handleFileUpload(file, "carrier", editingCarrierId || "TEST123");
      handleCarrierDocumentChange(doc.id, "link", fileUrl);
      handleCarrierDocumentChange(doc.id, "fileName", file.name);

      alert(JSON.stringify(uploadData, null, 2));
    }}
  >
    Drag & Drop arba pasirink failą
  </div>

  <input
    type="file"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileUrl = await handleFileUpload(file, "carrier", editingCarrierId || "TEST123");
      handleCarrierDocumentChange(doc.id, "link", fileUrl);
      handleCarrierDocumentChange(doc.id, "fileName", file.name);

      alert(JSON.stringify(uploadData, null, 2));
    }}
  />

  {doc.fileName ? (
    <div style={{ marginTop: "6px", fontSize: "12px", color: "#16a34a", wordBreak: "break-all" }}>
      ✔ {doc.fileName}
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

      {showCarrierDocumentModal && selectedCarrierDocument && (
        <div style={overlayStyle}>
          <div style={documentModalStyle}>
            <div style={modalHeader}>
              <h2 style={{ margin: 0, color: "#1e3a8a" }}>
                {selectedCarrierDocument.title || "Dokumento peržiūra"} - {selectedCarrierDocument.carrierName || "-"}
              </h2>
              <button onClick={() => setShowCarrierDocumentModal(false)} style={closeButton}>✕</button>
            </div>

            <div style={documentInfoBox}>
              <div style={{ fontWeight: "700", color: "#1e3a8a", marginBottom: "6px" }}>
                {selectedCarrierDocument.title || "-"}
              </div>
              <div style={{ color: "#64748b", fontSize: "14px" }}>
                Galioja iki: {selectedCarrierDocument.validUntil || "-"}
              </div>
            </div>

            <div style={{ marginBottom: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {selectedCarrierDocument.link ? (
                <a href={selectedCarrierDocument.link} target="_blank" rel="noreferrer" style={primaryLinkButton}>
                  Atidaryti dokumentą
                </a>
              ) : null}
            </div>

            {canPreviewDocument ? (
              <iframe
                title="carrier-document-preview"
                src={selectedCarrierDocument.link}
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




































