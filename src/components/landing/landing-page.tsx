"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, ArrowRight, Check, Plus, Minus } from "lucide-react";
import { MenuStory, ImportStory } from "./product-stories";
import s from "./landing.module.css";

const food = (id: string, w = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
const rice = food("photo-1603133872878-684f208fb84b");
const toast = food("photo-1525351484163-7529414344d8", 700);
const questions = [
  ["Do my guests need an app?", "No. They scan your QR code and the menu opens in their phone’s browser. No guest account or download is needed."],
  ["Can I use the paper menu I already have?", "Yes. Upload photos or a PDF when AI extraction is configured, or paste your menu text. You can check and correct every item before saving an unpublished draft."],
  ["What happens when a price changes?", "Edit the price from your dashboard. Your published menu shows the update, and your permanent QR code stays the same."],
  ["Is it only for restaurants?", "It’s for the neighborhood coffee spot, the busy restaurant, and the hotel with several dining outlets. Keep separate menus under the same business account."],
  ["Can guests rate their favorite dishes?", "Yes. Published dishes support star ratings and written reviews, with real averages and paginated feedback. Guests don’t need to install an app."],
];

export function LandingPage() {
  const hero = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const plateY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const [faq, setFaq] = useState<number | null>(0);
  const [mobileNav, setMobileNav] = useState(false);
  const reveal = { initial: reduced ? false as const : { opacity: 0, y: 32 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .18 }, transition: { duration: .65, ease: [.22, 1, .36, 1] as [number, number, number, number] } };

  return <main className={s.page}>
    <a href="#experience" className={s.skip}>Skip to content</a>
    <header className={s.nav}>
      <Link href="/" aria-label="LuxMenu home" className={s.brand}>luxmenu</Link>
      <nav className={s.desktopNav} aria-label="Main navigation"><a href="#experience">The experience</a><a href="#how-it-works">How it works</a><a href="#questions">Questions?</a></nav>
      <div className={s.navActions}><Link href="/admin/login" className={s.signIn}>Log in</Link><Link href="/admin/register" className={s.navCta}>Make it yours <ArrowUpRight size={15} /></Link><button className={s.mobileToggle} aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(!mobileNav)}>{mobileNav ? <Minus /> : <Plus />}</button></div>
      {mobileNav && <nav className={s.mobileNav} aria-label="Mobile navigation">{[["The experience", "#experience"], ["How it works", "#how-it-works"], ["Questions?", "#questions"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileNav(false)}>{label}<ArrowUpRight size={18} /></a>)}</nav>}
    </header>

    <section ref={hero} className={s.hero} aria-labelledby="hero-title">
      <div className={s.heroCopy}>
        <motion.p {...reveal} className={s.eyebrow}>Digital menus for cafes, restaurants & hotels</motion.p>
        <h1 id="hero-title"><span className={s.line}><motion.span initial={reduced ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: .85, ease: [.22, 1, .36, 1] }}>GOOD FOOD.</motion.span></span><span className={`${s.line} ${s.orange}`}><motion.span initial={reduced ? false : { y: "110%" }} animate={{ y: 0 }} transition={{ duration: .85, delay: .12, ease: [.22, 1, .36, 1] }}>GREAT MENU.</motion.span></span></h1>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: .25 }}><p className={s.heroDescription}>You bring the flavor.<br />We’ll bring it to their fingertips.</p><p className={s.heroSmall}>Beautiful digital menus for cafes, restaurants and hotels. One scan. All the good stuff.</p><div className={s.heroButtons}><Link href="/admin/register" className={s.primary}>Create your menu <ArrowUpRight size={20} /></Link><Link href="/demo" className={s.textLink}>Take a little taste <ArrowRight size={17} /></Link></div><p className={s.micro}><Check size={13} /> No guest app. No reprints. Just good hospitality.</p></motion.div>
      </div>
      <motion.div className={s.cinematicHero} aria-hidden="true"
        initial={reduced ? false : { clipPath: "inset(8% 5% 8% 5% round 180px)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0% round 0px)" }}
        transition={{ duration: 1.5, ease: [.22, 1, .36, 1] }}>
        <motion.div className={s.heroImageLayer} style={reduced ? {} : { y: plateY }}>
          <Image src={toast} alt="" fill sizes="100vw" priority className={s.foodImage} />
        </motion.div>
      </motion.div>
      <a href="#experience" className={s.scrollHint}><span>Keep your appetite. Keep scrolling.</span><ArrowDown size={17} /></a>
    </section>

    <div className={s.ticker} aria-label="Built for cafes, restaurants, and hotels"><div className={s.tickerTrack}>{[0, 1].map((copy) => <span key={copy} aria-hidden={copy === 1}>CAFES <i aria-hidden="true">/</i> RESTAURANTS <i aria-hidden="true">/</i> HOTELS <i aria-hidden="true">/</i> </span>)}</div></div>

    <FlavorSequence reduced={!!reduced} />

    <MenuStory />
    <ImportStory />

    <section className={s.editSection}>
      <motion.div initial={reduced ? false : { clipPath: "inset(12% 10% 12% 10% round 160px)" }} whileInView={{ clipPath: "inset(0% 0% 0% 0% round 4px)" }} viewport={{ once: true, amount: .25 }} transition={{ duration: 1.2, ease: [.22, 1, .36, 1] }} className={s.editPhoto}><Image src={toast} alt="Fresh breakfast served with avocado, eggs and toast" fill sizes="(max-width: 700px) 90vw, 45vw" className={s.foodImage} /><span className={s.photoLabel}>TODAY’S SPECIAL: A BETTER FIRST IMPRESSION.</span></motion.div>
      <motion.div {...reveal} className={s.editCopy}><h2>NEW PRICE.<br />SAME <em>QR.</em></h2><p>Sold out of the special? Changed your prices? Your menu can keep up with your kitchen.</p><div className={s.editDetail}><div><h3>Print once. Update whenever.</h3><p>Your permanent QR follows your menu, even when you rename it.</p></div></div><div className={s.editDetail}><div><h3>Your business has a personality.</h3><p>Bring your name, logo, food photography and story. Give guests something to remember.</p></div></div><Link href="/admin/register" className={s.textLink}>Let’s set your table <ArrowUpRight size={19} /></Link></motion.div>
    </section>

    <section id="questions" className={s.faqSection}><motion.div {...reveal}><h2>BEFORE<br />YOU <em>DIG IN.</em></h2></motion.div><div className={s.faqList}>{questions.map(([question, answer], index) => <div className={s.faqItem} key={question}><h3><button type="button" aria-expanded={faq === index} aria-controls={`faq-${index}`} onClick={() => setFaq(faq === index ? null : index)}>{question}{faq === index ? <Minus size={19} /> : <Plus size={19} />}</button></h3><div id={`faq-${index}`} hidden={faq !== index}><p>{answer}</p></div></div>)}</div></section>

    <section className={s.finalCta}><motion.h2 {...reveal}>LET’S MAKE<br /><span>THEM HUNGRY.</span></motion.h2><Link href="/admin/register">Make your menu <ArrowUpRight size={28} /></Link></section>
    <footer className={s.footer}><Link href="/" className={s.brand}>luxmenu</Link><p>Good food deserves a great menu.<br /><span>Built with Ethiopian hospitality in mind.</span></p><div><Link href="/demo">Try the menu <ArrowUpRight size={14} /></Link><Link href="/admin/login">Business login <ArrowUpRight size={14} /></Link><span>© {new Date().getFullYear()} LuxMenu</span></div></footer>
  </main>;
}


