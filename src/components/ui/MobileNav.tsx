"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/script", icon: "description", label: "Script" },
  { href: "/voice", icon: "record_voice_over", label: "Voice" },
  { href: "/mix", icon: "tune", label: "Mix" },
  { href: "/preview", icon: "play_circle", label: "Review" },
  { href: "/localise", icon: "cell_tower", label: "Deploy" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1e1e1e] border-t border-[#27272a]">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors",
              active ? "text-[#8B5CF6]" : "text-gray-600 hover:text-gray-400",
            ].join(" ")}
          >
            <span className={`material-symbols-outlined text-xl ${active ? "text-[#8B5CF6]" : ""}`}>
              {item.icon}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
