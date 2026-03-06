import { useRef, useEffect, useState, useCallback } from "react";

const W = 280;
const H = 360;
const ROCKET_SIZE = 24;

interface Obj {
  x: number;
  y: number;
  speed: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function WaitGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = sessionStorage.getItem("waitgame_best");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [alive, setAlive] = useState(false);
  const [started, setStarted] = useState(false);

  const rx = useRef(W / 2);
  const asteroids = useRef<Obj[]>([]);
  const pickups = useRef<Obj[]>([]);
  const particles = useRef<Particle[]>([]);
  const bgDots = useRef<{ x: number; y: number; a: number; s: number }[]>([]);
  const scoreRef = useRef(0);
  const frame = useRef(0);
  const keys = useRef<Set<string>>(new Set());
  const deadRef = useRef(false);
  const rafRef = useRef(0);

  const initBg = useCallback(() => {
    bgDots.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      a: Math.random() * 0.5 + 0.15,
      s: Math.random() * 0.4 + 0.15,
    }));
  }, []);

  const spawn = useCallback((count: number) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x: rx.current,
        y: H - 36,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -4 - 1,
        life: 20 + Math.random() * 15,
        color: ["#f59e0b", "#ef4444", "#fb923c"][Math.floor(Math.random() * 3)],
      });
    }
  }, []);

  const reset = useCallback(() => {
    rx.current = W / 2;
    asteroids.current = [];
    pickups.current = [];
    particles.current = [];
    scoreRef.current = 0;
    frame.current = 0;
    deadRef.current = false;
    setScore(0);
    setAlive(true);
    setStarted(true);
    initBg();
  }, [initBg]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    initBg();

    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (!started || deadRef.current) reset();
    };
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.key);

    const onPtr = (e: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      rx.current = ((e.clientX - rect.left) / rect.width) * W;
      if (!started || deadRef.current) reset();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    c.addEventListener("pointermove", onPtr);
    c.addEventListener("pointerdown", onPtr);

    const loop = () => {
      frame.current++;

      // Background
      ctx.fillStyle = "#0a0908";
      ctx.fillRect(0, 0, W, H);

      // Starfield
      bgDots.current.forEach((d) => {
        d.y += d.s;
        if (d.y > H) { d.y = 0; d.x = Math.random() * W; }
        ctx.fillStyle = `rgba(255,255,255,${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Idle / game-over screen
      if (!started || deadRef.current) {
        ctx.textAlign = "center";
        if (deadRef.current) {
          // Explosion particles still render
          particles.current = particles.current.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.life--;
            if (p.life <= 0) return false;
            ctx.globalAlpha = p.life / 35;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            return true;
          });

          ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif";
          ctx.fillStyle = "#f59e0b";
          ctx.fillText("Game Over", W / 2, H / 2 - 20);
          ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText(`Score: ${scoreRef.current}`, W / 2, H / 2 + 8);
          ctx.fillText("Tap or press any key", W / 2, H / 2 + 34);
        } else {
          ctx.font = "28px serif";
          ctx.fillText("\u{1F680}", W / 2, H / 2 - 28);
          ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText("Dodge asteroids, collect stars", W / 2, H / 2 + 8);
          ctx.fillText("Arrow keys or drag to move", W / 2, H / 2 + 28);
          ctx.fillStyle = "#f59e0b";
          ctx.fillText("Tap or press any key to start", W / 2, H / 2 + 56);
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Movement
      const spd = 5;
      if (keys.current.has("ArrowLeft") || keys.current.has("a")) rx.current -= spd;
      if (keys.current.has("ArrowRight") || keys.current.has("d")) rx.current += spd;
      rx.current = Math.max(14, Math.min(W - 14, rx.current));

      // Difficulty ramp
      const diff = Math.min(frame.current / 600, 2.5);

      // Spawn asteroids
      if (Math.random() < 0.025 + diff * 0.008) {
        asteroids.current.push({
          x: Math.random() * (W - 30) + 15,
          y: -20,
          speed: 1.8 + Math.random() * 1.5 + diff,
          size: 18 + Math.random() * 12,
        });
      }

      // Spawn pickups
      if (Math.random() < 0.008) {
        pickups.current.push({
          x: Math.random() * (W - 24) + 12,
          y: -14,
          speed: 1.2 + Math.random() * 1.2,
          size: 14,
        });
      }

      const rocketY = H - 42;

      // Update asteroids
      asteroids.current = asteroids.current.filter((a) => {
        a.y += a.speed;
        if (a.y > H + 30) return false;

        const dx = a.x - rx.current;
        const dy = a.y - rocketY;
        if (Math.sqrt(dx * dx + dy * dy) < (a.size + ROCKET_SIZE) * 0.38) {
          deadRef.current = true;
          setAlive(false);
          const newBest = Math.max(best, scoreRef.current);
          setBest(newBest);
          sessionStorage.setItem("waitgame_best", String(newBest));
          spawn(24);
          return false;
        }

        ctx.font = `${a.size}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("\u2604\uFE0F", a.x, a.y);
        return true;
      });

      // Update pickups
      pickups.current = pickups.current.filter((p) => {
        p.y += p.speed;
        if (p.y > H + 20) return false;

        const dx = p.x - rx.current;
        const dy = p.y - rocketY;
        if (Math.sqrt(dx * dx + dy * dy) < (p.size + ROCKET_SIZE) * 0.45) {
          scoreRef.current += 15;
          setScore(scoreRef.current);
          // sparkle
          for (let i = 0; i < 6; i++) {
            particles.current.push({
              x: p.x, y: p.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 12, color: "#facc15",
            });
          }
          return false;
        }

        ctx.font = `${p.size}px serif`;
        ctx.textAlign = "center";
        ctx.fillText("\u2B50", p.x, p.y);
        return true;
      });

      // Particles
      particles.current = particles.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life--;
        if (p.life <= 0) return false;
        ctx.globalAlpha = p.life / 25;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // Passive score
      if (frame.current % 8 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Rocket exhaust
      if (frame.current % 3 === 0) {
        particles.current.push({
          x: rx.current + (Math.random() - 0.5) * 6,
          y: rocketY + 14,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 2 + 1,
          life: 10 + Math.random() * 6,
          color: Math.random() > 0.5 ? "#f59e0b" : "#fb923c",
        });
      }

      // Draw rocket
      ctx.font = `${ROCKET_SIZE}px serif`;
      ctx.textAlign = "center";
      ctx.fillText("\u{1F680}", rx.current, rocketY);

      // HUD
      ctx.fillStyle = "#f59e0b";
      ctx.font = "600 13px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${scoreRef.current}`, 10, 22);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      c.removeEventListener("pointermove", onPtr);
      c.removeEventListener("pointerdown", onPtr);
    };
  }, [started, alive, initBg, reset, spawn, best]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
          Mini Game
        </span>
        {best > 0 && (
          <span className="text-xs text-primary font-mono">Best: {best}</span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-border/60 cursor-pointer"
        style={{ width: W, height: H, touchAction: "none" }}
      />
    </div>
  );
}
