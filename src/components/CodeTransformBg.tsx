import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CODE_LINES = [
  'export async function fetchData(url: string) {',
  '  const response = await fetch(url);',
  '  if (!response.ok) throw new Error(response.statusText);',
  '  return response.json();',
  '}',
  'interface Config { cache: boolean; ttl: number; }',
  'const pipeline = tasks.map(t => t.execute());',
  'await Promise.all(pipeline);',
  'console.log("Build complete in", elapsed, "ms");',
  'export default defineConfig({ plugins: [react()] });',
  'const hash = crypto.createHash("sha256").update(data);',
  'if (process.env.NODE_ENV === "production") {',
  '  enableCaching({ maxAge: 3600 });',
  '}',
  'return results.filter(r => r.status === "success");',
];

const CONTENT_LINES = [
  "Ship faster with zero-config builds",
  "Cut your CI pipeline time by 60%",
  "The developer tool teams actually love",
  "Built for scale, designed for speed",
  "From code to production in seconds",
  "Intelligent caching that just works",
  "10x throughput, half the infrastructure",
  "The build tool behind top startups",
  "Stop waiting. Start shipping.",
  "Enterprise-grade, developer-friendly",
  "Your code deserves better tooling",
  "Parallel execution, zero overhead",
  "One config file. Infinite possibilities.",
  "Built by engineers, for engineers",
  "The future of build infrastructure",
];

interface FloatingLine {
  id: number;
  code: string;
  content: string;
  x: number;
  y: number;
  phase: "code" | "morph" | "content" | "fade";
}

let lineId = 0;

export function CodeTransformBg() {
  const [lines, setLines] = useState<FloatingLine[]>([]);

  useEffect(() => {
    // Spawn a new line every ~2.5s
    const spawn = () => {
      const id = lineId++;
      const newLine: FloatingLine = {
        id,
        code: CODE_LINES[id % CODE_LINES.length],
        content: CONTENT_LINES[id % CONTENT_LINES.length],
        x: Math.random() * 80 + 5, // 5-85% from left
        y: Math.random() * 70 + 10, // 10-80% from top
        phase: "code",
      };

      setLines((prev) => [...prev.slice(-8), newLine]); // keep max 9

      // Morph after 2s
      setTimeout(() => {
        setLines((prev) =>
          prev.map((l) => (l.id === id ? { ...l, phase: "morph" } : l))
        );
      }, 1800);

      // Show content after 3s
      setTimeout(() => {
        setLines((prev) =>
          prev.map((l) => (l.id === id ? { ...l, phase: "content" } : l))
        );
      }, 2800);

      // Fade out after 5.5s
      setTimeout(() => {
        setLines((prev) =>
          prev.map((l) => (l.id === id ? { ...l, phase: "fade" } : l))
        );
      }, 5500);

      // Remove after 6.5s
      setTimeout(() => {
        setLines((prev) => prev.filter((l) => l.id !== id));
      }, 6800);
    };

    spawn(); // initial
    const interval = setInterval(spawn, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Subtle gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />

      <AnimatePresence>
        {lines.map((line) => (
          <motion.div
            key={line.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: line.phase === "fade" ? 0 : 1,
              scale: 1,
              y: line.phase === "fade" ? -10 : 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute whitespace-nowrap"
            style={{ left: `${line.x}%`, top: `${line.y}%` }}
          >
            {line.phase === "code" && (
              <span className="font-mono text-[11px] text-primary/[0.12] select-none">
                {line.code}
              </span>
            )}
            {line.phase === "morph" && (
              <motion.span
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                className="font-mono text-[11px] text-accent/[0.18] select-none"
              >
                {line.content}
              </motion.span>
            )}
            {(line.phase === "content" || line.phase === "fade") && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: line.phase === "fade" ? 0 : 1 }}
                className="text-xs font-medium text-foreground/[0.07] select-none"
              >
                {line.content}
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
