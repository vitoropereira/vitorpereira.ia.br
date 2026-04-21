"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { swapLocale } from "@/lib/i18n/routeMap";

export function LangToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("langToggle");

  const target = locale === "pt" ? "en" : "pt";
  const href = swapLocale(pathname, target);
  const label =
    target === "en" ? t("switchToEnglish") : t("switchToPortuguese");
  const flag = target === "en" ? "EN" : "PT";

  return (
    <Link
      href={href}
      aria-label={label}
      onClick={() => {
        document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }}
      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
    >
      {flag}
    </Link>
  );
}
