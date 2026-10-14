import { describe, expect, it } from "vitest";
import {
  allowedSections,
  canAccess,
  isListed,
  parseAdminAccess,
} from "./access";

describe("parseAdminAccess", () => {
  it("lê e-mail e seções separadas por |", () => {
    const map = parseAdminAccess("a@x.com:redes|financas,b@x.com:*");
    expect(map.get("a@x.com")).toEqual(["redes", "financas"]);
    expect(map.get("b@x.com")).toEqual(["*"]);
  });

  it("normaliza e-mail com trim e lowercase", () => {
    const map = parseAdminAccess("  Vitor@X.com : redes ");
    expect(map.get("vitor@x.com")).toEqual(["redes"]);
  });

  it("env vazia ou ausente não lista ninguém", () => {
    expect(parseAdminAccess("").size).toBe(0);
    expect(parseAdminAccess(undefined).size).toBe(0);
  });

  it("ignora entrada sem ':' ou sem e-mail ou sem seção", () => {
    const map = parseAdminAccess("solto@x.com,:redes,c@x.com:,ok@x.com:redes");
    expect([...map.keys()]).toEqual(["ok@x.com"]);
  });
});

describe("canAccess", () => {
  const env = "x@y.com:financas,root@y.com:*";

  it("nega seção que o e-mail não tem", () => {
    expect(canAccess("x@y.com", "redes", env)).toBe(false);
  });

  it("libera seção listada, sem ligar para caixa", () => {
    expect(canAccess("X@Y.com", "financas", env)).toBe(true);
  });

  it("* libera qualquer seção", () => {
    expect(canAccess("root@y.com", "redes", env)).toBe(true);
  });

  it("e-mail fora da lista é negado", () => {
    expect(canAccess("z@y.com", "redes", env)).toBe(false);
  });

  it("env ausente nega todo mundo", () => {
    expect(canAccess("root@y.com", "redes", undefined)).toBe(false);
  });
});

describe("isListed", () => {
  it("true para quem está na lista, com qualquer seção", () => {
    expect(isListed(" X@y.com ", "x@y.com:financas")).toBe(true);
    expect(isListed("z@y.com", "x@y.com:financas")).toBe(false);
    expect(isListed(undefined, "x@y.com:financas")).toBe(false);
  });
});

describe("allowedSections", () => {
  it("filtra o catálogo pelas seções do e-mail", () => {
    expect(allowedSections("x@y.com", "x@y.com:redes|inexistente")).toEqual([
      "redes",
    ]);
  });

  it("* devolve o catálogo inteiro", () => {
    expect(allowedSections("x@y.com", "x@y.com:*")).toEqual(["redes"]);
  });

  it("seção fora do catálogo não aparece", () => {
    expect(allowedSections("x@y.com", "x@y.com:financas")).toEqual([]);
  });
});
