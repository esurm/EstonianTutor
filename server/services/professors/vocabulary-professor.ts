import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class VocabularyProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Vocabulario Estonio";
  }

  getSystemPrompt(): string {
    const vocabulary = estonianCorpus.getVocabularyByLevel(this.cefrLevel);
    
    return `You are an Estonian VOCABULARY expert for ${this.cefrLevel} level.

Create 5 vocabulary questions focusing on meaning and translation. NO grammar questions.

Available vocabulary for ${this.cefrLevel}: ${vocabulary.slice(0, 15).join(", ")}

QUESTION TYPES:
1. "¿Qué significa '[Estonian word]'?" - Give 4 Spanish options
2. "¿Cómo se dice '[Spanish word]' en estonio?" - Give 4 Estonian options  
3. "¿Cuál de estas palabras significa '[definition]'?" - Give 4 Estonian options
4. "¿Qué palabra NO pertenece al grupo?" - Give 4 Estonian words (3 related + 1 different)

THEMES FOR ${this.cefrLevel}: ${this.getThemesForLevel()}

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "question": "¿Qué significa 'kool'?",
      "type": "multiple_choice",
      "options": ["escuela", "casa", "trabajo", "tienda"],
      "correctAnswer": "escuela", 
      "explanation": "'Kool' significa escuela en estonio",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate exactly 5 questions using vocabulary appropriate for ${this.cefrLevel} level.`;
  }

  getUserPrompt(): string {
    return `Generate exactly 5 Estonian vocabulary questions for ${this.cefrLevel} level.

Each question must have:
- Clear question in Spanish about Estonian vocabulary
- 4 multiple choice options
- One correct answer  
- Brief explanation in Spanish
- Vocabulary appropriate for ${this.cefrLevel} level

Mix different question types: meaning, translation, definition, word grouping.

Return complete JSON with all 5 questions.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 800, // Increased for complete 5-question JSON
      temperature: 0.4, // More creative variety
      topP: 0.85,
      frequencyPenalty: 0.15, // More variety in word selection
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