// Detecta intentos de compartir datos de contacto o de cerrar la venta fuera de la página.
// Se aplica a publicaciones, perfiles de vendedor, preguntas y respuestas.

const PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /[\w.+-]+\s*(@|\(at\)|\[at\]|\barroba\b)\s*[\w-]+\s*(\.|\bpunto\b)\s*[a-z]{2,}/i, reason: "un email" },
  { re: /\b(https?:\/\/|www\.)\S+|\b[\w-]+\.(com|ar|net|org|shop|store|app|link|ly)\b/i, reason: "un link" },
  { re: /(^|\s)@[a-z0-9_.]{3,}/i, reason: "un usuario de redes sociales" },
  // 8 o más dígitos aunque estén separados por espacios, guiones, puntos o paréntesis
  { re: /(\d[\s\-().]*){8,}/, reason: "un número de teléfono o de cuenta" },
  {
    re: /\b(whats?app|wh?ats|wsp|wpp|watsap|telegram|instagram|insta|facebook|fb|tiktok|mail|gmail|hotmail|celular|cel|tel[eé]fono|llam[aá]me|escrib[ií]me|mand[aá]me|contact[aá]me|mi n[uú]mero)\b/i,
    reason: "una forma de contacto",
  },
  {
    re: /\b(transferencia|transfer[ií]|cbu|cvu|alias|efectivo|por fuera|fuera de la p[aá]gina|sin comisi[oó]n|te lo dejo m[aá]s barato|arreglamos)\b/i,
    reason: "un pago por fuera de la página",
  },
];

/** Devuelve el motivo si el texto incluye datos de contacto o pagos por fuera; null si está limpio. */
export function contactProblem(...texts: (string | null | undefined)[]) {
  for (const text of texts) {
    if (!text) continue;
    for (const { re, reason } of PATTERNS) {
      if (re.test(text)) {
        return `Por seguridad no se permite incluir ${reason}. Toda la comunicación y el pago se hacen dentro de la página.`;
      }
    }
  }
  return null;
}
