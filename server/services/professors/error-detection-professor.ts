import { BaseProfessor, ProfessorSettings } from './base-professor';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  // Simple hardcoded patterns that actually work
  private getErrorPatterns() {
    const patterns = {
      A1: [
        {
          sentence: "Ma läheb kooli",
          error: "läheb",
          correct: "lähen",
          explanation: "Con 'ma' (yo) se usa 'lähen', no 'läheb'"
        },
        {
          sentence: "Ta lähen tööle", 
          error: "lähen",
          correct: "läheb",
          explanation: "Con 'ta' (él/ella) se usa 'läheb', no 'lähen'"
        },
        {
          sentence: "Ma söön leiv",
          error: "leiv", 
          correct: "leiba",
          explanation: "Después de 'söön' se usa partitivo: 'leiba'"
        },
        {
          sentence: "See on mina raamat",
          error: "mina",
          correct: "minu", 
          explanation: "Para posesión se usa 'minu' (mi), no 'mina' (yo)"
        },
        {
          sentence: "Ma elan Tallinn",
          error: "Tallinn",
          correct: "Tallinnas",
          explanation: "Para 'vivir en' se usa inessivo: 'Tallinnas'"
        }
      ],
      A2: [
        {
          sentence: "Eile ma lähen kinno",
          error: "lähen", 
          correct: "läksin",
          explanation: "Con 'eile' (ayer) se usa pasado: 'läksin'"
        },
        {
          sentence: "Ma panen raamatu laud",
          error: "laud",
          correct: "lauale", 
          explanation: "Para 'poner sobre' se usa alativo: 'lauale'"
        },
        {
          sentence: "Mul on kaks koer",
          error: "koer",
          correct: "koera",
          explanation: "Después de números se usa partitivo: 'koera'"
        },
        {
          sentence: "Ta tuleb homme Eesti",
          error: "Eesti",
          correct: "Eestisse",
          explanation: "Para movimiento hacia país: 'Eestisse'"
        },
        {
          sentence: "Me ei ole kodus eile",
          error: "ole",
          correct: "olnud",
          explanation: "Negativo de pasado necesita participio: 'olnud'"
        }
      ],
      B1: [
        {
          sentence: "Ma tahan osta uue auto",
          error: "uue",
          correct: "uus",
          explanation: "Después de 'osta' se usa nominativo: 'uus auto'"
        },
        {
          sentence: "Ta ootab bussis",
          error: "bussis", 
          correct: "bussi",
          explanation: "Para 'esperar algo' se usa partitivo: 'bussi'"
        },
        {
          sentence: "Ma tulen ilma raha",
          error: "raha",
          correct: "rahata",
          explanation: "Con 'ilma' se usa abesivo: 'rahata'"
        },
        {
          sentence: "Professor õpetab tudengeid eesti keel",
          error: "eesti keel",
          correct: "eesti keelt", 
          explanation: "Objeto directo en partitivo: 'eesti keelt'"
        },
        {
          sentence: "Ma lähen tööle jalg",
          error: "jalg",
          correct: "jalgsi",
          explanation: "Para 'a pie' se usa adverbio: 'jalgsi'"
        }
      ],
      B2: [
        {
          sentence: "Ma arvan, et ta olevat kodus",
          error: "olevat",
          correct: "on",
          explanation: "En discurso indirecto simple se usa indicativo: 'on'"
        },
        {
          sentence: "Kui ma oleks raha, ma ostaks auto",
          error: "oleks",
          correct: "oleksin",
          explanation: "En condicional 1ª persona: 'oleksin'"
        },
        {
          sentence: "Ta küsis, kas ma tulen kaasa",
          error: "tulen",
          correct: "tulen",
          explanation: "Esta oración es correcta"
        },
        {
          sentence: "Raamat, mida ma lugesin, oli huvitav",
          error: "mida",
          correct: "mida",
          explanation: "Esta oración es correcta"
        },
        {
          sentence: "Ma ei tea, miks ta ei tule",
          error: "tule",
          correct: "tule",
          explanation: "Esta oración es correcta"
        }
      ],
      C1: [
        {
          sentence: "Ekspert arutab selle küsimus üle",
          error: "küsimus",
          correct: "küsimuse",
          explanation: "Objeto en genitivo: 'küsimuse üle'"
        },
        {
          sentence: "Professor selgitas teema huvitavalt",
          error: "teema",
          correct: "teemat", 
          explanation: "Objeto directo parcial en partitivo: 'teemat'"
        },
        {
          sentence: "Õpilased arutasid tähtsat probleem",
          error: "probleem", 
          correct: "probleemi",
          explanation: "Objeto directo en partitivo: 'probleemi'"
        },
        {
          sentence: "Uurimuse tulemus näitavad selget tendents",
          error: "tendents",
          correct: "tendentsi",
          explanation: "Objeto directo en partitivo: 'tendentsi'"
        },
        {
          sentence: "Konverents toimub järgmine nädal",
          error: "järgmine nädal",
          correct: "järgmisel nädalal",
          explanation: "Tiempo en adesivo: 'järgmisel nädalal'"
        }
      ]
    };
    
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.A1;
  }

  getSystemPrompt(): string {
    const patterns = this.getErrorPatterns();
    const examples = patterns.map((p, i) => 
      `"${p.sentence}" - Error: "${p.error}" - ${p.explanation}`
    ).join('\n');
    
    return `Eres un profesor de detección de errores en estonio. 

PATRONES PARA NIVEL ${this.cefrLevel}:
${examples}

Crea exactamente 5 preguntas siguiendo este formato JSON:
{
  "questions": [
    {
      "question": "¿Qué palabra está incorrecta en: 'Ma läheb kooli'?",
      "type": "error_detection", 
      "options": ["Ma", "läheb", "kooli"],
      "correctAnswer": "läheb",
      "explanation": "Con 'ma' (yo) se usa 'lähen', no 'läheb'",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

IMPORTANTE: Devuelve SOLO JSON válido, sin texto adicional.`;
  }

  getUserPrompt(): string {
    return `Crea 5 preguntas de detección de errores para nivel ${this.cefrLevel}. Usa los patrones dados. Solo JSON.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 600,
      temperature: 0.3,
      topP: 0.8, 
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    };
  }
}