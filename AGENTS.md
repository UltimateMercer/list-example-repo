<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep collection persistence and backward-compatible initialization in `src/lib/store.ts`; preserve existing device data and seed defaults only once.
- Render series and the grouped loose-item collection through the same ficha renderer; long-press row controls own confirmation timing and cancellation.
- Represent selectable paper/ink palettes as semantic CSS tokens and data attributes, so saved appearance choices remain theme-safe.
