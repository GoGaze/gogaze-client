"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Lazy-initialize from localStorage so the collapsed value is correct on the
  // very first client render — no post-mount setState flip, which previously
  // caused a visible expand→collapse width flash on every navigation.
  const [collapsed, setCollapsed] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("sidebar-collapsed") === "true"
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }, []);

  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
