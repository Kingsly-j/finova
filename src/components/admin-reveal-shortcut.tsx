"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase";

/**
 * Keeps the administrative entry out of navigation while retaining a discreet
 * operator shortcut. This is not authorization; /admin APIs verify an admin
 * claim on every request.
 */
export default function AdminRevealShortcut() {
  const router = useRouter();
  const buffer = useRef("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      buffer.current = `${buffer.current}${event.key.toLowerCase()}`.slice(-6);
      if (buffer.current !== "finova") return;
      buffer.current = "";
      router.push(firebaseAuth.currentUser
        ? "/admin?access=finova"
        : "/banking?mode=login&next=admin");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
