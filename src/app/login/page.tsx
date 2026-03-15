"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { isAuthenticated, setCurrentUser } from "@/lib/auth";

const GOOGLE_CLIENT_ID =
  "831610007173-mj187cdekomn4t2s57kre7clu2ur1dnk.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (
            el: HTMLElement,
            config: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Google sign-in failed.");
          setLoading(false);
          return;
        }
        setCurrentUser(data.user);
        router.replace("/");
      } catch {
        setError("Google sign-in failed. Please try again.");
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (isAuthenticated()) router.replace("/");
  }, [router]);

  const initializeGoogle = useCallback(() => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    const btnEl = document.getElementById("google-signin-btn");
    if (btnEl) {
      window.google.accounts.id.renderButton(btnEl, {
        theme: "filled_black",
        size: "large",
        width: "100%",
        shape: "pill",
        text: "signin_with",
      });
    }
  }, [handleGoogleResponse]);

  useEffect(() => {
    if (window.google) initializeGoogle();
  }, [initializeGoogle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid username or password.");
        setLoading(false);
        return;
      }
      setCurrentUser(data.user);
      router.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />
      <div className="w-full h-screen flex items-center justify-center bg-[#0f0f12] relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-sm px-4">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-[#8B5CF6] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-[#8B5CF6]/30">
              <span className="material-symbols-outlined text-white text-2xl">
                graphic_eq
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Cassette
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              AI Audio Production Suite
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-7 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-6">
              Sign in to your workspace
            </p>

            {/* Google SSO */}
            <div className="mb-5">
              <div
                id="google-signin-btn"
                className="w-full flex justify-center"
              />
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#27272a]" />
              <span className="text-xs text-gray-600 font-medium">
                or sign in with credentials
              </span>
              <div className="flex-1 h-px bg-[#27272a]" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-lg pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                    autoComplete="username"
                    className="w-full bg-[#27272a] border border-[#3f3f46] text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-lg pointer-events-none">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-[#27272a] border border-[#3f3f46] text-white placeholder-gray-600 rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <span className="material-symbols-outlined text-base shrink-0">
                    error
                  </span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7c3aed] to-[#8a2be2] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      login
                    </span>
                    Sign in
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-[#27272a] text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-[#8B5CF6] hover:text-[#a78bfa] font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-700 mt-6">
            Cassette · AI Audio Production Suite
          </p>
        </div>
      </div>
    </>
  );
}
