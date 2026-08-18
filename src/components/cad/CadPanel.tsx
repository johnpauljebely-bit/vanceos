"use client";

import { useEffect, useRef, useState } from "react";
import { Search, FileText, Gavel, StickyNote } from "lucide-react";
import { WindowManagerProvider } from "@/components/floating-window/WindowManagerProvider";
import { CadNavBar, type SelfDispatchState } from "./CadNavBar";
import { SelfDispatchApprovalPopup } from "./SelfDispatchApprovalPopup";
import { AudioGateOverlay } from "./AudioGateOverlay";
import { playDispatchAlert } from "@/lib/dispatchAudio";
import { useLiveQuery } from "@/lib/useLiveQuery";
import { CadSidebar, type SidebarItemId } from "./CadSidebar";
import { CadHomePanel } from "./CadHomePanel";
import { CadSplitLayout } from "./CadSplitLayout";
import { CadSettingsWindow } from "./CadSettingsWindow";
import { CallDetailWindow } from "./CallDetailWindow";
import type { CompactCall } from "./CallCard";
import { LiveMapView } from "./LiveMapView";
import { CadMapOverview } from "./CadMapOverview";
import { LookupWindow } from "./lookup/LookupWindow";
import { LookupContent } from "./lookup/LookupContent";
import { CallsBoardWindow, type BoardCall } from "./CallsBoardWindow";
import { CallsBoardContent } from "./CallsBoardContent";
import { RecordsWarrantsWindow } from "./RecordsWarrantsWindow";
import { RecordsWarrantsContent, type RecordsWarrantsCategory } from "./RecordsWarrantsContent";
import { CadSettingsContent } from "./CadSettingsContent";
import { RecordFormWindow, type RecordType } from "./RecordFormWindow";
import { UnitManagerWindow } from "./UnitManagerWindow";
import { TrafficStopWindow } from "./TrafficStopWindow";
import { NotepadWindow } from "./NotepadWindow";
import type { QuickAction } from "./QuickActionSearchBar";
import type { UnitStatus } from "@/lib/unitStatus";
import { accentVarForDepartment, accentTextClassForDepartment } from "@/lib/departmentAccent";
import { loadLayoutMode, saveLayoutMode, type LayoutMode } from "@/lib/layoutMode";
import {
  loadDispatchAlertMuted,
  saveDispatchAlertMuted,
  loadMapOverviewVisible,
  saveMapOverviewVisible,
  loadClockFormat,
  saveClockFormat,
  type ClockFormat,
} from "@/lib/cadSettings";

