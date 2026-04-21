import { getTranslations } from "next-intl/server";
import { SocialLinks } from "./SocialLinks";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm md:flex-row">
        <span>{t("copyright", { year })}</span>
        <SocialLinks />
      </div>
    </footer>
  );
}
