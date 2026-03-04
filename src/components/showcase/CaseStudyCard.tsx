import { Building2 } from "lucide-react";

export function CaseStudyCard() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Case Study
        </span>
      </div>
      <h3 className="text-lg font-display text-foreground leading-tight">
        How Acme Corp Scaled Their CI/CD Pipeline to 10x Throughput
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xl font-bold text-primary">60%</p>
          <p className="text-[11px] text-muted-foreground">Faster Builds</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xl font-bold text-primary">10x</p>
          <p className="text-[11px] text-muted-foreground">Throughput</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xl font-bold text-primary">$240k</p>
          <p className="text-[11px] text-muted-foreground">Saved/Year</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed font-display italic">
        "Switching was the best engineering decision we made this year.
        Our team ships twice as fast now."
      </p>
    </div>
  );
}
