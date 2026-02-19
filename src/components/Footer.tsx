import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="relative px-6 md:px-10 pt-16 pb-8 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="text-lg font-display text-foreground">
              LaunchCopy
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              Turn any GitHub repo into launch-ready marketing content with AI.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Product
            </p>
            <ul className="space-y-2">
              <li>
                <a href="#showcase" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              {user ? (
                <li>
                  <Link to="/my-scans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
              ) : (
                <li>
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Legal
            </p>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Connect
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  X / Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-border" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} LaunchCopy. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with AI, shipped with confidence.
          </p>
        </div>
      </div>
    </footer>
  );
}
