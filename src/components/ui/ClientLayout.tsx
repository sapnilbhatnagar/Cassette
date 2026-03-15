"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { isAuthenticated } from "@/lib/auth";

const PUBLIC_ROUTES = ["/login", "/signup"];

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isPublicPage = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isPublicPage) {
      setChecked(true);
      return;
    }
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [pathname, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (!checked) return null;

  return (
    <>
      <Sidebar />
      <main className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
