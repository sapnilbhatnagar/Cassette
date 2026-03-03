"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { logout } from "@/lib/auth";

const SIDEBAR_COLLAPSED_KEY = "cassette-sidebar-collapsed";

const STEPS = [
  { label: "Intelligence Collection", href: "/script", icon: "description" },
  { label: "Voice Selection", href: "/voice", icon: "record_voice_over" },
  { label: "Audio Mixing", href: "/mix", icon: "tune" },
  { label: "Peer Review", href: "/preview", icon: "play_circle" },
  { label: "Deploy", href: "/localise", icon: "cell_tower" },
];

const UTILITY_LINKS = [
  { label: "Audio History", href: "/history", icon: "library_music" },
];

function getActiveIndex(pathname: string): number {
  if (pathname.startsWith("/script")) return 0;
  if (pathname.startsWith("/voice")) return 1;
  if (pathname.startsWith("/mix")) return 2;
  if (pathname.startsWith("/preview")) return 3;
  if (pathname.startsWith("/localise")) return 4;
  return -1;
}

function isUtilityActive(pathname: string, href: string): boolean {
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = getActiveIndex(pathname);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <aside
      className={`${collapsed ? "w-[60px]" : "w-64"} hidden md:flex flex-col shrink-0 h-full bg-[#1e1e1e] border-r border-[#27272a] transition-all duration-300 relative`}
    >
      {/* Logo */}
      <div className={`h-14 flex items-center shrink-0 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-[#8B5CF6] rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-lg">graphic_eq</span>
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">Cassette</span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            className="ml-auto w-6 h-6 rounded-md hover:bg-white/5 flex items-center justify-center transition-colors shrink-0"
            aria-label="Collapse sidebar"
          >
            <span className="material-symbols-outlined text-gray-600 text-base">chevron_left</span>
          </button>
        )}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 top-[18px] w-6 h-6 rounded-full bg-[#1e1e1e] border border-[#27272a] flex items-center justify-center hover:bg-[#27272a] transition-colors z-20"
            aria-label="Expand sidebar"
          >
            <span className="material-symbols-outlined text-gray-400 text-xs">chevron_right</span>
          </button>
        )}
      </div>

      {/* Steps */}
      <nav className={`flex-1 ${collapsed ? "px-2 pt-4" : "px-3 pt-4"}`}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 mb-3">
            Workflow
          </p>
        )}
        <div className={collapsed ? "space-y-2" : "space-y-1"}>
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
                    "relative flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-all duration-200",
                    isActive ? "bg-[#8B5CF6]/10" : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "material-symbols-outlined text-xl",
                      isActive ? "text-[#8B5CF6]" : isPast ? "text-gray-400" : "text-gray-600",
                    ].join(" ")}
                  >
                    {step.icon}
                  </span>
                  {isActive && (
                    <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-[#8B5CF6]" />
                  )}
                </Link>
              );
            }

            return (
              <Link
                key={step.href}
                href={step.href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#8B5CF6]/10 text-white"
                    : isPast
                      ? "text-gray-400 hover:bg-white/5"
                      : "text-gray-500 hover:bg-white/5",
                ].join(" ")}
              >
                <span
                  className={[
                    "material-symbols-outlined text-xl",
                    isActive ? "text-[#8B5CF6]" : isPast ? "text-gray-400" : "text-gray-600",
                  ].join(" ")}
                >
                  {step.icon}
                </span>
                {step.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Utility Links */}
      <div className={`shrink-0 border-t border-[#27272a] ${collapsed ? "px-2 pt-3 pb-1" : "px-3 pt-3 pb-1"}`}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-3 mb-2">
            Library
          </p>
        )}
        <div className={collapsed ? "space-y-2" : "space-y-1"}>
          {UTILITY_LINKS.map((link) => {
            const isActive = isUtilityActive(pathname, link.href);
            if (collapsed) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={[
                    "relative flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-all duration-200",
                    isActive ? "bg-[#8B5CF6]/10" : "hover:bg-white/5",
                  ].join(" ")}
                >
                  <span className={["material-symbols-outlined text-xl", isActive ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                    {link.icon}
                  </span>
                  {isActive && <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-[#8B5CF6]" />}
                </Link>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-[#8B5CF6]/10 text-white" : "text-gray-500 hover:bg-white/5",
                ].join(" ")}
              >
                <span className={["material-symbols-outlined text-xl", isActive ? "text-[#8B5CF6]" : "text-gray-600"].join(" ")}>
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`shrink-0 border-t border-[#27272a] ${collapsed ? "p-2 flex flex-col items-center gap-2" : "px-4 py-3"}`}>
        {collapsed ? (
          <>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#6d28d9]/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#8B5CF6]">AU</span>
            </div>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              title="Sign out"
              className="w-9 h-9 mx-auto rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600 text-xl">logout</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#6d28d9]/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#8B5CF6]">AU</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-gray-300 truncate">Admin User</p>
              <p className="text-[10px] text-gray-600 truncate">Cassette Ops</p>
            </div>
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-gray-600 text-base">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
