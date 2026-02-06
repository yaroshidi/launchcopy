import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function LockedContentOverlay() {
  const { user } = useAuth();

  return (
    <div className="relative my-6 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl p-8 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        Unlock all generated content
      </h3>

      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {user
          ? "Upgrade your plan to access all social posts, blog articles, and case studies."
          : "Sign up to access all social posts, blog articles, and case studies generated for your repo."}
      </p>

      <Button variant="gradient" size="lg" asChild>
        <Link to="/auth" className="gap-2">
          <Sparkles className="w-4 h-4" />
          {user ? "Upgrade to unlock" : "Sign up to unlock"}
        </Link>
      </Button>
    </div>
  );
}
