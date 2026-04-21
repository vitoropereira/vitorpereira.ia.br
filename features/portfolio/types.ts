export type ProjectCategory =
  | "web"
  | "mobile"
  | "ai"
  | "automation"
  | "analytics"
  | "saas"
  | "education"
  | "fintech"
  | "business";

export type ProjectStatus = "completed" | "ongoing" | "mvp";

export type LocalizedText = { pt: string; en: string };
export type LocalizedList = { pt: string[]; en: string[] };

export type Project = {
  id: string;
  title: string;
  excerpt: LocalizedText;
  description: LocalizedText;
  category: ProjectCategory;
  technologies: string[];
  year: string;
  status: ProjectStatus;
  featured: boolean;
  client: string | null;
  url: string | null;
  results: LocalizedList;
  cover: string | null;
};
