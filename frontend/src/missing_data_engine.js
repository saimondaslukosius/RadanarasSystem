const normalizeText = (value) => String(value || "").trim();

const hasValue = (value) => normalizeText(value).length > 0;

const normalizeDate = (value) => {
  const raw = normalizeText(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const findCarrierDocument = (carrier = {}, matcher = () => false) =>
  Array.isArray(carrier.documents) ? carrier.documents.find((doc) => matcher(doc || {})) || null : null;

const findCmrDocument = (carrier = {}) =>
  findCarrierDocument(carrier, (doc) => {
    const label = `${normalizeText(doc?.title)} ${normalizeText(doc?.type)}`.toLowerCase();
    return label.includes("cmr");
  });

const findLicenseDocument = (carrier = {}) =>
  findCarrierDocument(
    carrier,
    (doc) => {
      const label = `${normalizeText(doc?.title)} ${normalizeText(doc?.type)}`.toLowerCase();
      return label.includes("licenc") || label.includes("licens");
    }
  );

const getDaysUntil = (value, now = new Date()) => {
  const date = normalizeDate(value);
  if (!date) return null;
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const isOwnCompanyCarrier = (carrier = {}) => {
  if (carrier?.isOwnCompany === true) return true;
  return normalizeText(carrier?.carrierType).toLowerCase() === "nuosavas transportas";
};

const isExternalCarrier = (carrier = {}) => !isOwnCompanyCarrier(carrier);

const buildResult = ({ critical = [], recommended = [] } = {}) => ({
  missingCriticalFields: critical,
  missingRecommendedFields: recommended,
  isComplete: critical.length === 0 && recommended.length === 0,
  hasCriticalIssues: critical.length > 0,
});

export const analyzeClientData = (client = {}) => {
  const contacts = Array.isArray(client.contacts)
    ? client.contacts.filter((contact) => hasValue(contact?.name) || hasValue(contact?.email) || hasValue(contact?.phone))
    : [];
  const defaultContact = contacts[0] || null;

  const recommended = [];
  if (!hasValue(client.name)) recommended.push("Pavadinimas");
  if (!hasValue(client.companyCode)) recommended.push("Įmonės kodas");
  if (!hasValue(client.vatCode)) recommended.push("PVM kodas");
  if (!hasValue(client.email)) recommended.push("Email");
  if (!hasValue(client.phone)) recommended.push("Telefonas");
  if (!hasValue(client.address)) recommended.push("Adresas");
  if (!defaultContact) recommended.push("Numatytasis kontaktas");

  return {
    ...buildResult({ recommended }),
    defaultContact,
  };
};

export const getCarrierDocumentHealth = (carrier = {}, now = new Date()) => {
  const cmrDocument = findCmrDocument(carrier);
  const licenseDocument = findLicenseDocument(carrier);

  const cmrDaysLeft = getDaysUntil(cmrDocument?.validUntil, now);
  const licenseDaysLeft = getDaysUntil(licenseDocument?.validUntil, now);

  const cmrMissing = !cmrDocument || !hasValue(cmrDocument.validUntil);
  const licenseMissing = !licenseDocument || !hasValue(licenseDocument.validUntil);
  const cmrExpired = !cmrMissing && cmrDaysLeft < 0;
  const licenseExpired = !licenseMissing && licenseDaysLeft < 0;
  const cmrExpiringSoon = !cmrMissing && !cmrExpired && cmrDaysLeft <= 30;
  const licenseExpiringSoon = !licenseMissing && !licenseExpired && licenseDaysLeft <= 30;

  return {
    cmrDocument,
    licenseDocument,
    cmrDaysLeft,
    licenseDaysLeft,
    cmrMissing,
    licenseMissing,
    cmrExpired,
    licenseExpired,
    cmrExpiringSoon,
    licenseExpiringSoon,
    hasCriticalIssues: cmrMissing || licenseMissing || cmrExpired || licenseExpired,
  };
};

export const analyzeCarrierData = (carrier = {}, now = new Date()) => {
  const defaultContact =
    Array.isArray(carrier.managerContacts)
      ? carrier.managerContacts.find((contact) => hasValue(contact?.name) || hasValue(contact?.email) || hasValue(contact?.phone)) || null
      : null;

  const health = getCarrierDocumentHealth(carrier, now);
  const critical = [];
  const recommended = [];

  if (health.cmrMissing) critical.push("CMR draudimas neįkeltas");
  else if (health.cmrExpired) critical.push("CMR draudimas pasibaigęs");

  if (health.licenseMissing) critical.push("Licenzija neįkelta");
  else if (health.licenseExpired) critical.push("Licenzija pasibaigusi");

  if (!hasValue(carrier.name)) recommended.push("Pavadinimas");
  if (!hasValue(carrier.companyCode)) recommended.push("Įmonės kodas");
  if (!hasValue(carrier.vatCode)) recommended.push("PVM kodas");
  if (!hasValue(carrier.email)) recommended.push("Email");
  if (!hasValue(carrier.phone)) recommended.push("Telefonas");
  if (!hasValue(carrier.address)) recommended.push("Adresas");
  if (!defaultContact) recommended.push("Numatytasis kontaktas");

  return {
    ...buildResult({ critical, recommended }),
    defaultContact,
    documentHealth: health,
  };
};

export const analyzeDriverData = (driver = {}) => {
  const recommended = [];
  if (!hasValue(driver.name)) recommended.push("Vardas");
  if (!hasValue(driver.phone)) recommended.push("Telefonas");
  return buildResult({ recommended });
};

export const analyzeTruckData = (truck = {}) => {
  const recommended = [];
  if (!hasValue(truck.licensePlate)) recommended.push("Valst. numeris");
  if (!hasValue(truck.status)) recommended.push("Statusas");
  return buildResult({ recommended });
};

export const analyzeTrailerData = (trailer = {}) => {
  const recommended = [];
  if (!hasValue(trailer.licensePlate)) recommended.push("Valst. numeris");
  if (!hasValue(trailer.status)) recommended.push("Statusas");
  return buildResult({ recommended });
};

const createReminderKey = ({ reminderType, entityType, entityId }) =>
  `${entityType}:${entityId}:${reminderType}`;

const mergeReminderOverrides = (reminder, overridesMap) => {
  const override = overridesMap.get(createReminderKey(reminder));
  if (!override) return reminder;
  return {
    ...reminder,
    ...override,
    status: override.status || reminder.status,
    sentAt: override.sentAt || reminder.sentAt || null,
    resolvedAt: override.resolvedAt || reminder.resolvedAt || null,
    channel: override.channel || reminder.channel,
  };
};

export const buildCarrierDocumentReminders = (carriers = [], overrides = [], now = new Date()) => {
  const overridesMap = new Map((overrides || []).map((item) => [createReminderKey(item), item]));
  const reminders = [];

  carriers
    .filter(isExternalCarrier)
    .forEach((carrier) => {
      const health = getCarrierDocumentHealth(carrier, now);

      const base = {
        entityType: "carrier",
        entityId: String(carrier.id || carrier.name || Date.now()),
        channel: "email",
      };

      if (health.cmrMissing || health.cmrExpired) {
        reminders.push(
          mergeReminderOverrides({
            ...base,
            reminderType: "carrier_cmr_expiry",
            status: "pending",
            dueAt: health.cmrDocument?.validUntil || null,
            sentAt: null,
            resolvedAt: null,
            title: health.cmrMissing ? "CMR draudimas neįkeltas" : "CMR draudimas pasibaigęs",
            detail: carrier.name || "Vežėjas",
          }, overridesMap)
        );
      }

      if (health.licenseMissing || health.licenseExpired) {
        reminders.push(
          mergeReminderOverrides({
            ...base,
            reminderType: "carrier_license_expiry",
            status: "pending",
            dueAt: health.licenseDocument?.validUntil || null,
            sentAt: null,
            resolvedAt: null,
            title: health.licenseMissing ? "Licenzija neįkelta" : "Licenzija pasibaigusi",
            detail: carrier.name || "Vežėjas",
          }, overridesMap)
        );
      }
    });

  return reminders;
};

export const buildProjectCmrReminders = (projects = [], overrides = [], now = new Date()) => {
  const overridesMap = new Map((overrides || []).map((item) => [createReminderKey(item), item]));
  const reminders = [];

  projects.forEach((project) => {
    const unloadingDate = normalizeDate(project.unloadingDate);
    if (!unloadingDate) return;
    const dueDate = new Date(unloadingDate.getTime() + 24 * 60 * 60 * 1000);
    const cmrPresent = Boolean(project.documents?.cmr) || project.cmrStatus === "present";
    if (cmrPresent || dueDate > now) return;

    reminders.push(
      mergeReminderOverrides({
        reminderType: "project_cmr_missing",
        entityType: "project",
        entityId: String(project.projectId || project.id || project.orderNumber || Date.now()),
        status: "pending",
        channel: "email",
        dueAt: dueDate.toISOString(),
        sentAt: null,
        resolvedAt: null,
        title: "CMR neįkelta per 24h",
        detail: project.clientName || project.route || "Projektas",
      }, overridesMap)
    );
  });

  return reminders;
};

export const buildReminderSnapshot = ({ carriers = [], projects = [], overrides = [], now = new Date() } = {}) => {
  const carrierReminders = buildCarrierDocumentReminders(carriers, overrides, now);
  const projectReminders = buildProjectCmrReminders(projects, overrides, now);
  const allReminders = [...carrierReminders, ...projectReminders];

  const carrierHealthList = carriers.filter(isExternalCarrier).map((carrier) => ({
    carrier,
    health: getCarrierDocumentHealth(carrier, now),
  }));

  const missingCmrCount = carrierHealthList.filter((item) => item.health.cmrMissing).length;
  const expiredCmrCount = carrierHealthList.filter((item) => item.health.cmrExpired).length;
  const missingLicenseCount = carrierHealthList.filter((item) => item.health.licenseMissing).length;
  const expiredLicenseCount = carrierHealthList.filter((item) => item.health.licenseExpired).length;
  const expiringSoonCount = carrierHealthList.filter(
    (item) => item.health.cmrExpiringSoon || item.health.licenseExpiringSoon
  ).length;
  const completeCarrierCount = carrierHealthList.filter(
    (item) =>
      !item.health.cmrMissing &&
      !item.health.cmrExpired &&
      !item.health.cmrExpiringSoon &&
      !item.health.licenseMissing &&
      !item.health.licenseExpired &&
      !item.health.licenseExpiringSoon
  ).length;

  return {
    reminders: allReminders,
    carrierDocuments: {
      missingCmrCount,
      expiredCmrCount,
      missingLicenseCount,
      expiredLicenseCount,
      expiringSoonCount,
      completeCarrierCount,
    },
    projectDocuments: {
      cmrMissingAfter24hCount: projectReminders.length,
    },
    reminderStats: {
      pendingCount: allReminders.filter((item) => item.status === "pending").length,
      sentCount: allReminders.filter((item) => item.status === "sent").length,
      overdueCount: allReminders.filter((item) => item.status === "overdue").length,
      resolvedCount: allReminders.filter((item) => item.status === "resolved").length,
    },
  };
};

export const createManualReminderUpdate = (reminder, channel = "email") => ({
  reminderType: reminder.reminderType,
  entityType: reminder.entityType,
  entityId: reminder.entityId,
  status: "sent",
  channel,
  sentAt: new Date().toISOString(),
});
