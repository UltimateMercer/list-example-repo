import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LooseItem, Series } from "@/lib/store";

export function Ficha({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn("ficha relative overflow-hidden rounded-sm border border-border bg-card p-5 text-card-foreground", onClick && "cursor-pointer", className)}>
      {children}
    </div>
  );
}

export function SeriesFicha({ s, onOpen, big }: { s: Series; onOpen: () => void; big?: boolean }) {
  return (
    <Ficha onClick={onOpen} className={big ? "min-h-[22rem]" : ""}>
      <div className="mb-3 flex items-baseline justify-between border-b-2 border-ink pb-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{s.category} · série</span>
        <span className="font-mono text-[11px] text-muted-foreground">{s.total} vol.</span>
      </div>
      <h3 className={cn("font-display font-bold leading-tight", big ? "text-2xl" : "text-lg")}>{s.title}</h3>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {s.missing.length ? `faltam ${s.missing.length} de ${s.total}` : "coleção completa ✓"}
      </p>
      {s.missing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.missing.map((v) => (
            <span key={v} className="rounded-sm border border-stamp px-1.5 py-0.5 font-mono text-xs text-stamp">#{v}</span>
          ))}
        </div>
      )}
    </Ficha>
  );
}

export function ItemFicha({ i, onFound, big }: { i: LooseItem; onFound: () => void; big?: boolean }) {
  return (
    <Ficha className={big ? "min-h-[22rem]" : ""}>
      <div className="mb-3 flex items-baseline justify-between border-b-2 border-ink pb-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{i.category} · avulso</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={cn("font-display font-bold leading-tight", big ? "text-2xl" : "text-lg")}>{i.title}</h3>
          {i.note && <p className="mt-1 font-mono text-xs text-muted-foreground">{i.note}</p>}
        </div>
        <Button size="sm" variant="outline" onClick={onFound}><Check className="mr-1 h-4 w-4" />Achei</Button>
      </div>
    </Ficha>
  );
}

export function StackView<T extends { id: string }>({
  cards, index, setIndex, render,
}: { cards: T[]; index: number; setIndex: (n: number) => void; render: (c: T) => ReactNode }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const n = cards.length;
  const go = (d: number) => n && setIndex((index + d + n) % n);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  if (!n) return null;
  const behind = [2, 1].filter((o) => o < n);

  return (
    <div>
      <div
        className="relative mx-auto mt-6 h-[24rem] touch-pan-y select-none"
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
        onPointerUp={() => {
          if (Math.abs(dx) > 80) go(dx < 0 ? 1 : -1);
          start.current = null;
          setDx(0);
        }}
        onPointerCancel={() => { start.current = null; setDx(0); }}
      >
        {behind.map((o) => (
          <div key={o} className="absolute inset-x-0 top-0" style={{ transform: `translateY(${-o * 10}px) scale(${1 - o * 0.04})`, zIndex: 10 - o }}>
            <div className="ficha h-[22rem] rounded-sm border border-border bg-card opacity-90" />
          </div>
        ))}
        <div
          key={cards[index]!.id}
          className={cn("absolute inset-x-0 top-0 z-20", !dx && "transition-transform duration-200")}
          style={{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)` }}
        >
          {render(cards[index]!)}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => go(-1)}><ChevronLeft className="h-5 w-5" /></Button>
        <span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
        <Button variant="outline" size="icon" aria-label="Próxima" onClick={() => go(1)}><ChevronRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
