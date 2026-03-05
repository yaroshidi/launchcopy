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
  return <section className="relative md:px-10 flex flex-col items-center overflow-hidden px-6 pt-32 md:pt-40 pb-20">
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center space-y-8">
        {/* Headline */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.5,
        delay: 0.1
      }} className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-display leading-[1.1] tracking-[-0.01em] text-foreground max-w-[800px] w-full lg:text-5xl">
            Your repo already has a{" "}
            <span className="text-primary">story.</span>
            <br />
            <span className="text-muted-foreground">We help you tell it.</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mx-auto">
            Paste a GitHub URL and let our AI turn your codebase into
            ready-to-publish social posts, blog articles, and case studies.
          </p>
        </motion.div>

        {/* Accent line */}
        <div className="accent-line w-24" />

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