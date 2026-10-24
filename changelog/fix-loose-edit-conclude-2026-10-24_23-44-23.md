# fix-loose-edit-conclude

- Data/hora: 2026-10-24 23:44:23
- Arquivo alterado: `src/routes/index.tsx`
- Resumo: Corrigido o botão `Concluir` da edição de avulsos para encerrar explicitamente o estado inline de edição antes de fechar o conteúdo da ficha. A tecla `Escape` usa o mesmo fluxo.

## Diff

```diff
@@
-function InlineLooseEdit({ appearance, onAppearance, onClose }: { appearance: Appearance; onAppearance: (a: Appearance) => void; onClose: () => void }) {
-  return <div className="scrollbar-none flex min-h-full flex-col gap-4 overflow-y-auto pb-10" onPointerDown={(e) => e.stopPropagation()}>
-    <div className="flex items-center justify-between border-b border-current/20 pb-3"><h3 className="font-display text-xl">Editar Avulsos</h3><Button type="button" variant="ghost" size="sm" onClick={onClose}>Concluir</Button></div>
+function InlineLooseEdit({ appearance, onAppearance, onClose, onEditingChange }: { appearance: Appearance; onAppearance: (a: Appearance) => void; onClose: () => void; onEditingChange?: (editing: boolean) => void }) {
+  const finish = () => {
+    onEditingChange?.(false);
+    onClose();
+  };
+
+  return <div className="scrollbar-none flex min-h-full flex-col gap-4 overflow-y-auto pb-10" onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === "Escape") finish(); }}>
+    <div className="flex items-center justify-between border-b border-current/20 pb-3"><h3 className="font-display text-xl">Editar Avulsos</h3><Button type="button" variant="ghost" size="sm" onClick={finish}>Concluir</Button></div>
```
