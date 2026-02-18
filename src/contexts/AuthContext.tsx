import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { getTierByProductId, type SubscriptionTier } from "@/lib/tiers";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  github_token: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  tier: SubscriptionTier;
  isPro: boolean;
  isStarter: boolean;
  isPaid: boolean;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
  subscriptionEnd: string | null;
  githubToken: string;
  setGithubToken: (token: string) => void;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  tier: 'free',
  isPro: false,
  isStarter: false,
  isPaid: false,
  hasActiveSubscription: false,
  subscriptionLoading: false,
  subscriptionEnd: null,
  githubToken: '',
  setGithubToken: () => {},
  signOut: async () => {},
  refreshSubscription: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [githubToken, setGithubTokenState] = useState(() => sessionStorage.getItem("github_token") || "");

  const isPro = tier === 'pro';
  const isStarter = tier === 'starter';
  const isPaid = tier !== 'free';

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      const p = data as any;
      setProfile(p as Profile);
      if (p.github_token) {
        setGithubTokenState(p.github_token);
        sessionStorage.setItem("github_token", p.github_token);
      }
    }
  };

  const setGithubToken = useCallback(async (token: string) => {
    setGithubTokenState(token);
    if (token) {
      sessionStorage.setItem("github_token", token);
    } else {
      sessionStorage.removeItem("github_token");
    }
    if (user) {
      await supabase
        .from("profiles")
        .update({ github_token: token || null } as any)
        .eq("id", user.id);
    }
  }, [user]);

  const checkSubscription = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      // Always fetch a fresh session to avoid stale/expired tokens
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !freshSession) {
        console.warn('checkSubscription: no valid session, skipping');
        return;
      }
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${freshSession.access_token}` },
      });
      if (error) {
        console.warn('Subscription check failed (silenced):', error);
        return;
      }
      if (data?.subscribed === true) {
        setTier(getTierByProductId(data?.product_id));
        setHasActiveSubscription(true);
      } else {
        setTier('free');
        setHasActiveSubscription(false);
      }
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (e) {
      // Silently swallow – never surface token errors to the user
      console.warn('Subscription check error (silenced):', e);
    } finally {
      setSubscriptionLoading(false);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          checkSubscription();
        }, 0);
      } else {
        setProfile(null);
        setTier('free');
        setHasActiveSubscription(false);
        setSubscriptionEnd(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        // Don't call checkSubscription here – onAuthStateChange already fires on initial load
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkSubscription]);

  // Auto-refresh subscription every 60s while logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setTier('free');
    setHasActiveSubscription(false);
    setSubscriptionEnd(null);
    setGithubTokenState('');
    sessionStorage.removeItem('github_token');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, tier, isPro, isStarter, isPaid, hasActiveSubscription, subscriptionLoading, subscriptionEnd, githubToken, setGithubToken, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
