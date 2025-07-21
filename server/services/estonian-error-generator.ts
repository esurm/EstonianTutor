import { estonianCorpus } from './estonianCorpus';
import { estonianValidator } from './estonianValidator';

export interface EstonianError {
  correctSentence: string;
  errorSentence: string;
  errorWord: string;
  correctWord: string;
  errorType: string;
  explanation: string;
  level: string;
}

export class EstonianErrorGenerator {
  
  /**
   * Generate authentic Estonian grammatical errors for a specific CEFR level
   */
  async generateErrorsForLevel(level: string, count: number = 5): Promise<EstonianError[]> {
    const errors: EstonianError[] = [];
    const sentences = estonianCorpus.getSentencesByLevel(level);
    
    if (sentences.length === 0) {
      console.warn(`No corpus sentences found for level ${level}`);
      return this.getFallbackErrors(level, count);
    }

    for (let i = 0; i < count && i < sentences.length; i++) {
      const correctSentence = sentences[i].text;
      const error = await this.createErrorFromSentence(correctSentence, level);
      
      if (error) {
        // Validate the error using Estonian validator
        try {
          const validation = await estonianValidator.validateSingleError(
            error.errorSentence, 
            error.errorWord, 
            error.explanation
          );
          
          if (validation.valid) {
            errors.push(error);
            console.log(`✅ Generated valid error: ${error.errorSentence}`);
          } else {
            console.log(`❌ Invalid error generated: ${error.errorSentence} (${validation.error_count} errors)`);
          }
        } catch (validationError) {
          console.error('Validation failed for generated error:', validationError);
          // Include error anyway if validation fails
          errors.push(error);
        }
      }
    }
    
    // Fill with fallback errors if needed
    while (errors.length < count) {
      const fallbackErrors = this.getFallbackErrors(level, count - errors.length);
      errors.push(...fallbackErrors);
    }

    return errors.slice(0, count);
  }

  /**
   * Create a grammatical error from a correct Estonian sentence
   */
  private async createErrorFromSentence(sentence: string, level: string): Promise<EstonianError | null> {
    const words = sentence.split(' ');
    
    // Define error patterns by CEFR level
    const errorPatterns = this.getErrorPatternsForLevel(level);
    
    for (const pattern of errorPatterns) {
      const error = this.applyErrorPattern(sentence, pattern);
      if (error) {
        return error;
      }
    }
    
    return null;
  }

  /**
   * Apply a specific error pattern to a sentence
   */
  private applyErrorPattern(sentence: string, pattern: any): EstonianError | null {
    const words = sentence.split(' ');
    
    switch (pattern.type) {
      case 'verb_agreement':
        return this.createVerbAgreementError(words, sentence, pattern);
      
      case 'case_error':
        return this.createCaseError(words, sentence, pattern);
      
      case 'word_order':
        return this.createWordOrderError(words, sentence, pattern);
      
      default:
        return null;
    }
  }

  /**
   * Create verb agreement error (e.g., "ma lähen" → "ma läheb")
   */
  private createVerbAgreementError(words: string[], sentence: string, pattern: any): EstonianError | null {
    for (let i = 0; i < words.length - 1; i++) {
      const pronoun = words[i].toLowerCase();
      const verb = words[i + 1];
      
      if (pronoun === 'ma' && verb.endsWith('b')) {
        // Change 3rd person to 1st person error: "ma läheb" → "ma lähen"  
        const errorVerb = verb.slice(0, -1) + 'n';
        const errorWords = [...words];
        errorWords[i + 1] = errorVerb;
        
        return {
          correctSentence: sentence,
          errorSentence: errorWords.join(' '),
          errorWord: errorVerb,
          correctWord: verb,
          errorType: 'verb_agreement',
          explanation: `Primera persona requiere terminación '-n', no '-b'`,
          level: pattern.level
        };
      }
      
      if (pronoun === 'ta' && verb.endsWith('n')) {
        // Change 1st person to 3rd person error: "ta lähen" → "ta läheb"
        const errorVerb = verb.slice(0, -1) + 'b';
        const errorWords = [...words];
        errorWords[i + 1] = errorVerb;
        
        return {
          correctSentence: sentence,
          errorSentence: errorWords.join(' '),
          errorWord: verb, // The original verb is the error in the error sentence
          correctWord: errorVerb,
          errorType: 'verb_agreement', 
          explanation: `Tercera persona requiere terminación '-b', no '-n'`,
          level: pattern.level
        };
      }
    }
    
    return null;
  }

