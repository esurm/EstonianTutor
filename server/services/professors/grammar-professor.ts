import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class GrammarProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Gramática Estonia";
  }

  getSystemPrompt(): string {
    return `You are Dr. Mart Kruus, Estonia's leading expert on Estonian grammar pedagogy for foreign learners. You have spent 25 years perfecting methods to teach the Estonian case system to Spanish speakers.

YOUR EXPERTISE:
- You understand exactly which Estonian cases are hardest for Spanish speakers
- You create crystal-clear explanations of Estonian grammar patterns  
- You sequence grammar learning from simple to complex systematically
- You make Estonian case system accessible and logical

YOUR TEACHING METHOD:
- Focus on the most essential cases for each CEFR level
- Use familiar vocabulary so students focus on grammar, not new words
- Provide clear Spanish explanations of case functions
- Build complexity gradually to avoid overwhelming students

CEFR LEVEL: ${this.cefrLevel}
${this.getCEFRGrammarGuidance()}

CASE SYSTEM FOCUS FOR THIS LEVEL:
${this.getCasesForLevel()}

PRIORITY GRAMMAR POINTS:
${this.getPriorityCases()}

JSON RESPONSE FORMAT:
{
  "questions": [
    {
      "question": "Completa: 'Ma lähen ___ täna' (kool)",
      "type": "multiple_choice",
      "options": ["kool", "kooli", "koolis", "koolist"],
      "correctAnswer": "kooli", 
      "explanation": "Para ir HACIA un lugar se usa ilativo: kooli (a la escuela)",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

You always create exactly 5 questions that teach Estonian grammar systematically.`;
  }

  getUserPrompt(): string {
    return `Dr. Kruus, I need 5 Estonian grammar questions for my ${this.cefrLevel} level class.

Please focus on the Estonian case system - the grammar points that are most important for Spanish speakers at this level to master. Use simple vocabulary they already know so they can focus on learning the grammar patterns.

Your clear explanations in Spanish really help my students understand WHY Estonian uses different case forms.

Could you create questions that teach the essential case usage for ${this.cefrLevel} level?`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700, // Adequate for 5 grammar questions with explanations
      temperature: 0.15, // Very systematic for grammar patterns
      topP: 0.75, // Focused on established grammatical patterns
      frequencyPenalty: 0.05, // Minimal variety in core grammar words
      presencePenalty: 0.1 // Encourage different case types within level
    };
  }

  private getCasesForLevel(): string {
    const cases = {
      A1: `BÁSICOS: Nominativo (nimetav), Genitivo (omastav), Partitivo (osastav)
- Nominativo: sujeto, después de "on" → See on kass
- Genitivo: posesión → minu/tema kass
- Partitivo: objeto parcial, después de números → kolm kassi, ma näen kassi`,
      
      A2: `A1 + Ilativo (sisseütlev), Inessivo (seesütlev), Elativo (seestütlev)
- Ilativo: dirección hacia → lähen kooli (voy a la escuela)
- Inessivo: ubicación en → olen koolis (estoy en la escuela)
- Elativo: salir de → tulen koolist (vengo de la escuela)`,
      
      B1: `A2 + Alativo (alaleütlev), Adessivo (alalütlev), Ablativo (alaltütlev)
- Alativo: hacia superficie → panen lauale (pongo sobre la mesa)
- Adessivo: en superficie → on laual (está sobre la mesa)
- Ablativo: desde superficie → võtan laualt (tomo de la mesa)`,
      
      B2: `B1 + Translativo (saav), Terminativo (rajav), Esivo (olev)
- Translativo: transformación → saab õpetajaks (se convierte en profesor)
- Terminativo: hasta/límite → kuni õhtuni (hasta la noche)
- Esivo: estado temporal → lapsena (cuando era niño)`,
      
      C1: `TODOS los 14 casos + Comitativo (kaasaütlev), Abesivo (ilmaütlev), usos avanzados
- Comitativo: con/junto → sõbraga (con amigo)
- Abesivo: sin → ilma rahata (sin dinero)
- Matices y excepciones de todos los casos`,
      
      C2: "Dominio completo con sutilezas dialectales y poéticas"
    };
    return cases[this.cefrLevel as keyof typeof cases] || cases.B1;
  }

  private getCEFRGrammarGuidance(): string {
    const guidance = {
      A1: `FOUNDATIONAL GRAMMAR - Basic case distinctions:
- Complexity: 3 cases maximum (nominative, genitive, partitive)
- Focus: Subject vs object, basic possession
- Sentence length: 3-4 words maximum`,
      
      A2: `PRACTICAL GRAMMAR - Essential case functions:
- Complexity: 6 cases (+ illative, inessive, elative)  
- Focus: Location and movement, basic spatial relationships
- Sentence length: 4-5 words maximum`,
      
      B1: `EXPANDED GRAMMAR - Full locative system:
- Complexity: 9 cases (+ allative, adessive, ablative)
- Focus: Complete spatial case system, complex objects
- Sentence length: 5-6 words maximum`,
      
      B2: `SOPHISTICATED GRAMMAR - Advanced case usage:
- Complexity: 12 cases (+ translative, terminative, essive)
- Focus: State changes, temporal expressions, advanced functions
- Sentence length: 6-7 words maximum`,
      
      C1: `MASTERY GRAMMAR - Complete case system:
- Complexity: All 14 cases (+ comitative, abessive)
- Focus: Nuanced case selection, stylistic variations
- Sentence length: 7-8 words maximum`
    };
    
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.A1;
  }

  private getPriorityCases(): string {
    const priority = {
      A1: "Nominativo (sujeto), Partitivo (objeto), Genitivo (posesión básica)",
      A2: "Ilativo (kooli), Inesivo (koolis), Elativo (koolist) - movimiento y ubicación",
      B1: "Alativo (lauale), Adesivo (laual), Ablativo (laualt) - superficie y contacto",
      B2: "Translativo (muutmine), Terminativo (kuni), Esivo (ajutine olek)",
      C1: "Komitativo (kaaslus), Abesivo (ilma), matices avanzados de todos los casos"
    };
    return priority[this.cefrLevel as keyof typeof priority] || priority.A1;
  }
}