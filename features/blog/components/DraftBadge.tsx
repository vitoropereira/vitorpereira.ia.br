import { useTranslations } from "next-intl";

export function DraftBadge() {
  const t = useTranslations("blog");
  return (
    <span className="inline-flex items-center rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
      {t("draft")}
    </span>
  );
}
