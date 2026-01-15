import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Derives a key from the master encryption key and organization ID
 */
function deriveKey(masterKey: string, organizationId: string): Buffer {
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  
  return crypto.pbkdf2Sync(
    masterKey,
    organizationId,
    100000, // iterations
    KEY_LENGTH,
    'sha256'
  )
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(data: string | Buffer, organizationId: string): { encrypted: string; iv: string; tag: string } {
  const key = deriveKey(process.env.ENCRYPTION_KEY!, organizationId)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(
  encrypted: string,
  iv: string,
  tag: string,
  organizationId: string
): string {
  const key = deriveKey(process.env.ENCRYPTION_KEY!, organizationId)
  const ivBuffer = Buffer.from(iv, 'base64')
  const tagBuffer = Buffer.from(tag, 'base64')
  const encryptedBuffer = Buffer.from(encrypted, 'base64')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)
  decipher.setAuthTag(tagBuffer)
  
  const decrypted = Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ])
  
  return decrypted.toString('utf8')
}

/**
 * Encrypts a file buffer
 */
export function encryptFile(fileBuffer: Buffer, organizationId: string): {
  encrypted: Buffer
  iv: string
  tag: string
} {
  const key = deriveKey(process.env.ENCRYPTION_KEY!, organizationId)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()])
  const tag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

/**
 * Decrypts a file buffer
 */
export function decryptFile(
  encryptedBuffer: Buffer,
  iv: string,
  tag: string,
  organizationId: string
): Buffer {
  const key = deriveKey(process.env.ENCRYPTION_KEY!, organizationId)
  const ivBuffer = Buffer.from(iv, 'base64')
  const tagBuffer = Buffer.from(tag, 'base64')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer)
  decipher.setAuthTag(tagBuffer)
  
  return Buffer.concat([
    decipher.update(encryptedBuffer),
    decipher.final(),
  ])
}

/**
 * Generates a unique encryption key ID for tracking encrypted keys
 */
export function generateEncryptionKeyId(): string {
  return crypto.randomBytes(16).toString('hex')
}

