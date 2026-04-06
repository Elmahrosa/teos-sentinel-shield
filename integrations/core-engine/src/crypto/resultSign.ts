import crypto from "crypto";

/**
 * Optional: sign a result hash with a server private key (ed25519 or rsa).
 * Environment:
 * - TEOS_SIGNING_PRIVATE_KEY (PEM or base64 PEM)
 * - TEOS_SIGNING_PUBLIC_KEY  (PEM or base64 PEM)  [optional to return]
 */
export function signResultHash(resultHash: string): { signature: string; publicKey?: string } | null {
  const priv = process.env.TEOS_SIGNING_PRIVATE_KEY;
  if (!priv) return null;

  const privateKeyPem = decodePem(priv);
  const signer = crypto.createSign("SHA256");
  signer.update(resultHash);
  signer.end();

  const signature = signer.sign(privateKeyPem).toString("base64");

  const pub = process.env.TEOS_SIGNING_PUBLIC_KEY;
  const publicKey = pub ? decodePem(pub) : undefined;

  return { signature, publicKey };
}

function decodePem(v: string): string {
  // Allows raw PEM or base64-encoded PEM
  const trimmed = v.trim();
  if (trimmed.startsWith("-----BEGIN")) return trimmed;
  return Buffer.from(trimmed, "base64").toString("utf8");
}
