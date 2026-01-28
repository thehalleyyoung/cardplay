/**
 * @fileoverview Manifest Signature Verification.
 * 
 * Provides cryptographic signature verification for CardManifest files:
 * - Digital signature creation and verification
 * - Public key infrastructure (PKI) support
 * - Integrity checking
 * - Tamper detection
 * 
 * @module @cardplay/user-cards/manifest-signature
 */

import type { CardManifest } from './manifest.js';

// ============================================================================
// SIGNATURE TYPES
// ============================================================================

/**
 * Signature algorithm.
 */
export type SignatureAlgorithm = 'RSA-PSS' | 'ECDSA' | 'Ed25519';

/**
 * Hash algorithm.
 */
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Signature metadata.
 */
export interface SignatureMetadata {
  /** Algorithm used for signing */
  algorithm: SignatureAlgorithm;
  /** Hash algorithm */
  hash: HashAlgorithm;
  /** Timestamp when signature was created */
  timestamp: string;
  /** Signer information */
  signer?: {
    name: string;
    email?: string;
    organization?: string;
  };
  /** Certificate chain (optional) */
  certificates?: string[];
  /** Key ID (for key rotation) */
  keyId?: string;
}

/**
 * Signed manifest wrapper.
 */
export interface SignedManifest {
  /** The manifest content */
  manifest: CardManifest;
  /** Base64-encoded signature */
  signature: string;
  /** Public key (PEM format) */
  publicKey: string;
  /** Signature metadata */
  metadata: SignatureMetadata;
}

/**
 * Verification result.
 */
export interface VerificationResult {
  /** Is the signature valid? */
  valid: boolean;
  /** Verification timestamp */
  verifiedAt: string;
  /** Signer information */
  signer?: {
    name: string;
    email?: string;
    organization?: string;
  };
  /** Errors if verification failed */
  errors?: string[];
  /** Warnings (e.g., expired cert, weak algorithm) */
  warnings?: string[];
}

/**
 * Key pair for signing.
 */
export interface KeyPair {
  /** Private key (PEM format) - KEEP SECRET */
  privateKey: string;
  /** Public key (PEM format) */
  publicKey: string;
  /** Algorithm */
  algorithm: SignatureAlgorithm;
}

// ============================================================================
// SIGNATURE CREATION
// ============================================================================

/**
 * Signs a manifest with a private key.
 */
export async function signManifest(
  manifest: CardManifest,
  privateKey: string,
  options: {
    algorithm?: SignatureAlgorithm;
    hash?: HashAlgorithm;
    signer?: {
      name: string;
      email?: string;
      organization?: string;
    };
    keyId?: string;
  } = {}
): Promise<SignedManifest> {
  const {
    algorithm = 'RSA-PSS',
    hash = 'SHA-256',
    signer,
    keyId,
  } = options;

  // Normalize manifest (deterministic JSON)
  const manifestJson = normalizeManifestJSON(manifest);

  // Import private key
  const cryptoKey = await importPrivateKey(privateKey, algorithm);

  // Sign the manifest
  const signature = await signData(manifestJson, cryptoKey, algorithm, hash);

  // Get public key from private key
  const publicKey = await extractPublicKey(privateKey, algorithm);

  const metadata: SignatureMetadata = {
    algorithm,
    hash,
    timestamp: new Date().toISOString(),
    ...(signer ? { signer } : {}),
    ...(keyId ? { keyId } : {}),
  };

  return {
    manifest,
    signature: arrayBufferToBase64(signature),
    publicKey,
    metadata,
  };
}

/**
 * Verifies a signed manifest.
 */
