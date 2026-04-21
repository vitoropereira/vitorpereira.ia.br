"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export function GiscusComments() {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShow(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (
    !GISCUS_REPO ||
    !GISCUS_REPO_ID ||
    !GISCUS_CATEGORY ||
    !GISCUS_CATEGORY_ID
  ) {
    return null;
  }

  return (
    <div ref={ref} className="mt-16">
      {show && (
        <Giscus
          id="comments"
          repo={GISCUS_REPO as `${string}/${string}`}
          repoId={GISCUS_REPO_ID}
          category={GISCUS_CATEGORY}
          categoryId={GISCUS_CATEGORY_ID}
          mapping="pathname"
          strict="0"
          reactionsEnabled="1"
          emitMetadata="0"
          inputPosition="top"
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          lang={locale === "pt" ? "pt" : "en"}
          loading="lazy"
        />
      )}
    </div>
  );
}
