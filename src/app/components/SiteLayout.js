
"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import AssistantWidget from "./AssistantWidget";
import CartToast from "./CartToast";

export default function SiteLayout({ children }) {
  const pathname = usePathname();
  const isAdminPage =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AssistantWidget />
      <CartToast />
    </>
  );
}
