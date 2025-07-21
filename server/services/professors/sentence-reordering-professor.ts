import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class SentenceReorderingProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Estructura Estonia";
  }

  getSystemPrompt(): string {
    const corpusKnowledge = this.corpusKnowledge || "";
    const sentenceExamples = estonianCorpus.getSentencesByLevel(this.cefrLevel);
    
    return `You are an Estonian SENTENCE STRUCTURE expert for ${this.cefrLevel} level using authentic corpus data.

CORPUS-BASED SENTENCE EXAMPLES FOR ${this.cefrLevel}:
${sentenceExamples.slice(0, 5).map(s => `"${s.text}" (${s.domain})`).join(", ")}

VOCABULARY AVAILABLE FOR ${this.cefrLevel}:
${corpusKnowledge}

Create 5 sentence reordering exercises using authentic Estonian sentence patterns from the corpus.

CRITICAL RULES - USE CORPUS GUIDANCE:
1. Base sentences on corpus examples for ${this.cefrLevel} level
2. Use vocabulary from corpus appropriate for ${this.cefrLevel}  
3. Provide words in SCRAMBLED order in "options" array
4. Give ONE clear correct answer (Estonian sentence)
5. Include Spanish translation of the correct sentence
6. Brief explanation of the Estonian word order pattern used

ESTONIAN WORD ORDER PATTERNS FOR ${this.cefrLevel}:
${this.getWordOrderPatterns()}

SENTENCE ALTERNATIVES FROM CORPUS:
${this.getCorpusAlternatives()}

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "question": "Ordena las palabras para formar una oración correcta en estonio:",
      "type": "sentence_reordering",
      "options": ["kooli", "Ma", "lähen", "täna"],
      "correctAnswer": "Ma lähen täna kooli",
      "explanation": "Patrón estonio: sujeto + verbo + tiempo + lugar. 'Voy hoy a la escuela'",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate exactly 5 questions based on authentic Estonian corpus patterns.`;
  }

  private getCorpusAlternatives(): string {
    const sentenceExamples = estonianCorpus.getSentencesByLevel(this.cefrLevel);
    
    if (sentenceExamples.length > 0) {
      const alternatives = estonianCorpus.getAlternatives(sentenceExamples[0].text);
      return alternatives.length > 0 ? `Alternatives: ${alternatives.join(", ")}` : "No alternatives found in corpus";
    }
    
    return "Use basic Estonian sentence patterns";
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
      maxTokens: 900, // Increased for complete 5-question JSON
      temperature: 0.3, // Increased for more variation
      topP: 0.8,
      frequencyPenalty: 0.1, // Reduce repetition
      presencePenalty: 0.2 // More variety in sentence patterns
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