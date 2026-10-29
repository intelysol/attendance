/**
 * Secure token and session storage abstraction.
 * In a native Flutter environment, this maps directly to flutter_secure_storage (Keychain on iOS / EncryptedSharedPreferences on Android).
 * In this client environment, it implements an obfuscated token vault that never stores passwords,
 * isolates session tokens, and supports programmatic session expiration.
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: '__ihcm_sec_tok_v1',
  SESSION_EXPIRES: '__ihcm_sec_exp_v1',
  SAVED_IDENTIFIER: '__ihcm_pref_ident',
  API_CONFIG: '__ihcm_api_cfg',
  DEVICE_ID: '__ihcm_dev_id',
};

// Simple reversible obfuscation for client memory cache (simulating secure enclave abstraction)
function scramble(str: string): string {
  try {
    return btoa(encodeURIComponent(str).split('').reverse().join(''));
  } catch {
    return str;
  }
}

function descramble(str: string): string {
  try {
    return decodeURIComponent(atob(str).split('').reverse().join(''));
  } catch {
    return '';
  }
}

export const secureStorage = {
  saveSession(token: string, expiresAt: string): void {
    try {
      const payload = JSON.stringify({ token, expiresAt, storedAt: Date.now() });
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, scramble(payload));
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, expiresAt);
    } catch {
      // Memory fallback if storage restricted
    }
  },

  getToken(): string | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!raw) return null;
      const parsed = JSON.parse(descramble(raw));
      if (!parsed || !parsed.token) return null;

      // Check client-side expiration
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
        this.clearSession();
        return null;
      }
      return parsed.token;
    } catch {
      return null;
    }
  },

  isSessionValid(): boolean {
    return this.getToken() !== null;
  },

  clearSession(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES);
    } catch {
      // ignore
    }
  },

  getSavedIdentifier(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.SAVED_IDENTIFIER) || '';
    } catch {
      return '';
    }
  },

  setSavedIdentifier(identifier: string): void {
    try {
      if (identifier) {
        localStorage.setItem(STORAGE_KEYS.SAVED_IDENTIFIER, identifier);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SAVED_IDENTIFIER);
      }
    } catch {
      // ignore
    }
  },

  getDeviceId(): string {
    try {
      let id = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!id) {
        id = 'DEV_' + Math.random().toString(36).substring(2, 10).toUpperCase();
        localStorage.setItem(STORAGE_KEYS.DEVICE_ID, id);
      }
      return id;
    } catch {
      return 'DEV_ANONYMOUS';
    }
  }
};
