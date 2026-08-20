const { RULES, runEngine } = require('../src/engine/scanner.js');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

const R34 = RULES.find(r => r.id === 'R34');
const R35 = RULES.find(r => r.id === 'R35');
const R36 = RULES.find(r => r.id === 'R36');
const R37 = RULES.find(r => r.id === 'R37');

const ALL_RULES_EXIST = R34 && R35 && R36 && R37;
assert(ALL_RULES_EXIST, 'R34-R37 must exist in Shield scanner rules');

console.log("\n═══ Linux Admin Operations — R34 ADMIN_ELEVATION ═══");

test("[POS] sudo pacman -Sy", () => {
  assert.strictEqual(R34.test('sudo pacman -Sy'), true);
});

test("[POS] sudo apt update", () => {
  assert.strictEqual(R34.test('sudo apt update'), true);
});

test("[POS] doas systemctl stop nginx", () => {
  assert.strictEqual(R34.test('doas systemctl stop nginx'), true);
});

test("[POS] pkexec mount /dev/sda1", () => {
  assert.strictEqual(R34.test('pkexec mount /dev/sda1 /mnt'), true);
});

test("[NEG] sudo ls /root (benign)", () => {
  assert.strictEqual(R34.test('sudo ls /root'), false);
});

test("[NEG] sudo echo hello (benign)", () => {
  assert.strictEqual(R34.test('sudo echo hello'), false);
});

console.log("\n═══ Linux Admin Operations — R35 PKG_MANAGER_REMOVE ═══");

test("[POS] pacman -R", () => {
  assert.strictEqual(R35.test('pacman -R firefox'), true);
});

test("[POS] pacman -Rcns --noconfirm", () => {
  assert.strictEqual(R35.test('sudo pacman -Rcns --noconfirm firefox'), true);
});

test("[POS] apt remove", () => {
  assert.strictEqual(R35.test('apt remove chromium-browser'), true);
});

test("[POS] apt purge", () => {
  assert.strictEqual(R35.test('apt purge mysql-server'), true);
});

test("[POS] dnf remove", () => {
  assert.strictEqual(R35.test('dnf remove docker-ce'), true);
});

test("[POS] yum erase", () => {
  assert.strictEqual(R35.test('yum erase httpd'), true);
});

test("[POS] apk del", () => {
  assert.strictEqual(R35.test('apk del openssh'), true);
});

test("[POS] zypper remove", () => {
  assert.strictEqual(R35.test('zypper remove mysql'), true);
});

test("[NEG] pacman -S (install, not remove)", () => {
  assert.strictEqual(R35.test('pacman -S firefox'), false);
});

test("[NEG] pacman -Qi (query, not remove)", () => {
  assert.strictEqual(R35.test('pacman -Qi firefox'), false);
});

test("[NEG] apt list (query)", () => {
  assert.strictEqual(R35.test('apt list --installed'), false);
});

console.log("\n═══ Linux Admin Operations — R36 FILESYSTEM_ADMIN ═══");

test("[POS] fdisk /dev/sda", () => {
  assert.strictEqual(R36.test('fdisk /dev/sda'), true);
});

test("[POS] mount /dev/sdb1", () => {
  assert.strictEqual(R36.test('mount /dev/sdb1 /mnt'), true);
});

test("[POS] umount /mnt", () => {
  assert.strictEqual(R36.test('umount /mnt'), true);
});

test("[POS] chmod 777", () => {
  assert.strictEqual(R36.test('chmod 777 /tmp/script.sh'), true);
});

test("[POS] chmod 666", () => {
  assert.strictEqual(R36.test('chmod 666 config.json'), true);
});

test("[POS] chown -R recursive", () => {
  assert.strictEqual(R36.test('chown -R www-data:www-data /var/www'), true);
});

test("[NEG] chmod 755 (benign)", () => {
  assert.strictEqual(R36.test('chmod 755 script.sh'), false);
});

test("[NEG] chown non-recursive", () => {
  assert.strictEqual(R36.test('chown root:root /opt/app/config.json'), false);
});

test("[NEG] fdisk -l (no device)", () => {
  assert.strictEqual(R36.test('fdisk -l'), false);
});

console.log("\n═══ Linux Admin Operations — R37 SERVICE_ADMIN ═══");

test("[POS] systemctl stop nginx", () => {
  assert.strictEqual(R37.test('systemctl stop nginx'), true);
});

test("[POS] systemctl disable httpd", () => {
  assert.strictEqual(R37.test('systemctl disable httpd'), true);
});

test("[POS] systemctl mask docker", () => {
  assert.strictEqual(R37.test('systemctl mask docker'), true);
});

test("[POS] systemctl kill postgresql", () => {
  assert.strictEqual(R37.test('systemctl kill postgresql'), true);
});

test("[POS] service nginx stop", () => {
  assert.strictEqual(R37.test('service nginx stop'), true);
});

test("[POS] iptables -F", () => {
  assert.strictEqual(R37.test('iptables -F'), true);
});

test("[POS] iptables --flush", () => {
  assert.strictEqual(R37.test('iptables --flush'), true);
});

test("[POS] ufw disable", () => {
  assert.strictEqual(R37.test('ufw disable'), true);
});

test("[POS] firewall-cmd --reload", () => {
  assert.strictEqual(R37.test('firewall-cmd --reload'), true);
});

test("[NEG] systemctl status nginx (query)", () => {
  assert.strictEqual(R37.test('systemctl status nginx'), false);
});

