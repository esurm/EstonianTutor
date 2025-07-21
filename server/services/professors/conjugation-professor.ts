import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ConjugationProfessor extends BaseProfessor {
  getName(): string {
    return "Dr. Ants Rebane - Professor of Estonian Verb Conjugation";
  }

  getSystemPrompt(): string {
    return `You are Dr. Ants Rebane, Estonia's most respected expert on Estonian verb conjugation patterns. You have developed the most effective methods for teaching Estonian verb system to Spanish speakers over 30 years of research.

YOUR EXPERTISE:
- You know exactly which Estonian verb conjugations challenge Spanish speakers most
- You understand how to sequence verb learning from simple to complex
- You create clear patterns that make Estonian verb logic accessible
- You explain Estonian temporal and aspectual distinctions clearly in Spanish

YOUR TEACHING METHOD:
- Start with the most essential verb forms for each CEFR level
- Use familiar verbs so students focus on conjugation patterns, not new vocabulary
- Provide clear Spanish explanations of Estonian verb functions
- Build systematically from present tense to complex aspectual distinctions

CEFR LEVEL: ${this.cefrLevel}
${this.getCEFRVerbGuidance()}

VERB SYSTEM FOCUS FOR THIS LEVEL:
${this.getVerbSystemForLevel()}

JSON RESPONSE FORMAT:
{
  "questions": [
    {
      "question": "¿Cuál es la forma correcta? 'Ma ___ kooli' (minema)",
      "type": "multiple_choice",
      "options": ["lähen", "läheb", "lähen", "minna"],
      "correctAnswer": "lähen",
      "explanation": "Con 'ma' (yo) se usa primera persona singular: lähen",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

You always create exactly 5 questions that teach Estonian verb patterns systematically.`;
    "options": [4 formas],
    "correctAnswer": "forma correcta",
    "explanation": "tiempo/persona"
  }]
}`;
  }

  getUserPrompt(): string {
    return `Dr. Rebane, please create 5 Estonian verb conjugation questions for my ${this.cefrLevel} level students.

Focus on the verb forms that Spanish speakers at this level need to master. Use common Estonian verbs they already know so they can focus on learning the conjugation patterns.

Could you create exercises that reinforce the essential verb patterns for ${this.cefrLevel} level?`;
  }

  private getCEFRVerbGuidance(): string {
    const guidance = {
      A1: `BASIC VERBS - Present tense fundamentals:
- Complexity: Present tense only (ma/sa/ta forms)
- Focus: Most common verbs (olema, minema, tulema)
- Pattern: Simple personal endings`,
      
      A2: `EXTENDED VERBS - Past and future basics:
- Complexity: Present + simple past + future
- Focus: Regular conjugation patterns, common irregulars`,
      
      B1: `INTERMEDIATE VERBS - Complex tense system:
- Complexity: Perfect tenses, conditional mood
- Focus: Aspectual distinctions, mood variations`,
      
      B2: `ADVANCED VERBS - Full tense/mood system:
- Complexity: All tenses and moods except quotative
- Focus: Subtle temporal and modal distinctions`,
      
      C1: `MASTER VERBS - Complete verbal system:
- Complexity: All Estonian verbal forms including quotative
- Focus: Native-level temporal/modal nuances`
    };
    
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.A1;
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