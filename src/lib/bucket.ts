import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

type UploadResult = {
  key: string;
  mimeType: string;
  byteSize: number;
  originalFilename: string;
};

const localUploadDir = path.join(process.cwd(), ".local-uploads");

function isMissingObjectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as NodeJS.ErrnoException & { name?: string };
  return candidate.code === "ENOENT" || candidate.name === "NoSuchKey";
}

function getS3Client() {
  if (!process.env.S3_ENDPOINT || !process.env.S3_BUCKET) {
    return null;
  }

  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
    forcePathStyle: true,
  });
}

export async function uploadGiftImage(file: File): Promise<UploadResult> {
  const extension = path.extname(file.name) || ".bin";
  const key = `gift-images/${randomUUID()}${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const client = getS3Client();

  if (client && process.env.S3_BUCKET) {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type,
      }),
    );
  } else {
    await mkdir(path.join(localUploadDir, path.dirname(key)), { recursive: true });
    await writeFile(path.join(localUploadDir, key), bytes);
  }

  return {
    key,
    mimeType: file.type || "application/octet-stream",
    byteSize: bytes.byteLength,
    originalFilename: file.name,
  };
}

export async function readGiftImage(key: string) {
  const client = getS3Client();

  try {
    if (client && process.env.S3_BUCKET) {
      const object = await client.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
        }),
      );
      return {
        stream: object.Body?.transformToWebStream(),
        mimeType: object.ContentType || "application/octet-stream",
      };
    }

    const filePath = path.join(localUploadDir, key);
    return {
      stream: Readable.toWeb(createReadStream(filePath)) as ReadableStream,
      mimeType: "application/octet-stream",
    };
  } catch (error) {
    if (isMissingObjectError(error)) {
      return null;
    }

    throw error;
  }
}
