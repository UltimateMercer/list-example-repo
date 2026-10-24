import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_APPEARANCE, HOLD_DURATION, normalizeAppearance, type Appearance } from "@/lib/store";

export function HoldRow({
  label,
  note,
  checked,
  onToggle,
}: {
  label: string;
  note?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const begin = () => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(35);
        } catch {
          /* noop */
        }
      }
      onToggle();
    }, HOLD_DURATION);
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <Button
      variant="ghost"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      aria-description="Mantenha pressionado para alternar"
      className={cn(
        "hold-row relative h-auto min-h-12 w-full justify-start gap-3 overflow-hidden rounded-sm border-b border-current/10 px-3 py-3 text-left font-normal whitespace-normal hover:bg-current/5",
        holding && "is-holding"
      )}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        origin.current = { x: e.clientX, y: e.clientY };
        begin();
      }}
      onPointerMove={(e) => {
        if (
          origin.current &&
          Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 10
        ) {
          cancel();
        }
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onBlur={cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          cancel();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="hold-fill absolute inset-0 origin-left bg-current/10" />
      <span
        className={cn(
          "relative flex size-6 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-current",
          checked && "bg-current"
        )}
      >
        {checked && <Check className="check-pop size-4 text-paper" />}
      </span>
      <span className={cn("relative min-w-0 flex-1 break-words text-sm", checked && "opacity-50")}>
        <span className={cn("strike", checked && "is-struck")}>{label}</span>
        {note && <span className="mt-1 block text-xs opacity-60">{note}</span>}
      </span>
    </Button>
  );
}

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const duration = 720;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{String(display).padStart(2, "0")}</>;
}

const CHAMFER = 44,
  RADIUS = 16,
  FILLET = 8;

function filletPath(w: number, h: number, corner: "br" | "bl") {
  const c = CHAMFER,
    R = RADIUS,
    F = FILLET;
  const pts: [number, number, number][] =
    corner === "br"
      ? [
          [0, 0, R],
          [w, 0, R],
          [w, h - c, F],
          [w - c, h, F],
          [0, h, R],
        ]
      : [
          [0, 0, R],
          [w, 0, R],
          [w, h, R],
          [c, h, F],
          [0, h - c, F],
        ];
  const n = pts.length,
    f = (v: number) => +v.toFixed(2),
    out: string[] = [];
  for (let i = 0; i < n; i++) {
    const [x, y, r] = pts[i]!,
      [px, py] = pts[(i - 1 + n) % n]!,
      [nx, ny] = pts[(i + 1) % n]!;
    const lp = Math.hypot(x - px, y - py),
      ln = Math.hypot(nx - x, ny - y),
      t = Math.min(r, lp / 2, ln / 2);
    const ax = x + ((px - x) / lp) * t,
      ay = y + ((py - y) / lp) * t,
      bx = x + ((nx - x) / ln) * t,
      by = y + ((ny - y) / ln) * t,
      k = 0.55;
    out.push(
      `${i ? "L" : "M"} ${f(ax)} ${f(ay)}`,
      `C ${f(ax + (x - ax) * k)} ${f(ay + (y - ay) * k)} ${f(bx + (x - bx) * k)} ${f(
        by + (y - by) * k
      )} ${f(bx)} ${f(by)}`
    );
  }
  return `path("${out.join(" ")} Z")`;
}

function Fillet({
  corner,
  className,
  children,
}: {
  corner: "br" | "bl";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [clip, setClip] = useState<string>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setClip(filletPath(el.offsetWidth, el.offsetHeight, corner));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [corner]);

  return (
    <section
      ref={ref}
      className={cn(className, !clip && "rounded-2xl")}
      style={clip ? { clipPath: clip } : undefined}
    >
      {children}
    </section>
  );
}

export function HoldAction({
  label,
  onComplete,
}: {
  label: string;
  onComplete: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const begin = () => {
    if (timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onComplete();
    }, HOLD_DURATION);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return <Button type="button" variant="ghost" className={cn("hold-row relative min-h-10 justify-start overflow-hidden text-destructive", holding && "is-holding")} onPointerDown={(e) => { if (e.button === 0) begin(); }} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel} onContextMenu={(e) => e.preventDefault()}>
    <span className="hold-fill absolute inset-0 origin-left bg-current/10" /><span className="relative flex items-center gap-2"><Trash2 /> {label}</span>
  </Button>;
}

