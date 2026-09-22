import { redirect } from "next/navigation";

/** An intentionally unlinked entry point; server-side administrator claims still protect /admin. */
export default function FinovaControlPage() {
  redirect("/admin?access=finova");
}
