import { readConsentFromRequest } from "@/lib/consent-server";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export async function ClarityScript() {
  // O ID entra num <script> inline: só aceita o formato do Clarity, nada que feche a tag.
  if (!CLARITY_ID || !/^[a-z0-9]+$/i.test(CLARITY_ID)) return null;
  const consent = await readConsentFromRequest();
  if (consent !== "accepted") return null;

  // Snippet oficial: a tag lê window.clarity.v ao iniciar. Carregada sozinha, sem
  // a fila, ela quebra com TypeError e nunca grava sessão.
  const snippet = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_ID)});`;

  return <script dangerouslySetInnerHTML={{ __html: snippet }} />;
}
