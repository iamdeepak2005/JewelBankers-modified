import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

interface CustomerPhoto {
  id: string;
  photo: Blob;  // Blob type to store images
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private dbPromise: Promise<IDBPDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  // Initialize IndexedDB
  private async initDB() {
    return openDB('CustomerDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
      },
    });
  }

  // Clear IndexedDB completely
  private async clearIndexedDB(): Promise<void> {
    console.warn('Clearing IndexedDB: storage full detected');
    if (window.indexedDB) {
      const dbs = indexedDB.databases ? await indexedDB.databases() : [];
      for (const db of dbs) {
        if (db.name) {
          await new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase(db.name!);
            deleteReq.onsuccess = () => resolve(true);
            deleteReq.onerror = (e) => reject(e);
          });
        }
      }
      console.log('IndexedDB cleared successfully');
    }
    // Reinitialize DB to make service usable again
    this.dbPromise = this.initDB();
  }

  // Add photo with customer ID and handle full storage
  async addPhoto(id: string, photo: Blob): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put('photos', { id, photo });
      console.log('Photo added for ID:', id);
    } catch (error: any) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        await this.clearIndexedDB();
      } else {
        console.error('Error adding photo:', error);
      }
    }
  }

  // Add or update photo safely
  async addOrUpdatePhoto(id: string, photo: Blob): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put('photos', { id, photo });
      console.log('Photo added/updated for ID:', id);
    } catch (error: any) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        await this.clearIndexedDB();
      } else {
        console.error('Error in addOrUpdatePhoto:', error);
      }
    }
  }

  // Retrieve photo by customer ID
  async getPhoto(id: string): Promise<CustomerPhoto | undefined> {
    const db = await this.dbPromise;
    return db.get('photos', id);
  }

  // Get all photos
  async getAllPhotos(): Promise<CustomerPhoto[]> {
    const db = await this.dbPromise;
    return db.getAll('photos');
  }

  // Delete photo by customer ID
  async deletePhoto(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('photos', id);
  }
}
