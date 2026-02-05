import { motion } from "framer-motion";
import { RepoInput } from "@/components/RepoInput";
import { ContentShowcase } from "@/components/ContentShowcase";
import type { ContentPreferences } from "@/types/analysis";

interface HeroProps {
  onAnalyze: (url: string, githubToken?: string, preferences?: ContentPreferences) => void;
  isLoading: boolean;
}

export function Hero({ onAnalyze, isLoading }: HeroProps) {
  return (
    <section className="min-h-screen pt-24 pb-16 px-6 md:px-10 flex items-center">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-16 items-center">
        {/* Left column — copy + input */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              AI Content Engine
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.08] tracking-[-0.02em] text-foreground">
              Transform any{" "}
              <span className="gradient-text">GitHub repo</span>{" "}
              into marketing gold.
            </h1>

            <p className="text-base text-muted-foreground max-w-md leading-relaxed">
              Paste a repo URL — get social posts, blog articles, and case studies 
              written by AI that actually understands the code.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <RepoInput onAnalyze={onAnalyze} isLoading={isLoading} />
          </motion.div>
        </div>

        {/* Right column — animated showcase */}
        <div className="hidden lg:flex items-center justify-center">
          <ContentShowcase />
        </div>
      </div>
    </section>
  );
}
