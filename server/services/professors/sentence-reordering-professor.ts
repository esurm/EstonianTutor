import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class SentenceReorderingProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Estructura Estonia";
  }

  // Simple hardcoded sentence patterns that work
  private getSentencePatterns() {
    const patterns = {
      A1: [
        {
          sentence: "Ma lähen kooli",
          words: ["kooli", "Ma", "lähen"], 
          explanation: "Patrón estonio básico: Ma (yo) + lähen (voy) + kooli (a la escuela)"
        },
        {
          sentence: "Ta söób leiba",
          words: ["leiba", "söób", "Ta"],
          explanation: "Orden: Ta (él/ella) + söób (come) + leiba (pan)"
        },
        {
          sentence: "Me oleme kodus", 
          words: ["oleme", "kodus", "Me"],
          explanation: "Estructura: Me (nosotros) + oleme (estamos) + kodus (en casa)"
        },
        {
          sentence: "Nad töötavad",
          words: ["töötavad", "Nad"],
          explanation: "Simple: Nad (ellos) + töötavad (trabajan)"
        },
        {
          sentence: "Sa elad siin",
          words: ["siin", "elad", "Sa"], 
          explanation: "Orden: Sa (tú) + elad (vives) + siin (aquí)"
        }
      ],
      A2: [
        {
          sentence: "Ma lähen homme tööle",
          words: ["tööle", "homme", "lähen", "Ma"],
          explanation: "Orden estonio: Ma (yo) + lähen (voy) + homme (mañana) + tööle (al trabajo)"
        },
        {
          sentence: "Me läheme õhtul kinno",
          words: ["kinno", "õhtul", "läheme", "Me"],
          explanation: "Patrón: Me (nosotros) + läheme (vamos) + õhtul (por la tarde) + kinno (al cine)"
        },
        {
          sentence: "Ta ostis eile raamatu",
          words: ["raamatu", "eile", "ostis", "Ta"],
          explanation: "Pasado: Ta (él/ella) + ostis (compró) + eile (ayer) + raamatu (libro)"
        },
        {
          sentence: "Nad elavad Tallinnas",
          words: ["Tallinnas", "elavad", "Nad"],
          explanation: "Ubicación: Nad (ellos) + elavad (viven) + Tallinnas (en Tallin)"
        },
        {
          sentence: "Sa tuled peagi tagasi",
          words: ["tagasi", "peagi", "tuled", "Sa"],
          explanation: "Orden: Sa (tú) + tuled (vienes) + peagi (pronto) + tagasi (de vuelta)"
        }
      ],
      B1: [
        {
          sentence: "Ma tahan osta uue auto",
          words: ["auto", "tahan", "uue", "osta", "Ma"],
          explanation: "Objeto complejo: Ma + tahan (quiero) + osta (comprar) + uue auto (carro nuevo)"
        },
        {
          sentence: "Ta aitab mind tööga",
          words: ["tööga", "aitab", "Ta", "mind"],
          explanation: "Ayuda: Ta + aitab (ayuda) + mind (a mí) + tööga (con trabajo)"
        },
        {
          sentence: "Me räägime eesti keeles",
          words: ["keeles", "räägime", "Me", "eesti"],
          explanation: "Idioma: Me + räägime (hablamos) + eesti keeles (en estonio)"
        },
        {
          sentence: "Nad õpivad ülikoolis meditsiin",
          words: ["meditsiin", "õpivad", "ülikoolis", "Nad"],
          explanation: "Estudios: Nad + õpivad (estudian) + ülikoolis (en universidad) + meditsiin (medicina)"
        },
        {
          sentence: "Sa pead minema arsti juurde",
          words: ["juurde", "minema", "pead", "arsti", "Sa"],
          explanation: "Obligación: Sa + pead (debes) + minema (ir) + arsti juurde (al médico)"
        }
      ],
      B2: [
        {
          sentence: "Ma arvan et ta tuleb",
          words: ["tuleb", "ta", "et", "arvan", "Ma"],
          explanation: "Subordinada: Ma + arvan (creo) + et (que) + ta tuleb (él viene)"
        },
        {
          sentence: "Professor selgitas kuidas lahendada ülesanne",
          words: ["ülesanne", "lahendada", "kuidas", "selgitas", "Professor"],
          explanation: "Explicación: Professor + selgitas (explicó) + kuidas lahendada (cómo resolver) + ülesanne (tarea)"
        },
        {
          sentence: "Ta küsis kas ma tulen kaasa",
          words: ["kaasa", "tulen", "ma", "kas", "küsis", "Ta"],
          explanation: "Pregunta indirecta: Ta + küsis (preguntó) + kas (si) + ma tulen kaasa (vengo)"
        },
        {
          sentence: "Me arutasime mis toimub projektes",
          words: ["projektes", "toimub", "mis", "arutasime", "Me"],
          explanation: "Discusión: Me + arutasime (discutimos) + mis toimub (qué pasa) + projektes (en proyectos)"
        },
        {
          sentence: "Nad otsustasid millal alustada tööd",
          words: ["tööd", "alustada", "millal", "otsustasid", "Nad"],
          explanation: "Decisión: Nad + otsustasid (decidieron) + millal alustada (cuándo empezar) + tööd (trabajo)"
        }
      ],
      C1: [
        {
          sentence: "Eksperdid arutavad tähtsat majandusküsimust",
          words: ["majandusküsimust", "tähtsat", "arutavad", "Eksperdid"],
          explanation: "Académico: Eksperdid + arutavad (discuten) + tähtsat majandusküsimust (pregunta económica importante)"
        },
        {
          sentence: "Uurimise tulemused näitavad huvitavat tendentsi",
          words: ["tendentsi", "huvitavat", "näitavad", "tulemused", "Uurimise"],
          explanation: "Investigación: Uurimise tulemused (resultados del estudio) + näitavad (muestran) + huvitavat tendentsi (tendencia interesante)"
        },
        {
          sentence: "Konverentsil räägitakse uutest tehnoloogiatest",
          words: ["tehnoloogiatest", "uutest", "räägitakse", "Konverentsil"],
          explanation: "Formal: Konverentsil (en conferencia) + räägitakse (se habla) + uutest tehnoloogiatest (de nuevas tecnologías)"
        },
        {
          sentence: "Analüüs keskendub peamistele probleemidele",
          words: ["probleemidele", "peamistele", "keskendub", "Analüüs"],
          explanation: "Enfoque: Analüüs + keskendub (se enfoca) + peamistele probleemidele (en problemas principales)"
        },
        {
          sentence: "Spetsialistid väidavad et olukord paraneb",
          words: ["paraneb", "olukord", "et", "väidavad", "Spetsialistid"],
          explanation: "Opinión experta: Spetsialistid + väidavad (afirman) + et (que) + olukord paraneb (situación mejora)"
        }
      ]
    };
    
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.A1;
  }

  getSystemPrompt(): string {
    const patterns = this.getSentencePatterns();
    const examples = patterns.slice(0, 2).map(p => 
      `Correcto: "${p.sentence}" - Palabras: [${p.words.join(', ')}] - ${p.explanation}`
    ).join('\n');
    
    return `Eres un profesor de estructura de oraciones estonia.

PATRONES PARA NIVEL ${this.cefrLevel}:
${examples}

Crea exactamente 5 preguntas siguiendo este formato JSON:
{
  "questions": [
    {
      "question": "Ordena las palabras para formar una oración correcta en estonio:",
      "type": "sentence_reordering",
      "options": ["kooli", "Ma", "lähen"], 
      "correctAnswer": "Ma lähen kooli",
      "explanation": "Patrón estonio básico: Ma (yo) + lähen (voy) + kooli (a la escuela)",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS IMPORTANTES:
- correctAnswer NO debe tener punto final
- options debe contener exactamente las palabras de la oración
- explanation debe explicar el orden de palabras estonio
- Devuelve SOLO JSON válido, sin texto adicional`;
  }

  private getCEFRSyntaxGuidance(): string {
    const guidance = {
      A1: `BASIC SYNTAX - Simple, fixed patterns:
- Sentence type: Subject + Verb + Object/Complement
- Complexity: No flexibility, one correct order only
- Focus: Establish basic Estonian sentence feeling`,
      
      A2: `ELEMENTARY SYNTAX - Adding time/place:
- Sentence type: Subject + Verb + Time/Place + Object
- Complexity: Limited flexibility, clear preferences  
- Focus: Natural positioning of time and location expressions`,
      
      B1: `INTERMEDIATE SYNTAX - More natural patterns:
- Sentence type: Multiple complements, basic subordination
- Complexity: Some flexibility in adverb placement
- Focus: Fluent, natural-sounding Estonian sentences`,
      
      B2: `ADVANCED SYNTAX - Complex but clear patterns:
- Sentence type: Complex sentences with clear hierarchy
- Complexity: Stylistic variations, but still unambiguous
- Focus: Academic and professional sentence structures`,
      
      C1: `SOPHISTICATED SYNTAX - Near-native patterns:
- Sentence type: Complex, nuanced constructions
- Complexity: Multiple valid arrangements (but avoid in exercises)
- Focus: Stylistic mastery and register awareness`
    };
    
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.A1;
  }

  private getMaxWordsForLevel(): number {
    const limits = {
      A1: 4, // "Ma lähen kooli"
      A2: 5, // "Ma lähen homme kooli"  
      B1: 6, // "Ma lähen homme tööle bussiga"
      B2: 7, // "Ma tahan minna homme tööle"
      C1: 8  // "Ma tahan minna homme hommikul tööle"
    };
    
    return limits[this.cefrLevel as keyof typeof limits] || 6;
  }

  private getSentenceFocus(): string {
    const focus = {
      A1: "Basic word order patterns with common verbs",
      A2: "Time and place expressions in natural positions", 
      B1: "Multiple complements and basic conjunctions",
      B2: "Complex verb phrases and subordination",
      C1: "Advanced constructions and stylistic variations"
    };
    
    return focus[this.cefrLevel as keyof typeof focus] || focus.A1;
  }

  getUserPrompt(): string {
    return `Professor Saar, I need 5 sentence reordering exercises for my ${this.cefrLevel} level Estonian class.

Please create exercises that teach the most important Estonian word order patterns for this level. Make sure each sentence has only ONE clearly correct arrangement - avoid sentences that could be ordered multiple ways.

My Spanish-speaking students really benefit from your clear explanations of WHY Estonian uses certain word orders.

Could you focus on sentences that use vocabulary they already know at ${this.cefrLevel} level?`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 650, // Adequate for 5 sentence reordering questions
      temperature: 0.15, // Very consistent sentence patterns
      topP: 0.7, // Focused on clear, unambiguous patterns
      frequencyPenalty: 0.1, // Some variety in sentence content
      presencePenalty: 0.05 // Focus on clarity over creativity
    };
  }

  private getWordOrderPatterns(): string {
    const patterns = {
      A1: `BÁSICOS (3-4 palabras):
- SVO: Ma lähen kooli (Yo voy a la escuela)  
- Tiempo + SV: Täna ma söön (Hoy yo como)
- SV + Lugar: Ta elab kodus (Él/ella vive en casa)`,
      
      A2: `A1 + ADVERBIOS (4-5 palabras):
- TSVO: Homme ma lähen tööle (Mañana yo voy al trabajo)
- SVO + Lugar: Me õpime eesti keelt ülikoolis (Estudiamos estonio en la universidad)
- Pregunta: Kus sa töötad? (¿Dónde trabajas?)`,
      
      B1: `A2 + OBJETOS MÚLTIPLES (5-6 palabras):
- SVOO: Ma annan talle raamatu (Le doy el libro a él/ella)
- Énfasis frontal: Raamatu ma ostan homme (El libro lo compro mañana)
- Subordinadas: Ma arvan, et ta tuleb (Creo que él/ella viene)`,
      
      B2: `B1 + ESTRUCTURAS MODERADAS (6-7 palabras):
- Ma võin aidata sind selle tööga (Puedo ayudarte con este trabajo)
- Nad arutavad projekti tähtsa küsimuse üle (Discuten sobre una pregunta importante del proyecto)
- Simple academic: Professor selgitab uut grammatika reeglit (El profesor explica nueva regla gramatical)`,
      
      C1: `B2 + ESTRUCTURAS ACADÉMICAS SIMPLES (6-8 palabras):
- Eksperdid arutavad tähtsat majandusküsimust konverentsil (Los expertos discuten una pregunta económica importante en la conferencia)
- Uuringu tulemused näitavad huvitavat trendi (Los resultados del estudio muestran una tendencia interesante)
- AVOID: Complex poetic inversions that have multiple valid arrangements`,
      
      C2: "Focus on clear academic patterns, not ambiguous poetic structures"
    };
    return patterns[this.cefrLevel as keyof typeof patterns] || patterns.B1;
  }

  private getSentenceLengthGuidance(): string {
    const guidance = {
      A1: "3-4 palabras: sujeto + verbo + complemento simple",
      A2: "4-5 palabras: añade tiempo o lugar",
      B1: "5-6 palabras: incluye objeto indirecto o adverbio",
      B2: "6-8 palabras: oraciones con múltiples complementos",
      C1: "7-10 palabras: estructuras subordinadas complejas",
      C2: "Sin límite: oraciones sofisticadas"
    };
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.B1;
  }
}