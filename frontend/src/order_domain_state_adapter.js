export const FUTURE_DOMAIN_BUCKET_KEYS = Object.freeze([
  "projects",
  "executions",
  "documentRules",
  "financeStates",
  "attachments",
  "projectHistoryEvents",
]);

export const createEmptyFutureDomainBuckets = () => ({
  projects: [],
  executions: [],
  documentRules: [],
  financeStates: [],
  attachments: [],
  projectHistoryEvents: [],
});

export const normalizeFutureDomainBuckets = (buckets = {}) => ({
  projects: Array.isArray(buckets.projects) ? buckets.projects : [],
  executions: Array.isArray(buckets.executions) ? buckets.executions : [],
  documentRules: Array.isArray(buckets.documentRules) ? buckets.documentRules : [],
  financeStates: Array.isArray(buckets.financeStates) ? buckets.financeStates : [],
  attachments: Array.isArray(buckets.attachments) ? buckets.attachments : [],
  projectHistoryEvents: Array.isArray(buckets.projectHistoryEvents) ? buckets.projectHistoryEvents : [],
});

const mergeBucketById = (existingItems = [], nextItems = []) => {
  const map = new Map();

  existingItems.forEach((item) => {
    if (item?.id !== undefined && item?.id !== null) {
      map.set(String(item.id), item);
    }
  });

  nextItems.forEach((item) => {
    if (item?.id !== undefined && item?.id !== null) {
      map.set(String(item.id), item);
    }
  });

  return [...map.values()];
};

export const buildFutureDomainStatePatch = ({
  currentBuckets = {},
  futureDomainPayload = {},
} = {}) => {
  const normalizedCurrent = normalizeFutureDomainBuckets(currentBuckets);
  const normalizedIncoming = normalizeFutureDomainBuckets(futureDomainPayload);

  return {
    projects: mergeBucketById(normalizedCurrent.projects, normalizedIncoming.projects),
    executions: mergeBucketById(normalizedCurrent.executions, normalizedIncoming.executions),
    documentRules: mergeBucketById(normalizedCurrent.documentRules, normalizedIncoming.documentRules),
    financeStates: mergeBucketById(normalizedCurrent.financeStates, normalizedIncoming.financeStates),
    attachments: mergeBucketById(normalizedCurrent.attachments, normalizedIncoming.attachments),
    projectHistoryEvents: mergeBucketById(normalizedCurrent.projectHistoryEvents, normalizedIncoming.projectHistoryEvents),
  };
};

export const summarizeFutureDomainBuckets = (buckets = {}) => {
  const normalized = normalizeFutureDomainBuckets(buckets);

  return {
    projects: normalized.projects.length,
    executions: normalized.executions.length,
    documentRules: normalized.documentRules.length,
    financeStates: normalized.financeStates.length,
    attachments: normalized.attachments.length,
    projectHistoryEvents: normalized.projectHistoryEvents.length,
  };
};
