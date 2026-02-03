/**
 * Storage adapter interface for archiving
 * Implement this with S3, GCS, or any other storage
 */
export interface IStorageAdapter {
  /**
   * Upload data to storage
   * @param key - Storage key/path (e.g., "omnichannel/2024/01/conv-123.json.gz")
   * @param data - Data to upload (JSON string)
   * @returns CDN/public URL for the uploaded file
   */
  upload(key: string, data: string): Promise<string>;

  /**
   * Download data from storage
   * @param key - Storage key/path
   * @returns Downloaded data as string
   */
  download(key: string): Promise<string>;

  /**
   * Delete data from storage
   * @param key - Storage key/path
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists
   * @param key - Storage key/path
   */
  exists(key: string): Promise<boolean>;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');
