"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks, type NavItem } from "./NavLinks";
import { LangToggle } from "./LangToggle";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  items: NavItem[];
  label: string;
  closeLabel: string;
  title: string;
};

export function MobileNav({ items, label, closeLabel, title }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={label}>
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      {/* Botão de fechar próprio: o padrão do Sheet tem rótulo fixo em inglês. */}
      <SheetContent side="right" showCloseButton={false}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1.5 right-1.5 size-11"
              aria-label={closeLabel}
            />
          }
        >
          <X />
        </SheetClose>
        <nav aria-label={title} className="px-4">
          <NavLinks
            items={items}
            orientation="column"
            onNavigate={() => setOpen(false)}
          />
        </nav>
        <SheetFooter className="flex-row items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
