import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ConjugationProfessor extends BaseProfessor {
  getName(): string {
    return "Dr. Ants Rebane - Professor of Estonian Verb Conjugation";
  }

  // Simple hardcoded verb conjugation patterns
  private getConjugationPatterns() {
    const patterns = {
      A1: [
        {
          verb: "minema",
          template: "Ma ___ kooli",
          options: ["lähen", "läheb", "läheme", "minna"],
          correct: "lähen", 
          explanation: "1ª persona singular de 'minema': Ma lähen (yo voy)"
        },
        {
          verb: "olema", 
          template: "Ta ___ kodus",
          options: ["olen", "oled", "on", "oleme"],
          correct: "on",
          explanation: "3ª persona singular de 'olema': Ta on (él/ella está)"
        },
        {
          verb: "elama",
          template: "Me ___ Tallinnas", 
          options: ["elan", "elad", "elab", "elame"],
          correct: "elame",
          explanation: "1ª persona plural de 'elama': Me elame (nosotros vivimos)"
        },
        {
          verb: "töötama",
          template: "Sa ___ palju",
          options: ["töötan", "töötad", "töötab", "töötame"],
          correct: "töötad",
          explanation: "2ª persona singular de 'töötama': Sa töötad (tú trabajas)"
        },
        {
          verb: "sööma",
          template: "Nad ___ hommikul",
          options: ["söön", "sööd", "sööb", "söövad"],
          correct: "söövad",
          explanation: "3ª persona plural de 'sööma': Nad söövad (ellos comen)"
        }
      ],
      A2: [
        {
          verb: "minema",
          template: "Eile ma ___ kinno",
          options: ["lähen", "läksin", "läks", "läheb"],
          correct: "läksin",
          explanation: "Pasado 1ª persona de 'minema': Ma läksin (yo fui)"
        },
        {
          verb: "ostma",
          template: "Ta ___ eile raamatu",
          options: ["ostab", "ostis", "ostsid", "ostsin"],
          correct: "ostis", 
          explanation: "Pasado 3ª persona de 'ostma': Ta ostis (él/ella compró)"
        },
        {
          verb: "tulema",
          template: "Me ___ homme tagasi",
          options: ["tulen", "tuled", "tuleb", "tuleme"],
          correct: "tuleme",
          explanation: "Futuro/presente de 'tulema': Me tuleme (vendremos)"
        },
        {
          verb: "näeme",
          template: "Nad ___ filme sageli",
          options: ["näen", "näed", "näeb", "näevad"],
          correct: "näevad",
          explanation: "Presente 3ª plural de 'nägema': Nad näevad (ellos ven)"
        },
        {
          verb: "tegema",
          template: "Sa ___ head tööd",
          options: ["teen", "teed", "teeb", "teeme"],
          correct: "teed",
          explanation: "Presente 2ª persona de 'tegema': Sa teed (tú haces)"
        }
      ],
      B1: [
        {
          verb: "minema",
          template: "Ma ___ homme kindlasti",
          options: ["lähen", "läksin", "läheksin", "oleksin läinud"],
          correct: "lähen",
          explanation: "Futuro simple con presente: Ma lähen homme (iré mañana)"
        },
        {
          verb: "teadma",
          template: "Kas sa ___ vastust?",
          options: ["tean", "tead", "teab", "teame"],
          correct: "tead",
          explanation: "Pregunta directa 2ª persona: Sa tead (tú sabes)"
        },
        {
          verb: "saama",
          template: "Me ___ seda teha",
          options: ["saan", "saad", "saab", "saame"],
          correct: "saame",
          explanation: "Capacidad/permiso 1ª plural: Me saame (podemos)"
        },
        {
          verb: "pidama",
          template: "Nad ___ kodus olema",
          options: ["pean", "pead", "peab", "peavad"],
          correct: "peavad",
          explanation: "Obligación 3ª plural: Nad peavad (deben)"
        },
        {
          verb: "tahtma",
          template: "Ta ___ osta uue auto",
          options: ["tahan", "tahad", "tahab", "tahame"],
          correct: "tahab",
          explanation: "Deseo 3ª persona: Ta tahab (él/ella quiere)"
        }
      ],
      B2: [
        {
          verb: "võima",
          template: "Ma ___ homme tulla",
          options: ["võin", "võid", "võib", "võime"],
          correct: "võin",
          explanation: "Posibilidad 1ª persona: Ma võin (puedo/podría)"
        },
        {
          verb: "pidama",
          template: "Sa ___ olnud seal eile",
          options: ["pead", "pidid", "peaksid", "oleksid pidanud"],
          correct: "pidid",
          explanation: "Obligación pasada: Sa pidid (tenías que/debías)"
        },
        {
          verb: "oskama",
          template: "Kas ta ___ eesti keelt?",
          options: ["oskab", "oskas", "oskaks", "oleks oskanud"],
          correct: "oskab",
          explanation: "Habilidad presente: Ta oskab (sabe hacer)"
        },
        {
          verb: "tahama",
          template: "Me ___ minna, aga ei saanud",
          options: ["tahame", "tahtsime", "tahaksime", "oleksime tahtnud"],
          correct: "tahtsime",
          explanation: "Deseo pasado frustrado: Me tahtsime (queríamos)"
        },
        {
          verb: "olema",
          template: "Nad ___ seal, kui me tulime",
          options: ["on", "olid", "oleksid", "olnud"],
          correct: "olid",
          explanation: "Estado pasado simultáneo: Nad olid (estaban)"
        }
      ],
      C1: [
        {
          verb: "olema",
          template: "Kui ma ___ rikas, ostaksin selle",
          options: ["olen", "oleksin", "olin", "olnud"],
          correct: "oleksin",
          explanation: "Condicional hipotético: oleksin (fuera/sería)"
        },
        {
          verb: "tegema",
          template: "Kas sa ___ juba seda varem?",
          options: ["teed", "tegid", "oleksid teinud", "oled teinud"],
          correct: "oled teinud",
          explanation: "Perfecto con relevancia presente: oled teinud (has hecho)"
        },
        {
          verb: "minema",
          template: "Ta ___ juba läinud, kui me saabusime",
          options: ["läks", "oli läinud", "oleks läinud", "läheb"],
          correct: "oli läinud",
          explanation: "Pluscuamperfecto: oli läinud (había ido)"
        },
        {
          verb: "saama",
          template: "Me ___ seda teha, kui meil oleks aega",
          options: ["saame", "saaksime", "saanud", "oleksime saanud"],
          correct: "saaksime",
          explanation: "Condicional de capacidad: saaksime (podríamos)"
        },
        {
          verb: "nägema",
          template: "Nad väidavad end ___ seda varem",
          options: ["näevad", "nägid", "näinud", "olevat näinud"],
          correct: "olevat näinud",
          explanation: "Evidencial indirecto: olevat näinud (haber visto según dicen)"
        }
      ]
    };
    
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.A1;
  }

  getSystemPrompt(): string {
    const patterns = this.getConjugationPatterns();
    const examples = patterns.slice(0, 2).map(p => 
      `"${p.template}" (${p.verb}) → "${p.correct}" - ${p.explanation}`
    ).join('\n');
    
    return `Eres un profesor de conjugación estonia.

PATRONES PARA NIVEL ${this.cefrLevel}:
${examples}

Crea exactamente 5 preguntas siguiendo este formato JSON:
{
  "questions": [
    {
      "question": "¿Cuál es la forma correcta? 'Ma ___ kooli' (minema)",
      "type": "multiple_choice", 
      "options": ["lähen", "läheb", "läheme", "minna"],
      "correctAnswer": "lähen",
      "explanation": "1ª persona singular de 'minema': Ma lähen (yo voy)",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

IMPORTANTE: Devuelve SOLO JSON válido, sin texto adicional.`;
  }

  getUserPrompt(): string {
    return `Dr. Rebane, please create 5 Estonian verb conjugation questions for my ${this.cefrLevel} level students.

Focus on the verb forms that Spanish speakers at this level need to master. Use common Estonian verbs they already know so they can focus on learning the conjugation patterns.

Could you create exercises that reinforce the essential verb patterns for ${this.cefrLevel} level?`;
  }

  // Generate questions directly from hardcoded patterns (bypasses AI)
  generateDirectQuestions(): any {
    const patterns = this.getConjugationPatterns();
    const selectedPatterns = patterns.slice(0, 5); // Take first 5 patterns
    
    const questions = selectedPatterns.map((pattern, index) => ({
      question: `¿Cuál es la forma correcta? '${pattern.template}' (${pattern.verb})`,
      type: "multiple_choice",
      options: [...pattern.options],
      correctAnswer: pattern.correct,
      explanation: pattern.explanation,
      cefrLevel: this.cefrLevel
    }));

    return { questions };
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