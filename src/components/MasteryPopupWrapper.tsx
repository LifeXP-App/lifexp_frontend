"use client";

import MasteryTitlesPopup from "./MasteryTitlesPopup";
import {usePopup} from "@/src/context/PopupContext";
export default function MasteryPopupWrapper() {
  const { masteryPopupOpen, closeMasteryPopup } = usePopup();

  return (
    <MasteryTitlesPopup
      isOpen={masteryPopupOpen}
      onClose={() => closeMasteryPopup}
      onContinue={() => closeMasteryPopup}
    />
  );
}
