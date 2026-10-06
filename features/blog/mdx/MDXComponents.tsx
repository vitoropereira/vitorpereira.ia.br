import { Callout } from "./Callout";
import { Video } from "./Video";
import { ImageWithBlur } from "./ImageWithBlur";
import { CodeBlock } from "./CodeBlock";
import { Tweet } from "./Tweet";
import { DiagnosticCTA } from "./DiagnosticCTA";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const mdxComponents = {
  pre: CodeBlock,
  Callout,
  Video,
  Image: ImageWithBlur,
  Tweet,
  DiagnosticCTA,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};
