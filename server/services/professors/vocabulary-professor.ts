import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class VocabularyProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Vocabulario Estonio";
  }

  // Simple hardcoded vocabulary for each level
  private getVocabularyWords() {
    const vocabulary = {
      A1: [
        { estonian: "kool", spanish: "escuela", distractors: ["casa", "trabajo", "tienda"] },
        { estonian: "maja", spanish: "casa", distractors: ["carro", "parque", "comida"] },
        { estonian: "auto", spanish: "carro", distractors: ["bicicleta", "casa", "libro"] },
        { estonian: "raamat", spanish: "libro", distractors: ["mesa", "silla", "ventana"] },
        { estonian: "söök", spanish: "comida", distractors: ["agua", "café", "leche"] },
        { estonian: "vesi", spanish: "agua", distractors: ["té", "jugo", "cerveza"] },
        { estonian: "kass", spanish: "gato", distractors: ["perro", "pájaro", "pez"] },
        { estonian: "koer", spanish: "perro", distractors: ["gato", "caballo", "ratón"] }
      ],
      A2: [
        { estonian: "töö", spanish: "trabajo", distractors: ["descanso", "vacaciones", "fiesta"] },
        { estonian: "buss", spanish: "autobús", distractors: ["tren", "avión", "barco"] },
        { estonian: "haigla", spanish: "hospital", distractors: ["escuela", "banco", "museo"] },
        { estonian: "pood", spanish: "tienda", distractors: ["restaurante", "hotel", "oficina"] },
        { estonian: "raha", spanish: "dinero", distractors: ["tiempo", "trabajo", "salud"] },
        { estonian: "aeg", spanish: "tiempo", distractors: ["espacio", "lugar", "momento"] },
        { estonian: "keek", spanish: "idioma", distractors: ["música", "arte", "deporte"] },
        { estonian: "riik", spanish: "país", distractors: ["ciudad", "pueblo", "región"] }
      ],
      B1: [
        { estonian: "haridus", spanish: "educación", distractors: ["experiencia", "conocimiento", "habilidad"] },
        { estonian: "kultuur", spanish: "cultura", distractors: ["tradición", "costumbre", "historia"] },
        { estonian: "loodust", spanish: "naturaleza", distractors: ["ciencia", "tecnología", "ambiente"] },
        { estonian: "turism", spanish: "turismo", distractors: ["negocio", "comercio", "industria"] },
        { estonian: "projekt", spanish: "proyecto", distractors: ["plan", "programa", "sistema"] },
        { estonian: "küsimus", spanish: "pregunta", distractors: ["respuesta", "problema", "solución"] },
        { estonian: "vastus", spanish: "respuesta", distractors: ["pregunta", "comentario", "opinión"] },
        { estonian: "põhjus", spanish: "razón", distractors: ["resultado", "efecto", "causa"] }
      ],
      B2: [
        { estonian: "majandus", spanish: "economía", distractors: ["política", "sociedad", "historia"] },
        { estonian: "ühiskond", spanish: "sociedad", distractors: ["comunidad", "grupo", "organización"] },
        { estonian: "valitsus", spanish: "gobierno", distractors: ["parlamento", "ministerio", "institución"] },
        { estonian: "arendus", spanish: "desarrollo", distractors: ["crecimiento", "progreso", "mejora"] },
        { estonian: "uurimine", spanish: "investigación", distractors: ["análisis", "estudio", "examen"] },
        { estonian: "tulem", spanish: "resultado", distractors: ["consecuencia", "efecto", "impacto"] },
        { estonian: "võimalus", spanish: "oportunidad", distractors: ["chance", "posibilidad", "opción"] },
        { estonian: "probleem", spanish: "problema", distractors: ["dificultad", "obstáculo", "desafío"] }
      ],
      C1: [
        { estonian: "filosoofia", spanish: "filosofía", distractors: ["psicología", "sociología", "antropología"] },
        { estonian: "analüüs", spanish: "análisis", distractors: ["síntesis", "evaluación", "crítica"] },
        { estonian: "kontseptsioon", spanish: "concepción", distractors: ["percepción", "interpretación", "comprensión"] },
        { estonian: "metodoloogia", spanish: "metodología", distractors: ["técnica", "procedimiento", "enfoque"] },
        { estonian: "tendents", spanish: "tendencia", distractors: ["dirección", "orientación", "inclinación"] },
        { estonian: "perspektiiv", spanish: "perspectiva", distractors: ["punto de vista", "enfoque", "visión"] },
        { estonian: "kriteerium", spanish: "criterio", distractors: ["estándar", "norma", "principio"] },
        { estonian: "paradigma", spanish: "paradigma", distractors: ["modelo", "marco", "esquema"] }
      ]
    };
    
    return vocabulary[this.cefrLevel as keyof typeof vocabulary] || vocabulary.A1;
  }

  getSystemPrompt(): string {
    const words = this.getVocabularyWords();
    const examples = words.slice(0, 3).map(w => 
      `"${w.estonian}" = "${w.spanish}" (opciones: ${[w.spanish, ...w.distractors].join(', ')})`
    ).join('\n');
    
    return `Eres un profesor de vocabulario estonio.

VOCABULARIO PARA NIVEL ${this.cefrLevel}:
${examples}

Crea exactamente 5 preguntas siguiendo este formato JSON:
{
  "questions": [
    {
      "question": "¿Qué significa 'kool'?",
      "type": "multiple_choice",
      "options": ["escuela", "casa", "trabajo", "tienda"],
      "correctAnswer": "escuela", 
      "explanation": "'Kool' significa escuela en estonio. Palabra muy básica y útil.",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

IMPORTANTE: Devuelve SOLO JSON válido, sin texto adicional.`;
  }

  getUserPrompt(): string {
    return `Professor Tamm, I need 5 vocabulary questions for my ${this.cefrLevel} level Estonian students.

Please create questions that help them learn the most important Estonian words for their level. Mix different question types to keep it engaging - some translation, some definitions, maybe a word grouping question.

Make sure the vocabulary is appropriate for ${this.cefrLevel} level and will be genuinely useful for Spanish speakers learning Estonian.

The students really benefit from your clear Spanish explanations!`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 700, // Adequate for 5 vocabulary questions with explanations
      temperature: 0.2, // Consistent but some variety in question types
      topP: 0.8, // Good balance of focus and creativity
      frequencyPenalty: 0.1, // Encourage vocabulary variety
      presencePenalty: 0.1 // Encourage different question types
    };
  }

  private getCEFRVocabularyGuidance(): string {
    const guidance = {
      A1: `SURVIVAL VOCABULARY - Essential words for basic communication:
- Word count: 500-700 most frequent Estonian words
- Focus: Personal information, daily routines, immediate needs
- Complexity: Single concept words, no compounds`,
      
      A2: `PRACTICAL VOCABULARY - Words for everyday situations:
- Word count: 1000-1500 words including A1
- Focus: Work, study, travel, social interactions  
- Complexity: Simple compounds, basic abstract concepts`,
      
      B1: `EXPANDED VOCABULARY - Words for complex communication:
- Word count: 2000-3000 words including A1-A2
- Focus: Opinions, experiences, goals, detailed descriptions
- Complexity: Advanced compounds, abstract concepts`,
      
      B2: `SOPHISTICATED VOCABULARY - Academic and professional words:
- Word count: 4000-5000 words including A1-B1
- Focus: Academic topics, professional contexts, analysis
- Complexity: Technical terms, nuanced meanings`,
      
      C1: `ADVANCED VOCABULARY - Near-native word knowledge:
- Word count: 6000+ words including A1-B2
- Focus: Specialized fields, cultural references, subtle distinctions  
- Complexity: Idiomatic expressions, stylistic variations`
    };
    
    return guidance[this.cefrLevel as keyof typeof guidance] || guidance.A1;
  }

  private getThemesForLevel(): string {
    const themes = {
      A1: "familia, colores, números, comida básica, casa, animales domésticos",
      A2: "profesiones, transporte, clima, ropa, actividades diarias, ciudad", 
      B1: "educación, trabajo, salud, viajes, tecnología básica, medio ambiente",
      B2: "cultura, medios, política básica, economía personal, relaciones sociales",
      C1: "conceptos abstractos, filosofía, ciencia, arte, negocios internacionales"
    };
    return themes[this.cefrLevel as keyof typeof themes] || themes.B1;
  }
}