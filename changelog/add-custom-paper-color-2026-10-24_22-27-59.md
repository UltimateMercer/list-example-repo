# Add custom paper color

- **Data e hora:** 24/10/2026 22:27:59
- **Commit:** `b0c6d894ce5c38ea59ccac9848e6ebab84b38319`
- **Branch:** `v0/migrate-to-nextjs`

## Alterações

- Adicionada normalização de aparência para preservar dados existentes e derivar automaticamente a cor do texto a partir do contraste da cor do papel.
- A cor do papel agora pode ser personalizada com um color picker, mantendo as cores predefinidas disponíveis.
- Removida a dependência da escolha manual de cor do texto no fluxo de aparência.
- Aplicada a cor personalizada diretamente às superfícies das fichas, incluindo a frente e o verso.
- Corrigida a validação de tipos no cálculo de luminância para o build do Next.js.

## Diff do commit

```diff
diff --git a/src/components/fichas.tsx b/src/components/fichas.tsx
index 4b3086f..da2d477 100644
--- a/src/components/fichas.tsx
+++ b/src/components/fichas.tsx
@@ -1,8 +1,8 @@
-import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
+import { cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
 import { Check, ChevronLeft, ChevronRight, Settings2, Trash2 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";
-import { DEFAULT_APPEARANCE, HOLD_DURATION, type Appearance } from "@/lib/store";
+import { DEFAULT_APPEARANCE, HOLD_DURATION, normalizeAppearance, type Appearance } from "@/lib/store";
@@ -302,11 +302,13 @@ export function Ficha({
       <Settings2 />
     </Button>
   );
+  const resolvedAppearance = normalizeAppearance(appearance);
+  const paperStyle = { "--paper": resolvedAppearance.paper } as CSSProperties;
   const face = "ficha relative flex h-full flex-col overflow-hidden bg-paper p-5 text-paper-ink sm:p-7";
@@ -314,7 +316,7 @@ export function Ficha({
-      <div data-paper={appearance.paper} data-ink={appearance.ink}>
+      <div style={paperStyle} data-paper={resolvedAppearance.paper} data-ink={resolvedAppearance.ink}>
@@ -341,7 +343,7 @@ export function Ficha({
-    <div data-paper={appearance.paper} data-ink={appearance.ink} className="flip-scene h-full w-full">
+    <div style={paperStyle} data-paper={resolvedAppearance.paper} data-ink={resolvedAppearance.ink} className="flip-scene h-full w-full">
```

diff --git a/src/lib/store.ts b/src/lib/store.ts
index bc110fb..ce5ee8e 100644
--- a/src/lib/store.ts
+++ b/src/lib/store.ts
@@ -4,10 +4,35 @@ export type Category = "Mangá" | "Livro" | "Revista" | "HQ" | "Outro";
 export const CATEGORIES: Category[] = ["Mangá", "Livro", "Revista", "HQ", "Outro"];
 
 export type Nomenclature = "Volume" | "Edição";
-export type PaperColor = "white" | "craft" | "sepia" | "rose" | "sage" | "blue";
-export type InkColor = "graphite" | "blue" | "red" | "light";
+export type PaperColor = string;
+export type InkColor = "graphite" | "light";
 export interface Appearance { paper: PaperColor; ink: InkColor }
