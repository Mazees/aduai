import 'server-only';
import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'aduai-fallback-development-secret-key-32-chars-minimum';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'aduai-fallback-encryption-key-32-chars';

/**
 * 1. HASHING PASSWORD (Admin)
 * Menggunakan scrypt dengan salt acak dan constant-time comparison
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const keyBuffer = Buffer.from(key, 'hex');
        const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
        resolve(match);
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * 2. HASHING KODE AKSES TIKET
 * Menggunakan HMAC-SHA256 dengan constant-time comparison
 * Mencegah kebocoran kode akses pelacakan walaupun database terkompromi
 */
export function hashAccessCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHmac('sha256', JWT_SECRET).update(normalized).digest('hex');
}

export function verifyAccessCode(providedCode: string, storedHash: string): boolean {
  try {
    const computedHash = hashAccessCode(providedCode);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * 3. ENKRIPSI RAHASIA (AES-256-GCM)
 * Untuk mengenkripsi API Key AI Provider sebelum disimpan di DB
 */
function getDerivedKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getDerivedKey(), iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSecret(cipherText: string): string {
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('INVALID_CIPHERTEXT_FORMAT');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getDerivedKey(), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 4. SESSION TOKEN ADMIN (HMAC Signed Token)
 * Token sesi admin dengan masa berlaku (default 24 jam)
 */
export interface AdminSessionPayload {
  sub: string; // admin ID
  email: string;
  name: string;
  iat: number;
  exp: number;
}

export function createAdminToken(
  admin: { id: string; email: string; name: string },
  expiresInSeconds = 24 * 60 * 60
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerB64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const dataToSign = `${headerB64}.${payloadB64}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest('base64url');

  return `${dataToSign}.${signature}`;
}

export function verifyAdminToken(token: string): AdminSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest('base64url');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    const payload: AdminSessionPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
