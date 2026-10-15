function scoreBar(s) {
  const f = Math.round(s / 10);
  return '\u2501'.repeat(f) + '\u2500'.repeat(10 - f);
}

function getTier(credits, plan) {
  if (plan === "founder" || plan === "enterprise") return { icon: "\u{1F6E1}\uFE0F", name: plan === "founder" ? "Founder" : "Enterprise" };
  if (plan === "tester" || plan === "beta_tester")   return { icon: "\u{1F9F1}", name: plan === "beta_tester" ? "Beta Tester" : "Alpha Tester" };
  if (plan === "team" || credits >= 10000)          return { icon: "\u{1F9FF}", name: "Team" };
  if (plan === "pro" || plan === "starter" || credits >= 1000)            return { icon: "\u{1F7E2}", name: "Pro" };
  return { icon: "\u26AA", name: "Standard" };
}

module.exports = { scoreBar, getTier };
