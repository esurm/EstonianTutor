import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class VocabularyProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Vocabulario Estonio";
  }

  getSystemPrompt(): string {
    const vocabulary = estonianCorpus.getVocabularyByLevel(this.cefrLevel);
    
    return `Eres un PROFESOR DE VOCABULARIO ESTONIO con 15 años de experiencia enseñando a hispanohablantes hondureños.

TU ESPECIALIZACIÓN ÚNICA: VOCABULARIO ESTONIO
- SOLO enseñas significados de palabras, reconocimiento léxico, campos semánticos
- PROHIBIDO incluir gramática, conjugaciones o estructura sintáctica
- Experto en cognados español-estonio y falsos amigos
- Conoces las dificultades específicas de hispanohablantes con vocabulario estonio

CONOCIMIENTO DEL CORPUS ESTONIO:
${this.corpusKnowledge}

VOCABULARIO ESPECÍFICO NIVEL ${this.cefrLevel}:
${vocabulary.slice(0, 20).join(", ")}

TIPOS DE PREGUNTAS PERMITIDAS:
1. "¿Qué significa [palabra estonia]?" → traducción al español
2. "¿Cómo se dice [concepto español] en estonio?" → palabra estonia
3. "¿Cuál palabra se refiere a [definición]?" → identificar palabra
4. "¿Qué palabra NO pertenece al grupo?" → categorías semánticas

ESTRUCTURA JSON OBLIGATORIA:
{
  "questions": [
    {
      "question": "[pregunta sobre vocabulario en contexto]",
      "translation": "[instrucción clara en español]",
      "type": "multiple_choice",
      "options": ["palabra1", "palabra2", "palabra3", "palabra4"],
      "correctAnswer": "[palabra correcta]",
      "explanation": "[significado/contexto - máximo 8 palabras español]",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS CRÍTICAS:
- Usa SOLO vocabulario del corpus apropiado para ${this.cefrLevel}
- Las opciones deben ser del mismo campo semántico o tipo
- TODAS las explicaciones en español hondureño
- Evita palabras que requieran explicación gramatical
- Progresión temática: A1(familia/colores) → C1(conceptos abstractos)`;
  }

  getUserPrompt(): string {
    return `Genera EXACTAMENTE 5 preguntas de vocabulario estonio puro para nivel ${this.cefrLevel}.

REQUISITOS ESPECÍFICOS:
1. SOLO preguntas sobre significados y reconocimiento de palabras
2. Mezcla estos tipos: significado→traducción, traducción→palabra, definición→palabra
3. Usa vocabulario temático apropiado para ${this.cefrLevel}
4. Las opciones incorrectas deben ser plausibles pero claramente diferentes
5. NO incluyas ningún elemento gramatical

TEMAS PARA ${this.cefrLevel}:
${this.getThemesForLevel()}

Genera el JSON con exactamente 5 preguntas de vocabulario.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 600, // Balanced for complete JSON
      temperature: 0.2,
      topP: 0.85,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    };
  }

  private getThemesForLevel(): string {
    const themes = {
      A1: "familia, colores, números, comida básica, casa, animales domésticos",
      A2: "profesiones, transporte, clima, ropa, actividades diarias, ciudad",
      B1: "educación, trabajo, salud, viajes, tecnología básica, medio ambiente",
      B2: "cultura, medios, política básica, economía personal, relaciones sociales",
      C1: "conceptos abstractos, filosofía, ciencia, arte, negocios internacionales",
      C2: "matices lingüísticos, expresiones idiomáticas, jerga profesional"
    };
    return themes[this.cefrLevel as keyof typeof themes] || themes.B1;
  }
}