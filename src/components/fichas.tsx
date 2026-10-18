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
    className={cn("hold-row relative h-auto min-h-12 w-full justify-start overflow-hidden rounded-none border-b border-current/10 px-0 py-3 text-left font-normal whitespace-normal hover:bg-current/5", holding && "is-holding")}
    onPointerDown={(e) => { if (e.button !== 0) return; origin.current = { x: e.clientX, y: e.clientY }; begin(); }}
    onPointerMove={(e) => { if (origin.current && Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10) cancel(); }}
    onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onBlur={cancel}
    onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); begin(); } }}
    onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); cancel(); } }}
    onContextMenu={(e) => e.preventDefault()}>
    <span className="hold-fill absolute inset-0 origin-left bg-current/10" />
    <span className={cn("relative flex size-4 shrink-0 items-center justify-center rounded-[2px] border border-current", checked && "bg-current")}>
      {checked && <Check className="size-3 text-paper" />}
    </span>
    <span className={cn("relative min-w-0 flex-1 break-words text-sm", checked && "opacity-50")}>
      <span className={checked ? "line-through" : ""}>{label}</span>
      {note && <span className="mt-1 block text-xs opacity-60">{note}</span>}
    </span>
  </Button>;
}

export function Ficha({ title, category, summary, children, appearance = DEFAULT_APPEARANCE, onEdit, big }: {
  title: string; category: string; summary: string; children: ReactNode; appearance?: Appearance; onEdit: () => void; big?: boolean;
}) {
  return <section data-paper={appearance.paper} data-ink={appearance.ink} className={cn("ficha relative flex flex-col overflow-hidden rounded-sm border border-paper-border bg-paper p-5 text-paper-ink sm:p-7", big && "h-[min(65dvh,38rem)] min-h-72")}>
    <header className="relative mb-4 shrink-0 border-b border-current/25 pb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs uppercase opacity-60">{category}</span>
        <Button variant="ghost" size="icon" className="size-8 text-inherit hover:bg-current/10 hover:text-inherit" aria-label={`Editar ${title}`} title="Editar ficha" onClick={onEdit}><Settings2 /></Button>
      </div>
      <h2 className="break-words font-display text-2xl font-medium">{title}</h2>
      <p className="mt-2 text-xs opacity-60">{summary}</p>
    </header>
    <div className={cn("relative min-h-0", big && "flex-1 overflow-y-auto overscroll-contain pr-2")}>{children}</div>
  </section>;
}

export function StackView<T extends { id: string }>({ cards, index, setIndex, render }: {
  cards: T[]; index: number; setIndex: (n: number) => void; render: (c: T) => ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const n = cards.length;
  const go = (d: number) => { if (n) setIndex((index + d + n) % n); };
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
  return <div className="mt-8">
    <div className="relative touch-pan-y"
      onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!start.current) return; const x = e.clientX - start.current.x; const y = e.clientY - start.current.y; if (Math.abs(x) > Math.abs(y) && Math.abs(x) > 10) setDx(x); }}
      onPointerUp={() => { if (Math.abs(dx) > 80) go(dx < 0 ? 1 : -1); start.current = null; setDx(0); }}
      onPointerCancel={() => { start.current = null; setDx(0); }}
      onPointerLeave={() => { start.current = null; setDx(0); }}>
      {[2, 1].filter((o) => o < n).map((o) => <div key={o} className="absolute inset-0 rounded-sm border border-border bg-card" style={{ transform: `translateY(${-o * 9}px) scale(${1 - o * .035})` }} />)}
      <div key={current.id} className={cn("relative", !dx && "transition-transform motion-reduce:transition-none")} style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)` }}>{render(current)}</div>
    </div>
    <div className="mt-5 flex items-center justify-center gap-6">
      <Button variant="ghost" size="icon" aria-label="Anterior" onClick={() => go(-1)} disabled={n < 2}><ChevronLeft /></Button>
      <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
      <Button variant="ghost" size="icon" aria-label="Próxima" onClick={() => go(1)} disabled={n < 2}><ChevronRight /></Button>
    </div>
  </div>;
}