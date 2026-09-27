// ============================================================
// blobStore.js — IndexedDB storage for media blobs
// Supabase stores only metadata + a blobKey reference.
// ============================================================

const DB_NAME = 'DartMediaBlobs';
const DB_VERSION = 1;
const STORE = 'blobs';

let _dbPromise = null;

function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'key' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return _dbPromise;
}

async function withStore(mode, fn) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        let result;
        try {
            result = fn(store);
        } catch (err) {
            return reject(err);
        }
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

export const blobStore = {
    async put(key, blob) {
        await withStore('readwrite', (store) => {
            store.put({ key, blob, type: blob.type, savedAt: Date.now() });
        });
        return key;
    },

    async get(key) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).get(key);
                req.onsuccess = () => {
                    const row = req.result;
                    resolve(row ? row.blob : null);
                };
                req.onerror = () => reject(req.error);
            } catch (err) {
                reject(err);
            }
        });
    },

    async delete(key) {
        await withStore('readwrite', (store) => {
            store.delete(key);
        });
    },

    async listKeys() {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).getAllKeys();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            } catch (err) {
                reject(err);
            }
        });
    },

    async clear() {
        await withStore('readwrite', (store) => {
            store.clear();
        });
    },

    async size() {
        return new Promise(async (resolve, reject) => {
            try {
                const db = await openDB();
                const tx = db.transaction(STORE, 'readonly');
                const req = tx.objectStore(STORE).getAll();
                req.onsuccess = () => {
                    const rows = req.result || [];
                    const total = rows.reduce((sum, r) => sum + (r.blob?.size || 0), 0);
                    resolve({ count: rows.length, bytes: total });
                };
                req.onerror = () => reject(req.error);
            } catch (err) {
                reject(err);
            }
        });
    }
};