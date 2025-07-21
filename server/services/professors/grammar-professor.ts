import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class GrammarProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Gramática Estonia";
  }

  getSystemPrompt(): string {
    return `You are an Estonian GRAMMAR expert for ${this.cefrLevel} level.

Create 5 grammar questions focusing on Estonian case system. NO vocabulary meanings.

CASES FOR ${this.cefrLevel} LEVEL: ${this.getCasesForLevel()}

QUESTION TYPES:
1. Fill in the blank with correct case form
2. Choose correct case form from options
3. Identify which case is used in a word
4. Transform word to required case

PRIORITY FOCUS: ${this.getPriorityCases()}

REQUIRED JSON FORMAT:
{
  "questions": [
    {
      "question": "Completa la oración: 'Ma lähen ___ täna' (kool)",
      "type": "multiple_choice", 
      "options": ["kool", "kooli", "koolis", "koolist"],
      "correctAnswer": "kooli",
      "explanation": "Dirección hacia un lugar usa el caso ilativo (-i)",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

Generate exactly 5 questions using simple, common Estonian words (kass, maja, laps, kool, auto, etc.).`;
  }

  getUserPrompt(): string {
    return `Generate exactly 5 Estonian grammar questions for ${this.cefrLevel} level.

Each question must have:
- Focus on Estonian case system (not vocabulary)
- Use simple, common words (kass, maja, laps, kool, auto)
- 4 multiple choice options showing different case forms
- One correct answer with proper case
- Brief explanation of which case is used and why

Return complete JSON with all 5 questions.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 800, // Increased for complete 5-question JSON
      temperature: 0.25, // Slightly more creative while staying accurate
      topP: 0.8,
      frequencyPenalty: 0.1, // Some variety in word selection
      presencePenalty: 0.1 // Encourage different case types
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

  private getPriorityCases(): string {
    const priority = {
      A1: "Nominativo vs Partitivo (ma joon vett), Genitivo para posesión",
      A2: "Casos locales internos (kooli/koolis/koolist)",
      B1: "Casos locales externos (lauale/laual/laualt), objeto total vs parcial",
      B2: "Translativo para cambios, casos con preposiciones",
      C1: "Todos los casos, énfasis en comitativo/abesivo/esivo",
      C2: "Sutilezas y excepciones de todos los casos"
    };
    return priority[this.cefrLevel as keyof typeof priority] || priority.B1;
  }
}