test("[NEG] systemctl restart nginx (not stop/disable)", () => {
  assert.strictEqual(R37.test('systemctl restart nginx'), false);
});

test("[NEG] iptables -L (list)", () => {
  assert.strictEqual(R37.test('iptables -L'), false);
});

console.log("\n═══ Integration — Verdicts are WARN (not BLOCK) ═══");

test("[VERDICT] sudo pacman -Sy → WARN (score 55)", () => {
  const result = runEngine('sudo pacman -Sy');
  assert.strictEqual(result.verdict, 'WARN');
  assert.ok(result.score <= 65, `Expected score <= 65, got ${result.score}`);
});

test("[VERDICT] pacman -Rcns → WARN (score 50)", () => {
  const result = runEngine('pacman -Rcns --noconfirm firefox');
  assert.strictEqual(result.verdict, 'WARN');
  assert.ok(result.score <= 65, `Expected score <= 65, got ${result.score}`);
});

test("[VERDICT] chmod 777 script → WARN (score 60)", () => {
  const result = runEngine('chmod 777 /tmp/script.sh');
  assert.strictEqual(result.verdict, 'WARN');
  assert.ok(result.score <= 65, `Expected score <= 65, got ${result.score}`);
});

test("[VERDICT] Benign commands → ALLOW (score 0)", () => {
  const benign = ['ls -la', 'pwd', 'echo test', 'pacman -Qi firefox', 'apt list', 'systemctl status nginx'];
  for (const cmd of benign) {
    const result = runEngine(cmd);
    assert.strictEqual(result.verdict, 'ALLOW', `${cmd} should be ALLOW, got ${result.verdict}`);
    assert.strictEqual(result.score, 0, `${cmd} score should be 0, got ${result.score}`);
  }
});

console.log("\n═══ Metadata — Structured rule metadata present in output ═══");

test("[META] admin-elevation runEngine output has meta + audit", () => {
  const result = runEngine('sudo pacman -Sy');
  assert.ok(result.meta, 'meta field must exist');
  assert.strictEqual(result.meta.category, 'Administrative Operations');
  assert.strictEqual(result.meta.confidence, 'high');
  assert.strictEqual(result.meta.platform, 'Linux');
  assert.ok(result.meta.attck.includes('T1548'), 'ATT&CK mapping must include T1548');
  assert.ok(result.meta.recommendation.includes('Verify operator intent'));
  assert.ok(result.audit, 'audit field must exist');
  assert.strictEqual(result.audit.operationType, 'System Administration');
  assert.strictEqual(result.audit.privilegeLevel, 'Root Required');
  assert.strictEqual(result.audit.impact, 'System State Modification');
});

test("[META] package-manager-remove runEngine output has meta + audit", () => {
  const result = runEngine('apt purge chromium-browser');
  assert.ok(result.meta);
  assert.strictEqual(result.meta.category, 'Package Management');
  assert.ok(result.meta.attck.includes('T1072'));
  assert.ok(result.audit);
  assert.strictEqual(result.audit.operationType, 'Package Management');
  assert.strictEqual(result.audit.privilegeLevel, 'Root Required');
  assert.strictEqual(result.audit.impact, 'Software Removal');
});

test("[META] filesystem-admin runEngine output has meta + audit", () => {
  const result = runEngine('chmod 777 /tmp/script.sh');
  assert.ok(result.meta);
  assert.strictEqual(result.meta.category, 'Filesystem Administration');
  assert.ok(result.meta.attck.includes('T1485'));
  assert.ok(result.audit);
  assert.strictEqual(result.audit.operationType, 'Filesystem Administration');
  assert.strictEqual(result.audit.impact, 'Filesystem Modification');
});

test("[META] service-admin runEngine output has meta + audit", () => {
  const result = runEngine('iptables -F');
  assert.ok(result.meta);
  assert.strictEqual(result.meta.category, 'Service Administration');
  assert.ok(result.meta.attck.includes('T1562.001'));
  assert.ok(result.audit);
  assert.strictEqual(result.audit.operationType, 'Service/Network Administration');
  assert.strictEqual(result.audit.privilegeLevel, 'Root Required');
  assert.strictEqual(result.audit.impact, 'Service Availability Modification');
});

console.log("\n═══ Verdict Language — Contextual reasons, not short codes ═══");

test("[LANG] admin-elevation reason is contextual", () => {
  const result = runEngine('doas systemctl restart nginx');
  assert.ok(result.reasons[0].length > 80);
  assert.ok(result.reasons[0].includes('privileged system administration'));
  assert.ok(result.reasons[0].includes('User verification is recommended'));
});

test("[LANG] package-manager-remove reason is contextual", () => {
  const result = runEngine('dnf remove docker-ce');
  assert.ok(result.reasons[0].length > 80);
  assert.ok(result.reasons[0].includes('privileged package removal'));
  assert.ok(result.reasons[0].includes('No malicious behavior was detected'));
});

test("[LANG] filesystem-admin reason is contextual", () => {
  const result = runEngine('mount /dev/sdb1 /mnt');
  assert.ok(result.reasons[0].length > 80);
  assert.ok(result.reasons[0].includes('privileged filesystem operation'));
});

test("[LANG] service-admin reason is contextual", () => {
  const result = runEngine('firewall-cmd --reload');
  assert.ok(result.reasons[0].length > 80);
  assert.ok(result.reasons[0].includes('privileged service or network administration'));
});

console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`);
process.exit(failed > 0 ? 1 : 0);
