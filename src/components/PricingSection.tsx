import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PlanFeature {
  text: string;
  included: boolean;
}

const FREE_FEATURES: PlanFeature[] = [
  { text: "Analyze any public repo", included: true },
  { text: "Full product summary", included: true },
  { text: "1 social post preview", included: true },
  { text: "1 blog post preview", included: true },
  { text: "1 case study preview", included: true },
  { text: "Export & copy content", included: false },
  { text: "Regenerate with preferences", included: false },
];

const PRO_FEATURES: PlanFeature[] = [
  { text: "Analyze any public repo", included: true },
  { text: "Full product summary", included: true },
  { text: "5 social posts (3 X + 2 LinkedIn)", included: true },
  { text: "3 blog articles", included: true },
  { text: "3 case studies", included: true },
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
      <span
        className={
          feature.included ? "text-foreground" : "text-muted-foreground/60"
        }
      >
        {feature.text}
      </span>
    </li>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="relative px-6 md:px-10 py-24">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text">
            Unlock all your content
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Sign up for free to unlock every generated piece — no credit card
            required.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-2xl border border-border/50 p-6 flex flex-col"
          >
            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-bold text-foreground">Free</h3>
              <p className="text-sm text-muted-foreground">
                Try it out, no account needed
              </p>
            </div>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <FeatureRow key={f.text} feature={f} />
              ))}
            </ul>
            <div className="mt-8">
              <Button variant="outline" className="w-full" disabled>
                Current plan
              </Button>
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative glass-card rounded-2xl border border-primary/40 p-6 flex flex-col overflow-hidden"
          >
            {/* Glow accent */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Top gradient line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Pro</h3>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  Free
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Full access — just sign up
              </p>
            </div>
            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <FeatureRow key={f.text} feature={f} />
              ))}
            </ul>
            <div className="mt-8">
              <Button variant="gradient" className="w-full" asChild>
                <Link to="/auth">Sign up free</Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          Join <span className="text-foreground font-semibold">2,400+</span>{" "}
          developers already generating content
        </motion.p>
      </div>
    </section>
  );
}
