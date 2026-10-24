"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowDownUp, Layers, List, BookOpen, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Ficha, HoldAction, HoldRow, StackView } from "@/components/fichas";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, DEFAULT_APPEARANCE, getContrastInk, normalizeAppearance, type Appearance, type Category, type Data, type Series, type Nomenclature, toggleMissing, uid, useData, volumeLabel } from "@/lib/store";


type Card = { id: string; series?: Series; draft?: boolean };
const LOOSE_ID = "loose-items";
const NEW_ID = "new-ficha";

export default function Index() {
  const [data, setData, loaded] = useData();
  const q = "";
  const [sort, setSort] = useState<"order" | "missing">("order");
  const [newItem, setNewItem] = useState("");
  const [mode, setMode] = useState<"stack" | "list">("stack");
  const [idx, setIdx] = useState(0);
  const [navigation, setNavigation] = useState({ direction: 1, token: 0 });
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexQ, setIndexQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [draftAppearance, setDraftAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [editId, setEditId] = useState<string | null>(null);

  const startAdding = () => {
    setDraftAppearance(DEFAULT_APPEARANCE);
    setAdding(true);
    setIdx(0);
  };

  const allCards: Card[] = [
    ...(adding ? [{ id: NEW_ID, draft: true } as Card] : []),
    ...data.series.map((s) => ({ id: s.id, series: s })),
    { id: LOOSE_ID },
  ];
  const matches = (card: Card, query: string) => {
    if (card.draft) return true;
    if (card.series) return card.series.title.toLowerCase().includes(query);
    return "avulsos".includes(query) || data.items.some((i) => i.title.toLowerCase().includes(query));
  };
  const cards = allCards.filter((card) => matches(card, q.trim().toLowerCase()));
  const current = Math.min(idx, Math.max(0, cards.length - 1));
  const updateSeries = (id: string, patch: Partial<Series>) => setData((d) => ({ ...d, series: d.series.map((s) => {
    if (s.id !== id) return s;
    const next = { ...s, ...patch };
    return patch.appearance ? { ...next, appearance: normalizeAppearance(patch.appearance) } : next;
  }) }));
  const jump = (id: string) => { setMode("stack"); setIdx(allCards.findIndex((c) => c.id === id)); setIndexOpen(false); };
  const sortBtn = <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-inherit hover:bg-current/10 hover:text-inherit" aria-label="Alterar ordenação" onClick={() => setSort(sort === "order" ? "missing" : "order")}><ArrowDownUp className="size-3.5" />{sort === "order" ? "Em ordem" : "Faltantes primeiro"}</Button>;
  const ord = <T,>(arr: T[], has: (x: T) => boolean) => sort === "missing" ? [...arr.filter((x) => !has(x)), ...arr.filter(has)] : arr;
  const render = (card: Card, big = false) => {
    if (card.draft)
      return (
        <Ficha
          title="Nova ficha"
          category="Criar"
          summary="Preencha os dados da nova coleção"
          appearance={draftAppearance}
          big={big}
          startEditing
          editContent={
            <InlineCreate
              appearance={draftAppearance}
              onAppearanceChange={setDraftAppearance}
              onCancel={() => setAdding(false)}
              onCreate={(title, category, total, nomenclature, appearance) => {
                const id = uid();
                setData((d) => ({
                  ...d,
                  series: [
                    {
                      id,
                      title,
                      category,
                      total,
                      missing: Array.from({ length: total }, (_, k) => k + 1),
                      nomenclature,
                      appearance,
                    },
                    ...d.series,
                  ],
                }));
                setAdding(false);
                setIdx(0);
              }}
            />
          }
          onEditingChange={(editing) => {
            if (!editing) setAdding(false);
          }}
          onEdit={() => {}}
        >
          {null}
        </Ficha>
      );
    const s = card.series;
    if (s) return <Ficha title={s.title} category={`${s.category} / ${s.nomenclature === "Edição" ? "edições" : "volumes"}`} summary={`${s.missing.length} faltantes · ${s.total - s.missing.length} na coleção · ${s.total} no total`} appearance={s.appearance} big={big} count={s.missing.length} actions={sortBtn} onEdit={() => setEditId(s.id)} editContent={<InlineEdit series={s} onClose={() => setEditId(null)} onUpdate={(patch) => updateSeries(s.id, patch)} onAppearance={(appearance) => updateSeries(s.id, { appearance })} onDelete={() => { if (confirm("Excluir esta série?")) { setData((d) => ({ ...d, series: d.series.filter((x) => x.id !== s.id) })); setEditId(null); } }} onEditingChange={(editing) => { if (!editing) setEditId(null); }} />}>
      {ord(Array.from({ length: s.total }, (_, k) => k + 1), (v) => !s.missing.includes(v)).map((v) => <HoldRow key={v} label={volumeLabel(s, v)} checked={!s.missing.includes(v)} onToggle={() => setData((d) => ({ ...d, series: d.series.map((x) => x.id === s.id ? { ...x, missing: toggleMissing(x.missing, v) } : x) }))} />)}
    </Ficha>;
    const items = data.items.filter((i) => !q.trim() || "avulsos".includes(q.trim().toLowerCase()) || i.title.toLowerCase().includes(q.trim().toLowerCase()));
    return <Ficha title="Avulsos" category="Itens individuais" summary={`${data.items.filter((i) => !i.found).length} faltantes · ${data.items.filter((i) => i.found).length} na coleção`} appearance={data.looseAppearance} big={big} count={data.items.filter((i) => !i.found).length} actions={sortBtn} onEdit={() => setEditId(LOOSE_ID)} editContent={<InlineLooseEdit appearance={data.looseAppearance ?? DEFAULT_APPEARANCE} onAppearance={(looseAppearance) => setData((d) => ({ ...d, looseAppearance }))} onClose={() => setEditId(null)} />}>
      {ord(items, (i) => !!i.found).map((i) => <HoldRow key={i.id} label={i.title} note={i.note || i.category} checked={!!i.found} onToggle={() => setData((d) => ({ ...d, items: d.items.map((x) => x.id === i.id ? { ...x, found: !x.found } : x) }))} />)}
      {items.length === 0 && <div className="py-8 text-center"><BookOpen className="mx-auto mb-3 size-6 opacity-40" /><p className="text-sm opacity-60">Nenhum item avulso</p></div>}
      <form className="mt-3 flex items-center gap-2 px-3" onSubmit={(e) => { e.preventDefault(); const t = newItem.trim(); if (!t) return; setData((d) => ({ ...d, items: [...d.items, { id: uid(), title: t, category: "Livro" as Category }] })); setNewItem(""); }}><Plus className="size-4 shrink-0 opacity-60" /><input aria-label="Novo item avulso" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Adicionar item…" className="min-w-0 flex-1 border-b border-current/25 bg-transparent py-2 text-sm outline-none placeholder:text-current/40 focus:border-current" /></form>
    </Ficha>;
  };
  return <main className="flex h-dvh w-full flex-col overflow-x-clip overflow-y-hidden px-5 pb-4 pt-5 sm:px-8 sm:pt-8">
    <header className="mb-4 w-full shrink-0">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Faltantes<span className="text-muted-foreground">.</span></h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Fichas empilhadas" aria-label="Fichas empilhadas" aria-pressed={mode === "stack"} className={mode === "stack" ? "bg-secondary" : ""} onClick={() => setMode("stack")}><Layers /></Button>
          <Button variant="ghost" size="icon" title="Lista contínua" aria-label="Lista contínua" aria-pressed={mode === "list"} className={mode === "list" ? "bg-secondary" : ""} onClick={() => setMode("list")}><List /></Button>
          <span className="mx-1 h-5 border-l border-border" />
          <Button variant="ghost" size="icon" title="Índice" aria-label="Índice" onClick={() => setIndexOpen(true)}><BookOpen /></Button>
          <Button variant="outline" size="sm" className="ml-1" onClick={startAdding} aria-label="Nova ficha"><Plus /> <span className="hidden sm:inline">Nova ficha</span></Button>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-b border-border pb-4 text-xs text-muted-foreground"><span>{String(allCards.length).padStart(2, "0")} fichas · {data.series.reduce((n, s) => n + s.missing.length, 0) + data.items.filter((i) => !i.found).length} faltantes</span>{mode === "stack" && cards.length > 1 && <span className="flex items-center gap-1"><Button variant="ghost" size="icon" className="size-7" aria-label="Ficha anterior" onClick={() => setNavigation({ direction: -1, token: navigation.token + 1 })}><ChevronLeft /></Button><Button variant="ghost" size="icon" className="size-7" aria-label="Próxima ficha" onClick={() => setNavigation({ direction: 1, token: navigation.token + 1 })}><ChevronRight /></Button></span>}</div>
    </header>
    {!loaded ? <p className="py-12 text-center text-sm text-muted-foreground">Abrindo fichário…</p> : cards.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma ficha encontrada.</p> : mode === "stack" ? <StackView cards={cards} index={current} setIndex={setIdx} navigation={navigation} render={(card) => render(card, true)} /> : <div className="scrollbar-none mx-auto min-h-0 w-full max-w-md flex-1 space-y-6 overflow-y-auto">{cards.map((card) => <div key={card.id}>{render(card)}</div>)}</div>}
    <Sheet open={indexOpen} onOpenChange={setIndexOpen}><SheetContent side="left" className="sheet-surface flex w-80 flex-col px-5"><SheetHeader className="px-0"><SheetTitle>Índice</SheetTitle></SheetHeader><Input aria-label="Pular para ficha" value={indexQ} onChange={(e) => setIndexQ(e.target.value)} placeholder="Pular para..." /><div className="flex-1 overflow-y-auto">{allCards.filter((c) => matches(c, indexQ.trim().toLowerCase())).map((c) => <Button key={c.id} variant="ghost" className="h-auto w-full justify-between rounded-none border-b py-4 whitespace-normal text-left" onClick={() => jump(c.id)}><span className="min-w-0 break-words">{c.series?.title ?? "Avulsos"}</span><ArrowUpRight className="shrink-0" /></Button>)}</div></SheetContent></Sheet>

  </main>;
}

const papers = [{ id: "#fffdf7", name: "Branco" }, { id: "#d7bc8b", name: "Craft" }, { id: "#a98968", name: "Sépia" }, { id: "#ead1d0", name: "Rosa" }, { id: "#c9d9c4", name: "Verde" }, { id: "#c9d9e8", name: "Azul" }];
function AppearanceFields({ value, onChange }: { value: Appearance; onChange: (a: Appearance) => void }) {
  const appearance = normalizeAppearance(value);
  const setPaper = (paper: string) => onChange({ paper, ink: getContrastInk(paper) });
  return <div className="space-y-4"><fieldset><legend className="mb-2 text-sm font-medium">Cor do papel</legend><div className="flex flex-wrap items-center gap-2">{papers.map((p) => <Button type="button" key={p.id} variant="outline" size="icon" aria-label={`Papel ${p.name}`} title={p.name} aria-pressed={appearance.paper === p.id} className={`size-8 rounded-full bg-transparent p-0 ${appearance.paper === p.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} style={{ backgroundColor: p.id }} onClick={() => setPaper(p.id)} />)}<label className="relative size-8 cursor-pointer overflow-hidden rounded-full border border-border" title="Escolher cor personalizada"><span className="sr-only">Escolher cor personalizada</span><input type="color" value={appearance.paper} onChange={(e) => setPaper(e.target.value)} className="absolute inset-[-8px] size-12 cursor-pointer" /></label></div></fieldset><p className="text-xs text-muted-foreground">A cor do texto é definida automaticamente para manter o contraste.</p></div>;
}
function NomenclatureField({ value, onChange }: { value: Nomenclature; onChange: (v: Nomenclature) => void }) {
  return <div className="space-y-2"><Label>Nomenclatura</Label><Select value={value} onValueChange={(v) => onChange(v as Nomenclature)}><SelectTrigger aria-label="Nomenclatura"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Volume">Volume</SelectItem><SelectItem value="Edição">Edição</SelectItem></SelectContent></Select></div>;
}
function InlineCreate({ onCancel, onCreate, appearance = DEFAULT_APPEARANCE, onAppearanceChange }: { onCancel: () => void; onCreate: (title: string, category: Category, total: number, nomenclature: Nomenclature, appearance: Appearance) => void; appearance?: Appearance; onAppearanceChange?: (a: Appearance) => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Mangá");
  const [total, setTotal] = useState("1");
  const [nomenclature, setNomenclature] = useState<Nomenclature>("Volume");
  const [localAppearance, setLocalAppearance] = useState<Appearance>(appearance);

  const activeAppearance = appearance ?? localAppearance;
  const handleAppearanceChange = (next: Appearance) => {
    setLocalAppearance(next);
    onAppearanceChange?.(next);
  };

  return <form className="flex min-h-full flex-col gap-4 pb-10" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} onSubmit={(e) => { e.preventDefault(); if (title.trim()) onCreate(title.trim(), category, Math.max(1, Number(total) || 1), nomenclature, activeAppearance); }}>
    <div className="flex items-center justify-between border-b border-current/20 pb-3"><h3 className="font-display text-xl">Nova ficha</h3><Button type="button" variant="ghost" size="sm" onClick={onCancel} aria-label="Cancelar criação">Cancelar</Button></div>
    <div className="space-y-2"><Label htmlFor="create-title">Título</Label><Input id="create-title" autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Dragon Ball" /></div>
    <div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={(v) => { const nextCat = v as Category; setCategory(nextCat); setNomenclature(nextCat === "HQ" || nextCat === "Revista" ? "Edição" : "Volume"); }}><SelectTrigger aria-label="Categoria"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
    <NomenclatureField value={nomenclature} onChange={setNomenclature} />
    <div className="space-y-2"><Label htmlFor="create-total">Total de {nomenclature === "Edição" ? "edições" : "volumes"}</Label><Input id="create-total" type="number" min={1} step={1} required value={total} onChange={(e) => setTotal(e.target.value)} /></div>
    <AppearanceFields value={activeAppearance} onChange={handleAppearanceChange} />
    <Button type="submit" className="mt-auto"><Plus /> Criar ficha</Button>
  </form>;
}
function InlineLooseEdit({ appearance, onAppearance, onClose, onEditingChange }: { appearance: Appearance; onAppearance: (a: Appearance) => void; onClose: () => void; onEditingChange?: (editing: boolean) => void }) {
  const finish = () => {
    onEditingChange?.(false);
    onClose();
  };

  return <div className="scrollbar-none flex min-h-full flex-col gap-4 overflow-y-auto pb-10" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") finish(); }}>
    <div className="flex items-center justify-between border-b border-current/20 pb-3"><h3 className="font-display text-xl">Editar Avulsos</h3><Button type="button" variant="ghost" size="sm" onClick={finish}>Concluir</Button></div>
    <AppearanceFields value={appearance} onChange={onAppearance} />
  </div>;
}

function InlineEdit({ series, onClose, onUpdate, onAppearance, onDelete, onEditingChange }:  { series: Series; onClose: () => void; onUpdate: (patch: Partial<Series>) => void; onAppearance: (a: Appearance) => void; onDelete: () => void; onEditingChange?: (editing: boolean) => void }) {
  const appearance = series.appearance ?? DEFAULT_APPEARANCE;
  return <div className="flex min-h-full flex-col gap-4 pb-10" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") { onEditingChange?.(false); onClose(); } }}>
    <div className="flex items-center justify-between border-b border-current/20 pb-3"><h3 className="font-display text-xl">Editar ficha</h3><Button type="button" variant="ghost" size="sm" onClick={() => { onEditingChange?.(false); onClose(); }}>Concluir</Button></div>
    <div className="space-y-2"><Label htmlFor="inline-title">Título</Label><Input id="inline-title" defaultValue={series.title} onBlur={(e) => { if (e.target.value.trim()) onUpdate({ title: e.target.value.trim() }); }} /></div>
    <div className="space-y-2"><Label>Categoria</Label><Select value={series.category} onValueChange={(category) => onUpdate({ category: category as Category })}><SelectTrigger aria-label="Categoria"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
    <NomenclatureField value={series.nomenclature ?? "Volume"} onChange={(nomenclature) => onUpdate({ nomenclature })} />
    <div className="space-y-2"><Label htmlFor="inline-total">Total de {series.nomenclature === "Edição" ? "edições" : "volumes"}</Label><Input id="inline-total" type="number" min={1} step={1} defaultValue={series.total} onBlur={(e) => { const total = Math.max(1, Math.floor(Number(e.target.value) || series.total)); onUpdate({ total, missing: [...series.missing.filter((v) => v <= total), ...Array.from({ length: Math.max(0, total - series.total) }, (_, k) => series.total + k + 1)] }); }} /></div>
    <AppearanceFields value={appearance} onChange={onAppearance} />
    <HoldAction label="Excluir ficha" onComplete={onDelete} />
  </div>;
}
function AddDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (kind: "series" | "item", title: string, category: Category, extra: string, nomenclature: Nomenclature, appearance: Appearance) => void }) {
  const kind = "series" as "series" | "item";
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Mangá");
  const [extra, setExtra] = useState("");
  const [nomenclature, setNomenclature] = useState<Nomenclature>("Volume");
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] bg-background opacity-100 overflow-y-auto"><DialogHeader><DialogTitle>Nova ficha</DialogTitle><DialogDescription className="sr-only">Cadastrar série ou item avulso</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onAdd(kind, title.trim(), category, extra.trim(), nomenclature, appearance); setTitle(""); setExtra(""); onOpenChange(false); }}>
    <div className="space-y-2"><Label htmlFor="title">Título</Label><Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Dragon Ball" /></div>
    <div className="space-y-2"><Label>Categoria</Label><Select value={category} onValueChange={(v) => { setCategory(v as Category); setNomenclature(v === "HQ" || v === "Revista" ? "Edição" : "Volume"); }}><SelectTrigger aria-label="Categoria"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
    {kind === "series" && <NomenclatureField value={nomenclature} onChange={setNomenclature} />}
    <div className="space-y-2"><Label htmlFor="extra">{kind === "series" ? `Total de ${nomenclature === "Volume" ? "volumes" : "edições"}` : "Observação (opcional)"}</Label><Input id="extra" type={kind === "series" ? "number" : "text"} min={1} step={1} required={kind === "series"} value={extra} onChange={(e) => setExtra(e.target.value)} /></div>
    {kind === "series" && <AppearanceFields value={appearance} onChange={setAppearance} />}
    <DialogFooter><Button type="submit" className="w-full"><Plus /> Adicionar</Button></DialogFooter>
  </form></DialogContent></Dialog>;
}
function EditDialog({ series, data, onClose, onUpdate, onAppearance, onDelete, onRemoveItem }: { series?: Series | undefined; data: Data; onClose: () => void; onUpdate: (p: Partial<Series>) => void; onAppearance: (a: Appearance) => void; onDelete: () => void; onRemoveItem: (id: string) => void }) {
  const appearance = (series ? series.appearance : data.looseAppearance) ?? DEFAULT_APPEARANCE;
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[90dvh] bg-background opacity-100 overflow-y-auto"><DialogHeader><DialogTitle>{series?.title ?? "Avulsos"}</DialogTitle><DialogDescription className="sr-only">Editar ficha</DialogDescription></DialogHeader><div className="space-y-5">
    {series && <><div className="space-y-2"><Label htmlFor="edit-title">Título</Label><Input id="edit-title" defaultValue={series.title} onBlur={(e) => { if (e.target.value.trim()) onUpdate({ title: e.target.value.trim() }); }} /></div><NomenclatureField value={series.nomenclature ?? "Volume"} onChange={(nomenclature) => onUpdate({ nomenclature })} /><div className="space-y-2"><Label htmlFor="total">Total de {series.nomenclature === "Edição" ? "edições" : "volumes"}</Label><Input id="total" type="number" min={1} step={1} defaultValue={series.total} onBlur={(e) => { const total = Math.max(1, Math.floor(Number(e.target.value) || series.total)); onUpdate({ total, missing: [...series.missing.filter((v) => v <= total), ...Array.from({ length: Math.max(0, total - series.total) }, (_, k) => series.total + k + 1)] }); }} /></div></>}
    <AppearanceFields value={appearance} onChange={onAppearance} />
    {!series && data.items.length > 0 && <div className="border-t pt-3">{data.items.map((i) => <div key={i.id} className="flex items-center justify-between gap-2 border-b py-2"><span className="min-w-0 break-words text-sm">{i.title}</span><Button variant="ghost" size="icon" aria-label={`Excluir ${i.title}`} onClick={() => { if (confirm("Excluir este item?")) onRemoveItem(i.id); }}><Trash2 /></Button></div>)}</div>}
  </div><DialogFooter className="mt-4">{series && <Button variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 /> Excluir</Button>}<Button onClick={onClose}>Pronto</Button></DialogFooter></DialogContent></Dialog>;
}
