import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-10 bg-background/90 backdrop-blur-sm border-b border-border"
    >
      <Link to="/" className="text-xl font-display text-foreground hover:opacity-80 transition-opacity">
        LaunchCopy
      </Link>

      {/* Desktop nav */}
      <div className="hidden sm:flex items-center gap-4">
        <a
          href="#showcase"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          How it works
        </a>
        <a
          href="#pricing"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pricing
        </a>
        {user && (
          <Link
            to="/my-scans"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Mobile nav */}
      <div className="flex items-center gap-2 sm:hidden">
        {user ? <UserMenu /> : null}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetHeader>
              <SheetTitle className="font-display text-lg">LaunchCopy</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <a
                href="#showcase"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </a>
              <a
                href="#pricing"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              {user && (
                <Link
                  to="/my-scans"
                  onClick={() => setOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              )}
              {!user && (
                <Button size="sm" className="mt-2" asChild>
                  <Link to="/auth" onClick={() => setOpen(false)}>Sign In</Link>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </motion.nav>
  );
}