  /**
   * Create case error (e.g., "koolis" → "kooli")
   */
  private createCaseError(words: string[], sentence: string, pattern: any): EstonianError | null {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Look for location words that could have case errors
      if (word.endsWith('s')) {
        // Change inessive to illative: "koolis" → "kooli"
        const errorWord = word.slice(0, -1);
        if (errorWord.endsWith('i')) {
          const errorWords = [...words];
          errorWords[i] = errorWord;
          
          return {
            correctSentence: sentence,
            errorSentence: errorWords.join(' '),
            errorWord: errorWord,
            correctWord: word,
            errorType: 'case_error',
            explanation: `Ubicación en un lugar requiere caso inessivo (-s), no ilativo`,
            level: pattern.level
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Create word order error
   */
  private createWordOrderError(words: string[], sentence: string, pattern: any): EstonianError | null {
    if (words.length >= 3) {
      // Swap first two words to create word order error
      const errorWords = [...words];
      [errorWords[0], errorWords[1]] = [errorWords[1], errorWords[0]];
      
      return {
        correctSentence: sentence,
        errorSentence: errorWords.join(' '),
        errorWord: errorWords[0],
        correctWord: words[0],
        errorType: 'word_order',
        explanation: `Orden incorrecto - sujeto debe ir antes del verbo en estonio`,
        level: pattern.level
      };
    }
    
    return null;
  }

  /**
   * Get error patterns appropriate for CEFR level
   */
  private getErrorPatternsForLevel(level: string): any[] {
    const patterns: Record<string, any[]> = {
      A1: [
        { type: 'verb_agreement', level: 'A1', weight: 0.7 },
        { type: 'case_error', level: 'A1', weight: 0.3 }
      ],
      A2: [
        { type: 'verb_agreement', level: 'A2', weight: 0.4 },
        { type: 'case_error', level: 'A2', weight: 0.5 },
        { type: 'word_order', level: 'A2', weight: 0.1 }
      ],
      B1: [
        { type: 'case_error', level: 'B1', weight: 0.6 },
        { type: 'verb_agreement', level: 'B1', weight: 0.2 },
        { type: 'word_order', level: 'B1', weight: 0.2 }
      ],
      B2: [
        { type: 'case_error', level: 'B2', weight: 0.8 },
        { type: 'word_order', level: 'B2', weight: 0.2 }
      ]
    };
    
    return patterns[level] || patterns.B1;
  }

  /**
   * Provide fallback errors when corpus generation fails
   */
  private getFallbackErrors(level: string, count: number): EstonianError[] {
    const fallbacks: Record<string, EstonianError[]> = {
      A1: [
        {
          correctSentence: "Ma lähen kooli",
          errorSentence: "Ma läheb kooli",
          errorWord: "läheb",
          correctWord: "lähen",
          errorType: "verb_agreement",
          explanation: "Primera persona requiere 'lähen', no 'läheb'",
          level: "A1"
        },
        {
          correctSentence: "Ta elab Tallinnas",
          errorSentence: "Ta elab Tallinn", 
          errorWord: "Tallinn",
          correctWord: "Tallinnas",
          errorType: "case_error",
          explanation: "Vivir en un lugar requiere caso inessivo: Tallinnas",
          level: "A1"
        }
      ],
      A2: [
        {
          correctSentence: "Me läheme kooli",
          errorSentence: "Me lähen kooli",
          errorWord: "lähen", 
          correctWord: "läheme",
          errorType: "verb_agreement",
          explanation: "Primera persona plural requiere 'läheme', no 'lähen'",
          level: "A2"
        }
      ]
    };
    
    const levelFallbacks = fallbacks[level] || fallbacks.A1;
    return levelFallbacks.slice(0, count);
  }
}

export const estonianErrorGenerator = new EstonianErrorGenerator();