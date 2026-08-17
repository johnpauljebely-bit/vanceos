"use client";

import { useEffect, useRef, useState } from "react";
import { Search, FileText, Gavel, Home, Map as MapIcon, StickyNote } from "lucide-react";
import { WindowManagerProvider } from "@/components/floating-window/WindowManagerProvider";
import { TopNavBar, type SelfDispatchState } from "./TopNavBar";
import { SelfDispatchApprovalPopup } from "./SelfDispatchApprovalPopup";
import { AudioGateOverlay } from "./AudioGateOverlay";
import { playDispatchAlert } from "@/lib/dispatchAudio";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { SecondaryToolbar } from "./SecondaryToolbar";
import { CallIntakeForm } from "./CallIntakeForm";
import { ActiveUnitsPanel } from "./ActiveUnitsPanel";
import { ActiveSquadsPanel } from "./ActiveSquadsPanel";
import { LookupWindow } from "./lookup/LookupWindow";
import { CallsBoardWindow, type BoardCall } from "./CallsBoardWindow";
import { WarrantsBolosWindow } from "./WarrantsBolosWindow";
import { RecordsWindow } from "./RecordsWindow";
import { RecordFormWindow, type RecordType } from "./RecordFormWindow";
import { UnitManagerWindow } from "./UnitManagerWindow";
import { TrafficStopWindow } from "./TrafficStopWindow";
import { NotepadWindow } from "./NotepadWindow";
import type { QuickAction } from "./QuickActionSearchBar";
import type { UnitStatus } from "@/lib/unitStatus";

interface ActiveCall {
  id: string;
  title: string | null;
}

interface DraftSummary {
  id: number;
  recordType: RecordType;
  createdAt: string;
}

