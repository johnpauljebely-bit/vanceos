import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/session";
import { lookupByName, lookupVehicleByPlate, lookupLicenceByHolderName, lookupPlayersByUsername } from "@/db/queries/lookup";

export async function GET(request: NextRequest) {
  const { error } = await requireApiSession();
  if (error) return error;

  const tab = request.nextUrl.searchParams.get("tab") ?? "name";

  if (tab === "vehicle") {
    const plate = request.nextUrl.searchParams.get("plate") ?? "";
    const results = await lookupVehicleByPlate(plate);
    return NextResponse.json({ implemented: true, results });
  }

  if (tab === "licence") {
    const name = request.nextUrl.searchParams.get("name") ?? "";
    const results = await lookupLicenceByHolderName(name);
    return NextResponse.json({ implemented: true, results });
  }

  if (tab === "roblox") {
    const query = [
      request.nextUrl.searchParams.get("username"),
      request.nextUrl.searchParams.get("userId"),
    ]
      .filter(Boolean)
      .join(" ");
    const results = await lookupPlayersByUsername(query);
    return NextResponse.json({ implemented: true, results });
  }

  if (tab !== "name") {
    // Identifier/Phone Number/Record ID have no backing data source
    // specified anywhere yet — see LookupWindow's inferred field lists.
    // Real UI, stubbed query.
    return NextResponse.json({ implemented: false, results: null });
  }

  const query = [
    request.nextUrl.searchParams.get("first"),
    request.nextUrl.searchParams.get("last"),
    request.nextUrl.searchParams.get("alias"),
  ]
    .filter(Boolean)
    .join(" ");

  const results = await lookupByName(query);
  return NextResponse.json({ implemented: true, results });
}
