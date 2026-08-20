const RetrievalStatus = {
  VERIFIED: 'VERIFIED',
  NOT_FOUND: 'NOT_FOUND',
  API_UNAVAILABLE: 'API_UNAVAILABLE',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN: 'UNKNOWN',
};

const RETRIEVAL_WEIGHTS = {
  VERIFIED: 1.0,
  NOT_FOUND: 0.5,
  API_UNAVAILABLE: 0.3,
  RATE_LIMITED: 0.4,
  UNKNOWN: 0.1,
};

const RETRIEVAL_DESCRIPTIONS = {
  VERIFIED: 'Data confirmed from source',
  NOT_FOUND: 'No data found for this field',
  API_UNAVAILABLE: 'Source API was unavailable',
  RATE_LIMITED: 'Rate limited by data source',
  UNKNOWN: 'Retrieval status unknown',
};

function createDataField(value, source, status, timestamp) {
  return {
    value: value ?? null,
    source: source || 'unknown',
    timestamp: timestamp || new Date().toISOString(),
    status: status || RetrievalStatus.UNKNOWN,
    confidence: RETRIEVAL_WEIGHTS[status] ?? 0.1,
  };
}

function DataField(value, source, status, timestamp) {
  return createDataField(value, source, status, timestamp);
}

DataField.VERIFIED = (value, source) =>
  createDataField(value, source, RetrievalStatus.VERIFIED);
DataField.NOT_FOUND = (source) =>
  createDataField(null, source, RetrievalStatus.NOT_FOUND);
DataField.UNAVAILABLE = (source) =>
  createDataField(null, source, RetrievalStatus.API_UNAVAILABLE);

module.exports = {
  RetrievalStatus,
  RETRIEVAL_WEIGHTS,
  RETRIEVAL_DESCRIPTIONS,
  createDataField,
  DataField,
};
