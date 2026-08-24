import {
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TabNewsIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/brand/SocialIcons";
import { siteConfig } from "@/lib/siteConfig";

export function SocialLinks({
  variant = "footer",
}: {
  variant?: "footer" | "inline";
}) {
  const items = [
    { href: siteConfig.social.linkedin, icon: LinkedinIcon, label: "LinkedIn" },
    { href: siteConfig.social.github, icon: GithubIcon, label: "GitHub" },
    {
      href: siteConfig.social.instagram,
      icon: InstagramIcon,
      label: "Instagram",
    },
    { href: siteConfig.social.x, icon: XIcon, label: "X (Twitter)" },
    { href: siteConfig.social.youtube, icon: YoutubeIcon, label: "YouTube" },
    { href: siteConfig.social.tabnews, icon: TabNewsIcon, label: "TabNews" },
  ];

  return (
    <ul
      className={
        variant === "footer"
          ? "text-muted-foreground flex items-center gap-4"
          : "flex items-center gap-3"
      }
    >
      {items.map(({ href, icon: Icon, label }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="hover:text-foreground transition-colors"
          >
            <Icon />
          </a>
        </li>
      ))}
    </ul>
  );
}
