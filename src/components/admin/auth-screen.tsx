"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import s from "./workspace.module.css";

const currencies: Record<string, string> = {
  ETB: "Br ",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CHF: "CHF",
  AED: "AED",
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.4l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.98 3.09c.95-2.85 3.6-4.94 6.73-4.94z"
      />
    </svg>
  );
}

export function AuthScreen({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.google === "boolean") {
          setGoogleConfigured(data.google);
        }
      })
      .catch(() => {
        // Ignore provider check failure
      });
  }, []);

  async function handleGoogleSignIn() {
    if (busy || googleBusy) return;
    setError("");

    if (googleConfigured === false) {
      setError(
        "Google Sign-In is ready in Better Auth — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file to enable Google OAuth."
      );
      return;
    }

    setGoogleBusy(true);
    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/admin",
      });
      if (res?.error) {
        throw new Error(res.error.message || "Google sign-in could not be completed.");
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start Google Sign-In. Please check your Google OAuth credentials."
      );
      setGoogleBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || googleBusy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      if (!register) {
        // Sign in via Better Auth email & password + sync token cookie
        const email = String(values.email || "").trim();
        const password = String(values.password || "");
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Please check your details and try again.");
        }
        await authClient.signIn
          .email({
            email,
            password,
          })
          .catch(() => null);
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            currencySymbol: currencies[String(values.currency)],
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Please check your details and try again.");
        }
      }
      router.push("/admin");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not connect. Please try again."
      );
      setBusy(false);
    }
  }

  return (
    <main className={`${s.auth} ${register ? s.authRegister : ""}`}>
      <div className={s.authPhoto}>
        <Image
          src="https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1800&q=85"
          alt="Fresh avocado toast served for breakfast"
          fill
          priority
          sizes="100vw"
        />
        <div className={s.photoShade} />
      </div>
      <header className={s.authNav}>
        <Link href="/" className={s.wordmark}>
          luxmenu
        </Link>
        <Link href="/">
          Back to website <ArrowUpRight size={16} />
        </Link>
      </header>
      <div className={s.authGrid}>
        <div className={s.authEditorial}>
          <p>For the people behind the food.</p>
          <h1>
            {register ? (
              <>
                YOUR NEXT
                <br /> CHAPTER.
                <br /> <span>ON THE MENU.</span>
              </>
            ) : (
              <>
                GOOD TO
                <br /> HAVE YOU
                <br /> <span>BACK.</span>
              </>
            )}
          </h1>
          <p>
            {register
              ? "Your dishes, your identity, your own digital menu."
              : "A fresh menu. A full house. It starts here."}
          </p>
          <Link href="/demo">
            Explore the guest experience <ArrowUpRight size={17} />
          </Link>
        </div>
        <section className={s.authCard} aria-labelledby="auth-title">
          <div className={s.formHeading}>
            <span>YOUR WORKSPACE · BETTER AUTH</span>
            <h2 id="auth-title">{register ? "Make it yours." : "Welcome back."}</h2>
            <p>
              {register
                ? "Create an account for your cafe, restaurant or hotel."
                : "Sign in to manage your menus and your business."}
            </p>
          </div>

          {error && (
            <p className={s.formError} role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className={s.googleButton}
            onClick={handleGoogleSignIn}
            disabled={busy || googleBusy}
          >
            <GoogleIcon />
            <span>
              {googleBusy
                ? "Redirecting to Google…"
                : register
                  ? "Sign up with Google"
                  : "Continue with Google"}
            </span>
          </button>

          <div className={s.authDivider}>
            <span>or continue with email</span>
          </div>

          <form onSubmit={submit} className={s.authForm}>
            {register && (
              <>
                <label>
                  Business name
                  <input
                    name="hotelName"
                    required
                    maxLength={200}
                    autoComplete="organization"
                    placeholder="Your cafe, restaurant or hotel"
                  />
                </label>
                <div className={s.formPair}>
                  <label>
                    Your name
                    <input
                      name="name"
                      required
                      autoComplete="name"
                      placeholder="Full name"
                    />
                  </label>
                  <label>
                    Currency
                    <select name="currency" defaultValue="ETB">
                      {Object.keys(currencies).map((c) => (
                        <option key={c} value={c}>
                          {c}
                          {c === "ETB" ? " · Ethiopian birr" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@yourbusiness.com"
              />
            </label>
            <label>
              Password
              <div className={s.passwordField}>
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={register ? 6 : undefined}
                  placeholder={register ? "At least 6 characters" : "Enter your password"}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
            {register && (
              <div className={s.formPair}>
                <label>
                  City <span>(optional)</span>
                  <input
                    name="city"
                    autoComplete="address-level2"
                    placeholder="Addis Ababa"
                  />
                </label>
                <label>
                  Country <span>(optional)</span>
                  <input
                    name="country"
                    autoComplete="country-name"
                    defaultValue="Ethiopia"
                  />
                </label>
              </div>
            )}
            <button className={s.authSubmit} type="submit" disabled={busy || googleBusy}>
              {busy
                ? register
                  ? "Creating your account…"
                  : "Signing in…"
                : register
                  ? "Create your workspace"
                  : "Sign in"}
              <ArrowUpRight size={18} />
            </button>
          </form>
          <p className={s.switchAuth}>
            {register ? "Already have a workspace?" : "New to LuxMenu?"}{" "}
            <Link href={register ? "/admin/login" : "/admin/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </section>
      </div>
      <footer className={s.authFooter}>
        <span>Good food deserves a great menu.</span>
        <span>© {new Date().getFullYear()} LuxMenu</span>
      </footer>
    </main>
  );
}