export function Ficha({
  title,
  category,
  summary,
  children,
  appearance = DEFAULT_APPEARANCE,
  onEdit,
  editContent,
  startEditing,
  onEditingChange,
  big,
  actions,
  count,
}: {
  title: string;
  category: string;
  summary: string;
  children: ReactNode;
  actions?: ReactNode;
  appearance?: Appearance | undefined;
  onEdit: () => void;
  big?: boolean;
  count?: number;
  editContent?: ReactNode;
  startEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [editing, setEditing] = useState(startEditing ?? false);
  useEffect(() => setEditing(startEditing ?? false), [startEditing]);
  const frontBtnRef = useRef<HTMLButtonElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);

  const flip = () => {
    setFlipped((f) => {
      const next = !f;
      // Ao virar, transferir o foco suavemente para o botão da nova face
      setTimeout(() => {
        if (next) {
          backBtnRef.current?.focus();
        } else {
          frontBtnRef.current?.focus();
        }
      }, 50);
      return next;
    });
  };

  const gear = (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-inherit hover:bg-current/10 hover:text-inherit"
      aria-label={`Editar ${title}`}
      title="Editar ficha"
      onClick={() => {
        setEditing(true);
        onEditingChange?.(true);
        onEdit();
      }}
    >
      <Settings2 />
    </Button>
  );
  const resolvedAppearance = normalizeAppearance(appearance);
  const paperStyle = { "--paper": resolvedAppearance.paper } as CSSProperties;
  const face = "ficha relative flex h-full flex-col overflow-hidden bg-paper p-5 text-paper-ink sm:p-7";

  if (!big) {
    return (
      <div style={paperStyle} data-paper={resolvedAppearance.paper} data-ink={resolvedAppearance.ink}>
        <Fillet corner="br" className={face}>
          {editing && editContent ? (
            <div className="relative min-h-0">
              {isValidElement(editContent)
                ? cloneElement(editContent as React.ReactElement<{ onEditingChange?: (value: boolean) => void }>, {
                    onEditingChange: (value: boolean) => {
                      setEditing(value);
                      onEditingChange?.(value);
                    },
                  })
                : editContent}
            </div>
          ) : (
            <>
              <header className="relative mb-4 shrink-0 border-b border-current/25 pb-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs uppercase opacity-60">{category}</span>
                  {gear}
                </div>
                <h2 className="break-words font-display text-2xl font-medium">{title}</h2>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs opacity-60">{summary}</p>
                  {actions}
                </div>
              </header>
              <div className="relative min-h-0">{children}</div>
            </>
          )}
        </Fillet>
      </div>
    );
  }

  return (
    <div style={paperStyle} data-paper={resolvedAppearance.paper} data-ink={resolvedAppearance.ink} className="flip-scene h-full w-full">
      <div className={cn("flip-inner relative h-full w-full", flipped && "flipped")}>
        <div
          className="flip-face absolute inset-0 rounded-2xl"
          aria-hidden={flipped}
          inert={flipped ? true : undefined}
        >
          <Fillet corner="br" className={face}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase opacity-60">{category}</span>
              {gear}
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <h2 className="break-words font-display text-3xl font-medium sm:text-4xl">{title}</h2>
              <div className="mt-6 border-t border-current/25 pt-5">
                {count !== undefined && (
                  <p className="flex items-baseline gap-3 text-7xl font-medium leading-none sm:text-8xl">
                    <span className="count-display"><CountUp value={count} /></span>
                    <span className="whitespace-nowrap text-sm font-normal opacity-60">faltantes</span>
                  </p>
                )}
                <p className="mt-3 text-xs opacity-60">{summary}</p>
              </div>
            </div>
            <div className="pr-10">
              <Button
                ref={frontBtnRef}
                variant="outline"
                size="sm"
                className="border-current/40 bg-transparent text-inherit hover:bg-current/10 hover:text-inherit"
                onClick={flip}
              >
                Ver itens ↻
              </Button>
            </div>
            {editing && editContent && (
              <div className="ficha absolute inset-0 z-10 overflow-y-auto bg-paper p-5 text-paper-ink sm:p-7">
                {isValidElement(editContent)
                  ? cloneElement(editContent as React.ReactElement<{ onEditingChange?: (value: boolean) => void }>, {
                      onEditingChange: (value: boolean) => {
                        setEditing(value);
                        onEditingChange?.(value);
                      },
                    })
                  : editContent}
              </div>
            )}
          </Fillet>
        </div>
        <div
          className="flip-face flip-back absolute inset-0 rounded-2xl"
          aria-hidden={!flipped}
          inert={!flipped ? true : undefined}
        >
          <Fillet corner="bl" className={face}>
            <header className="relative mb-3 shrink-0 border-b border-current/25 pb-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Button
                  ref={backBtnRef}
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-inherit hover:bg-current/10 hover:text-inherit"
                  onClick={flip}
                >
                  <ChevronLeft /> Capa
                </Button>
                {actions}
              </div>
              <h2 className="break-words font-display text-lg font-medium">{title}</h2>
            </header>
            <div className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
              {children}
            </div>
          </Fillet>
        </div>
      </div>
    </div>
  );
}

