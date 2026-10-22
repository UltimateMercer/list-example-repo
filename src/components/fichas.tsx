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

export function Ficha({ title, category, summary, children, appearance = DEFAULT_APPEARANCE, onEdit, big, actions, count }: {
  title: string; category: string; summary: string; children: ReactNode; actions?: ReactNode; appearance?: Appearance | undefined; onEdit: () => void; big?: boolean; count?: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const gear = <Button variant="ghost" size="icon" className="size-8 text-inherit hover:bg-current/10 hover:text-inherit" aria-label={`Editar ${title}`} title="Editar ficha" onClick={onEdit}><Settings2 /></Button>;
  const face = "ficha relative flex h-full flex-col overflow-hidden bg-paper p-5 text-paper-ink sm:p-7";
  if (!big) {
    return <div data-paper={appearance.paper} data-ink={appearance.ink} className="chamfer chamfer-lg chamfer-br rounded-2xl">
      <section className={cn(face, "chamfer chamfer-lg chamfer-br rounded-2xl")}>
        <header className="relative mb-4 shrink-0 border-b border-current/25 pb-4">
          <div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs uppercase opacity-60">{category}</span>{gear}</div>
          <h2 className="break-words font-display text-2xl font-medium">{title}</h2>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs opacity-60">{summary}</p>{actions}</div>
        </header>
        <div className="relative min-h-0">{children}</div>
      </section>
    </div>;
  }
  const flip = () => setFlipped((f) => !f);
  return <div data-paper={appearance.paper} data-ink={appearance.ink} className="flip-scene h-full w-full">
    <div className={cn("flip-inner relative h-full w-full", flipped && "flipped")}>
      <div className="flip-face chamfer chamfer-lg chamfer-br absolute inset-0 rounded-2xl" aria-hidden={flipped} inert={flipped}>
        <section className={cn(face, "chamfer chamfer-lg chamfer-br rounded-2xl")}>
          <div className="flex items-center justify-between gap-2"><span className="text-xs uppercase opacity-60">{category}</span>{gear}</div>
          <div className="flex flex-1 flex-col justify-center">
            <h2 className="break-words font-display text-3xl font-medium sm:text-4xl">{title}</h2>
            <div className="mt-6 border-t border-current/25 pt-5">
              {count !== undefined && <p className="font-display text-6xl font-medium leading-none">{String(count).padStart(2, "0")}<span className="ml-2 text-sm font-normal opacity-60">faltantes</span></p>}
              <p className="mt-3 text-xs opacity-60">{summary}</p>
            </div>
          </div>
          <div className="pr-10"><Button variant="outline" size="sm" className="border-current/40 bg-transparent text-inherit hover:bg-current/10 hover:text-inherit" onClick={flip}>Ver itens ↻</Button></div>
        </section>
      </div>
      <div className="flip-face flip-back chamfer chamfer-lg chamfer-bl absolute inset-0 rounded-2xl" aria-hidden={!flipped} inert={!flipped}>
        <section className={cn(face, "chamfer chamfer-lg chamfer-bl rounded-2xl")}>
          <header className="relative mb-3 shrink-0 border-b border-current/25 pb-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" className="-ml-2 text-inherit hover:bg-current/10 hover:text-inherit" onClick={flip}><ChevronLeft /> Capa</Button>
              {actions}
            </div>
            <h2 className="break-words font-display text-lg font-medium">{title}</h2>
          </header>
          <div className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">{children}</div>
        </section>
      </div>
    </div>
  </div>;
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
  const go = (d: number, dir?: number) => {
    if (n < 2 || busy.current) return;
    busy.current = true;
    // same motion both ways: front card slides out to the side and tucks behind the pile
    const side = dir ?? (dx !== 0 ? Math.sign(dx) : d > 0 ? -1 : 1);
    setFly({ id: cards[index]!.id, dir: side });
    setTimeout(() => { setIndex((index + d + n) % n); setFly(null); setDx(0); busy.current = false; }, 260);
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
    <div className="relative min-h-0 flex-1 touch-pan-y mb-11 mr-12 select-none"
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
      {[...layers].reverse().map((c) => {
        const o = layers.indexOf(c);
        const isFly = fly?.id === c.id;
        const isTop = o === 0 && !isFly;
        // while dragging, cards behind rise toward the front
        const p = isTop ? Math.min(1, Math.abs(dx) / width()) : fly ? 1 : 0;
        const d = Math.max(0, o - p);
        let transform = `translate(${d * 10}px, ${d * 10}px)`;
        let z = 10 - o;
        if (isTop) transform = `translateX(${dx}px) rotate(${dx / 40}deg)`;
        if (isFly) { transform = `translateX(${fly.dir * width() * 1.15}px) rotate(${fly.dir * 12}deg)`; z = 20; }
        if (enter === c.id) { transform = `translateX(${-width() * 1.15}px) rotate(-12deg)`; }
        return <div key={c.id} aria-hidden={!isTop} inert={!isTop}
          className={cn("absolute inset-0", !isTop && "pointer-events-none")}
          style={{ zIndex: z, transform, transformOrigin: o === 0 ? "50% 90%" : "0 0",
            filter: `brightness(${1 - d * 0.04}) drop-shadow(2px 3px 4px color-mix(in oklab, var(--foreground) 16%, transparent)) drop-shadow(5px 8px 14px color-mix(in oklab, var(--foreground) 10%, transparent))`,
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