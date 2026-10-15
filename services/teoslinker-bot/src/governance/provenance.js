function buildProvenance(provenance, finalVerdict, conf, cons, downgraded) {
  if (!provenance || provenance.length === 0) {
    return {
      decisiveEngine: null,
      decisiveRule: null,
      signalWeights: {},
      decisionType: "no_data",
    };
  }

  const strictest = provenance.reduce((a, b) => {
    const order = { BLOCK: 3, WARN: 2, ALLOW: 1, ERROR: 0 };
    const aOrd = order[a.verdict] || 0;
    const bOrd = order[b.verdict] || 0;
    if (aOrd !== bOrd) return aOrd > bOrd ? a : b;
    return (a.score || 0) >= (b.score || 0) ? a : b;
  });

  const totalScore = provenance.reduce((s, p) => s + (p.score || 0), 0) || 1;
  const signalWeights = {};
  for (const p of provenance) {
    signalWeights[p.source] = Math.round(((p.score || 0) / totalScore) * 100) / 100;
  }

  let decisiveRule = null;
  for (const p of provenance) {
    if (p.reasons && p.reasons.length > 0) {
      decisiveRule = p.reasons[0];
      break;
    }
  }

  let decisionType = "strictest";
  if (downgraded) decisionType = "downgraded";
  else if (cons === "unanimous") decisionType = "consensus";
  else if (cons === "single_source") decisionType = "heuristic";
  else if (cons === "split" && !downgraded) decisionType = "strictest";

  return {
    decisiveEngine: strictest.source,
    decisiveRule,
    signalWeights,
    decisionType,
  };
}

module.exports = { buildProvenance };
