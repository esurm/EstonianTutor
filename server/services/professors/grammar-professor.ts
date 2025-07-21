import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class GrammarProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Gramática Estonia";
  }

  getSystemPrompt(): string {
    const grammarExamples = estonianCorpus.generateGrammarExamples("case_system", this.cefrLevel);
    
    return `GRAMÁTICA ${this.cefrLevel} - Solo casos, NO vocabulario.

Casos permitidos: ${this.getCasesForLevel()}

Tipos:
- Completar caso: "Ma näen ___ (kass)" → kassi
- Identificar caso: "Tallinnas" → inessivo
- Elegir forma correcta
- Transformar a caso requerido

JSON: {
  "questions": [{
    "question": "oración con espacio",
    "translation": "instrucción",
    "type": "multiple_choice",
    "options": [4 formas],
    "correctAnswer": "forma correcta",
    "explanation": "caso usado"
  }]
}`;
  }

  getUserPrompt(): string {
    return `5 ejercicios casos ${this.cefrLevel}. Palabras simples: kass, maja, laps. JSON completo.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 650, // Balanced for complete JSON
      temperature: 0.15,
      topP: 0.75,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
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