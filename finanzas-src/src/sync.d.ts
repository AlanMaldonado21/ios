export {};
export type SyncInfo = { enabled: boolean; status: 'off' | 'out' | 'ok' | 'pending' | 'error'; error: string; email: string };
declare global {
  interface Window {
    Sync?: {
      enabled: boolean;
      info: () => SyncInfo;
      login: (email: string, password: string) => Promise<{ error?: string }>;
      logout: () => void;
      touch: (app: 'finanzas' | 'habitos') => void;
      register: (app: 'finanzas' | 'habitos', onRemote: () => void) => void;
      syncAll: () => Promise<unknown>;
      onStatus: (f: (i: SyncInfo) => void) => void;
    };
  }
}
