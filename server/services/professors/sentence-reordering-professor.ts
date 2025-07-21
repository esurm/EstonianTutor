import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class SentenceReorderingProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Estructura Estonia";
  }

  getSystemPrompt(): string {
    const corpusKnowledge = this.corpusKnowledge || "";
    const sentenceExamples = estonianCorpus.getSentencesByLevel(this.cefrLevel);
    
    return `You are an Estonian SENTENCE STRUCTURE expert for ${this.cefrLevel} level.

CRITICAL REQUIREMENTS FOR ${this.cefrLevel} LEVEL:
1. Create SIMPLE, UNAMBIGUOUS sentences with ONE clear correct word order
2. Avoid complex sentences that have multiple valid arrangements  
3. Use vocabulary appropriate for ${this.cefrLevel} level
4. Maximum sentence length: ${this.getMaxWordsForLevel()} words
5. Focus on CLEAR grammatical patterns, not ambiguous constructions

ESTONIAN WORD ORDER PATTERNS FOR ${this.cefrLevel}:
${this.getWordOrderPatterns()}

FORBIDDEN FOR REORDERING EXERCISES:
- Complex subordinate clauses with flexible word order
- Poetic inversions with multiple valid arrangements  
- Academic sentences with ambiguous adverb placement
- Sentences where multiple word orders are grammatically correct

REQUIRED SENTENCE STRUCTURE:
- Use common Estonian words: ma, sa, ta, me, te, nad, olen, lähen, söön, töötan, õpin
- Clear subject-verb-object patterns
- Unambiguous time/place expressions
- Single definitive correct answer

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "question": "Ordena las palabras para formar una oración correcta en estonio:",
      "type": "sentence_reordering", 
      "options": ["scrambled", "words", "in", "random", "order"],
      "correctAnswer": "Ma lähen täna kooli",
      "explanation": "Patrón estonio básico: sujeto + verbo + tiempo + lugar. Significa 'Voy hoy a la escuela'",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate exactly 5 questions with SIMPLE, CLEAR Estonian sentences that have only ONE correct word order.`;
  }

  private getMaxWordsForLevel(): number {
    const limits = {
      A1: 4, // "Ma lähen kooli"
      A2: 5, // "Ma lähen homme kooli"  
      B1: 6, // "Ma lähen homme tööle bussiga"
      B2: 7, // "Ma tahan minna homme tööle bussiga"
      C1: 8, // "Ma plaanin minna homme hommikul tööle bussiga"
      C2: 9  // But focus on clarity, not complexity
    };
    
    return limits[this.cefrLevel as keyof typeof limits] || 6;
  }

  getUserPrompt(): string {
    return `Generate exactly 5 Estonian sentence reordering questions for ${this.cefrLevel} level.

Each question must have:
- Scrambled Estonian words in "options" array  
- One correct Estonian sentence as "correctAnswer"
- Spanish explanation of the word order pattern
- Vocabulary appropriate for ${this.cefrLevel} level

Focus on common Estonian sentence patterns that Spanish speakers need to practice.

Return complete JSON with all 5 questions.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 800, // Adequate for simple sentences
      temperature: 0.2, // Lower for more consistent simple patterns
      topP: 0.7, // More focused generation
      frequencyPenalty: 0.15, // Reduce repetition
      presencePenalty: 0.1 // Focus on clarity over variety
    };
  }

  private getWordOrderPatterns(): string {
    const patterns = {
      A1: `BÁSICOS (3-4 palabras):
- SVO: Ma lähen kooli (Yo voy a la escuela)  
- Tiempo + SV: Täna ma söön (Hoy yo como)
- SV + Lugar: Ta elab kodus (Él/ella vive en casa)`,
      
      A2: `A1 + ADVERBIOS (4-5 palabras):
- TSVO: Homme ma lähen tööle (Mañana yo voy al trabajo)
- SVO + Lugar: Me õpime eesti keelt ülikoolis (Estudiamos estonio en la universidad)
- Pregunta: Kus sa töötad? (¿Dónde trabajas?)`,
      
      B1: `A2 + OBJETOS MÚLTIPLES (5-6 palabras):
- SVOO: Ma annan talle raamatu (Le doy el libro a él/ella)
- Énfasis frontal: Raamatu ma ostan homme (El libro lo compro mañana)
- Subordinadas: Ma arvan, et ta tuleb (Creo que él/ella viene)`,
      
      B2: `B1 + ESTRUCTURAS MODERADAS (6-7 palabras):
- Ma võin aidata sind selle tööga (Puedo ayudarte con este trabajo)
- Nad arutavad projekti tähtsa küsimuse üle (Discuten sobre una pregunta importante del proyecto)
- Simple academic: Professor selgitab uut grammatika reeglit (El profesor explica nueva regla gramatical)`,
      
      C1: `B2 + ESTRUCTURAS ACADÉMICAS SIMPLES (6-8 palabras):
- Eksperdid arutavad tähtsat majandusküsimust konverentsil (Los expertos discuten una pregunta económica importante en la conferencia)
- Uuringu tulemused näitavad huvitavat trendi (Los resultados del estudio muestran una tendencia interesante)
- AVOID: Complex poetic inversions that have multiple valid arrangements`,
      
      C2: "Focus on clear academic patterns, not ambiguous poetic structures"
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