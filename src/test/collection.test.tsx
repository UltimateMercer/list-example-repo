import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HoldRow } from "@/components/fichas";
import { HOLD_DURATION, initializeData, toggleMissing, volumeLabel } from "@/lib/store";

afterEach(() => vi.useRealTimers());

describe("Collection rules", () => {
  it("initializes Dragon Ball with 42 volumes and exactly the user's owned volumes", () => {
    const dragon = initializeData().series.find((s) => s.title === "Dragon Ball");
    expect(dragon?.total).toBe(42);
    expect(dragon?.missing).toEqual([...Array.from({ length: 28 }, (_, k) => k + 1), 30]);
  });
  it("preserves existing loose items and does not re-add deleted defaults", () => {
    const item = { id: "owned-item", title: "Meu livro", category: "Livro" as const };
    const initialized = initializeData({ series: [], items: [item] });
    expect(initialized.items).toEqual([item]);
    expect(initializeData({ ...initialized, series: [] }).series).toEqual([]);
  });
  it("does not duplicate or overwrite an existing Dragon Ball series", () => {
    const series = { id: "existing", title: "Dragon Ball", category: "Mangá" as const, total: 42, missing: [30] };
    expect(initializeData({ series: [series], items: [] }).series).toEqual([series]);
  });
  it("uses Volume nomenclature for numbered manga", () => {
    expect(volumeLabel({ title: "Dragon Ball", nomenclature: "Volume" }, 25)).toBe("Dragon Ball - Vol. 25");
  });
  it("uses Edição nomenclature for numbered editions", () => {
    expect(volumeLabel({ title: "Minha HQ", nomenclature: "Edição" }, 7)).toBe("Minha HQ - Ed. 7");
  });
  it("toggles collection ownership reversibly", () => {
    expect(toggleMissing([1, 2, 30], 2)).toEqual([1, 30]);
    expect(toggleMissing([1, 30], 2)).toEqual([1, 2, 30]);
  });
  it("requires a sustained hold rather than a tap, and confirms exactly once", () => {
    vi.useFakeTimers();
    const toggle = vi.fn();
    render(<HoldRow label="Dragon Ball - Vol. 25" checked={false} onToggle={toggle} />);
    const row = screen.getByRole("checkbox", { name: "Dragon Ball - Vol. 25" });
    fireEvent.click(row);
    expect(toggle).not.toHaveBeenCalled();
    fireEvent.keyDown(row, { key: " " });
    act(() => vi.advanceTimersByTime(HOLD_DURATION - 1));
    expect(toggle).not.toHaveBeenCalled();
    fireEvent.keyUp(row, { key: " " });
    act(() => vi.advanceTimersByTime(1000));
    expect(toggle).not.toHaveBeenCalled();
    fireEvent.keyDown(row, { key: " " });
    act(() => vi.advanceTimersByTime(HOLD_DURATION));
    expect(toggle).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(toggle).toHaveBeenCalledTimes(1);
  });
});