const DB_NAME = 'TimePulseDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_backgrounds';

export interface StoredImageMetadata {
  size: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: string;
  name?: string;
}

export interface StoredImage {
  id: string;
  type: 'file' | 'url';
  url: string;
  blob: Blob;
  metadata: StoredImageMetadata;
  [key: string]: unknown;
}

class ImageStorage {
  private db: IDBDatabase | null = null;

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(new Error('无法打开 IndexedDB'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('无法初始化 IndexedDB');
    return this.db;
  }

  private getImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: image.width, height: image.height });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法读取图片尺寸'));
      };
      image.src = url;
    });
  }

  async saveImage(file: File): Promise<string> {
    const db = await this.ensureDB();
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) throw new Error('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
    const dimensions = await this.getImageDimensions(file);
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imageData: StoredImage = {
      id,
      type: 'file',
      url: URL.createObjectURL(file),
      blob: file,
      metadata: { size: file.size, mimeType: file.type, ...dimensions, uploadedAt: new Date().toISOString(), name: file.name },
    };
    return new Promise((resolve, reject) => {
      const request = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME).add(imageData);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(new Error('保存图片失败'));
    });
  }

  async saveImageFromUrl(url: string): Promise<string> {
    const db = await this.ensureDB();
    try {
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`下载图片失败: ${response.status}`);
      const blob = await response.blob();
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(blob.type)) throw new Error('只支持 JPEG、PNG、GIF 和 WebP 格式的图片');
      const dimensions = await this.getImageDimensions(blob);
      const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const imageData: StoredImage = {
        id,
        type: 'url',
        url,
        blob,
        metadata: { size: blob.size, mimeType: blob.type, ...dimensions, uploadedAt: new Date().toISOString() },
      };
      return new Promise((resolve, reject) => {
        const request = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME).add(imageData);
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(new Error('保存图片失败'));
      });
    } catch (error) {
      throw new Error(`从 URL 保存图片失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImage(id: string): Promise<StoredImage | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const result = request.result as StoredImage | undefined;
        if (result?.type === 'file' && result.blob) result.url = URL.createObjectURL(result.blob);
        resolve(result ?? null);
      };
      request.onerror = () => reject(new Error('获取图片失败'));
    });
  }

  async getAllImages(): Promise<StoredImage[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as StoredImage[]).map((image) => {
        if (image.type === 'file' && image.blob) image.url = URL.createObjectURL(image.blob);
        return image;
      }));
      request.onerror = () => reject(new Error('获取图片列表失败'));
    });
  }

  async deleteImage(id: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('删除图片失败'));
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const request = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('清空图片失败'));
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
  }
}

const imageStorage = new ImageStorage();
export default imageStorage;
