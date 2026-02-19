import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "What repos can I analyze?",
    answer:
      "Any public GitHub repository. Just paste the URL and we'll pull the README, file structure, dependencies, and metadata to understand what the project does. Private repos are supported too with a GitHub token.",
  },
  {
    question: "How does the AI generate content?",
    answer:
      "We use a two-pass approach: the first pass generates raw content from your repo analysis, then a second refinement pass improves clarity, tone, and platform fit. Each piece is scored for quality before being shown to you.",
  },
  {
    question: "Is my code stored or shared?",
    answer:
      "No. We only read publicly available repository metadata (README, file tree, package info). We never clone, store, or share your source code.",
  },
  {
    question: "What content formats are supported?",
    answer:
      "We generate posts for X (Twitter) and LinkedIn, long-form blog articles, and detailed case studies. Each format follows platform conventions and best practices for maximum engagement.",
  },
  {
    question: "Can I customize the output?",
    answer:
      "Yes. You can set tone, target audience, and focus areas before generating. You can also regenerate with different preferences at any time to get a fresh set of outputs.",
  },
  {
    question: "What plans are available?",
    answer:
      "We offer a free tier with 1 scan, a Starter plan with 5 scans, and a Pro plan with unlimited scans plus priority content generation. Check the pricing section for details.",
  },
];

export function FAQSection() {
  return (
    <section className="relative px-6 md:px-10 py-24">
      <div className="max-w-3xl mx-auto space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-display text-foreground">
            Got questions?
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Everything you need to know about LaunchCopy.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl bg-card border border-border px-6 divide-y divide-border"
          >
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-none"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-5">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
