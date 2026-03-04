import { motion } from "framer-motion";
import { ContentShowcase } from "@/components/ContentShowcase";

interface Feature {
  number: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    number: "01",
    title: "Real Codebase Analysis",
    description:
      "We read your README, file structure, and dependencies — not just the repo name. A two-pass AI refinement ensures clarity, tone, and impact.",
  },
  {
    number: "02",
    title: "Platform-Optimized Output",
    description:
      "Each piece is formatted for its target — X threads, LinkedIn carousels, SEO-optimized blog posts with meta descriptions and keyword placement.",
  },
  {
    number: "03",
    title: "Quality Scored & Publish-Ready",
    description:
      "Every generated piece gets an AI quality score so you know what's ready to ship. Export as markdown, copy threads, or grab blog posts — no reformatting needed.",
  },
];

export function FeaturesShowcase() {
  return (
    <section id="showcase" className="relative px-6 md:px-10 pt-24 pb-24">
      <div className="max-w-5xl mx-auto space-y-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            See what we generate
          </h2>
        </motion.div>

        {/* Editorial numbered features */}
        <div className="space-y-12 max-w-2xl mx-auto">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex gap-6"
            >
              <span className="text-3xl font-display text-primary shrink-0 leading-tight">
                {f.number}
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Accent line */}
        <div className="accent-line max-w-xs mx-auto" />

        {/* Center showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <ContentShowcase />
        </motion.div>
      </div>
    </section>
  );
}
