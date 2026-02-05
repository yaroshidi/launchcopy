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
    <section className="relative min-h-screen pt-20 pb-12 px-6 md:px-10 flex items-center overflow-hidden">

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        {/* Left — copy + input */}
        <div className="space-y-8">

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.08] tracking-[-0.02em] text-foreground">
              Your repo
              <br />
              already has a{" "}
              <span className="gradient-text">story.</span>
              <br />
              <span className="text-muted-foreground">We help you tell it.</span>
            </h1>

            <p className="text-base text-muted-foreground max-w-lg leading-relaxed">
              Drop a GitHub URL — our AI reads the code, understands the architecture,
              and writes marketing content that developers actually want to share.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <RepoInput onAnalyze={onAnalyze} isLoading={isLoading} />
          </motion.div>

          {/* Social proof strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-4 pt-2"
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

        {/* Right — showcase */}
        <div className="hidden lg:block">
          <ContentShowcase />
        </div>
      </div>
    </section>
  );
}
