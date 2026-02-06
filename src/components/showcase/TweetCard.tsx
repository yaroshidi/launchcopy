import { Heart, MessageCircle, Repeat2 } from "lucide-react";

export function TweetCard() {
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
        The DX is unmatched. Zero config, intelligent caching, and it just works.
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
