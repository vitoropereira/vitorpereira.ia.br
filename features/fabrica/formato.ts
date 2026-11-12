import { diaSaoPaulo as dia } from "@/features/social-metrics/dia";

// Fuso do dono: "hoje" e "ontem" são do calendário dele, não do servidor (UTC).
const FUSO = "America/Sao_Paulo";

// "1 dia e 4 h", "33 min", "5 h"; null vira "sem dado" (não um 0 que pareça medida).
export function formatarTempoMedio(horas: number | null): string {
  if (horas === null) return "sem dado";
  // Arredonda em minutos antes de decidir a unidade: 0,995 h não vira "60 min".
  const minutos = Math.round(horas * 60);
  if (minutos < 60) return `${Math.max(1, minutos)} min`;
  const totalH = Math.round(horas);
  const dias = Math.floor(totalH / 24);
  const h = totalH % 24;
  if (dias === 0) return `${h} h`;
  const d = `${dias} ${dias === 1 ? "dia" : "dias"}`;
  return h === 0 ? d : `${d} e ${h} h`;
}

// Criado uma vez: Intl.DateTimeFormat é caro e a lista chama por linha.
const HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  hour: "2-digit",
  minute: "2-digit",
});
const hora = (d: Date) => HORA.format(d);

// Hora do evento: "11:22" se for de hoje, "11/11 05:01" se não. ISO cru na
// lista é ilegível; data ilegível vira "—".
export function formatarHoraEvento(
  iso: string,
  agora: Date = new Date(),
): string {
  const t = new Date(iso);
  if (!iso || Number.isNaN(t.getTime())) return "—";
  const dt = dia(t);
  if (dt === dia(agora)) return hora(t);
  const [, mes, d] = dt.split("-");
  return `${d}/${mes} ${hora(t)}`;
}

// "hoje 11:22", "ontem" ou "21/04"; sem data (ou data ilegível) vira "—".
export function formatarUltimoDeploy(
  iso: string | null,
  agora: Date = new Date(),
): string {
  if (!iso) return "—";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "—";
  const dt = dia(t);
  if (dt === dia(agora)) return `hoje ${hora(t)}`;
  if (dt === dia(new Date(agora.getTime() - 24 * 3_600_000))) return "ontem";
  const [, mes, d] = dt.split("-");
  return `${d}/${mes}`;
}
