import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';
import { estonianErrorGenerator } from '../estonian-error-generator';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  getSystemPrompt(): string {
    return `You are Dr. Kersti Kask, an expert Estonian grammar instructor specializing in error detection for Spanish-speaking students. You have 15 years of experience teaching Estonian to native Spanish speakers and understand exactly what mistakes they make.

YOUR EXPERTISE:
- You identify the most common Estonian grammar errors Spanish speakers make
- You create educational examples that teach specific grammar points
- You explain errors clearly in Spanish that students can understand
- You match error complexity to student's CEFR level

YOUR TEACHING APPROACH:
- Focus on ONE clear grammar error per sentence
- Use natural Estonian word order (never artificial scrambling)
- Create errors that Spanish speakers actually make
- Provide helpful Spanish explanations that teach the grammar rule

CEFR LEVEL: ${this.cefrLevel}
${this.getCEFRTeachingGuidance()}

ERROR TYPES YOU TEACH:
${this.getErrorTypesByLevel()}

JSON RESPONSE FORMAT:
{
  "questions": [
    {
      "question": "¿Qué palabra está incorrecta en: '[Estonian sentence with one error]'?",
      "type": "error_detection",
      "options": ["word1", "ERROR_WORD", "word3", "word4"],
      "correctAnswer": "ERROR_WORD",
      "explanation": "[Spanish explanation of the grammar rule]",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

You always create exactly 5 questions that teach Estonian grammar effectively.`;
  }

  getUserPrompt(): string {
    return `Dr. Kask, please create 5 error detection questions for my ${this.cefrLevel} level Estonian class.

Focus on the grammar errors that Spanish speakers at ${this.cefrLevel} level typically make. Use vocabulary and sentence structures appropriate for this level.

Each question should:
- Have exactly ONE grammatical error in a natural Estonian sentence
- Include 3-4 answer options with the incorrect word
- Provide a clear Spanish explanation of the grammar rule

Please make sure the errors are realistic mistakes that help students learn Estonian grammar patterns.`;
  }

  /**
   * Enhanced method to generate pre-validated errors using Estonian linguistic tools
   */
  async generateValidatedErrors(): Promise<any[]> {
    try {
      const estonianErrors = await estonianErrorGenerator.generateErrorsForLevel(this.cefrLevel, 5);
      
      return estonianErrors.map((error, index) => ({
        question: `¿Qué palabra está incorrecta en: '${error.errorSentence}'?`,
        type: "error_detection",
        options: this.generateOptionsForError(error),
        correctAnswer: error.errorWord,
        explanation: error.explanation,
        cefrLevel: this.cefrLevel
      }));
      
    } catch (error) {
      console.error('Failed to generate Estonian validated errors:', error);
      return [];
    }
  }

  /**
   * Generate realistic options for error detection
   */
  private generateOptionsForError(error: any): string[] {
    const words = error.errorSentence.split(' ');
    const options = [error.errorWord];
    
    // Add other words from the sentence as distractors
    words.forEach((word: string) => {
      if (word !== error.errorWord && options.length < 4) {
        options.push(word);
      }
    });
    
    // Pad with common Estonian words if needed
    const commonWords = ['ja', 'on', 'ei', 'või'];
    commonWords.forEach(word => {
      if (options.length < 4 && !options.includes(word)) {
        options.push(word);
      }
    });
    
    // Shuffle options
    return this.shuffleArray(options);
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private getSpecificErrorExamplesForLevel(): string {
    const examples = {
      A1: `
{"question": "¿Qué palabra está mal: 'Ta lähen poodi'?", "translation": "Él/Ella va a la tienda", "options": ["Ta", "lähen", "poodi"], "correctAnswer": "lähen", "explanation": "3ra persona: läheb"}
{"question": "¿Qué palabra está mal: 'Mul on kaks koer'?", "translation": "Tengo dos perros", "options": ["Mul", "on", "kaks", "koer"], "correctAnswer": "koer", "explanation": "después de número: koera"}`,
      
      A2: `
{"question": "¿Qué palabra está mal: 'Ma elan Tallinn'?", "translation": "Vivo en Tallin", "options": ["Ma", "elan", "Tallinn"], "correctAnswer": "Tallinn", "explanation": "vivir en: Tallinnas"}
{"question": "¿Qué palabra está mal: 'See on mina raamat'?", "translation": "Este es mi libro", "options": ["See", "on", "mina", "raamat"], "correctAnswer": "mina", "explanation": "posesivo: minu"}`,
      
      B1: `
{"question": "¿Qué palabra está mal: 'Ma panen raamatu laud'?", "translation": "Pongo el libro sobre la mesa", "options": ["Ma", "panen", "raamatu", "laud"], "correctAnswer": "laud", "explanation": "hacia superficie: lauale"}
{"question": "¿Qué palabra está mal: 'Eile ma lähen kinno'?", "translation": "Ayer voy al cine", "options": ["Eile", "ma", "lähen", "kinno"], "correctAnswer": "lähen", "explanation": "pasado: läksin"}`,
      
      B2: `
{"question": "¿Qué palabra está mal: 'Ma tulen ilma raha'?", "translation": "Vengo sin dinero", "options": ["Ma", "tulen", "ilma", "raha"], "correctAnswer": "raha", "explanation": "sin algo: rahata"}
{"question": "¿Qué palabra está mal: 'Ta ootab bussis'?", "translation": "Él/Ella espera el autobús", "options": ["Ta", "ootab", "bussis"], "correctAnswer": "bussis", "explanation": "esperar algo: bussi"}`,
      
      C1: `
{"question": "¿Qué palabra está mal: 'Eksperdid arutavad selle küsimus üle'?", "translation": "Los expertos discuten sobre esta pregunta", "options": ["Eksperdid", "arutavad", "selle", "küsimus", "üle"], "correctAnswer": "küsimus", "explanation": "genitivo: küsimuse"}
{"question": "¿Qué palabra está mal: 'Professor selgitas teema huvitavalt'?", "translation": "El profesor explicó el tema de manera interesante", "options": ["Professor", "selgitas", "teema", "huvitavalt"], "correctAnswer": "teema", "explanation": "partitivo: teemat"}
{"question": "¿Qué palabra está mal: 'Õpilased arutasid tähtsat probleem'?", "translation": "Los estudiantes discutieron un problema importante", "options": ["Õpilased", "arutasid", "tähtsat", "probleem"], "correctAnswer": "probleem", "explanation": "partitivo: probleemi"}`,
      
      C2: `Nivel C2 no evaluado oficialmente en Estonia`
    };
    return examples[this.cefrLevel as keyof typeof examples] || examples.B1;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700, // Sufficient for 5 complete questions with explanations
      temperature: 0.1, // Very consistent error patterns
      topP: 0.7, // Focused on established patterns
      frequencyPenalty: 0.05, // Slight variety in vocabulary
      presencePenalty: 0.05 // Slight variety in error types
    };
  }

  private getCEFRTeachingGuidance(): string {
    const guidance = {
      A1: `BEGINNER LEVEL - Focus on basic survival grammar:
- Sentence length: 3-4 words maximum
- Vocabulary: Family, daily activities, basic nouns (kool, maja, auto)
- Grammar focus: Present tense verbs, basic cases (nominative, partitive)`,
      
      A2: `ELEMENTARY LEVEL - Expand basic grammar:
- Sentence length: 4-5 words maximum  
- Vocabulary: Work, travel, everyday activities
- Grammar focus: Past tense, location cases (illative, inessive, elative)`,
      
      B1: `INTERMEDIATE LEVEL - Complex situations:
- Sentence length: 5-6 words maximum
- Vocabulary: Abstract concepts, relationships, opinions
- Grammar focus: All locative cases, conditional mood, complex objects`,
      
      B2: `UPPER-INTERMEDIATE LEVEL - Academic/professional:
- Sentence length: 6-7 words maximum
- Vocabulary: Academic, professional, analytical terms
- Grammar focus: Advanced cases, reported speech, complex subordination`,
      
      C1: `ADVANCED LEVEL - Near-native complexity:
- Sentence length: 7-8 words maximum
- Vocabulary: Sophisticated, nuanced, specialized terms
- Grammar focus: Stylistic variations, advanced mood distinctions`
    };
    
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.A1;
  }

  private getErrorTypesByLevel(): string {
    const errorTypes = {
      A1: `Present tense verb agreement, basic partitive/nominative confusion, simple word forms`,
      A2: `Past tense errors, basic locative cases, possessive genitive mistakes`,  
      B1: `Complex case usage, conditional mood, partitive plural errors`,
      B2: `Advanced case distinctions, reported speech, complex verb forms`,
      C1: `Subtle case nuances, stylistic mood usage, complex grammatical constructions`
    };
    
    return errorTypes[this.cefrLevel as keyof typeof errorTypes] || errorTypes.A1;
  }


}