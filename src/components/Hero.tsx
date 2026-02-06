import { useState } from "react";
import { motion } from "framer-motion";
import { RepoInput } from "@/components/RepoInput";

import type { ContentPreferences } from "@/types/analysis";

interface HeroProps {
  onAnalyze: (url: string, githubToken?: string, preferences?: ContentPreferences) => void;
  isLoading: boolean;
}

const EXAMPLE_REPOS = [
  { label: "vercel/next.js", url: "https://github.com/vercel/next.js" },
  { label: "shadcn-ui/ui", url: "https://github.com/shadcn-ui/ui" },
  { label: "supabase/supabase", url: "https://github.com/supabase/supabase" },
];

export function Hero({ onAnalyze, isLoading }: HeroProps) {
  const [prefillUrl, setPrefillUrl] = useState("");

  return (
    <section className="relative pt-32 pb-20 px-6 md:px-10 flex flex-col items-center overflow-hidden">
      {/* Radial glow behind heading */}
      <div className="hero-glow" />

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground">
            Your repo already has a <span className="gradient-text">story.</span>
            <br />
            <span className="text-muted-foreground">We help you tell it.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Drop a GitHub URL — our AI reads the code, understands the architecture,
            and writes marketing content that developers actually want to share.
          </p>
        </motion.div>

        {/* Repo input */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="w-full max-w-2xl"
        >
          <RepoInput
            onAnalyze={onAnalyze}
            isLoading={isLoading}
            prefillUrl={prefillUrl}
          />
        </motion.div>

        {/* Suggestion chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground/60 mr-1 self-center">Try:</span>
          {EXAMPLE_REPOS.map((repo) => (
            <button
              key={repo.label}
              type="button"
              onClick={() => setPrefillUrl(repo.url)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-full border border-border/50 bg-secondary/40 hover:bg-secondary hover:text-foreground hover:border-border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {repo.label}
            </button>
          ))}
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex items-center justify-center gap-4 pt-2"
        >
          <div className="flex -space-x-2">
            {["AD", "KM", "RS", "JL"].map((initials, i) => (
              <div
                key={initials}
                className="w-7 h-7 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold"
                style={{
                  background: `hsl(${199 + i * 40} 60% ${45 + i * 5}%)`,
                  color: "hsl(0 0% 100%)",
                }}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">2,400+</span> repos analyzed this month
          </p>
        </motion.div>
      </div>
    </section>
  );
}
