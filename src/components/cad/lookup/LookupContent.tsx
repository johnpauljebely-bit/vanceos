"use client";

import { useState } from "react";
import {
  User,
  Car,
  IdCard,
  BadgeCheck,
  Search as SearchIcon,
  Hash,
  Gamepad2,
  History,
  Settings,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { accentIdFromVar, accentBorderTextClassFromVar } from "@/lib/departmentAccent";
import { cn } from "@/lib/cn";

export type TabId = "name" | "vehicle" | "licence" | "identifier" | "phone" | "recordId" | "roblox";

/**
 * Only the Name tab has a confirmed spec + real screenshot. The other six
 * are this plan's own inference (per the brief's own instruction to infer
 * sensible equivalents) — flagged here, not presented as confirmed spec.
 */
const TABS: { id: TabId; label: string; icon: React.ReactNode; fields: string[] }[] = [
  { id: "name", label: "Name", icon: <User size={14} />, fields: ["First", "Last", "DoB", "M.I.", "Alias"] },
  { id: "vehicle", label: "Vehicle", icon: <Car size={14} />, fields: ["Plate", "VIN", "Make", "Model", "Color"] },
  { id: "licence", label: "Licence", icon: <IdCard size={14} />, fields: ["Holder Name", "Class", "Status"] },
  { id: "identifier", label: "Identifier", icon: <BadgeCheck size={14} />, fields: ["Identifier"] },
  { id: "phone", label: "Phone Number", icon: <SearchIcon size={14} />, fields: ["Phone Number"] },
  { id: "recordId", label: "Record ID", icon: <Hash size={14} />, fields: ["Record ID"] },
  { id: "roblox", label: "ROBLOX", icon: <Gamepad2 size={14} />, fields: ["Username", "User ID"] },
];

interface NameResults {
  civilians: { discordId: string; alias: string; rpName: string }[];
  calls: { id: string; title: string | null }[];
  citations: { id: number; offense: string }[];
  callsigns: { department: string; number: number; rank: string }[];
}
interface VehicleResult {
  id: number;
  plate: string;
  make: string | null;
  model: string | null;
  colour: string | null;
  ownerFirstName: string;
  ownerLastName: string;
}
interface LicenceResult {
  id: number;
  type: string;
  status: string;
  holderFirstName: string;
  holderLastName: string;
}
interface PlayerResult {
  discordId: string;
  robloxUsername: string;
  robloxUserId: string | null;
  online: boolean;
}

/**
 * All of Lookup's actual behavior — used both inside FloatingWindow
 * (windows mode) and directly in the splitscreen panel (split mode), so
 * the two presentations never drift out of sync. `expanded` widens the
 * field grid to use the extra room splitscreen gives it.
 */
export function LookupContent({
  initialTab = "name",
  accentVar,
  expanded = false,
}: {
  initialTab?: TabId;
  accentVar?: string;
  expanded?: boolean;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [values, setValues] = useState<Record<string, string>>({});
  const [nameResults, setNameResults] = useState<NameResults | null>(null);
  const [vehicleResults, setVehicleResults] = useState<VehicleResult[] | null>(null);
  const [licenceResults, setLicenceResults] = useState<LicenceResult[] | null>(null);
  const [playerResults, setPlayerResults] = useState<PlayerResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [notImplemented, setNotImplemented] = useState(false);

  const activeTab = TABS.find((t) => t.id === tab)!;
  const accentId = accentIdFromVar(accentVar);
  const activeTabClass = accentBorderTextClassFromVar(accentVar);

  function setField(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function search() {
    setSearching(true);
    setNotImplemented(false);
    setNameResults(null);
    setVehicleResults(null);
    setLicenceResults(null);
    setPlayerResults(null);

    if (tab === "name") {
      const params = new URLSearchParams({
        tab,
        first: values["First"] ?? "",
        last: values["Last"] ?? "",
        alias: values["Alias"] ?? "",
      });
      const res = await fetch(`/api/lookup?${params}`);
      const json = await res.json();
      setNameResults(json.results);
    } else if (tab === "vehicle") {
      const params = new URLSearchParams({ tab, plate: values["Plate"] ?? "" });
      const res = await fetch(`/api/lookup?${params}`);
      const json = await res.json();
      setVehicleResults(json.results);
    } else if (tab === "licence") {
      const params = new URLSearchParams({ tab, name: values["Holder Name"] ?? "" });
      const res = await fetch(`/api/lookup?${params}`);
      const json = await res.json();
      setLicenceResults(json.results);
    } else if (tab === "roblox") {
      const params = new URLSearchParams({
        tab,
        username: values["Username"] ?? "",
        userId: values["User ID"] ?? "",
      });
      const res = await fetch(`/api/lookup?${params}`);
      const json = await res.json();
      setPlayerResults(json.results);
    } else {
      setNotImplemented(true);
    }
    setSearching(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setValues({});
              setNameResults(null);
              setVehicleResults(null);
              setLicenceResults(null);
              setNotImplemented(false);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium",
              tab === t.id ? activeTabClass : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5", expanded && "lg:grid-cols-6")}>
        {activeTab.fields.map((field) => (
          <Input
            key={field}
            value={values[field] ?? ""}
            onChange={(e) => setField(field, e.target.value)}
            placeholder={field}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Select className="w-32" defaultValue="exact">
          <option value="exact">Exact</option>
          <option value="contains">Contains</option>
        </Select>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Recent searches">
          <History size={16} />
        </button>
        <button type="button" className="text-fg-muted hover:text-fg" aria-label="Settings">
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={() => setValues({})}
          className="text-fg-muted hover:text-fg"
          aria-label="Clear"
        >
          <X size={16} />
        </button>
        <Button
          variant="boxed"
          accent={accentId}
          className="ml-auto"
          onClick={search}
          disabled={searching}
          icon={<SearchIcon size={14} />}
        >
          {searching ? "Searching..." : "Search"}
        </Button>
      </div>

      {notImplemented && (
        <p className="text-xs text-fg-muted">
          This tab&apos;s search isn&apos;t wired to real data yet — no table for {activeTab.label.toLowerCase()}{" "}
          records exists in the current spec.
        </p>
      )}

      {nameResults && (
        <div className={cn("grid gap-3 border-t border-border-subtle pt-3 text-sm", expanded && "sm:grid-cols-2")}>
          {nameResults.civilians.length === 0 &&
          nameResults.calls.length === 0 &&
          nameResults.citations.length === 0 &&
          nameResults.callsigns.length === 0 ? (
            <span className="text-fg-muted">No results</span>
          ) : (
            <>
              {nameResults.civilians.map((c) => (
                <div key={c.discordId} className="text-fg">
                  Civilian: {c.rpName} ({c.alias})
                </div>
              ))}
              {nameResults.calls.map((c) => (
                <div key={c.id} className="text-fg">
                  Call: {c.title ?? c.id}
                </div>
              ))}
              {nameResults.citations.map((c) => (
                <div key={c.id} className="text-fg">
                  Citation: {c.offense}
                </div>
              ))}
              {nameResults.callsigns.map((c) => (
                <div key={`${c.department}-${c.number}`} className="text-fg">
                  Callsign: {c.number} ({c.rank})
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {vehicleResults && (
        <div className={cn("grid gap-3 border-t border-border-subtle pt-3 text-sm", expanded && "sm:grid-cols-2")}>
          {vehicleResults.length === 0 ? (
            <span className="text-fg-muted">No results</span>
          ) : (
            vehicleResults.map((v) => (
              <div key={v.id} className="text-fg">
                {v.plate} — {v.make ?? "---"} {v.model ?? ""} ({v.colour ?? "---"}), registered to{" "}
                {v.ownerFirstName} {v.ownerLastName}
              </div>
            ))
          )}
        </div>
      )}

      {licenceResults && (
        <div className={cn("grid gap-3 border-t border-border-subtle pt-3 text-sm", expanded && "sm:grid-cols-2")}>
          {licenceResults.length === 0 ? (
            <span className="text-fg-muted">No results</span>
          ) : (
            licenceResults.map((l) => (
              <div key={l.id} className="text-fg">
                {l.holderFirstName} {l.holderLastName} — {l.type} licence ({l.status})
              </div>
            ))
          )}
        </div>
      )}

      {playerResults && (
        <div className={cn("grid gap-2 border-t border-border-subtle pt-3 text-sm", expanded && "sm:grid-cols-2")}>
          {playerResults.length === 0 ? (
            <span className="text-fg-muted">No results</span>
          ) : (
            playerResults.map((p) => (
              <div key={p.discordId} className="flex items-center gap-2 text-fg">
                <span>{p.robloxUsername}</span>
                {p.robloxUserId && <span className="text-xs text-fg-muted">#{p.robloxUserId}</span>}
                {p.online && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-status-green/15 px-2 py-0.5 text-[10px] font-bold text-accent-status-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-status-green" />
                    In-game
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
