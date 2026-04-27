export type Id = string;
export type ISODateTime = string;
export type CreationSourceType = "manual" | "email" | "pdf" | "screenshot";
export type ExecutionMode = "expedition" | "own_fleet";
export type CanonicalLegacyOrderType = "own_transport" | "resale_to_carrier";
export type CanonicalLegacyOrderStatus =
  | "draft"
  | "new"
  | "generated"
  | "active"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface LegacyOrderDocuments {
  cmr?: string;
  pod?: string;
  invoice?: string;
}

export interface LegacyOrder {
  id?: string | number;
  orderNumber?: string;
  clientOrderNumber?: string;
  orderType?: string;
  status?: string;
  clientId?: string;
  client?: string;
  clientName?: string;
  clientCompanyCode?: string;
  clientVatCode?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  carrierId?: string;
  carrier?: string;
  carrierName?: string;
  carrierType?: string;
  carrierCompanyCode?: string;
  carrierVAT?: string;
  carrierPhone?: string;
  carrierEmail?: string;
  carrierAddress?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  clientPrice?: number | string;
  carrierPrice?: number | string;
  carrierPriceWithVAT?: boolean | string;
  carrierPriceWithVat?: boolean | string;
  paymentTerm?: string;
  cargoType?: string;
  cargo?: string;
  vehicleCount?: number | string;
  vinNumbers?: string;
  route?: string;
  loadingCompanyName?: string;
  loadingCity?: string;
  loadingStreet?: string;
  loadingPostalCode?: string;
  unloadingCompanyName?: string;
  unloadingCity?: string;
  unloadingStreet?: string;
  unloadingPostalCode?: string;
  loadingDate?: string;
  unloadingDate?: string;
  loadRefLoading?: string;
  loadRefUnloading?: string;
  instructions?: string;
  originalsRequired?: boolean | string;
  notes?: string;
  sendToCarrier?: boolean | string;
  documents?: LegacyOrderDocuments;
  driverName?: string;
  truckPlate?: string;
  trailerPlate?: string;
  sourceType?: CreationSourceType;
  sourceAttachmentIds?: string[];
  sourceMessageId?: string;
  sourceParseSessionId?: string;
  sourceConfidence?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedPartyRecord {
  id?: string | number;
  name?: string;
  companyCode?: string;
  vatCode?: string;
  email?: string;
}

export interface MigrationContext {
  organizationId: string;
  defaultCurrency?: string;
  defaultSourceType?: CreationSourceType;
  now?: () => ISODateTime;
  idFactory?: () => Id;
  sharedClients?: SharedPartyRecord[];
  sharedCarriers?: SharedPartyRecord[];
}

export interface MigrationWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
  fieldPath?: string;
}

export interface UnresolvedField {
  fieldPath: string;
  reason: string;
  legacyValue?: unknown;
  suggestedAction?: string;
}

export interface NormalizationMeta {
  originalOrderType?: string;
  originalStatus?: string;
  usedOrderTypeFallback: boolean;
  usedStatusFallback: boolean;
}

export interface NormalizedLegacyOrder extends Omit<LegacyOrder, "orderType" | "status" | "sourceType" | "documents"> {
  orderType: CanonicalLegacyOrderType;
  status: CanonicalLegacyOrderStatus;
  sourceType: CreationSourceType;
  documents: LegacyOrderDocuments;
  normalizationMeta: NormalizationMeta;
}

