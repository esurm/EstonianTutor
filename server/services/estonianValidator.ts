import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ValidationResult {
  valid: boolean;
  error_count: number;
  errors: Array<{
    type: string;
    word?: string;
    words?: string[];
    position?: number;
    positions?: number[];
  }>;
  message: string;
}

interface QuizValidationResult {
  total_questions: number;
  valid_questions: number;
  invalid_questions: number;
  all_valid: boolean;
  details: Array<{
    question: string;
    sentence: string;
    error_word: string;
    validation: ValidationResult;
  }>;
}

export class EstonianValidator {
  private pythonPath: string;

  constructor() {
    this.pythonPath = path.join(__dirname, 'estonian-validator.py');
  }

  /**
   * Validates that a sentence contains exactly one grammatical error
   */
  async validateSingleError(sentence: string, errorWord: string, explanation: string): Promise<ValidationResult> {
    const options = {
      mode: 'json' as const,
      pythonPath: 'python3',
      scriptPath: path.dirname(this.pythonPath),
      args: []
    };

    const input = {
      action: 'validate_single',
      sentence,
      error_word: errorWord,
      explanation
    };

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(path.basename(this.pythonPath), options);
      
      pyshell.send(input);
      
      pyshell.on('message', (message) => {
        resolve(message as ValidationResult);
      });
      
      pyshell.on('error', (err) => {
        console.error('Python validation error:', err);
        reject(err);
      });
      
      pyshell.end((err) => {
        if (err) reject(err);
      });
    });
  }

  /**
   * Validates all questions in an error detection quiz
   */
  async validateErrorDetectionQuiz(quizData: any): Promise<QuizValidationResult> {
    const options = {
      mode: 'json' as const,
      pythonPath: 'python3',
      scriptPath: path.dirname(this.pythonPath),
      args: []
    };

    const input = {
      action: 'validate_quiz',
      quiz: quizData
    };

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(path.basename(this.pythonPath), options);
      
      pyshell.send(input);
      
      pyshell.on('message', (message) => {
        resolve(message as QuizValidationResult);
      });
      
      pyshell.on('error', (err) => {
        console.error('Python quiz validation error:', err);
        reject(err);
      });
      
      pyshell.end((err) => {
        if (err) reject(err);
      });
    });
  }

  /**
   * Suggests a fix for an error in a sentence
   */
  async suggestFix(sentence: string, errorWord: string): Promise<string | null> {
    const options = {
      mode: 'json' as const,
      pythonPath: 'python3',
      scriptPath: path.dirname(this.pythonPath),
      args: []
    };

    const input = {
      action: 'suggest_fix',
      sentence,
      error_word: errorWord
    };

    return new Promise((resolve, reject) => {
      const pyshell = new PythonShell(path.basename(this.pythonPath), options);
      
      pyshell.send(input);
      
      pyshell.on('message', (message: any) => {
        resolve(message.suggested_fix);
      });
      
      pyshell.on('error', (err) => {
        console.error('Python suggest fix error:', err);
        reject(err);
      });
      
      pyshell.end((err) => {
        if (err) reject(err);
      });
    });
  }
}

export const estonianValidator = new EstonianValidator();