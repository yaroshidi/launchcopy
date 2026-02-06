import { Github } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user } = useAuth();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-background/60 backdrop-blur-xl border-b border-border/40"
    >
      <span className="text-lg font-bold tracking-tight gradient-text">
        RepoToContent
      </span>

      <div className="flex items-center gap-4">
        <a
          href="#showcase"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
        >
          How it works
        </a>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="GitHub"
        >
          <Github className="w-5 h-5" />
        </a>
        {user ? (
          <UserMenu />
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </motion.nav>
  );
}
