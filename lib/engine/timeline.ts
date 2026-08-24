import { clamp } from "./easing";

type Ev = "tick" | "play" | "pause" | "stage" | "speed";
type Listener = (ev: Ev, t: number, stageKey: string) => void;

export const TIMELINE_DUR = 9000;

export class TimelineStore {
  t = 0;
  playing = false;
  speed = 1;
  private lastTs: number | null = null;
  private raf: number | null = null;
  private listeners = new Set<Listener>();
  private stageKey = "";

  constructor(private durMs: number = TIMELINE_DUR) {}

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(ev: Ev) {
    this.listeners.forEach((fn) => fn(ev, this.t, this.stageKey));
  }

  private setT(v: number) {
    this.t = v;
    const k = this.stageKeyOf(v);
    if (k !== this.stageKey) { this.stageKey = k; this.emit("stage"); }
    this.emit("tick");
  }

  private stageKeyOf(t: number): string {
    if (t <= 0) return "ready";
    if (t >= 1) return "done";
    if (t < 0.12) return "cpu";
    if (t < 0.18) return "launch";
    if (t < 0.32) return "grid";
    if (t < 0.54) return "sched";
    if (t < 0.76) return "exec";
    return "store";
  }

  play() {
    if (this.playing) return;
    if (this.t >= 1) this.t = 0;
    this.playing = true;
    this.lastTs = null;
    this.emit("play");
    const loop = (ts: number) => {
      if (!this.playing) { this.raf = null; return; }
      if (this.lastTs === null) this.lastTs = ts;
      this.setT(Math.min(1, this.t + ((ts - this.lastTs) / this.durMs) * this.speed));
      this.lastTs = ts;
      if (this.t >= 1) { this.pause(); return; }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.emit("pause");
  }

  togglePlay() { this.playing ? this.pause() : this.play(); }

  seek(v: number) {
    this.setT(clamp(v, 0, 1));
  }

  nudge(dv: number) {
    this.pause();
    this.seek(this.t + dv);
  }

  reset() { this.pause(); this.seek(0); }
  stepForward() { this.nudge(0.02); }
  stepBack() { this.nudge(-0.02); }
  setSpeed(s: number) { this.speed = s; this.emit("speed"); }
}
