"use client";

import { useEffect, useState } from "react";
import { Settings, X, ExternalLink, Plus, MapPin, FileText, Send, LogOut, LogIn } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

interface CallNote {
  id: number;
  noteType: string;
  noteText: string;
  createdAt: string;
}

interface ActiveCall {
  id: string;
  title: string | null;
}

/**
 * `canManage` mirrors Melonly's rule: "Call info can only be managed by
 * dispatchers or units in self-dispatch mode." When false, structured
 * fields are read-only, but joining and adding notes still work — those
 * are how a non-dispatcher unit shows involvement, per the brief.
 */
export function CallIntakeForm({
  initialCall,
  canManage,
  onJoined,
  onSelfCleared,
  onCloseView,
}: {
  initialCall: ActiveCall | null;
  canManage: boolean;
  onJoined?: () => void;
  onSelfCleared?: () => void;
  onCloseView?: () => void;
}) {
  const [call, setCall] = useState<ActiveCall | null>(initialCall);
  const [notes, setNotes] = useState<CallNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("Text");

  const [status, setStatus] = useState("new");
  const [type, setType] = useState("");
  const [origin, setOrigin] = useState("");
  const [primaryUnit, setPrimaryUnit] = useState("");
  const [title, setTitle] = useState(initialCall?.title ?? "");
  const [panels, setPanels] = useState("All");
  const [code, setCode] = useState("");
  const [priority, setPriority] = useState("");
  const [postal, setPostal] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    if (!initialCall) return;
    fetch(`/api/calls/${initialCall.id}/notes`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => {});
  }, [initialCall]);

  const fieldsDisabled = !canManage;

  async function submitCall(e: React.FormEvent) {
    e.preventDefault();
    if (fieldsDisabled) return;
    setSubmitting(true);
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: call?.id,
        status,
        type: type || undefined,
        origin: origin || undefined,
        primaryUnitCallsign: primaryUnit || undefined,
        title,
        panels,
        code: code || undefined,
        priority: priority || undefined,
        postal: postal || undefined,
        address: address || undefined,
        description: description || undefined,
        assignSelf: true,
      }),
    });
    if (res.ok) {
      const { call: created } = await res.json();
      setCall(created);
    }
    setSubmitting(false);
  }

  async function submitNote() {
    if (!call || !noteText.trim()) return;
    const res = await fetch(`/api/calls/${call.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteType, noteText }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [...prev, note]);
      setNoteText("");
    }
  }

  // Self Clear detaches this unit from every call it's on (not just the one
  // being viewed) and goes available — a per-unit reset, not closing the call.
  async function selfClear() {
    const res = await fetch("/api/self-clear", { method: "POST" });
    if (res.ok) {
      setCall(null);
      onSelfCleared?.();
    }
  }

  async function joinCall() {
    if (!call) return;
    setJoining(true);
    const res = await fetch(`/api/calls/${call.id}/join`, { method: "POST" });
    if (res.ok) onJoined?.();
    setJoining(false);
  }

  async function broadcastUpdate() {
    if (!call) return;
    setBroadcasting(true);
    await fetch(`/api/calls/${call.id}/broadcast`, { method: "POST" });
    setBroadcasting(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-fg">{call?.title || "No Active Call"}</h2>
        <div className="flex items-center gap-3">
          {call && !canManage && (
            <Button variant="plain" accent="teal" onClick={joinCall} disabled={joining} icon={<LogIn size={14} />}>
              {joining ? "Joining..." : "Join"}
            </Button>
          )}
          <Button variant="plain" accent="neutral" disabled={!call} onClick={selfClear} icon={<LogOut size={14} />}>
            Self Clear
          </Button>
          <Button
            variant="plain"
            accent="teal"
            icon={<Settings size={14} />}
            disabled={!call || broadcasting}
            onClick={broadcastUpdate}
            title="Re-announce this call's current status/postal/primary unit to all units"
          >
            {broadcasting ? "Broadcasting..." : "Automations"}
          </Button>
          <button
            type="button"
            onClick={() => onCloseView?.()}
            className="text-fg-muted hover:text-fg"
            aria-label="Close view"
            title="Stop viewing this call (doesn't detach you from it)"
          >
            <X size={16} />
          </button>
          <button type="button" className="text-fg-muted hover:text-fg" aria-label="Open in new window">
            <ExternalLink size={16} />
          </button>
          <button type="button" className="text-fg-muted hover:text-fg" aria-label="Add">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {call && !canManage && (
        <p className="text-xs text-fg-muted">
          Read-only — only dispatchers or units in Self Dispatch mode can edit call fields. Join or add notes to
          show involvement instead.
        </p>
      )}

      <fieldset disabled={fieldsDisabled} className="contents">
        <form onSubmit={submitCall} className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-sm font-bold text-fg">Units:</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label required>Status</Label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1">
                  <option value="new">New</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="en_route">En Route</option>
                  <option value="on_scene">On Scene</option>
                  <option value="cleared">Cleared</option>
                </Select>
              </div>
              <div>
                <Label required>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)} className="mt-1">
                  <option value="">N/A</option>
                  <option value="traffic">Traffic</option>
                  <option value="disturbance">Disturbance</option>
                  <option value="medical">Medical</option>
                  <option value="crime">Crime</option>
                </Select>
              </div>
              <div>
                <Label>Origin</Label>
                <Select value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1">
                  <option value="">N/A</option>
                  <option value="911">911</option>
                  <option value="dispatch">Dispatch</option>
                  <option value="self_initiated">Self-Initiated</option>
                </Select>
              </div>
              <div>
                <Label>Primary Unit</Label>
                <Select value={primaryUnit} onChange={(e) => setPrimaryUnit(e.target.value)} className="mt-1">
                  <option value="">No units assigned</option>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <Label required>Call Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>

          <div>
            <Label required>Panels</Label>
            <Select value={panels} onChange={(e) => setPanels(e.target.value)} className="mt-1">
              <option value="All">All</option>
              <option value="Fire">Fire</option>
              <option value="LEO">LEO</option>
              <option value="EMS">EMS</option>
            </Select>
          </div>

          <div>
            <Label>Code</Label>
            <Select value={code} onChange={(e) => setCode(e.target.value)} className="mt-1">
              <option value="">N/A</option>
              <option value="code1">Code 1</option>
              <option value="code2">Code 2</option>
              <option value="code3">Code 3</option>
            </Select>
          </div>

          <div>
            <Label>Priority</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1">
              <option value="">N/A</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>

          <div>
            <Label>Postal</Label>
            <Input value={postal} onChange={(e) => setPostal(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Address</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="flex-1" />
              <button type="button" className="text-fg-muted hover:text-accent-teal" aria-label="Location">
                <MapPin size={18} />
              </button>
              <button type="button" className="text-fg-muted hover:text-accent-teal" aria-label="Notes">
                <FileText size={18} />
              </button>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>

          {canManage && (
            <Button type="submit" variant="boxed" accent="teal" disabled={submitting || !title.trim()} className="self-start">
              {submitting ? "Saving..." : call ? "Update Call" : "Create Call"}
            </Button>
          )}
        </form>
      </fieldset>

      <div>
        <Label>Call Notes</Label>
        <div className="mt-2 flex flex-col gap-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-fg">
              <span className="mr-2 text-xs font-bold text-fg-muted">[{n.noteType}]</span>
              {n.noteText}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="w-28">
            <option value="Text">Text</option>
            <option value="System">System</option>
          </Select>
          <Input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Note Text"
            disabled={!call}
            className="flex-1"
          />
          <button
            type="button"
            onClick={submitNote}
            disabled={!call || !noteText.trim()}
            className="text-accent-teal disabled:opacity-40"
            aria-label="Send note"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
