"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { logout, getCurrentUser, type SessionUser } from "@/lib/auth";

const SIDEBAR_COLLAPSED_KEY = "cassette-sidebar-collapsed";

const STEPS = [
  { label: "Script", href: "/script", icon: "edit_note", num: 1 },
  { label: "Voice", href: "/voice", icon: "record_voice_over", num: 2 },
  { label: "Mix", href: "/mix", icon: "tune", num: 3 },
  { label: "Review", href: "/preview", icon: "verified", num: 4 },
  { label: "Deploy", href: "/localise", icon: "rocket_launch", num: 5 },
];

function getActiveIndex(pathname: string): number {
  if (pathname.startsWith("/script")) return 0;
  if (pathname.startsWith("/voice")) return 1;
  if (pathname.startsWith("/mix")) return 2;
  if (pathname.startsWith("/preview")) return 3;
  if (pathname.startsWith("/localise")) return 4;
  return -1;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = getActiveIndex(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
    setUser(getCurrentUser());
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  const initials = user
    ? user.username
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const isBottomActive = (href: string) => pathname.startsWith(href);

  return (
    <aside
      className={`${collapsed ? "w-[56px]" : "w-56"} hidden md:flex flex-col shrink-0 h-full bg-[#111113] border-r border-[#1e1e22] transition-all duration-200 relative`}
    >
      {/* Logo */}
      <div className={`h-14 flex items-center shrink-0 ${collapsed ? "justify-center" : "px-4"}`}>
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 bg-gradient-to-br from-[#8B5CF6] to-[#6d28d9] rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-[#8B5CF6]/20">
            <span className="material-symbols-outlined text-white text-sm">graphic_eq</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-white">Cassette</span>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className={`absolute top-[18px] -right-3 w-5 h-5 rounded-full bg-[#111113] border border-[#27272a] flex items-center justify-center hover:bg-[#1e1e22] transition-colors z-20 ${collapsed ? "" : ""}`}
        aria-label={collapsed ? "Expand" : "Collapse"}
      >
        <span className="material-symbols-outlined text-gray-500 text-[10px]">
          {collapsed ? "chevron_right" : "chevron_left"}
        </span>
      </button>

      {/* Workflow steps */}
      <nav className={`flex-1 ${collapsed ? "px-1.5 pt-4" : "px-2 pt-4"}`}>
        <div className="space-y-0.5">
          {STEPS.map((step, i) => {
            const isActive = i === activeIndex;
            const isPast = activeIndex > i;

            if (collapsed) {
              return (
                <Link
                  key={step.href}
                  href={step.href}
                  title={step.label}
                  className={[
                    "relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-[#8B5CF6]/15"
                      : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "material-symbols-outlined text-lg",
                      isActive ? "text-[#8B5CF6]" : isPast ? "text-gray-400" : "text-gray-600",
                    ].join(" ")}
                  >
                    {step.icon}
                  </span>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]" />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={step.href}
                href={step.href}
                className={[
                  "relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#8B5CF6]/10 text-white"
                    : isPast
                      ? "text-gray-400 hover:bg-white/5"
                      : "text-gray-600 hover:bg-white/5 hover:text-gray-400",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#8B5CF6]" />
                )}
                <div className={[
                  "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                  isActive
                    ? "bg-[#8B5CF6] text-white"
                    : isPast
                      ? "bg-[#27272a] text-gray-400"
                      : "bg-[#1e1e22] text-gray-600",
                ].join(" ")}>
                  {isPast ? (
                    <span className="material-symbols-outlined text-xs text-green-400">check</span>
                  ) : (
                    step.num
                  )}
                </div>
                <span>{step.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom links */}
      <div className={`shrink-0 border-t border-[#1e1e22] ${collapsed ? "px-1.5 py-2" : "px-2 py-2"}`}>
        <div className={collapsed ? "space-y-0.5" : "space-y-0.5"}>
          {/* History */}
          {collapsed ? (
            <Link
              href="/history"
              title="History"
              className={[
                "relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                isBottomActive("/history") ? "bg-[#8B5CF6]/15" : "hover:bg-white/5",
              ].join(" ")}
            >
              <span className={["material-symbols-outlined text-lg", isBottomActive("/history") ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                history
              </span>
            </Link>
          ) : (
            <Link
              href="/history"
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                isBottomActive("/history") ? "bg-[#8B5CF6]/10 text-white" : "text-gray-500 hover:bg-white/5",
              ].join(" ")}
            >
              <span className={["material-symbols-outlined text-lg", isBottomActive("/history") ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                history
              </span>
              History
            </Link>
          )}

          {/* Admin (admin only) */}
          {user?.role === "admin" && (
            collapsed ? (
              <Link
                href="/admin"
                title="Admin"
                className={[
                  "relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                  pathname === "/admin" ? "bg-[#8B5CF6]/15" : "hover:bg-white/5",
                ].join(" ")}
              >
                <span className={["material-symbols-outlined text-lg", pathname === "/admin" ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                  shield_person
                </span>
              </Link>
            ) : (
              <Link
                href="/admin"
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                  pathname === "/admin" ? "bg-[#8B5CF6]/10 text-white" : "text-gray-500 hover:bg-white/5",
                ].join(" ")}
              >
                <span className={["material-symbols-outlined text-lg", pathname === "/admin" ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                  shield_person
                </span>
                Admin
              </Link>
            )
          )}

          {/* Settings */}
          {collapsed ? (
            <Link
              href="/settings"
              title="Settings"
              className={[
                "relative flex items-center justify-center w-10 h-10 mx-auto rounded-xl transition-all duration-200",
                pathname === "/settings" ? "bg-[#8B5CF6]/15" : "hover:bg-white/5",
              ].join(" ")}
            >
              <span className={["material-symbols-outlined text-lg", pathname === "/settings" ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                settings
              </span>
            </Link>
          ) : (
            <Link
              href="/settings"
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200",
                pathname === "/settings" ? "bg-[#8B5CF6]/10 text-white" : "text-gray-500 hover:bg-white/5",
              ].join(" ")}
            >
              <span className={["material-symbols-outlined text-lg", pathname === "/settings" ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                settings
              </span>
              Settings
            </Link>
          )}
        </div>
      </div>

      {/* User */}
      <div className={`shrink-0 border-t border-[#1e1e22] ${collapsed ? "p-2" : "px-3 py-2.5"}`}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6]/25 to-[#6d28d9]/25 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#a78bfa]">{initials}</span>
            </div>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              title="Sign out"
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600 text-lg">logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6]/25 to-[#6d28d9]/25 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#a78bfa]">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-gray-300 truncate">{user?.username || "User"}</p>
            </div>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-gray-600 text-sm">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
