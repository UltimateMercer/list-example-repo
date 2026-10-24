# Add custom paper color

- **Data e hora:** 24/10/2026 22:27:59
- **Branch:** `v0/migrate-to-nextjs`

## Alterações

- Adicionada normalização de aparência para preservar dados existentes e derivar automaticamente a cor do texto a partir do contraste da cor do papel.
- A cor do papel agora pode ser personalizada com um color picker, mantendo as cores predefinidas disponíveis.
- Removida a dependência da escolha manual de cor do texto no fluxo de aparência.
- Aplicada a cor personalizada diretamente às superfícies das fichas, incluindo a frente e o verso.
- Corrigida a validação de tipos no cálculo de luminância para o build do Next.js.

## Validação

- `npm run build` concluído com sucesso.
