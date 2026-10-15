"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { demoMenu } from "@/lib/demo-menu";
import s from "./landing.module.css";
import { ImportReviewItem, type ReviewRow } from "@/components/menu-import/import-review-item";

const ease = [.22, 1, .36, 1] as const;
const dishes = demoMenu.categories[0].items;
const importItems = [dishes[0], dishes[1], demoMenu.categories[2].items[0]];

// Scroll changes only the current chapter, rather than triggering React renders per frame.
function useChapter() {
  const target = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const [manual, setManual] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", value => {
    const next = Math.min(2, Math.floor(value * 3));
    if (!reduced && next !== chapter) { setChapter(next); setManual(null); }
  });
  return { target, active: manual ?? chapter, select: setManual, reduced: !!reduced };
}

function Chapters({ labels, active, select }: { labels: string[]; active: number; select: (n: number) => void }) {
  return <div className={s.chapterControls} aria-label="Demonstration stages">{labels.map((label, i) => <button key={label} type="button" aria-pressed={active === i} onClick={() => select(i)}><span aria-hidden="true" />{label}</button>)}</div>;
}

export function MenuStory() {
  const { target, active, select, reduced } = useChapter();
  const titles = [<>YOUR FOOD.<br />THE MAIN<br /><em>CHARACTER.</em></>, <>A CLOSER<br /><em>LOOK.</em></>, <>A LITTLE<br /><em>FEEDBACK.</em></>];
  const descriptions = ["Browse by category. Find the dish that catches your eye.", "Open a dish for its photo, description and price. The details slide up from the bottom.", "Explore the same ratings and reviews section guests see. Review posting is disabled in this sample menu."];
  return <section ref={target} id="experience" className={`${s.productStory} ${reduced ? s.storyStill : ""}`} aria-label="Explore the guest menu">
    <div className={s.storySticky}>
      <div className={s.storyCopy}><AnimatePresence mode="wait" initial={false}><motion.div key={active} initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -12 }} transition={{ duration: reduced ? 0 : .3 }}><h2>{titles[active]}</h2><p>{descriptions[active]}</p></motion.div></AnimatePresence><Chapters labels={["Browse", "Dish details", "Reviews"]} active={active} select={select} /><Link href="/demo" className={s.textLink}>Try the real menu <ArrowUpRight size={18} /></Link><p className={s.storyHint}>Scroll to explore, or choose a stage.</p></div>
      <div className={s.storyPhoneStage}><ProductMenu stage={active} /></div>
    </div>
  </section>;
}

export function ImportStory() {
  const { target, active, select, reduced } = useChapter();
  const [rows] = useState<ReviewRow[]>(() => importItems.map(item => ({ id: item.id, name: item.name, price: item.price, description: item.description, category: "Breakfast & coffee", note: "", checked: false })));
  const titles = [<>ALREADY HAVE<br />A MENU?<br /><em>BRING IT.</em></>, <>CHECK EVERY<br /><em>DETAIL.</em></>, <>READY FOR<br /><em>YOUR TABLES.</em></>];
  const copy = ["Start with your paper menu. Upload a photo or PDF, or paste the text you already have.", "Review the extracted names, categories and prices. Correct anything before saving your draft.", "Publish when you’re ready. Your guests open the finished menu with one scan."];
  return <section ref={target} id="how-it-works" className={`${s.productStory} ${s.importStory} ${reduced ? s.storyStill : ""}`} aria-label="From paper to digital menu"><div className={s.storySticky}>
    <div className={s.storyCopy}><AnimatePresence mode="wait" initial={false}><motion.div key={active} initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -12 }} transition={{ duration: reduced ? 0 : .3 }}><h2>{titles[active]}</h2><p>{copy[active]}</p></motion.div></AnimatePresence><Chapters labels={["Original", "Review", "Finished menu"]} active={active} select={select} /><Link href="/admin/menus/import" className={s.textLink}>Import your menu <ArrowUpRight size={18} /></Link><p className={s.storyHint}>Illustrative walkthrough. Photo & PDF recognition requires AI extraction setup.</p></div>
    <div className={s.morphStage}><AnimatePresence mode="wait" initial={false}>
      <motion.div key={active} className={s.realStage} initial={reduced ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduced ? 0 : -15 }} transition={{ duration: reduced ? 0 : .4, ease }}>
        {active === 0 ? <div className={`${s.morphSurface} ${s.morphPaper}`}><div className={s.morphBrand}>BUNA & BLOOM</div><div className={s.morphCaption}>BREAKFAST & COFFEE</div><div className={s.morphItems}>{rows.map(row => <div className={s.morphRow} key={row.id}><span className={s.morphName}>{row.name}</span><span>{row.price}</span></div>)}</div><div className={s.morphFoot}>Original source document</div></div> : active === 1 ? <div className={s.realImportReview} aria-label="Import review preview"><p className={s.realReviewLabel}>Review preview · Editing is available in your dashboard</p>{rows.map((row, index) => <ImportReviewItem key={row.id} row={row} index={index} currency="ETB" readOnly onEdit={() => {}} onCheck={() => {}} onRemove={() => {}} />)}</div> : <ProductMenu />}
      </motion.div></AnimatePresence><p className={s.morphNote}>{active === 0 ? "Your existing menu" : active === 1 ? "The same review controls used in your dashboard" : "The actual guest menu"}</p></div>
  </div></section>;
}

function ProductMenu({ stage = 0 }: { stage?: number }) {
  return <div className={s.realMenuFrame}><iframe key={stage} src={`/demo${stage === 1 ? "?stage=details" : stage === 2 ? "?stage=reviews" : ""}`} title={stage === 1 ? "Real menu dish details" : stage === 2 ? "Real menu ratings and reviews" : "Interactive guest menu"} loading="lazy" /></div>;
}
