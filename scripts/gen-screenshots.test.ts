import { describe, expect, it } from "vitest";
import {
  classifyNavigation,
  outputPathFor,
  selectTargets,
} from "./gen-screenshots.ts";

describe("selectTargets", () => {
  const list = [
    { id: "a", url: "https://a.com" },
    { id: "b", url: null },
    { id: "c", url: "https://c.com" },
  ];
  it("ignora projeto sem url", () => {
    expect(selectTargets(list).map((t) => t.id)).toEqual(["a", "c"]);
  });
  it("filtra por --only", () => {
    expect(selectTargets(list, ["c"]).map((t) => t.id)).toEqual(["c"]);
  });
  it("--only com id inexistente lança, para não rodar em silêncio sem nada", () => {
    expect(() => selectTargets(list, ["zzz"])).toThrow(/zzz/);
  });
});

describe("outputPathFor", () => {
  it("grava em public/images/projects/<id>.webp", () => {
    expect(outputPathFor("clearseg")).toBe(
      "public/images/projects/clearseg.webp",
    );
  });
});

describe("classifyNavigation", () => {
  it("2xx/3xx final é ok", () => {
    expect(classifyNavigation(200, "https://x.com/")).toBe("ok");
  });
  it("4xx/5xx é erro — não vira capa", () => {
    expect(classifyNavigation(503, "https://x.com/")).toBe("http-error");
    expect(classifyNavigation(404, "https://x.com/")).toBe("http-error");
  });
  it("sem status (timeout, DNS) é no-response", () => {
    expect(classifyNavigation(undefined, "")).toBe("no-response");
  });
  it("chrome-error:// é no-response mesmo com status", () => {
    expect(classifyNavigation(200, "chrome-error://chromewebdata/")).toBe(
      "no-response",
    );
  });
  it("load que não disparou no prazo é no-response, mesmo com status 200", () => {
    expect(classifyNavigation(200, "https://x.com/", false)).toBe(
      "no-response",
    );
  });
  it("load disparado explicitamente mantém ok", () => {
    expect(classifyNavigation(200, "https://x.com/", true)).toBe("ok");
  });
});
