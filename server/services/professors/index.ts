/**
 * Central export point for all AI professors
 */

import { BaseProfessor, type Professor, type ProfessorSettings, type QuizQuestion, type QuizResponse } from './base-professor';
import { VocabularyProfessor } from './vocabulary-professor';
import { GrammarProfessor } from './grammar-professor';
import { ConjugationProfessor } from './conjugation-professor';
import { SentenceReorderingProfessor } from './sentence-reordering-professor';
import { ErrorDetectionProfessor } from './error-detection-professor';
import { ChatProfessor } from './chat-professor';

export { BaseProfessor, type Professor, type ProfessorSettings, type QuizQuestion, type QuizResponse } from './base-professor';
export { VocabularyProfessor } from './vocabulary-professor';
export { GrammarProfessor } from './grammar-professor';
export { ConjugationProfessor } from './conjugation-professor';
export { SentenceReorderingProfessor } from './sentence-reordering-professor';
export { ErrorDetectionProfessor } from './error-detection-professor';
export { ChatProfessor } from './chat-professor';

/**
 * Factory function to create the appropriate professor
 */
export function createProfessor(type: string, cefrLevel: string, corpusKnowledge: string, mode?: string) {
  switch (type) {
    case 'vocabulary':
      return new VocabularyProfessor(cefrLevel, corpusKnowledge);
    case 'grammar':
      return new GrammarProfessor(cefrLevel, corpusKnowledge);
    case 'conjugation':
      return new ConjugationProfessor(cefrLevel, corpusKnowledge);
    case 'sentence_reordering':
      return new SentenceReorderingProfessor(cefrLevel, corpusKnowledge);
    case 'error_detection':
      return new ErrorDetectionProfessor(cefrLevel, corpusKnowledge);
    case 'chat':
      return new ChatProfessor(cefrLevel, corpusKnowledge, mode || 'general_conversation');
    default:
      return new VocabularyProfessor(cefrLevel, corpusKnowledge);
  }
}