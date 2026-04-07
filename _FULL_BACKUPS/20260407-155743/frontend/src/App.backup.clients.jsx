import { useMemo, useState } from "react";

const defaultDepartments = () => ([
  { id: 1, title: "Administracija", phone: "", email: "" },
  { id: 2, title: "Buhalterija", phone: "", email: "" },
  { id: 3, title: "Klientų aptarnavimas", phone: "", email: "" },
  { id: 4, title: "Personalas", phone: "", email: "" },
  { id: 5, title: "Krovinių gabenimas", phone: "", email: "" }
]);

function App() {
  const [page, setPage] = useState("clients");

  const [clients, setClients] = useState(() => {
    return JSON.parse(localStorage.getItem("radanaras_clients") || "[]");
  });

  const [carriers] = useState(() => {
    return JSON.parse(localStorage.getItem("radanaras_carriers") || "[]");
  });

  const [orders] = useState(() => {
    return JSON.parse(localStorage.getItem("radanaras_orders") || "[]");
  });

  const [selectedClientId, setSelectedClientId] = useState(null);

  const [showClientModal, setShowClientModal] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);

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

  const [clientForm, setClientForm] = useState(emptyClientForm);

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

  const saveClients = (next) => {
    setClients(next);
    localStorage.setItem("radanaras_clients", JSON.stringify(next));
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

  const handleClientFieldChange = (field, value) => {
    setClientForm(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (contactId, field, value) => {
    setClientForm(prev => ({
      ...prev,
      contacts: prev.contacts.map(contact =>
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

  const handleDepartmentChange = (departmentId, field, value) => {
    setClientForm(prev => ({
      ...prev,
      departmentContacts: prev.departmentContacts.map(dep =>
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

  const removeDepartmentRow = (departmentId) => {
    setClientForm(prev => {
      const filtered = prev.departmentContacts.filter(dep => dep.id !== departmentId);
      return {
        ...prev,
        departmentContacts: filtered.length > 0 ? filtered : defaultDepartments()
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
        <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>Vežėjai</h2>
        <p style={emptyText}>Vežėjus sutvarkysime kitame žingsnyje.</p>
      </div>
    );
  };

  const renderOrders = () => {
    return (
      <div>
        <h2 style={{ marginTop: 0, color: "#1e3a8a" }}>Užsakymai</h2>
        <p style={emptyText}>Užsakymų modulį tęsime po klientų ir vežėjų.</p>
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      fontFamily: "Arial, sans-serif",
      padding: "24px"
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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

const smallActionButton = {
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

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "white",
  borderRadius: "10px",
  overflow: "hidden"
};

const thStyle = {
  padding: "14px",
  textAlign: "left",
  fontSize: "13px",
  color: "#475569",
  borderBottom: "1px solid #e2e8f0"
};

const tdStyle = {
  padding: "14px",
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
  padding: "24px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.20)"
};

const profileModalStyle = {
  background: "white",
  width: "100%",
  maxWidth: "1100px",
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: "16px",
  padding: "24px",
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

export default App;
