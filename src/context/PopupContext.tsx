"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type PopupContextType = {
  masteryPopupOpen: boolean;
  openMasteryPopup: () => void;
  closeMasteryPopup: () => void;
  toggleMasteryPopup: () => void;
};

const PopupContext = createContext<PopupContextType | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [masteryPopupOpen, setMasteryPopupOpen] = useState(false);

  const openMasteryPopup = useCallback(() => setMasteryPopupOpen(true), []);
  const closeMasteryPopup = useCallback(() => setMasteryPopupOpen(false), []);
  const toggleMasteryPopup = useCallback(() => setMasteryPopupOpen((p) => !p), []);

  const value = useMemo<PopupContextType>(
    () => ({
      masteryPopupOpen,
      openMasteryPopup,
      closeMasteryPopup,
      toggleMasteryPopup,
    }),
    [masteryPopupOpen, openMasteryPopup, closeMasteryPopup, toggleMasteryPopup],
  );

  return (
    <PopupContext.Provider value={value}>{children}</PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used inside PopupProvider");
  return ctx;
}
