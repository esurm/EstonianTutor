import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class SentenceReorderingProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Estructura Estonia";
  }

  getSystemPrompt(): string {
    const sentenceExamples = estonianCorpus.getSentencesByLevel(this.cefrLevel);
    
    return `Eres un PROFESOR DE ESTRUCTURA SINTÁCTICA ESTONIA especializado en orden de palabras.

TU ESPECIALIZACIÓN ÚNICA: ORDEN DE PALABRAS EN ESTONIO
- Enseñas la estructura flexible pero regulada del estonio
- Conoces las diferencias con el orden rígido del español
- Dominas las variaciones permitidas y sus matices

CONOCIMIENTO DEL CORPUS ESTONIO:
${this.corpusKnowledge}

EJEMPLOS DE ORACIONES NIVEL ${this.cefrLevel}:
${sentenceExamples.slice(0, 5).map(s => s.text).join("\n")}

REGLAS DE ORDEN ESTONIO:
1. FLEXIBLE pero con patrones preferidos
2. Tiempo frecuentemente al inicio: "Täna ma lähen"
3. Verbo en segunda posición (V2) común pero no obligatorio
4. Sujeto-Verbo-Objeto es neutral, pero permite variaciones
5. Adverbios de manera cerca del verbo
6. Énfasis mueve elementos al inicio

PATRONES PARA ${this.cefrLevel}:
${this.getWordOrderPatterns()}

ESTRUCTURA JSON OBLIGATORIA:
{
  "questions": [
    {
      "question": "Järjesta sõnad õigesti:",
      "translation": "[oración correcta en español]",
      "type": "sentence_reordering",
      "options": ["palabra1", "palabra2", "palabra3", "palabra4"],
      "correctAnswer": "[oración correcta con puntuación]",
      "alternativeAnswers": ["[variante válida 1]", "[variante válida 2]"],
      "explanation": "[patrón usado - máximo 6 palabras español]",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS CRÍTICAS:
- Las palabras en options deben formar EXACTAMENTE la oración correcta
- SIEMPRE incluye alternativeAnswers para órdenes válidos
- La oración debe ser natural y común en estonio
- Puntuación correcta (mayúscula inicial, punto final)
- Explicación del patrón principal usado`;
  }

  getUserPrompt(): string {
    return `Genera EXACTAMENTE 5 ejercicios de ordenar palabras en estonio para nivel ${this.cefrLevel}.

REQUISITOS ESPECÍFICOS:
1. Palabras desordenadas que formen una oración natural
2. Incluye 1-2 órdenes alternativos válidos cuando sea posible
3. Usa vocabulario y estructuras apropiadas para ${this.cefrLevel}
4. Las oraciones deben ser comunes en la vida real
5. Mezcla diferentes patrones de orden

LONGITUD DE ORACIONES PARA ${this.cefrLevel}:
${this.getSentenceLengthGuidance()}

IMPORTANTE:
- El estonio permite varios órdenes correctos
- "Täna ma lähen kooli" = "Ma lähen täna kooli" (ambos correctos)
- Incluye estas variantes en alternativeAnswers

Genera el JSON con exactamente 5 ejercicios.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 1200, // Increased to prevent JSON truncation
      temperature: 0.1,
      topP: 0.8,
      frequencyPenalty: 0.0,
      presencePenalty: 0.1
    };
  }

  private getWordOrderPatterns(): string {
    const patterns = {
      A1: `BÁSICOS (3-4 palabras):
- SVO: Ma joon vett (Yo bebo agua)
- Tiempo + SV: Täna ma õpin (Hoy yo estudio)
- SV + Lugar: Ma lähen koju (Yo voy a casa)`,
      
      A2: `A1 + ADVERBIOS (4-5 palabras):
- TSVO: Homme ma ostan leiba (Mañana yo compro pan)
- SVO + Lugar: Ma õpin eesti keelt koolis
- Pregunta: Kus sa elad? (¿Dónde vives?)`,
      
      B1: `A2 + OBJETOS MÚLTIPLES (5-6 palabras):
- SVOO: Ma annan sulle raamatu (Te doy el libro)
- Énfasis frontal: Raamatu ma loen homme
- Subordinadas simples: Ma tean, et ta tuleb`,
      
      B2: `B1 + ESTRUCTURAS COMPLEJAS (6-8 palabras):
- Adverbios múltiples con orden flexible
- Oraciones subordinadas con orden interno
- Topicalización para énfasis`,
      
      C1: `B2 + VARIACIONES ESTILÍSTICAS:
- Orden marcado para efectos pragmáticos
- Estructuras periodísticas y académicas
- Inversiones poéticas permitidas`,
      
      C2: "Dominio completo de todas las variaciones"
    };
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.B1;
  }

  private getSentenceLengthGuidance(): string {
    const guidance = {
      A1: "3-4 palabras: sujeto + verbo + complemento simple",
      A2: "4-5 palabras: añade tiempo o lugar",
      B1: "5-6 palabras: incluye objeto indirecto o adverbio",
      B2: "6-8 palabras: oraciones con múltiples complementos",
      C1: "7-10 palabras: estructuras subordinadas complejas",
      C2: "Sin límite: oraciones sofisticadas"
    };
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.B1;
  }
}