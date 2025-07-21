import { BaseProfessor, ProfessorSettings } from './base-professor';
import { estonianCorpus } from '../estonianCorpus';

export class ErrorDetectionProfessor extends BaseProfessor {
  getName(): string {
    return "Professor de Detección de Errores";
  }

  getSystemPrompt(): string {
    return `Eres un PROFESOR DE DETECCIÓN DE ERRORES ESTONIOS especializado en errores de hispanohablantes.

TU ESPECIALIZACIÓN ÚNICA: CREAR ORACIONES CON ERRORES GRAMATICALES REALES
- Creas oraciones que contienen UN ERROR que hispanohablantes cometen típicamente
- Conoces profundamente qué errores son comunes en cada nivel CEFR
- NUNCA creas oraciones correctas para este ejercicio

CONOCIMIENTO DEL CORPUS ESTONIO:
${this.corpusKnowledge}

IMPORTANTE - ERRORES COMUNES POR NIVEL:

${this.cefrLevel} - ERRORES TÍPICOS:
${this.getCommonErrorsForLevel()}

ESTRUCTURA JSON OBLIGATORIA:
{
  "questions": [
    {
      "question": "¿Qué palabra está mal: '[oración CON ERROR]'?",
      "translation": "[traducción al español]",
      "type": "error_detection",
      "options": ["palabra1", "palabra2", "palabra3", "palabra4"],
      "correctAnswer": "[la palabra INCORRECTA]",
      "explanation": "[tipo error: caso/verbo/concordancia]",
      "cefrLevel": "${this.cefrLevel}"
    }
  ]
}

REGLAS FUNDAMENTALES:
1. CADA oración DEBE contener UN ERROR gramatical real
2. El error debe ser típico de hispanohablantes en nivel ${this.cefrLevel}
3. "options" = palabras de la oración en orden
4. "correctAnswer" = la palabra MAL escrita/conjugada
5. La explicación debe ser breve y clara sobre el error

EJEMPLOS DE ORACIONES CON ERRORES:
${this.getErrorExamples()}`;
  }

  getUserPrompt(): string {
    return `Genera EXACTAMENTE 5 oraciones estonias que contengan ERRORES GRAMATICALES típicos de hispanohablantes nivel ${this.cefrLevel}.

INSTRUCCIONES CRÍTICAS:
1. Cada oración DEBE tener UN ERROR gramatical real
2. Los errores deben ser los que hispanohablantes cometen frecuentemente
3. Usa vocabulario simple apropiado para ${this.cefrLevel}
4. En "correctAnswer" pon la palabra que está MAL
5. En "explanation" describe brevemente el tipo de error

TIPOS DE ERRORES PARA ${this.cefrLevel}:
${this.getErrorTypesForLevel()}

PROHIBIDO:
- NO crees oraciones gramaticalmente correctas
- NO inventes errores poco realistas
- NO uses vocabulario demasiado avanzado

Genera el JSON con exactamente 5 preguntas.`;
  }

  getSettings(): ProfessorSettings {
    return {
      maxTokens: 800,
      temperature: 0.2, // Algo de variación para diferentes tipos de errores
      topP: 0.7,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
    };
  }

