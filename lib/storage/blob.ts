import { put, head, del } from '@vercel/blob'
import { encryptFile, decryptFile } from './encryption'

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error('BLOB_READ_WRITE_TOKEN environment variable is not set')
}

export interface UploadOptions {
  organizationId: string
  addRandomSuffix?: boolean
  contentType?: string
}

/**
 * Uploads a file to Vercel Blob Storage with encryption
 */
export async function uploadEncryptedFile(
  file: Buffer,
  filename: string,
  options: UploadOptions
): Promise<{
  url: string
  encryptedData: Buffer
  iv: string
  tag: string
  encryptionKeyId: string
}> {
  // Encrypt the file before uploading
  const { encrypted, iv, tag } = encryptFile(file, options.organizationId)
  const encryptionKeyId = `${options.organizationId}-${Date.now()}`

  // Upload encrypted file to Vercel Blob
  // Convert Buffer to ArrayBuffer for Vercel Blob API compatibility
  const encryptedArrayBuffer = encrypted.buffer.slice(
    encrypted.byteOffset,
    encrypted.byteOffset + encrypted.byteLength
  )
  const blob = await put(filename, encryptedArrayBuffer, {
    access: 'private',
    addRandomSuffix: options.addRandomSuffix ?? true,
    contentType: options.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return {
    url: blob.url,
    encryptedData: encrypted,
    iv,
    tag,
    encryptionKeyId,
  }
}

/**
 * Downloads and decrypts a file from Vercel Blob Storage
 */
export async function downloadAndDecryptFile(
  blobUrl: string,
  iv: string,
  tag: string,
  organizationId: string
): Promise<Buffer> {
  // Download the encrypted file
  const response = await fetch(blobUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to download blob: ${response.statusText}`)
  }

  const encryptedBuffer = Buffer.from(await response.arrayBuffer())

  // Decrypt the file
  return decryptFile(encryptedBuffer, iv, tag, organizationId)
}

/**
 * Deletes a file from Vercel Blob Storage
 */
export async function deleteBlob(blobUrl: string): Promise<void> {
  await del(blobUrl, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
}

/**
 * Gets blob metadata
 */
export async function getBlobMetadata(blobUrl: string) {
  const blob = await head(blobUrl, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob
}

