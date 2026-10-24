export {};
export type SyncInfo = {
  enabled: boolean; status: 'off' | 'out' | 'ok' | 'pending' | 'error'; error: string; email: string;
  /** Apps con cambios locales todavía sin subir. */
  pendientes: string[];
  /** Cuándo es el próximo reintento automático (ms epoch), 0 si no hay. */
  retryAt: number;
  /** Último momento en que todo quedó confirmado en la nube (ms epoch). */
  lastOk: number;
};
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
      retry: () => Promise<unknown>;
      onStatus: (f: (i: SyncInfo) => void) => void;
    };
  }
}
