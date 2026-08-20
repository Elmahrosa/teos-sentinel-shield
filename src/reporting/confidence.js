const { RETRIEVAL_WEIGHTS } = require('./data-integrity');

const REQUIRED_DATA_SOURCES = [
  'holders',
  'liquidity',
  'metadata',
  'authorities',
  'dexData',
  'marketData',
];

function calculateDataConfidence(dataSources) {
  if (!dataSources || Object.keys(dataSources).length === 0) {
    return { percentage: 0, level: 'none', weightedScore: 0, missingSources: REQUIRED_DATA_SOURCES };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  const missingSources = [];

  for (const source of REQUIRED_DATA_SOURCES) {
    const field = dataSources[source];
    if (field && field.status) {
      const w = RETRIEVAL_WEIGHTS[field.status] ?? 0.1;
      weightedSum += w;
      totalWeight += 1;
      if (w < 0.5) {
        missingSources.push(source);
      }
    } else {
      totalWeight += 1;
      missingSources.push(source);
    }
  }

  const raw = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
  const percentage = Math.round(raw * 100);
  const level = percentage >= 80 ? 'high' : percentage >= 50 ? 'medium' : percentage >= 25 ? 'low' : 'none';

  return { percentage, level, weightedScore: raw, missingSources };
}

function getConfidenceBadge(level) {
  const map = {
    high: { label: 'High Confidence', color: '#22C55E' },
    medium: { label: 'Medium Confidence', color: '#EAB308' },
    low: { label: 'Low Confidence', color: '#F97316' },
    none: { label: 'No Confidence', color: '#EF4444' },
  };
  return map[level] || map.none;
}

module.exports = { calculateDataConfidence, getConfidenceBadge, REQUIRED_DATA_SOURCES };
