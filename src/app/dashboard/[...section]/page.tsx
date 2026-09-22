import { notFound } from "next/navigation";
import Dashboard from "../dashboard-view";
import { validRoutes } from "../routes";
export default async function Page({ params }: { params: Promise<{ section: string[] }> }) {
  const { section } = await params;
  const route = section.join("/");
  if (!validRoutes.includes(route)) notFound();
  return <Dashboard section={route} />;
}
