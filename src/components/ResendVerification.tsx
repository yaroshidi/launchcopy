import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, RefreshCw } from "lucide-react";

interface ResendVerificationProps {
  email: string;
}

export default function ResendVerification({ email }: ResendVerificationProps) {
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setStatus("error");
      } else {
        setStatus("sent");
        setCooldown(60);
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <div className="space-y-4 pt-2">
      <Alert className="border-primary/20 bg-primary/5">
        <Mail className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-muted-foreground">
          We sent a verification link to <strong className="text-foreground">{email}</strong>.
          Check your inbox and spam/junk folder.
        </AlertDescription>
      </Alert>

      {status === "sent" && (
        <p className="text-sm text-green-400 text-center">
          ✓ Verification email resent! Check your inbox.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm text-destructive text-center">
          Failed to resend. Please try again later.
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={handleResend}
        disabled={loading || cooldown > 0}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : "Resend verification email"}
      </Button>
    </div>
  );
}
