import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';
import { estonianErrorGenerator } from '../estonian-error-generator';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  getSystemPrompt(): string {
    return `You are Dr. Kersti Kask, expert at creating Estonian sentences WITH grammatical errors for ${this.cefrLevel} level students.

CRITICAL TASK: Create sentences that contain REAL grammatical errors that Spanish speakers make learning Estonian.

EXAMPLES OF ACTUAL ERRORS FOR ${this.cefrLevel}:
${this.getActualErrorExamples()}

YOUR METHOD:
1. Start with a CORRECT Estonian sentence
2. Change ONE word to make it grammatically WRONG
3. The error must be a real mistake Spanish speakers make
4. Provide 3-4 word options including the wrong word
5. Explain in Spanish why it's wrong and what the correct form should be

FORBIDDEN:
- NEVER use correct sentences and claim they have errors
- NEVER mark correct words as wrong
- NEVER say "no hay error" - every sentence MUST have exactly one error

REQUIRED FORMAT:
{
  "questions": [
    {
      "question": "¿Qué palabra está incorrecta en: 'Ma läheb kooli'?",
      "type": "error_detection",
      "options": ["Ma", "läheb", "kooli"],
      "correctAnswer": "läheb",
      "explanation": "Con 'Ma' (yo) se usa 'lähen', no 'läheb'. Primeira persona singular termina en '-n'.",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate exactly 5 sentences that each contain ONE real grammatical error.`;
  }

  getUserPrompt(): string {
    return `Dr. Kask, I need 5 Estonian sentences that contain REAL grammatical errors for ${this.cefrLevel} level.

CRITICAL REQUIREMENTS:
- Each sentence must have exactly ONE grammatical error
- The error must be a word that is genuinely wrong
- Use the examples I provided as your model
- Never create correct sentences and claim they have errors
- Every sentence must contain an actual mistake

Follow this pattern:
1. Create a sentence with ONE grammatical error
2. Identify the wrong word  
3. Explain in Spanish why it's wrong and what's correct

Example: "Ma läheb kooli" - "läheb" is wrong, should be "lähen" with "Ma"

Generate 5 such sentences with real errors for ${this.cefrLevel} level.`;
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
      maxTokens: 800, // Sufficient for 5 complete questions with explanations
      temperature: 0.05, // Ultra-consistent to follow examples exactly
      topP: 0.6, // Very focused on given examples
      frequencyPenalty: 0, // No penalty - follow examples exactly
      presencePenalty: 0 // No penalty - stick to example patterns
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

  private getActualErrorExamples(): string {
    const examples = {
      A1: `
ERROR SENTENCE: "Ma läheb kooli" → WRONG WORD: "läheb" → CORRECT: "lähen"
ERROR SENTENCE: "Ta lähen tööle" → WRONG WORD: "lähen" → CORRECT: "läheb"  
ERROR SENTENCE: "Ma söön leiv" → WRONG WORD: "leiv" → CORRECT: "leiba"
ERROR SENTENCE: "Kaks koer" → WRONG WORD: "koer" → CORRECT: "koera"`,

      A2: `
ERROR SENTENCE: "Ma elan Tallinn" → WRONG WORD: "Tallinn" → CORRECT: "Tallinnas"
ERROR SENTENCE: "Ta lähen kool" → WRONG WORD: "kool" → CORRECT: "kooli"
ERROR SENTENCE: "See on mina auto" → WRONG WORD: "mina" → CORRECT: "minu"
ERROR SENTENCE: "Me tuleb koolist" → WRONG WORD: "tuleb" → CORRECT: "tuleme"`,

      B1: `
ERROR SENTENCE: "Ma panen raamat laud" → WRONG WORD: "laud" → CORRECT: "lauale"
ERROR SENTENCE: "Ta võtab laualt raamat" → WRONG WORD: "raamat" → CORRECT: "raamatu"
ERROR SENTENCE: "Eile ma lähen kinno" → WRONG WORD: "lähen" → CORRECT: "läksin"
ERROR SENTENCE: "Ma näen palju inimesed" → WRONG WORD: "inimesed" → CORRECT: "inimesi"`,

      B2: `
ERROR SENTENCE: "Ma tulen ilma raha" → WRONG WORD: "raha" → CORRECT: "rahata"
ERROR SENTENCE: "Ta ootab bussis" → WRONG WORD: "bussis" → CORRECT: "bussi"
ERROR SENTENCE: "Ma oleks lähen, aga..." → WRONG WORD: "lähen" → CORRECT: "läinud"`,

      C1: `
ERROR SENTENCE: "Eksperdid arutavad selle küsimus üle" → WRONG WORD: "küsimus" → CORRECT: "küsimuse"
ERROR SENTENCE: "Ta ütles, et ta tulen homme" → WRONG WORD: "tulen" → CORRECT: "tuleb"
ERROR SENTENCE: "Professor selgitas teema huvitavalt" → WRONG WORD: "teema" → CORRECT: "teemat"`
    };
    
    return examples[this.cefrLevel as keyof typeof examples] || examples.A1;
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