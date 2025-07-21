import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ConjugationProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Conjugación Verbal Estonia";
  }

  getSystemPrompt(): string {
    const verbExamples = estonianCorpus.generateGrammarExamples("verb_conjugation", this.cefrLevel);
    
    return `Eres un PROFESOR DE CONJUGACIÓN VERBAL ESTONIA especializado en enseñar verbos a hispanohablantes.

TU ESPECIALIZACIÓN ÚNICA: CONJUGACIÓN VERBAL ESTONIA
- SOLO enseñas formas verbales, personas, tiempos
- PROHIBIDO enseñar vocabulario o casos nominales
- Experto en diferencias verbo español vs estonio
- Dominas todos los tiempos y modos verbales estonios

CONOCIMIENTO DEL CORPUS ESTONIO:
${this.corpusKnowledge}

EJEMPLOS DE CONJUGACIÓN NIVEL ${this.cefrLevel}:
${verbExamples.slice(0, 5).join("\n")}

SISTEMA VERBAL ESTONIO CORRECTO:
- ma olen, sa oled, ta on, me oleme, te olete, nad on
- CONDICIONAL: ma oleksin, sa oleksid, ta oleks, me oleksime, te oleksite, nad oleksid
- POTENCIAL CON "MEIL": meil oleks aega (tendríamos tiempo) - NUNCA "me oleks"
- USA "MEIL" (adesivo) PARA "TENER" CONDICIONAL

CONJUGACIONES PARA ${this.cefrLevel}:
${this.getVerbSystemForLevel()}

TIPOS DE EJERCICIOS PERMITIDOS:
1. Conjugar verbo con persona: "Ma _____ (olema)" → olen
2. Identificar tiempo verbal: "Ta läks" → pasado simple
3. Completar con forma correcta según contexto temporal
4. Transformar entre tiempos verbales

ESTRUCTURA JSON OBLIGATORIA:
{
  "questions": [
    {
      "question": "[oración con verbo a conjugar]",
      "translation": "[traducción e instrucción en español]",
      "type": "multiple_choice",
      "options": ["forma1", "forma2", "forma3", "forma4"],
      "correctAnswer": "[forma verbal correcta]",
      "explanation": "[tiempo/persona - máximo 8 palabras español]",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS CRÍTICAS:
- SOLO ejercicios sobre formas verbales
- Usa verbos frecuentes apropiados para el nivel
- Mezcla personas y tiempos según ${this.cefrLevel}
- Explicaciones claras: "presente 1ra persona", "pasado 3ra"
- NUNCA preguntes sobre significados de verbos`;
  }

  getUserPrompt(): string {
    return `Genera EXACTAMENTE 5 ejercicios de conjugación verbal estonia para nivel ${this.cefrLevel}.

REQUISITOS ESPECÍFICOS:
1. SOLO ejercicios sobre conjugación de verbos
2. Usa verbos comunes: olema, minema, tulema, tegema, saama, etc.
3. Incluye diferentes personas (ma, sa, ta, me, te, nad)
4. Enfócate en los tiempos apropiados para ${this.cefrLevel}
5. Las opciones deben ser diferentes conjugaciones del mismo verbo

TIEMPOS PRIORITARIOS PARA ${this.cefrLevel}:
${this.getPriorityTenses()}

Genera el JSON con exactamente 5 preguntas de conjugación.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700, // Increased for C1 level completeness
      temperature: 0.05,
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