function FlavorSequence({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const frame = useTransform(scrollYProgress, [0, .55], ["inset(15% 17% 15% 17% round 220px)", "inset(0% 0% 0% 0% round 0px)"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.22, 1]);
  const titleY = useTransform(scrollYProgress, [0, 1], [65, -65]);
  const lineOne = useTransform(scrollYProgress, [0, .25, .52, .7], [1, 1, .15, .15]);
  const lineTwo = useTransform(scrollYProgress, [0, .3, .65, 1], [.15, .15, 1, 1]);
  return <section ref={section} className={s.flavorSequence} aria-labelledby="flavor-title">
    <div className={s.flavorSticky}>
      <motion.div className={s.flavorFrame} style={reduced ? {} : { clipPath: frame }}>
        <motion.div className={s.flavorImage} style={reduced ? {} : { scale }}><Image src={rice} alt="Golden rice and vegetables, freshly prepared and ready to share" fill sizes="100vw" className={s.foodImage} /></motion.div>
      </motion.div>
      <div className={s.flavorTop}><span>A MENU IS MORE THAN A LIST.</span><span>IT’S YOUR FIRST HELLO.</span></div>
      <motion.h2 id="flavor-title" className={s.flavorTitle} style={reduced ? {} : { y: titleY }}><motion.span style={reduced ? {} : { opacity: lineOne }}>MADE WITH LOVE.</motion.span><motion.span style={reduced ? {} : { opacity: lineTwo }}>MET WITH A SCAN.</motion.span></motion.h2>
      <div className={s.flavorBottom}><p>The care you put on every plate.<br />Now in every first impression.</p><a href="#experience" aria-label="Explore the menu experience"><ArrowDown size={23} /></a><span>FROM YOUR KITCHEN,<br />WITH PERSONALITY.</span></div>
    </div>
  </section>;
}
