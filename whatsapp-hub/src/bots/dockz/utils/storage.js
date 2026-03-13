import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { cfg } from '../config.js';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localDir = path.join(__dirname, '../../storage');

if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

const s3 = cfg.STORAGE_DRIVER === 's3'
  ? new S3Client({ region: process.env.AWS_REGION,
                   credentials: process.env.AWS_ACCESS_KEY_ID ? {
                     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                   } : undefined })
  : null;

export async function saveBuffer({ buffer, filename, contentType }) {
  const key = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${filename}`;

  if (cfg.STORAGE_DRIVER === 's3') {
    const put = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/rtf'
    });
    await s3.send(put);
    return { key };
  } else {
    const p = path.join(localDir, key);
    fs.writeFileSync(p, buffer);
    return { key };
  }
}

export async function getSignedDownloadUrl(key) {
  if (cfg.STORAGE_DRIVER === 's3') {
    const cmd = new PutObjectCommand({}); // dummy to import type
    // For download signed URL use GetObjectCommand:
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const getCmd = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    });
    const url = await getSignedUrl(s3, getCmd, { expiresIn: cfg.LINK_TTL_SECONDS });
    return url;
  } else {
    // local signed URL via token
    const token = jwt.sign({ key }, cfg.DOWNLOAD_TOKEN_SECRET, { expiresIn: cfg.LINK_TTL_SECONDS });
    return `${process.env.BASE_URL}/api/documents/download?key=${encodeURIComponent(key)}&token=${token}`;
  }
}