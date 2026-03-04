import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 – Page Not Found | LaunchCopy";
  }, []);

  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center px-4 relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-md"
      >
        <h1 className="text-8xl font-display text-primary mb-4">404</h1>
        <p className="text-xl text-foreground font-medium mb-2">Page not found</p>
        <p className="text-muted-foreground mb-8">
          The page <span className="font-mono text-sm bg-secondary/80 px-2 py-0.5 rounded">{location.pathname}</span> doesn't exist.
        </p>
        <Button size="lg" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
