"use client";

import React, { createContext, useContext, useState } from "react";

type PopupContextType = {
  masteryPopupOpen: boolean;
  openMasteryPopup: () => void;
  closeMasteryPopup: () => void;
  toggleMasteryPopup: () => void;
};

const PopupContext = createContext<PopupContextType | null>(null);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [masteryPopupOpen, setMasteryPopupOpen] = useState(false);

  const openMasteryPopup = () => setMasteryPopupOpen(true);
  const closeMasteryPopup = () => setMasteryPopupOpen(false);
  const toggleMasteryPopup = () => setMasteryPopupOpen((p) => !p);

  return (
    <PopupContext.Provider
      value={{
        masteryPopupOpen,
        openMasteryPopup,
        closeMasteryPopup,
        toggleMasteryPopup,
      }}
    >
      {children}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const ctx = useContext(PopupContext);
  if (!ctx) throw new Error("usePopup must be used inside PopupProvider");
  return ctx;
}
