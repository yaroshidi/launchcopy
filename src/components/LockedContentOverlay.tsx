import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function LockedContentOverlay() {
  const { user, tier } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (planTier: 'starter' | 'pro') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: planTier },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (e) {
      console.error('Checkout error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (tier === 'pro') return null;

  const isStarter = tier === 'starter';

  return (
    <div className="relative my-6 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl p-8 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        {isStarter ? "Unlock unlimited content" : "Unlock all generated content"}
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {!user
          ? "Sign up and subscribe to access all social posts, blog articles, case studies, and more scans."
          : isStarter
          ? "Upgrade to Pro ($40/mo) for unlimited scans, all content, and regeneration with preferences."
          : "Upgrade to Starter ($10/mo) for 5 scans and more content, or Pro ($40/mo) for unlimited everything."}
      </p>

      {user ? (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {!isStarter && (
            <Button variant="outline" size="lg" onClick={() => handleUpgrade('starter')} disabled={loading}>
              Starter — $10/mo
            </Button>
          )}
          <Button variant="gradient" size="lg" onClick={() => handleUpgrade('pro')} disabled={loading}>
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? "Opening checkout…" : "Pro — $40/mo"}
          </Button>
        </div>
      ) : (
        <Button variant="gradient" size="lg" asChild>
          <Link to="/auth" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Sign up to get started
          </Link>
        </Button>
      )}
    </div>
  );
}
