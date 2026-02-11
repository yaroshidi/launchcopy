import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isPro: boolean;
  subscriptionLoading: boolean;
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isPro: false,
  subscriptionLoading: false,
  subscriptionEnd: null,
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
  const [isPro, setIsPro] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const fetchProfile = (userId: string) => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      });
  };

  const checkSubscription = useCallback(async () => {
    try {
      setSubscriptionLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) {
        console.error('Subscription check failed:', error);
        return;
      }
      setIsPro(data?.subscribed === true);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (e) {
      console.error('Subscription check error:', e);
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
        setIsPro(false);
        setSubscriptionEnd(null);
      }

      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        checkSubscription();
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
    setIsPro(false);
    setSubscriptionEnd(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isPro, subscriptionLoading, subscriptionEnd, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}
