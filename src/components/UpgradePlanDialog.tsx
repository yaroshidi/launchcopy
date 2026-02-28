import { useState } from "react";
import { Sparkles, Loader2, Tag, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { TIERS } from "@/lib/tiers";

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradePlanDialog({ open, onOpenChange }: UpgradePlanDialogProps) {
  const { tier } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);

  const isStarter = tier === "starter";

  const handleUpgrade = async (planTier: "starter" | "pro") => {
    setLoading(planTier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: planTier, promoCode: promoCode.trim() || undefined },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onOpenChange(false);
      }
    } catch {
      toast({
        title: "Checkout failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const features = [
    "Unlimited repository scans",
    "All social posts, blogs & case studies",
    "Content regeneration with preferences",
    "Export in all formats",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            {isStarter
              ? "Unlock unlimited access by upgrading to Pro."
              : "Choose a plan to unlock more features."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Pro Plan Card */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Pro Plan</h3>
                <p className="text-2xl font-bold text-foreground">
                  $40<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Recommended
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Promo Code */}
            {showPromo ? (
              <div className="space-y-1.5">
                <Label htmlFor="promo" className="text-xs text-muted-foreground">
                  Promo Code
                </Label>
                <Input
                  id="promo"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="h-9"
                />
              </div>
            ) : (
              <button
                onClick={() => setShowPromo(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Tag className="w-3 h-3" />
                Have a promo code?
              </button>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => handleUpgrade("pro")}
              disabled={loading === "pro"}
            >
              {loading === "pro" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {loading === "pro" ? "Opening checkout…" : "Upgrade to Pro"}
            </Button>
          </div>

          {/* Starter option if on free */}
          {!isStarter && (
            <div className="rounded-xl border border-border p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Starter Plan</h3>
                <p className="text-lg font-bold text-foreground">
                  $10<span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground">5 scans, more content</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpgrade("starter")}
                disabled={loading === "starter"}
              >
                {loading === "starter" ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : null}
                {loading === "starter" ? "Opening…" : "Choose Starter"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
