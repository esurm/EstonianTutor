import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class VocabularyProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Vocabulario Estonio";
  }

  getSystemPrompt(): string {
    const vocabulary = estonianCorpus.getVocabularyByLevel(this.cefrLevel);
    
    return `VOCABULARIO ${this.cefrLevel} - Solo significados, NO gramática.

Corpus: ${vocabulary.slice(0, 15).join(", ")}

Tipos permitidos:
- ¿Qué significa X? → traducción
- ¿Cómo se dice Y? → palabra estonia
- Identifica por definición
- Campo semántico

JSON: {
  "questions": [{
    "question": "...",
    "translation": "instrucción",
    "type": "multiple_choice",
    "options": [4 opciones],
    "correctAnswer": "...",
    "explanation": "máx 8 palabras"
  }]
}

Temas ${this.cefrLevel}: ${this.getThemesForLevel()}`;
  }

  getUserPrompt(): string {
    return `5 preguntas vocabulario ${this.cefrLevel}. Mezcla tipos: significado, traducción, definición. JSON completo.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 600, // Balanced for complete JSON
      temperature: 0.3,
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