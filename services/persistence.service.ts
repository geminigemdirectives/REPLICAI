import { openDB, DBSchema } from 'idb';
import { ComposerState, AttributeKey } from '../types';

interface ReplicaiDB extends DBSchema {
  state: {
    key: string;
    value: ComposerState;
  };
}

const DB_NAME = 'replicai-db';
const STORE_NAME = 'state';
const STATE_KEY = 'composer-state';

export const initDB = async () => {
  return openDB<ReplicaiDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
};

export const saveState = async (state: ComposerState) => {
  try {
    const db = await initDB();
    // We can store the state directly. IndexedDB handles Files and Blobs.
    // However, we should probably not store the ephemeral dataUrls as they are useless after reload.
    // But storing them doesn't hurt, we just need to overwrite them on load.
    await db.put(STORE_NAME, state, STATE_KEY);
  } catch (e) {
    console.error("Failed to save state to IndexedDB:", e);
  }
};

export const loadState = async (): Promise<ComposerState | null> => {
  try {
    const db = await initDB();
    const state = await db.get(STORE_NAME, STATE_KEY);
    if (!state) return null;

    // Regenerate dataUrls for Identity Base
    if (state.identityBase && state.identityBase.files) {
      state.identityBase.dataUrls = state.identityBase.files.map(f => URL.createObjectURL(f));
    }

    // Regenerate dataUrl for Full Lock Ref
    if (state.fullLockRef && state.fullLockRef.file) {
      state.fullLockRef.dataUrl = URL.createObjectURL(state.fullLockRef.file);
    }

    // Regenerate dataUrls for Attributes
    if (state.attributes) {
      (Object.keys(state.attributes) as AttributeKey[]).forEach(key => {
        const attr = state.attributes[key];
        if (attr.refImage && attr.refImage.file) {
          attr.refImage.dataUrl = URL.createObjectURL(attr.refImage.file);
        }
      });
    }

    // Regenerate dataUrl for Body Base (if exists in identityBase)
    if (state.identityBase && (state.identityBase as any).bodyBase && (state.identityBase as any).bodyBase.file) {
        (state.identityBase as any).bodyBase.dataUrl = URL.createObjectURL((state.identityBase as any).bodyBase.file);
    }

    return state;
  } catch (e) {
    console.error("Failed to load state from IndexedDB:", e);
    return null;
  }
};

export const clearState = async () => {
  try {
    const db = await initDB();
    await db.delete(STORE_NAME, STATE_KEY);
  } catch (e) {
    console.error("Failed to clear state from IndexedDB:", e);
  }
};
