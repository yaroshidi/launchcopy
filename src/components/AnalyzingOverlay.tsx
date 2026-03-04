 import { useEffect, useState } from "react";
 import { motion } from "framer-motion";
 import { Github, Code, Brain, FileText, Check, Loader2 } from "lucide-react";
 import { Progress } from "@/components/ui/progress";

 interface AnalyzingOverlayProps {
   repoUrl: string;
 }

 const STEPS = [
   { icon: Github, label: "Fetching repository from GitHub", duration: 3000 },
   { icon: Code, label: "Reading codebase structure", duration: 5000 },
   { icon: Brain, label: "Understanding the product", duration: 7000 },
   { icon: FileText, label: "Generating marketing content", duration: 10000 },
 ];

 const MESSAGES = [
   "Crawling through your codebase...",
   "Understanding your product's value...",
   "Crafting compelling narratives...",
   "Generating social-ready content...",
   "Polishing the final touches...",
 ];

 export function AnalyzingOverlay({ repoUrl }: AnalyzingOverlayProps) {
   const [currentStep, setCurrentStep] = useState(0);
   const [messageIndex, setMessageIndex] = useState(0);
   const [progress, setProgress] = useState(0);
   const [elapsedTime, setElapsedTime] = useState(0);

   // Progress through steps
   useEffect(() => {
     const stepTimers: NodeJS.Timeout[] = [];
     let accumulatedTime = 0;

     STEPS.forEach((step, index) => {
       accumulatedTime += step.duration;
       stepTimers.push(
         setTimeout(() => {
           if (index < STEPS.length - 1) {
             setCurrentStep(index + 1);
           }
         }, accumulatedTime)
       );
     });

     return () => stepTimers.forEach(clearTimeout);
   }, []);

   // Rotate messages
   useEffect(() => {
     const interval = setInterval(() => {
       setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
     }, 3000);
     return () => clearInterval(interval);
   }, []);

   // Update progress bar and elapsed time
   useEffect(() => {
     const totalDuration = 25000; // 25 seconds estimated
     const interval = setInterval(() => {
       setElapsedTime((prev) => prev + 100);
       setProgress((prev) => Math.min(prev + (100 / totalDuration) * 100, 95));
     }, 100);
     return () => clearInterval(interval);
   }, []);

   const estimatedRemaining = Math.max(0, Math.ceil((25000 - elapsedTime) / 1000));

   // Extract repo name from URL
   const repoName = repoUrl.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");

   return (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
     >
       {/* Main content */}
       <motion.div
         initial={{ scale: 0.95, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         transition={{ delay: 0.1, duration: 0.4 }}
         className="w-full max-w-lg mx-4"
       >
         {/* Repo URL badge */}
         <motion.div
           initial={{ y: -20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="text-center mb-8"
         >
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm font-mono text-muted-foreground">
             <Github className="w-4 h-4 text-primary" />
             {repoName}
           </div>
         </motion.div>

         {/* Progress steps */}
         <div className="bg-card rounded-2xl p-6 border border-border mb-6">
           <div className="space-y-4">
             {STEPS.map((step, index) => {
               const StepIcon = step.icon;
               const isCompleted = index < currentStep;
               const isCurrent = index === currentStep;

               return (
                 <motion.div
                   key={index}
                   initial={{ x: -20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   transition={{ delay: 0.3 + index * 0.1 }}
                   className={`flex items-center gap-4 ${
                     isCompleted
                       ? "text-primary"
                       : isCurrent
                       ? "text-foreground"
                       : "text-muted-foreground/50"
                   }`}
                 >
                   <div
                     className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                       isCompleted
                         ? "bg-primary/20 text-primary"
                         : isCurrent
                         ? "bg-primary/10 text-primary"
                         : "bg-muted/50"
                     }`}
                   >
                     {isCompleted ? (
                       <Check className="w-5 h-5" />
                     ) : isCurrent ? (
                       <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                       <StepIcon className="w-5 h-5" />
                     )}
                   </div>
                   <span
                     className={`flex-1 text-sm font-medium transition-colors duration-300 ${
                       isCurrent ? "text-foreground" : ""
                     }`}
                   >
                     {step.label}
                   </span>
                   {isCompleted && (
                     <span className="text-xs text-primary font-medium">Done</span>
                   )}
                 </motion.div>
               );
             })}
           </div>
         </div>

         {/* Rotating message */}
         <motion.div
           key={messageIndex}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           className="text-center mb-6"
         >
           <p className="text-muted-foreground text-sm font-display italic">
             "{MESSAGES[messageIndex]}"
           </p>
         </motion.div>

         {/* Progress bar */}
         <div className="space-y-2">
           <Progress value={progress} className="h-2" />
           <div className="flex justify-between text-xs text-muted-foreground">
             <span>Analyzing...</span>
             <span>~{estimatedRemaining}s remaining</span>
           </div>
         </div>
       </motion.div>
     </motion.div>
   );
 }
