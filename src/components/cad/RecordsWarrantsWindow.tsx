"use client";

import { FloatingWindow } from "@/components/floating-window/FloatingWindow";
import { RecordsWarrantsContent, type RecordsWarrantsCategory } from "./RecordsWarrantsContent";

/** Windows-mode wrapper around RecordsWarrantsContent — see CadSplitLayout for the split-mode version. */
export function RecordsWarrantsWindow({
  onClose,
  initialCategory = "records",
  accentVar,
}: {
  onClose: () => void;
  initialCategory?: RecordsWarrantsCategory;
  accentVar?: string;
}) {
  return (
    <FloatingWindow title="Records & Warrants" onClose={onClose} width={680} accentVar={accentVar}>
      <RecordsWarrantsContent accentVar={accentVar} initialCategory={initialCategory} />
    </FloatingWindow>
  );
}
