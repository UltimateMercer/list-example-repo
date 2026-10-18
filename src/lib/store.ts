import { useEffect, useState } from "react";

export type Category = "Mangá" | "Livro" | "Revista" | "HQ" | "Outro";
export const CATEGORIES: Category[] = ["Mangá", "Livro", "Revista", "HQ", "Outro"];

export type Nomenclature = "Volume" | "Edição";
export type PaperColor = "white" | "craft" | "sepia" | "rose" | "sage" | "blue";
export type InkColor = "graphite" | "blue" | "red" | "light";
export interface Appearance { paper: PaperColor; ink: InkColor }
export const DEFAULT_APPEARANCE: Appearance = { paper: "white", ink: "graphite" };

export interface Series {
  id: string;
  title: string;
  category: Category;
  total: number;
  missing: number[];
  nomenclature?: Nomenclature;
  appearance?: Appearance;
}

export interface LooseItem {
  id: string;
  title: string;
  category: Category;
  note?: string | undefined;
  found?: boolean;
}

export interface Data {
  series: Series[];
  items: LooseItem[];
  looseAppearance?: Appearance;
  initialized?: boolean;
}

const KEY = "faltantes-data-v1";
const empty: Data = { series: [], items: [] };

export const HOLD_DURATION = 700;
export function volumeLabel(s: Pick<Series, "title" | "nomenclature">, volume: number) {
  return `${s.title} - ${s.nomenclature === "Edição" ? "Ed." : "Vol."} ${volume}`;
}

export function initializeData(existing: Data = empty): Data {
  if (existing.initialized) return existing;
  const hasDragonBall = existing.series.some((s) => s.title.trim().toLowerCase() === "dragon ball");
  const dragonBall: Series = {
    id: "dragon-ball", title: "Dragon Ball", category: "Mangá", total: 42,
    missing: Array.from({ length: 42 }, (_, k) => k + 1).filter((v) => v !== 29 && v < 31),
    nomenclature: "Volume", appearance: { paper: "craft", ink: "graphite" },
  };
  return { ...existing, initialized: true, series: hasDragonBall ? existing.series : [dragonBall, ...existing.series] };
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Toggle a volume in the missing list, keeping it sorted. */
export function toggleMissing(missing: number[], vol: number): number[] {
  return missing.includes(vol)
    ? missing.filter((v) => v !== vol)
    : [...missing, vol].sort((a, b) => a - b);
}

export function useData() {
  const [data, setData] = useState<Data>(empty);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : empty;
      setData(initializeData({ ...empty, ...parsed }));
    } catch {
      setData(initializeData());
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, loaded]);

  return [data, setData, loaded] as const;
}
