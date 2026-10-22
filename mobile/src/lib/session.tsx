// Holds the signed-in account for the whole app.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setApiToken, setUnauthorizedHandler, type Account } from './api';
import { loadToken, saveToken } from './storage';

type Session = {
  ready: boolean;
  account: Account | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (f: { name: string; email: string; password: string; state: string; adult: boolean; ref: string }) => Promise<{ boxesBlocked: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  const clear = useCallback(async () => { setApiToken(null); await saveToken(null); setAccount(null); }, []);

  const refresh = useCallback(async () => {
    try { setAccount(await api<Account>('me')); } catch { /* keep what we have; 401 is handled below */ }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { void clear(); });
    (async () => {
      const t = await loadToken();
      if (t) {
        setApiToken(t);
        try { setAccount(await api<Account>('me')); } catch { await clear(); }
      }
      setReady(true);
    })();
  }, [clear]);

  const start = useCallback(async (t: string) => { setApiToken(t); await saveToken(t); setAccount(await api<Account>('me')); }, []);

  const value = useMemo<Session>(() => ({
    ready, account, refresh,
    signIn: async (email, password) => {
      const r = await api<{ token: string }>('auth/signin', { method: 'POST', body: { email, password } });
      await start(r.token);
    },
    signUp: async (f) => {
      const r = await api<{ token: string; boxesBlocked: boolean }>('auth/signup', { method: 'POST', body: f });
      await start(r.token);
      return { boxesBlocked: r.boxesBlocked };
    },
    signOut: async () => { try { await api('auth/signout', { method: 'POST', body: {} }); } catch { /* signing out locally is enough */ } await clear(); },
  }), [ready, account, refresh, start, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): Session {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession must be used inside SessionProvider');
  return s;
}
