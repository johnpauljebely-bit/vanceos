"use client";

/**
 * Browser-side dispatch alerts (tone + spoken callsign) for units that get
 * auto-assigned to a call. Two real platform limits worth being explicit
 * about rather than pretending around:
 *
 * 1. Browsers don't expose whether a tab is muted or the OS volume is off —
 *    there's no API for that (privacy/fingerprinting reasons). What we CAN
 *    detect and require is a one-time user gesture to unlock audio at all
 *    (browsers block autoplay until you interact) — see `unlockAudio()`.
 *    That's the honest version of "make sure audio can actually play,"
 *    not a claim that we know your volume is on.
 * 2. This only fires for whoever currently has the CAD open in a browser
 *    tab — it can't reach an officer who isn't looking at the site at all.
 */

let audioContext: AudioContext | null = null;

export function isAudioUnlocked(): boolean {
  return audioContext !== null && audioContext.state === "running";
}

export async function unlockAudio(): Promise<boolean> {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  return audioContext.state === "running";
}

function beep(ctx: AudioContext, frequency: number, startTime: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = frequency;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.15, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** "beep boop beep boop" then speaks the assignment. Silently no-ops if audio was never unlocked. */
export function playDispatchAlert(callsign: string, postal: string) {
  if (!audioContext || audioContext.state !== "running") return;

  const now = audioContext.currentTime;
  const pattern = [880, 660, 880, 660]; // beep, boop, beep, boop
  pattern.forEach((freq, i) => beep(audioContext!, freq, now + i * 0.35, 0.25));

  const message = `${callsign}, you are now attached to a call at postal ${postal}. Check CAD immediately.`;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 1.0;
  // Delay past the tone pattern so they don't overlap.
  setTimeout(() => window.speechSynthesis.speak(utterance), pattern.length * 350 + 200);
}
