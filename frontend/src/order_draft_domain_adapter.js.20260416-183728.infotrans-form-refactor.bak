const calculateDraftFinancials = ({ projectDraft = {}, executionDraft = {} } = {}) => {
  const clientPrice = Number(projectDraft.clientPrice) || 0;
  const carrierPrice = Number(executionDraft.carrierPrice) || 0;
  const profit = clientPrice - carrierPrice;
  const profitMargin = carrierPrice ? (profit / carrierPrice) * 100 : 0;

  return {
    clientPrice,
    carrierPrice,
    profit,
    profitMargin,
  };
};

export const mapLegacyOrderTypeToExecutionMode = (orderType) => (
  orderType === "own_transport" ? "own_fleet" : "expedition"
);

export const mapLegacyStatusToRegistryStatus = (status) => {
  if (status === "draft") return "draft";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "active" || status === "in_progress" || status === "delivered") return "active";
  return "planned";
};

export const mapLegacyStatusToExecutionStatus = (status) => {
  if (status === "draft") return "draft";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "in_progress") return "in_transit";
  if (status === "active" || status === "generated") return "dispatched";
  return "prepared";
};

export const buildDraftPartySnapshot = (party = {}, fallbackName = "") => ({
  id: party.id || "",
  name: party.name || fallbackName || "",
  companyCode: party.companyCode || "",
  vatCode: party.vatCode || "",
  phone: party.phone || "",
  email: party.email || "",
  address: party.address || "",
});

