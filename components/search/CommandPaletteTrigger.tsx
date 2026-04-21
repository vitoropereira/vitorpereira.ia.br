"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandPaletteTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button variant="ghost" size="icon" aria-label="Search" onClick={onOpen}>
      <Search className="h-4 w-4" />
    </Button>
  );
}