export async function verifyManifest(
  signedManifest: SignedManifest
): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Normalize manifest
    const manifestJson = normalizeManifestJSON(signedManifest.manifest);

    // Import public key
    const publicKey = await importPublicKey(
      signedManifest.publicKey,
      signedManifest.metadata.algorithm
    );

    // Verify signature
    const signatureBytes = base64ToArrayBuffer(signedManifest.signature);
    const valid = await verifySignature(
      manifestJson,
      signatureBytes,
      publicKey,
      signedManifest.metadata.algorithm,
      signedManifest.metadata.hash
    );

    // Check for weak algorithms
    if (signedManifest.metadata.hash === 'SHA-256') {
      // SHA-256 is acceptable but SHA-384/512 is better
    } else if (signedManifest.metadata.hash !== 'SHA-384' && signedManifest.metadata.hash !== 'SHA-512') {
      warnings.push('Weak hash algorithm detected');
    }

    // Check signature age
    const signatureAge = Date.now() - new Date(signedManifest.metadata.timestamp).getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (signatureAge > maxAge) {
      warnings.push('Signature is older than 1 year');
    }

    return {
      valid,
      verifiedAt: new Date().toISOString(),
      ...(signedManifest.metadata.signer ? { signer: signedManifest.metadata.signer } : {}),
      ...(errors.length > 0 ? { errors } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return {
      valid: false,
      verifiedAt: new Date().toISOString(),
      errors,
      warnings,
    };
  }
}

/**
 * Verifies manifest signature quickly (without full crypto).
 * Useful for checking if signature format is valid before expensive verification.
 */
export function quickCheckSignature(signedManifest: SignedManifest): { valid: boolean; reason?: string } {
  // Check required fields
  if (!signedManifest.manifest) {
    return { valid: false, reason: 'Missing manifest' };
  }
  if (!signedManifest.signature) {
    return { valid: false, reason: 'Missing signature' };
  }
  if (!signedManifest.publicKey) {
    return { valid: false, reason: 'Missing public key' };
  }
  if (!signedManifest.metadata) {
    return { valid: false, reason: 'Missing metadata' };
  }

  // Check signature format (base64)
  if (!/^[A-Za-z0-9+/]+=*$/.test(signedManifest.signature)) {
    return { valid: false, reason: 'Invalid signature format' };
  }

  // Check public key format (PEM)
  if (!signedManifest.publicKey.includes('-----BEGIN') || !signedManifest.publicKey.includes('-----END')) {
    return { valid: false, reason: 'Invalid public key format' };
  }

  // Check metadata
  if (!signedManifest.metadata.algorithm) {
    return { valid: false, reason: 'Missing algorithm' };
  }
  if (!signedManifest.metadata.hash) {
    return { valid: false, reason: 'Missing hash algorithm' };
  }
  if (!signedManifest.metadata.timestamp) {
    return { valid: false, reason: 'Missing timestamp' };
  }

  return { valid: true };
}

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/**
 * Generates a new key pair for signing.
 */
export async function generateKeyPair(
  algorithm: SignatureAlgorithm = 'RSA-PSS'
): Promise<KeyPair> {
  let keyPair: CryptoKeyPair;

  if (algorithm === 'RSA-PSS') {
    keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );
  } else if (algorithm === 'ECDSA') {
    keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-384',
      },
      true,
      ['sign', 'verify']
    );
  } else if (algorithm === 'Ed25519') {
    // Ed25519 not yet widely supported in Web Crypto API
    // Would need a polyfill library like tweetnacl
    throw new Error('Ed25519 not yet supported');
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const privateKeyPem = await exportPrivateKey(keyPair.privateKey);
  const publicKeyPem = await exportPublicKey(keyPair.publicKey);

  return {
    privateKey: privateKeyPem,
    publicKey: publicKeyPem,
    algorithm,
  };
}

/**
 * Exports a public key from a private key.
 */
async function extractPublicKey(privateKey: string, algorithm: SignatureAlgorithm): Promise<string> {
  // Import the private key to ensure it's valid
  await importPrivateKey(privateKey, algorithm);
  
  // This is a simplified approach - in production you'd extract the public key properly
  // For now, we assume the public key is embedded or derivable
  // In a real implementation, you'd use a library like node-forge or similar
  
  // Placeholder - in real implementation, derive public key from private key
  return privateKey.replace('PRIVATE', 'PUBLIC');
}

// ============================================================================
// CRYPTOGRAPHIC OPERATIONS
// ============================================================================

async function signData(
  data: string,
  privateKey: CryptoKey,
  algorithm: SignatureAlgorithm,
  hash: HashAlgorithm
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  if (algorithm === 'RSA-PSS') {
    return await crypto.subtle.sign(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      privateKey,
      dataBytes
    );
  } else if (algorithm === 'ECDSA') {
    return await crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: hash },
      },
      privateKey,
      dataBytes
    );
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