export function StackView<T extends { id: string }>({
  cards,
  index,
  setIndex,
  render,
  navigation,
  disabled = false,
}: {
  cards: T[];
  index: number;
  setIndex: (n: number) => void;
  render: (c: T) => ReactNode;
  navigation?: { direction: number; token: number };
  disabled?: boolean;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fly, setFly] = useState<{ id: string; dir: number; d: number } | null>(null);
  const start = useRef<{
    x: number;
    y: number;
    t: number;
    axis: "x" | "y" | null;
    id: number;
  } | null>(null);
  const busy = useRef(false);
  const n = cards.length;
  const width = () => (typeof window === "undefined" ? 400 : Math.min(window.innerWidth, 448));

  const go = (d: number, dir?: number) => {
    if (disabled || n < 2 || busy.current) return;
    busy.current = true;
    const from = cards[index]!;
    const nextIndex = (index + d + n) % n;
    const side = dir ?? (dx !== 0 ? Math.sign(dx) : d < 0 ? -1 : 1);
    setFly({ id: from.id, dir: side, d });
    setTimeout(() => {
      setIndex(nextIndex);
      setFly(null);
      setDx(0);
      busy.current = false;
    }, 260);
  };

  // Keyboard navigation com dependências para evitar re-anexar o listener a cada pixel arrastado
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          "input, textarea, button, [role='dialog'], [role='combobox']"
        )
      ) {
        return;
      }
      if (e.key === "ArrowRight") go(1, -1);
      if (e.key === "ArrowLeft") go(-1, 1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [index, n]);

  useEffect(() => {
    if (navigation && navigation.token > 0) {
      if (!disabled) go(navigation.direction);
    }
  }, [navigation?.token]);

  const current = cards[index];
  if (!current) return null;

  // Mantemos o comportamento de swipe seguro sem quebrar ou trocar os cards de trás
  const end = (commit: boolean) => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (!s || s.axis !== "x") return;
    const v = Math.abs(dx) / Math.max(1, Date.now() - s.t);
    if (commit && (Math.abs(dx) > 60 || (Math.abs(dx) > 25 && v > 0.4))) {
      go(1, dx < 0 ? -1 : 1);
    } else {
      setDx(0);
    }
  };

  const depth = Math.min(n, 3);
  const targetStep = fly && fly.d < 0 ? -1 : 1;
  const layers = Array.from({ length: depth }, (_, o) =>
    o === 0 ? cards[index]! : cards[(index + o * targetStep + n) % n]!
  );
  const ease = "transform 300ms cubic-bezier(.22,.8,.3,1), filter 300ms, opacity 300ms";

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-2">
      <div
        className="relative mx-auto mb-11 min-h-0 w-full max-w-md flex-1 touch-pan-y select-none overflow-visible"
        onPointerDown={(e) => {
          if (disabled || busy.current) return;
          if (
            (e.target as HTMLElement).closest(
              "input, textarea, button, select, [role='combobox'], [role='option'], form, .hold-row"
            )
          ) {
            return;
          }
          start.current = {
            x: e.clientX,
            y: e.clientY,
            t: Date.now(),
            axis: null,
            id: e.pointerId,
          };
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const x = e.clientX - s.x;
          const y = e.clientY - s.y;
          if (!s.axis && (Math.abs(x) > 8 || Math.abs(y) > 8)) {
            s.axis = Math.abs(x) > Math.abs(y) * 0.8 ? "x" : "y";
            if (s.axis === "x") {
              setDragging(true);
              try {
                e.currentTarget.setPointerCapture(s.id);
              } catch {
                /* noop */
              }
            }
          }
          if (s.axis === "x") setDx(x);
        }}
        onPointerUp={() => end(true)}
        onPointerCancel={() => end(false)}
      >
        {[...layers].reverse().map((c) => {
          const o = layers.indexOf(c);
          const isFly = fly?.id === c.id;
          const isTop = o === 0 && !isFly;
          // while dragging, cards behind rise toward the front
          const p = fly ? 1 : Math.min(1, Math.abs(dx) / width());
          const d = Math.max(0, o - p);
          let transform = `translate(${d * 10}px, ${d * 10}px)`;
          let z = 10 - o;
          if (isTop) transform = `translateX(${dx}px) rotate(${dx / 40}deg)`;
          if (isFly) {
            transform = `translateX(${fly.dir * width() * 1.15}px) rotate(${fly.dir * 12}deg)`;
            z = 20;
          }
          return (
            <div
              key={c.id}
              aria-hidden={!isTop}
              inert={!isTop ? true : undefined}
              className={cn("absolute inset-0", !isTop && "pointer-events-none")}
              style={{
                zIndex: z,
                transform,
                transformOrigin: o === 0 ? "50% 90%" : "0 0",
                filter: `brightness(${
                  1 - d * 0.04
                }) drop-shadow(2px 3px 4px color-mix(in oklab, var(--foreground) 16%, transparent)) drop-shadow(5px 8px 14px color-mix(in oklab, var(--foreground) 10%, transparent))`,
                transition: dragging ? "none" : ease,
              }}
            >
              {render(c)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

