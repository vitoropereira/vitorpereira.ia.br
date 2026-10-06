// O Velite tipa `cover` como opcional e o formato real é um objeto de imagem;
// três telas repetiam o mesmo cast. Fica num lugar só.
export type CoverImage = {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

export function coverOf(
  post: { cover?: unknown } | undefined,
): CoverImage | null {
  const c = post?.cover;
  if (
    c &&
    typeof c === "object" &&
    "src" in c &&
    typeof (c as CoverImage).src === "string"
  ) {
    return c as CoverImage;
  }
  return null;
}
