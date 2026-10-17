import { useEffect, useState } from "react";

export type Category = "Mangá" | "Livro" | "Revista" | "HQ" | "Outro";
export const CATEGORIES: Category[] = ["Mangá", "Livro", "Revista", "HQ", "Outro"];

export interface Series {
  id: string;
  title: string;
  category: Category;
  total: number;
  missing: number[];
}

export interface LooseItem {
  id: string;
  title: string;
  category: Category;
  note?: string;
}

export interface Data {
  series: Series[];
  items: LooseItem[];
}

const KEY = "faltantes-data-v1";
const empty: Data = { series: [], items: [] };

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
      if (raw) setData({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt data */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, loaded]);

  return [data, setData, loaded] as const;
}
