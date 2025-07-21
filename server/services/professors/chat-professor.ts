import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ChatProfessor extends BaseProfessor {
  private mode: string;
  
  constructor(cefrLevel: string, corpusKnowledge: string, mode: string = 'general_conversation') {
    super(cefrLevel, corpusKnowledge);
    this.mode = mode;
  }

  getName(): string {
    const names = {
      'general_conversation': 'Tutor de Conversación Estonia',
      'pronunciation_practice': 'Especialista en Pronunciación Estonia',
      'grammar_exercises': 'Tutor de Gramática Conversacional',
      'dialogue_simulation': 'Simulador de Diálogos Estonios'
    };
    return names[this.mode as keyof typeof names] || 'Tutor de Estonio';
  }

  getSystemPrompt(): string {
    const vocabulary = estonianCorpus.getVocabularyByLevel(this.cefrLevel);
    const sentences = estonianCorpus.getSentencesByLevel(this.cefrLevel);
    
    const basePrompt = `Eres un tutor experto de idioma estonio especializado en enseñar a hablantes de español hondureño.

NIVEL DEL ESTUDIANTE: ${this.cefrLevel}
MODO DE CONVERSACIÓN: ${this.mode}

CONOCIMIENTO DEL CORPUS ESTONIO:
${this.corpusKnowledge}

VOCABULARIO APROPIADO PARA ${this.cefrLevel}:
${vocabulary.slice(0, 30).join(", ")}

ESTRUCTURAS DE EJEMPLO NIVEL ${this.cefrLevel}:
${sentences.slice(0, 5).map(s => `- ${s.text} (${s.translation})`).join("\n")}

PERSONALIDAD Y ESTILO:
- Paciente y alentador, celebra pequeños logros
- Adapta complejidad al nivel ${this.cefrLevel}
- Corrige errores de forma constructiva
- Incluye cultura estonia cuando es relevante
- Usa analogías con cultura hondureña cuando ayuda

REGLAS DE INTERACCIÓN:
1. SIEMPRE responde en estonio (excepto gramática/cultura en español)
2. Mantén respuestas apropiadas para nivel ${this.cefrLevel}
3. Corrige errores explicando en español brevemente
4. Sugiere mejoras sin abrumar al estudiante
5. Incluye pronunciación fonética cuando es útil`;

    const modeSpecific = this.getModeSpecificPrompt();
    
    return `${basePrompt}\n\n${modeSpecific}`;
  }

  getUserPrompt(): string {
    // For chat mode, the user prompt is the actual user message
    return ""; // This will be replaced with the actual user message in the chat flow
  }

  getSettings(): ProfessorSettings {
    const baseSettings = {
      'general_conversation': {
        maxTokens: 400,
        temperature: 0.7,
        topP: 0.9,
        frequencyPenalty: 0.3,
        presencePenalty: 0.3
      },
      'pronunciation_practice': {
        maxTokens: 250,
        temperature: 0.2,
        topP: 0.8,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0
      },
      'grammar_exercises': {
        maxTokens: 400,
        temperature: 0.3,
        topP: 0.85,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1
      },
      'dialogue_simulation': {
        maxTokens: 500,
        temperature: 0.8,
        topP: 0.95,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5
      }
    };
    
    return baseSettings[this.mode as keyof typeof baseSettings] || baseSettings['general_conversation'];
  }

  private getModeSpecificPrompt(): string {
    const prompts = {
      'general_conversation': `
MODO: CONVERSACIÓN GENERAL
- Mantén conversaciones naturales sobre temas cotidianos
- Introduce vocabulario nuevo gradualmente
- Haz preguntas para mantener la conversación activa
- Adapta temas a intereses del estudiante
- Corrige errores principales sin interrumpir el flujo

ESTRUCTURA DE RESPUESTA:
1. Responde en estonio a nivel ${this.cefrLevel}
2. Si hay errores graves, añade: "📝 Corrección: [explicación breve en español]"
3. Sugiere vocabulario útil cuando sea natural
4. Incluye pregunta de seguimiento para continuar`,

      'pronunciation_practice': `
MODO: PRÁCTICA DE PRONUNCIACIÓN
- Enfócate en sonidos difíciles para hispanohablantes
- Proporciona transcripción fonética simplificada
- Compara con sonidos del español cuando ayuda
- Practica vocales largas vs cortas (crucial en estonio)

ESTRUCTURA DE RESPUESTA:
1. Palabra/frase en estonio
2. Pronunciación: [transcripción fonética simple]
3. Consejo específico en español
4. Práctica con pares mínimos cuando sea útil

SONIDOS PROBLEMÁTICOS:
- õ (como 'e' cerrada)
- ü (como 'u' francesa)
- ö (como 'e' con labios de 'o')
- Consonantes dobles (kk, pp, tt)`,

      'grammar_exercises': `
MODO: EJERCICIOS GRAMATICALES CONVERSACIONALES
- Practica gramática en contexto comunicativo real
- Enfócate en estructuras problemáticas para hispanohablantes
- Usa ejemplos de la vida diaria
- Explica reglas cuando el estudiante lo necesita

ESTRUCTURA DE RESPUESTA:
1. Presenta situación que requiere estructura específica
2. Guía al estudiante a usar la forma correcta
3. Explica regla brevemente si hay error
4. Proporciona más ejemplos similares

GRAMÁTICA PRIORITARIA ${this.cefrLevel}:
${this.getGrammarFocusForLevel()}`,

      'dialogue_simulation': `
MODO: SIMULACIÓN DE DIÁLOGOS
- Simula situaciones reales en Estonia
- Adopta diferentes roles (vendedor, amigo, oficial, etc.)
- Mantén diálogos realistas y útiles
- Enseña frases prácticas y culturalmente apropiadas

ESTRUCTURA DE RESPUESTA:
1. Establece contexto: "🎭 [Situación]"
2. Responde en rol apropiado
3. Usa lenguaje natural para la situación
4. Incluye expresiones coloquiales de nivel ${this.cefrLevel}

SITUACIONES COMUNES:
- Tienda/mercado
- Restaurante/café  
- Transporte
- Servicios públicos
- Encuentros sociales`
    };
    
    return prompts[this.mode as keyof typeof prompts] || prompts['general_conversation'];
  }

  private getGrammarFocusForLevel(): string {
    const focus = {
      A1: "casos básicos (nom/gen/part), presente simple, números + sustantivos",
      A2: "casos locales, pasado simple, posesivos",
      B1: "todos los casos principales, perfecto, condicional básico",
      B2: "casos complejos, todos los tiempos, oraciones subordinadas",
      C1: "matices gramaticales, quotativo, registro formal/informal",
      C2: "sutilezas nativas, expresiones idiomáticas complejas"
    };
    return focus[this.cefrLevel as keyof typeof focus] || focus.B1;
  }
}