export interface ProjectRecord {
  id: Id;
  organizationId: string;
  projectNumber: string;
  executionMode: ExecutionMode;
  entryModule: "ekspedijavimas" | "nuosavas_transportas";
  registryStatus: "draft" | "planned" | "active" | "completed" | "cancelled";
  clientOrderNumber?: string;
  internalOrderNumber?: string;
  clientName?: string;
  resolvedClientId?: string;
  clientBindingScope?: "shared" | "project_only";
  carrierName?: string;
  resolvedCarrierId?: string;
  carrierBindingScope?: "shared" | "project_only";
  routeText: string;
  loadingDate?: string;
  unloadingDate?: string;
  latestCmrStatus: "missing" | "uploaded";
  latestPodStatus: "missing" | "uploaded";
  latestClientInvoiceStatus: "pending" | "issued" | "not_required";
  latestCarrierInvoiceStatus: "pending" | "not_required";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ExecutionRecord {
  id: Id;
  organizationId: string;
  executionNumber: string;
  projectId: Id;
  mode: ExecutionMode;
  status: "draft" | "prepared" | "dispatched" | "in_transit" | "completed" | "cancelled";
  clientName?: string;
  resolvedClientId?: string;
  carrierName?: string;
  resolvedCarrierId?: string;
  driverName?: string;
  truckPlate?: string;
  trailerPlate?: string;
  clientPrice?: number;
  carrierPrice?: number;
  instructions?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DocumentRulesRecord {
  id: Id;
  organizationId: string;
  projectId: Id;
  requiresOriginals: boolean;
  requiresCmr: boolean;
  requiresPod: boolean;
  requiresClientInvoice: boolean;
  requiresCarrierInvoice: boolean;
  invoiceRecipients: string[];
  cmrRecipients: string[];
  podRecipients: string[];
  specialDocumentConditions?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface FinanceStateRecord {
  id: Id;
  organizationId: string;
  projectId: Id;
  executionId: Id;
  currency: string;
  clientPriceNet?: number;
  carrierPriceNet?: number;
  internalCostNet?: number;
  profitNet?: number;
  marginPercent?: number;
  clientInvoiceStatus: "pending" | "issued" | "not_required";
  carrierInvoiceStatus: "pending" | "not_required";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface AttachmentRecord {
  id: Id;
  organizationId: string;
  ownerType: "project";
  ownerId: Id;
  projectId: Id;
  executionId: Id;
  kind: "cmr" | "pod" | "invoice_client";
  fileName: string;
  publicUrl: string;
  documentStatus: "uploaded";
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProjectHistoryEventRecord {
  id: Id;
  organizationId: string;
  projectId: Id;
  executionId: Id;
  eventType: "project_created";
  actorType: "system";
  sourceModule: "ekspedijavimas" | "nuosavas_transportas";
  message: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProjectBundle {
  project: ProjectRecord;
  execution: ExecutionRecord;
  documentRules: DocumentRulesRecord;
  financeState: FinanceStateRecord;
  attachments: AttachmentRecord[];
  initialHistoryEvent: ProjectHistoryEventRecord;
  warnings: MigrationWarning[];
  unresolvedFields: UnresolvedField[];
}

export interface WarningSummaryItem {
  code: string;
  severity: MigrationWarning["severity"];
  count: number;
  fieldPaths: string[];
}

export interface UnresolvedSummaryItem {
  fieldPath: string;
  count: number;
  reasons: string[];
  suggestedActions: string[];
}

export interface LegacyMigrationSkippedItem {
  index: number;
  legacyOrderId?: string | number;
  legacyOrderNumber?: string;
  reason: string;
  warnings: MigrationWarning[];
  unresolvedFields: UnresolvedField[];
}

export interface LegacyMigrationResult {
  bundles: ProjectBundle[];
  warnings: MigrationWarning[];
  warningSummary: WarningSummaryItem[];
  unresolvedFields: UnresolvedField[];
  unresolvedSummary: UnresolvedSummaryItem[];
  skippedItems: LegacyMigrationSkippedItem[];
  normalizedCount: number;
  migratedCount: number;
  skippedCount: number;
}

export interface MigrationReport {
  totalOrders: number;
  normalizedCount: number;
  migratedCount: number;
  unresolvedCount: number;
  skippedCount: number;
  warningsCount: number;
  warningBreakdown: WarningSummaryItem[];
  unresolvedBreakdown: UnresolvedSummaryItem[];
  skippedBreakdown: Array<{ reason: string; count: number }>;
  executionModeBreakdown: Array<{ executionMode: ExecutionMode; count: number }>;
  legacyStatusBreakdown: Array<{ legacyStatus: string; canonicalStatus: CanonicalLegacyOrderStatus; count: number }>;
}

export interface SerializedStoragePreview {
  projects: ProjectRecord[];
  executions: ExecutionRecord[];
  documentRules: DocumentRulesRecord[];
  financeStates: FinanceStateRecord[];
  projectHistoryEvents: ProjectHistoryEventRecord[];
  driverTasks: unknown[];
  attachments: AttachmentRecord[];
}

export interface DryRunMigrationResult {
  report: MigrationReport;
  storagePreview: SerializedStoragePreview;
  unresolvedItems: UnresolvedField[];
  skippedItems: LegacyMigrationSkippedItem[];
  warnings: MigrationWarning[];
  bundles: ProjectBundle[];
}

interface PartyBindingResolution {
  scope: "shared" | "project_only";
  resolvedId?: string;
  matchedName?: string;
  matchedBy?: "id" | "companyCode" | "vatCode" | "email" | "name";
  unresolved?: UnresolvedField;
}

function nowIso(context?: MigrationContext): ISODateTime {
  return (context?.now ?? (() => new Date().toISOString()))();
}

function createIdFactory(context?: MigrationContext): () => Id {
  if (context?.idFactory) return context.idFactory;
  return () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `mig_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  };
}

function normalizeWhitespace(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value
    .replace(/^"+|"+$/g, "")
    .replace(/^'+|'+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || undefined;
}

function pickFirstNonEmpty(...values: unknown[]): string | undefined {
  for (const value of values) {
    const normalized = normalizeWhitespace(value);
    if (normalized) return normalized;
  }
  return undefined;
}

function normalizeComparable(value: unknown): string | undefined {
  const normalized = normalizeWhitespace(value)
    ?.normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”„"']/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return normalized || undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  const text = normalizeWhitespace(value)?.toLowerCase();
  if (!text) return fallback;
  if (["true", "1", "yes", "required", "taip"].includes(text)) return true;
  if (["false", "0", "no", "not_required", "ne"].includes(text)) return false;
  return fallback;
}

function hasUnresolvedField(unresolvedFields: UnresolvedField[], fieldPath: string): boolean {
  return unresolvedFields.some((item) => item.fieldPath === fieldPath);
}

function normalizeLegacyOrderType(value: unknown): { value: CanonicalLegacyOrderType; usedFallback: boolean; originalValue?: string } {
  const raw = normalizeWhitespace(value)?.toLowerCase();
  switch (raw) {
    case "own_transport":
    case "own_fleet":
    case "fleet":
    case "nuosavas":
    case "nuosavas transportas":
      return { value: "own_transport", usedFallback: false, originalValue: raw };
    case "resale_to_carrier":
    case "carrier":
    case "expedition":
    case "ekspedijavimas":
    case "subrangovas":
      return { value: "resale_to_carrier", usedFallback: false, originalValue: raw };
    default:
      return { value: "resale_to_carrier", usedFallback: true, originalValue: raw };
  }
}

function normalizeLegacyStatus(value: unknown): { value: CanonicalLegacyOrderStatus; usedFallback: boolean; originalValue?: string } {
  const raw = normalizeWhitespace(value)?.toLowerCase();
  switch (raw) {
    case "draft":
    case "juodraštis":
    case "juodrastis":
      return { value: "draft", usedFallback: false, originalValue: raw };
    case "new":
    case "naujas":
    case "planned":
      return { value: "new", usedFallback: false, originalValue: raw };
    case "generated":
    case "paruoštas":
    case "paruostas":
      return { value: "generated", usedFallback: false, originalValue: raw };
    case "active":
    case "aktyvus":
      return { value: "active", usedFallback: false, originalValue: raw };
    case "in_transit":
    case "vykdomas":
    case "vezama":
    case "vežama":
      return { value: "in_transit", usedFallback: false, originalValue: raw };
    case "completed":
    case "baigtas":
    case "užbaigtas":
    case "uzbaigtas":
      return { value: "completed", usedFallback: false, originalValue: raw };
    case "cancelled":
    case "atšauktas":
    case "atsauktas":
      return { value: "cancelled", usedFallback: false, originalValue: raw };
    default:
      return { value: "new", usedFallback: true, originalValue: raw };
  }
}

function legacyOrderTypeToExecutionMode(orderType: CanonicalLegacyOrderType): ExecutionMode {
  return orderType === "own_transport" ? "own_fleet" : "expedition";
}

function canonicalToProjectStatus(status: CanonicalLegacyOrderStatus): ProjectRecord["registryStatus"] {
  switch (status) {
    case "draft":
      return "draft";
    case "active":
    case "in_transit":
      return "active";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "planned";
  }
}

function canonicalToExecutionStatus(status: CanonicalLegacyOrderStatus): ExecutionRecord["status"] {
  switch (status) {
    case "draft":
      return "draft";
    case "generated":
      return "prepared";
    case "active":
      return "dispatched";
    case "in_transit":
      return "in_transit";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return "prepared";
  }
}

function computeProfit(clientPrice?: number, cost?: number): number | undefined {
  if (clientPrice === undefined || cost === undefined) return undefined;
  return clientPrice - cost;
}

function computeMargin(profit?: number, cost?: number): number | undefined {
  if (profit === undefined || cost === undefined || cost <= 0) return undefined;
  return (profit / cost) * 100;
}

function aggregateWarnings(warnings: MigrationWarning[]): WarningSummaryItem[] {
  const summary = new Map<string, WarningSummaryItem>();
  for (const warning of warnings) {
    const key = `${warning.code}::${warning.severity}`;
    const existing = summary.get(key);
    if (existing) {
      existing.count += 1;
      if (warning.fieldPath && !existing.fieldPaths.includes(warning.fieldPath)) {
        existing.fieldPaths.push(warning.fieldPath);
      }
      continue;
    }
    summary.set(key, {
      code: warning.code,
      severity: warning.severity,
      count: 1,
      fieldPaths: warning.fieldPath ? [warning.fieldPath] : [],
    });
  }
  return [...summary.values()].sort((a, b) => b.count - a.count);
}

function aggregateUnresolved(unresolvedFields: UnresolvedField[]): UnresolvedSummaryItem[] {
  const summary = new Map<string, UnresolvedSummaryItem>();
  for (const item of unresolvedFields) {
    const existing = summary.get(item.fieldPath);
    if (existing) {
      existing.count += 1;
      if (!existing.reasons.includes(item.reason)) existing.reasons.push(item.reason);
      if (item.suggestedAction && !existing.suggestedActions.includes(item.suggestedAction)) {
        existing.suggestedActions.push(item.suggestedAction);
      }
      continue;
    }
    summary.set(item.fieldPath, {
      fieldPath: item.fieldPath,
      count: 1,
      reasons: [item.reason],
      suggestedActions: item.suggestedAction ? [item.suggestedAction] : [],
    });
  }
  return [...summary.values()].sort((a, b) => b.count - a.count);
}

function hasMeaningfulSeed(order: NormalizedLegacyOrder): boolean {
  return Boolean(
    order.clientName ||
      order.route ||
      order.orderNumber ||
      order.clientOrderNumber ||
      order.loadingCity ||
      order.unloadingCity ||
      order.cargo ||
      order.cargoType
  );
}

function buildRouteEndpointLabel(city?: string, companyName?: string): string | undefined {
  return pickFirstNonEmpty(city, companyName);
}

function buildRouteFallback(order: Pick<LegacyOrder, "loadingCity" | "loadingCompanyName" | "unloadingCity" | "unloadingCompanyName">): string | undefined {
  const loading = buildRouteEndpointLabel(order.loadingCity, order.loadingCompanyName);
  const unloading = buildRouteEndpointLabel(order.unloadingCity, order.unloadingCompanyName);

  if (loading && unloading) return `${loading} -> ${unloading}`;
  if (loading) return `${loading} -> Unknown destination`;
  if (unloading) return `Unknown origin -> ${unloading}`;

  return undefined;
}

function resolveSharedParty(
  kind: "client" | "carrier",
  legacy: NormalizedLegacyOrder,
  sharedRecords: SharedPartyRecord[] | undefined
): PartyBindingResolution {
  const name = kind === "client" ? legacy.clientName : legacy.carrierName;
  const id = kind === "client" ? legacy.clientId : legacy.carrierId;
  const companyCode = kind === "client" ? legacy.clientCompanyCode : legacy.carrierCompanyCode;
  const vatCode = kind === "client" ? legacy.clientVatCode : legacy.carrierVAT;
  const email = kind === "client" ? legacy.clientEmail : legacy.carrierEmail;

  if (!name) {
    return {
      scope: "project_only",
    };
  }

  if (!Array.isArray(sharedRecords) || sharedRecords.length === 0) {
    return {
      scope: "project_only",
    };
  }

  const exactIdMatches = id
    ? sharedRecords.filter((record) => normalizeComparable(record.id) === normalizeComparable(id))
    : [];
  if (exactIdMatches.length === 1) {
    return {
      scope: "shared",
      resolvedId: String(exactIdMatches[0].id),
      matchedName: pickFirstNonEmpty(exactIdMatches[0].name, name),
      matchedBy: "id",
    };
  }

  const matchBy = (
    matcher: "companyCode" | "vatCode" | "email" | "name",
    leftValue: string | undefined,
    selector: (record: SharedPartyRecord) => unknown
  ): SharedPartyRecord[] => {
    if (!leftValue) return [];
    const comparable = normalizeComparable(leftValue);
    if (!comparable) return [];
    return sharedRecords.filter((record) => normalizeComparable(selector(record)) === comparable);
  };

  const prioritizedMatches: Array<{
    matchedBy: "companyCode" | "vatCode" | "email" | "name";
    matches: SharedPartyRecord[];
  }> = [
    { matchedBy: "companyCode", matches: matchBy("companyCode", companyCode, (record) => record.companyCode) },
    { matchedBy: "vatCode", matches: matchBy("vatCode", vatCode, (record) => record.vatCode) },
    { matchedBy: "email", matches: matchBy("email", email, (record) => record.email) },
    { matchedBy: "name", matches: matchBy("name", name, (record) => record.name) },
  ];

  for (const candidate of prioritizedMatches) {
    if (candidate.matches.length === 1) {
      return {
        scope: "shared",
        resolvedId: String(candidate.matches[0].id),
        matchedName: pickFirstNonEmpty(candidate.matches[0].name, name),
        matchedBy: candidate.matchedBy,
      };
    }

    if (candidate.matches.length > 1) {
      return {
        scope: "project_only",
        unresolved: {
          fieldPath: `${kind}Binding`,
          reason: `Multiple shared ${kind} records matched by ${candidate.matchedBy}.`,
          legacyValue: name,
          suggestedAction: `Review ${kind} manually and choose the correct shared record.`,
        },
      };
    }
  }

  return {
    scope: "project_only",
    unresolved: {
      fieldPath: `${kind}Binding`,
      reason: `No reliable shared ${kind} match found.`,
      legacyValue: {
        name,
        id,
        companyCode,
        vatCode,
        email,
      },
      suggestedAction: `Keep ${kind} as project-only or link it manually to a shared record.`,
    },
  };
}

export function normalizeLegacyOrder(
  input: LegacyOrder,
  defaultSourceType: CreationSourceType = "manual"
): {
  order: NormalizedLegacyOrder;
  warnings: MigrationWarning[];
  unresolvedFields: UnresolvedField[];
} {
  const warnings: MigrationWarning[] = [];
  const unresolvedFields: UnresolvedField[] = [];

  const orderType = normalizeLegacyOrderType(input.orderType);
  const status = normalizeLegacyStatus(input.status);

  if (orderType.usedFallback) {
    warnings.push({
      code: "normalize.orderType.fallback",
      message: `Unknown orderType "${String(input.orderType ?? "")}", defaulted to resale_to_carrier.`,
      severity: "warning",
      fieldPath: "orderType",
    });
    unresolvedFields.push({
      fieldPath: "orderType",
      reason: "Unknown legacy orderType.",
      legacyValue: input.orderType,
      suggestedAction: "Review whether this record should be expedition or own_fleet.",
    });
  }

  if (status.usedFallback) {
    warnings.push({
      code: "normalize.status.fallback",
      message: `Unknown status "${String(input.status ?? "")}", defaulted to new.`,
      severity: "info",
      fieldPath: "status",
    });
  }

  const normalized: NormalizedLegacyOrder = {
    ...input,
    orderType: orderType.value,
    status: status.value,
    sourceType: input.sourceType ?? defaultSourceType,
    documents: {
      cmr: normalizeWhitespace(input.documents?.cmr),
      pod: normalizeWhitespace(input.documents?.pod),
      invoice: normalizeWhitespace(input.documents?.invoice),
    },
    orderNumber: normalizeWhitespace(input.orderNumber),
    clientOrderNumber: normalizeWhitespace(input.clientOrderNumber),
    clientId: normalizeWhitespace(input.clientId),
    client: normalizeWhitespace(input.client),
    clientName: pickFirstNonEmpty(input.clientName, input.client),
    clientCompanyCode: normalizeWhitespace(input.clientCompanyCode),
    clientVatCode: normalizeWhitespace(input.clientVatCode),
    clientPhone: normalizeWhitespace(input.clientPhone),
    clientEmail: normalizeWhitespace(input.clientEmail),
    clientAddress: normalizeWhitespace(input.clientAddress),
    carrierId: normalizeWhitespace(input.carrierId),
    carrier: normalizeWhitespace(input.carrier),
    carrierName: pickFirstNonEmpty(input.carrierName, input.carrier),
    carrierType: normalizeWhitespace(input.carrierType),
    carrierCompanyCode: normalizeWhitespace(input.carrierCompanyCode),
    carrierVAT: normalizeWhitespace(input.carrierVAT),
    carrierPhone: normalizeWhitespace(input.carrierPhone),
    carrierEmail: normalizeWhitespace(input.carrierEmail),
    carrierAddress: normalizeWhitespace(input.carrierAddress),
    contactName: normalizeWhitespace(input.contactName),
    contactPhone: normalizeWhitespace(input.contactPhone),
    contactEmail: normalizeWhitespace(input.contactEmail),
    clientPrice: normalizeNumber(input.clientPrice),
    carrierPrice: normalizeNumber(input.carrierPrice),
    carrierPriceWithVAT: normalizeBoolean(input.carrierPriceWithVAT ?? input.carrierPriceWithVat, false),
    paymentTerm: normalizeWhitespace(input.paymentTerm),
    cargoType: normalizeWhitespace(input.cargoType),
    cargo: normalizeWhitespace(input.cargo),
    vehicleCount: normalizeNumber(input.vehicleCount) ?? normalizeWhitespace(input.vehicleCount),
    vinNumbers: normalizeWhitespace(input.vinNumbers),
    route: normalizeWhitespace(input.route)?.replace(/[→]|ā†’/g, "->"),
    loadingCompanyName: normalizeWhitespace(input.loadingCompanyName),
    loadingCity: normalizeWhitespace(input.loadingCity),
    loadingStreet: normalizeWhitespace(input.loadingStreet),
    loadingPostalCode: normalizeWhitespace(input.loadingPostalCode),
    unloadingCompanyName: normalizeWhitespace(input.unloadingCompanyName),
    unloadingCity: normalizeWhitespace(input.unloadingCity),
    unloadingStreet: normalizeWhitespace(input.unloadingStreet),
    unloadingPostalCode: normalizeWhitespace(input.unloadingPostalCode),
    loadingDate: normalizeWhitespace(input.loadingDate),
    unloadingDate: normalizeWhitespace(input.unloadingDate),
    loadRefLoading: normalizeWhitespace(input.loadRefLoading),
    loadRefUnloading: normalizeWhitespace(input.loadRefUnloading),
    instructions: normalizeWhitespace(input.instructions),
    originalsRequired: normalizeBoolean(input.originalsRequired, false),
    notes: normalizeWhitespace(input.notes),
    sendToCarrier: normalizeBoolean(input.sendToCarrier, true),
    driverName: normalizeWhitespace(input.driverName),
    truckPlate: normalizeWhitespace(input.truckPlate)?.toUpperCase(),
    trailerPlate: normalizeWhitespace(input.trailerPlate)?.toUpperCase(),
    sourceAttachmentIds: Array.isArray(input.sourceAttachmentIds) ? input.sourceAttachmentIds.filter(Boolean).map(String) : undefined,
    sourceMessageId: normalizeWhitespace(input.sourceMessageId),
    sourceParseSessionId: normalizeWhitespace(input.sourceParseSessionId),
    sourceConfidence: normalizeNumber(input.sourceConfidence),
    createdAt: normalizeWhitespace(input.createdAt),
    updatedAt: normalizeWhitespace(input.updatedAt),
    normalizationMeta: {
      originalOrderType: orderType.originalValue,
      originalStatus: status.originalValue,
      usedOrderTypeFallback: orderType.usedFallback,
      usedStatusFallback: status.usedFallback,
    },
  };

  if (!normalized.clientName) {
    warnings.push({
      code: "normalize.client.empty",
      message: "clientName is empty after normalization.",
      severity: "warning",
      fieldPath: "clientName",
    });
    unresolvedFields.push({
      fieldPath: "clientName",
      reason: "Client name missing after normalization.",
      legacyValue: input.clientName,
      suggestedAction: "Resolve client from shared registry or keep as project-only after review.",
    });
  }

  if (normalized.orderType === "resale_to_carrier" && !normalized.carrierName) {
    warnings.push({
      code: "normalize.carrier.empty",
      message: "carrierName is empty for expedition-like record.",
      severity: "warning",
      fieldPath: "carrierName",
    });
    unresolvedFields.push({
      fieldPath: "carrierName",
      reason: "Carrier name missing for expedition execution.",
      legacyValue: input.carrierName,
      suggestedAction: "Assign carrier manually or create project-only carrier binding.",
    });
  }

  if (!normalized.route && !buildRouteFallback(normalized)) {
    warnings.push({
      code: "normalize.route.empty",
      message: "No route or fallback loading/unloading labels present.",
      severity: "warning",
      fieldPath: "route",
    });
    unresolvedFields.push({
      fieldPath: "route",
      reason: "Route is empty and cannot be reconstructed from loading/unloading data.",
      legacyValue: input.route,
      suggestedAction: "Review route manually before or after migration.",
    });
  }

  return { order: normalized, warnings, unresolvedFields };
}

export function mapLegacyOrderToProjectBundle(
  legacy: NormalizedLegacyOrder,
  context: MigrationContext
): ProjectBundle {
  const warnings: MigrationWarning[] = [];
  const unresolvedFields: UnresolvedField[] = [];
  const idFactory = createIdFactory(context);
  const timestamp = nowIso(context);
  const organizationId = context.organizationId;
  const executionMode = legacyOrderTypeToExecutionMode(legacy.orderType);
  const currency = context.defaultCurrency ?? "EUR";
  const costBase = executionMode === "expedition" ? legacy.carrierPrice : undefined;
  const profitNet = computeProfit(legacy.clientPrice, costBase);
  const marginPercent = computeMargin(profitNet, costBase);
  const clientBinding = resolveSharedParty("client", legacy, context.sharedClients);
  const carrierBinding = resolveSharedParty("carrier", legacy, context.sharedCarriers);
  const routeText = legacy.route ?? buildRouteFallback(legacy) ?? "Unknown route";

  if (clientBinding.unresolved && !hasUnresolvedField(unresolvedFields, clientBinding.unresolved.fieldPath)) {
    unresolvedFields.push(clientBinding.unresolved);
  }

  if (executionMode === "expedition" && carrierBinding.unresolved && !hasUnresolvedField(unresolvedFields, carrierBinding.unresolved.fieldPath)) {
    unresolvedFields.push(carrierBinding.unresolved);
  }

  const projectId = idFactory();
  const executionId = idFactory();
  const documentRulesId = idFactory();
  const financeStateId = idFactory();

  const project: ProjectRecord = {
    id: projectId,
    organizationId,
    projectNumber: legacy.orderNumber ?? `PRJ-${Date.now()}`,
    executionMode,
    entryModule: executionMode === "own_fleet" ? "nuosavas_transportas" : "ekspedijavimas",
    registryStatus: canonicalToProjectStatus(legacy.status),
    clientOrderNumber: legacy.clientOrderNumber,
    internalOrderNumber: legacy.orderNumber,
    clientName: clientBinding.matchedName ?? legacy.clientName,
    resolvedClientId: clientBinding.resolvedId,
    clientBindingScope: clientBinding.scope,
    carrierName: carrierBinding.matchedName ?? legacy.carrierName,
    resolvedCarrierId: carrierBinding.resolvedId,
    carrierBindingScope: carrierBinding.scope,
    routeText,
    loadingDate: legacy.loadingDate,
    unloadingDate: legacy.unloadingDate,
    latestCmrStatus: legacy.documents.cmr ? "uploaded" : "missing",
    latestPodStatus: legacy.documents.pod ? "uploaded" : "missing",
    latestClientInvoiceStatus: legacy.documents.invoice ? "issued" : "pending",
    latestCarrierInvoiceStatus: executionMode === "expedition" ? "pending" : "not_required",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const execution: ExecutionRecord = {
    id: executionId,
    organizationId,
    executionNumber: legacy.orderNumber ?? `EXE-${Date.now()}`,
    projectId,
    mode: executionMode,
    status: canonicalToExecutionStatus(legacy.status),
    clientName: clientBinding.matchedName ?? legacy.clientName,
    resolvedClientId: clientBinding.resolvedId,
    carrierName: carrierBinding.matchedName ?? legacy.carrierName,
    resolvedCarrierId: carrierBinding.resolvedId,
    driverName: legacy.driverName,
    truckPlate: legacy.truckPlate,
    trailerPlate: legacy.trailerPlate,
    clientPrice: legacy.clientPrice,
    carrierPrice: legacy.carrierPrice,
    instructions: legacy.instructions,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const documentRules: DocumentRulesRecord = {
    id: documentRulesId,
    organizationId,
    projectId,
    requiresOriginals: normalizeBoolean(legacy.originalsRequired, false),
    requiresCmr: true,
    requiresPod: true,
    requiresClientInvoice: true,
    requiresCarrierInvoice: executionMode === "expedition",
    invoiceRecipients: legacy.clientEmail ? [legacy.clientEmail] : [],
    cmrRecipients: legacy.clientEmail ? [legacy.clientEmail] : [],
    podRecipients: legacy.clientEmail ? [legacy.clientEmail] : [],
    specialDocumentConditions: legacy.notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const financeState: FinanceStateRecord = {
    id: financeStateId,
    organizationId,
    projectId,
    executionId,
    currency,
    clientPriceNet: legacy.clientPrice,
    carrierPriceNet: legacy.carrierPrice,
    internalCostNet: undefined,
    profitNet,
    marginPercent,
    clientInvoiceStatus: legacy.clientPrice !== undefined ? "pending" : "not_required",
    carrierInvoiceStatus: executionMode === "expedition" ? "pending" : "not_required",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const attachments: AttachmentRecord[] = [
    legacy.documents.cmr
      ? {
          id: idFactory(),
          organizationId,
          ownerType: "project",
          ownerId: projectId,
          projectId,
          executionId,
          kind: "cmr",
          fileName: "legacy-cmr",
          publicUrl: legacy.documents.cmr,
          documentStatus: "uploaded",
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      : null,
    legacy.documents.pod
      ? {
          id: idFactory(),
          organizationId,
          ownerType: "project",
          ownerId: projectId,
          projectId,
          executionId,
          kind: "pod",
          fileName: "legacy-pod",
          publicUrl: legacy.documents.pod,
          documentStatus: "uploaded",
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      : null,
    legacy.documents.invoice
      ? {
          id: idFactory(),
          organizationId,
          ownerType: "project",
          ownerId: projectId,
          projectId,
          executionId,
          kind: "invoice_client",
          fileName: "legacy-client-invoice",
          publicUrl: legacy.documents.invoice,
          documentStatus: "uploaded",
          createdAt: timestamp,
          updatedAt: timestamp,
        }
      : null,
  ].filter(Boolean) as AttachmentRecord[];

  const initialHistoryEvent: ProjectHistoryEventRecord = {
    id: idFactory(),
    organizationId,
    projectId,
    executionId,
    eventType: "project_created",
    actorType: "system",
    sourceModule: executionMode === "own_fleet" ? "nuosavas_transportas" : "ekspedijavimas",
    message: "Project bundle created from legacy order dry-run migration.",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (executionMode === "own_fleet" && !legacy.driverName) {
    warnings.push({
      code: "map.driverName.missing",
      message: "Own fleet execution has no driverName.",
      severity: "info",
      fieldPath: "driverName",
    });
  }

  return {
    project,
    execution,
    documentRules,
    financeState,
    attachments,
    initialHistoryEvent,
    warnings,
    unresolvedFields,
  };
}

export function mapLegacyOrdersArrayToBundles(
  legacyOrders: LegacyOrder[],
  context: MigrationContext
): LegacyMigrationResult {
  const bundles: ProjectBundle[] = [];
  const warnings: MigrationWarning[] = [];
  const unresolvedFields: UnresolvedField[] = [];
  const skippedItems: LegacyMigrationSkippedItem[] = [];
  let normalizedCount = 0;

  legacyOrders.forEach((legacy, index) => {
    try {
      const normalized = normalizeLegacyOrder(legacy, context.defaultSourceType ?? "manual");
      normalizedCount += 1;
      warnings.push(...normalized.warnings);
      unresolvedFields.push(...normalized.unresolvedFields);

      if (!hasMeaningfulSeed(normalized.order)) {
        skippedItems.push({
          index,
          legacyOrderId: legacy.id,
          legacyOrderNumber: normalizeWhitespace(legacy.orderNumber),
          reason: "Record has no meaningful project seed fields.",
          warnings: normalized.warnings,
          unresolvedFields: normalized.unresolvedFields,
        });
        return;
      }

      const bundle = mapLegacyOrderToProjectBundle(normalized.order, context);
      bundles.push(bundle);
      warnings.push(...bundle.warnings);
      unresolvedFields.push(...bundle.unresolvedFields);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown migration error";
      const fatalWarning: MigrationWarning = {
        code: "migration.bundle.failed",
        message,
        severity: "error",
      };
      const fatalUnresolved: UnresolvedField = {
        fieldPath: "bundle",
        reason: "Bundle mapping threw an exception.",
        legacyValue: legacy.id ?? legacy.orderNumber,
        suggestedAction: "Inspect this record manually and retry migration.",
      };
      warnings.push(fatalWarning);
      unresolvedFields.push(fatalUnresolved);
      skippedItems.push({
        index,
        legacyOrderId: legacy.id,
        legacyOrderNumber: normalizeWhitespace(legacy.orderNumber),
        reason: "Bundle mapping failed with exception.",
        warnings: [fatalWarning],
        unresolvedFields: [fatalUnresolved],
      });
    }
  });

  return {
    bundles,
    warnings,
    warningSummary: aggregateWarnings(warnings),
    unresolvedFields,
    unresolvedSummary: aggregateUnresolved(unresolvedFields),
    skippedItems,
    normalizedCount,
    migratedCount: bundles.length,
    skippedCount: skippedItems.length,
  };
}

export function buildMigrationReport(
  migrationResult: LegacyMigrationResult,
  legacyOrders: LegacyOrder[]
): MigrationReport {
  const skippedBreakdownMap = new Map<string, number>();
  migrationResult.skippedItems.forEach((item) => {
    skippedBreakdownMap.set(item.reason, (skippedBreakdownMap.get(item.reason) ?? 0) + 1);
  });

  const executionModeMap = new Map<ExecutionMode, number>();
  migrationResult.bundles.forEach((bundle) => {
    executionModeMap.set(bundle.project.executionMode, (executionModeMap.get(bundle.project.executionMode) ?? 0) + 1);
  });

  const statusMap = new Map<string, { legacyStatus: string; canonicalStatus: CanonicalLegacyOrderStatus; count: number }>();
  legacyOrders.forEach((legacy) => {
    const legacyStatus = normalizeWhitespace(legacy.status) ?? "undefined";
    const canonicalStatus = normalizeLegacyStatus(legacy.status).value;
    const key = `${legacyStatus}::${canonicalStatus}`;
    const existing = statusMap.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }
    statusMap.set(key, { legacyStatus, canonicalStatus, count: 1 });
  });

  return {
    totalOrders: legacyOrders.length,
    normalizedCount: migrationResult.normalizedCount,
    migratedCount: migrationResult.migratedCount,
    unresolvedCount: migrationResult.unresolvedFields.length,
    skippedCount: migrationResult.skippedCount,
    warningsCount: migrationResult.warnings.length,
    warningBreakdown: migrationResult.warningSummary,
    unresolvedBreakdown: migrationResult.unresolvedSummary,
    skippedBreakdown: [...skippedBreakdownMap.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count),
    executionModeBreakdown: [...executionModeMap.entries()]
      .map(([executionMode, count]) => ({ executionMode, count }))
      .sort((a, b) => b.count - a.count),
    legacyStatusBreakdown: [...statusMap.values()].sort((a, b) => b.count - a.count),
  };
}

export function serializeBundlesForStorage(bundles: ProjectBundle[]): SerializedStoragePreview {
  return {
    projects: bundles.map((bundle) => bundle.project),
    executions: bundles.map((bundle) => bundle.execution),
    documentRules: bundles.map((bundle) => bundle.documentRules),
    financeStates: bundles.map((bundle) => bundle.financeState),
    projectHistoryEvents: bundles.map((bundle) => bundle.initialHistoryEvent),
    driverTasks: [],
    attachments: bundles.flatMap((bundle) => bundle.attachments),
  };
}

export function runLegacyOrdersMigrationDryRun(
  legacyOrders: LegacyOrder[],
  context: MigrationContext
): DryRunMigrationResult {
  const migrationResult = mapLegacyOrdersArrayToBundles(legacyOrders, context);
  const report = buildMigrationReport(migrationResult, legacyOrders);
  const storagePreview = serializeBundlesForStorage(migrationResult.bundles);

  return {
    report,
    storagePreview,
    unresolvedItems: migrationResult.unresolvedFields,
    skippedItems: migrationResult.skippedItems,
    warnings: migrationResult.warnings,
    bundles: migrationResult.bundles,
  };
}
