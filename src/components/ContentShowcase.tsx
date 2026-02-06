import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, FileText, BarChart3 } from "lucide-react";
import { TweetCard } from "@/components/showcase/TweetCard";
import { BlogCard } from "@/components/showcase/BlogCard";
import { CaseStudyCard } from "@/components/showcase/CaseStudyCard";

const TABS = ["Social Posts", "Blog", "Case Studies"] as const;
type TabType = (typeof TABS)[number];

const TAB_ICONS: Record<TabType, React.ReactNode> = {
  "Social Posts": <MessageCircle className="w-3.5 h-3.5" />,
  "Blog": <FileText className="w-3.5 h-3.5" />,
  "Case Studies": <BarChart3 className="w-3.5 h-3.5" />,
};

const CONTENT: Record<TabType, React.ReactNode> = {
  "Social Posts": <TweetCard />,
  "Blog": <BlogCard />,
  "Case Studies": <CaseStudyCard />,
};

export function ContentShowcase() {
  const [activeTab, setActiveTab] = useState<TabType>("Social Posts");
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextTab = useCallback(() => {
    setActiveTab((prev) => {
      const idx = TABS.indexOf(prev);
      return TABS[(idx + 1) % TABS.length];
    });
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timeout = setTimeout(() => {
      timerRef.current = setInterval(nextTab, 7000);
    }, 100);
    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextTab]);

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Glassmorphism outer container */}
      <div className="relative rounded-2xl bg-card/15 backdrop-blur-2xl border border-border/15 shadow-2xl overflow-hidden transition-shadow duration-500 hover:shadow-glow">
        {/* Ambient glow effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/8 rounded-full blur-[80px] pointer-events-none" />

        {/* Top gradient accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />

        <div className="relative p-5">
          {/* Pill-style tab bar */}
          <div className="flex items-center gap-1 bg-background/30 backdrop-blur-md rounded-xl p-1 mb-5 border border-border/10">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-colors flex-1 justify-center ${
                  activeTab === tab
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="showcase-tab"
                    className="absolute inset-0 bg-card/70 backdrop-blur-sm rounded-lg shadow-lg border border-border/15"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {TAB_ICONS[tab]}
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* Content card */}
          <div className="relative rounded-xl bg-card/40 backdrop-blur-md border border-border/10 overflow-hidden min-h-[270px]">
            {/* Progress bar for auto-cycle */}
            {!isPaused && (
              <motion.div
                key={activeTab + "-progress"}
                className="absolute top-0 left-0 h-[1.5px] bg-gradient-to-r from-primary/60 to-accent/60"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 7, ease: "linear" }}
              />
            )}

            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {CONTENT[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom gradient accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent" />
      </div>
    </div>
  );
}