  private getCommonErrorsForLevel(): string {
    const errors = {
      A1: `
1. CASO NOMINATIVO vs PARTITIVO:
   - ERROR: "Ma joon vesi" → CORRECTO: "Ma joon vett" (agua como objeto)
   - ERROR: "Ta sööb leiva" → CORRECTO: "Ta sööb leiba" (pan como objeto parcial)
   
2. CONCORDANCIA VERBAL:
   - ERROR: "Ma lähed" → CORRECTO: "Ma lähen" (1ra persona)
   - ERROR: "Ta lähen" → CORRECTO: "Ta läheb" (3ra persona)
   
3. CONFUSIÓN SINGULAR/PLURAL:
   - ERROR: "kaks koer" → CORRECTO: "kaks koera" (dos perros - partitivo singular)
   - ERROR: "palju raamat" → CORRECTO: "palju raamatuid" (muchos libros)`,
      
      A2: `
1. CASOS LOCATIVOS MAL APLICADOS:
   - ERROR: "Ma lähen kool" → CORRECTO: "Ma lähen kooli" (ilativo - hacia)
   - ERROR: "Ta elab Tallinn" → CORRECTO: "Ta elab Tallinnas" (inessivo - en)
   
2. GENITIVO INCORRECTO:
   - ERROR: "mina auto" → CORRECTO: "minu auto" (mi carro)
   - ERROR: "tema raamat" → CORRECTO: "tema raamat" (¡este es correcto!)
   
3. OBJETO TOTAL vs PARCIAL:
   - ERROR: "Ma ostan piima" → CORRECTO: "Ma ostan piima" (¡correcto si es algo de leche!)
   - ERROR: "Ma ostan piim" → CORRECTO: "Ma ostan piima" (compro leche en general)`,
      
      B1: `
1. CASOS EXTERNOS CONFUNDIDOS:
   - ERROR: "panen laual" → CORRECTO: "panen lauale" (alativo - hacia superficie)
   - ERROR: "võtan lauale" → CORRECTO: "võtan laualt" (ablativo - desde superficie)
   
2. PARTITIVO PLURAL:
   - ERROR: "Ma näen autod" → CORRECTO: "Ma näen autosid" (veo coches)
   - ERROR: "palju inimesed" → CORRECTO: "palju inimesi" (mucha gente)
   
3. TIEMPO VERBAL INCORRECTO:
   - ERROR: "Eile ma lähen" → CORRECTO: "Eile ma läksin" (ayer fui)
   - ERROR: "Homme ma läksin" → CORRECTO: "Homme ma lähen" (mañana voy)`,
      
      B2: `
1. CASOS GRAMATICALES COMPLEJOS:
   - ERROR: "ilma raha" → CORRECTO: "ilma rahata" (sin dinero - abesivo)
   - ERROR: "koos sõbraga" → CORRECTO: "koos sõbraga" (¡correcto! - comitativo)
   
2. CONDICIONAL MAL FORMADO:
   - ERROR: "ma oleks lähen" → CORRECTO: "ma oleksin läinud" (habría ido)
   - ERROR: "kui ta tuleb, ma ütlen" → CORRECTO: depende del contexto
   
3. CONCORDANCIA EN ORACIONES COMPLEJAS:
   - ERROR: "Ma tean, et ta tule" → CORRECTO: "Ma tean, et ta tuleb"`,
      
      C1: `
1. QUOTATIVO Y FORMAS INDIRECTAS:
   - ERROR: "Ta ütles, et tuleb" → puede ser correcto o incorrecto según contexto
   - ERROR: "Ta tulevat homme" → CORRECTO si es discurso reportado
   
2. MATICES DE CASO EN CONTEXTOS ESPECÍFICOS:
   - Errores sutiles en terminativo, esivo, translativo
   - Confusión entre casos en expresiones idiomáticas
   
3. ASPECTOS VERBALES COMPLEJOS:
   - Errores en verbos compuestos y fraseológicos`,
      
      C2: "Errores muy sutiles en registro, estilo y variaciones dialectales"
    };
    return errors[this.cefrLevel as keyof typeof errors] || errors.B1;
  }

  private getErrorExamples(): string {
    const examples = {
      A1: `
- "Ma söön leiv" (ERROR: debe ser "leiba" - partitivo)
- "Ta lähen poodi" (ERROR: debe ser "läheb" - 3ra persona)
- "Mul on kaks vend" (ERROR: debe ser "venda" - partitivo después de número)`,
      
      A2: `
- "Ma elan Tallinn" (ERROR: debe ser "Tallinnas" - inessivo)
- "See on mina raamat" (ERROR: debe ser "minu" - genitivo)
- "Ta tuleb kool" (ERROR: debe ser "koolist" - elativo)`,
      
      B1: `
- "Ma panen raamatu laud" (ERROR: debe ser "lauale" - alativo)
- "Eile ma lähen kinno" (ERROR: debe ser "läksin" - pasado)
- "Ma näen palju inimesed" (ERROR: debe ser "inimesi" - partitivo plural)`,
      
      B2: `
- "Ma tulen ilma raha" (ERROR: debe ser "rahata" - abesivo)
- "Kui ta tuleks, ma ütleks" (contexto puede requerir indicativo)
- "Ma oleks lähen, aga..." (ERROR: debe ser "oleksin läinud")`,
      
      C1: "Errores sutiles en casos complejos, aspectos verbales, registro",
      C2: "Errores extremadamente sutiles detectables solo por hablantes nativos"
    };
    return examples[this.cefrLevel as keyof typeof examples] || examples.B1;
  }

  private getErrorTypesForLevel(): string {
    const types = {
      A1: "caso (nom/part), concordancia verbal (ma/sa/ta), singular/plural básico",
      A2: "casos locales (kooli/koolis/koolist), genitivo posesivo, objeto parcial",
      B1: "casos externos (lauale/laual/laualt), tiempos verbales, partitivo plural",
      B2: "abesivo/comitativo, condicional, concordancia en subordinadas",
      C1: "quotativo, matices de casos, verbos compuestos",
      C2: "sutilezas estilísticas y dialectales"
    };
    return types[this.cefrLevel as keyof typeof types] || types.B1;
  }
}