import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export function LockedContentOverlay() {
  const { user, isPro } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
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

  if (isPro) return null;

  return (
    <div className="relative my-6 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl p-8 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        Unlock all generated content
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {user
          ? "Upgrade to Pro ($40/mo) to access all social posts, blog articles, case studies, and unlimited scans."
          : "Sign up and subscribe to Pro ($40/mo) to access all content and unlimited scans."}
      </p>

      {user ? (
        <Button variant="gradient" size="lg" onClick={handleUpgrade} disabled={loading}>
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? "Opening checkout…" : "Upgrade to Pro — $40/mo"}
        </Button>
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
