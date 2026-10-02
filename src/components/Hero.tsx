import { useState } from "react";
import { motion } from "framer-motion";
import { RepoInput } from "@/components/RepoInput";
import type { ContentPreferences } from "@/types/analysis";
interface HeroProps {
  onAnalyze: (url: string, githubToken?: string, preferences?: ContentPreferences) => void;
  isLoading: boolean;
}
const EXAMPLE_REPOS = [{
  label: "vercel/next.js",
  url: "https://github.com/vercel/next.js"
}, {
  label: "shadcn-ui/ui",
  url: "https://github.com/shadcn-ui/ui"
}, {
  label: "supabase/supabase",
  url: "https://github.com/supabase/supabase"
}];
export function Hero({
  onAnalyze,
  isLoading
}: HeroProps) {
  const [prefillUrl, setPrefillUrl] = useState("");
  return <section className="relative md:px-10 flex flex-col items-center px-6 pt-36 md:pt-48 pb-24">
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="glass-subtle inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          AI launch copy from your codebase
        </motion.span>

        <motion.div initial={{ opacity: 0, y: 24, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[1.02] text-gradient">
            Your repo already has a <span className="text-gradient-accent">story.</span>
            <br />We help you tell it.
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-2xl leading-relaxed mx-auto">
            Paste a GitHub URL and let our AI turn your codebase into
            ready-to-publish social posts, blog articles, and case studies.
          </p>
        </motion.div>

        {/* Repo input */}
        <motion.div initial={{
        opacity: 0,
        y: 15
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.25
      }} className="w-full max-w-2xl">
          <RepoInput onAnalyze={onAnalyze} isLoading={isLoading} prefillUrl={prefillUrl} />
        </motion.div>

        {/* Suggestion chips */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.5,
        delay: 0.4
      }} className="flex flex-wrap justify-center gap-2">
          <span className="text-xs text-muted-foreground/60 mr-1 self-center">Try:</span>
          {EXAMPLE_REPOS.map((repo) => <button key={repo.label} type="button" onClick={() => setPrefillUrl(repo.url)} disabled={isLoading} className="px-3 py-1.5 text-xs font-medium text-muted-foreground rounded-full border border-border bg-secondary/40 hover:bg-secondary hover:text-foreground hover:border-primary/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              {repo.label}
            </button>)}
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        duration: 0.5,
        delay: 0.55
      }} className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">2,400+</span> repos analyzed this month
          </p>
        </motion.div>
      </div>
    </section>;
}