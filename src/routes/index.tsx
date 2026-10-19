import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, ArrowDownUp, Layers, List, BookOpen, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Ficha, HoldRow, StackView } from "@/components/fichas";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, DEFAULT_APPEARANCE, type Appearance, type Category, type Data, type Series, type Nomenclature, type PaperColor, type InkColor, toggleMissing, uid, useData, volumeLabel } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Faltantes — seu fichário de coleções" },
    { name: "description", content: "Suas séries e itens avulsos em fichas de papel. Consulte e marque o que falta na sua coleção, com dados salvos no dispositivo." },
    { property: "og:title", content: "Faltantes — seu fichário de coleções" },
    { property: "og:description", content: "Organize mangás, livros, revistas e avulsos em um fichário pessoal de itens faltantes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Index,
});

type Card = { id: string; series?: Series };
const LOOSE_ID = "loose-items";

function Index() {
  const [data, setData, loaded] = useData();
  const q = "";
  const [sort, setSort] = useState<"order" | "missing">("order");
  const [newItem, setNewItem] = useState("");
  const [mode, setMode] = useState<"stack" | "list">("stack");
  const [idx, setIdx] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);
  const [indexQ, setIndexQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const allCards: Card[] = [...data.series.map((s) => ({ id: s.id, series: s })), { id: LOOSE_ID }];
  const matches = (card: Card, query: string) => card.series
    ? card.series.title.toLowerCase().includes(query)
    : "avulsos".includes(query) || data.items.some((i) => i.title.toLowerCase().includes(query));
  const cards = allCards.filter((card) => matches(card, q.trim().toLowerCase()));
  const current = Math.min(idx, Math.max(0, cards.length - 1));
  const editing = data.series.find((s) => s.id === editId);
  const updateSeries = (id: string, patch: Partial<Series>) => setData((d) => ({ ...d, series: d.series.map((s) => s.id === id ? { ...s, ...patch } : s) }));
  const jump = (id: string) => { setMode("stack"); setIdx(allCards.findIndex((c) => c.id === id)); setIndexOpen(false); };
  const sortBtn = <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-inherit hover:bg-current/10 hover:text-inherit" aria-label="Alterar ordenação" onClick={() => setSort(sort === "order" ? "missing" : "order")}><ArrowDownUp className="size-3.5" />{sort === "order" ? "Em ordem" : "Faltantes primeiro"}</Button>;
  const ord = <T,>(arr: T[], has: (x: T) => boolean) => sort === "missing" ? [...arr.filter((x) => !has(x)), ...arr.filter(has)] : arr;
  const render = (card: Card, big = false) => {
    const s = card.series;
    if (s) return <Ficha title={s.title} category={`${s.category} / ${s.nomenclature === "Edição" ? "edições" : "volumes"}`} summary={`${s.missing.length} faltantes · ${s.total - s.missing.length} na coleção · ${s.total} no total`} appearance={s.appearance} big={big} actions={sortBtn} onEdit={() => setEditId(s.id)}>
      {ord(Array.from({ length: s.total }, (_, k) => k + 1), (v) => !s.missing.includes(v)).map((v) => <HoldRow key={v} label={volumeLabel(s, v)} checked={!s.missing.includes(v)} onToggle={() => setData((d) => ({ ...d, series: d.series.map((x) => x.id === s.id ? { ...x, missing: toggleMissing(x.missing, v) } : x) }))} />)}
    </Ficha>;
    const items = data.items.filter((i) => !q.trim() || "avulsos".includes(q.trim().toLowerCase()) || i.title.toLowerCase().includes(q.trim().toLowerCase()));
    return <Ficha title="Avulsos" category="Itens individuais" summary={`${data.items.filter((i) => !i.found).length} faltantes · ${data.items.filter((i) => i.found).length} na coleção`} appearance={data.looseAppearance} big={big} actions={sortBtn} onEdit={() => setEditId(LOOSE_ID)}>
      {ord(items, (i) => !!i.found).map((i) => <HoldRow key={i.id} label={i.title} note={i.note || i.category} checked={!!i.found} onToggle={() => setData((d) => ({ ...d, items: d.items.map((x) => x.id === i.id ? { ...x, found: !x.found } : x) }))} />)}
      {items.length === 0 && <div className="py-8 text-center"><BookOpen className="mx-auto mb-3 size-6 opacity-40" /><p className="text-sm opacity-60">Nenhum item avulso</p></div>}
      <form className="mt-3 flex items-center gap-2 px-3" onSubmit={(e) => { e.preventDefault(); const t = newItem.trim(); if (!t) return; setData((d) => ({ ...d, items: [...d.items, { id: uid(), title: t, category: "Livro" as Category }] })); setNewItem(""); }}><Plus className="size-4 shrink-0 opacity-60" /><input aria-label="Novo item avulso" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Adicionar item…" className="min-w-0 flex-1 border-b border-current/25 bg-transparent py-2 text-sm outline-none placeholder:text-current/40 focus:border-current" /></form>
    </Ficha>;
  };
  return <main className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden px-5 pb-4 pt-5 sm:px-8 sm:pt-8">
    <header className="mb-4 shrink-0">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-medium sm:text-3xl">Faltantes<span className="text-muted-foreground">.</span></h1>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Fichas empilhadas" aria-label="Fichas empilhadas" aria-pressed={mode === "stack"} className={mode === "stack" ? "bg-secondary" : ""} onClick={() => setMode("stack")}><Layers /></Button>
          <Button variant="ghost" size="icon" title="Lista contínua" aria-label="Lista contínua" aria-pressed={mode === "list"} className={mode === "list" ? "bg-secondary" : ""} onClick={() => setMode("list")}><List /></Button>
          <span className="mx-1 h-5 border-l border-border" />
          <Button variant="ghost" size="icon" title="Índice" aria-label="Índice" onClick={() => setIndexOpen(true)}><BookOpen /></Button>
          <Button variant="outline" size="sm" className="ml-1" onClick={() => setAdding(true)} aria-label="Nova ficha"><Plus /> <span className="hidden sm:inline">Nova ficha</span></Button>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-b border-border pb-4 text-xs text-muted-foreground"><span>Meu fichário</span><span>{data.series.reduce((n, s) => n + s.missing.length, 0) + data.items.filter((i) => !i.found).length} faltantes · {String(allCards.length).padStart(2, "0")} fichas</span></div>
    </header>
    {!loaded ? <p className="py-12 text-center text-sm text-muted-foreground">Abrindo fichário…</p> : cards.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma ficha encontrada.</p> : mode === "stack" ? <StackView cards={cards} index={current} setIndex={setIdx} render={(card) => render(card, true)} /> : <div className="scrollbar-none min-h-0 flex-1 space-y-6 overflow-y-auto">{cards.map((card) => <div key={card.id}>{render(card)}</div>)}</div>}
    <Sheet open={indexOpen} onOpenChange={setIndexOpen}><SheetContent side="left" className="flex w-80 flex-col px-5"><SheetHeader className="px-0"><SheetTitle>Índice</SheetTitle></SheetHeader><Input aria-label="Pular para ficha" value={indexQ} onChange={(e) => setIndexQ(e.target.value)} placeholder="Pular para..." /><div className="flex-1 overflow-y-auto">{allCards.filter((c) => matches(c, indexQ.trim().toLowerCase())).map((c) => <Button key={c.id} variant="ghost" className="h-auto w-full justify-between rounded-none border-b py-4 whitespace-normal text-left" onClick={() => jump(c.id)}><span className="min-w-0 break-words">{c.series?.title ?? "Avulsos"}</span><ArrowUpRight className="shrink-0" /></Button>)}</div></SheetContent></Sheet>
    <AddDialog open={adding} onOpenChange={setAdding} onAdd={(kind, title, category, extra, nomenclature, appearance) => {
      if (kind === "series") {
        const total = Math.max(1, Math.floor(Number(extra) || 1));
        const id = uid();
        setData((d) => ({ ...d, series: [{ id, title, category, total, missing: Array.from({ length: total }, (_, k) => k + 1), nomenclature, appearance }, ...d.series] }));
        setIdx(0);
      } else {
        setData((d) => ({ ...d, items: [...d.items, { id: uid(), title, category, note: extra || undefined }] }));
        setIdx(data.series.length);
      }
    }} />
    {editId && <EditDialog key={editId} series={editing} data={data} onClose={() => setEditId(null)} onUpdate={(patch) => editing && updateSeries(editing.id, patch)} onAppearance={(appearance) => editing ? updateSeries(editing.id, { appearance }) : setData((d) => ({ ...d, looseAppearance: appearance }))} onRemoveItem={(id) => setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }))} onDelete={() => { if (editing && confirm("Excluir esta série?")) { setData((d) => ({ ...d, series: d.series.filter((s) => s.id !== editing.id) })); setEditId(null); } }} />}
  </main>;
}

