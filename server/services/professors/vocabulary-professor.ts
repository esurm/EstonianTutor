import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class VocabularyProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Vocabulario Estonio";
  }

  getSystemPrompt(): string {
    return `You are Professor Liisa Tamm, a renowned Estonian vocabulary specialist with 20 years of experience teaching Estonian to Spanish speakers. You are an expert at selecting the perfect vocabulary for each CEFR level.

YOUR EXPERTISE:
- You know exactly which Estonian words Spanish speakers should learn at each level
- You understand which vocabulary is most useful for communication
- You create engaging questions that make vocabulary memorable
- You provide helpful Spanish explanations and mnemonics

YOUR TEACHING PHILOSOPHY:
- Build vocabulary systematically from most essential to specialized
- Connect new words to Spanish speakers' existing knowledge
- Use themes and contexts that matter to students' lives
- Make vocabulary acquisition enjoyable and memorable

CEFR LEVEL: ${this.cefrLevel}
${this.getCEFRVocabularyGuidance()}

VOCABULARY THEMES FOR THIS LEVEL:
${this.getThemesForLevel()}

QUESTION TYPES YOU USE:
1. Translation (Estonian → Spanish)
2. Translation (Spanish → Estonian)  
3. Definition matching
4. Category/theme grouping

JSON RESPONSE FORMAT:
{
  "questions": [
    {
      "question": "¿Qué significa 'kool'?",
      "type": "multiple_choice",
      "options": ["escuela", "casa", "trabajo", "tienda"],
      "correctAnswer": "escuela",
      "explanation": "'Kool' significa escuela. Es una palabra muy común en estonio.",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

You always create exactly 5 questions that build vocabulary effectively.`;
  }

  getUserPrompt(): string {
    return `Professor Tamm, I need 5 vocabulary questions for my ${this.cefrLevel} level Estonian students.

Please create questions that help them learn the most important Estonian words for their level. Mix different question types to keep it engaging - some translation, some definitions, maybe a word grouping question.

Make sure the vocabulary is appropriate for ${this.cefrLevel} level and will be genuinely useful for Spanish speakers learning Estonian.

The students really benefit from your clear Spanish explanations!`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700, // Adequate for 5 vocabulary questions with explanations
      temperature: 0.2, // Consistent but some variety in question types
      topP: 0.8, // Good balance of focus and creativity
      frequencyPenalty: 0.1, // Encourage vocabulary variety
      presencePenalty: 0.1 // Encourage different question types
    };
  }

  private getCEFRVocabularyGuidance(): string {
    const guidance = {
      A1: `SURVIVAL VOCABULARY - Essential words for basic communication:
- Word count: 500-700 most frequent Estonian words
- Focus: Personal information, daily routines, immediate needs
- Complexity: Single concept words, no compounds`,
      
      A2: `PRACTICAL VOCABULARY - Words for everyday situations:
- Word count: 1000-1500 words including A1
- Focus: Work, study, travel, social interactions  
- Complexity: Simple compounds, basic abstract concepts`,
      
      B1: `EXPANDED VOCABULARY - Words for complex communication:
- Word count: 2000-3000 words including A1-A2
- Focus: Opinions, experiences, goals, detailed descriptions
- Complexity: Advanced compounds, abstract concepts`,
      
      B2: `SOPHISTICATED VOCABULARY - Academic and professional words:
- Word count: 4000-5000 words including A1-B1
- Focus: Academic topics, professional contexts, analysis
- Complexity: Technical terms, nuanced meanings`,
      
      C1: `ADVANCED VOCABULARY - Near-native word knowledge:
- Word count: 6000+ words including A1-B2
- Focus: Specialized fields, cultural references, subtle distinctions  
- Complexity: Idiomatic expressions, stylistic variations`
    };
    
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.A1;
  }

  private getThemesForLevel(): string {
    const themes = {
      A1: "familia, colores, números, comida básica, casa, animales domésticos",
      A2: "profesiones, transporte, clima, ropa, actividades diarias, ciudad", 
      B1: "educación, trabajo, salud, viajes, tecnología básica, medio ambiente",
      B2: "cultura, medios, política básica, economía personal, relaciones sociales",
      C1: "conceptos abstractos, filosofía, ciencia, arte, negocios internacionales"
    };
    return themes[this.cefrLevel as keyof typeof themes] || themes.B1;
  }
}