/**
 * Geração de vCard 3.0 para o cartão de visita digital (/card).
 *
 * Por que 3.0 e não 4.0: iOS e Android importam 3.0 sem atrito; 4.0 ainda
 * escorrega em app de agenda antigo. Lógica pura — sem I/O, sem relógio (REV
 * entra por parâmetro), para ficar testável e determinística.
 *
 * Referência: RFC 2426 (vCard MIME Directory Profile).
 */

import type { CardContactChannels, CardIdentity } from "./config";

/** Octetos máximos por linha antes da dobra, conforme RFC 2426 §2.6. */
const MAX_OCTETS = 75;
const CRLF = "\r\n";

/**
 * Escapa os caracteres reservados dentro de um VALOR de propriedade.
 * Não usar nos separadores estruturais (o ";" que divide N e ORG é sintaxe,
 * não conteúdo) — escape cada componente antes de juntá-los.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/**
 * Dobra a linha em MAX_OCTETS octetos (não caracteres — acento conta 2 em
 * UTF-8), quebrando só entre code points para nunca partir um caractere ao
 * meio. Cada continuação começa com um espaço, que o parser remove ao desdobrar.
 */
export function foldVCardLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= MAX_OCTETS) return line;

  const out: string[] = [];
  let current = "";
  let limit = MAX_OCTETS;

  for (const char of line) {
    const charBytes = Buffer.byteLength(char, "utf8");
    if (Buffer.byteLength(current, "utf8") + charBytes > limit) {
      out.push(current);
      current = char;
      // Continuações gastam 1 octeto com o espaço de dobra.
      limit = MAX_OCTETS - 1;
    } else {
      current += char;
    }
  }
  out.push(current);

  return (
    out[0] +
    CRLF +
    out
      .slice(1)
      .map((part) => ` ${part}`)
      .join(CRLF)
  );
}

export interface VCardPhoto {
  /** Conteúdo binário já em base64, sem prefixo data:. */
  base64: string;
  /** Tipo no vocabulário do vCard, ex.: "JPEG" ou "PNG". */
  mediaType: string;
}

export interface BuildVCardInput {
  identity: CardIdentity;
  contact: CardContactChannels;
  /** URLs públicas (site e perfis sociais), uma linha URL cada. */
  urls: readonly string[];
  photo?: VCardPhoto;
  /** Timestamp ISO-8601 do REV. Injetado para manter a função determinística. */
  revision?: string;
}

/** Monta o vCard completo, pronto para servir como text/vcard. */
export function buildVCard({
  identity,
  contact,
  urls,
  photo,
  revision,
}: BuildVCardInput): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  const name = [
    escapeVCardValue(identity.familyName),
    escapeVCardValue(identity.givenName),
    "",
    "",
    "",
  ].join(";");
  lines.push(`N:${name}`);
  lines.push(`FN:${escapeVCardValue(identity.fullName)}`);

  if (identity.orgs.length > 0) {
    lines.push(`ORG:${identity.orgs.map(escapeVCardValue).join(";")}`);
  }
  if (identity.role) {
    lines.push(`TITLE:${escapeVCardValue(identity.role)}`);
  }

  const digits = contact.whatsapp?.replace(/\D/g, "") ?? "";
  if (digits.length >= 10) {
    lines.push(`TEL;TYPE=CELL,VOICE:+${digits}`);
  }
  if (contact.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(contact.email)}`);
  }

  for (const url of urls) {
    lines.push(`URL:${escapeVCardValue(url)}`);
  }

  if (identity.tagline) {
    lines.push(`NOTE:${escapeVCardValue(identity.tagline)}`);
  }
  if (photo) {
    lines.push(`PHOTO;ENCODING=b;TYPE=${photo.mediaType}:${photo.base64}`);
  }
  if (revision) {
    lines.push(`REV:${revision}`);
  }

  lines.push("END:VCARD");

  return lines.map(foldVCardLine).join(CRLF) + CRLF;
}
