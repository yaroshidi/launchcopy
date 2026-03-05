import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Trash2, ExternalLink, MessageSquare, FileText, Briefcase, Search, RotateCcw, Archive, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { loadUserAnalyses, deleteAnalysis, loadAnalysisById, loadTrashedAnalyses, restoreAnalysis, permanentlyDeleteAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ProductSummary, GeneratedContent } from "@/types/analysis";

interface ScanItem {
  id: string;
  repoUrl: string;
  summary: ProductSummary;
  content: GeneratedContent;
  analyzedAt: Date;
  deletedAt?: Date;
}

function extractRepoName(url: string) {
  try {
    const parts = url.replace(/\.git$/, "").split("/");
    return parts.slice(-2).join("/");
  } catch {
    return url;
  }
}

function ScanCardSkeleton() {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyScans() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [scans, setScans] = useState<ScanItem[]>([]);
  const [trashedScans, setTrashedScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trashLoading, setTrashLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("scans");

  useEffect(() => {
    document.title = "Dashboard | LaunchCopy";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    loadUserAnalyses().then((data) => {
      setScans(
        data.map((d) => ({
          ...d,
          content: (d as any).content as GeneratedContent,
        }))
      );
      setLoading(false);
    });
    loadTrashedAnalyses().then((data) => {
      setTrashedScans(
        data.map((d) => ({
          ...d,
          content: (d as any).content as GeneratedContent,
        }))
      );
      setTrashLoading(false);
    });
  }, [user]);

  const handleOpen = async (id: string) => {
    const analysis = await loadAnalysisById(id);
    if (!analysis) {
      toast({ title: "Not found", description: "Could not load this scan.", variant: "destructive" });
      return;
    }
    sessionStorage.setItem(
      "repo_analysis",
      JSON.stringify({ analysis, repoUrl: analysis.repoUrl })
    );
    navigate("/");
  };

  const handleSoftDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAnalysis(deleteId);
      const movedScan = scans.find((s) => s.id === deleteId);
      setScans((prev) => prev.filter((s) => s.id !== deleteId));
      if (movedScan) {
        setTrashedScans((prev) => [{ ...movedScan, deletedAt: new Date() }, ...prev]);
      }
      toast({ title: "Moved to trash", description: "Scan will be permanently deleted in 24 hours." });
    } catch {
      toast({ title: "Error", description: "Failed to delete scan.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreAnalysis(id);
      const restored = trashedScans.find((s) => s.id === id);
      setTrashedScans((prev) => prev.filter((s) => s.id !== id));
      if (restored) {
        setScans((prev) => [{ ...restored, deletedAt: undefined }, ...prev]);
      }
      toast({ title: "Restored", description: "Scan has been restored." });
    } catch {
      toast({ title: "Error", description: "Failed to restore scan.", variant: "destructive" });
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteId) return;
    setDeleting(true);
    try {
      await permanentlyDeleteAnalysis(permanentDeleteId);
      setTrashedScans((prev) => prev.filter((s) => s.id !== permanentDeleteId));
      toast({ title: "Permanently deleted", description: "Scan has been removed forever." });
    } catch {
      toast({ title: "Error", description: "Failed to delete scan.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setPermanentDeleteId(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-3xl font-display tracking-tight text-foreground">Dashboard</h1>
            <Button size="sm" onClick={() => navigate("/")}>
              New Scan
            </Button>
          </div>
          <p className="text-muted-foreground mb-8">All your previously analyzed repositories in one place.</p>
          <div className="accent-line mb-8" />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="scans" className="gap-1.5">
                <Search className="w-3.5 h-3.5" /> Scans
              </TabsTrigger>
              <TabsTrigger value="trash" className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Trash
                {trashedScans.length > 0 && (
                  <span className="ml-1 text-xs bg-destructive/20 text-destructive rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                    {trashedScans.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scans">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ScanCardSkeleton key={i} />
                  ))}
                </div>
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-display mb-2 text-foreground">No scans yet</h2>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Analyze a GitHub repository on the home page and your results will show up here.
                  </p>
                  <Button onClick={() => navigate("/")}>Analyze a repo</Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {scans.map((scan, i) => {
                    const posts = scan.content?.socialPosts?.filter((p: any) => !p.locked)?.length ?? 0;
                    const articles = scan.content?.blogArticles?.filter((a: any) => !a.locked)?.length ?? 0;
                    const cases = scan.content?.caseStudies?.filter((c: any) => !c.locked)?.length ?? 0;

                    return (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                      >
                        <Card className="group border-border hover:border-primary/40 transition-colors h-full flex flex-col">
                          <CardContent className="p-5 flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-sm font-mono truncate text-foreground">
                                {extractRepoName(scan.repoUrl)}
                              </h3>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(scan.analyzedAt, "MMM d, yyyy")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                              {scan.summary?.whatItDoes || "No description"}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> {posts} posts
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> {articles} articles
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" /> {cases} studies
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpen(scan.id)}>
                                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(scan.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trash">
              {trashLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <ScanCardSkeleton key={i} />
                  ))}
                </div>
              ) : trashedScans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Archive className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-display mb-2 text-foreground">Trash is empty</h2>
                  <p className="text-muted-foreground max-w-md">
                    Deleted scans appear here for 24 hours before being permanently removed.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {trashedScans.map((scan, i) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      <Card className="group border-border border-dashed opacity-75 hover:opacity-100 transition-opacity h-full flex flex-col">
                        <CardContent className="p-5 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-sm font-mono truncate text-foreground">
                              {extractRepoName(scan.repoUrl)}
                            </h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {scan.deletedAt
                                ? `Expires ${formatDistanceToNow(new Date(scan.deletedAt.getTime() + 86400000), { addSuffix: true })}`
                                : "Expiring soon"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                            {scan.summary?.whatItDoes || "No description"}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRestore(scan.id)}>
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setPermanentDeleteId(scan.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Soft delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This scan will be moved to the trash and permanently deleted after 24 hours. You can restore it anytime before then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSoftDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Moving..." : "Move to Trash"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete confirmation */}
      <AlertDialog open={!!permanentDeleteId} onOpenChange={(open) => !open && setPermanentDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this scan and all its generated content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