export const buildFutureDomainBundleFromDrafts = ({
  projectDraft = {},
  executionDraft = {},
  settings = {},
  selectedCarrier = null,
  idFactory = () => Date.now().toString(),
  now = new Date().toISOString(),
} = {}) => {
  const executionMode = mapLegacyOrderTypeToExecutionMode(executionDraft.orderType);
  const registryStatus = mapLegacyStatusToRegistryStatus(executionDraft.status);
  const executionStatus = mapLegacyStatusToExecutionStatus(executionDraft.status);
  const financials = calculateDraftFinancials({ projectDraft, executionDraft });
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

  const projectId = projectDraft.projectId || `prj_${idFactory()}`;
  const executionId = `exe_${idFactory()}`;
  const documentRulesId = `doc_${idFactory()}`;
  const financeStateId = `fin_${idFactory()}`;
  const historyEventId = `evt_${idFactory()}`;

  const clientSnapshot = buildDraftPartySnapshot({
    id: projectDraft.clientId,
    name: projectDraft.clientName,
    companyCode: projectDraft.clientCompanyCode,
    vatCode: projectDraft.clientVatCode,
    phone: projectDraft.clientPhone,
    email: projectDraft.clientEmail,
    address: projectDraft.clientAddress,
  }, projectDraft.clientName);

  const carrierSnapshot = buildDraftPartySnapshot({
    id: executionDraft.carrierId || selectedCarrier?.id,
    name: executionDraft.carrierName || selectedCarrier?.name,
    companyCode: executionDraft.carrierCompanyCode || selectedCarrier?.companyCode,
    vatCode: executionDraft.carrierVAT || selectedCarrier?.vatCode,
    phone: executionDraft.carrierPhone || selectedCarrier?.phone,
    email: executionDraft.carrierEmail || selectedCarrier?.email,
    address: executionDraft.carrierAddress || selectedCarrier?.address,
  }, executionDraft.carrierName || selectedCarrier?.name);

  const project = {
    id: projectId,
    entityType: "project",
    projectNumber: executionDraft.orderNumber || "",
    projectId,
    managerName: projectDraft.managerName || "",
    registryStatus,
    executionMode,
    entryModule: executionMode === "own_fleet" ? "nuosavas_transportas" : "ekspedijavimas",
    currentExecutionId: executionId,
    linkedExecutionIds: [executionId],
    financeStateId,
    documentRulesId,
    clientSnapshot,
    carrierSnapshot: executionMode === "expedition" ? carrierSnapshot : null,
    clientOrderNumber: projectDraft.clientOrderNumber || "",
    internalOrderNumber: executionDraft.orderNumber || "",
    routeText: projectDraft.route || "",
    loadingDate: projectDraft.loadingDate || "",
    unloadingDate: projectDraft.unloadingDate || "",
    cargoType: projectDraft.cargoType || "",
    cargoDescription: projectDraft.cargoName || projectDraft.cargo || "",
    cargoName: projectDraft.cargoName || projectDraft.cargo || "",
    quantity: projectDraft.quantity || projectDraft.vehicleCount || "",
    ldm: projectDraft.ldm || "",
    weight: projectDraft.weight || "",
    temperature: projectDraft.temperature || "",
    palletCount: projectDraft.palletCount || "",
    vehicleCount: projectDraft.vehicleCount || "",
    specialConditions: projectDraft.notes || "",
    latestCmrStatus: projectDraft.documents?.cmr ? "uploaded" : "missing",
    latestPodStatus: projectDraft.documents?.pod ? "uploaded" : "missing",
    latestClientInvoiceStatus: projectDraft.documents?.invoice ? "issued" : "pending",
    latestCarrierInvoiceStatus: executionMode === "expedition" ? "pending" : "not_required",
    createdAt: now,
    updatedAt: now,
  };

  const execution = {
    id: executionId,
    entityType: "execution",
    executionNumber: executionDraft.orderNumber || "",
    projectId,
    mode: executionMode,
    status: executionStatus,
    internalOrderNumber: executionDraft.orderNumber || "",
    projectClientSnapshot: clientSnapshot,
    projectCarrierSnapshot: executionMode === "expedition" ? carrierSnapshot : null,
    clientPrice: financials.clientPrice || undefined,
    carrierPrice: executionMode === "expedition" ? financials.carrierPrice || undefined : undefined,
    executionCost: executionMode === "own_fleet" ? (executionDraft.executionCost || financials.executionCost || financials.carrierPrice || undefined) : undefined,
    instructions: executionDraft.instructions || "",
    ownFleet: executionMode === "own_fleet" ? {
      driverName: executionDraft.driverName || "",
      truckPlate: executionDraft.truckPlate || "",
      trailerPlate: executionDraft.trailerPlate || "",
    } : null,
    expedition: executionMode === "expedition" ? {
      carrierId: executionDraft.carrierId || selectedCarrier?.id || "",
      carrierName: carrierSnapshot.name,
      carrierPrice: financials.carrierPrice || undefined,
      contactName: executionDraft.contactName || "",
      contactPhone: executionDraft.contactPhone || "",
      contactEmail: executionDraft.contactEmail || "",
      sendToCarrier: executionDraft.sendToCarrier !== false,
    } : null,
    createdAt: now,
    updatedAt: now,
  };

  const documentRules = {
    id: documentRulesId,
    entityType: "document_rules",
    projectId,
    requiresOriginals: projectDraft.originalsRequired === true || projectDraft.originalsRequired === "required",
    requiresCmr: true,
    requiresPod: true,
    requiresClientInvoice: true,
    requiresCarrierInvoice: executionMode === "expedition",
    invoiceRecipients: [projectDraft.clientEmail].filter(Boolean),
    cmrRecipients: [projectDraft.clientEmail].filter(Boolean),
    podRecipients: [projectDraft.clientEmail].filter(Boolean),
    specialDocumentConditions: projectDraft.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  const financeState = {
    id: financeStateId,
    entityType: "finance_state",
    projectId,
    executionId,
    currency: "EUR",
    clientPriceNet: financials.clientPrice || undefined,
    carrierPriceNet: executionMode === "expedition" ? financials.carrierPrice || undefined : undefined,
    internalCostNet: executionMode === "own_fleet" ? financials.carrierPrice || undefined : undefined,
    profitNet: executionMode === "expedition" ? financials.profit : undefined,
    marginPercent: executionMode === "expedition" ? financials.profitMargin : undefined,
    clientInvoiceStatus: "pending",
    carrierInvoiceStatus: executionMode === "expedition" ? "pending" : "not_required",
    createdAt: now,
    updatedAt: now,
  };

  const attachments = [
    projectDraft.documents?.cmr ? { id: `att_${idFactory()}`, entityType: "attachment", ownerType: "project", ownerId: projectId, projectId, executionId, kind: "cmr", fileName: "legacy-cmr", publicUrl: projectDraft.documents.cmr, documentStatus: "uploaded", createdAt: now, updatedAt: now } : null,
    projectDraft.documents?.pod ? { id: `att_${idFactory()}`, entityType: "attachment", ownerType: "project", ownerId: projectId, projectId, executionId, kind: "pod", fileName: "legacy-pod", publicUrl: projectDraft.documents.pod, documentStatus: "uploaded", createdAt: now, updatedAt: now } : null,
    projectDraft.documents?.invoice ? { id: `att_${idFactory()}`, entityType: "attachment", ownerType: "project", ownerId: projectId, projectId, executionId, kind: "invoice_client", fileName: "legacy-client-invoice", publicUrl: projectDraft.documents.invoice, documentStatus: "uploaded", createdAt: now, updatedAt: now } : null,
  ].filter(Boolean);

  const initialHistoryEvent = {
    id: historyEventId,
    entityType: "project_history_event",
    projectId,
    executionId,
    eventType: "project_created",
    actorType: "system",
    sourceModule: executionMode === "own_fleet" ? "nuosavas_transportas" : "ekspedijavimas",
    message: "Project bundle prepared from order drafts.",
    createdAt: now,
    updatedAt: now,
  };

  return {
    project,
    execution,
    documentRules,
    financeState,
    attachments,
    initialHistoryEvent,
    meta: {
      companyName: companyProfile.name,
      companyProfile,
      templateId: executionDraft._selectedTemplateId || null,
    },
  };
};
