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
      <Link to="/" className="text-lg font-bold tracking-tight gradient-text hover:opacity-80 transition-opacity">
        LaunchCopy
      </Link>

      <div className="flex items-center gap-4">
        {!user && (
          <>
            <a
              href="#showcase"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              How it works
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
            >
              Pricing
            </a>
          </>
        )}
        {user && (
          <Link
            to="/my-scans"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
          >
            Dashboard
          </Link>
        )}
        {user ? (
          <UserMenu />
        ) : (
          <Button variant="outline" size="sm" className="text-foreground" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </motion.nav>
  );
}
