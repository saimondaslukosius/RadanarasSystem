import { buildFutureDomainStatePatch, createEmptyFutureDomainBuckets, summarizeFutureDomainBuckets } from "./order_domain_state_adapter";

export const ORDER_DRAFT_PERSIST_TARGETS = Object.freeze({
  LEGACY: "legacy",
  FUTURE_DOMAIN: "future_domain",
});

export const DEFAULT_ORDER_DRAFT_PERSIST_TARGET = ORDER_DRAFT_PERSIST_TARGETS.LEGACY;

export const buildOrderDraftPersistPlan = ({
  legacyPayload = null,
  futureBundle = null,
  target = DEFAULT_ORDER_DRAFT_PERSIST_TARGET,
} = {}) => {
  const normalizedTarget = Object.values(ORDER_DRAFT_PERSIST_TARGETS).includes(target)
    ? target
    : DEFAULT_ORDER_DRAFT_PERSIST_TARGET;

  return {
    target: normalizedTarget,
    legacyPayload,
    futureBundle,
    shouldPersistLegacy: normalizedTarget === ORDER_DRAFT_PERSIST_TARGETS.LEGACY,
    shouldPrepareFutureBundle: Boolean(futureBundle),
    isFutureDomainTarget: normalizedTarget === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN,
  };
};

export const serializeFutureBundleForPersistence = (futureBundle = null) => {
  if (!futureBundle) {
    return {
      projects: [],
      executions: [],
      documentRules: [],
      financeStates: [],
      attachments: [],
      projectHistoryEvents: [],
    };
  }

  return {
    projects: futureBundle.project ? [futureBundle.project] : [],
    executions: futureBundle.execution ? [futureBundle.execution] : [],
    documentRules: futureBundle.documentRules ? [futureBundle.documentRules] : [],
    financeStates: futureBundle.financeState ? [futureBundle.financeState] : [],
    attachments: Array.isArray(futureBundle.attachments) ? futureBundle.attachments : [],
    projectHistoryEvents: futureBundle.initialHistoryEvent ? [futureBundle.initialHistoryEvent] : [],
  };
};

export const persistFutureDomainDraftSkeleton = (futureDomainPayload = {}) => {
  const statePatch = buildFutureDomainStatePatch({
    currentBuckets: createEmptyFutureDomainBuckets(),
    futureDomainPayload,
  });

  return {
    preparedOnly: true,
    statePatch,
    summary: summarizeFutureDomainBuckets(statePatch),
  };
};

export const executeOrderDraftPersistPlan = ({
  persistPlan,
  persistLegacy,
  persistFutureDomain,
} = {}) => {
  if (!persistPlan) {
    throw new Error("Persist plan is required.");
  }

  if (persistPlan.target === ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN) {
    const futureDomainPayload = serializeFutureBundleForPersistence(persistPlan.futureBundle);

    if (typeof persistFutureDomain === "function") {
      return {
        mode: ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN,
        saved: persistFutureDomain(futureDomainPayload),
        futureBundle: persistPlan.futureBundle,
        futureDomainPayload,
      };
    }

    return {
      mode: ORDER_DRAFT_PERSIST_TARGETS.FUTURE_DOMAIN,
      saved: null,
      preparedOnly: true,
      futureBundle: persistPlan.futureBundle,
      futureDomainPayload,
    };
  }

  if (typeof persistLegacy !== "function") {
    throw new Error("Legacy persist handler is required for legacy target.");
  }

  return {
    mode: ORDER_DRAFT_PERSIST_TARGETS.LEGACY,
    saved: persistLegacy(persistPlan.legacyPayload),
    futureBundle: persistPlan.futureBundle,
    futureDomainPayload: null,
  };
};