async function verifySignature(
  data: string,
  signature: ArrayBuffer,
  publicKey: CryptoKey,
  algorithm: SignatureAlgorithm,
  hash: HashAlgorithm
): Promise<boolean> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  if (algorithm === 'RSA-PSS') {
    return await crypto.subtle.verify(
      {
        name: 'RSA-PSS',
        saltLength: 32,
      },
      publicKey,
      signature,
      dataBytes
    );
  } else if (algorithm === 'ECDSA') {
    return await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: hash },
      },
      publicKey,
      signature,
      dataBytes
    );
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

async function importPrivateKey(pem: string, algorithm: SignatureAlgorithm): Promise<CryptoKey> {
  // Remove PEM headers
  const pemContents = pem
    .replace(/-----BEGIN.*?-----/g, '')
    .replace(/-----END.*?-----/g, '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);

  if (algorithm === 'RSA-PSS') {
    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
      },
      true,
      ['sign']
    );
  } else if (algorithm === 'ECDSA') {
    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      {
        name: 'ECDSA',
        namedCurve: 'P-384',
      },
      true,
      ['sign']
    );
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

async function importPublicKey(pem: string, algorithm: SignatureAlgorithm): Promise<CryptoKey> {
  // Remove PEM headers
  const pemContents = pem
    .replace(/-----BEGIN.*?-----/g, '')
    .replace(/-----END.*?-----/g, '')
    .replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);

  if (algorithm === 'RSA-PSS') {
    return await crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-PSS',
        hash: 'SHA-256',
      },
      true,
      ['verify']
    );
  } else if (algorithm === 'ECDSA') {
    return await crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'ECDSA',
        namedCurve: 'P-384',
      },
      true,
      ['verify']
    );
  } else {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }
}

async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key);
  const exportedAsBase64 = arrayBufferToBase64(exported);
  return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
}

async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  const exportedAsBase64 = arrayBufferToBase64(exported);
  return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Normalizes manifest to deterministic JSON.
 */
function normalizeManifestJSON(manifest: CardManifest): string {
  // Sort keys alphabetically for deterministic output
  return JSON.stringify(manifest, Object.keys(manifest).sort());
}

/**
 * Converts ArrayBuffer to base64.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Converts base64 to ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================================
// MANIFEST INTEGRITY
// ============================================================================

/**
 * Computes hash of manifest for integrity checking.
 */
export async function hashManifest(
  manifest: CardManifest,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<string> {
  const manifestJson = normalizeManifestJSON(manifest);
  const encoder = new TextEncoder();
  const data = encoder.encode(manifestJson);
  
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * Verifies manifest integrity against expected hash.
 */
export async function verifyManifestIntegrity(
  manifest: CardManifest,
  expectedHash: string,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<boolean> {
  const actualHash = await hashManifest(manifest, algorithm);
  return actualHash === expectedHash;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serializes signed manifest to JSON.
 */
export function serializeSignedManifest(signedManifest: SignedManifest): string {
  return JSON.stringify(signedManifest, null, 2);
}

/**
 * Deserializes signed manifest from JSON.
 */
export function deserializeSignedManifest(json: string): SignedManifest {
  const parsed = JSON.parse(json);
  
  // Validate structure
  if (!parsed.manifest || !parsed.signature || !parsed.publicKey || !parsed.metadata) {
    throw new Error('Invalid signed manifest format');
  }

  return parsed as SignedManifest;
}

/**
 * Creates a signed manifest file content (for .signed.json files).
 */
export function createSignedManifestFile(signedManifest: SignedManifest): string {
  return `${serializeSignedManifest(signedManifest)}\n`;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Signs and saves a manifest in one step.
 */
export async function signAndSerialize(
  manifest: CardManifest,
  privateKey: string,
  options?: {
    algorithm?: SignatureAlgorithm;
    hash?: HashAlgorithm;
    signer?: {
      name: string;
      email?: string;
      organization?: string;
    };
  }
): Promise<string> {
  const signed = await signManifest(manifest, privateKey, options);
  return serializeSignedManifest(signed);
}

/**
 * Loads and verifies a signed manifest in one step.
 */
export async function deserializeAndVerify(json: string): Promise<{
  manifest: CardManifest;
  verification: VerificationResult;
}> {
  const signed = deserializeSignedManifest(json);
  const verification = await verifyManifest(signed);
  
  return {
    manifest: signed.manifest,
    verification,
  };
}
