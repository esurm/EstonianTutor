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
          explanation: "Con 'ma' (yo) se usa 'lähen', no 'läheb'",
          translation: "Yo va a la escuela"
        },
        {
          sentence: "Ta lähen tööle", 
          error: "lähen",
          correct: "läheb",
          explanation: "Con 'ta' (él/ella) se usa 'läheb', no 'lähen'",
          translation: "Él/ella voy al trabajo"
        },
        {
          sentence: "Ma söön leiv",
          error: "leiv", 
          correct: "leiba",
          explanation: "Después de 'söön' se usa partitivo: 'leiba'",
          translation: "Yo como pan"
        },
        {
          sentence: "See on mina raamat",
          error: "mina",
          correct: "minu", 
          explanation: "Para posesión se usa 'minu' (mi), no 'mina' (yo)",
          translation: "Este es yo libro"
        },
        {
          sentence: "Ma elan Tallinn",
          error: "Tallinn",
          correct: "Tallinnas",
          explanation: "Para 'vivir en' se usa inessivo: 'Tallinnas'",
          translation: "Yo vivo Tallin"
        }
      ],
      A2: [
        {
          sentence: "Eile ma lähen kinno",
          error: "lähen", 
          correct: "läksin",
          explanation: "Con 'eile' (ayer) se usa pasado: 'läksin'",
          translation: "Ayer yo voy al cine"
        },
        {
          sentence: "Ma panen raamatu laud",
          error: "laud",
          correct: "lauale", 
          explanation: "Para 'poner sobre' se usa alativo: 'lauale'",
          translation: "Pongo el libro (sobre la) mesa"
        },
        {
          sentence: "Mul on kaks koer",
          error: "koer",
          correct: "koera",
          explanation: "Después de números se usa partitivo: 'koera'",
          translation: "Tengo dos perro"
        },
        {
          sentence: "Ta sõidab homme Soome",
          error: "Soome",
          correct: "Soomesse",
          explanation: "Para movimiento hacia país: 'Soomesse'",
          translation: "Él/ella viaja mañana (a) Finlandia"
        },
        {
          sentence: "Me ei ole kodus eile",
          error: "ole",
          correct: "olnud",
          explanation: "Negativo de pasado necesita participio: 'olnud'",
          translation: "Nosotros no estar en casa ayer"
        }
      ],
      B1: [
        {
          sentence: "Ma tahan osta uue auto",
          error: "uue",
          correct: "uus",
          explanation: "Después de 'osta' se usa nominativo: 'uus auto'",
          translation: "Quiero comprar nuevo carro"
        },
        {
          sentence: "Ta ootab bussis",
          error: "bussis", 
          correct: "bussi",
          explanation: "Para 'esperar algo' se usa partitivo: 'bussi'",
          translation: "Él/ella espera en el autobús"
        },
        {
          sentence: "Ma tulen ilma raha",
          error: "raha",
          correct: "rahata",
          explanation: "Con 'ilma' se usa abesivo: 'rahata'",
          translation: "Vengo sin dinero"
        },
        {
          sentence: "Professor õpetab tudengeid eesti keel",
          error: "eesti keel",
          correct: "eesti keelt", 
          explanation: "Objeto directo en partitivo: 'eesti keelt'",
          translation: "Profesor enseña a estudiantes idioma estonio"
        },
        {
          sentence: "Ma lähen tööle jalg",
          error: "jalg",
          correct: "jalgsi",
          explanation: "Para 'a pie' se usa adverbio: 'jalgsi'",
          translation: "Voy al trabajo pie"
        }
      ],
      B2: [
        {
          sentence: "Ma arvan, et ta olevat kodus",
          error: "olevat",
          correct: "on",
          explanation: "En discurso indirecto simple se usa indicativo: 'on'",
          translation: "Creo que él/ella estar en casa"
        },
        {
          sentence: "Kui ma oleks raha, ma ostaks auto",
          error: "oleks",
          correct: "oleksin",
          explanation: "En condicional 1ª persona: 'oleksin'",
          translation: "Si yo tuviera dinero, compraría carro"
        },
        {
          sentence: "Ta ütles, et ma tulen homme",
          error: "tulen",
          correct: "tulevat",
          explanation: "Discurso indirecto usa evidencial: 'tulevat'",
          translation: "Él/ella dijo que yo vengo mañana"
        },
        {
          sentence: "Ma pean minema tööle bus",
          error: "bus",
          correct: "bussiga",
          explanation: "Medio de transporte usa comitativo: 'bussiga'",
          translation: "Debo ir al trabajo autobús"
        },
        {
          sentence: "Ta ootas mind kell viie",
          error: "kell viie",
          correct: "kell viis",
          explanation: "Tiempo específico en nominativo: 'kell viis'",
          translation: "Él/ella me esperó a las cinco"
        }
      ],
      C1: [
        {
          sentence: "Ekspert arutab selle küsimus üle",
          error: "küsimus",
          correct: "küsimuse",
          explanation: "Objeto en genitivo: 'küsimuse üle'",
          translation: "Experto discute esta pregunta"
        },
        {
          sentence: "Professor selgitas teema huvitavalt",
          error: "teema",
          correct: "teemat", 
          explanation: "Objeto directo parcial en partitivo: 'teemat'",
          translation: "Profesor explicó tema interesantemente"
        },
        {
          sentence: "Õpilased arutasid tähtsat probleem",
          error: "probleem", 
          correct: "probleemi",
          explanation: "Objeto directo en partitivo: 'probleemi'",
          translation: "Estudiantes discutieron importante problema"
        },
        {
          sentence: "Uurimuse tulemus näitavad selget tendents",
          error: "tendents",
          correct: "tendentsi",
          explanation: "Objeto directo en partitivo: 'tendentsi'",
          translation: "Resultados del estudio muestran clara tendencia"
        },
        {
          sentence: "Konverents toimub järgmine nädal",
          error: "järgmine nädal",
          correct: "järgmisel nädalal",
          explanation: "Tiempo en adesivo: 'järgmisel nädalal'",
          translation: "Conferencia tiene lugar próximo semana"
        }
      ]
    };
    
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.A1;
  }

  getSystemPrompt(): string {
    const patterns = this.getErrorPatterns();
    const examples = patterns.slice(0, 2).map(p => 
      `"${p.sentence}" - Error: "${p.error}" - ${p.explanation} - Traducción: "${p.translation}"`
    ).join('\n');
    
    return `Eres un profesor de detección de errores en estonio. 

PATRONES PARA NIVEL ${this.cefrLevel}:
${examples}

Crea exactamente 5 preguntas siguiendo este formato JSON:
{
  "questions": [
    {
      "question": "¿Qué palabra está incorrecta en: 'Ma läheb kooli'?",
      "translation": "Yo va a la escuela",
      "type": "error_detection", 
      "options": ["Ma", "läheb", "kooli", "correcta"],
      "correctAnswer": "läheb",
      "explanation": "Con 'ma' (yo) se usa 'lähen', no 'läheb'",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS IMPORTANTES:
- Siempre incluye exactamente 4 opciones
- Incluye campo "translation" con traducción al español (con el error)
- La cuarta opción siempre es "correcta" o "sin error"
- Devuelve SOLO JSON válido, sin texto adicional`;
  }

  getUserPrompt(): string {
    return `Crea 5 preguntas de detección de errores para nivel ${this.cefrLevel}. Usa los patrones dados. Solo JSON.`;
  }

  // Generate questions directly from hardcoded patterns (bypasses AI)
  generateDirectQuestions(): any {
    const patterns = this.getErrorPatterns();
    const selectedPatterns = patterns.slice(0, 5); // Take first 5 patterns
    
    const questions = selectedPatterns.map((pattern, index) => {
      const words = pattern.sentence.split(' ');
      const options = words.filter(word => word !== pattern.error)
        .slice(0, 3)
        .concat(pattern.error)
        .sort(() => Math.random() - 0.5); // Shuffle options
      
      // Ensure we have exactly 4 options
      while (options.length < 4) {
        options.push('correcta');
      }
      
      return {
        question: `¿Qué palabra está incorrecta en: '${pattern.sentence}'?`,
        translation: pattern.translation,
        type: "error_detection",
        options: options.slice(0, 4),
        correctAnswer: pattern.error,
        explanation: pattern.explanation,
        cefrLevel: this.cefrLevel
      };
    });

    return { questions };
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