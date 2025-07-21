import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ConjugationProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Conjugación Verbal Estonia";
  }

  getSystemPrompt(): string {
    const verbExamples = estonianCorpus.generateGrammarExamples("verb_conjugation", this.cefrLevel);
    
    return `CONJUGACIÓN ${this.cefrLevel} - Solo verbos, NO significados.

Sistema verbal:
- ma/sa/ta/me/te/nad: olen/oled/on/oleme/olete/on
- Condicional "meil oleks" (NO "me oleks")

Tiempos: ${this.getVerbSystemForLevel()}

Tipos:
- Conjugar: "Ma ___ (olema)" → olen
- Identificar tiempo: "läks" → pasado
- Completar por contexto
- Transformar tiempos

JSON: {
  "questions": [{
    "question": "oración con verbo",
    "translation": "instrucción",
    "type": "multiple_choice",
    "options": [4 formas],
    "correctAnswer": "forma correcta",
    "explanation": "tiempo/persona"
  }]
}`;
  }

  getUserPrompt(): string {
    return `5 ejercicios conjugación ${this.cefrLevel}. Verbos: olema, minema, tulema. JSON completo.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 550, // Balanced for complete JSON
      temperature: 0.1,
      topP: 0.6,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0
    };
  }

  private getVerbSystemForLevel(): string {
    const systems = {
      A1: `PRESENTE SIMPLE (olevik):
- ma olen (soy/estoy), sa oled, ta on, me oleme, te olete, nad on
- ma lähen (voy), sa lähed, ta läheb, me läheme, te lähete, nad lähevad
IMPERATIVO básico: Mine! (¡Ve!), Tule! (¡Ven!)`,
      
      A2: `A1 + PASADO SIMPLE (lihtminevik):
- ma olin (fui/estuve), sa olid, ta oli, me olime, te olite, nad olid
- ma läksin (fui), sa läksid, ta läks, me läksime, te läksite, nad läksid
PRESENTE PERFECTO introducción: olen käinud (he ido)`,
      
      B1: `A2 + PRESENTE PERFECTO (täisminevik):
- ma olen teinud (he hecho), sa oled teinud, ta on teinud...
- Auxiliar olema + -nud participio
CONDICIONAL presente: ma teeksin (yo haría)`,
      
      B2: `B1 + PLUSCUAMPERFECTO y CONDICIONAL PASADO:
- ma olin teinud (había hecho)
- ma oleksin teinud (habría hecho)
IMPERATIVO todas las formas, POTENCIAL (-vat)`,
      
      C1: `TODOS los tiempos y modos + QUOTATIVO (-vat):
- Formas complejas: olnuvat (dizque había sido)
- Matices aspectuales y modales
- Verbos compuestos y fraseológicos`,
      
      C2: "Dominio completo con formas dialectales y literarias"
    };
    return systems[this.cefrLevel as keyof typeof systems] || systems.B1;
  }

  private getPriorityTenses(): string {
    const priority = {
      A1: "Presente todas las personas, imperativo básico (Mine!, Tule!)",
      A2: "Presente vs Pasado simple, introducción al perfecto",
      B1: "Perfecto vs Simple, condicional presente",
      B2: "Todos los tiempos pasados, condicional completo",
      C1: "Quotativo, potencial, matices aspectuales",
      C2: "Formas literarias, dialectales, registro formal/informal"
    };
    return priority[this.cefrLevel as keyof typeof priority] || priority.B1;
  }
}