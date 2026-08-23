import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useDebouncedValue } from "@/services/hooks/use-debounced-value";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("renvoie la valeur initiale immédiatement", () => {
    const { result } = renderHook(() => useDebouncedValue("login", 300));
    expect(result.current).toBe("login");
  });

  it("retient la nouvelle valeur jusqu'à expiration du délai", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "l" },
    });

    rerender({ value: "log" });
    expect(result.current).toBe("l");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("l");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("log");
  });

  it("ne propage que la dernière valeur d'une frappe continue", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "" },
    });

    for (const frappe of ["l", "lo", "log", "logi", "login"]) {
      rerender({ value: frappe });
      act(() => {
        vi.advanceTimersByTime(100); // chaque frappe relance le délai
      });
    }
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe("login");
  });
});
