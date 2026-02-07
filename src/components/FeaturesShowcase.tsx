import { motion } from "framer-motion";
import { ContentShowcase } from "@/components/ContentShowcase";
import { Badge } from "@/components/ui/badge";

interface FeatureCard {
  badge: string;
  title: string;
  description: string;
}

const LEFT_FEATURES: FeatureCard[] = [
  {
    badge: "AI Quality",
    title: "Two-Pass Refinement",
    description:
      "Content is generated then refined by a second AI pass for clarity, tone, and impact.",
  },
  {
    badge: "Deep Analysis",
    title: "Real Codebase Analysis",
    description:
      "We read your README, file structure, and dependencies — not just the repo name.",
  },
  {
    badge: "Multi-Platform",
    title: "Platform-Optimized",
    description:
      "Each piece is formatted for its target — X threads, LinkedIn carousels, SEO blogs.",
  },
];

const RIGHT_FEATURES: FeatureCard[] = [
  {
    badge: "Content Scoring",
    title: "Quality Scored",
    description:
      "Every generated piece gets an AI quality score so you know what's ready to ship.",
  },
  {
    badge: "Publish-Ready",
    title: "Ready to Copy & Post",
    description:
      "Export as markdown, copy threads, or grab blog posts — no reformatting needed.",
  },
  {
    badge: "SEO",
    title: "SEO-Optimized Structure",
    description:
      "Blog posts include meta descriptions, headers, and keyword placement out of the box.",
  },
];

function FeatureCardItem({
  feature,
  index,
}: {
  feature: FeatureCard;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass-card rounded-xl border border-border/50 p-4 space-y-2"
    >
      <Badge
        variant="secondary"
        className="text-[10px] uppercase tracking-wider font-semibold"
      >
        {feature.badge}
      </Badge>
      <h3 className="text-sm font-bold text-foreground">{feature.title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
}

export function FeaturesShowcase() {
  return (
    <section id="showcase" className="relative px-6 md:px-10 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider"
        >
          See what we generate
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_220px] gap-6 items-start">
          {/* Left feature cards */}
          <div className="hidden lg:flex flex-col gap-4 pt-6">
            {LEFT_FEATURES.map((f, i) => (
              <FeatureCardItem key={f.title} feature={f} index={i} />
            ))}
          </div>

          {/* Center showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <ContentShowcase />
          </motion.div>

          {/* Right feature cards */}
          <div className="hidden lg:flex flex-col gap-4 pt-6">
            {RIGHT_FEATURES.map((f, i) => (
              <FeatureCardItem key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>

        {/* Mobile: show feature cards in a 2-col grid below */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {[...LEFT_FEATURES, ...RIGHT_FEATURES].map((f, i) => (
            <FeatureCardItem key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
