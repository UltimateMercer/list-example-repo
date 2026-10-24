# Fix inline edit, categories and scrollbar

- Data: 24/10/2026
- Arquivos alterados: `src/routes/index.tsx`, `src/components/fichas.tsx`

## Alterações

- Corrigido o botão **Concluir** da edição de itens avulsos: o formulário agora é um componente próprio e fecha corretamente o modo de edição.
- Adicionado o seletor de **Categoria** ao formulário de edição de fichas, reutilizando as categorias disponíveis na aplicação.
- Mantida a seleção de nomenclatura no fluxo de edição.
- Removida apenas a aparência da barra de rolagem dos formulários inline, preservando o scroll vertical.

## Diff

```diff
diff --git a/src/components/fichas.tsx b/src/components/fichas.tsx
@@
-<div className="ficha absolute inset-0 z-10 overflow-y-auto bg-paper p-5 text-paper-ink sm:p-7">
+<div className="ficha ficha-form scrollbar-none absolute inset-0 z-10 overflow-y-auto bg-paper p-5 text-paper-ink sm:p-7">
```

diff --git a/src/routes/index.tsx b/src/routes/index.tsx
@@
- editContent={<div className="flex min-h-full flex-col gap-4 pb-10" ...>...</div>}
+ editContent={<InlineLooseEdit appearance={...} onAppearance={...} onClose={() => setEditId(null)} />}
+
+function InlineLooseEdit({ appearance, onAppearance, onClose }) {
+  return <div className="scrollbar-none flex min-h-full flex-col gap-4 overflow-y-auto pb-10">
+    ...
+    <Button type="button" ... onClick={onClose}>Concluir</Button>
+    ...
+  </div>;
+}
@@
     <div className="space-y-2"><Label htmlFor="inline-title">Título</Label>...</div>
+    <div className="space-y-2"><Label>Categoria</Label><Select value={series.category} onValueChange={(category) => onUpdate({ category })}>...</Select></div>
     <NomenclatureField ... />
```
