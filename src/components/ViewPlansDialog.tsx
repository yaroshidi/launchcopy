import { useState } from "react";
import { Check, X, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { AnimatePresence, motion } from "framer-motion";

interface ViewPlansDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

const FREE_FEATURES: PlanFeature[] = [
  { text: "1 repository scan", included: true },
  { text: "Full product summary", included: true },
  { text: "1 social post preview", included: true },
  { text: "1 blog post preview", included: true },
  { text: "1 case study preview", included: true },
  { text: "Export & copy content", included: false },
  { text: "Regenerate with preferences", included: false },
];

const STARTER_FEATURES: PlanFeature[] = [
  { text: "1 complete scan per day", included: true },
  { text: "All social posts", included: true },
  { text: "All blog articles", included: true },
  { text: "All case studies", included: true },
  { text: "Export & copy content", included: true },
  { text: "Regenerate with preferences", included: false },
];

const PRO_FEATURES: PlanFeature[] = [
  { text: "Unlimited repository scans", included: true },
  { text: "Unlimited content", included: true },
  { text: "Export & copy content", included: true },
  { text: "Regenerate with preferences", included: true },
];

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {feature.included ? (
        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
      )}
      <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
        {feature.text}
      </span>
    </li>
  );
}

function PlansContent({ onClose }: { onClose: () => void }) {
  const { tier } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const handleCheckout = async (planTier: "starter" | "pro") => {
    setLoading(planTier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: planTier, promoCode: promoCode.trim() || undefined },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    } finally {
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading("manage");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Portal error:", e);
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "Try it out",
      features: FREE_FEATURES,
      tier: "free" as const,
      highlight: false,
    },
    {
      name: "Starter",
      price: "$10",
      desc: "1 scan/day, all content",
      features: STARTER_FEATURES,
      tier: "starter" as const,
      highlight: false,
    },
    {
      name: "Pro",
      price: "$40",
      desc: "Unlimited everything",
      features: PRO_FEATURES,
      tier: "pro" as const,
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
      {plans.map((plan) => {
        const isCurrent = tier === plan.tier;
        return (
          <div
            key={plan.tier}
            className={`rounded-xl border p-4 space-y-3 ${
              plan.highlight
                ? "border-primary/40 bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{plan.desc}</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {plan.price}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
            </div>

            <ul className="space-y-1.5">
              {plan.features.map((f) => (
                <FeatureRow key={f.text} feature={f} />
              ))}
            </ul>

            {/* Actions */}
            {isCurrent ? (
              plan.tier !== "free" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleManage}
                  disabled={loading === "manage"}
                >
                  {loading === "manage" && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Manage Subscription
                </Button>
              ) : null
            ) : plan.tier !== "free" ? (
              <div className="space-y-2">
                <Button
                  size="sm"
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  onClick={() => handleCheckout(plan.tier as "starter" | "pro")}
                  disabled={!!loading}
                >
                  {loading === plan.tier && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {tier !== "free" && plan.tier === "pro" ? "Upgrade to Pro" : 
                   tier === "pro" ? "Downgrade to Starter" :
                   `Get ${plan.name}`}
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Promo code */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowPromo(!showPromo)}
          className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Tag className="w-3 h-3" />
          {showPromo ? "Hide promo code" : "Have a promo code?"}
        </button>
        <AnimatePresence>
          {showPromo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2"
            >
              <Input
                placeholder="Enter code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Code will be applied at checkout
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ViewPlansDialog({ open, onOpenChange }: ViewPlansDialogProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Plans & Pricing</DrawerTitle>
            <DrawerDescription>Choose the plan that works for you.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            <PlansContent onClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plans & Pricing</DialogTitle>
          <DialogDescription>Choose the plan that works for you.</DialogDescription>
        </DialogHeader>
        <PlansContent onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
