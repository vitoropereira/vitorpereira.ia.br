// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithOtp, verifyOtp, signOut } }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// after() só existe dentro de uma request do Next; aqui as tarefas vão para
// uma fila que o teste esvazia, imitando o "depois da resposta".
const { afterQueue } = vi.hoisted(() => ({
  afterQueue: [] as Array<() => unknown>,
}));
vi.mock("next/server", () => ({
  after: (fn: () => unknown) => {
    afterQueue.push(fn);
  },
}));

import { logout, requestCode as requestCodeRaw, verifyCode } from "./actions";

async function flushAfter() {
  for (const fn of afterQueue.splice(0)) await fn();
}

// Responde primeiro, roda o after depois: o mesmo que acontece em produção.
async function requestCode(...args: Parameters<typeof requestCodeRaw>) {
  const res = await requestCodeRaw(...args);
  await flushAfter();
  return res;
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const idle = { step: "email" } as const;

beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS", "vitor@y.com:*,fin@y.com:financas");
  signInWithOtp.mockResolvedValue({ data: {}, error: null });
  verifyOtp.mockResolvedValue({ data: {}, error: null });
  signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("requestCode", () => {
  it("e-mail fora da lista não chama o Supabase", async () => {
    await requestCode(idle, form({ email: "intruso@y.com" }));
    expect(signInWithOtp).toHaveBeenCalledTimes(0);
  });

  it("resposta é a mesma para e-mail fora e dentro da lista", async () => {
    const fora = await requestCode(idle, form({ email: "intruso@y.com" }));
    const dentro = await requestCode(idle, form({ email: "vitor@y.com" }));
    expect({ ...fora, email: "" }).toEqual({ ...dentro, email: "" });
    expect(fora.step).toBe("code");
  });

  it("a resposta não espera o Supabase (sem vazamento por timing)", async () => {
    signInWithOtp.mockReturnValue(new Promise(() => {}));
    const res = await requestCodeRaw(idle, form({ email: "vitor@y.com" }));
    expect(res.step).toBe("code");
    expect(signInWithOtp).not.toHaveBeenCalled();
    afterQueue.splice(0);
  });

  it("e-mail permitido pede OTP sem criar usuário", async () => {
    await requestCode(idle, form({ email: "  Vitor@Y.com " }));
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "vitor@y.com",
      options: { shouldCreateUser: false },
    });
  });

  it("toda chamada de OTP leva shouldCreateUser: false", async () => {
    await requestCode(idle, form({ email: "vitor@y.com" }));
    await requestCode(idle, form({ email: "fin@y.com" }));
    await requestCode(idle, form({ email: "intruso@y.com" }));
    expect(signInWithOtp.mock.calls.length).toBeGreaterThan(0);
    for (const [arg] of signInWithOtp.mock.calls) {
      expect(arg.options.shouldCreateUser).toBe(false);
    }
  });

  it("erro do Supabase devolve a resposta neutra, sem a mensagem", async () => {
    const neutra = await requestCode(idle, form({ email: "vitor@y.com" }));
    signInWithOtp.mockResolvedValue({
      data: {},
      error: new Error("Signups not allowed for otp"),
    });
    const comErro = await requestCode(idle, form({ email: "vitor@y.com" }));
    expect(comErro).toEqual(neutra);
    expect(JSON.stringify(comErro)).not.toContain("Signups");
  });

  it("Supabase lançando também devolve a resposta neutra", async () => {
    signInWithOtp.mockRejectedValue(new Error("rede"));
    const res = await requestCode(idle, form({ email: "vitor@y.com" }));
    expect(res.step).toBe("code");
    expect(res.error).toBeUndefined();
  });

  it("e-mail malformado volta para o primeiro passo com erro", async () => {
    const res = await requestCode(idle, form({ email: "nao-e-email" }));
    expect(res.step).toBe("email");
    expect(res.error).toBeTruthy();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
});

describe("verifyCode", () => {
  const codeStep = { step: "code", email: "vitor@y.com" } as const;

  it("chama verifyOtp com type email e redireciona para /admin", async () => {
    await expect(
      verifyCode(codeStep, form({ email: "Vitor@y.com", token: "123456" })),
    ).rejects.toThrow("REDIRECT:/admin");
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "vitor@y.com",
      token: "123456",
      type: "email",
    });
  });

  it("código inválido devolve erro genérico", async () => {
    verifyOtp.mockResolvedValue({
      data: {},
      error: new Error("Token has expired or is invalid"),
    });
    const res = await verifyCode(
      codeStep,
      form({ email: "vitor@y.com", token: "000000" }),
    );
    expect(res.step).toBe("code");
    expect(res.error).toBeTruthy();
    expect(res.error).not.toContain("Token");
  });

  it("e-mail fora da lista nem chama verifyOtp", async () => {
    const res = await verifyCode(
      codeStep,
      form({ email: "intruso@y.com", token: "123456" }),
    );
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(res.error).toBeTruthy();
  });

  it.each(["12345", "1234567", "abcdef", ""])(
    "token %j fora de ^\\d{6}$ não chama verifyOtp",
    async (token) => {
      const res = await verifyCode(
        codeStep,
        form({ email: "vitor@y.com", token }),
      );
      expect(verifyOtp).not.toHaveBeenCalled();
      expect(res.error).toBeTruthy();
    },
  );

  it("mesmo erro para lista, formato e código inválido", async () => {
    const fora = await verifyCode(
      codeStep,
      form({ email: "intruso@y.com", token: "123456" }),
    );
    verifyOtp.mockResolvedValue({ data: {}, error: new Error("x") });
    const invalido = await verifyCode(
      codeStep,
      form({ email: "vitor@y.com", token: "123456" }),
    );
    expect(fora.error).toBe(invalido.error);
  });
});

describe("logout", () => {
  it("encerra a sessão e volta ao login", async () => {
    await expect(logout()).rejects.toThrow("REDIRECT:/admin/login");
    expect(signOut).toHaveBeenCalled();
  });
});
