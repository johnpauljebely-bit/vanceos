import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LiveMapView } from "@/components/cad/LiveMapView";

export default async function MapPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <LiveMapView />;
}