// Every sidebar tab with adapted splitscreen content — everything else
// still opens as a window even when layoutMode is "split".
const SPLIT_ADAPTED_TABS: SidebarItemId[] = ["search", "call-lookup", "records", "settings"];

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
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [recordsCategory, setRecordsCategory] = useState<RecordsWarrantsCategory>("records");
  const [recordForm, setRecordForm] = useState<{ type: RecordType; draft?: DraftSummary & { details: Record<string, string> | null; subjectName: string | null } } | null>(null);
  const [unitManagerOpen, setUnitManagerOpen] = useState(false);
  const [trafficStopOpen, setTrafficStopOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [selfDispatchState, setSelfDispatchState] = useState<SelfDispatchState>("off");
  const [selfDispatchError, setSelfDispatchError] = useState<string | null>(null);
  const [sidebarActive, setSidebarActive] = useState<SidebarItemId>("home");
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Lazy initializer (not useEffect+setState) so this reads correctly on
  // first client render instead of flashing "windows" then jumping to the
  // saved mode a tick later. loadLayoutMode() itself guards the SSR case.
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => loadLayoutMode());
  const [dispatchAlertMuted, setDispatchAlertMuted] = useState(() => loadDispatchAlertMuted());
  const [mapOverviewVisible, setMapOverviewVisible] = useState(() => loadMapOverviewVisible());
  const [clockFormat, setClockFormat] = useState<ClockFormat>(() => loadClockFormat());

  function changeLayoutMode(mode: LayoutMode) {
    setLayoutMode(mode);
    saveLayoutMode(mode);
  }
  function changeDispatchAlertMuted(muted: boolean) {
    setDispatchAlertMuted(muted);
    saveDispatchAlertMuted(muted);
  }
  function changeMapOverviewVisible(visible: boolean) {
    setMapOverviewVisible(visible);
    saveMapOverviewVisible(visible);
  }
  function changeClockFormat(fmt: ClockFormat) {
    setClockFormat(fmt);
    saveClockFormat(fmt);
  }

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
  // The full structured call form only opens on demand now (Edit / New
  // Call) — it's no longer permanently rendered inline, see CadHomePanel's
  // compact CallCard list for the always-visible summary instead.
  const [viewedCall, setViewedCall] = useState<ActiveCall | null>(null);
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
    const mine = liveUnitsData?.liveUnits?.find((u) => u.callsignKey === myCallsignKey);
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

  function openRecordsWarrants(category: RecordsWarrantsCategory = "records") {
    setRecordsCategory(category);
    setSidebarActive("records");
    if (layoutMode !== "split") setRecordsOpen(true);
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

  const accentVar = accentVarForDepartment(department);
  const accentClass = accentTextClassForDepartment(department);

  const quickActions: QuickAction[] = [
    { id: "lookup", label: "Lookup", icon: <Search size={14} className={accentClass} />, end: "Window" },
    { id: "records", label: "Records", icon: <FileText size={14} className={accentClass} />, end: "Window" },
    { id: "warrants", label: "Warrants & BOLOs", icon: <Gavel size={14} className={accentClass} />, end: "Window" },
    { id: "notepad", label: "Notepad", icon: <StickyNote size={14} className={accentClass} />, end: "Window" },
  ];

  function handleQuickAction(action: QuickAction) {
    switch (action.id) {
      case "lookup":
        setSidebarActive("search");
        setLookupTab("name");
        if (layoutMode !== "split") setLookupOpen(true);
        break;
      case "records":
        openRecordsWarrants("records");
        break;
      case "warrants":
        openRecordsWarrants("warrants");
        break;
      case "notepad":
        setSidebarActive("notepad");
        setNotepadOpen(true);
        break;
    }
  }

  function openCallDetail(call: CompactCall) {
    setViewedCall({ id: call.id, title: call.title });
  }

  // The panel only widens for tabs that actually have adapted splitscreen
  // content to fill it with — see SPLIT_ADAPTED_TABS.
  const isWideSplit = layoutMode === "split" && SPLIT_ADAPTED_TABS.includes(sidebarActive);

  return (
    <WindowManagerProvider accentVar={accentVar}>
      <div className="flex flex-1 flex-col">
        <CadNavBar
          department={department}
          unitNumber={unitNumber}
          status={status}
          onStatusChange={changeStatus}
          selfDispatchState={selfDispatchState}
          onRequestSelfDispatch={requestSelfDispatch}
          quickActions={quickActions}
          onQuickAction={handleQuickAction}
          onOpenUnitManager={() => setUnitManagerOpen(true)}
          clockFormat={clockFormat}
        />

        <div className="relative flex flex-1 overflow-hidden">
          <CadSidebar
            active={sidebarActive}
            onHome={() => setSidebarActive("home")}
            onSearch={() => {
              setSidebarActive("search");
              setLookupTab("name");
              if (layoutMode !== "split") setLookupOpen(true);
            }}
            onCallLookup={() => {
              setSidebarActive("call-lookup");
              if (layoutMode !== "split") setCallsBoardOpen(true);
            }}
            onRecords={() => openRecordsWarrants("records")}
            onTrafficStop={() => {
              setSidebarActive("traffic-stop");
              setTrafficStopOpen(true);
            }}
            onNotepad={() => {
              setSidebarActive("notepad");
              setNotepadOpen(true);
            }}
            onSettings={() => {
              setSidebarActive("settings");
              if (layoutMode !== "split") setSettingsOpen(true);
            }}
            onCreateRecord={startRecord}
            onOpenDraft={openDraft}
            onOpenWarrantsBolosTab={(tab) => openRecordsWarrants(tab)}
            accentVar={accentVar}
          />

          <CadSplitLayout
            wide={isWideSplit}
            left={
              isWideSplit && sidebarActive === "search" ? (
                <div className="p-4">
                  <LookupContent initialTab={lookupTab} accentVar={accentVar} expanded />
                </div>
              ) : isWideSplit && sidebarActive === "call-lookup" ? (
                <div className="p-4">
                  <CallsBoardContent onOpenCall={openCallFromBoard} onJoined={() => setStatus("enroute")} accentVar={accentVar} expanded />
                </div>
              ) : isWideSplit && sidebarActive === "records" ? (
                <div className="p-4">
                  <RecordsWarrantsContent accentVar={accentVar} expanded initialCategory={recordsCategory} />
                </div>
              ) : isWideSplit && sidebarActive === "settings" ? (
                <div className="p-4">
                  <CadSettingsContent
                    layoutMode={layoutMode}
                    onLayoutModeChange={changeLayoutMode}
                    dispatchAlertMuted={dispatchAlertMuted}
                    onDispatchAlertMutedChange={changeDispatchAlertMuted}
                    mapOverviewVisible={mapOverviewVisible}
                    onMapOverviewVisibleChange={changeMapOverviewVisible}
                    clockFormat={clockFormat}
                    onClockFormatChange={changeClockFormat}
                    accentVar={accentVar}
                  />
                </div>
              ) : (
                <CadHomePanel onEditCall={openCallDetail} accentVar={accentVar} />
              )
            }
            right={
              <>
                <LiveMapView embedded accentVar={accentVar} />
                <CadMapOverview visible={mapOverviewVisible} onVisibleChange={changeMapOverviewVisible} />
              </>
            }
          />
        </div>
      </div>

      {viewedCall && (
        <CallDetailWindow
          call={viewedCall}
          canManage={canManage}
          onJoined={() => setStatus("enroute")}
          onSelfCleared={() => {
            setStatus("available");
            setAttachedCallId(null);
            setViewedCall(null);
          }}
          onClose={() => setViewedCall(null)}
          accentVar={accentVar}
        />
      )}
      {lookupOpen && (
        <LookupWindow initialTab={lookupTab} onClose={() => setLookupOpen(false)} accentVar={accentVar} />
      )}
      {callsBoardOpen && (
        <CallsBoardWindow
          onOpenCall={openCallFromBoard}
          onClose={() => setCallsBoardOpen(false)}
          onJoined={() => setStatus("enroute")}
          accentVar={accentVar}
        />
      )}
      {recordsOpen && (
        <RecordsWarrantsWindow
          initialCategory={recordsCategory}
          onClose={() => setRecordsOpen(false)}
          accentVar={accentVar}
        />
      )}
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
          accentVar={accentVar}
        />
      )}
      {unitManagerOpen && (
        <UnitManagerWindow
          currentDepartment={department}
          currentNumber={unitNumber}
          onClose={() => setUnitManagerOpen(false)}
          accentVar={accentVar}
        />
      )}
      {trafficStopOpen && <TrafficStopWindow onClose={() => setTrafficStopOpen(false)} accentVar={accentVar} />}
      {notepadOpen && <NotepadWindow onClose={() => setNotepadOpen(false)} accentVar={accentVar} />}
      {settingsOpen && (
        <CadSettingsWindow
          onClose={() => setSettingsOpen(false)}
          layoutMode={layoutMode}
          onLayoutModeChange={changeLayoutMode}
          dispatchAlertMuted={dispatchAlertMuted}
          onDispatchAlertMutedChange={changeDispatchAlertMuted}
          mapOverviewVisible={mapOverviewVisible}
          onMapOverviewVisibleChange={changeMapOverviewVisible}
          clockFormat={clockFormat}
          onClockFormatChange={changeClockFormat}
          accentVar={accentVar}
        />
      )}

      <SelfDispatchApprovalPopup accentVar={accentVar} />
      <AudioGateOverlay accentVar={accentVar} />

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