const papers: { id: PaperColor; name: string }[] = [{ id: "white", name: "Branco" }, { id: "craft", name: "Craft" }, { id: "sepia", name: "Sépia" }, { id: "rose", name: "Rosa" }, { id: "sage", name: "Verde" }, { id: "blue", name: "Azul" }];
const inks: { id: InkColor; name: string }[] = [{ id: "graphite", name: "Grafite" }, { id: "blue", name: "Azul" }, { id: "red", name: "Vermelho" }, { id: "light", name: "Branco" }];
function AppearanceFields({ value, onChange }: { value: Appearance; onChange: (a: Appearance) => void }) {
  return <div className="space-y-4"><fieldset><legend className="mb-2 text-sm">Cor do papel</legend><div className="flex flex-wrap gap-2">{papers.map((p) => <Button type="button" key={p.id} variant="outline" size="icon" data-paper={p.id} aria-label={`Papel ${p.name}`} title={p.name} aria-pressed={value.paper === p.id} className={`size-8 rounded-full bg-paper hover:bg-paper ${value.paper === p.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} onClick={() => onChange({ ...value, paper: p.id })} />)}</div></fieldset><fieldset><legend className="mb-2 text-sm">Cor do texto</legend><div className="flex gap-2">{inks.map((i) => <Button type="button" key={i.id} data-ink={i.id} variant="outline" size="icon" aria-label={`Texto ${i.name}`} title={i.name} aria-pressed={value.ink === i.id} className={`size-8 rounded-full bg-paper-ink hover:bg-paper-ink ${value.ink === i.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} onClick={() => onChange({ ...value, ink: i.id })} />)}</div></fieldset></div>;
}
function NomenclatureField({ value, onChange }: { value: Nomenclature; onChange: (v: Nomenclature) => void }) {
  return <div className="space-y-2"><Label>Nomenclatura</Label><Select value={value} onValueChange={(v) => onChange(v as Nomenclature)}><SelectTrigger aria-label="Nomenclatura"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Volume">Volume</SelectItem><SelectItem value="Edição">Edição</SelectItem></SelectContent></Select></div>;
}
function AddDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (kind: "series" | "item", title: string, category: Category, extra: string, nomenclature: Nomenclature, appearance: Appearance) => void }) {
  const kind = "series" as "series" | "item";
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Mangá");
  const [extra, setExtra] = useState("");
  const [nomenclature, setNomenclature] = useState<Nomenclature>("Volume");
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Nova ficha</DialogTitle><DialogDescription className="sr-only">Cadastrar série ou item avulso</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; onAdd(kind, title.trim(), category, extra.trim(), nomenclature, appearance); setTitle(""); setExtra(""); onOpenChange(false); }}>
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
  return <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{series?.title ?? "Avulsos"}</DialogTitle><DialogDescription className="sr-only">Editar ficha</DialogDescription></DialogHeader><div className="space-y-5">
    {series && <><div className="space-y-2"><Label htmlFor="edit-title">Título</Label><Input id="edit-title" defaultValue={series.title} onBlur={(e) => { if (e.target.value.trim()) onUpdate({ title: e.target.value.trim() }); }} /></div><NomenclatureField value={series.nomenclature ?? "Volume"} onChange={(nomenclature) => onUpdate({ nomenclature })} /><div className="space-y-2"><Label htmlFor="total">Total de {series.nomenclature === "Edição" ? "edições" : "volumes"}</Label><Input id="total" type="number" min={1} step={1} defaultValue={series.total} onBlur={(e) => { const total = Math.max(1, Math.floor(Number(e.target.value) || series.total)); onUpdate({ total, missing: [...series.missing.filter((v) => v <= total), ...Array.from({ length: Math.max(0, total - series.total) }, (_, k) => series.total + k + 1)] }); }} /></div></>}
    <AppearanceFields value={appearance} onChange={onAppearance} />
    {!series && data.items.length > 0 && <div className="border-t pt-3">{data.items.map((i) => <div key={i.id} className="flex items-center justify-between gap-2 border-b py-2"><span className="min-w-0 break-words text-sm">{i.title}</span><Button variant="ghost" size="icon" aria-label={`Excluir ${i.title}`} onClick={() => { if (confirm("Excluir este item?")) onRemoveItem(i.id); }}><Trash2 /></Button></div>)}</div>}
  </div><DialogFooter className="mt-4">{series && <Button variant="ghost" className="text-destructive" onClick={onDelete}><Trash2 /> Excluir</Button>}<Button onClick={onClose}>Pronto</Button></DialogFooter></DialogContent></Dialog>;
}
