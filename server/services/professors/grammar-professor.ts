import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class GrammarProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Gramática Estonia";
  }

  // Simple hardcoded grammar patterns for each level
  private getGrammarPatterns() {
    const patterns = {
      A1: [
        {
          template: "Ma lähen ___ täna",
          word: "kool",
          options: ["kool", "kooli", "koolis", "koolist"],
          correct: "kooli",
          explanation: "Para ir HACIA un lugar se usa ilativo (-sse): kooli (a la escuela)"
        },
        {
          template: "Ta on ___ praegu",
          word: "kool",
          options: ["kool", "kooli", "koolis", "koolist"],
          correct: "koolis",
          explanation: "Para estar EN un lugar se usa inessivo (-s): koolis (en la escuela)"
        },
        {
          template: "Ma söön ___",
          word: "leib",
          options: ["leib", "leiba", "leibi", "leivad"],
          correct: "leiba",
          explanation: "Objeto directo parcial en partitivo (-t/-d): leiba (pan)"
        },
        {
          template: "See on ___ auto",
          word: "mina",
          options: ["mina", "minu", "minul", "mind"],
          correct: "minu",
          explanation: "Posesión en genitivo: minu (mi) auto"
        },
        {
          template: "___ on kaks koera",
          word: "mina",
          options: ["Mina", "Minu", "Minul", "Mind"],
          correct: "Minul",
          explanation: "Posesión con 'on' usa adesivo: Minul (yo tengo)"
        }
      ],
      A2: [
        {
          template: "Ma tulen ___ tagasi",
          word: "kool",
          options: ["kool", "kooli", "koolis", "koolist"],
          correct: "koolist",
          explanation: "Para venir DESDE un lugar se usa elativo (-st): koolist (de la escuela)"
        },
        {
          template: "Ma räägin ___",
          word: "sõber",
          options: ["sõber", "sõbra", "sõbrad", "sõpradega"],
          correct: "sõbra",
          explanation: "Hablar CON alguien usa comitativo: sõbraga (con amigo)"
        },
        {
          template: "Ta elab ___ Eestis",
          word: "juba",
          options: ["juba", "veel", "alati", "kunagi"],
          correct: "juba",
          explanation: "Para duración ya cumplida: juba (ya) dos años"
        },
        {
          template: "Me sõidame ___",
          word: "buss",
          options: ["buss", "bussi", "bussiga", "bussis"],
          correct: "bussiga",
          explanation: "Medio de transporte en comitativo (-ga): bussiga"
        },
        {
          template: "Ma ostan ___ poest",
          word: "piim",
          options: ["piim", "piima", "piimad", "piimaga"],
          correct: "piima",
          explanation: "Objeto directo líquido en partitivo: piima (leche)"
        }
      ],
      B1: [
        {
          template: "Ma aitan ___ kodutööga",
          word: "sina",
          options: ["sina", "sinu", "sind", "sinul"],
          correct: "sind",
          explanation: "Ayudar a alguien usa partitivo: sind (a ti)"
        },
        {
          template: "Raamat on ___ laual",
          word: "suur",
          options: ["suur", "suure", "suurt", "suurel"],
          correct: "suurel",
          explanation: "Adjetivo concuerda con sustantivo en caso: suurel laual"
        },
        {
          template: "Ma mõtlen ___ võimalusele",
          word: "hea",
          options: ["hea", "hää", "head", "heale"],
          correct: "heale",
          explanation: "Adjetivo en alativo concuerda: heale võimalusele"
        },
        {
          template: "Ta teeb tööd ___ hommikust",
          word: "vara",
          options: ["vara", "varase", "varast", "varasest"],
          correct: "varasest",
          explanation: "Tiempo desde: varasest hommikust (desde temprano)"
        },
        {
          template: "Me räägime ___ projektist",
          word: "uus",
          options: ["uus", "uue", "uut", "uuest"],
          correct: "uuest",
          explanation: "Hablar SOBRE algo usa elativo: uuest projektist"
        }
      ],
      B2: [
        {
          template: "Ma pean ___ oma plaane",
          word: "muutma",
          options: ["muutma", "muuta", "muutmine", "muutnud"],
          correct: "muutma",
          explanation: "Después de 'pean' se usa infinitivo en -ma: muutma"
        },
        {
          template: "Ta soovib ___ Eestisse",
          word: "kolima",
          options: ["kolima", "kolida", "kolimine", "kolinud"],
          correct: "kolida",
          explanation: "Después de 'soovib' se usa infinitivo en -da: kolida"
        },
        {
          template: "Ma olen ___ sellest raamatust",
          word: "lugenud",
          options: ["lugenud", "lugema", "lugeda", "lugemine"],
          correct: "lugenud",
          explanation: "Perfecto con 'olen' usa participio: lugenud"
        },
        {
          template: "Kas sa oled kunagi ___ Rootsis?",
          word: "käinud",
          options: ["käinud", "käima", "käia", "käimine"],
          correct: "käinud",
          explanation: "Experiencia pasada usa participio: käinud"
        },
        {
          template: "Ma ei ole veel ___ oma tööd",
          word: "lõpetanud",
          options: ["lõpetanud", "lõpetama", "lõpetada", "lõpetamine"],
          correct: "lõpetanud",
          explanation: "Negativo perfecto usa participio: lõpetanud"
        }
      ],
      C1: [
        {
          template: "Arutelu ___ teemadel oli huvitav",
          word: "keerukas",
          options: ["keerukas", "keerukate", "keerulist", "keerukatel"],
          correct: "keerukatel",
          explanation: "Adjetivo plural adesivo: keerukatel teemadel"
        },
        {
          template: "Eksperdid ___ et situatsioon paraneb",
          word: "väida",
          options: ["väidavad", "väitsid", "väidaksid", "väitnud"],
          correct: "väidavad",
          explanation: "Presente para hechos actuales: väidavad"
        },
        {
          template: "Kui see ___ tõsi, muutuks kõik",
          word: "olema",
          options: ["on", "oli", "oleks", "olnud"],
          correct: "oleks",
          explanation: "Condicional hipotético: oleks (fuera/sería)"
        },
        {
          template: "Uurimine ___ et tulemused on usaldusväärsed",
          word: "näitama",
          options: ["näitab", "näitas", "näitaks", "näidanud"],
          correct: "näitas",
          explanation: "Pasado para resultados específicos: näitas"
        },
        {
          template: "Professor selgitas ___ miks see oluline on",
          word: "detail",
          options: ["detailselt", "detailse", "detaili", "detailides"],
          correct: "detailselt",
          explanation: "Adverbio de manera: detailselt (detalladamente)"
        }
      ]
    };
    
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.A1;
  }

  getSystemPrompt(): string {
    const patterns = this.getGrammarPatterns();
    const examples = patterns.slice(0, 2).map(p => 
      `"${p.template}" (${p.word}) → "${p.correct}" - ${p.explanation}`
    ).join('\n');
    
    return `Eres un profesor de gramática estonia.

PATRONES PARA NIVEL ${this.cefrLevel}:
${examples}

Crea exactamente 5 preguntas siguiendo este formato JSON:
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

IMPORTANTE: Devuelve SOLO JSON válido, sin texto adicional.`;
  }

  getUserPrompt(): string {
    return `Dr. Kruus, I need 5 Estonian grammar questions for my ${this.cefrLevel} level class.

Please focus on the Estonian case system - the grammar points that are most important for Spanish speakers at this level to master. Use simple vocabulary they already know so they can focus on learning the grammar patterns.

Your clear explanations in Spanish really help my students understand WHY Estonian uses different case forms.

Could you create questions that teach the essential case usage for ${this.cefrLevel} level?`;
  }

  // Generate questions directly from hardcoded patterns (bypasses AI)
  generateDirectQuestions(): any {
    const patterns = this.getGrammarPatterns();
    const selectedPatterns = patterns.slice(0, 5); // Take first 5 patterns
    
    const questions = selectedPatterns.map((pattern, index) => ({
      question: `Completa: '${pattern.template}' (${pattern.word})`,
      type: "multiple_choice",
      options: [...pattern.options],
      correctAnswer: pattern.correct,
      explanation: pattern.explanation,
      cefrLevel: this.cefrLevel
    }));

    return { questions };
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