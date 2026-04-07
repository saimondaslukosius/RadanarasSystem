const { useState, useEffect } = React;

        // OneDrive URL Input Component
        // OneDrive URL Input Component
        function OneDriveUrlInput({ label, value, onChange, required }) {
            const [showHelp, setShowHelp] = useState(false);

            return (
                <div className="form-group">
                    <label>
                        {label} {required && '*'}
                        <button 
                            type="button"
                            onClick={() => setShowHelp(!showHelp)}
                            style={{
                                marginLeft: '8px',
                                background: 'none',
                                border: 'none',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ā¯“ Kaip gauti link?
                        </button>
                    </label>
                    <input 
                        type="url"
                        placeholder="https://1drv.ms/b/... arba https://onedrive.live.com/..."
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        required={required}
                        style={{width: '100%'}}
                    />
                    {showHelp && (
                        <div style={{
                            marginTop: '8px',
                            padding: '12px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#1e40af'
                        }}>
                            <strong>š“‹ Instrukcijos:</strong>
                            <ol style={{margin: '8px 0 0 0', paddingLeft: '20px'}}>
                                <li>Atidaryk <strong>OneDrive</strong> (onedrive.live.com)</li>
                                <li>Upload'ink failÄ… ÄÆ folderÄÆ</li>
                                <li><strong>Right click</strong> ant failo ā†’ <strong>Share</strong></li>
                                <li><strong>Copy link</strong> ā†’ paste Ä¨ia</li>
                            </ol>
                            <div style={{marginTop: '8px', fontSize: '12px', fontStyle: 'italic'}}>
                                š’ Arba: Share ā†’ Embed ā†’ nukopijuok embed URL
                            </div>
                        </div>
                    )}
                    {value && (
                        <div style={{
                            marginTop: '6px',
                            fontSize: '12px',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            ā… Link iÅsaugotas
                        </div>
                    )}
                </div>
            );
        }

        // LocalStorage helper
        const storage = {
            get: (key) => {
                try {
                    return JSON.parse(localStorage.getItem(key)) || [];
                } catch {
                    return [];
                }
            },
            set: (key, value) => {
                localStorage.setItem(key, JSON.stringify(value));
            }
        };

        // Convert OneDrive share link to embed link
        const convertToEmbedUrl = (url) => {
            if (!url) return null;
            
            // Already an embed URL
            if (url.includes('embed')) return url;
            
            // 1drv.ms short link - convert to embed
            if (url.includes('1drv.ms')) {
                // Add embed parameter
                return url + (url.includes('?') ? '&' : '?') + 'action=embedview';
            }
            
            // onedrive.live.com share link - convert to embed
            if (url.includes('onedrive.live.com')) {
                // Extract resid and authkey if present
                const resIdMatch = url.match(/resid=([^&]+)/);
                const authKeyMatch = url.match(/authkey=([^&]+)/);
                
                if (resIdMatch) {
                    let embedUrl = `https://onedrive.live.com/embed?resid=${resIdMatch[1]}`;
                    if (authKeyMatch) {
                        embedUrl += `&authkey=${authKeyMatch[1]}`;
                    }
                    embedUrl += '&em=2'; // Enable embed mode
                    return embedUrl;
                }
                
                // Fallback - add embed parameter
                return url.replace('/view', '/embed') + (url.includes('?') ? '&' : '?') + 'em=2';
            }
            
            // Unknown format - return as is with embed hint
            return url + (url.includes('?') ? '&' : '?') + 'action=embedview';
        };

        // Price to Words Converter (Lithuanian)
        function numberToWordsLT(number) {
            if (!number || number === 0) return 'nulis';
            
            const ones = ['', 'vienas', 'du', 'trys', 'keturi', 'penki', 'ÅeÅi', 'septyni', 'aÅtuoni', 'devyni'];
            const tens = ['', 'deÅimt', 'dvideÅimt', 'trisdeÅimt', 'keturiasdeÅimt', 'penkiasdeÅimt', 
                          'ÅeÅiasdeÅimt', 'septyniasdeÅimt', 'aÅtuoniasdeÅimt', 'devyniasdeÅimt'];
            const hundreds = ['', 'vienas Åimtas', 'du Åimtai', 'trys Åimtai', 'keturi Åimtai', 'penki Åimtai',
                              'ÅeÅi Åimtai', 'septyni Åimtai', 'aÅtuoni Åimtai', 'devyni Åimtai'];
            const teens = ['deÅimt', 'vienuolika', 'dvylika', 'trylika', 'keturiolika', 'penkiolika',
                          'ÅeÅiolika', 'septyniolika', 'aÅtuoniolika', 'devyniolika'];
            
            const num = parseInt(number);
            
            if (num < 10) return ones[num];
            if (num < 20) return teens[num - 10];
            if (num < 100) {
                const ten = Math.floor(num / 10);
                const one = num % 10;
                return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
            }
            if (num < 1000) {
                const hundred = Math.floor(num / 100);
                const rest = num % 100;
                return hundreds[hundred] + (rest > 0 ? ' ' + numberToWordsLT(rest) : '');
            }
            if (num < 1000000) {
                const thousands = Math.floor(num / 1000);
                const rest = num % 1000;
                let result = '';
                if (thousands === 1) result = 'vienas tÅ«kstantis';
                else if (thousands < 10) result = ones[thousands] + ' tÅ«kstanÄ¨iai';
                else if (thousands < 20) result = teens[thousands - 10] + ' tÅ«kstanÄ¨iÅ³';
                else result = numberToWordsLT(thousands) + ' tÅ«kstanÄ¨iÅ³';
                return result + (rest > 0 ? ' ' + numberToWordsLT(rest) : '');
            }
            
            return number.toString(); // Fallback for very large numbers
        }

        // Template Rendering Utility - Fills template with actual order data
        function renderTemplate(templateContent, orderData) {
            if (!templateContent || !orderData) return '';
            
            let html = templateContent;
            
            // Basic info
            html = html.replace(/{{order_number}}/g, orderData.orderNumber || '');
            html = html.replace(/{{today_date}}/g, new Date().toLocaleDateString('lt-LT'));
            
            // Cargo
            html = html.replace(/{{cargo}}/g, orderData.cargo || '');
            html = html.replace(/{{vehicle_count}}/g, orderData.vehicleCount || '');
            html = html.replace(/{{route}}/g, orderData.route || '');
            
            // Transport & Driver
            html = html.replace(/{{truck_plate}}/g, orderData.truckPlate || '');
            html = html.replace(/{{trailer_plate}}/g, orderData.trailerPlate || '');
            html = html.replace(/{{driver_name}}/g, orderData.driverName || '');
            
            // Loading address with coordinates
            html = html.replace(/{{loading_company_name}}/g, orderData.loadingCompanyName || '');
            html = html.replace(/{{loading_city}}/g, orderData.loadingCity || '');
            html = html.replace(/{{loading_street}}/g, orderData.loadingStreet || '');
            html = html.replace(/{{loading_postal_code}}/g, orderData.loadingPostalCode || '');
            html = html.replace(/{{loading_coordinates}}/g, orderData.loadingCoordinates || '');
            html = html.replace(/{{loading_date}}/g, orderData.loadingDate || '');
            
            // Unloading address with coordinates
            html = html.replace(/{{unloading_company_name}}/g, orderData.unloadingCompanyName || '');
            html = html.replace(/{{unloading_city}}/g, orderData.unloadingCity || '');
            html = html.replace(/{{unloading_street}}/g, orderData.unloadingStreet || '');
            html = html.replace(/{{unloading_postal_code}}/g, orderData.unloadingPostalCode || '');
            html = html.replace(/{{unloading_coordinates}}/g, orderData.unloadingCoordinates || '');
            html = html.replace(/{{unloading_date}}/g, orderData.unloadingDate || '');
            
            // PRICING WITH +PVM LOGIC
            const price = parseFloat(orderData.carrierPrice) || 0;
            const withVAT = orderData.carrierPriceWithVAT === true || orderData.carrierPriceWithVAT === 'true';
            const priceDisplay = withVAT ? `${price.toFixed(2)} EUR + PVM` : `${price.toFixed(2)} EUR`;
            html = html.replace(/{{carrier_price_display}}/g, priceDisplay);
            
            // PAYMENT TERMS WITH ORIGINALS LOGIC
            const paymentTerm = orderData.paymentTerm || '14 dienÅ³';
            const originalsRequired = orderData.originalsRequired === true || orderData.originalsRequired === 'true';
            const paymentTermsText = originalsRequired 
                ? `${paymentTerm} po PVM sÄ…skaitos-faktÅ«ros ir vaÅ¾taraÅÄ¨io su krovinio gavimo data ir gavÄ—jo vardu, pavarde, paraÅu originalÅ³ gavimo.`
                : `${paymentTerm} po dokumentÅ³ ÄÆkÄ—limo ÄÆ sistemÄ….`;
            html = html.replace(/{{payment_terms_text}}/g, paymentTermsText);
            html = html.replace(/{{payment_term}}/g, paymentTerm);
            
            // Document upload link
            const docLink = orderData.documentUploadLink || `https://radanaras.com/upload/${orderData.orderNumber || 'ORDER'}`;
            html = html.replace(/{{document_upload_link}}/g, docLink);
            
            // ADDITIONAL INFO - Show only filled fields
            let additionalInfoRows = '';
            const additionalFields = [
                { label: 'Load/Ref (pakrovimas):', value: orderData.loadRefLoading, bgColor: '#fef3c7', borderColor: '#fde047', textColor: '#713f12' },
                { label: 'Load/Ref (iÅkrovimas):', value: orderData.loadRefUnloading, bgColor: '#fef3c7', borderColor: '#fde047', textColor: '#713f12' },
                { label: 'VIN numeriai:', value: orderData.vinNumbers, bgColor: '#f8fafc', borderColor: '#e2e8f0', textColor: '#475569' },
                { label: 'Instrukcijos veÅ¾Ä—jui:', value: orderData.instructions, bgColor: '#f8fafc', borderColor: '#e2e8f0', textColor: '#475569' },
                { label: 'OriginalÅ«s dokumentai:', value: originalsRequired ? 'REIKALINGI' : 'NEREIKALINGI', bgColor: '#fee2e2', borderColor: '#fca5a5', textColor: '#991b1b' }
            ];
            
            additionalFields.forEach(field => {
                if (field.value && field.value.trim() !== '') {
                    additionalInfoRows += `<tr style="background: ${field.bgColor};">
<td style="padding: 10px 15px; border: 1px solid ${field.borderColor}; font-weight: 600; width: 32%; color: ${field.textColor};">${field.label}</td>
<td style="padding: 10px 15px; border: 1px solid ${field.borderColor}; color: #1e293b; font-family: monospace; font-size: 11px;">${field.value}</td>
</tr>`;
                }
            });
            
            if (additionalInfoRows === '') {
                additionalInfoRows = '<tr><td colspan="2" style="padding: 10px; text-align: center; color: #94a3b8; font-size: 11px;">Papildomos informacijos nÄ—ra</td></tr>';
            }
            
            html = html.replace(/{{additional_info_rows}}/g, additionalInfoRows);
            
            // Carrier info
            html = html.replace(/{{carrier_name}}/g, orderData.carrierName || '');
            html = html.replace(/{{carrier_company_code}}/g, orderData.carrierCompanyCode || '');
            html = html.replace(/{{carrier_vat}}/g, orderData.carrierVAT || '');
            html = html.replace(/{{carrier_address}}/g, orderData.carrierAddress || '');
            html = html.replace(/{{carrier_email}}/g, orderData.carrierEmail || '');
            html = html.replace(/{{carrier_phone}}/g, orderData.carrierPhone || '');
            
            // Company logo
            html = html.replace(/{{company_logo}}/g, orderData.companyLogo || '');

            // Company stamp/signature - from settings or placeholder
            const stampHTML = orderData.companyStampSignature 
                ? `<img src="${orderData.companyStampSignature}" style="max-height: 110px; max-width: 150px; object-fit: contain;" />`
                : '<p style="margin: 0; color: #cbd5e1; font-size: 10px; text-align: center;">Antspaudas<br/>nesukurtas</p>';
            html = html.replace(/{{company_stamp_signature}}/g, stampHTML);
            
            return html;
        }

        function App() {
            const [activeTab, setActiveTab] = useState('dashboard');
            const [clients, setClients] = useState([]);
            const [carriers, setCarriers] = useState([]);
            const [orders, setOrders] = useState([]);
            const [showModal, setShowModal] = useState(false);
            const [modalType, setModalType] = useState('');
            const [modalData, setModalData] = useState(null);
            const [settings, setSettings] = useState({});

            useEffect(() => {
                // Load data
                setClients(storage.get('clients'));
                let loadedCarriers = storage.get('carriers');
                setOrders(storage.get('orders'));
                
                // Initialize settings with defaults
                const loadedSettings = storage.get('settings');
                const defaultSettings = {
                    environment: 'production',
                    company: {
                        name: 'Radanaras MB',
                        code: '305779537',
                        vat: 'LT100014108415',
                        address: 'KlevÅ³ g 9, MarijampolÄ—, LT69331 ValaviÄ¨iai',
                        phone: '+370 644 46543',
                        email: 'info@radanaras.com',
                        logo_url: '',
                        signature_url: '',
                        bank_name: 'Swedbank',
                        bank_account: '',
                        swift: 'HABALT22',
                        footer_text: 'UAB Radanaras | Reg. kodas 305779537 | PVM: LT100014108415'
                    },
                    companyStampSignature: '',
                    documents: {
                        auto_numbering_format: 'RAD-{YEAR}-{NUMBER}',
                        default_language: 'lt',
                        show_vat: true,
                        show_logo: true,
                        logo_position: 'top-left',
                        show_company_details: true,
                        details_position: 'footer',
                        terms_lt: '1. Krovinys draudÅ¾iamas CMR draudimu.\n2. MokÄ—jimo terminas 14 dienÅ³ nuo sÄ…skaitos faktÅ«ros iÅraÅymo datos.\n3. VeÅ¾Ä—jas privalo turÄ—ti galiojanÄ¨iÄ… licencijÄ… ir draudimÄ….'
                    },
                    email: {
                        from_address: 'orderiai@radanaras.com',
                        from_name: 'Radanaras MB',
                        auto_send_to_carrier: false,
                        auto_attach_pdf: true,
                        always_cc: ['saimondaslukosius@radanaras.com'],
                        template_subject_lt: 'Naujas orderis #{order_number} - {client_name}',
                        template_body_lt: 'Sveiki,\n\nSiunÄ¨iame naujÄ… transporto uÅ¾sakymÄ….\n\nPagarbiai,\nRadanaras MB'
                    },
                    reminders: {
                        cmr_expiry_warning_days: 30,
                        license_expiry_warning_days: 30,
                        missing_pod_reminder_days: 7,
                        payment_reminder_days: 14
                    },
                    templates: []
                };
                setSettings(loadedSettings.environment ? loadedSettings : defaultSettings);
                
                // Initialize Radanaras MB as own_fleet carrier if not exists
                const radanarasExists = loadedCarriers.find(c => c.id === 'radanaras_mb');
                if (!radanarasExists) {
                    const radanarasMB = {
                        id: 'radanaras_mb',
                        name: 'Radanaras MB',
                        companyCode: '305779537',
                        vatCode: 'LT100014108415',
                        phone: '+370 644 46543',
                        email: 'info@radanaras.com',
                        address: 'KlevÅ³ g 9, MarijampolÄ—, LT69331 ValaviÄ¨iai',
                        carrierType: 'own_fleet',
                        cmrExpiry: null,
                        cmrUrl: null,
                        licenseExpiry: null,
                        licenseUrl: null,
                        createdAt: new Date().toISOString(),
                        isOwnCompany: true
                    };
                    loadedCarriers = [radanarasMB, ...loadedCarriers];
                    storage.set('carriers', loadedCarriers);
                }
                setCarriers(loadedCarriers);
            }, []);

            const saveClients = (data) => {
                setClients(data);
                storage.set('clients', data);
            };

            const saveCarriers = (data) => {
                setCarriers(data);
                storage.set('carriers', data);
            };

            const saveOrders = (data) => {
                setOrders(data);
                storage.set('orders', data);
            };

            const saveSettings = (data) => {
                setSettings(data);
                storage.set('settings', data);
            };

            const openModal = (type, data = null) => {
                setModalType(type);
                setModalData(data);
                setShowModal(true);
            };

            return (
                <div className="app-container">
                    <header className="header">
                        <div className="logo-section">
                            <div className="logo-icon">R</div>
                            <div className="company-info">
                                <h1>Radanaras MB</h1>
                                <p>Your Cargo, Our Commitment</p>
                            </div>
                        </div>
                        <div className="user-info">
                            <div className="name">Saimondas Lukosius</div>
                            <div className="role">Head of International Freight</div>
                        </div>
                    </header>

                    <nav className="nav-tabs">
                        <button 
                            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            š“ Dashboard
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'clients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clients')}
                        >
                            š‘ Klientai
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'carriers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('carriers')}
                        >
                            š› VeÅ¾Ä—jai
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            š“¦ UÅ¾sakymai
                        </button>
                        <button 
                            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            ā™ļø¸ Nustatymai
                        </button>
                    </nav>

                    {activeTab === 'dashboard' && (
                        <Dashboard clients={clients} carriers={carriers} orders={orders} />
                    )}

                    {activeTab === 'clients' && (
                        <Clients 
                            clients={clients} 
                            saveClients={saveClients}
                            openModal={() => openModal('client')}
                        />
                    )}

                    {activeTab === 'carriers' && (
                        <Carriers 
                            carriers={carriers} 
                            saveCarriers={saveCarriers}
                            openModal={() => openModal('carrier')}
                        />
                    )}

                    {activeTab === 'orders' && (
                        <Orders 
                            orders={orders} 
                            saveOrders={saveOrders}
                            clients={clients}
                            carriers={carriers}
                            openModal={() => openModal('order')}
                            settings={settings}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <Settings 
                            settings={settings}
                            saveSettings={saveSettings}
                        />
                    )}

                    {showModal && (
                        <Modal 
                            type={modalType}
                            initialData={modalData}
                            onClose={() => { setShowModal(false); setModalData(null); }}
                            clients={clients}
                            carriers={carriers}
                            saveClients={saveClients}
                            saveCarriers={saveCarriers}
                            saveOrders={saveOrders}
                            orders={orders}
                            settings={settings}
                        />
                    )}
                </div>
            );
        }

        function Settings({ settings, saveSettings }) {
            const [formData, setFormData] = useState(settings);
            const [activeSection, setActiveSection] = useState('company');

            const handleSave = (section) => {
                saveSettings(formData);
                alert('ā… Nustatymai iÅsaugoti!');
            };

            return (
                <div className="content-card">
                    <div className="card-header">
                        <h2>ā™ļø¸ Nustatymai</h2>
                    </div>

                    <div style={{display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap'}}>
                        <button 
                            className={`btn ${activeSection === 'company' ? '' : 'btn-secondary'}`}
                            onClick={() => setActiveSection('company')}
                        >
                            š¸¢ Ä®monÄ—s duomenys
                        </button>
                        <button 
                            className={`btn ${activeSection === 'documents' ? '' : 'btn-secondary'}`}
                            onClick={() => setActiveSection('documents')}
                        >
                            š“„ Dokumentai
                        </button>
                        <button 
                            className={`btn ${activeSection === 'email' ? '' : 'btn-secondary'}`}
                            onClick={() => setActiveSection('email')}
                        >
                            š“§ El. paÅtas
                        </button>
                        <button 
                            className={`btn ${activeSection === 'templates' ? '' : 'btn-secondary'}`}
                            onClick={() => setActiveSection('templates')}
                        >
                            š“¯ UÅ¾sakymÅ³ Åablonai
                        </button>
                    </div>

                    {activeSection === 'company' && (
                        <div>
                            <h3 style={{marginBottom: '16px', color: '#1e3a8a'}}>š¸¢ Ä®monÄ—s duomenys</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Aplinka</label>
                                    <select 
                                        value={formData.environment}
                                        onChange={(e) => setFormData({...formData, environment: e.target.value})}
                                    >
                                        <option value="test">š§Ŗ Test / Demo</option>
                                        <option value="production">š€ Production / Reali</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Pavadinimas *</label>
                                    <input 
                                        value={formData.company.name}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, name: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ä®monÄ—s kodas *</label>
                                    <input 
                                        value={formData.company.code}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, code: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PVM kodas *</label>
                                    <input 
                                        value={formData.company.vat}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, vat: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefonas *</label>
                                    <input 
                                        value={formData.company.phone}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, phone: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input 
                                        type="email"
                                        value={formData.company.email}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, email: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adresas</label>
                                    <input 
                                        value={formData.company.address}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, address: e.target.value}})}
                                    />
                                </div>
                            </div>

                            <h4 style={{marginTop: '24px', marginBottom: '12px', color: '#1e3a8a'}}>Banko duomenys</h4>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Bankas</label>
                                    <input 
                                        value={formData.company.bank_name}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, bank_name: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SÄ…skaitos nr.</label>
                                    <input 
                                        value={formData.company.bank_account}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, bank_account: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SWIFT</label>
                                    <input 
                                        value={formData.company.swift}
                                        onChange={(e) => setFormData({...formData, company: {...formData.company, swift: e.target.value}})}
                                    />
                                </div>
                            </div>

                            <h4 style={{marginTop: '24px', marginBottom: '12px', color: '#1e3a8a'}}>Ä®monÄ—s antspaudas ir paraÅas</h4>
                            <div style={{marginBottom: '20px'}}>
                                <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                                    Ä®kelkite ÄÆmonÄ—s antspaudÄ… su direktoriaus paraÅu
                                </label>
                                <div style={{fontSize: '12px', color: '#64748b', marginBottom: '12px'}}>
                                    Å is antspaudas bus automatiÅkai ÄÆterpiamas ÄÆ visus orderius veÅ¾Ä—jams. Rekomenduojamas PNG formatas su permatomu fonu.
                                </div>
                                
                                {formData.companyStampSignature ? (
                                    <div style={{marginBottom: '12px'}}>
                                        <div style={{
                                            padding: '16px',
                                            background: '#f8fafc',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '8px',
                                            display: 'inline-block'
                                        }}>
                                            <img 
                                                src={formData.companyStampSignature} 
                                                style={{maxHeight: '120px', maxWidth: '200px', display: 'block'}}
                                                alt="Company Stamp"
                                            />
                                        </div>
                                        <button 
                                            className="btn btn-secondary"
                                            style={{marginTop: '10px', fontSize: '13px'}}
                                            onClick={() => {
                                                if (confirm('Ar tikrai norite paÅalinti antspaudÄ…?')) {
                                                    setFormData({...formData, companyStampSignature: ''});
                                                }
                                            }}
                                        >
                                            š—‘ļø¸ PaÅalinti antspaudÄ…
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{marginBottom: '12px'}}>
                                        <input 
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    // Validate file size (max 500KB)
                                                    if (file.size > 500 * 1024) {
                                                        alert('ā ļø¸ Failas per didelis! Maksimalus dydis: 500 KB');
                                                        e.target.value = '';
                                                        return;
                                                    }
                                                    
                                                    // Convert to Base64
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        setFormData({
                                                            ...formData,
                                                            companyStampSignature: event.target.result
                                                        });
                                                    };
                                                    reader.onerror = () => {
                                                        alert('ā¯ Klaida ÄÆkeliant failÄ…');
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            style={{
                                                padding: '10px',
                                                border: '2px dashed #cbd5e1',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                width: '100%',
                                                maxWidth: '400px'
                                            }}
                                        />
                                        <div style={{fontSize: '11px', color: '#64748b', marginTop: '6px'}}>
                                            ā“ Formatai: PNG, JPG | ā“ Maks. dydis: 500 KB | ā“ Rekomenduojamas: PNG su permatomu fonu
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="btn btn-success" onClick={() => handleSave('company')} style={{marginTop: '20px'}}>
                                š’¾ IÅsaugoti Ä®monÄ—s Duomenis
                            </button>
                        </div>
                    )}

                    {activeSection === 'documents' && (
                        <div>
                            <h3 style={{marginBottom: '16px', color: '#1e3a8a'}}>š“„ DokumentÅ³ nustatymai</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Numeracijos formatas</label>
                                    <input 
                                        value={formData.documents.auto_numbering_format}
                                        onChange={(e) => setFormData({...formData, documents: {...formData.documents, auto_numbering_format: e.target.value}})}
                                        placeholder="RAD-{YEAR}-{NUMBER}"
                                    />
                                    <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                                        Pvz: RAD-2026-001
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Kalba pagal nutylÄ—jimÄ…</label>
                                    <select 
                                        value={formData.documents.default_language}
                                        onChange={(e) => setFormData({...formData, documents: {...formData.documents, default_language: e.target.value}})}
                                    >
                                        <option value="lt">š‡±š‡¹ LietuviÅ³</option>
                                        <option value="en">š‡¬š‡§ English</option>
                                        <option value="pl">š‡µš‡± Polski</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{marginTop: '16px'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                                    <input 
                                        type="checkbox"
                                        checked={formData.documents.show_vat}
                                        onChange={(e) => setFormData({...formData, documents: {...formData.documents, show_vat: e.target.checked}})}
                                    />
                                    Rodyti PVM dokumentuose
                                </label>
                            </div>

                            <div style={{marginTop: '16px'}}>
                                <label>SÄ…lygÅ³ tekstas (LT)</label>
                                <textarea 
                                    rows="6"
                                    value={formData.documents.terms_lt}
                                    onChange={(e) => setFormData({...formData, documents: {...formData.documents, terms_lt: e.target.value}})}
                                    style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                                />
                            </div>

                            <button className="btn btn-success" onClick={() => handleSave('documents')} style={{marginTop: '20px'}}>
                                š’¾ IÅsaugoti DokumentÅ³ Nustatymus
                            </button>
                        </div>
                    )}

                    {activeSection === 'email' && (
                        <div>
                            <h3 style={{marginBottom: '16px', color: '#1e3a8a'}}>š“§ El. paÅto nustatymai</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>SiuntÄ—jo adresas</label>
                                    <input 
                                        type="email"
                                        value={formData.email.from_address}
                                        onChange={(e) => setFormData({...formData, email: {...formData.email, from_address: e.target.value}})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SiuntÄ—jo vardas</label>
                                    <input 
                                        value={formData.email.from_name}
                                        onChange={(e) => setFormData({...formData, email: {...formData.email, from_name: e.target.value}})}
                                    />
                                </div>
                            </div>

                            <div style={{marginTop: '16px'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                                    <input 
                                        type="checkbox"
                                        checked={formData.email.auto_attach_pdf}
                                        onChange={(e) => setFormData({...formData, email: {...formData.email, auto_attach_pdf: e.target.checked}})}
                                    />
                                    AutomatiÅkai prisegti PDF
                                </label>
                            </div>

                            <div className="form-group" style={{marginTop: '16px'}}>
                                <label>Visada CC (atskirti kableliais)</label>
                                <input 
                                    value={formData.email.always_cc.join(', ')}
                                    onChange={(e) => setFormData({...formData, email: {...formData.email, always_cc: e.target.value.split(',').map(s => s.trim())}})}
                                    placeholder="email1@example.com, email2@example.com"
                                />
                            </div>

                            <button className="btn btn-success" onClick={() => handleSave('email')} style={{marginTop: '20px'}}>
                                š’¾ IÅsaugoti Email Nustatymus
                            </button>
                        </div>
                    )}

                    {activeSection === 'templates' && (
                        <TemplateManager 
                            settings={formData}
                            saveSettings={(newSettings) => { setFormData(newSettings); saveSettings(newSettings); }}
                        />
                    )}
                </div>
            );
        }

        function TemplateManager({ settings, saveSettings }) {
            // PROFESSIONAL CARRIER ORDER TEMPLATE - Updated per exact specifications
            const defaultTemplateContent = `<div class="order-document">
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr>
      <td style="width: 72%; vertical-align: top; padding: 0 0 10px 0;">
        <div style="height: 95px; display: flex; align-items: center; justify-content: flex-start;">
          <img src="{{company_logo}}" alt="Radanaras MB" style="max-height: 78px; max-width: 360px; object-fit: contain;" />
        </div>
      </td>
      <td style="width: 28%; vertical-align: bottom; text-align: right; font-size: 12px; padding-bottom: 12px;">
      </td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td style="width: 76%; border-top: 1px solid #222; padding-top: 8px; font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2px;">
        VIENKARTINÄ– KROVINIO PERVEÅ½IMO SUTARTIS Nr. {{order_number}}
      </td>
      <td style="width: 24%; border-top: 1px solid #222; padding-top: 8px; text-align: right; font-size: 14px; font-weight: 700;">
        Data: {{today_date}}
      </td>
    </tr>
  </table>

  <div style="font-size: 13px; margin: 0 0 12px 0;">
    Tarp <strong>{{carrier_name}}</strong>, toliau VeÅ¾Ä—jas, ir <strong>MB Radanaras</strong>, toliau UÅ¾sakovas
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; table-layout: fixed;">
    <tr>
      <td style="width: 26%; border: 1px solid #222; padding: 5px 8px; font-weight: 700;">Krovinys:</td>
      <td style="width: 74%; border: 1px solid #222; padding: 5px 8px;">{{cargo}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">AutomobiliÅ³ skaiÄ¨ius:</td>
      <td style="border: 1px solid #222; padding: 5px 8px;">{{vehicle_count}} vnt.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">MarÅrutas:</td>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">{{route}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">Vilkikas (valst. nr.):</td>
      <td style="border: 1px solid #222; padding: 5px 8px;">{{truck_plate}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">Priekaba (valst. nr.):</td>
      <td style="border: 1px solid #222; padding: 5px 8px;">{{trailer_plate}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">Vairuotojas:</td>
      <td style="border: 1px solid #222; padding: 5px 8px;">{{driver_name}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700; vertical-align: top;">Pakrovimas (SiuntÄ—jas):</td>
      <td style="border: 1px solid #222; padding: 5px 8px; line-height: 1.45;">
        <strong>{{loading_company_name}}</strong><br/>
        {{loading_street}}<br/>
        {{loading_postal_code}} {{loading_city}}<br/>
        KoordinatÄ—s: {{loading_coordinates}}<br/>
        Data: {{loading_date}}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700; vertical-align: top;">IÅkrovimas (GavÄ—jas):</td>
      <td style="border: 1px solid #222; padding: 5px 8px; line-height: 1.45;">
        <strong>{{unloading_company_name}}</strong><br/>
        {{unloading_street}}<br/>
        {{unloading_postal_code}} {{unloading_city}}<br/>
        KoordinatÄ—s: {{unloading_coordinates}}<br/>
        Data: {{unloading_date}}
      </td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">PerveÅ¾imo kaina:</td>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">{{carrier_price_display}}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #222; padding: 5px 8px; font-weight: 700;">ApmokÄ—jimo terminas:</td>
      <td style="border: 1px solid #222; padding: 5px 8px;">{{payment_terms_text}}</td>
    </tr>
  </table>

  <div style="font-size: 12px; margin: 10px 0 4px 0; font-weight: 700;">DokumentÅ³ ÄÆkÄ—limo nuoroda veÅ¾Ä—jui:</div>
  <div style="font-size: 12px; margin-bottom: 12px; word-break: break-all;">{{document_upload_link}}</div>

  <div style="font-size: 14px; font-weight: 700; margin: 10px 0 6px 0;">Papildoma informacija</div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; table-layout: fixed;">
    <tbody>
      {{additional_info_rows}}
    </tbody>
  </table>

  <div class="page-break-before"></div>
  <div style="font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">Sutarties sÄ…lygos</div>
  <ol style="font-size: 11px; line-height: 1.5; color: #111; padding-left: 18px; margin-bottom: 18px;">
    <li><strong>CMR draudimas ir konvencija.</strong> Krovinys veÅ¾amas pagal CMR konvencijÄ…. VeÅ¾Ä—jas privalo turÄ—ti galiojantÄÆ CMR draudimÄ…, dengiantÄÆ atsakomybÄ™ uÅ¾ krovinio praradimÄ… ar sugadinimÄ… veÅ¾imo metu.</li>
    <li><strong>Transporto priemonÄ—s tinkamumas.</strong> VeÅ¾Ä—jas uÅ¾tikrina, kad transporto priemonÄ—s (vilkikas, priekaba) yra techniÅkai tvarkingos, turi galiojanÄ¨ias licencijas ir leidimus tarptautiniam veÅ¾imui.</li>
    <li><strong>Krovinio priÄ—mimas ir patikra.</strong> VeÅ¾Ä—jas privalo patikrinti krovinio bÅ«klÄ™ ir kiekÄÆ pakrovimo metu. Jeigu pastebimi neatitikimai, defektai ar paÅ¾eidimai, apie tai privaloma nedelsiant informuoti UÅ¾sakovÄ… ir paÅ¾ymÄ—ti CMR dokumente.</li>
    <li><strong>Vairuotojo pareigos.</strong> Vairuotojas privalo laikytis keliÅ³ eismo taisykliÅ³, darbo ir poilsio reÅ¾imo, kroviniÅ³ veÅ¾imo taisykliÅ³, turÄ—ti visus bÅ«tinus dokumentus ir bÅ«ti pasirengÄ™s bendradarbiauti su siuntÄ—ju bei gavÄ—ju.</li>
    <li><strong>DokumentÅ³ pateikimas.</strong> CMR vaÅ¾taraÅtis privalo bÅ«ti aiÅkiai uÅ¾pildytas ir pasiraÅytas. VeÅ¾Ä—jas privalo pateikti dokumentus pagal Åiame uÅ¾sakyme nustatytÄ… tvarkÄ… ir terminus.</li>
    <li><strong>Informavimas apie vÄ—lavimus, Å¾alÄ… ir incidentus.</strong> VeÅ¾Ä—jas privalo nedelsiant informuoti UÅ¾sakovÄ… apie bet kokius vÄ—lavimus, incidentus, krovinio sugadinimÄ…, trÅ«kumus ar kitas aplinkybes, galinÄ¨ias turÄ—ti ÄÆtakos uÅ¾sakymo vykdymui.</li>
    <li><strong>AtsakomybÄ— uÅ¾ krovinio saugumÄ….</strong> VeÅ¾Ä—jas atsako uÅ¾ krovinio saugumÄ… nuo pakrovimo pradÅ¾ios iki iÅkrovimo pabaigos. VeÅ¾Ä—jas privalo uÅ¾tikrinti, kad krovinys bÅ«tÅ³ pristatytas tokios bÅ«klÄ—s, kokios buvo perduotas.</li>
    <li><strong>PerveÅ¾imo perdavimo draudimas.</strong> VeÅ¾Ä—jas be iÅankstinio raÅtiÅko UÅ¾sakovo sutikimo neturi teisÄ—s perduoti Åio uÅ¾sakymo vykdymo tretiesiems asmenims.</li>
    <li><strong>MokÄ—jimo termino skaiÄ¨iavimo tvarka.</strong> MokÄ—jimo terminas pradedamas skaiÄ¨iuoti nuo Åiame uÅ¾sakyme nurodyto momento, priklausomai nuo originaliÅ³ dokumentÅ³ reikalavimo.</li>
    <li><strong>OriginalÅ³ pateikimo taisyklÄ—s.</strong> Jeigu uÅ¾sakyme nurodyta, kad originalai reikalingi, VeÅ¾Ä—jas privalo pateikti originalius dokumentus. Jeigu originalai nereikalingi, pakanka kokybiÅkai ÄÆkeltÅ³ dokumentÅ³ ÄÆ sistemÄ….</li>
    <li><strong>Konfidencialumas ir nekonkuravimas.</strong> VeÅ¾Ä—jas neturi teisÄ—s be atskiro UÅ¾sakovo sutikimo naudoti ar perduoti informacijÄ… apie UÅ¾sakovo klientus, marÅrutus ir kainas tretiesiems asmenims.</li>
    <li><strong>UÅ¾sakymo patvirtinimo ir priÄ—mimo taisyklÄ—.</strong> Jeigu VeÅ¾Ä—jas per 2 valandas nuo uÅ¾sakymo gavimo jo nepatvirtina el. paÅtu ar kitu raÅytiniu bÅ«du, taÄ¨iau pradeda vykdyti uÅ¾sakymÄ…, atvyksta ÄÆ pakrovimÄ…, priima krovinÄÆ arba kitaip pradeda vykdymÄ…, laikoma, kad VeÅ¾Ä—jas sutinka su visomis uÅ¾sakymo sÄ…lygomis.</li>
    <li><strong>Baudos uÅ¾ vÄ—lavimÄ… ir uÅ¾sakymo priÄ—mimo nevykdymÄ….</strong> Nepateikus transporto laiku ar nepagrÄÆstai atsisakius vykdyti uÅ¾sakymÄ…, UÅ¾sakovas turi teisÄ™ reikalauti nuostoliÅ³ atlyginimo.</li>
    <li><strong>GinÄ¨Å³ sprendimas.</strong> GinÄ¨ai sprendÅ¾iami derybÅ³ bÅ«du. Nepavykus susitarti, ginÄ¨ai sprendÅ¾iami Lietuvos Respublikos teisÄ—s aktÅ³ nustatyta tvarka, taikant CMR konvencijÄ….</li>
  </ol>

  <div class="page-break-before"></div>
  <div style="font-size: 13px; font-weight: 700; text-align: center; margin: 0 0 8px 0;">Å aliÅ³ rekvizitai, atsakingÅ³ asmenÅ³ pareigos, vardai, pavardÄ—s, paraÅai ir antspaudai</div>
  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 8px;">
    <tr>
      <td style="width: 50%; border: 1px solid #222; padding: 10px 12px; vertical-align: top;">
        <div style="font-weight: 700; margin-bottom: 8px;">UÅ¾sakovas</div>
        <div><strong>Pavadinimas:</strong> MB Radanaras</div>
        <div><strong>Ä®monÄ—s kodas:</strong> 305779537</div>
        <div><strong>PVM kodas:</strong> LT100014108415</div>
        <div><strong>Adresas:</strong> KlevÅ³ g. 9, LT-69331 MarijampolÄ—</div>
        <div><strong>Tel.:</strong> +370 644 46543</div>
        <div><strong>El. paÅtas:</strong> info@radanaras.com</div>
        <div style="margin-top: 8px;"><strong>Antspaudas ir paraÅas:</strong></div>
        <div style="height: 90px; display: flex; align-items: center; justify-content: center;">{{company_stamp_signature}}</div>
        <div style="margin-top: 6px;"><strong>Direktorius:</strong> Edgaras Mickus</div>
        <div style="margin-top: 14px; border-top: 1px solid #222; width: 75%; padding-top: 4px;">(paraÅas)</div>
      </td>
      <td style="width: 50%; border: 1px solid #222; padding: 10px 12px; vertical-align: top;">
        <div style="font-weight: 700; margin-bottom: 8px;">VeÅ¾Ä—jas</div>
        <div><strong>Pavadinimas:</strong> {{carrier_name}}</div>
        <div><strong>Ä®monÄ—s kodas:</strong> {{carrier_company_code}}</div>
        <div><strong>PVM kodas:</strong> {{carrier_vat}}</div>
        <div><strong>Adresas:</strong> {{carrier_address}}</div>
        <div><strong>Tel.:</strong> {{carrier_phone}}</div>
        <div><strong>El. paÅtas:</strong> {{carrier_email}}</div>
        <div style="margin-top: 8px;"><strong>Antspaudas ir paraÅas:</strong></div>
        <div style="margin-top: 24px; border-top: 1px solid #222; width: 75%; padding-top: 4px;">(paraÅas, vardas pavardÄ—)</div>
      </td>
    </tr>
  </table>

  <div style="font-size: 11px; margin-top: 10px;">Dokumentas sugeneruotas: {{today_date}} | Radanaras Logistikos Sistema v1.0</div>
</div>`;

            const [templates, setTemplates] = useState(settings.templates || []);
            const [selectedTemplate, setSelectedTemplate] = useState(null);
            const [showEditor, setShowEditor] = useState(false);
            const [showInfoModal, setShowInfoModal] = useState(false);
            const [showChoice, setShowChoice] = useState(false);
            const [editorContent, setEditorContent] = useState('');
            const [templateName, setTemplateName] = useState('');
            const [editorInstance, setEditorInstance] = useState(null);
            const [useDefaultTemplate, setUseDefaultTemplate] = useState(false);
            const editorRef = React.useRef(null);

            React.useEffect(() => {
                console.log('useEffect triggered:', {showEditor, editorInstance: !!editorInstance, selectedTemplate: !!selectedTemplate, useDefaultTemplate});
                
                // Check if CKEditor is loaded
                if (typeof ClassicEditor === 'undefined') {
                    console.warn('ā ļø¸ CKEditor not loaded yet, will retry...');
                    const retryTimer = setTimeout(() => {
                        if (typeof ClassicEditor !== 'undefined') {
                            console.log('ā… CKEditor loaded on retry!');
                            setEditorInstance(null);
                        }
                    }, 500);
                    return () => clearTimeout(retryTimer);
                }
                
                if (showEditor && editorRef.current && !editorInstance) {
                    console.log('ā… CKEditor is loaded, initializing...');
                    
                    try {
                        // Base64 Upload Adapter for images
                        class Base64UploadAdapter {
                            constructor(loader) {
                                this.loader = loader;
                            }
                            upload() {
                                return this.loader.file
                                    .then(file => new Promise((resolve, reject) => {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            resolve({ default: reader.result });
                                        };
                                        reader.onerror = error => reject(error);
                                        reader.readAsDataURL(file);
                                    }));
                            }
                            abort() {}
                        }
                        
                        function Base64UploadAdapterPlugin(editor) {
                            editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                                return new Base64UploadAdapter(loader);
                            };
                        }
                        
                        ClassicEditor
                            .create(editorRef.current, {
                                extraPlugins: [Base64UploadAdapterPlugin],
                                toolbar: {
                                    items: [
                                        'heading', '|',
                                        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
                                        'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
                                        'alignment', 'indent', 'outdent', '|',
                                        'numberedList', 'bulletedList', 'blockQuote', '|',
                                        'insertTable', 'horizontalLine', '|',
                                        'imageUpload', 'link', '|',
                                        'removeFormat', '|',
                                        'undo', 'redo'
                                    ],
                                    shouldNotGroupWhenFull: true
                                },
                                fontSize: {
                                    options: [8, 9, 10, 11, 12, 13, 14, 'default', 16, 18, 20, 22, 24, 28, 32, 36, 40, 48],
                                    supportAllValues: true
                                },
                                fontFamily: {
                                    options: [
                                        'default',
                                        'Arial, sans-serif',
                                        'Courier New, monospace',
                                        'Georgia, serif',
                                        'Times New Roman, serif',
                                        'Verdana, sans-serif',
                                        'Tahoma, sans-serif',
                                        'Trebuchet MS, sans-serif'
                                    ],
                                    supportAllValues: true
                                },
                                fontColor: {
                                    colors: [
                                        {color: '#1e3a8a', label: 'RADANARAS MÄ—lyna'},
                                        {color: '#000000', label: 'Juoda'},
                                        {color: '#ffffff', label: 'Balta', hasBorder: true},
                                        {color: '#475569', label: 'Pilka'},
                                        {color: '#64748b', label: 'Pilka Åviesiau'},
                                        {color: '#dc2626', label: 'Raudona'},
                                        {color: '#16a34a', label: 'Å½alia'},
                                        {color: '#3b82f6', label: 'MÄ—lyna'},
                                        {color: '#f59e0b', label: 'OranÅ¾inÄ—'},
                                        {color: '#8b5cf6', label: 'VioletinÄ—'},
                                    ]
                                },
                                fontBackgroundColor: {
                                    colors: [
                                        {color: '#ffffff', label: 'Balta'},
                                        {color: '#f8fafc', label: 'Pilka Åviesiai'},
                                        {color: '#dbeafe', label: 'MÄ—lyna Åviesiai'},
                                        {color: '#dcfce7', label: 'Å½alia Åviesiai'},
                                        {color: '#fef3c7', label: 'Geltona'},
                                        {color: '#fee2e2', label: 'Raudona Åviesiai'},
                                        {color: '#000000', label: 'Juoda'},
                                    ]
                                },
                                heading: {
                                    options: [
                                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                                        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                                        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                                        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
                                    ]
                                },
                                table: {
                                    contentToolbar: [
                                        'tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'
                                    ]
                                },
                                image: {
                                    toolbar: [
                                        'imageTextAlternative', 'toggleImageCaption', '|',
                                        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|',
                                        'linkImage'
                                    ],
                                    resizeUnit: 'px',
                                    resizeOptions: [
                                        {
                                            name: 'resizeImage:original',
                                            value: null,
                                            label: 'Original'
                                        },
                                        {
                                            name: 'resizeImage:25',
                                            value: '25',
                                            label: '25%'
                                        },
                                        {
                                            name: 'resizeImage:50',
                                            value: '50',
                                            label: '50%'
                                        },
                                        {
                                            name: 'resizeImage:75',
                                            value: '75',
                                            label: '75%'
                                        }
                                    ]
                                }
                            })
                            .then(editor => {
                                console.log('ā… CKEditor initialized!');
                                console.log('š”¨ Check conditions: selectedTemplate=', !!selectedTemplate, 'useDefaultTemplate=', useDefaultTemplate);
                                
                                if (selectedTemplate) {
                                    // Editing existing template
                                    console.log('š“¯ Loading EXISTING template, length:', selectedTemplate.content?.length);
                                    editor.setData(selectedTemplate.content || '');
                                } else {
                                    // NEW template ā†’ ALWAYS load default professional template
                                    console.log('š†• NEW template ā†’ Loading DEFAULT professional template');
                                    console.log('š“¸ defaultTemplateContent length:', defaultTemplateContent.length);
                                    editor.setData(defaultTemplateContent);
                                    setEditorContent(defaultTemplateContent);
                                    console.log('ā… Default template loaded! First 200 chars:', defaultTemplateContent.substring(0, 200));
                                }
                                
                                // Listen for changes
                                editor.model.document.on('change:data', () => {
                                    setEditorContent(editor.getData());
                                });
                                
                                setEditorInstance(editor);
                            })
                            .catch(error => {
                                console.error('ā¯ Error creating CKEditor:', error);
                            });
                    } catch (error) {
                        console.error('ā¯ Error initializing CKEditor:', error);
                    }
                }
                
                return () => {
                    // Cleanup CKEditor
                    if (editorInstance && editorInstance.destroy) {
                        console.log('Destroying CKEditor instance');
                        editorInstance.destroy().catch(err => console.error('Cleanup error:', err));
                    }
                };
            }, [showEditor, selectedTemplate, useDefaultTemplate]);

            const saveTemplate = () => {
                if (!templateName.trim()) {
                    alert('ā ļø¸ Ä®veskite Åablono pavadinimÄ…!');
                    return;
                }
                
                const template = {
                    id: selectedTemplate?.id || Date.now().toString(),
                    name: templateName,
                    content: editorContent || editorInstance?.getData() || '',
                    isDefault: templates.length === 0,
                    createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                let updatedTemplates;
                if (selectedTemplate) {
                    updatedTemplates = templates.map(t => t.id === template.id ? template : t);
                } else {
                    updatedTemplates = [...templates, template];
                }
                
                setTemplates(updatedTemplates);
                saveSettings({...settings, templates: updatedTemplates});
                setShowEditor(false);
                setShowChoice(false);
                setSelectedTemplate(null);
                setTemplateName('');
                setEditorContent('');
                setEditorInstance(null);
                setUseDefaultTemplate(false);
                alert('ā… Å ablonas iÅsaugotas!');
            };

            const deleteTemplate = (id) => {
                if (confirm('Ar tikrai norite iÅtrinti ÅÄÆ ÅablonÄ…?')) {
                    const updatedTemplates = templates.filter(t => t.id !== id);
                    setTemplates(updatedTemplates);
                    saveSettings({...settings, templates: updatedTemplates});
                }
            };

            const insertDynamicField = (field) => {
                if (editorInstance) {
                    editorInstance.model.change(writer => {
                        const insertPosition = editorInstance.model.document.selection.getFirstPosition();
                        writer.insertText(field, insertPosition);
                    });
                }
            };

            const dynamicFields = [
                '{{order_number}}', '{{today_date}}', '{{cargo}}', '{{vehicle_count}}', '{{route}}',
                '{{truck_plate}}', '{{trailer_plate}}', '{{driver_name}}',
                '{{loading_company_name}}', '{{loading_city}}', '{{loading_street}}', '{{loading_postal_code}}',
                '{{unloading_company_name}}', '{{unloading_city}}', '{{unloading_street}}', '{{unloading_postal_code}}',
                '{{loading_date}}', '{{unloading_date}}',
                '{{carrier_price}}', '{{price_in_words}}', '{{vat_amount}}', '{{total_with_vat}}', '{{carrier_price_vat}}', '{{payment_term_days}}',
                '{{vin_numbers}}', '{{load_ref_number}}', '{{unload_ref_number}}', '{{instructions}}', '{{originals_required}}',
                '{{carrier_name}}', '{{carrier_company_code}}', '{{carrier_vat}}', '{{carrier_address}}', '{{carrier_phone}}', '{{carrier_email}}'
            ];

            // CHOICE SCREEN - Select template type
            if (showChoice) {
                return (
                    <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                            <h3 style={{color: '#1e3a8a'}}>š“¯ Pasirinkite kaip pradÄ—ti</h3>
                            <button className="btn btn-secondary" onClick={() => {
                                setShowChoice(false);
                                setEditorInstance(null);
                                setUseDefaultTemplate(false);
                                setEditorContent('');
                            }}>
                                ā† Atgal
                            </button>
                        </div>

                        <div style={{display: 'grid', gap: '20px', maxWidth: '800px'}}>
                            {/* Option 1: Professional Template */}
                            <div 
                                style={{
                                    padding: '24px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    border: '3px solid transparent',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => {
                                    setUseDefaultTemplate(true);
                                    setEditorInstance(null);
                                    setShowChoice(false);
                                    setShowEditor(true);
                                }}
                                onMouseOver={(e) => e.currentTarget.style.border = '3px solid #10b981'}
                                onMouseOut={(e) => e.currentTarget.style.border = '3px solid transparent'}
                            >
                                <div style={{display: 'flex', alignItems: 'start', gap: '16px'}}>
                                    <div style={{fontSize: '48px'}}>š“‹</div>
                                    <div style={{flex: 1}}>
                                        <h3 style={{margin: '0 0 8px 0', fontSize: '20px'}}>
                                            ā­ ParuoÅtas profesionalus Åablonas
                                        </h3>
                                        <p style={{margin: '0 0 12px 0', fontSize: '14px', opacity: 0.9}}>
                                            <strong>REKOMENDUOJAMA</strong> - Sistema automatiÅkai ÄÆkels pilnÄ… profesionalÅ³ transporto orderio struktÅ«rÄ…:
                                        </p>
                                        <ul style={{margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8'}}>
                                            <li>ā… Header su logo ir rekvizitais</li>
                                            <li>ā… Profesionali lentelÄ— su visa informacija</li>
                                            <li>ā… Automatiniai dinaminiai laukai (krovinys, kaina, adresas, VIN...)</li>
                                            <li>ā… SÄ…lygos ir sutarties tekstas</li>
                                            <li>ā… 2 kolonÅ³ rekvizitai su paraÅÅ³ vietomis</li>
                                            <li>ā… Spalvos, formatavimas, profesionalus dizainas</li>
                                        </ul>
                                        <p style={{margin: '12px 0 0 0', fontSize: '13px', fontWeight: '600'}}>
                                            š‘‰ JÅ«s tik redaguosite - keisti tekstus, pridÄ—ti logotipÄ…, koreguoti pagal save!
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Option 2: From Scratch */}
                            <div 
                                style={{
                                    padding: '24px',
                                    background: 'white',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => {
                                    setUseDefaultTemplate(false);
                                    setEditorInstance(null);
                                    setShowChoice(false);
                                    setShowEditor(true);
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.border = '2px solid #3b82f6';
                                    e.currentTarget.style.background = '#f8fafc';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.border = '2px solid #e2e8f0';
                                    e.currentTarget.style.background = 'white';
                                }}
                            >
                                <div style={{display: 'flex', alignItems: 'start', gap: '16px'}}>
                                    <div style={{fontSize: '48px'}}>ā¸ļø¸</div>
                                    <div style={{flex: 1}}>
                                        <h3 style={{margin: '0 0 8px 0', fontSize: '18px', color: '#1e3a8a'}}>
                                            PradÄ—ti nuo nulio
                                        </h3>
                                        <p style={{margin: 0, fontSize: '14px', color: '#64748b', lineHeight: '1.6'}}>
                                            TuÅÄ¨ias editorius. Kurkite ÅablonÄ… visiÅkai nuo pradÅ¾iÅ³ - struktÅ«rÄ…, lenteles, tekstus, formatavimÄ…. 
                                            GalÄ—site naudoti visus CKEditor editoriaus ÄÆrankius ir dinaminius laukus.
                                        </p>
                                        <p style={{margin: '8px 0 0 0', fontSize: '13px', color: '#94a3b8'}}>
                                            Geriausia jei turite specifinÄ™ struktÅ«rÄ… arba norite eksperimentuoti.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{marginTop: '24px', padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b'}}>
                            <p style={{margin: 0, fontSize: '13px', color: '#92400e'}}>
                                <strong>š’ Patarimas:</strong> Jei nesate tikri - pasirinkite paruoÅtÄ… ÅablonÄ…! 
                                JÄÆ visada galÄ—site redaguoti, keisti, trinti nereikalingus blokus. 
                                Tai sutaupys daug laiko.
                            </p>
                        </div>
                    </div>
                );
            }

            if (showEditor) {
                return (
                    <div>
                        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                            <h3 style={{color: '#1e3a8a'}}>
                                {selectedTemplate ? 'ā¸ļø¸ Redaguoti ÅablonÄ…' : 'š“¯ Naujas Åablonas'}
                            </h3>
                            <button className="btn btn-secondary" onClick={() => {
                                setShowEditor(false);
                                setShowChoice(false);
                                setSelectedTemplate(null);
                                setTemplateName('');
                                setEditorInstance(null);
                                setUseDefaultTemplate(false);
                            }}>
                                ā† Atgal
                            </button>
                        </div>

                        <div className="form-group" style={{marginBottom: '20px'}}>
                            <label>Å ablono pavadinimas *</label>
                            <input 
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="pvz. Standartinis uÅ¾sakymas"
                            />
                        </div>

                        <div style={{marginBottom: '16px'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>
                                š’ Dinaminiai laukai:
                            </label>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
                                {dynamicFields.map(field => (
                                    <button 
                                        key={field}
                                        className="btn btn-secondary"
                                        style={{fontSize: '11px', padding: '4px 8px'}}
                                        onClick={() => insertDynamicField(field)}
                                    >
                                        {field.replace(/[{}]/g, '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Info Button - Opens instructions modal */}
                        <div style={{marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <button 
                                className="btn btn-secondary"
                                style={{fontSize: '13px', padding: '8px 16px'}}
                                onClick={() => setShowInfoModal(true)}
                            >
                                ā„¹ļø¸ Info - Kaip pridÄ—ti logo
                            </button>
                        </div>

                        {/* Info Modal - Logo instructions */}
                        {showInfoModal && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10000
                            }} onClick={() => setShowInfoModal(false)}>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    maxWidth: '600px',
                                    width: '90%',
                                    maxHeight: '80vh',
                                    overflow: 'auto',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        padding: '20px',
                                        borderRadius: '12px 12px 0 0'
                                    }}>
                                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                            <h3 style={{margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                                <span style={{fontSize: '28px'}}>š–¼ļø¸</span>
                                                Kaip pridÄ—ti savo ÄÆmonÄ—s logotipÄ…
                                            </h3>
                                            <button 
                                                onClick={() => setShowInfoModal(false)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.2)',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '24px',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >Ć—</button>
                                        </div>
                                    </div>
                                    <div style={{padding: '24px'}}>
                                        <div style={{marginBottom: '20px'}}>
                                            <div style={{marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px'}}>
                                                <strong style={{color: '#1e40af'}}>Å½INGSNIS 1:</strong> Å ablone jau yra paruoÅta "LOGO VIETA" su pilku fonu - tai jÅ«sÅ³ logo pozicija
                                            </div>
                                            <div style={{marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px'}}>
                                                <strong style={{color: '#1e40af'}}>Å½INGSNIS 2:</strong> PaÅ¾ymÄ—kite logo zona tekstÄ… redaktoriuje ir iÅtrinkite jÄÆ (jei yra tekstas)
                                            </div>
                                            <div style={{marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px'}}>
                                                <strong style={{color: '#1e40af'}}>Å½INGSNIS 3:</strong> Paspauskite <strong>š–¼ļø¸ Image Upload</strong> mygtukÄ… CKEditor toolbar virÅuje
                                            </div>
                                            <div style={{marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px'}}>
                                                <strong style={{color: '#1e40af'}}>Å½INGSNIS 4:</strong> Pasirinkite logo failÄ… iÅ savo kompiuterio (Upload from computer)
                                            </div>
                                            <div style={{marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px'}}>
                                                <strong style={{color: '#1e40af'}}>Å½INGSNIS 5:</strong> Logo ÄÆsiterps ÄÆ tÄ… vietÄ… - vilkite kraÅtus kad pakeistumÄ—te dydÄÆ arba naudokite resize tools
                                            </div>
                                        </div>
                                        <div style={{padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                                            <strong style={{color: '#1e3a8a', display: 'block', marginBottom: '10px'}}>š“‹ LOGO REIKALAVIMAI:</strong>
                                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px', color: '#475569'}}>
                                                <div>ā“ Rekomenduojamas dydis: 300x100 px</div>
                                                <div>ā“ Maksimalus failas: 500 KB</div>
                                                <div>ā“ Formatai: PNG, JPG, SVG</div>
                                                <div>ā“ PNG su permatomu fonu geriausia</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div 
                            key={`editor-${selectedTemplate?.id || 'new'}-${useDefaultTemplate ? 'default' : 'empty'}`}
                            ref={editorRef} 
                            style={{minHeight: '400px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px'}}
                        ></div>

                        <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
                            <button className="btn btn-success" onClick={saveTemplate}>
                                š’¾ IÅsaugoti
                            </button>
                            <button className="btn btn-secondary" onClick={() => {
                                setShowEditor(false);
                                setShowChoice(false);
                                setSelectedTemplate(null);
                                setTemplateName('');
                                setEditorInstance(null);
                                setUseDefaultTemplate(false);
                            }}>
                                ā¯ AtÅaukti
                            </button>
                        </div>

                        <div style={{marginTop: '20px', padding: '12px', background: '#eff6ff', borderRadius: '8px'}}>
                            <p style={{fontSize: '13px', margin: 0}}>
                                <strong>š’ Kaip naudoti:</strong> {useDefaultTemplate 
                                    ? 'Sistema automatiÅkai ÄÆkÄ—lÄ— profesionalÅ³ orderio ÅablonÄ… su lentele, spalvomis ir struktÅ«ra. Redaguokite tekstus, pridÄ—kite logotipÄ… per Image ÄÆrankÄÆ, naudokite dinaminius laukus.' 
                                    : 'Kurkite ÅablonÄ… nuo nulio. Naudokite toolbar ÄÆrankius formatavimui, dinaminius laukus automatiniam uÅ¾pildymui.'} 
                                Generuojant uÅ¾sakymÄ…, visi {'{'}{'{'} laukai {'}'}{'}'}  automatiÅkai uÅ¾sipildys.
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                        <h3 style={{color: '#1e3a8a'}}>š“¯ UÅ¾sakymÅ³ Åablonai</h3>
                        <button className="btn btn-success" onClick={() => {
                            console.log('š†• NAUJAS Å ABLONAS clicked!');
                            console.log('š“‹ Setting states...');
                            
                            // TIESIOGIAI atidaro editoriÅ³ su profesionaliu Åablonu
                            setShowEditor(true);
                            setUseDefaultTemplate(true);  // ā† SVARBU! Auto-load default template
                            setShowChoice(false);
                            setSelectedTemplate(null);
                            setTemplateName('');
                            setEditorContent('');
                            setEditorInstance(null);
                            
                            console.log('ā… States set: showEditor=true, useDefaultTemplate=true, editorInstance=null');
                            console.log('š“¸ defaultTemplateContent length:', defaultTemplateContent.length);
                        }}>
                            + Naujas Åablonas
                        </button>
                    </div>

                    {templates.length > 0 ? (
                        <div style={{display: 'grid', gap: '16px'}}>
                            {templates.map(template => (
                                <div 
                                    key={template.id}
                                    style={{
                                        padding: '16px',
                                        background: template.isDefault ? '#f0fdf4' : 'white',
                                        border: `2px solid ${template.isDefault ? '#10b981' : '#e2e8f0'}`,
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                        <div>
                                            <h4 style={{margin: '0 0 8px 0', color: '#1e3a8a'}}>
                                                {template.name}
                                                {template.isDefault && (
                                                    <span style={{marginLeft: '8px', fontSize: '11px', padding: '2px 6px', background: '#10b981', color: 'white', borderRadius: '4px'}}>
                                                        ā“ Default
                                                    </span>
                                                )}
                                            </h4>
                                            <div style={{fontSize: '12px', color: '#64748b'}}>
                                                {new Date(template.createdAt).toLocaleDateString('lt-LT')}
                                            </div>
                                        </div>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <button 
                                                className="btn btn-secondary"
                                                onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setTemplateName(template.name);
                                                    setEditorContent(template.content);
                                                    setShowEditor(true);
                                                }}
                                            >
                                                ā¸ļø¸ Redaguoti
                                            </button>
                                            {!template.isDefault && (
                                                <button 
                                                    className="btn"
                                                    style={{background: '#ef4444', color: 'white'}}
                                                    onClick={() => deleteTemplate(template.id)}
                                                >
                                                    š—‘ļø¸
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">š“¯</div>
                            <h3>NÄ—ra ÅablonÅ³</h3>
                            <p>Sukurkite pirmÄ… uÅ¾sakymo ÅablonÄ…</p>
                        </div>
                    )}

                    <div style={{marginTop: '20px', padding: '16px', background: '#fef3c7', borderRadius: '8px'}}>
                        <h4 style={{margin: '0 0 8px 0', color: '#92400e'}}>š’ Kaip veikia?</h4>
                        <p style={{fontSize: '13px', lineHeight: '1.6', color: '#78350f', margin: 0}}>
                            Paspaudus "+ Naujas Åablonas", sistema automatiÅkai ÄÆkelia profesionalÅ³ transporto orderio struktÅ«rÄ…. 
                            Redaguokite pagal poreikius, pridÄ—kite logotipÄ…, keiskite tekstus. 
                            Generuojant uÅ¾sakymÄ… veÅ¾Ä—jui, visi dinaminiai laukai automatiÅkai uÅ¾sipildys tikrais duomenimis.
                        </p>
                    </div>
                </div>
            );
        }

        function Dashboard({ clients, carriers, orders }) {
            const activeOrders = orders.filter(o => o.status === 'active').length;
            const expiringCMR = carriers.filter(c => {
                if (!c.cmrExpiry) return false;
                const daysUntil = Math.ceil((new Date(c.cmrExpiry) - new Date()) / (1000 * 60 * 60 * 24));
                return daysUntil < 30 && daysUntil > 0;
            }).length;

            // Calculate profit
            const totalRevenue = orders.reduce((sum, o) => sum + (o.clientPrice || o.price || 0), 0);
            const totalCost = orders.reduce((sum, o) => sum + (o.carrierPrice || 0), 0);
            const totalProfit = totalRevenue - totalCost;

            return (
                <div className="content-card">
                    <div className="card-header">
                        <h2>Dashboard</h2>
                    </div>
                    
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>AktyvÅ«s UÅ¾sakymai</h3>
                            <div className="value">{activeOrders}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Viso KlientÅ³</h3>
                            <div className="value">{clients.length}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Viso VeÅ¾Ä—jÅ³</h3>
                            <div className="value">{carriers.filter(c => !c.isOwnCompany).length}</div>
                        </div>
                        <div className="stat-card">
                            <h3>CMR Baigiasi</h3>
                            <div className="value" style={{color: expiringCMR > 0 ? '#dc2626' : '#059669'}}>{expiringCMR}</div>
                        </div>
                    </div>

                    {/* Profit Statistics */}
                    <div style={{
                        marginTop: '24px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px',
                        color: 'white'
                    }}>
                        <h3 style={{marginBottom: '16px', color: 'white'}}>š’° FinansinÄ— SuvestinÄ—</h3>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px'}}>
                            <div>
                                <div style={{fontSize: '13px', opacity: 0.9}}>Pajamos</div>
                                <div style={{fontSize: '24px', fontWeight: '700'}}>{totalRevenue.toFixed(2)} ā‚¬</div>
                            </div>
                            <div>
                                <div style={{fontSize: '13px', opacity: 0.9}}>Savikaina</div>
                                <div style={{fontSize: '24px', fontWeight: '700'}}>{totalCost.toFixed(2)} ā‚¬</div>
                            </div>
                            <div>
                                <div style={{fontSize: '13px', opacity: 0.9}}>Pelnas</div>
                                <div style={{fontSize: '24px', fontWeight: '700', color: totalProfit >= 0 ? '#86efac' : '#fca5a5'}}>
                                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ā‚¬
                                </div>
                                <div style={{fontSize: '11px', opacity: 0.8, marginTop: '4px'}}>
                                    {totalCost > 0 ? `${((totalProfit / totalCost) * 100).toFixed(1)}% marÅ¾a` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 style={{marginBottom: '16px', color: '#1e3a8a'}}>Naujausi UÅ¾sakymai</h3>
                    {orders.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>UÅ¾sakymo Nr.</th>
                                    <th>Klientas</th>
                                    <th>VeÅ¾Ä—jas</th>
                                    <th>Krovinys</th>
                                    <th>Statusas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order.id}>
                                        <td><strong>{order.orderNumber}</strong></td>
                                        <td>{order.clientName}</td>
                                        <td>{order.carrierName}</td>
                                        <td>{order.cargo}</td>
                                        <td>
                                            <span className={`badge badge-${order.status === 'active' ? 'success' : 'warning'}`}>
                                                {order.status === 'active' ? 'Aktyvus' : 'UÅ¾baigtas'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">š“¦</div>
                            <h3>NÄ—ra uÅ¾sakymÅ³</h3>
                            <p>Sukurkite pirmÄ… uÅ¾sakymÄ…</p>
                        </div>
                    )}
                </div>
            );
        }

        function Clients({ clients, saveClients, openModal }) {
            const [editingClient, setEditingClient] = useState(null);

            const deleteClient = (id) => {
                if (confirm('Ar tikrai norite iÅtrinti ÅÄÆ klientÄ…?')) {
                    saveClients(clients.filter(c => c.id !== id));
                }
            };

            const editClient = (client) => {
                setEditingClient(client);
            };

            return (
                <div className="content-card">
                    <div className="card-header">
                        <h2>Klientai ({clients.length})</h2>
                        <button className="btn" onClick={openModal}>
                            + PridÄ—ti KlientÄ…
                        </button>
                    </div>

                    {clients.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Pavadinimas</th>
                                    <th>Ä®monÄ—s kodas</th>
                                    <th>PVM kodas</th>
                                    <th>Kontaktas</th>
                                    <th>Email</th>
                                    <th>Veiksmai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id}>
                                        <td><strong>{client.name}</strong></td>
                                        <td>{client.companyCode}</td>
                                        <td>{client.vatCode}</td>
                                        <td>{client.phone}</td>
                                        <td>{client.email}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="action-btn" onClick={() => editClient(client)}>
                                                    ā¸ļø¸ Redaguoti
                                                </button>
                                                <button className="action-btn" onClick={() => deleteClient(client.id)}>
                                                    š—‘ļø¸ Å alinti
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">š‘</div>
                            <h3>NÄ—ra klientÅ³</h3>
                            <p>PradÄ—kite pridÄ—dami pirmÄ… klientÄ…</p>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {editingClient && (
                        <EditClientModal 
                            client={editingClient}
                            clients={clients}
                            saveClients={saveClients}
                            onClose={() => setEditingClient(null)}
                        />
                    )}
                </div>
            );
        }

        function EditClientModal({ client, clients, saveClients, onClose }) {
            const [formData, setFormData] = useState(client);



            const upsertOrder = (payload) => {
                const existingIndex = orders.findIndex(o => o.id === payload.id);
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

            const saveOrderAsDraft = (status = 'draft', silent = false) => {
                if (type !== 'order') return null;
                const selectedCarrier = carriers.find(c => c.id == formData.carrierId) || {};
                const selectedClient = clients.find(c => c.id == formData.clientId) || {};
                const payload = {
                    ...formData,
                    id: formData.id,
                    orderNumber: formData.orderNumber || `RAD${Date.now().toString().slice(-6)}`,
                    status,
                    clientName: formData.clientName || selectedClient.name || '',
                    carrierName: formData.carrierName || selectedCarrier.name || '',
                    carrierCompanyCode: selectedCarrier.companyCode || formData.carrierCompanyCode || '',
                    carrierVAT: selectedCarrier.vatCode || formData.carrierVAT || '',
                    carrierAddress: selectedCarrier.address || formData.carrierAddress || '',
                    carrierPhone: selectedCarrier.phone || formData.carrierPhone || '',
                    carrierEmail: selectedCarrier.email || formData.carrierEmail || ''
                };
                if (payload.orderType === 'resale_to_carrier' && payload.clientPrice && payload.carrierPrice) {
                    payload.profit = payload.clientPrice - payload.carrierPrice;
                    payload.profitMargin = payload.carrierPrice ? (payload.profit / payload.carrierPrice) * 100 : 0;
                }
                const saved = upsertOrder(payload);
                setFormData(prev => ({ ...prev, id: saved.id, orderNumber: saved.orderNumber }));
                if (!silent) alert(`ā… JuodraÅtis iÅsaugotas (${saved.orderNumber})`);
                return saved;
            };

            const buildOrderPreviewData = () => {
                const selectedCarrier = carriers.find(c => c.id == formData.carrierId) || {};
                const orderNumber = `RAD${Date.now().toString().slice(-6)}`;
                return {
                    ...formData,
                    orderNumber,
                    carrierName: formData.carrierName || selectedCarrier.name || '',
                    carrierCompanyCode: selectedCarrier.companyCode || '',
                    carrierVAT: selectedCarrier.vatCode || '',
                    carrierAddress: selectedCarrier.address || '',
                    carrierPhone: selectedCarrier.phone || '',
                    carrierEmail: selectedCarrier.email || '',
                    companyLogo: settings?.company?.logo_url || '',
                    companyStampSignature: settings?.companyStampSignature || '',
                    originalsRequired: formData.originalsRequired === true || formData.originalsRequired === 'required'
                };
            };

            const generateCarrierOrder = () => {
                if (type !== 'order') return;
                if (!formData.orderType) {
                    alert('ā ļø¸ Pasirinkite uÅ¾sakymo tipÄ…!');
                    return;
                }
                if (formData.orderType !== 'resale_to_carrier') {
                    alert('ā ļø¸ Orderis veÅ¾Ä—jui generuojamas tik pasirinkus ā€˛Pardavimas veÅ¾Ä—juiā€.');
                    return;
                }
                if (!formData.carrierId) {
                    alert('ā ļø¸ Pasirinkite veÅ¾Ä—jÄ…!');
                    return;
                }
                const templates = settings?.templates || [];
                if (!templates.length) {
                    alert('ā ļø¸ NÄ—ra iÅsaugoto Åablono. Pirmiausia iÅsaugokite bent vienÄ… uÅ¾sakymo ÅablonÄ….');
                    return;
                }
                const template = templates.find(t => t.isDefault) || templates[0];
                const savedOrder = saveOrderAsDraft('generated', true);
                const previewData = { ...buildOrderPreviewData(), ...(savedOrder || {}) };
                const rendered = renderTemplate(template.content || '', previewData);
                if (!rendered || !rendered.trim()) {
                    alert('ā ļø¸ Nepavyko sugeneruoti orderio. Patikrinkite ÅablonÄ….');
                    return;
                }
                const previewWindow = window.open('', '_blank');
                if (!previewWindow) {
                    alert('ā ļø¸ NarÅyklÄ— uÅ¾blokavo preview langÄ…. Leiskite pop-up Åiam failui.');
                    return;
                }
                const emailSubject = encodeURIComponent(`UÅ¾sakymas veÅ¾Ä—jui ${previewData.orderNumber}`);
                const emailBody = encodeURIComponent(`Sveiki,

SiunÄ¨iame transporto uÅ¾sakymÄ… Nr. ${previewData.orderNumber}.

PraÅome perÅ¾iÅ«rÄ—ti prisegtÄ… orderÄÆ ir patvirtinti.

Pagarbiai,
MB Radanaras`);
                previewWindow.document.write(`<!DOCTYPE html><html lang="lt"><head><meta charset="UTF-8"><title>${previewData.orderNumber}</title><style>
                @page { size: A4; margin: 12mm; }
                body{font-family:Arial,Helvetica,sans-serif;background:#eef2f7;margin:0;padding:20px;color:#111}
                .toolbar{max-width:210mm;margin:0 auto 12px auto;display:flex;gap:8px;flex-wrap:wrap}
                .toolbar button,.toolbar a{background:#1e3a8a;color:#fff;border:none;border-radius:6px;padding:10px 14px;font-size:14px;text-decoration:none;cursor:pointer}
                .toolbar .secondary{background:#475569}
                .sheet{width:210mm;min-height:297mm;margin:0 auto 14px auto;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.12);padding:12mm;box-sizing:border-box}
                .sheet table{width:100%;border-collapse:collapse;table-layout:fixed}
                .sheet td,.sheet th{vertical-align:top;word-wrap:break-word}
                .page-break-before{page-break-before:always;height:0}
                .order-document{font-size:12px;line-height:1.35}
                @media print{
                  body{background:#fff;padding:0}
                  .toolbar{display:none !important}
                  .sheet{box-shadow:none;margin:0;width:auto;min-height:auto;padding:0}
                  a{color:#111;text-decoration:none}
                }
                </style></head><body>
                <div class="toolbar">
                  <button onclick="window.print()">Spausdinti</button>
                  <button onclick="window.print()">Generuoti PDF</button>
                  <a href="mailto:${previewData.carrierEmail || ''}?subject=${emailSubject}&body=${emailBody}">SiÅ³sti veÅ¾Ä—jui</a>
                  <button class="secondary" onclick="window.close()">UÅ¾daryti</button>
                </div>
                <div class="sheet">${rendered}</div></body></html>`);
                previewWindow.document.close();
            };

            const handleSubmit = (e) => {
                e.preventDefault();
                const updatedClients = clients.map(c => 
                    c.id === client.id ? {...formData, updatedAt: new Date().toISOString()} : c
                );
                saveClients(updatedClients);
                onClose();
            };

            return (
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>ā¸ļø¸ Redaguoti KlientÄ…</h2>
                            <button className="close-btn" onClick={onClose}>Ć—</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Pavadinimas *</label>
                                    <input 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ä®monÄ—s kodas *</label>
                                    <input 
                                        required
                                        value={formData.companyCode}
                                        onChange={(e) => setFormData({...formData, companyCode: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PVM kodas *</label>
                                    <input 
                                        required
                                        value={formData.vatCode}
                                        onChange={(e) => setFormData({...formData, vatCode: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefonas *</label>
                                    <input 
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input 
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adresas</label>
                                    <input 
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div style={{display: 'flex', gap: '10px', marginTop: '24px'}}>
                                <button type="submit" className="btn btn-success">
                                    ā… IÅsaugoti Pakeitimus
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    ā¯ AtÅaukti
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        function Carriers({ carriers, saveCarriers, openModal }) {
            const [editingCarrier, setEditingCarrier] = useState(null);
            const [viewingDocs, setViewingDocs] = useState(null);

            const deleteCarrier = (id) => {
                if (confirm('Ar tikrai norite iÅtrinti ÅÄÆ veÅ¾Ä—jÄ…?')) {
                    saveCarriers(carriers.filter(c => c.id !== id));
                }
            };

            const editCarrier = (carrier) => {
                setEditingCarrier(carrier);
            };

            const viewDocuments = (carrier, docType) => {
                const docData = {
                    carrier: carrier,
                    docType: docType,
                    expiry: docType === 'cmr' ? carrier.cmrExpiry : carrier.licenseExpiry,
                    url: docType === 'cmr' ? carrier.cmrUrl : carrier.licenseUrl
                };
                setViewingDocs(docData);
            };

            const getCMRStatus = (expiry) => {
                if (!expiry) return { class: 'danger', text: 'NÄ—ra duomenÅ³' };
                const daysUntil = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
                if (daysUntil < 0) return { class: 'danger', text: 'PasibaigÄ™s' };
                if (daysUntil < 30) return { class: 'warning', text: `${daysUntil} d.` };
                return { class: 'success', text: `${daysUntil} d.` };
            };

            return (
                <div className="content-card">
                    <div className="card-header">
                        <h2>VeÅ¾Ä—jai ({carriers.length})</h2>
                        <button className="btn" onClick={openModal}>
                            + PridÄ—ti VeÅ¾Ä—jÄ…
                        </button>
                    </div>

                    {carriers.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Pavadinimas</th>
                                    <th>Tipas</th>
                                    <th>Ä®monÄ—s kodas</th>
                                    <th>PVM kodas</th>
                                    <th>CMR Draudimas</th>
                                    <th>Licencija</th>
                                    <th>Dokumentai</th>
                                    <th>Kontaktas</th>
                                    <th>Veiksmai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {carriers.map(carrier => {
                                    const cmrStatus = getCMRStatus(carrier.cmrExpiry);
                                    const licenseStatus = getCMRStatus(carrier.licenseExpiry);
                                    return (
                                        <tr key={carrier.id} style={{background: carrier.isOwnCompany ? '#f0fdf4' : 'transparent'}}>
                                            <td>
                                                <strong>{carrier.name}</strong>
                                                {carrier.isOwnCompany && <span style={{marginLeft: '8px', fontSize: '11px', color: '#059669'}}>š¸¢</span>}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    background: carrier.carrierType === 'own_fleet' ? '#dbeafe' : '#fef3c7',
                                                    color: carrier.carrierType === 'own_fleet' ? '#1e40af' : '#92400e'
                                                }}>
                                                    {carrier.carrierType === 'own_fleet' ? 'š¸¢ Nuosavas' : 'š› IÅorinis'}
                                                </span>
                                            </td>
                                            <td>{carrier.companyCode}</td>
                                            <td>{carrier.vatCode}</td>
                                            <td>
                                                <span className={`badge badge-${cmrStatus.class}`}>
                                                    {cmrStatus.text}
                                                </span>
                                            </td>
                                            <td>
                                                {carrier.licenseExpiry ? (
                                                    <span className={`badge badge-${licenseStatus.class}`}>
                                                        {licenseStatus.text}
                                                    </span>
                                                ) : (
                                                    <span style={{color: '#94a3b8', fontSize: '13px'}}>-</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{display: 'flex', gap: '8px', fontSize: '20px'}}>
                                                    {carrier.cmrUrl && (
                                                        <div
                                                            title="CMR Draudimas - spausk perÅ¾iÅ«rÄ—ti"
                                                            style={{
                                                                cursor: 'pointer',
                                                                background: '#dbeafe',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px',
                                                                border: '2px solid #3b82f6',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                color: '#1e40af',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => viewDocuments(carrier, 'cmr')}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#bfdbfe';
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = '#dbeafe';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            š“„ CMR
                                                        </div>
                                                    )}
                                                    {carrier.licenseUrl && (
                                                        <div
                                                            title="Licencija - spausk perÅ¾iÅ«rÄ—ti"
                                                            style={{
                                                                cursor: 'pointer',
                                                                background: '#d1fae5',
                                                                padding: '6px 10px',
                                                                borderRadius: '6px',
                                                                border: '2px solid #10b981',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                color: '#065f46',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onClick={() => viewDocuments(carrier, 'license')}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#a7f3d0';
                                                                e.currentTarget.style.transform = 'scale(1.05)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = '#d1fae5';
                                                                e.currentTarget.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            š“‹ LIC
                                                        </div>
                                                    )}
                                                    {!carrier.cmrUrl && !carrier.licenseUrl && <span style={{color: '#cbd5e1'}}>-</span>}
                                                </div>
                                            </td>
                                            <td>{carrier.phone}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="action-btn" onClick={() => editCarrier(carrier)}>
                                                        ā¸ļø¸ Redaguoti
                                                    </button>
                                                    <button className="action-btn" onClick={() => deleteCarrier(carrier.id)}>
                                                        š—‘ļø¸ Å alinti
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">š›</div>
                            <h3>NÄ—ra veÅ¾Ä—jÅ³</h3>
                            <p>PridÄ—kite pirmÄ… veÅ¾Ä—jÄ…</p>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {editingCarrier && (
                        <EditCarrierModal 
                            carrier={editingCarrier}
                            carriers={carriers}
                            saveCarriers={saveCarriers}
                            onClose={() => setEditingCarrier(null)}
                        />
                    )}

                    {/* Documents Modal */}
                    {viewingDocs && (
                        <div className="modal-overlay" onClick={() => setViewingDocs(null)}>
                            <div className="modal" style={{maxWidth: '900px'}} onClick={(e) => e.stopPropagation()}>
                                <div className="modal-header">
                                    <h2>š“„ {viewingDocs.docType === 'cmr' ? 'CMR Draudimas' : 'Licencija'} - {viewingDocs.carrier.name}</h2>
                                    <button className="close-btn" onClick={() => setViewingDocs(null)}>Ć—</button>
                                </div>

                                <div style={{marginBottom: '20px'}}>
                                    <div style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
                                        <span style={{fontSize: '32px'}}>
                                            {viewingDocs.docType === 'cmr' ? 'š“„' : 'š“‹'}
                                        </span>
                                        <div style={{flex: 1}}>
                                            <div style={{fontWeight: '600', color: '#1e3a8a', marginBottom: '4px'}}>
                                                {viewingDocs.docType === 'cmr' ? 'CMR Draudimas' : 'Licencija'}
                                            </div>
                                            <div style={{fontSize: '13px', color: '#64748b'}}>
                                                Galioja iki: {viewingDocs.expiry || 'Nenurodyta'}
                                            </div>
                                        </div>
                                        {viewingDocs.url && (
                                            <a 
                                                href={viewingDocs.url} 
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary"
                                                style={{textDecoration: 'none'}}
                                            >
                                                š”— Atidaryti OneDrive
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {viewingDocs.url ? (
                                    <>
                                        <div style={{
                                            marginBottom: '12px',
                                            padding: '12px',
                                            background: '#eff6ff',
                                            border: '1px solid #bfdbfe',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            color: '#1e40af'
                                        }}>
                                            š’ <strong>Patarimas:</strong> Jei dokumentas neatsidaro, spausk <strong>"š”— Atidaryti OneDrive"</strong> virÅuje arba patikrink ar link yra teisingas.
                                        </div>
                                        <div style={{border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', background: '#fff'}}>
                                            <iframe 
                                                src={convertToEmbedUrl(viewingDocs.url)}
                                                style={{width: '100%', height: '600px', border: 'none'}}
                                                title="OneDrive Document Preview"
                                                allowFullScreen
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">š“</div>
                                        <h3>Dokumentas nerastas</h3>
                                        <p>OneDrive link nÄ—ra ÄÆvestas. Redaguokite veÅ¾Ä—jÄ… ir pridÄ—kite OneDrive link.</p>
                                    </div>
                                )}

                                <div style={{marginTop: '24px'}}>
                                    <button className="btn btn-secondary" onClick={() => setViewingDocs(null)}>
                                        UÅ¾daryti
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        function EditCarrierModal({ carrier, carriers, saveCarriers, onClose }) {
            const [formData, setFormData] = useState(carrier);

            const handleSubmit = (e) => {
                e.preventDefault();
                const updatedCarriers = carriers.map(c => 
                    c.id === carrier.id ? {...formData, updatedAt: new Date().toISOString()} : c
                );
                saveCarriers(updatedCarriers);
                onClose();
            };

            return (
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>ā¸ļø¸ Redaguoti VeÅ¾Ä—jÄ…</h2>
                            <button className="close-btn" onClick={onClose}>Ć—</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Pavadinimas *</label>
                                    <input 
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>VeÅ¾Ä—jo tipas *</label>
                                    <select 
                                        required
                                        value={formData.carrierType || 'external_carrier'}
                                        onChange={(e) => setFormData({...formData, carrierType: e.target.value})}
                                        disabled={formData.isOwnCompany}
                                        style={{background: formData.isOwnCompany ? '#f1f5f9' : '#f8fafc'}}
                                    >
                                        <option value="external_carrier">š› IÅorinis veÅ¾Ä—jas</option>
                                        <option value="own_fleet">š¸¢ Nuosavas transportas</option>
                                    </select>
                                    {formData.isOwnCompany && (
                                        <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>
                                            ā„¹ļø¸ Radanaras MB tipas nekeiÄ¨iamas
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Ä®monÄ—s kodas *</label>
                                    <input 
                                        required
                                        value={formData.companyCode}
                                        onChange={(e) => setFormData({...formData, companyCode: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PVM kodas *</label>
                                    <input 
                                        required
                                        value={formData.vatCode}
                                        onChange={(e) => setFormData({...formData, vatCode: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Telefonas *</label>
                                    <input 
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email *</label>
                                    <input 
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Adresas</label>
                                    <input 
                                        value={formData.address || ''}
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                            <h3 style={{margin: '24px 0 16px', color: '#1e3a8a', fontSize: '18px'}}>
                                š“„ Dokumentai
                            </h3>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>CMR Draudimo galiojimas *</label>
                                    <input 
                                        type="date"
                                        required
                                        value={formData.cmrExpiry || ''}
                                        onChange={(e) => setFormData({...formData, cmrExpiry: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Licencijos galiojimas</label>
                                    <input 
                                        type="date"
                                        value={formData.licenseExpiry || ''}
                                        onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="form-grid">
                                <OneDriveUrlInput 
                                    label="CMR Draudimo OneDrive Link"
                                    value={formData.cmrUrl}
                                    onChange={(url) => setFormData({...formData, cmrUrl: url})}
                                    required={true}
                                />
                                <OneDriveUrlInput 
                                    label="Licencijos OneDrive Link"
                                    value={formData.licenseUrl}
                                    onChange={(url) => setFormData({...formData, licenseUrl: url})}
                                />
                            </div>

                            <div style={{display: 'flex', gap: '10px', marginTop: '24px'}}>
                                <button type="submit" className="btn btn-success">
                                    ā… IÅsaugoti Pakeitimus
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    ā¯ AtÅaukti
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        function Orders({ orders, saveOrders, clients, carriers, openModal }) {
            const deleteOrder = (id) => {
                if (confirm('Ar tikrai norite iÅtrinti ÅÄÆ uÅ¾sakymÄ…?')) {
                    saveOrders(orders.filter(o => o.id !== id));
                }
            };

            return (
                <div className="content-card">
                    <div className="card-header">
                        <h2>UÅ¾sakymai ({orders.length})</h2>
                        <button className="btn" onClick={openModal}>
                            + Naujas UÅ¾sakymas
                        </button>
                    </div>

                    {orders.length > 0 ? (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>UÅ¾sakymo Nr.</th>
                                    <th>Tipas</th>
                                    <th>Klientas</th>
                                    <th>VeÅ¾Ä—jas</th>
                                    <th>MarÅrutas</th>
                                    <th>Pakrovimas</th>
                                    <th>IÅkrovimas</th>
                                    <th>Kl. kaina</th>
                                    <th>Pelnas</th>
                                    <th>Statusas</th>
                                    <th>Veiksmai</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => {
                                    const profit = (order.clientPrice || 0) - (order.carrierPrice || 0);
                                    const margin = order.carrierPrice ? ((profit / order.carrierPrice) * 100).toFixed(1) : 0;
                                    return (
                                        <tr key={order.id}>
                                            <td>
                                                <strong 
                                                    style={{cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline'}}
                                                    onClick={() => {
                                                        // Will implement EditOrderModal later
                                                        alert(`š“¯ Redaguoti uÅ¾sakymÄ… ${order.orderNumber}\n\nFunkcija bus pridÄ—ta netrukus!`);
                                                    }}
                                                >
                                                    {order.orderNumber}
                                                </strong>
                                            </td>
                                            <td>
                                                <span style={{fontSize: '11px', padding: '2px 6px', borderRadius: '3px', background: '#f1f5f9'}}>
                                                    {order.orderType === 'own_transport' && 'š› Nuosavas'}
                                                    {order.orderType === 'resale_to_carrier' && 'š”„ Perpard.'}
                                                    {!order.orderType && '-'}
                                                </span>
                                            </td>
                                            <td>{order.clientName || '-'}</td>
                                            <td>{order.carrierName || '-'}</td>
                                            <td style={{fontSize: '12px'}}>{order.route || '-'}</td>
                                            <td style={{fontSize: '12px'}}>{order.loadingDate || '-'}</td>
                                            <td style={{fontSize: '12px'}}>{order.unloadingDate || '-'}</td>
                                            <td>{order.clientPrice ? `${order.clientPrice} ā‚¬` : `${order.price || 0} ā‚¬`}</td>
                                            <td>
                                                {order.orderType === 'resale_to_carrier' && order.clientPrice && order.carrierPrice ? (
                                                    <span style={{
                                                        fontWeight: '600',
                                                        color: profit >= 0 ? '#059669' : '#dc2626'
                                                    }}>
                                                        {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ā‚¬
                                                        <div style={{fontSize: '10px', color: '#64748b'}}>
                                                            ({margin}%)
                                                        </div>
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${order.status === 'active' ? 'success' : order.status === 'draft' ? 'warning' : order.status === 'generated' ? 'warning' : 'warning'}`}>
                                                    {order.status === 'active' ? 'Aktyvus' : order.status === 'draft' ? 'JuodraÅtis' : order.status === 'generated' ? 'ParuoÅtas siuntimui' : 'UÅ¾baigtas'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button className="action-btn" onClick={() => openModal('order', order)} title="TÄ™sti / Redaguoti">ā¸ļø¸</button>
                                                    <button className="action-btn" title="Generuoti PDF">š“„</button>
                                                    <button className="action-btn" onClick={() => deleteOrder(order.id)} title="IÅtrinti">š—‘ļø¸</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">š“¦</div>
                            <h3>NÄ—ra uÅ¾sakymÅ³</h3>
                            <p>Sukurkite pirmÄ… uÅ¾sakymÄ…</p>
                        </div>
                    )}
                </div>
            );
        }

        function Modal({ type, initialData, onClose, clients, carriers, saveClients, saveCarriers, saveOrders, orders, settings }) {
            const emptyOrderForm = {
                // Order type
                orderType: 'resale_to_carrier',
                sendToCarrier: true,
                
                // Pricing
                clientPrice: 0,
                carrierPrice: 0,
                carrierPriceWithVAT: false,
                paymentTerm: '14 dienÅ³',
                
                // Cargo
                cargoType: '',
                cargo: '',
                vehicleCount: '1',
                vinNumbers: '',
                
                // Transport & Driver
                truckPlate: '',
                trailerPlate: '',
                driverName: '',
                
                // Loading address (Shipper)
                loadingCompanyName: '',
                loadingCity: '',
                loadingStreet: '',
                loadingPostalCode: '',
                loadingCoordinates: '',
                
                // Unloading address (Consignee)
                unloadingCompanyName: '',
                unloadingCity: '',
                unloadingStreet: '',
                unloadingPostalCode: '',
                unloadingCoordinates: '',
                
                // Route & Dates
                route: '',
                loadingDate: '',
                unloadingDate: '',
                
                // Additional info
                loadRefLoading: '',
                loadRefUnloading: '',
                instructions: '',
                originalsRequired: false,
                notes: '',
                documentUploadLink: ''
            };

            const [formData, setFormData] = useState({
                // Order type
                orderType: 'resale_to_carrier',
                sendToCarrier: true,
                
                // Pricing
                clientPrice: 0,
                carrierPrice: 0,
                carrierPriceWithVAT: false,  // Changed from carrierPriceIncludesVAT
                paymentTerm: '14 dienÅ³',
                
                // Cargo
                cargoType: '',
                cargo: '',
                vehicleCount: '1',
                vinNumbers: '',
                
                // Transport & Driver
                truckPlate: '',
                trailerPlate: '',
                driverName: '',
                
                // Loading address (Shipper)
                loadingCompanyName: '',
                loadingCity: '',
                loadingStreet: '',
                loadingPostalCode: '',
                loadingCoordinates: '',
                
                // Unloading address (Consignee)
                unloadingCompanyName: '',
                unloadingCity: '',
                unloadingStreet: '',
                unloadingPostalCode: '',
                unloadingCoordinates: '',
                
                // Route & Dates
                route: '',
                loadingDate: '',
                unloadingDate: '',
                
                // Additional info
                loadRefLoading: '',
                loadRefUnloading: '',
                instructions: '',
                originalsRequired: false,
                notes: '',
                documentUploadLink: ''
            });

            useEffect(() => {
                if (type !== 'order') return;
                if (initialData) {
                    setFormData(prev => ({ ...prev, ...initialData }));
                } else {
                    try {
                        const savedDraft = JSON.parse(localStorage.getItem('currentOrderDraftForm') || 'null');
                        if (savedDraft) {
                            setFormData(prev => ({ ...prev, ...savedDraft }));
                        }
                    } catch (e) {}
                }
            }, [type, initialData]);

            useEffect(() => {
                if (type !== 'order') return;
                localStorage.setItem('currentOrderDraftForm', JSON.stringify(formData));
            }, [type, formData]);


            const upsertOrder = (payload) => {
                const existingIndex = orders.findIndex(o => o.id === payload.id);
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

            const saveOrderAsDraft = (status = 'draft', silent = false) => {
                if (type !== 'order') return null;
                const selectedCarrier = carriers.find(c => c.id == formData.carrierId) || {};
                const selectedClient = clients.find(c => c.id == formData.clientId) || {};
                const payload = {
                    ...formData,
                    id: formData.id,
                    orderNumber: formData.orderNumber || `RAD${Date.now().toString().slice(-6)}`,
                    status,
                    clientName: formData.clientName || selectedClient.name || '',
                    carrierName: formData.carrierName || selectedCarrier.name || '',
                    carrierCompanyCode: selectedCarrier.companyCode || formData.carrierCompanyCode || '',
                    carrierVAT: selectedCarrier.vatCode || formData.carrierVAT || '',
                    carrierAddress: selectedCarrier.address || formData.carrierAddress || '',
                    carrierPhone: selectedCarrier.phone || formData.carrierPhone || '',
                    carrierEmail: selectedCarrier.email || formData.carrierEmail || ''
                };
                if (payload.orderType === 'resale_to_carrier' && payload.clientPrice && payload.carrierPrice) {
                    payload.profit = payload.clientPrice - payload.carrierPrice;
                    payload.profitMargin = payload.carrierPrice ? (payload.profit / payload.carrierPrice) * 100 : 0;
                }
                const saved = upsertOrder(payload);
                setFormData(prev => ({ ...prev, id: saved.id, orderNumber: saved.orderNumber }));
                if (!silent) alert(`ā… JuodraÅtis iÅsaugotas (${saved.orderNumber})`);
                return saved;
            };

            const buildOrderPreviewData = () => {
                const selectedCarrier = carriers.find(c => c.id == formData.carrierId) || {};
                const orderNumber = formData.orderNumber || `RAD${Date.now().toString().slice(-6)}`;
                return {
                    ...formData,
                    orderNumber,
                    carrierName: formData.carrierName || selectedCarrier.name || '',
                    carrierCompanyCode: selectedCarrier.companyCode || '',
                    carrierVAT: selectedCarrier.vatCode || '',
                    carrierAddress: selectedCarrier.address || '',
                    carrierPhone: selectedCarrier.phone || '',
                    carrierEmail: selectedCarrier.email || '',
                    companyLogo: settings?.company?.logo_url || '',
                    companyStampSignature: settings?.companyStampSignature || '',
                    originalsRequired: formData.originalsRequired === true || formData.originalsRequired === 'required'
                };
            };

            const generateCarrierOrder = () => {
                if (type !== 'order') return;
                if (!formData.orderType) {
                    alert('ā ļø¸ Pasirinkite uÅ¾sakymo tipÄ…!');
                    return;
                }
                if (formData.orderType !== 'resale_to_carrier') {
                    alert('ā ļø¸ Orderis veÅ¾Ä—jui generuojamas tik pasirinkus ā€˛Pardavimas veÅ¾Ä—juiā€.');
                    return;
                }
                if (!formData.carrierId) {
                    alert('ā ļø¸ Pasirinkite veÅ¾Ä—jÄ…!');
                    return;
                }
                const templates = settings?.templates || [];
                if (!templates.length) {
                    alert('ā ļø¸ NÄ—ra iÅsaugoto Åablono. Pirmiausia iÅsaugokite bent vienÄ… uÅ¾sakymo ÅablonÄ….');
                    return;
                }
                const template = templates.find(t => t.isDefault) || templates[0];
                const savedOrder = saveOrderAsDraft('generated', true);
                const previewData = { ...buildOrderPreviewData(), ...(savedOrder || {}) };
                const rendered = renderTemplate(template.content || '', previewData);
                if (!rendered || !rendered.trim()) {
                    alert('ā ļø¸ Nepavyko sugeneruoti orderio. Patikrinkite ÅablonÄ….');
                    return;
                }
                const previewWindow = window.open('', '_blank');
                if (!previewWindow) {
                    alert('ā ļø¸ NarÅyklÄ— uÅ¾blokavo preview langÄ…. Leiskite pop-up Åiam failui.');
                    return;
                }
                const emailSubject = encodeURIComponent(`UÅ¾sakymas veÅ¾Ä—jui ${previewData.orderNumber}`);
                const emailBody = encodeURIComponent(`Sveiki,

SiunÄ¨iame transporto uÅ¾sakymÄ… Nr. ${previewData.orderNumber}.

PraÅome perÅ¾iÅ«rÄ—ti prisegtÄ… orderÄÆ ir patvirtinti.

Pagarbiai,
MB Radanaras`);
                previewWindow.document.write(`<!DOCTYPE html><html lang="lt"><head><meta charset="UTF-8"><title>${previewData.orderNumber}</title><style>
                @page { size: A4; margin: 12mm; }
                body{font-family:Arial,Helvetica,sans-serif;background:#eef2f7;margin:0;padding:20px;color:#111}
                .toolbar{max-width:210mm;margin:0 auto 12px auto;display:flex;gap:8px;flex-wrap:wrap}
                .toolbar button,.toolbar a{background:#1e3a8a;color:#fff;border:none;border-radius:6px;padding:10px 14px;font-size:14px;text-decoration:none;cursor:pointer}
                .toolbar .secondary{background:#475569}
                .sheet{width:210mm;min-height:297mm;margin:0 auto 14px auto;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.12);padding:12mm;box-sizing:border-box}
                .sheet table{width:100%;border-collapse:collapse;table-layout:fixed}
                .sheet td,.sheet th{vertical-align:top;word-wrap:break-word}
                .page-break-before{page-break-before:always;height:0}
                .order-document{font-size:12px;line-height:1.35}
                @media print{
                  body{background:#fff;padding:0}
                  .toolbar{display:none !important}
                  .sheet{box-shadow:none;margin:0;width:auto;min-height:auto;padding:0}
                  a{color:#111;text-decoration:none}
                }
                </style></head><body>
                <div class="toolbar">
                  <button onclick="window.print()">Spausdinti</button>
                  <button onclick="window.print()">Generuoti PDF</button>
                  <a href="mailto:${previewData.carrierEmail || ''}?subject=${emailSubject}&body=${emailBody}">SiÅ³sti veÅ¾Ä—jui</a>
                  <button class="secondary" onclick="window.close()">UÅ¾daryti</button>
                </div>
                <div class="sheet">${rendered}</div></body></html>`);
                previewWindow.document.close();
            };

            const handleSubmit = (e) => {
                e.preventDefault();
                
                // Validations for order
                if (type === 'order') {
                    // Validate order type
                    if (!formData.orderType) {
                        alert('ā ļø¸ Pasirinkite uÅ¾sakymo tipÄ…!');
                        return;
                    }
                    
                    // Validate resale requires carrier
                    if (formData.orderType === 'resale_to_carrier') {
                        if (!formData.carrierId) {
                            alert('ā ļø¸ Perpardavimui bÅ«tinas veÅ¾Ä—jas!');
                            return;
                        }
                        
                        const selectedCarrier = carriers.find(c => c.id === formData.carrierId);
                        if (selectedCarrier && selectedCarrier.carrierType === 'own_fleet') {
                            alert('ā ļø¸ Perpardavimui reikalingas IÅ ORINIS veÅ¾Ä—jas!\nRadanaras MB yra nuosavas transportas.');
                            return;
                        }
                        
                        if (!formData.carrierPrice) {
                            alert('ā ļø¸ Ä®veskite veÅ¾Ä—jo kainÄ…!');
                            return;
                        }
                        
                        // Warn about negative profit
                        const profit = (formData.clientPrice || 0) - (formData.carrierPrice || 0);
                        if (profit < 0) {
                            if (!confirm(`ā ļø¸ DÄ–MESIO: Neigiamas pelnas (${profit.toFixed(2)} EUR)!\n\nKliento kaina: ${formData.clientPrice} EUR\nVeÅ¾Ä—jo kaina: ${formData.carrierPrice} EUR\n\nAr tikrai norite tÄ™sti?`)) {
                                return;
                            }
                        }
                    }
                    
                    // Auto-assign carrier for own transport
                    if (formData.orderType === 'own_transport') {
                        const radanaras = carriers.find(c => c.isOwnCompany);
                        if (radanaras) {
                            formData.carrierId = radanaras.id;
                            formData.carrierName = radanaras.name;
                            formData.carrierType = 'own_fleet';
                        }
                    }
                }
                
                const newItem = {
                    id: formData.id || Date.now(),
                    ...formData,
                    createdAt: formData.createdAt || new Date().toISOString()
                };

                if (type === 'client') {
                    saveClients([...clients, newItem]);
                } else if (type === 'carrier') {
                    // Set default carrier type if not set
                    if (!newItem.carrierType) {
                        newItem.carrierType = 'external_carrier';
                    }
                    saveCarriers([...carriers, newItem]);
                } else if (type === 'order') {
                    newItem.orderNumber = `RAD${Date.now().toString().slice(-6)}`;
                    newItem.status = 'active';
                    
                    // Calculate profit
                    if (newItem.orderType === 'resale_to_carrier' && newItem.clientPrice && newItem.carrierPrice) {
                        newItem.profit = newItem.clientPrice - newItem.carrierPrice;
                        newItem.profitMargin = (newItem.profit / newItem.carrierPrice) * 100;
                    }
                    
                    saveOrders([...orders, newItem]);
                    
                    // Show success with option to send email
                    if (newItem.orderType === 'resale_to_carrier' && newItem.sendToCarrier) {
                        alert(`ā… UÅ¾sakymas ${newItem.orderNumber} sukurtas!\n\nš“§ Email funkcija bus pridÄ—ta netrukus.`);
                    }
                }
                onClose();
            };

            return (
                <div className="modal-overlay" onClick={onClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {type === 'client' && 'Naujas Klientas'}
                                {type === 'carrier' && 'Naujas VeÅ¾Ä—jas'}
                                {type === 'order' && (initialData ? 'Redaguoti UÅ¾sakymÄ…' : 'Naujas UÅ¾sakymas')}
                            </h2>
                            <button className="close-btn" onClick={onClose}>Ć—</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {type === 'client' && (
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Pavadinimas *</label>
                                        <input 
                                            required
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Ä®monÄ—s kodas *</label>
                                        <input 
                                            required
                                            onChange={(e) => setFormData({...formData, companyCode: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>PVM kodas *</label>
                                        <input 
                                            required
                                            onChange={(e) => setFormData({...formData, vatCode: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Telefonas *</label>
                                        <input 
                                            required
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input 
                                            type="email"
                                            required
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Adresas</label>
                                        <input 
                                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            {type === 'carrier' && (
                                <div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Pavadinimas *</label>
                                            <input 
                                                required
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>VeÅ¾Ä—jo tipas *</label>
                                            <select 
                                                required
                                                onChange={(e) => setFormData({...formData, carrierType: e.target.value})}
                                                style={{background: '#f8fafc'}}
                                            >
                                                <option value="">Pasirinkite...</option>
                                                <option value="external_carrier">š› IÅorinis veÅ¾Ä—jas</option>
                                                <option value="own_fleet">š¸¢ Nuosavas transportas</option>
                                            </select>
                                            <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                                                IÅorinis = perpardavimas | Nuosavas = vykdome patys
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Ä®monÄ—s kodas *</label>
                                            <input 
                                                required
                                                onChange={(e) => setFormData({...formData, companyCode: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>PVM kodas *</label>
                                            <input 
                                                required
                                                onChange={(e) => setFormData({...formData, vatCode: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Telefonas *</label>
                                            <input 
                                                required
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email *</label>
                                            <input 
                                                type="email"
                                                required
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Adresas</label>
                                            <input 
                                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <h3 style={{margin: '24px 0 16px', color: '#1e3a8a', fontSize: '18px'}}>
                                        š“„ Dokumentai
                                    </h3>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>CMR Draudimo galiojimas *</label>
                                            <input 
                                                type="date"
                                                required
                                                onChange={(e) => setFormData({...formData, cmrExpiry: e.target.value})}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Licencijos galiojimas</label>
                                            <input 
                                                type="date"
                                                onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid">
                                        <OneDriveUrlInput 
                                            label="CMR Draudimo OneDrive Link"
                                            value={formData.cmrUrl}
                                            onChange={(url) => setFormData({...formData, cmrUrl: url})}
                                            required={true}
                                        />
                                        <OneDriveUrlInput 
                                            label="Licencijos OneDrive Link"
                                            value={formData.licenseUrl}
                                            onChange={(url) => setFormData({...formData, licenseUrl: url})}
                                        />
                                    </div>
                                </div>
                            )}

                            {type === 'order' && (
                                <div>
                                    {/* Order Type Selection */}
                                    <div style={{marginBottom: '24px'}}>
                                        <label style={{display: 'block', marginBottom: '12px', fontWeight: '600', color: '#1e3a8a'}}>
                                            1ļø¸ā£ UÅ¾sakymo tipas *
                                        </label>
                                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'}}>
                                            {['own_transport', 'resale_to_carrier'].map(type => (
                                                <div 
                                                    key={type}
                                                    onClick={() => setFormData({...formData, orderType: type})}
                                                    style={{
                                                        padding: '16px',
                                                        border: `2px solid ${formData.orderType === type ? '#3b82f6' : '#e2e8f0'}`,
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        background: formData.orderType === type ? '#eff6ff' : '#fff',
                                                        textAlign: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <div style={{fontSize: '24px', marginBottom: '8px'}}>
                                                        {type === 'own_transport' && 'š›'}
                                                        {type === 'resale_to_carrier' && 'š”„'}
                                                    </div>
                                                    <div style={{fontSize: '13px', fontWeight: '600'}}>
                                                        {type === 'own_transport' && 'Nuosavas transportas'}
                                                        {type === 'resale_to_carrier' && 'Pardavimas veÅ¾Ä—jui'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Client & Financials */}
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>2ļø¸ā£ Klientas (uÅ¾sakovas) *</label>
                                            <select 
                                                required
                                                value={formData.clientId || ''}
                                                onChange={(e) => {
                                                    const client = clients.find(c => c.id === e.target.value);
                                                    setFormData({...formData, clientId: e.target.value, clientName: client?.name || ''});
                                                }}
                                            >
                                                <option value="">Pasirinkite...</option>
                                                {clients.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Kliento kaina (EUR) *</label>
                                            <input 
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.clientPrice || ''}
                                                onChange={(e) => setFormData({...formData, clientPrice: parseFloat(e.target.value) || 0})}
                                                placeholder="1200.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Carrier Selection (only for resale) */}
                                    {formData.orderType === 'resale_to_carrier' && (
                                        <>
                                            <div className="form-grid" style={{marginTop: '16px'}}>
                                                <div className="form-group">
                                                    <label>3ļø¸ā£ VeÅ¾Ä—jas (vykdytojas) *</label>
                                                    <select 
                                                        required
                                                        value={formData.carrierId || ''}
                                                        onChange={(e) => {
                                                            const carrier = carriers.find(c => c.id === e.target.value);
                                                            setFormData({...formData, carrierId: e.target.value, carrierName: carrier?.name, carrierType: carrier?.carrierType});
                                                        }}
                                                    >
                                                        <option value="">Pasirinkite...</option>
                                                        {carriers.filter(c => !c.isOwnCompany).map(c => (
                                                            <option key={c.id} value={c.id}>{c.name} š›</option>
                                                        ))}
                                                    </select>
                                                    <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>
                                                        Rodomi tik iÅoriniai veÅ¾Ä—jai
                                                    </div>
                                                </div>
                                                <div className="form-group">
                                                    <label>VeÅ¾Ä—jo kaina (savikaina EUR) *</label>
                                                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                        <input 
                                                            type="number"
                                                            step="0.01"
                                                            required
                                                            value={formData.carrierPrice || ''}
                                                            onChange={(e) => setFormData({...formData, carrierPrice: parseFloat(e.target.value) || 0})}
                                                            placeholder="1000.00"
                                                            style={{flex: 1}}
                                                        />
                                                        <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap', cursor: 'pointer'}}>
                                                            <input 
                                                                type="checkbox"
                                                                checked={formData.carrierPriceWithVAT || false}
                                                                onChange={(e) => setFormData({...formData, carrierPriceWithVAT: e.target.checked})}
                                                            />
                                                            +PVM
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="form-grid" style={{marginTop: '12px'}}>
                                                <div className="form-group">
                                                    <label>MokÄ—jimo terminas veÅ¾Ä—jui</label>
                                                    <select 
                                                        value={formData.paymentTerm || '14 dienÅ³'}
                                                        onChange={(e) => setFormData({...formData, paymentTerm: e.target.value})}
                                                    >
                                                        <option value="1 diena">1 diena</option>
                                                        <option value="5 dienos">5 dienos</option>
                                                        <option value="7 dienos">7 dienos</option>
                                                        <option value="10 dienÅ³">10 dienÅ³</option>
                                                        <option value="14 dienÅ³">14 dienÅ³ (numatyta)</option>
                                                        <option value="15 dienÅ³">15 dienÅ³</option>
                                                        <option value="20 dienÅ³">20 dienÅ³</option>
                                                        <option value="25 dienos">25 dienos</option>
                                                        <option value="30 dienÅ³">30 dienÅ³</option>
                                                        <option value="35 dienos">35 dienos</option>
                                                        <option value="40 dienÅ³">40 dienÅ³</option>
                                                        <option value="45 dienos">45 dienos</option>
                                                        <option value="50 dienÅ³">50 dienÅ³</option>
                                                        <option value="55 dienos">55 dienos</option>
                                                        <option value="60 dienÅ³">60 dienÅ³</option>
                                                    </select>
                                                </div>
                                                
                                                <div className="form-group">
                                                    <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingTop: '8px'}}>
                                                        <input 
                                                            type="checkbox"
                                                            checked={formData.originalsRequired || false}
                                                            onChange={(e) => setFormData({...formData, originalsRequired: e.target.checked})}
                                                        />
                                                        <span style={{fontSize: '13px', fontWeight: '500'}}>OriginalÅ«s dokumentai reikalingi</span>
                                                    </label>
                                                    <div style={{fontSize: '11px', color: '#64748b', marginTop: '6px', marginLeft: '24px'}}>
                                                        CMR su pasiraÅymais turi bÅ«ti pateikti originalÅ«s
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Profit Display */}
                                            {formData.clientPrice > 0 && formData.carrierPrice > 0 && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '16px',
                                                    background: (formData.clientPrice - formData.carrierPrice) < 0 ? '#fee2e2' : '#d1fae5',
                                                    border: `2px solid ${(formData.clientPrice - formData.carrierPrice) < 0 ? '#ef4444' : '#10b981'}`,
                                                    borderRadius: '8px'
                                                }}>
                                                    <div style={{fontWeight: '600', fontSize: '14px', marginBottom: '4px'}}>
                                                        š’° PELNAS: {(formData.clientPrice - formData.carrierPrice).toFixed(2)} EUR
                                                    </div>
                                                    <div style={{fontSize: '12px', color: '#64748b'}}>
                                                        MarÅ¾a: {((formData.clientPrice - formData.carrierPrice) / formData.carrierPrice * 100).toFixed(2)}%
                                                    </div>
                                                    {(formData.clientPrice - formData.carrierPrice) < 0 && (
                                                        <div style={{fontSize: '12px', color: '#dc2626', marginTop: '4px'}}>
                                                            ā ļø¸ DÄ–MESIO: Neigiamas pelnas!
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Cargo & Route */}
                                    <div style={{marginTop: '16px'}}>
                                        <h4 style={{marginBottom: '12px', color: '#1e3a8a', fontSize: '15px'}}>š Krovinio informacija</h4>
                                        
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Krovinio tipas *</label>
                                                <select 
                                                    required
                                                    value={formData.cargoType || ''}
                                                    onChange={(e) => {
                                                        setFormData({...formData, cargoType: e.target.value});
                                                        if (e.target.value !== 'custom') {
                                                            setFormData({...formData, cargoType: e.target.value, cargo: e.target.value});
                                                        }
                                                    }}
                                                >
                                                    <option value="">Pasirinkite...</option>
                                                    <option value="Automobiliai">š— Automobiliai</option>
                                                    <option value="Neutralus krovinys">š“¦ Neutralus krovinys</option>
                                                    <option value="custom">ā¸ļø¸ Kitas (ÄÆvesti rankiniu bÅ«du)</option>
                                                </select>
                                            </div>
                                            
                                            {formData.cargoType === 'custom' && (
                                                <div className="form-group">
                                                    <label>Krovinio pavadinimas *</label>
                                                    <input 
                                                        required
                                                        value={formData.cargo || ''}
                                                        placeholder="pvz. Baldai, Padangos..."
                                                        onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="form-group">
                                                <label>AutomobiliÅ³ skaiÄ¨ius</label>
                                                <select 
                                                    value={formData.vehicleCount || '1'}
                                                    onChange={(e) => setFormData({...formData, vehicleCount: e.target.value})}
                                                >
                                                    {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                                        <option key={num} value={num}>{num} vnt.</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="form-group">
                                                <label>VIN numeriai (nebÅ«tina)</label>
                                                <textarea 
                                                    value={formData.vinNumbers || ''}
                                                    placeholder="Ä®veskite VIN numerius, kiekvienas naujoje eilutÄ—je"
                                                    rows="3"
                                                    onChange={(e) => setFormData({...formData, vinNumbers: e.target.value})}
                                                    style={{fontFamily: 'monospace', fontSize: '11px'}}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Loading Address - Full Details */}
                                        <div style={{marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
                                            <h5 style={{marginBottom: '12px', color: '#1e3a8a', fontSize: '14px'}}>š“¨ Pakrovimo vieta (SiuntÄ—jas)</h5>
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Ä®monÄ—s pavadinimas</label>
                                                    <input 
                                                        value={formData.loadingCompanyName || ''}
                                                        placeholder="pvz. BMW AG"
                                                        onChange={(e) => setFormData({...formData, loadingCompanyName: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Miestas *</label>
                                                    <input 
                                                        required
                                                        value={formData.loadingCity || ''}
                                                        placeholder="pvz. Hamburg"
                                                        onChange={(e) => {
                                                            setFormData({...formData, loadingCity: e.target.value});
                                                            // Auto-update route
                                                            if (e.target.value && formData.unloadingCity) {
                                                                setFormData({
                                                                    ...formData,
                                                                    loadingCity: e.target.value,
                                                                    route: `${e.target.value} ā†’ ${formData.unloadingCity}`
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>GatvÄ— ir nr.</label>
                                                    <input 
                                                        value={formData.loadingStreet || ''}
                                                        placeholder="pvz. HauptstraĆe 123"
                                                        onChange={(e) => setFormData({...formData, loadingStreet: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>PaÅto kodas</label>
                                                    <input 
                                                        value={formData.loadingPostalCode || ''}
                                                        placeholder="pvz. 20095"
                                                        onChange={(e) => setFormData({...formData, loadingPostalCode: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>KoordinatÄ—s (nebÅ«tina)</label>
                                                    <input 
                                                        value={formData.loadingCoordinates || ''}
                                                        placeholder="pvz. 53.551086, 9.993682"
                                                        onChange={(e) => setFormData({...formData, loadingCoordinates: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unloading Address - Full Details */}
                                        <div style={{marginTop: '12px', padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
                                            <h5 style={{marginBottom: '12px', color: '#1e3a8a', fontSize: '14px'}}>š“¨ IÅkrovimo vieta (GavÄ—jas)</h5>
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Ä®monÄ—s pavadinimas</label>
                                                    <input 
                                                        value={formData.unloadingCompanyName || ''}
                                                        placeholder="pvz. UAB Automobiliai"
                                                        onChange={(e) => setFormData({...formData, unloadingCompanyName: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>Miestas *</label>
                                                    <input 
                                                        required
                                                        value={formData.unloadingCity || ''}
                                                        placeholder="pvz. Vilnius"
                                                        onChange={(e) => {
                                                            setFormData({...formData, unloadingCity: e.target.value});
                                                            // Auto-update route
                                                            if (formData.loadingCity && e.target.value) {
                                                                setFormData({
                                                                    ...formData,
                                                                    unloadingCity: e.target.value,
                                                                    route: `${formData.loadingCity} ā†’ ${e.target.value}`
                                                                });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>GatvÄ— ir nr.</label>
                                                    <input 
                                                        value={formData.unloadingStreet || ''}
                                                        placeholder="pvz. Gedimino pr. 1"
                                                        onChange={(e) => setFormData({...formData, unloadingStreet: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>PaÅto kodas</label>
                                                    <input 
                                                        value={formData.unloadingPostalCode || ''}
                                                        placeholder="pvz. 01103"
                                                        onChange={(e) => setFormData({...formData, unloadingPostalCode: e.target.value})}
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label>KoordinatÄ—s (nebÅ«tina)</label>
                                                    <input 
                                                        value={formData.unloadingCoordinates || ''}
                                                        placeholder="pvz. 54.687157, 25.279652"
                                                        onChange={(e) => setFormData({...formData, unloadingCoordinates: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="form-group" style={{marginTop: '12px'}}>
                                            <label>MarÅrutas (auto-generuojamas)</label>
                                            <input 
                                                value={formData.route || ''}
                                                placeholder="UÅ¾pildykite adresus - marÅrutas sugeneruosis automatiÅkai"
                                                readOnly
                                                style={{background: '#f8fafc', cursor: 'not-allowed'}}
                                            />
                                        </div>
                                    </div>

                                    {/* Transport Info - NEW SECTION */}
                                    <div style={{marginTop: '16px'}}>
                                        <h4 style={{marginBottom: '12px', color: '#1e3a8a', fontSize: '15px'}}>š› Transportas ir vairuotojas</h4>
                                        
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Vilkikas (valst. nr.)</label>
                                                <input 
                                                    value={formData.truckPlate || ''}
                                                    placeholder="pvz. ABC123"
                                                    onChange={(e) => setFormData({...formData, truckPlate: e.target.value.toUpperCase()})}
                                                    style={{textTransform: 'uppercase'}}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Priekaba (valst. nr.)</label>
                                                <input 
                                                    value={formData.trailerPlate || ''}
                                                    placeholder="pvz. XYZ789"
                                                    onChange={(e) => setFormData({...formData, trailerPlate: e.target.value.toUpperCase()})}
                                                    style={{textTransform: 'uppercase'}}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Vairuotojas (vardas pavardÄ—)</label>
                                                <input 
                                                    value={formData.driverName || ''}
                                                    placeholder="pvz. Jonas Jonaitis"
                                                    onChange={(e) => setFormData({...formData, driverName: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates with duration calculator */}
                                    <div style={{marginTop: '16px'}}>
                                        <h4 style={{marginBottom: '12px', color: '#1e3a8a', fontSize: '15px'}}>š“… Datos</h4>
                                        
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Pakrovimo data *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={formData.loadingDate || ''}
                                                    onChange={(e) => setFormData({...formData, loadingDate: e.target.value})}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>IÅkrovimo data *</label>
                                                <input 
                                                    type="date"
                                                    required
                                                    value={formData.unloadingDate || ''}
                                                    onChange={(e) => setFormData({...formData, unloadingDate: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        
                                        {/* Duration calculator */}
                                        {formData.loadingDate && formData.unloadingDate && (
                                            (() => {
                                                const start = new Date(formData.loadingDate);
                                                const end = new Date(formData.unloadingDate);
                                                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                                                return (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        padding: '12px',
                                                        background: days >= 0 ? '#eff6ff' : '#fee2e2',
                                                        border: `1px solid ${days >= 0 ? '#3b82f6' : '#ef4444'}`,
                                                        borderRadius: '6px',
                                                        fontSize: '13px'
                                                    }}>
                                                        {days >= 0 ? (
                                                            <>
                                                                ā¸±ļø¸ TrukmÄ—: <strong>{days} {days === 1 ? 'diena' : days < 10 ? 'dienos' : 'dienÅ³'}</strong>
                                                            </>
                                                        ) : (
                                                            <span style={{color: '#dc2626'}}>
                                                                ā ļø¸ IÅkrovimo data ankstesnÄ— uÅ¾ pakrovimo!
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>

                                    {/* Additional Info */}
                                    <div style={{marginTop: '16px'}}>
                                        <h4 style={{marginBottom: '12px', color: '#1e3a8a', fontSize: '15px'}}>š“‹ Papildoma informacija</h4>
                                        
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Load/Ref numeris (pakrovimui)</label>
                                                <input 
                                                    value={formData.loadRefLoading || ''}
                                                    placeholder="pvz. LRN-2024-001"
                                                    onChange={(e) => setFormData({...formData, loadRefLoading: e.target.value})}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Load/Ref numeris (iÅkrovimui)</label>
                                                <input 
                                                    value={formData.loadRefUnloading || ''}
                                                    placeholder="pvz. DLV-2024-001"
                                                    onChange={(e) => setFormData({...formData, loadRefUnloading: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group" style={{marginTop: '12px'}}>
                                            <label>VIN numeriai automobiliÅ³ (atskirti kableliais)</label>
                                            <textarea 
                                                rows="2"
                                                value={formData.vinNumbers || ''}
                                                placeholder="pvz. WBA1234567890ABCD, WBA9876543210EFGH, ..."
                                                onChange={(e) => setFormData({...formData, vinNumbers: e.target.value})}
                                                style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '12px'}}
                                            />
                                        </div>

                                        <div className="form-group" style={{marginTop: '12px'}}>
                                            <label>Instrukcijos veÅ¾Ä—jui</label>
                                            <textarea 
                                                rows="3"
                                                value={formData.instructions || ''}
                                                placeholder="pvz. Skambinti prieÅ 1h iki pakrovimo. Automobiliai turi bÅ«ti dengti..."
                                                onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                                                style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                                            />
                                        </div>

                                        <div className="form-grid" style={{marginTop: '12px'}}>
                                            <div className="form-group">
                                                <label>OriginalÅ«s dokumentai</label>
                                                <select 
                                                    value={formData.originalsRequired || 'not_required'}
                                                    onChange={(e) => setFormData({...formData, originalsRequired: e.target.value})}
                                                >
                                                    <option value="not_required">ā¯ Nereikalingi</option>
                                                    <option value="required">ā… Reikalingi</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group" style={{marginTop: '12px'}}>
                                            <label>Pastabos</label>
                                            <textarea 
                                                rows="2"
                                                value={formData.notes || ''}
                                                placeholder="Papildomos pastabos..."
                                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                                style={{width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0'}}
                                            />
                                        </div>
                                    </div>

                                    {/* Email Option */}
                                    {formData.orderType === 'resale_to_carrier' && formData.carrierId && (
                                        <div style={{marginTop: '16px'}}>
                                            <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                                                <input 
                                                    type="checkbox"
                                                    checked={formData.sendToCarrier !== false}
                                                    onChange={(e) => setFormData({...formData, sendToCarrier: e.target.checked})}
                                                />
                                                š“§ SiÅ³sti orderÄÆ veÅ¾Ä—jui el. paÅtu
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap'}}>
                                {type === 'order' && (
                                    <button type="button" className="btn btn-secondary" onClick={() => saveOrderAsDraft('draft')}>
                                        š“¯ IÅsaugoti kaip juodraÅtÄÆ
                                    </button>
                                )}
                                <button type="submit" className="btn btn-success">
                                    ā… IÅsaugoti uÅ¾sakymÄ…
                                </button>
                                {type === 'order' && formData.orderType === 'resale_to_carrier' && (
                                    <button 
                                        type="button" 
                                        className="btn"
                                        style={{background: '#3b82f6', color: 'white'}}
                                        onClick={(e) => {
                                            // First save the order
                                            const form = e.target.closest('form');
                                            if (form.reportValidity()) {
                                                generateCarrierOrder();
                                            } else {
                                                alert('ā ļø¸ UÅ¾pildykite visus privalomus laukus!');
                                            }
                                        }}
                                    >
                                        š“„ Sugeneruoti uÅ¾sakymÄ… veÅ¾Ä—jui
                                    </button>
                                )}
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    ā¯ AtÅaukti
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            );
        }

        // Render app
        ReactDOM.render(<App />, document.getElementById('root'));
