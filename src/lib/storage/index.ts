import { S3StorageProvider } from "@/lib/storage/s3-storage-provider";
import type { StorageProvider } from "@/lib/storage/types";

export type { StorageProvider, StoredObject, UploadInput } from "@/lib/storage/types";
export { generateStorageKey } from "@/lib/storage/storage-key";

let cachedProvider: StorageProvider | undefined;

/**
 * Provedor de armazenamento de mídia (ADR-0003): serviço compatível com
 * S3. Em desenvolvimento/teste aponta para o MinIO local
 * (docker-compose.yml); em produção, para um provedor real com as
 * mesmas variáveis de ambiente.
 */
export function getStorageProvider(): StorageProvider {
  cachedProvider ??= new S3StorageProvider();
  return cachedProvider;
}
