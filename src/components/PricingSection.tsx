import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  { text: "5 repository scans", included: true },
  { text: "Full product summary", included: true },
  { text: "3 social posts per scan", included: true },
  { text: "2 blog articles per scan", included: true },
  { text: "2 case studies per scan", included: true },
  { text: "Export & copy content", included: true },
  { text: "Regenerate with preferences", included: false },
];

const PRO_FEATURES: PlanFeature[] = [
  { text: "Unlimited repository scans", included: true },
  { text: "Full product summary", included: true },
  { text: "Unlimited social posts", included: true },
  { text: "Unlimited blog articles", included: true },
  { text: "Unlimited case studies", included: true },
  { text: "Export & copy content", included: true },
  { text: "Regenerate with preferences", included: true },
];

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {feature.included ? (
        <Check className="w-4 h-4 text-primary shrink-0" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/50 shrink-0" />
      )}
      <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
        {feature.text}
      </span>
    </li>
  );
}

export function PricingSection() {
  const { user, tier } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  const handleCheckout = async (planTier: 'starter' | 'pro') => {
    setLoading(planTier);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: planTier },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error('Checkout error:', e);
    } finally {
      setLoading(null);
    }
  };

  const handleManage = async () => {
    setLoading('manage');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (e) {
      console.error('Portal error:', e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="relative px-6 md:px-10 py-24">
      <div className="max-w-5xl mx-auto space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            Simple, <span className="accent-text">transparent</span> pricing
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Start for free, upgrade when you need more scans and content.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl bg-card border border-border p-6 flex flex-col"
          >
            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-semibold text-foreground">Free</h3>
              <p className="text-2xl font-bold text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">Try it out with one scan</p>
            </div>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <FeatureRow key={f.text} feature={f} />
              ))}
            </ul>
            <div className="mt-8">
              {user && tier === 'free' ? (
                <Button variant="outline" className="w-full" disabled>Current plan</Button>
              ) : !user ? (
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/auth">Sign up free</Link>
                </Button>
              ) : null}
            </div>
          </motion.div>

          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="relative rounded-2xl bg-card border border-border p-6 flex flex-col"
          >
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Starter</h3>
                {tier === 'starter' && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    Your plan
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">$10<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">More scans & expanded content</p>
            </div>
            <ul className="space-y-3 flex-1">
              {STARTER_FEATURES.map((f) => (
                <FeatureRow key={f.text} feature={f} />
              ))}
            </ul>
            <div className="mt-8 space-y-3">
              {tier === 'starter' ? (
                <Button variant="outline" className="w-full" onClick={handleManage} disabled={loading === 'manage'}>
                  {loading === 'manage' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Manage subscription
                </Button>
              ) : tier === 'pro' ? null : user ? (
                <>
                  <Button className="w-full" onClick={() => handleCheckout('starter')} disabled={!!loading}>
                    {loading === 'starter' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Get Starter
                  </Button>
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
                      >
                        <Input
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="h-8 text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Code will be applied at checkout
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Button className="w-full" asChild>
                  <Link to="/auth">Sign up & upgrade</Link>
                </Button>
              )}
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative rounded-2xl bg-card border-l-2 border border-border border-l-primary p-6 flex flex-col"
          >
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Pro</h3>
                {tier === 'pro' && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    Your plan
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">$40<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground">Unlimited scans & full content</p>
            </div>
            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <FeatureRow key={f.text} feature={f} />
              ))}
            </ul>
            <div className="mt-8">
              {tier === 'pro' ? (
                <Button variant="outline" className="w-full" onClick={handleManage} disabled={loading === 'manage'}>
                  {loading === 'manage' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Manage subscription
                </Button>
              ) : user ? (
                <Button className="w-full" onClick={() => handleCheckout('pro')} disabled={!!loading}>
                  {loading === 'pro' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Upgrade to Pro
                </Button>
              ) : (
                <Button className="w-full" asChild>
                  <Link to="/auth">Sign up & upgrade</Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          Join <span className="accent-text font-semibold">2,400+</span>{" "}
          developers already generating content
        </motion.p>
      </div>
    </section>
  );
}