export function CadPanel({
  department,
  unitNumber,
  initialCall,
  initialStatus,
}: {
  department: string;
  unitNumber: number;
  initialCall: ActiveCall | null;
  initialStatus: UnitStatus;
}) {
  const [status, setStatus] = useState<UnitStatus>(initialStatus);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupTab, setLookupTab] = useState<"name" | "vehicle" | "licence">("name");
  const [callsBoardOpen, setCallsBoardOpen] = useState(false);
  const [warrantsBolosOpen, setWarrantsBolosOpen] = useState(false);
  const [warrantsBolosTab, setWarrantsBolosTab] = useState<"warrants" | "bolos">("warrants");
  const [warrantsBolosAutoForm, setWarrantsBolosAutoForm] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [recordForm, setRecordForm] = useState<{ type: RecordType; draft?: DraftSummary & { details: Record<string, string> | null; subjectName: string | null } } | null>(null);
  const [unitManagerOpen, setUnitManagerOpen] = useState(false);
  const [trafficStopOpen, setTrafficStopOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [selfDispatchState, setSelfDispatchState] = useState<SelfDispatchState>("off");
  const [selfDispatchError, setSelfDispatchError] = useState<string | null>(null);

  // Entering the panel with a unit selected IS being on duty — Active Units
  // presence is independent of the 5-state status (an Unavailable/Busy unit
  // is still "active," just not available for dispatch).
  useEffect(() => {
    fetch("/api/live-units", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onDuty: true, status: initialStatus }),
    });
    // Deliberately run once on mount only — initialStatus is this render's
    // starting value, not something that should re-trigger the PATCH.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heartbeat for the bot's "on duty, not on the CAD" reminder poller (bot
  // reads this via cad_activity, treats anything within ~3min as active) —
  // fire immediately, then every 90s while this panel stays mounted.
  useEffect(() => {
    const beat = () => {
      fetch("/api/cad-activity/heartbeat", { method: "POST" }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 90_000);
    return () => clearInterval(id);
  }, []);

  const [attachedCallId, setAttachedCallId] = useState(initialCall?.id ?? null);
  const [viewedCall, setViewedCall] = useState<ActiveCall | null>(initialCall);
  const canManage = selfDispatchState === "on" || viewedCall === null || viewedCall.id === attachedCallId;

  // Auto-dispatch alert: watch our own live_units row for a call_id that
  // just appeared (e.g. picked as the nearest unit for a traffic stop) and
  // wasn't already the call we're viewing, then play the tone + speech.
  const myCallsignKey = `${department}-${unitNumber}`;
  const lastAlertedCallId = useRef<string | null>(initialCall?.id ?? null);
  const { data: liveUnitsData } = useLiveQuery<{
    liveUnits: Array<{ callsignKey: string; callId: string | null; postal: string | null }>;
  }>("/api/live-units", 4000);

  useEffect(() => {
    const mine = liveUnitsData?.liveUnits.find((u) => u.callsignKey === myCallsignKey);
    if (!mine) return;
    if (mine.callId && mine.callId !== lastAlertedCallId.current) {
      lastAlertedCallId.current = mine.callId;
      playDispatchAlert(String(unitNumber), mine.postal ?? "unknown");
      setStatus("enroute");
      setAttachedCallId(mine.callId);
    } else if (!mine.callId) {
      lastAlertedCallId.current = null;
    }
  }, [liveUnitsData, myCallsignKey, unitNumber]);

  // While a request is pending, poll for the HR's response — approved flips
  // this unit into full dispatcher-level control, denied resets to off.
  useEffect(() => {
    if (selfDispatchState !== "waiting") return;
    const id = setInterval(() => {
      fetch("/api/self-dispatch/mine")
        .then((r) => r.json())
        .then((data: { request: { status: string } | null }) => {
          if (data.request?.status === "approved") {
            setSelfDispatchState("on");
          } else if (data.request?.status === "denied") {
            setSelfDispatchState("off");
            setSelfDispatchError("Your Self Dispatch request was denied.");
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [selfDispatchState]);

  async function requestSelfDispatch() {
    if (selfDispatchState !== "off") return;
    setSelfDispatchError(null);
    const res = await fetch("/api/self-dispatch/request", { method: "POST" });
    if (res.status === 404) {
      setSelfDispatchError("No available HRs to approve Self Dispatch right now.");
      return;
    }
    if (!res.ok) {
      setSelfDispatchError("Couldn't send the Self Dispatch request. Try again.");
      return;
    }
    setSelfDispatchState("waiting");
  }

  async function changeStatus(next: UnitStatus) {
    setStatus(next);
    await fetch("/api/live-units", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  function openCallFromBoard(call: BoardCall) {
    setViewedCall({ id: call.id, title: call.title });
    setCallsBoardOpen(false);
  }

  function openWarrantsBolos(tab: "warrants" | "bolos" = "warrants", autoForm = false) {
    setWarrantsBolosTab(tab);
    setWarrantsBolosAutoForm(autoForm);
    setWarrantsBolosOpen(true);
  }

  function startRecord(type: RecordType) {
    setRecordForm({ type });
    // "Whenever you're making a report it sets your status to busy."
    changeStatus("busy");
  }

  function openDraft(draft: DraftSummary) {
    fetch(`/api/records?drafts=1`)
      .then((r) => r.json())
      .then((data) => {
        const full = (data.records ?? []).find((r: { id: number }) => r.id === draft.id);
        if (full) setRecordForm({ type: draft.recordType, draft: full });
      });
  }

  const quickActions: QuickAction[] = [
    { id: "lookup", label: "Lookup", icon: <Search size={14} className="text-accent-blue" />, end: "Window" },
    { id: "records", label: "Records", icon: <FileText size={14} className="text-accent-blue" />, end: "Window" },
    { id: "warrants", label: "Warrants & BOLOs", icon: <Gavel size={14} className="text-accent-blue" />, end: "Window" },
    { id: "notepad", label: "Notepad", icon: <StickyNote size={14} className="text-accent-blue" />, end: "Window" },
    { id: "home", label: "Home", icon: <Home size={14} className="text-accent-blue" />, end: "Nav" },
    { id: "map", label: "Map", icon: <MapIcon size={14} className="text-accent-blue" />, end: "Nav" },
  ];

  function handleQuickAction(action: QuickAction) {
    switch (action.id) {
      case "lookup":
        setLookupTab("name");
        setLookupOpen(true);
        break;
      case "records":
        setRecordsOpen(true);
        break;
      case "warrants":
        openWarrantsBolos("warrants");
        break;
      case "notepad":
        setNotepadOpen(true);
        break;
    }
  }

  return (
    <WindowManagerProvider>
      <div className="flex flex-1 flex-col">
        <TopNavBar
          department={department}
          status={status}
          onStatusChange={changeStatus}
          selfDispatchState={selfDispatchState}
          onRequestSelfDispatch={requestSelfDispatch}
          onOpenTrafficStop={() => setTrafficStopOpen(true)}
          onOpenNotepad={() => setNotepadOpen(true)}
          onOpenLookup={() => {
            setLookupTab("name");
            setLookupOpen(true);
          }}
          onOpenRecords={() => setRecordsOpen(true)}
          quickActions={quickActions}
          onQuickAction={handleQuickAction}
        />
        <SecondaryToolbar
          callsign={String(unitNumber)}
          department={department}
          status={status}
          onSearch={() => {
            setLookupTab("name");
            setLookupOpen(true);
          }}
          onGetCall={() => setCallsBoardOpen(true)}
          onRecords={() => setRecordsOpen(true)}
          onWarrants={(tab) => openWarrantsBolos(tab ?? "warrants")}
          onCreateRecord={startRecord}
          onOpenDraft={openDraft}
          onOpenUnitManager={() => setUnitManagerOpen(true)}
        />
        <div className="grid flex-1 grid-cols-1 divide-y divide-border-subtle overflow-hidden lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <CallIntakeForm
            key={viewedCall?.id ?? "new"}
            initialCall={viewedCall}
            canManage={canManage}
            onJoined={() => setStatus("enroute")}
            onSelfCleared={() => {
              setStatus("available");
              setAttachedCallId(null);
              setViewedCall(null);
            }}
            onCloseView={() => setViewedCall(null)}
          />
          <div className="flex flex-col overflow-y-auto">
            <ActiveUnitsPanel />
            <ActiveSquadsPanel />
          </div>
        </div>
      </div>

      {lookupOpen && <LookupWindow initialTab={lookupTab} onClose={() => setLookupOpen(false)} />}
      {callsBoardOpen && (
        <CallsBoardWindow
          onOpenCall={openCallFromBoard}
          onClose={() => setCallsBoardOpen(false)}
          onJoined={() => setStatus("enroute")}
        />
      )}
      {warrantsBolosOpen && (
        <WarrantsBolosWindow
          initialTab={warrantsBolosTab}
          autoShowForm={warrantsBolosAutoForm}
          onClose={() => setWarrantsBolosOpen(false)}
        />
      )}
      {recordsOpen && <RecordsWindow onClose={() => setRecordsOpen(false)} />}
      {recordForm && (
        <RecordFormWindow
          recordType={recordForm.type}
          draft={recordForm.draft}
          unitHeader={{
            unitNumber: String(unitNumber),
            agency: department.toUpperCase(),
            division: "",
            unitName: `Unit ${unitNumber}`,
          }}
          onOpenLookup={(tab) => {
            setLookupTab(tab);
            setLookupOpen(true);
          }}
          onSaved={() => {}}
          onClose={() => setRecordForm(null)}
        />
      )}
      {unitManagerOpen && (
        <UnitManagerWindow
          currentDepartment={department}
          currentNumber={unitNumber}
          onClose={() => setUnitManagerOpen(false)}
        />
      )}
      {trafficStopOpen && <TrafficStopWindow onClose={() => setTrafficStopOpen(false)} />}
      {notepadOpen && <NotepadWindow onClose={() => setNotepadOpen(false)} />}

      <SelfDispatchApprovalPopup />
      <AudioGateOverlay />

      {selfDispatchError && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-xs rounded-lg border border-accent-red bg-surface px-4 py-3 text-sm text-fg shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <p>{selfDispatchError}</p>
            <button
              onClick={() => setSelfDispatchError(null)}
              className="text-fg-muted hover:text-fg"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </WindowManagerProvider>
  );
}
