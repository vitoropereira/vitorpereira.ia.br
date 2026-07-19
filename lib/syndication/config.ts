// Hardcoded de propósito: o canonical enviado ao TabNews precisa sempre apontar
// para produção, nunca para `NEXT_PUBLIC_SITE_URL` (que em dev é localhost).
// Não "simplifique" isto trocando por uma leitura de env.
export const SITE_URL = "https://vitorpereira.ia.br";
export const MAX_BODY = 20000;
export const TABNEWS_API = "https://www.tabnews.com.br/api/v1";
export const TABNEWS_WEB = "https://www.tabnews.com.br";
