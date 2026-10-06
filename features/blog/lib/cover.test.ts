import { coverOf } from "./cover";

describe("coverOf", () => {
  it("retorna o objeto de imagem válido", () => {
    const cover = { src: "/a.webp", width: 1672, height: 941 };
    expect(coverOf({ cover })).toBe(cover);
  });

  it.each([[undefined], [{}], [{ cover: "x" }], [{ cover: { width: 1 } }]])(
    "retorna null para %j",
    (post) => {
      expect(coverOf(post as { cover?: unknown } | undefined)).toBeNull();
    },
  );
});
