import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { User, CreditCard, Calendar, Shield, Loader2, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionDetails {
  has_subscription: boolean;
  plan_name?: string;
  plan_description?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  created?: string;
  payment_method?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  } | null;
  canceled_plan?: string;
  canceled_at?: string;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Profile() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    document.title = "Profile | LaunchCopy";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data, error } = await supabase.functions.invoke("get-subscription-details", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        setSubDetails(data);
      } catch {
        console.warn("Failed to fetch subscription details");
      } finally {
        setSubLoading(false);
      }
    };
    fetchDetails();
  }, [user]);

  const handleManageBilling = async () => {
    try {
      setBillingLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast({ title: "Unable to open billing portal", description: "Please try again later.", variant: "destructive" });
    } finally {
      setBillingLoading(false);
    }
  };

  if (authLoading) return null;

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url || "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Profile</h1>

          {/* Account Info */}
          <Card className="border-border/50 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-sm bg-primary/20 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Member since</p>
                  <p className="text-foreground font-medium">
                    {user?.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Auth provider</p>
                  <p className="text-foreground font-medium capitalize">
                    {user?.app_metadata?.provider || "Email"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription / Plan */}
          <Card className="border-border/50 mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Plan & Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/5" />
                </div>
              ) : subDetails?.has_subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground">{subDetails.plan_name}</h3>
                    <Badge variant={subDetails.cancel_at_period_end ? "secondary" : "default"} className="text-xs">
                      {subDetails.cancel_at_period_end ? "Canceling" : capitalize(subDetails.status || "active")}
                    </Badge>
                  </div>

                  {subDetails.plan_description && (
                    <p className="text-sm text-muted-foreground">{subDetails.plan_description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="text-foreground font-semibold">
                        {subDetails.amount != null
                          ? `${formatAmount(subDetails.amount, subDetails.currency || "usd")}/${subDetails.interval || "month"}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {subDetails.cancel_at_period_end ? "Access until" : "Next billing"}
                      </p>
                      <p className="text-foreground font-medium">
                        {subDetails.current_period_end
                          ? format(new Date(subDetails.current_period_end), "MMM d, yyyy")
                          : "—"}
                      </p>
                    </div>
                    {subDetails.payment_method && (
                      <>
                        <div>
                          <p className="text-muted-foreground">Payment method</p>
                          <p className="text-foreground font-medium">
                            {capitalize(subDetails.payment_method.brand)} •••• {subDetails.payment_method.last4}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expires</p>
                          <p className="text-foreground font-medium">
                            {subDetails.payment_method.exp_month}/{subDetails.payment_method.exp_year}
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-muted-foreground">Subscribed since</p>
                      <p className="text-foreground font-medium">
                        {subDetails.created ? format(new Date(subDetails.created), "MMM d, yyyy") : "—"}
                      </p>
                    </div>
                  </div>

                  {subDetails.cancel_at_period_end && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                      <p className="text-sm text-destructive">
                        Your subscription is set to cancel at the end of the current billing period. You'll retain access until{" "}
                        {subDetails.current_period_end
                          ? format(new Date(subDetails.current_period_end), "MMMM d, yyyy")
                          : "the end of your billing cycle"}
                        .
                      </p>
                    </div>
                  )}

                  <Button onClick={handleManageBilling} disabled={billingLoading} variant="outline" className="mt-2">
                    {billingLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-2" />
                    )}
                    Manage Billing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-foreground">Free</h3>
                    <Badge variant="secondary" className="text-xs">Current plan</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You're on the free plan. Upgrade to unlock more scans and content.
                  </p>
                  {subDetails?.canceled_plan && (
                    <p className="text-xs text-muted-foreground">
                      Previously on <span className="font-medium">{subDetails.canceled_plan}</span>
                      {subDetails.canceled_at && ` (canceled ${format(new Date(subDetails.canceled_at), "MMM d, yyyy")})`}
                    </p>
                  )}
                  <Button size="sm" onClick={() => window.location.href = "/#pricing"}>
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Your account is secured via {capitalize(user?.app_metadata?.provider || "email")} authentication. To change your password or manage security settings, use your authentication provider.</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
