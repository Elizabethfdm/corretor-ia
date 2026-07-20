import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { StorageProvider, StoredObject, UploadInput } from "@/lib/storage/types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    this.bucket = requireEnv("STORAGE_BUCKET_NAME");
    this.publicBaseUrl = requireEnv("STORAGE_PUBLIC_BASE_URL").replace(/\/$/, "");

    this.client = new S3Client({
      region: process.env["STORAGE_REGION"] ?? "us-east-1",
      endpoint: process.env["STORAGE_ENDPOINT"],
      forcePathStyle: process.env["STORAGE_FORCE_PATH_STYLE"] === "true",
      credentials: {
        accessKeyId: requireEnv("STORAGE_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("STORAGE_SECRET_ACCESS_KEY"),
      },
    });
  }

  async upload({ key, body, contentType }: UploadInput): Promise<StoredObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return {
      key,
      publicUrl: `${this.publicBaseUrl}/${key}`,
      contentType,
      size: body.length,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  keyFromPublicUrl(publicUrl: string): string {
    return publicUrl.replace(`${this.publicBaseUrl}/`, "");
  }
}
