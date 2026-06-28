/**
 * Limpia el texto de las respuestas de Julia: aunque el system prompt le pide
 * texto plano, el modelo a veces incluye Markdown. Esto quita los símbolos
 * crudos (** negrita **, ### títulos, viñetas con * o -) para que el chat se vea
 * limpio. Red de seguridad — solo se aplica a mensajes del asistente.
 */
export function cleanJuliaText(text: string): string {
  if (!text) return text;
  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')   // "### Título" -> "Título"
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')   // ***x*** -> x
    .replace(/\*\*(.*?)\*\*/g, '$1')       // **negrita** -> negrita
    .replace(/__(.*?)__/g, '$1')           // __negrita__ -> negrita
    .replace(/^\s*[-*]\s+/gm, '• ')        // viñetas "- " o "* " -> "• "
    .replace(/\*/g, '')                     // asteriscos sueltos restantes
    .replace(/^\s*#+\s*/gm, '')             // almohadillas restantes
    .replace(/\n{3,}/g, '\n\n')             // colapsar saltos de línea extra
    .trim();
}
