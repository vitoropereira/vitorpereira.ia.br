export class ErroApi extends Error {
  status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
  }
}

/** Só a mensagem do Google: a URL e os headers ficam fora do erro. */
export async function erroDaResposta(
  res: { status: number; json(): Promise<unknown> },
  api: string,
): Promise<ErroApi> {
  const json = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  } | null;
  const msg = json?.error?.message ?? "sem mensagem";
  return new ErroApi(res.status, `${api} HTTP ${res.status}: ${msg}`);
}
