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
      "Any public GitHub repository. Just paste the URL and we'll pull the README, file structure, dependencies, and metadata to understand what the project does.",
  },
  {
    question: "How does the AI generate content?",
    answer:
      "We use a two-pass approach: the first pass generates raw content from your repo analysis, then a second refinement pass improves clarity, tone, and platform fit. Each piece is scored for quality before being shown to you.",
  },
  {
    question: "Is my code stored or shared?",
    answer:
      "No. We only read publicly available repository metadata (README, file tree, package info). We never clone, store, or share your source code. Analysis results are kept in your browser session only.",
  },
  {
    question: "What platforms are the social posts optimized for?",
    answer:
      "We generate posts specifically formatted for X (formerly Twitter) and LinkedIn. Each post follows the conventions and character limits of its target platform for maximum engagement.",
  },
  {
    question: "Can I edit the generated content?",
    answer:
      "Yes — you can copy any piece and edit it however you like. You can also regenerate content with different preferences (tone, audience, focus areas) to get a fresh set of outputs.",
  },
  {
    question: "Do I need to pay anything?",
    answer:
      "Nope. Signing up is completely free and unlocks all generated content, export options, and regeneration. No credit card required.",
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-base">
            Everything you need to know about RepoToContent.
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
            className="glass-card rounded-2xl border border-border/50 px-6 divide-y divide-border/30"
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
