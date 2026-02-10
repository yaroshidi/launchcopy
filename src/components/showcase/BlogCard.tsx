import { Clock } from "lucide-react";

export function BlogCard() {
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
        build infrastructure and never looked back.
      </p>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
          LC
        </div>
        <span className="text-xs text-muted-foreground">by LaunchCopy AI</span>
      </div>
    </div>
  );
}
