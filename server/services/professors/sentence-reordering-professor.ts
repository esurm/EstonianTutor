import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class SentenceReorderingProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Estructura Estonia";
  }

  getSystemPrompt(): string {
    const sentenceExamples = estonianCorpus.getSentencesByLevel(this.cefrLevel);
    
    return `ESTRUCTURA ${this.cefrLevel} - Orden de palabras estonio.

Ejemplos corpus:
${sentenceExamples.slice(0, 3).map(s => s.text).join(", ")}

Reglas orden:
- Flexible: tiempo al inicio común
- SVO neutral, variaciones válidas
- Énfasis mueve al inicio

Patrones: ${this.getWordOrderPatterns()}

JSON: {
  "questions": [{
    "question": "Järjesta sõnad õigesti:",
    "translation": "traducción",
    "type": "sentence_reordering",
    "options": [palabras],
    "correctAnswer": "oración correcta.",
    "alternativeAnswers": ["variante1", "variante2"],
    "explanation": "patrón usado"
  }]
}`;
  }

  getUserPrompt(): string {
    return `5 ejercicios reordenar ${this.cefrLevel}. Incluye alternativas válidas. JSON completo.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700, // Balanced for alternatives
      temperature: 0.15,
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