const WINDOW_SIZE = 50;
const DRIFT_THRESHOLDS = {
  falsePositiveRate: 0.15,
  overrideRate: 0.10,
  disagreementRate: 0.30,
  confidenceCollapse: 0.25,
  telemetryDropRate: 0.50,
};

const windows = {
  verdicts: [],
  telemetryDrops: [],
};

let emitFn = null;

function setEmit(fn) {
  emitFn = fn;
}

function pushVerdict(entry) {
  windows.verdicts.push({ ...entry, ts: Date.now() });
  if (windows.verdicts.length > WINDOW_SIZE * 2) {
    windows.verdicts = windows.verdicts.slice(-WINDOW_SIZE);
  }
}

function pushTelemetryDrop() {
  windows.telemetryDrops.push(Date.now());
  if (windows.telemetryDrops.length > WINDOW_SIZE) {
    windows.telemetryDrops = windows.telemetryDrops.slice(-WINDOW_SIZE);
  }
}

function rate(arr, field, value) {
  if (arr.length === 0) return 0;
  return arr.filter(e => e[field] === value).length / arr.length;
}

function detect() {
  if (!emitFn) return [];
  const alerts = [];
  const recentVerdicts = windows.verdicts.slice(-WINDOW_SIZE);
  if (recentVerdicts.length < 10) return alerts;

  const falsePositiveRate = rate(recentVerdicts, 'feedbackType', 'false_positive');
  if (falsePositiveRate > DRIFT_THRESHOLDS.falsePositiveRate) {
    alerts.push({ type: "drift", signal: "rising_false_positives", value: falsePositiveRate, threshold: DRIFT_THRESHOLDS.falsePositiveRate, detail: `False positive rate ${(falsePositiveRate * 100).toFixed(0)}% exceeds threshold` });
  }

  const overrideRate = rate(recentVerdicts, 'feedbackType', 'override');
  if (overrideRate > DRIFT_THRESHOLDS.overrideRate) {
    alerts.push({ type: "drift", signal: "rising_overrides", value: overrideRate, threshold: DRIFT_THRESHOLDS.overrideRate, detail: `Override rate ${(overrideRate * 100).toFixed(0)}% exceeds threshold` });
  }

  const disagreementRate = rate(recentVerdicts, 'consensus', 'split');
  if (disagreementRate > DRIFT_THRESHOLDS.disagreementRate) {
    alerts.push({ type: "drift", signal: "engine_disagreement_spike", value: disagreementRate, threshold: DRIFT_THRESHOLDS.disagreementRate, detail: `Disagreement rate ${(disagreementRate * 100).toFixed(0)}% exceeds threshold` });
  }

  const lowConfRate = rate(recentVerdicts, 'confidence', 'low') + rate(recentVerdicts, 'confidence', 'none');
  if (lowConfRate > DRIFT_THRESHOLDS.confidenceCollapse) {
    alerts.push({ type: "drift", signal: "confidence_collapse", value: lowConfRate, threshold: DRIFT_THRESHOLDS.confidenceCollapse, detail: `Low/no confidence rate ${(lowConfRate * 100).toFixed(0)}%` });
  }

  const telemetryDropRate = windows.telemetryDrops.length / Math.max(windows.verdicts.length, 1);
  if (telemetryDropRate > DRIFT_THRESHOLDS.telemetryDropRate) {
    alerts.push({ type: "drift", signal: "telemetry_anomaly", value: telemetryDropRate, threshold: DRIFT_THRESHOLDS.telemetryDropRate, detail: `Telemetry drop rate ${(telemetryDropRate * 100).toFixed(0)}%` });
  }

  for (const alert of alerts) {
    if (emitFn) emitFn("governance", { alert: alert.signal, value: alert.value, detail: alert.detail });
  }
  return alerts;
}

module.exports = { detect, pushVerdict, pushTelemetryDrop, setEmit, DRIFT_THRESHOLDS, WINDOW_SIZE };
