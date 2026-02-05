import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Repeat2, Clock, Building2, ArrowUpRight } from "lucide-react";

const TABS = ["Social Posts", "Blog", "Case Studies"] as const;
type TabType = (typeof TABS)[number];

/* ---- Individual content cards ---- */

function TweetCard() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          JD
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Jane Developer</p>
          <p className="text-xs text-muted-foreground">@janedev · 2h</p>
        </div>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">
        Just discovered an incredible CLI tool that cut our build times by 60%. 
        The DX is unmatched — zero config, intelligent caching, and it just works. 
        If you're still waiting on slow builds, you need this. 🚀
      </p>
      <div className="flex items-center gap-6 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors cursor-pointer">
          <Heart className="w-3.5 h-3.5" /> 284
        </span>
        <span className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors cursor-pointer">
          <Repeat2 className="w-3.5 h-3.5" /> 89
        </span>
        <span className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors cursor-pointer">
          <MessageCircle className="w-3.5 h-3.5" /> 42
        </span>
      </div>
    </div>
  );
}

function BlogCard() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>8 min read</span>
        <span className="text-border">·</span>
        <span className="text-primary font-medium">Developer Tools</span>
      </div>
      <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">
        10 Features That Make This the Fastest Build Tool in 2025
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        From intelligent dependency resolution to parallel execution pipelines, 
        here's why teams at Stripe, Vercel, and Linear switched their entire 
        build infrastructure—and never looked back.
      </p>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
          RC
        </div>
        <span className="text-xs text-muted-foreground">by RepoToContent AI</span>
      </div>
    </div>
  );
}

function CaseStudyCard() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          Case Study
        </span>
      </div>
      <h3 className="text-lg font-bold text-foreground leading-tight tracking-tight">
        How Acme Corp Scaled Their CI/CD Pipeline to 10x Throughput
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-xl font-bold text-primary">60%</p>
          <p className="text-[11px] text-muted-foreground">Faster Builds</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-xl font-bold text-primary">10x</p>
          <p className="text-[11px] text-muted-foreground">Throughput</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50">
          <p className="text-xl font-bold text-primary">$240k</p>
          <p className="text-[11px] text-muted-foreground">Saved/Year</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        "Switching was the best engineering decision we made this year. 
        Our team ships twice as fast now."
      </p>
    </div>
  );
}

const CONTENT: Record<TabType, React.ReactNode> = {
  "Social Posts": <TweetCard />,
  "Blog": <BlogCard />,
  "Case Studies": <CaseStudyCard />,
};

/* ---- Main showcase ---- */

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
    // Small initial delay to avoid race with React 18 StrictMode double-mount
    const timeout = setTimeout(() => {
      timerRef.current = setInterval(nextTab, 4000);
    }, 100);
    return () => {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextTab]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="showcase-tab"
                className="absolute inset-0 bg-secondary rounded-md"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{tab}</span>
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden min-h-[280px]">
        {/* Accent top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        {/* Progress bar for auto-cycle */}
        {!isPaused && (
          <motion.div
            key={activeTab + "-progress"}
            className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-primary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
          />
        )}

        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {CONTENT[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Label */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-muted-foreground/60">
        <ArrowUpRight className="w-3 h-3" />
        <span>AI-generated from repo analysis</span>
      </div>
    </motion.div>
  );
}
