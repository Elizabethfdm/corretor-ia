export interface UploadInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface StoredObject {
  key: string;
  publicUrl: string;
  contentType: string;
  size: number;
}

export interface StorageProvider {
  upload(input: UploadInput): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  /** Recupera a chave original a partir de uma publicUrl gerada por este provedor. */
  keyFromPublicUrl(publicUrl: string): string;
}
