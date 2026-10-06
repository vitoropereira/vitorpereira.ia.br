// Roda inline no <head>, antes da pintura. O estado "oculto até revelar" só
// existe sob .js — sem JS o conteúdo aparece normal. Se a hidratação quebrar
// depois de marcar .js, nenhum Reveal sinaliza "ready" e o failsafe devolve o
// conteúdo em 4s, em vez de deixar a página em branco.
export const MOTION_BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(d.dataset.motion!=="ready")d.classList.remove("js")},4000)})();`;
