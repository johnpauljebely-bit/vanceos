import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LiveMapView } from "@/components/cad/LiveMapView";
import { accentVarForDepartment } from "@/lib/departmentAccent";

export default async function MapPage({ params }: { params: Promise<{ dept: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { dept } = await params;
  return <LiveMapView accentVar={accentVarForDepartment(dept)} />;
}
