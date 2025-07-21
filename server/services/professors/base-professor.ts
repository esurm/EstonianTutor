/**
 * Base interface and utilities for all AI professors
 */

export interface ProfessorSettings {
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface Professor {
  name: string;
  systemPrompt: string;
  userPrompt: string;
  settings: ProfessorSettings;
}

export interface QuizQuestion {
  question: string;
  translation?: string;
  type?: string;
  questionType?: string;
  options?: string[];
  correctAnswer: string;
  alternativeAnswers?: string[];
  explanation: string;
  cefrLevel: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

/**
 * Base class for all AI professors with shared functionality
 */
export abstract class BaseProfessor {
  protected cefrLevel: string;
  protected corpusKnowledge: string;

  constructor(cefrLevel: string, corpusKnowledge: string) {
    this.cefrLevel = cefrLevel;
    this.corpusKnowledge = corpusKnowledge;
  }

  abstract getName(): string;
  abstract getSystemPrompt(): string;
  abstract getUserPrompt(): string;
  abstract getSettings(): ProfessorSettings;

  /**
   * Get complete professor configuration
   */
  getProfessor(): Professor {
    return {
      name: this.getName(),
      systemPrompt: this.getSystemPrompt(),
      userPrompt: this.getUserPrompt(),
      settings: this.getSettings()
    };
  }

  /**
   * Get CEFR-specific guidance for the level
   */
  protected getCEFRGuidance(): string {
    const guidance = {
      A1: "Frases muy básicas, vocabulario esencial, presente simple",
      A2: "Frases simples, vocabulario cotidiano, pasado simple introducido",
      B1: "Oraciones más complejas, vocabulario expandido, todos los tiempos básicos",
      B2: "Estructuras complejas, vocabulario abstracto, matices gramaticales",
      C1: "Lenguaje sofisticado, expresiones idiomáticas, gramática avanzada",
      C2: "Dominio nativo, sutilezas culturales, registro formal/informal"
    };
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.B1;
  }
}