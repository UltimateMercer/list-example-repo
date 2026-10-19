import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_APPEARANCE, HOLD_DURATION, type Appearance } from "@/lib/store";

export function HoldRow({ label, note, checked, onToggle }: { label: string; note?: string; checked: boolean; onToggle: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; setHolding(false); };
  const begin = () => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => { timer.current = null; setHolding(false); onToggle(); }, HOLD_DURATION);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <Button variant="ghost" role="checkbox" aria-checked={checked} aria-label={label}
    className={cn("hold-row relative h-auto min-h-12 w-full justify-start gap-3 overflow-hidden rounded-sm border-b border-current/10 px-3 py-3 text-left font-normal whitespace-normal hover:bg-current/5", holding && "is-holding")}
    onPointerDown={(e) => { if (e.button !== 0) return; origin.current = { x: e.clientX, y: e.clientY }; begin(); }}
    onPointerMove={(e) => { if (origin.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) cancel(); }}
    onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onBlur={cancel}
    onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); } }}
    onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); cancel(); } }}
    onContextMenu={(e) => e.preventDefault()}>
    <span className="hold-fill absolute inset-0 origin-left bg-current/10" />
    <span className={cn("relative flex size-6 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-current", checked && "bg-current")}>
      {checked && <Check className="check-pop size-4 text-paper" />}
    </span>
    <span className={cn("relative min-w-0 flex-1 break-words text-sm", checked && "opacity-50")}>
      <span className={cn("strike", checked && "is-struck")}>{label}</span>
      {note && <span className="mt-1 block text-xs opacity-60">{note}</span>}
    </span>
  </Button>;
}

export function Ficha({ title, category, summary, children, appearance = DEFAULT_APPEARANCE, onEdit, big, actions }: {
  title: string; category: string; summary: string; children: ReactNode; actions?: ReactNode; appearance?: Appearance | undefined; onEdit: () => void; big?: boolean;
}) {
  return <section data-paper={appearance.paper} data-ink={appearance.ink} className={cn("ficha relative flex flex-col overflow-hidden rounded-sm border border-paper-border bg-paper p-5 text-paper-ink sm:p-7", big && "h-full shadow-[0_10px_30px_-12px_oklch(0_0_0/0.35)]")}>
    <header className="relative mb-4 shrink-0 border-b border-current/25 pb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs uppercase opacity-60">{category}</span>
        <Button variant="ghost" size="icon" className="size-8 text-inherit hover:bg-current/10 hover:text-inherit" aria-label={`Editar ${title}`} title="Editar ficha" onClick={onEdit}><Settings2 /></Button>
      </div>
      <h2 className="break-words font-display text-2xl font-medium">{title}</h2>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs opacity-60">{summary}</p>{actions}</div>
    </header>
    <div className={cn("relative min-h-0", big && "scrollbar-none flex-1 overflow-y-auto overscroll-contain")}>{children}</div>
  </section>;
}

export function StackView<T extends { id: string }>({ cards, index, setIndex, render }: {
  cards: T[]; index: number; setIndex: (n: number) => void; render: (c: T) => ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<{ id: string; dir: number } | null>(null);
  const [enter, setEnter] = useState<string | null>(null);
  const start = useRef<{ x: number; y: number; t: number; axis: "x" | "y" | null; id: number } | null>(null);
  const busy = useRef(false);
  const n = cards.length;
  const width = () => (typeof window === "undefined" ? 400 : Math.min(window.innerWidth, 520));
  const go = (d: number) => {
    if (n < 2 || busy.current) return;
    busy.current = true;
    if (d > 0) {
      // current card slides out, then tucks behind the pile
      setFly({ id: cards[index]!.id, dir: dx < 0 || dx === 0 ? -1 : 1 });
      setTimeout(() => { setIndex((index + 1) % n); setFly(null); setDx(0); busy.current = false; }, 260);
    } else {
      // previous card comes from the back of the pile to the front
      const prev = (index - 1 + n) % n;
      setEnter(cards[prev]!.id); setIndex(prev); setDx(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setEnter(null)));
      setTimeout(() => { busy.current = false; }, 320);
    }
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, button, [role='dialog'], [role='combobox']")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const current = cards[index];
  if (!current) return null;
  const end = (commit: boolean) => {
    const s = start.current; start.current = null; setDragging(false);
    if (!s || s.axis !== "x") return;
    const v = Math.abs(dx) / Math.max(1, Date.now() - s.t);
    if (commit && (Math.abs(dx) > 60 || (Math.abs(dx) > 25 && v > 0.4))) go(dx < 0 ? 1 : -1);
    else setDx(0);
  };
  const depth = Math.min(n, 3);
  const layers = Array.from({ length: depth }, (_, o) => cards[(index + o) % n]!);
  const ease = "transform 300ms cubic-bezier(.22,.8,.3,1), filter 300ms, opacity 300ms";
  return <div className="flex min-h-0 flex-1 flex-col pt-2">
    <div className="relative min-h-0 flex-1 touch-pan-y mb-6 select-none"
      onPointerDown={(e) => { if (busy.current) return; start.current = { x: e.clientX, y: e.clientY, t: Date.now(), axis: null, id: e.pointerId }; }}
      onPointerMove={(e) => {
        const s = start.current; if (!s) return;
        const x = e.clientX - s.x; const y = e.clientY - s.y;
        if (!s.axis && (Math.abs(x) > 8 || Math.abs(y) > 8)) {
          s.axis = Math.abs(x) > Math.abs(y) * 0.8 ? "x" : "y";
          if (s.axis === "x") { setDragging(true); try { e.currentTarget.setPointerCapture(s.id); } catch { /* noop */ } }
        }
        if (s.axis === "x") setDx(x);
      }}
      onPointerUp={() => end(true)}
      onPointerCancel={() => end(false)}>
      {fly && !layers.some((c) => c.id === fly.id) ? null : null}
      {[...layers].reverse().map((c) => {
        const o = layers.indexOf(c);
        const isFly = fly?.id === c.id;
        const isTop = o === 0 && !isFly;
        // while dragging, cards behind rise toward the front
        const p = isTop ? Math.min(1, Math.abs(dx) / width()) : fly ? 1 : 0;
        const d = Math.max(0, o - p);
        let transform = `translateY(${d * 10}px) scale(${1 - d * 0.035})`;
        let z = 10 - o;
        if (isTop) transform = `translateX(${dx}px) rotate(${dx / 40}deg)`;
        if (isFly) { transform = `translateX(${fly.dir * width() * 1.15}px) rotate(${fly.dir * 12}deg)`; z = 20; }
        if (enter === c.id) { transform = `translateX(${-width() * 1.15}px) rotate(-12deg)`; }
        return <div key={c.id} aria-hidden={!isTop} inert={!isTop}
          className={cn("absolute inset-0", !isTop && "pointer-events-none")}
          style={{ zIndex: z, transform, transformOrigin: o === 0 ? "50% 90%" : "50% 100%", filter: `brightness(${1 - d * 0.04})`,
            transition: (dragging && isTop) || enter === c.id ? "none" : ease }}>
          {render(c)}
        </div>;
      })}
    </div>
    <div className="flex shrink-0 items-center justify-center gap-6">
      <Button variant="ghost" size="icon" aria-label="Anterior" onClick={() => go(-1)} disabled={n < 2}><ChevronLeft /></Button>
      <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
      <Button variant="ghost" size="icon" aria-label="Próxima" onClick={() => go(1)} disabled={n < 2}><ChevronRight /></Button>
    </div>
  </div>;
}