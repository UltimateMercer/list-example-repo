import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  type Category,
  type Series,
  toggleMissing,
  uid,
  useData,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Faltantes — sua lista de colecionáveis que faltam" },
      {
        name: "description",
        content: "Anote os volumes de mangás, livros e revistas que faltam na sua coleção e consulte rápido na livraria ou sebo.",
      },
      { property: "og:title", content: "Faltantes — lista de colecionáveis" },
      {
        property: "og:description",
        content: "Consulte rápido o que falta na sua coleção de mangás, livros e revistas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [data, setData] = useData();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("series");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const series = useMemo(
    () => data.series.filter((s) => s.title.toLowerCase().includes(query)),
    [data.series, query],
  );
  const items = useMemo(
    () => data.items.filter((i) => i.title.toLowerCase().includes(query)),
    [data.items, query],
  );
  const open = data.series.find((s) => s.id === openId) ?? null;

  const updateSeries = (id: string, patch: Partial<Series>) =>
    setData((d) => ({ ...d, series: d.series.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-background px-4 pb-24 pt-4">
      <header className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 pt-2">
        <h1 className="mb-3 text-2xl font-bold">Faltantes</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar título..."
            className="h-11 pl-9 text-base"
          />
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="series">Séries ({data.series.length})</TabsTrigger>
          <TabsTrigger value="items">Avulsos ({data.items.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="series" className="mt-3 space-y-2">
          {series.length === 0 && <Empty text="Nenhuma série. Toque em + para adicionar." />}
          {series.map((s) => (
            <Card key={s.id} className="cursor-pointer p-4" onClick={() => setOpenId(s.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category} · {s.total} volumes
                  </p>
                </div>
                <Badge variant={s.missing.length ? "destructive" : "secondary"}>
                  {s.missing.length ? `faltam ${s.missing.length}` : "completa"}
                </Badge>
              </div>
              {s.missing.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.missing.map((v) => (
                    <Badge key={v} variant="outline">#{v}</Badge>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="items" className="mt-3 space-y-2">
          {items.length === 0 && <Empty text="Nenhum item avulso. Toque em + para adicionar." />}
          {items.map((i) => (
            <Card key={i.id} className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="font-semibold">{i.title}</p>
                <p className="text-xs text-muted-foreground">
                  {i.category}
                  {i.note ? ` · ${i.note}` : ""}
                </p>
              </div>
              <Button
                size="icon"
                variant="outline"
                aria-label="Encontrei"
                onClick={() => setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== i.id) }))}
              >
                <Check className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        aria-label="Adicionar"
        onClick={() => setAdding(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddDialog
        open={adding}
        onOpenChange={setAdding}
        defaultKind={tab === "items" ? "item" : "series"}
        onAdd={(kind, title, category, extra) => {
          if (kind === "series") {
            const total = Math.max(1, Number(extra) || 1);
            setData((d) => ({
              ...d,
              series: [
                { id: uid(), title, category, total, missing: Array.from({ length: total }, (_, k) => k + 1) },
                ...d.series,
              ],
            }));
            setTab("series");
          } else {
            setData((d) => ({ ...d, items: [{ id: uid(), title, category, note: extra || undefined }, ...d.items] }));
            setTab("items");
          }
        }}
      />

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        {open && (
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{open.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Toque nos volumes que você <strong>já tem</strong>. Os destacados estão faltando.
            </p>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: open.total }, (_, k) => k + 1).map((v) => {
                const miss = open.missing.includes(v);
                return (
                  <Button
                    key={v}
                    size="sm"
                    variant={miss ? "destructive" : "secondary"}
                    onClick={() => updateSeries(open.id, { missing: toggleMissing(open.missing, v) })}
                  >
                    {v}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="total" className="shrink-0">Total de volumes</Label>
              <Input
                id="total"
                type="number"
                min={1}
                defaultValue={open.total}
                onBlur={(e) => {
                  const total = Math.max(1, Number(e.target.value) || open.total);
                  const added = Array.from({ length: Math.max(0, total - open.total) }, (_, k) => open.total + k + 1);
                  updateSeries(open.id, {
                    total,
                    missing: [...open.missing.filter((v) => v <= total), ...added],
                  });
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  if (!confirm("Excluir esta série?")) return;
                  setData((d) => ({ ...d, series: d.series.filter((s) => s.id !== open.id) }));
                  setOpenId(null);
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Excluir
              </Button>
              <Button onClick={() => setOpenId(null)}>Pronto</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>;
}

function AddDialog({
  open,
  onOpenChange,
  defaultKind,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultKind: "series" | "item";
  onAdd: (kind: "series" | "item", title: string, category: Category, extra: string) => void;
}) {
  const [kind, setKind] = useState<"series" | "item">(defaultKind);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Mangá");
  const [extra, setExtra] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setKind(defaultKind);
        else {
          setTitle("");
          setExtra("");
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            onAdd(kind, title.trim(), category, extra.trim());
            setTitle("");
            setExtra("");
            onOpenChange(false);
          }}
        >
          <Tabs value={kind} onValueChange={(v) => setKind(v as "series" | "item")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="series">Série / coleção</TabsTrigger>
              <TabsTrigger value="item">Item avulso</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input id="title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Dragon Ball" />
          </div>
          <div className="space-y-1">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="extra">{kind === "series" ? "Total de volumes" : "Observação (opcional)"}</Label>
            <Input
              id="extra"
              type={kind === "series" ? "number" : "text"}
              min={1}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder={kind === "series" ? "Ex: 42" : "Ex: edição de capa dura"}
            />
            {kind === "series" && (
              <p className="text-xs text-muted-foreground">Todos começam como faltantes; depois marque os que você tem.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full">Adicionar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
