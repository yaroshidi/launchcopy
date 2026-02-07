import { Heart, MessageCircle, Repeat2, BarChart2 } from "lucide-react";

export function TweetCard() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
          JD
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground">Jane Developer</p>
            <svg className="w-4 h-4 text-blue-400" viewBox="0 0 22 22" fill="currentColor"><path d="M20.396 11c.018-.332-.04-.66-.18-.966a2.61 2.61 0 00-.497-.785l-.002-.002-.005-.005a2.6 2.6 0 00-.786-.497 2.6 2.6 0 00-.966-.18h-.003l-.003.001a2.6 2.6 0 00-.953.21 2.6 2.6 0 00-.779.529l-.002.002-.003.004a2.6 2.6 0 00-.529.779 2.6 2.6 0 00-.21.953v.003l.001.003c.019.332.077.66.21.953.133.293.313.56.529.779l.004.003.002.002c.219.216.486.396.779.529.293.133.621.191.953.21h.003l.003-.001c.332-.019.66-.077.966-.18a2.61 2.61 0 00.785-.497l.002-.002.005-.005c.216-.219.396-.486.497-.785.14-.306.198-.634.18-.966V11z" /><path d="M8.285 18.715a1 1 0 01-.543-1.843l.003-.002c.209-.12.432-.22.665-.297a5.6 5.6 0 001.602-.88 4.17 4.17 0 01-1.37-1.078l-.004-.006a4.17 4.17 0 01-.73-1.382 4.26 4.26 0 01-.182-1.26v-.003A4.26 4.26 0 017.908 10.7l-.002-.004a4.26 4.26 0 01-.182-1.26v-.003c0-.585.12-1.143.336-1.65a4.27 4.27 0 01.938-1.36 4.27 4.27 0 011.36-.938A4.22 4.22 0 0112 5.15a4.22 4.22 0 011.64.336c.507.216.967.531 1.36.938a4.27 4.27 0 01.938 1.36c.216.507.336 1.065.336 1.65v.003c0 .43-.062.85-.182 1.26l-.002.004a4.17 4.17 0 01-.73 1.382 4.17 4.17 0 01-1.37 1.078 5.6 5.6 0 001.602.88c.233.077.456.177.665.297l.003.002a1 1 0 01-.543 1.843l-.003-.002" /></svg>
          </div>
          <p className="text-xs text-muted-foreground">@janedev · 2h</p>
        </div>
        <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
        {"spent 3 hours writing marketing copy for my side project.\n\npasted the github link into this tool and got better posts in 90 seconds.\n\nthe X posts actually sound human. i'm mass-deleting my drafts 🚀"}
      </p>
      <div className="flex items-center gap-6 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors cursor-pointer">
          <MessageCircle className="w-3.5 h-3.5" /> 42
        </span>
        <span className="flex items-center gap-1.5 text-xs hover:text-emerald-400 transition-colors cursor-pointer">
          <Repeat2 className="w-3.5 h-3.5" /> 89
        </span>
        <span className="flex items-center gap-1.5 text-xs hover:text-rose-400 transition-colors cursor-pointer">
          <Heart className="w-3.5 h-3.5" /> 284
        </span>
        <span className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors cursor-pointer">
          <BarChart2 className="w-3.5 h-3.5" /> 12K
        </span>
      </div>
    </div>
  );
}
