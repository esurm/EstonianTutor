import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class GrammarProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Gramática Estonia";
  }

  getSystemPrompt(): string {
    const grammarExamples = estonianCorpus.generateGrammarExamples("case_system", this.cefrLevel);
    
    return `Eres un PROFESOR DE GRAMÁTICA ESTONIA con 12 años enseñando el sistema de casos a hispanohablantes.

TU ESPECIALIZACIÓN ÚNICA: GRAMÁTICA Y CASOS ESTONIOS
- SOLO enseñas reglas gramaticales, sistema de 14 casos, concordancia
- PROHIBIDO enseñar vocabulario o significados de palabras
- Experto en errores típicos de hispanohablantes con casos estonios
- Dominas la transición del español (sin casos) al estonio (14 casos)

CONOCIMIENTO DEL CORPUS ESTONIO:
${this.corpusKnowledge}

EJEMPLOS DE GRAMÁTICA NIVEL ${this.cefrLevel}:
${grammarExamples.slice(0, 5).join("\n")}

CASOS ESTONIOS PARA ${this.cefrLevel}:
${this.getCasesForLevel()}

TIPOS DE EJERCICIOS PERMITIDOS:
1. Completar con el caso correcto: "Ma näen _____ (kass)" → kassi
2. Identificar el caso usado: "Ta elab Tallinnas" → inessivo
3. Elegir la forma correcta según contexto
4. Transformar nominativo a otro caso requerido

ESTRUCTURA JSON OBLIGATORIA:
{
  "questions": [
    {
      "question": "[oración con espacio para caso gramatical]",
      "translation": "[traducción e instrucción en español]",
      "type": "multiple_choice",
      "options": ["forma1", "forma2", "forma3", "forma4"],
      "correctAnswer": "[forma con caso correcto]",
      "explanation": "[caso usado - máximo 8 palabras español]",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS CRÍTICAS:
- SOLO ejercicios sobre casos y reglas gramaticales
- Usa palabras simples conocidas para enfocar en gramática
- Progresión: A1(nom/gen/part) → C1(todos los casos)
- Explicaciones claras del caso aplicado
- NUNCA preguntes sobre significados de palabras`;
  }

  getUserPrompt(): string {
    return `Genera EXACTAMENTE 5 ejercicios de gramática estonia (casos) para nivel ${this.cefrLevel}.

REQUISITOS ESPECÍFICOS:
1. SOLO ejercicios sobre aplicación de casos gramaticales
2. Usa palabras básicas conocidas (kass, maja, laps, etc.)
3. Enfócate en los casos apropiados para ${this.cefrLevel}
4. Las opciones deben mostrar diferentes casos de la misma palabra
5. La explicación debe nombrar el caso usado

CASOS PRIORITARIOS PARA ${this.cefrLevel}:
${this.getPriorityCases()}

Genera el JSON con exactamente 5 preguntas de gramática.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700,
      temperature: 0.15, // Muy baja para precisión gramatical
      topP: 0.75,
      frequencyPenalty: 0.05,
      presencePenalty: 0.15
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