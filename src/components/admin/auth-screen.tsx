"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import s from "./workspace.module.css";

const currencies: Record<string, string> = { ETB: "Br ", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CHF: "CHF", AED: "AED" };
export function AuthScreen({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/auth/${register ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(register ? { ...values, currencySymbol: currencies[String(values.currency)] } : values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please check your details and try again.");
      router.push("/admin"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not connect. Please try again."); setBusy(false); }
  }
  return <main className={`${s.auth} ${register ? s.authRegister : ""}`}>
    <div className={s.authPhoto}><Image src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1800&q=85" alt="Fresh avocado toast served for breakfast" fill priority sizes="100vw" /><div className={s.photoShade} /></div>
    <header className={s.authNav}><Link href="/" className={s.wordmark}>luxmenu</Link><Link href="/">Back to website <ArrowUpRight size={16} /></Link></header>
    <div className={s.authGrid}><div className={s.authEditorial}><p>For the people behind the food.</p><h1>{register ? <>YOUR NEXT<br />{" "}CHAPTER.<br />{" "}<span>ON THE MENU.</span></> : <>GOOD TO<br />{" "}HAVE YOU<br />{" "}<span>BACK.</span></>}</h1><p>{register ? "Your dishes, your identity, your own digital menu." : "A fresh menu. A full house. It starts here."}</p><Link href="/demo">Explore the guest experience <ArrowUpRight size={17} /></Link></div>
    <section className={s.authCard} aria-labelledby="auth-title"><div className={s.formHeading}><span>YOUR WORKSPACE</span><h2 id="auth-title">{register ? "Make it yours." : "Welcome back."}</h2><p>{register ? "Create an account for your cafe, restaurant or hotel." : "Sign in to manage your menus and your business."}</p></div>
      {error && <p className={s.formError} role="alert">{error}</p>}
      <form onSubmit={submit} className={s.authForm}>
        {register && <><label>Business name<input name="hotelName" required maxLength={200} autoComplete="organization" placeholder="Your cafe, restaurant or hotel" /></label><div className={s.formPair}><label>Your name<input name="name" required autoComplete="name" placeholder="Full name" /></label><label>Currency<select name="currency" defaultValue="ETB">{Object.keys(currencies).map(c => <option key={c} value={c}>{c}{c === "ETB" ? " · Ethiopian birr" : ""}</option>)}</select></label></div></>}
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@yourbusiness.com" /></label>
        <label>Password<div className={s.passwordField}><input name="password" type={visible ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} required minLength={register ? 6 : undefined} placeholder={register ? "At least 6 characters" : "Enter your password"} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {register && <div className={s.formPair}><label>City <span>(optional)</span><input name="city" autoComplete="address-level2" placeholder="Addis Ababa" /></label><label>Country <span>(optional)</span><input name="country" autoComplete="country-name" defaultValue="Ethiopia" /></label></div>}
        <button className={s.authSubmit} type="submit" disabled={busy}>{busy ? (register ? "Creating your account…" : "Signing in…") : (register ? "Create your workspace" : "Sign in")}<ArrowUpRight size={18} /></button>
      </form>
      <p className={s.switchAuth}>{register ? "Already have a workspace?" : "New to LuxMenu?"} <Link href={register ? "/admin/login" : "/admin/register"}>{register ? "Sign in" : "Create an account"}</Link></p>
    </section></div><footer className={s.authFooter}><span>Good food deserves a great menu.</span><span>© {new Date().getFullYear()} LuxMenu</span></footer>
  </main>;
}