-export const DEFAULT_APPEARANCE: Appearance = { paper: "white", ink: "graphite" };
+export const DEFAULT_APPEARANCE: Appearance = { paper: "#fffdf7", ink: "graphite" };
+
+const LEGACY_PAPER_COLORS: Record<string, string> = {
+  white: "#fffdf7",
+  craft: "#d7bc8b",
+  sepia: "#a98968",
+  rose: "#ead1d0",
+  sage: "#c9d9c4",
+  blue: "#c9d9e8",
+};
+
+export function normalizeAppearance(appearance?: Partial<Appearance>): Appearance {
+  const paper = appearance?.paper ?? DEFAULT_APPEARANCE.paper;
+  const normalizedPaper = LEGACY_PAPER_COLORS[paper] ?? paper;
+  return { paper: normalizedPaper, ink: getContrastInk(normalizedPaper) };
+}
+
+export function getContrastInk(color: string): InkColor {
+  const hex = color.replace("#", "");
+  if (!/^[\da-f]{6}$/i.test(hex)) return "graphite";
+  const r = Number.parseInt(hex.slice(0, 2), 16);
+  const g = Number.parseInt(hex.slice(2, 4), 16);
+  const b = Number.parseInt(hex.slice(4, 6), 16);
+  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
+  return luminance > 0.58 ? "graphite" : "light";
+}
@@ -73,14 +98,18 @@ export function volumeLabel(s: Pick<Series, "title" | "nomenclature">, volume: n
 export function initializeData(existing: Data = empty): Data {
-  if (existing.initialized) return existing;
+  if (existing.initialized) return {
+    ...existing,
+    series: existing.series.map((series) => ({ ...series, appearance: normalizeAppearance(series.appearance) })),
+    looseAppearance: normalizeAppearance(existing.looseAppearance),
+  };
@@
-  return { ...existing, initialized: true, series: hasDragonBall ? existing.series : [dragonBall, ...existing.series] };
+  return { ...existing, initialized: true, series: (hasDragonBall ? existing.series : [dragonBall, ...existing.series]).map((series) => ({ ...series, appearance: normalizeAppearance(series.appearance) })), looseAppearance: normalizeAppearance(existing.looseAppearance) };
 }
```

diff --git a/src/routes/index.tsx b/src/routes/index.tsx
index 326b4a5..90bf727 100644
--- a/src/routes/index.tsx
+++ b/src/routes/index.tsx
@@ -9,7 +9,7 @@
-import { CATEGORIES, DEFAULT_APPEARANCE, type Appearance, type Category, type Data, type Series, type Nomenclature, type PaperColor, type InkColor, toggleMissing, uid, useData, volumeLabel } from "@/lib/store";
+import { CATEGORIES, DEFAULT_APPEARANCE, getContrastInk, normalizeAppearance, type Appearance, type Category, type Data, type Series, type Nomenclature, toggleMissing, uid, useData, volumeLabel } from "@/lib/store";
@@
-  const updateSeries = (id: string, patch: Partial<Series>) => setData((d) => ({ ...d, series: d.series.map((s) => s.id === id ? { ...s, ...patch } : s) }));
+  const updateSeries = (id: string, patch: Partial<Series>) => setData((d) => ({ ...d, series: d.series.map((s) => {
+    if (s.id !== id) return s;
+    const next = { ...s, ...patch };
+    return patch.appearance ? { ...next, appearance: normalizeAppearance(patch.appearance) } : next;
+  }) }));
@@
-const papers: { id: PaperColor; name: string }[] = [{ id: "white", name: "Branco" }, { id: "craft", name: "Craft" }, { id: "sepia", name: "Sépia" }, { id: "rose", name: "Rosa" }, { id: "sage", name: "Verde" }, { id: "blue", name: "Azul" }];
-const inks: { id: InkColor; name: string }[] = [{ id: "graphite", name: "Grafite" }, { id: "blue", name: "Azul" }, { id: "red", name: "Vermelho" }, { id: "light", name: "Branco" }];
+const papers = [{ id: "#fffdf7", name: "Branco" }, { id: "#d7bc8b", name: "Craft" }, { id: "#a98968", name: "Sépia" }, { id: "#ead1d0", name: "Rosa" }, { id: "#c9d9c4", name: "Verde" }, { id: "#c9d9e8", name: "Azul" }];
@@
-  return <div className="space-y-4"><fieldset><legend className="mb-2 text-sm font-medium">Cor do papel</legend><div className="flex flex-wrap gap-2">{papers.map((p) => <Button type="button" key={p.id} variant="outline" size="icon" data-paper={p.id} aria-label={`Papel ${p.name}`} title={p.name} aria-pressed={value.paper === p.id} className={`size-8 rounded-full bg-paper hover:bg-paper ${value.paper === p.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} onClick={() => onChange({ ...value, paper: p.id })} />)}</div></fieldset><fieldset><legend className="mb-2 text-sm font-medium">Cor do texto</legend><div className="flex gap-2">{inks.map((i) => <Button type="button" key={i.id} data-ink={i.id} variant="outline" size="icon" aria-label={`Texto ${i.name}`} title={i.name} aria-pressed={value.ink === i.id} className={`size-8 rounded-full bg-paper-ink hover:bg-paper-ink ${value.ink === i.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} onClick={() => onChange({ ...value, ink: i.id })} />)}</div></fieldset></div>;
+  const appearance = normalizeAppearance(value);
+  const setPaper = (paper: string) => onChange({ paper, ink: getContrastInk(paper) });
+  return <div className="space-y-4"><fieldset><legend className="mb-2 text-sm font-medium">Cor do papel</legend><div className="flex flex-wrap items-center gap-2">{papers.map((p) => <Button type="button" key={p.id} variant="outline" size="icon" aria-label={`Papel ${p.name}`} title={p.name} aria-pressed={appearance.paper === p.id} className={`size-8 rounded-full bg-transparent p-0 ${appearance.paper === p.id ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""}`} style={{ backgroundColor: p.id }} onClick={() => setPaper(p.id)} />)}<label className="relative size-8 cursor-pointer overflow-hidden rounded-full border border-border" title="Escolher cor personalizada"><span className="sr-only">Escolher cor personalizada</span><input type="color" value={appearance.paper} onChange={(e) => setPaper(e.target.value)} className="absolute inset-[-8px] size-12 cursor-pointer" /></label></div></fieldset><p className="text-xs text-muted-foreground">A cor do texto é definida automaticamente para manter o contraste.</p></div>;
 }
```

## Validação

- `npm run build` concluído com sucesso.
