#!/usr/bin/env python3
"""Mechanical audit for the machine-checkable subset of the anti-ai-tells guide.

Usage:
    python3 audit_tells.py draft.md                   # research audit, always exits 0
    python3 audit_tells.py draft.md --house           # + Layer 1 hard bans, exits 1 on any hit
    python3 audit_tells.py draft.md --house-only      # Layer 1 alone, for hooks and gates
    python3 audit_tells.py draft.md --include-quotes  # count text inside quotation marks too

Covers: em dash rate (and spaced double hyphens), contrastive negation (including the
two-sentence form and staccato "No X. No Y."), banned vocabulary, significance inflation,
brochure register, pseudo-aphorisms, stock openers/closers/send-offs, hedge padding,
period-split emphasis, title-case headings, bold labels on every bullet, exclamation count,
emoji, machine artifacts, chat leakage, knowledge-cutoff disclaimers.
Layer 2 notes: flat rhythm, -ing riders, copula avoidance, arguing with no one,
explaining the example, stacked qualifiers, vague association, hyphenated predicates,
repeated sentence openings, heading echo, writing about the document, challenges-and-outlook
sections, borrowed authority, guess-filling, over-used word clusters, repeated closers,
rules between every section, "rather than" counts, standalone "Look,"/"Heads up" openers.

Code blocks, inline code, URLs and YAML frontmatter are skipped. Text inside quotation marks
is listed separately as [Q] and never fails the check, unless --include-quotes is set.
It cannot tell whether a metaphor lands or an anecdote is portable. That is a reading job.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

HUMAN_EMDASH_BASELINE_PER_1K = 9.0  # model mean; published humans span 0.33-17.12

BANNED_VOCAB = [
    "revolutionary", "game-changing", "game-changer", "cutting-edge", "state-of-the-art",
    "best-in-class", "next-level", "future-proof", "synergy", "synergize", "streamline",
    "elevate", "empower", "seamless", "holistic", "paradigm shift", "transformative",
    "delve", "tapestry", "navigate the complexities", "at the intersection of",
    "weave together", "at its core",
    # overused model words, banned as taste (humanizer list)
    "testament", "garner", "garnered", "garners", "garnering", "interplay", "bolstered",
    "deep dive", "deep-dive", "vibrant", "enduring",
    # brochure register
    "nestled", "breathtaking", "must-visit", "stunning", "renowned", "diverse array",
    "groundbreaking", "exemplifies", "indelible",
]

FILLER_INTENSIFIERS = ["genuinely", "honestly", "truly"]

SIGNIFICANCE = [
    "stands as a", "a pivotal moment", "marks a turning point", "marking a turning point",
    "key turning point", "plays a key role", "plays a vital role", "plays a crucial role",
    "plays a pivotal role", "played a key role", "played a vital role", "played a crucial role",
    "played a pivotal role", "shaping the future of", "underscores its importance",
    "underscores the importance", "reflects a broader", "lasting legacy", "evolving landscape",
    "in the heart of", "natural beauty", "set the stage for", "setting the stage for",
]

APHORISM_PATTERNS = [
    re.compile(r"\bis the (?:language|currency|architecture) of\b", re.I),
    re.compile(r"\bbecomes a trap\b", re.I),
    re.compile(r"\bthe heart of the matter\b", re.I),
    re.compile(r"\bthe deeper issue\b", re.I),
    re.compile(r"\bwhat really matters\b", re.I),
    re.compile(r"(?:^|[.!?]\s+)(?:fundamentally|in reality),", re.I | re.M),
]

OPENERS = [
    "in today's fast-paced world", "in an era of", "in the realm of", "in a world where",
    "picture this:", "imagine this:", "here's the thing:", "spoiler alert:", "plot twist:",
    "hot take:", "let's dive in", "what if i told you", "let that sink in", "buckle up",
    # staged run-ups (humanizer)
    "let's explore", "let's break this down", "let's break it down",
    "here's what you need to know", "here is what you need to know", "now let's look at",
    "without further ado", "let's be honest", "real talk",
]

OPENER_PATTERNS = [
    re.compile(r"(?:^|[.!?]\s+)the thing is\b", re.I | re.M),
    re.compile(r"(?:^|[.!?]\s+)honestly\?", re.I | re.M),
]

CLOSERS = [
    "in conclusion", "in summary", "in essence", "to wrap up", "at the end of the day",
    "the choice is yours", "stay tuned",
    # send-offs
    "the future looks bright", "exciting times ahead", "exciting times lie ahead",
    "a step in the right direction", "journey toward excellence", "journey towards excellence",
]

HEDGES = ["it's worth noting", "it is worth noting", "it's important to note", "moreover", "furthermore"]

CONTRASTIVE_PATTERNS = [
    re.compile(r"\bnot (?:just|only|merely|simply)\b[^.]{0,80}\b(?:but|it's|it is)\b", re.I),
    re.compile(r"\bit'?s not (?:about )?\w[^.]{0,60},\s*(?:it'?s|but)\b", re.I),
    re.compile(r"\bmore than just\b", re.I),
    re.compile(r"\bno longer just\b", re.I),
    # split across two sentences: "This does not mean X. It means Y." / "This isn't about X. It's about Y."
    re.compile(r"\b(?:this|that|it)\s+(?:does not|doesn'?t|did not|didn'?t)\s+mean\b[^.!?]{0,120}[.!?]\s+(?:it|this|that)\s+means\b", re.I),
    re.compile(r"\b(?:this|it)\s+(?:isn'?t|is not|wasn'?t|was not)\s+(?:mainly\s+|just\s+|only\s+|really\s+)?about\b[^.!?]{0,120}[.!?]\s+(?:it'?s|it is|this is)\s+about\b", re.I),
]

STACCATO_NO = re.compile(r"\bNo\s+[\w'\- ]{1,30}\.\s+No\s+[\w'\- ]{1,30}\.")
TERSE_NEGATIVE = re.compile(
    r",\s+no\s+(?!matter\b|longer\b|more\b|one\b|doubt\b|less\b|later\b|earlier\b|sooner\b|problems?\b|worr(?:y|ies)\b|rush\b|pressure\b|thanks\b|idea\b|clue\b)[a-z]+(?:\s+(?:needed|required))?[.!]"
    r"|(?:^|[.!?]\s+)No\s+[A-Za-z][\w ]{0,30}\s+(?:needed|required)\.",
    re.M,
)
PERIOD_SPLIT = re.compile(r"\b[a-z]{2,}\.\s[a-z]{2,}\.\s[a-z]{2,}\.")

MACHINE_ARTIFACTS = [
    "oaicite", "oai_citation", "contentreference", "turn0search", "utm_source=chatgpt.com",
    "grok_card", "as an ai language model", "co-authored-by: claude", "[insert",
    # knowledge-cutoff disclaimers
    "my last training update", "my knowledge cutoff", "as of my last update",
]

CHAT_LEAKAGE = [
    "great question!", "certainly! here", "i hope this helps",
    "of course! here", "should i continue?", "let me know if you'd like me to expand",
    "would you like me to expand",
]

# ---- Layer 2 lists ----
COPULA_PATTERNS = [
    re.compile(r"\b(?:serves|served|serving|functions|operates) as\b", re.I),
    re.compile(r"\bboasts?\b", re.I),
    re.compile(r"\b(?:features|offers|maintains) (?:a|an|over|more than|several|multiple|two|three|four|five|\d)", re.I),
]
ARGUING = [
    "i'm not saying", "i am not saying", "to be clear,", "don't get me wrong",
    "this is not to say", "a tempting approach would be", "one might be tempted to",
    "an obvious approach would be", "you might think", "it would be easy to just",
    "some might say",
]
ARGUING_PATTERNS = [re.compile(r"\bthis isn'?t (?:mainly |just |only )?about\b", re.I)]
EXPLAIN_EXAMPLE = [
    "this shows the importance of", "this highlights the importance of",
    "which shows the importance of", "the message was clear:", "it was a lesson in",
]
STACKED_QUALIFIERS = re.compile(
    r"\b(?:could|might|may)\s+(?:potentially|possibly|arguably|conceivably)\b|\bpotentially possibly\b|\bit could be argued that\b",
    re.I,
)
VAGUE_ASSOCIATION = re.compile(
    r"\b(?:associated with|in association with|in connection with|connected to|linked to|tied to)\b", re.I
)
HYPHEN_PREDICATE = re.compile(
    r"\b(?:is|are|was|were|be|been|being|seems?|looks?|feels?|remains?)\s+(?:very\s+|more\s+|less\s+|quite\s+)?"
    r"(high-quality|well-known|well-documented|well-designed|well-written|long-term|short-term|real-time|"
    r"client-facing|customer-facing|user-friendly|data-driven|up-to-date|low-cost|high-level|low-level)\b",
    re.I,
)
ABOUT_DOCUMENT = [
    "the table below", "the list below", "the chart below", "this section is organized",
    "this section covers", "this document covers", "was added to replace", "compiled from",
    "generated from", "rather than guessed", "as mentioned above", "as noted above", "as shown above",
]
CHALLENGES_OUTLOOK = re.compile(
    r"\bdespite (?:these|its|their|the) challenges\b|\bcontinues? to thrive\b|^#+\s*(?:challenges and (?:legacy|future)|future outlook)\b",
    re.I | re.M,
)
BORROWED_AUTHORITY = [
    "experts argue", "experts say", "experts believe", "observers have cited", "industry reports",
    "some critics", "several publications", "has been featured in", "have been featured in",
    "has been cited in", "active social media presence",
]
GUESS_FILLING = [
    "while specific details", "not extensively documented", "readily available sources",
    "based on available information", "not publicly available", "maintains a low profile",
    "keeps personal details private", "it is believed that", "not widely documented",
    "not widely disclosed", "here is an overview of", "here's an overview of",
]
OVERUSED_WORDS = {
    "additionally", "align", "aligns", "bolstered", "crucial", "delve", "enduring", "enhance",
    "enhances", "enhanced", "enhancing", "garner", "highlight", "highlights", "highlighting",
    "interplay", "intricate", "intricacies", "key", "landscape", "meticulous", "meticulously",
    "pivotal", "quietly", "robust", "showcase", "showcases", "showcasing", "tapestry", "testament",
    "underscore", "underscores", "underscoring", "valuable", "vibrant", "foster", "fostering",
    "realm", "nuanced", "multifaceted",
}
ING_RIDERS = re.compile(
    r",\s+(?:highlighting|underscoring|emphasizing|emphasising|ensuring|reflecting|symbolizing|symbolising|"
    r"contributing to|cultivating|fostering|encompassing|showcasing)\b",
    re.I,
)
STANDALONE_OPENERS = re.compile(r"(?:^|[.!?]\s+)(?:look,|heads up[,:]|quick note:)", re.I | re.M)

EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F900-\U0001F9FF\U00002190-\U000021FF⬀-⯿]"
)

SMALL_WORDS = {"a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "via", "with", "from", "into"}
QUOTE_RE = re.compile(r'"[^"\n]{1,600}"|“[^”\n]{1,600}”')
LIST_ITEM_RE = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")
BOLD_LABEL_RE = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+\*\*[^*\n]{1,80}?(?::\*\*|\*\*\s*:)")


@dataclass
class Report:
    house_hits: list[str] = field(default_factory=list)
    density_notes: list[str] = field(default_factory=list)
    proof_hits: list[str] = field(default_factory=list)
    quoted_hits: list[str] = field(default_factory=list)


def _count(text: str, needle: str) -> int:
    return text.lower().count(needle.lower())


def strip_noise(text: str) -> str:
    """Remove YAML frontmatter, fenced code, inline code, link targets and bare URLs."""
    text = re.sub(r"\A---\n.*?\n---\n", "\n", text, flags=re.S)
    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"~~~.*?~~~", " ", text, flags=re.S)
    text = re.sub(r"`[^`\n]*`", " ", text)
    text = re.sub(r"\]\([^)\s]*\)", "]", text)
    text = re.sub(r"https?://\S+", " ", text)
    return text


def split_quotes(text: str) -> tuple[str, str]:
    """Return (own_text, quoted_text). Quoted spans are replaced by a neutral token."""
    quoted = QUOTE_RE.findall(text)
    own = QUOTE_RE.sub(' ⟦⟧ ', text)
    return own, "\n".join(quoted)


def vocab_hits(low: str) -> list[str]:
    hits = []
    for term in BANNED_VOCAB + FILLER_INTENSIFIERS:
        n = len(re.findall(rf"\b{re.escape(term)}\b", low))
        if n:
            hits.append(f"banned vocab '{term}': {n}")
    for phrase in SIGNIFICANCE:
        n = _count(low, phrase)
        if n:
            hits.append(f"significance/brochure phrase '{phrase}': {n}")
    for phrase in OPENERS + CLOSERS + HEDGES:
        n = _count(low, phrase)
        if n:
            hits.append(f"stock phrase '{phrase}': {n}")
    return hits


def pattern_hits(text: str) -> list[str]:
    hits = []
    for p in APHORISM_PATTERNS:
        n = len(p.findall(text))
        if n:
            hits.append(f"pseudo-aphorism /{p.pattern}/: {n}")
    for p in OPENER_PATTERNS:
        n = len(p.findall(text))
        if n:
            hits.append(f"staged opener /{p.pattern}/: {n}")
    contrastive = (sum(len(p.findall(text)) for p in CONTRASTIVE_PATTERNS) + len(STACCATO_NO.findall(text))
                   + len(TERSE_NEGATIVE.findall(text)))
    if contrastive:
        hits.append(f"contrastive negation: {contrastive} hit(s); delete the dismissed half")
    split = PERIOD_SPLIT.findall(text)
    if split:
        hits.append(f"period-split emphasis: {len(split)} ({split[0]})")
    return hits


def headings_and_lists(raw: str) -> tuple[list[str], list[str]]:
    """Layer 1 formatting hits and Layer 2 structure notes from the line structure."""
    house, notes = [], []
    lines = raw.split("\n")

    # title-case headings (H2 and below; H1 is the page title)
    for ln in lines:
        m = re.match(r"^(#{2,6})\s+(.*)$", ln)
        if not m:
            continue
        words = re.findall(r"[A-Za-z][A-Za-z'’\-]*", m.group(2))
        cands = [w for w in words[1:] if not (len(w) >= 2 and w.isupper())]
        if len(cands) >= 3:
            caps = sum(1 for w in cands if w[0].isupper())
            small_caps = sum(1 for w in cands if w.lower() in SMALL_WORDS and w[0].isupper())
            if caps / len(cands) >= 0.75 and (small_caps or len(cands) >= 4):
                house.append(f"title-case heading: '{ln.strip()[:70]}'; use sentence case")

    # bold label on every bullet, per list block
    block: list[str] = []
    blocks: list[list[str]] = []
    for ln in lines + [""]:
        if LIST_ITEM_RE.match(ln):
            block.append(ln)
        elif ln.strip() == "" and block:
            continue
        else:
            if block:
                blocks.append(block)
            block = []
    if block:
        blocks.append(block)
    for b in blocks:
        if len(b) >= 3:
            labelled = sum(1 for ln in b if BOLD_LABEL_RE.match(ln))
            if labelled >= 3 and labelled / len(b) >= 0.75:
                house.append(f"bold label on every bullet: {labelled} of {len(b)} items (list starting '{b[0].strip()[:40]}')")

    # heading echo: heading, then a one-line paragraph of 4 words or fewer, then more prose
    nonblank = [(i, ln) for i, ln in enumerate(lines) if ln.strip()]
    for k, (i, ln) in enumerate(nonblank[:-2]):
        if re.match(r"^#{1,6}\s", ln):
            nxt = nonblank[k + 1][1].strip()
            after = nonblank[k + 2][1].strip()
            if (not nxt.startswith("#") and not LIST_ITEM_RE.match(nxt) and len(nxt.split()) <= 4
                    and nxt.endswith((".", "!")) and not after.startswith("#")):
                notes.append(f"heading echo: '{ln.strip()[:50]}' then '{nxt}'")

    # a horizontal rule between every section
    rules = sum(1 for ln in lines if re.match(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$", ln))
    h2 = sum(1 for ln in lines if re.match(r"^##\s", ln))
    if h2 >= 3 and rules >= h2 - 1:
        notes.append(f"horizontal rules between sections: {rules} rules for {h2} sections")

    # the same short closer repeated after sections
    shorts: dict[str, int] = {}
    for ln in lines:
        t = ln.strip()
        if t and not t.startswith(("#", "|", ">")) and not LIST_ITEM_RE.match(t) and len(t.split()) <= 8 and t.endswith((".", "!")):
            shorts[t.lower()] = shorts.get(t.lower(), 0) + 1
    rep = [t for t, n in shorts.items() if n >= 2]
    if rep:
        notes.append(f"repeated short closer: '{rep[0]}' x{shorts[rep[0]]}")
    return house, notes


def prose_paragraphs(text: str) -> list[str]:
    paras = []
    for p in re.split(r"\n\s*\n", text):
        p = p.strip()
        if not p or p.startswith(("#", "|", ">")) or LIST_ITEM_RE.match(p):
            continue
        paras.append(" ".join(p.split()))
    return paras


def audit(text: str, include_quotes: bool = False) -> Report:
    r = Report()
    clean = strip_noise(text)
    if include_quotes:
        own, quoted = clean, ""
    else:
        own, quoted = split_quotes(clean)
    words = max(len(own.split()), 1)
    low = own.lower()

    # Layer 1
    emdash = own.count("—") + len(re.findall(r"\s–\s", own))
    if emdash:
        r.house_hits.append(f"em dashes: {emdash} ({emdash / words * 1000:.1f}/1k words, model mean ~{HUMAN_EMDASH_BASELINE_PER_1K})")
    dbl = len(re.findall(r"\s--\s", own))
    if dbl:
        r.house_hits.append(f"spaced double hyphens used as dashes: {dbl}")
    emoji = EMOJI_RE.findall(own)
    if emoji:
        r.house_hits.append(f"emoji/arrows: {len(emoji)} ({''.join(emoji[:10])})")
    bangs = own.count("!")
    if bangs > 1:
        r.house_hits.append(f"exclamation points: {bangs} (max 1 per document)")
    r.house_hits.extend(vocab_hits(low))
    r.house_hits.extend(pattern_hits(own))
    fmt_house, fmt_notes = headings_and_lists(clean)
    r.house_hits.extend(fmt_house)

    # Layer 2 density notes
    contrastive = (sum(len(p.findall(own)) for p in CONTRASTIVE_PATTERNS) + len(STACCATO_NO.findall(own))
                   + len(TERSE_NEGATIVE.findall(own)))
    if contrastive >= 3:
        r.density_notes.append("contrastive negation at signal density (3+)")
    sentences = [s for s in re.split(r"[.!?]+\s", own) if s.strip()]
    if sentences:
        lengths = [len(s.split()) for s in sentences]
        mean = sum(lengths) / len(lengths)
        var = sum((l - mean) ** 2 for l in lengths) / len(lengths)
        if 15 <= mean <= 20 and var < 30 and len(sentences) >= 8:
            r.density_notes.append(f"flat rhythm: mean {mean:.0f} words/sentence, low variance ({var:.0f})")
    trailing_ing = len(re.findall(r",\s+\w+ing\s+(?:the|a|an|its|their)\b", own))
    riders = len(ING_RIDERS.findall(own))
    if trailing_ing >= 3 or riders >= 2:
        r.density_notes.append(f"-ing riders: {riders} from the watch list, {trailing_ing} trailing -ing clauses")
    copula = sum(len(p.findall(own)) for p in COPULA_PATTERNS)
    if copula >= 2:
        r.density_notes.append(f"copula avoidance: {copula} (serves as, boasts, features a); use is, are, has")
    arguing = [a for a in ARGUING if a in low] + [p.pattern for p in ARGUING_PATTERNS if p.search(own)]
    if arguing:
        r.density_notes.append(f"arguing with no one: {', '.join(arguing[:5])}")
    explain = [e for e in EXPLAIN_EXAMPLE if e in low]
    if explain:
        r.density_notes.append(f"explaining the example: {', '.join(explain)}")
    stacked = STACKED_QUALIFIERS.findall(own)
    if stacked:
        r.density_notes.append(f"stacked qualifiers: {len(stacked)} ({stacked[0]})")
    vague = VAGUE_ASSOCIATION.findall(own)
    if len(vague) >= 3 or (len(vague) >= 2 and len(vague) / words * 100 >= 1.0):
        r.density_notes.append(f"vague association: {len(vague)} (associated with, linked to); name the relationship")
    hyph = HYPHEN_PREDICATE.findall(own)
    if hyph:
        r.density_notes.append(f"hyphenated predicates: {', '.join(sorted(set(h.lower() for h in hyph)))}; drop the hyphen after the noun")
    about = [a for a in ABOUT_DOCUMENT if a in low]
    if about:
        r.density_notes.append(f"writing about the document: {', '.join(about[:5])}")
    if CHALLENGES_OUTLOOK.search(own):
        r.density_notes.append("stock challenges-and-outlook section")
    borrowed = [b for b in BORROWED_AUTHORITY if b in low]
    if borrowed:
        r.density_notes.append(f"borrowed authority: {', '.join(borrowed[:5])}")
    guesses = [g for g in GUESS_FILLING if g in low]
    if guesses:
        r.density_notes.append(f"guess-filling or chatbot framing: {', '.join(guesses[:5])}")
    rather = len(re.findall(r"\brather than\b", low))
    if rather >= 2:
        r.density_notes.append(f"'rather than' x{rather}: check each for a dismissed alternative nobody proposed")
    standalone = STANDALONE_OPENERS.findall(own)
    if standalone:
        r.density_notes.append(f"standalone run-up openers: {', '.join(s.strip() for s in standalone[:4])}")
    for para in prose_paragraphs(own):
        found = {w for w in re.findall(r"[a-z]+", para.lower()) if w in OVERUSED_WORDS}
        if len(found) >= 3:
            r.density_notes.append(f"over-used word cluster in one paragraph: {', '.join(sorted(found))}")
        sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", para) if s.strip()]
        firsts = [re.sub(r"[^a-z']", "", s.split()[0].lower()) for s in sents if s.split()]
        run = 1
        for a, b in zip(firsts, firsts[1:]):
            run = run + 1 if a and a == b and a != "the" else 1
            if run == 3:
                r.density_notes.append(f"repeated sentence openings: three in a row start with '{a}'")
                break
    for para in re.split(r"\n\s*\n", own):
        spans = re.findall(r"\*\*[^*\n]{1,80}\*\*", para)
        if len(spans) >= 3 and not LIST_ITEM_RE.match(para.strip()):
            r.density_notes.append(f"bold sprinkled: {len(spans)} bold spans in one paragraph")
            break
    r.density_notes.extend(fmt_notes)

    # Layer 4 (artifacts count everywhere outside code)
    full_low = clean.lower()
    for a in MACHINE_ARTIFACTS + CHAT_LEAKAGE:
        if a in full_low:
            r.proof_hits.append(f"machine artifact: '{a}'")

    # Quoted text: listed, never counted
    if quoted:
        qlow = quoted.lower()
        qhits = vocab_hits(qlow) + pattern_hits(quoted)
        qdash = quoted.count("—")
        if qdash:
            qhits.append(f"em dashes: {qdash}")
        r.quoted_hits.extend(qhits)
    return r


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--house", action="store_true", help="include Layer 1, exit 1 on any hit")
    ap.add_argument("--house-only", action="store_true", help="Layer 1 alone, exit 1 on any hit")
    ap.add_argument("--include-quotes", action="store_true", help="audit text inside quotation marks too")
    args = ap.parse_args()

    exit_code = 0
    for f in args.files:
        try:
            text = f.read_text(encoding="utf-8")
        except OSError as exc:
            print(f"{f}: unreadable ({exc})", file=sys.stderr)
            exit_code = 1
            continue
        rep = audit(text, include_quotes=args.include_quotes)
        print(f"== {f} ==")
        if args.house or args.house_only:
            for h in rep.house_hits:
                print(f"  [L1] {h}")
            if rep.house_hits:
                exit_code = 1
        if not args.house_only:
            for n in rep.density_notes:
                print(f"  [L2] {n}")
            for p in rep.proof_hits:
                print(f"  [L4] {p}")
        if not (rep.house_hits or rep.density_notes or rep.proof_hits):
            print("  clean (mechanical checks only; substance is a reading job)")
        for q in rep.quoted_hits:
            print(f"  [Q] inside quotes, left alone: {q}")
    return exit_code if (args.house or args.house_only) else 0


if __name__ == "__main__":
    sys.exit(main())
