
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  useEffect(() => {
    // The existing Products page owns the product form and storage logic.
    router.replace("/admin/products");
  }, [router]);

  return (
    <main style={{ padding: "40px", color: "inherit" }}>
      <h1>New product</h1>
      <p>Opening the product management form…</p>
      <Link href="/admin/products">Return to Products</Link>
    </main>
  );
}
