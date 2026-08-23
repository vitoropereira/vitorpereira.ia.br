import { describe, expect, it } from "vitest";
import { buildVCard, escapeVCardValue, foldVCardLine } from "./vcard";
import type { CardIdentity, CardContactChannels } from "./config";

const identity: CardIdentity = {
  fullName: "Vitor Onofre Pereira",
  givenName: "Vitor",
  familyName: "Onofre Pereira",
  role: "CTO, sócio-fundador",
  orgs: ["ClearSeg", "SARCORPS"],
  tagline: "IA aplicada em sistemas reais.",
};

const contact: CardContactChannels = {
  whatsapp: "5541999998888",
  whatsappPrefill: "Oi",
  email: "contato@vitorpereira.ia.br",
};

const urls = ["https://vitorpereira.ia.br", "https://github.com/vitoropereira"];

describe("escapeVCardValue", () => {
  it("escapa os caracteres reservados do RFC 2426", () => {
    expect(escapeVCardValue("a;b,c\\d")).toBe("a\\;b\\,c\\\\d");
  });

  it("converte quebra de linha em \\n literal", () => {
    expect(escapeVCardValue("linha1\nlinha2")).toBe("linha1\\nlinha2");
    expect(escapeVCardValue("linha1\r\nlinha2")).toBe("linha1\\nlinha2");
  });
});

describe("foldVCardLine", () => {
  it("não dobra linha curta", () => {
    expect(foldVCardLine("FN:Vitor")).toBe("FN:Vitor");
  });

  it("dobra em 75 octetos com espaço de continuação", () => {
    const long = `NOTE:${"x".repeat(200)}`;
    const folded = foldVCardLine(long);
    const lines = folded.split("\r\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(Buffer.byteLength(lines[0], "utf8")).toBeLessThanOrEqual(75);
    for (const cont of lines.slice(1)) {
      expect(cont.startsWith(" ")).toBe(true);
      expect(Buffer.byteLength(cont, "utf8")).toBeLessThanOrEqual(76);
    }
    // desdobrar reconstrói o original
    expect(folded.split("\r\n ").join("")).toBe(long);
  });

  it("não parte um caractere multibyte no meio", () => {
    const long = `NOTE:${"ç".repeat(100)}`;
    for (const line of foldVCardLine(long).split("\r\n")) {
      expect(line).not.toContain("�");
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(76);
    }
  });
});

describe("buildVCard", () => {
  it("abre e fecha com os delimitadores da versão 3.0", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(card.endsWith("END:VCARD\r\n")).toBe(true);
  });

  it("usa CRLF em todas as quebras", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("escreve N estruturado e FN", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card).toContain("N:Onofre Pereira;Vitor;;;\r\n");
    expect(card).toContain("FN:Vitor Onofre Pereira\r\n");
  });

  it("junta as orgs em ORG e escapa o separador", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card).toContain("ORG:ClearSeg;SARCORPS\r\n");
  });

  it("escapa a vírgula do cargo", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card).toContain("TITLE:CTO\\, sócio-fundador\r\n");
  });

  it("grava o telefone em E.164 com o +", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card).toContain("TEL;TYPE=CELL,VOICE:+5541999998888\r\n");
  });

  it("omite TEL quando não há whatsapp configurado", () => {
    const card = buildVCard({
      identity,
      contact: { ...contact, whatsapp: null },
      urls,
    });
    expect(card).not.toContain("TEL");
  });

  it("inclui o e-mail e uma linha URL por endereço", () => {
    const card = buildVCard({ identity, contact, urls });
    expect(card).toContain(
      "EMAIL;TYPE=INTERNET:contato@vitorpereira.ia.br\r\n",
    );
    expect(card).toContain("URL:https://vitorpereira.ia.br\r\n");
    expect(card).toContain("URL:https://github.com/vitoropereira\r\n");
  });

  it("omite ORG quando a lista está vazia", () => {
    const card = buildVCard({
      identity: { ...identity, orgs: [] },
      contact,
      urls,
    });
    expect(card).not.toContain("ORG:");
  });

  it("embute a foto em base64 dobrada quando fornecida", () => {
    const card = buildVCard({
      identity,
      contact,
      urls,
      photo: { base64: "QUJD".repeat(60), mediaType: "JPEG" },
    });
    expect(card).toContain("PHOTO;ENCODING=b;TYPE=JPEG:");
    for (const line of card.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(76);
    }
  });

  it("grava REV com o timestamp recebido, sem depender do relógio", () => {
    const card = buildVCard({
      identity,
      contact,
      urls,
      revision: "2026-08-23T12:00:00Z",
    });
    expect(card).toContain("REV:2026-08-23T12:00:00Z\r\n");
  });
});
