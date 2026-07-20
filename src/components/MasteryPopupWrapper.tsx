"use client";

import MasteryTitleInfo from "./MasteryTitleInfo";
import {usePopup} from "@/src/context/PopupContext";
export default function MasteryPopupWrapper() {
  const { masteryPopupOpen, closeMasteryPopup } = usePopup();

  return (
    <MasteryTitleInfo
      isOpen={masteryPopupOpen}
      onClose={closeMasteryPopup}
      onContinue={closeMasteryPopup}
    />
  );
}
