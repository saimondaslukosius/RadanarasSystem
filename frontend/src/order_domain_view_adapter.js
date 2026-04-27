const byId = (items = []) =>
  new Map((Array.isArray(items) ? items : []).filter((item) => item?.id !== undefined && item?.id !== null).map((item) => [String(item.id), item]));

const normalizeStatus = (status) => {
  if (status === "planned") return "new";
  if (status === "prepared") return "generated";
  if (status === "in_transit") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "draft") return "draft";
  return "new";
};

export const buildLegacyOrderLikeRowsFromFutureBuckets = ({
  projects = [],
  executions = [],
  financeStates = [],
} = {}) => {
  const executionMap = byId(executions);
  const financeMap = new Map((Array.isArray(financeStates) ? financeStates : []).map((state) => [String(state.projectId), state]));

  return (Array.isArray(projects) ? projects : []).map((project) => {
    const execution = executionMap.get(String(project.currentExecutionId || "")) || null;
    const financeState = financeMap.get(String(project.id)) || null;
    const clientSnapshot = project.clientSnapshot || execution?.projectClientSnapshot || {};
    const carrierSnapshot = project.carrierSnapshot || execution?.projectCarrierSnapshot || {};
    const ownFleet = execution?.ownFleet || {};
    const expedition = execution?.expedition || {};
    const isOwnTransport = project.executionMode === "own_fleet";

    return {
      id: `future_${project.id}`,
      sourceProjectId: project.id,
      sourceExecutionId: execution?.id || "",
      sourceType: "future_domain",
      orderNumber: project.projectNumber || execution?.executionNumber || "",
      clientOrderNumber: project.clientOrderNumber || "",
      orderType: isOwnTransport ? "own_transport" : "resale_to_carrier",
      status: normalizeStatus(execution?.status || project.registryStatus),
      route: project.routeText || "",
      loadingDate: project.loadingDate || "",
      unloadingDate: project.unloadingDate || "",
      cargoType: project.cargoType || "",
      cargo: project.cargoDescription || project.cargoType || "",
      vehicleCount: project.vehicleCount || "",
      clientId: clientSnapshot.id || "",
      clientName: clientSnapshot.name || "",
      clientCompanyCode: clientSnapshot.companyCode || "",
      clientVatCode: clientSnapshot.vatCode || "",
      clientPhone: clientSnapshot.phone || "",
      clientEmail: clientSnapshot.email || "",
      clientAddress: clientSnapshot.address || "",
      clientPrice: financeState?.clientPriceNet ?? execution?.clientPrice ?? "",
      carrierId: expedition.carrierId || carrierSnapshot.id || "",
      carrierName: expedition.carrierName || carrierSnapshot.name || "",
      carrierCompanyCode: carrierSnapshot.companyCode || "",
      carrierVAT: carrierSnapshot.vatCode || "",
      carrierPhone: carrierSnapshot.phone || "",
      carrierEmail: carrierSnapshot.email || "",
      carrierAddress: carrierSnapshot.address || "",
      carrierPrice: financeState?.carrierPriceNet ?? expedition.carrierPrice ?? "",
      paymentTerm: expedition.paymentTermDays ? `${expedition.paymentTermDays} dienų` : "",
      contactName: expedition.contactName || "",
      contactPhone: expedition.contactPhone || "",
      contactEmail: expedition.contactEmail || "",
      truckPlate: ownFleet.truckPlate || "",
      trailerPlate: ownFleet.trailerPlate || "",
      driverName: ownFleet.driverName || "",
      instructions: execution?.instructions || "",
      notes: project.specialConditions || "",
      documents: {},
      createdAt: project.createdAt || execution?.createdAt || "",
      updatedAt: project.updatedAt || execution?.updatedAt || "",
      futureMode: project.executionMode,
    };
  });
};
