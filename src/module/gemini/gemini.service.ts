import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface QuestionGenerationRequest {
  topic: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
  questionTypes: ('multiple_choice' | 'true_false' | 'fill_blank')[];
  language?: string;
}

export interface GeneratedQuestion {
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey ? apiKey : "");
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    try {
      const prompt = this.buildQuestionPrompt(request);
      const result = await this.model.generateContent(prompt);

      const response = await result.response;
      const text = response.text();

      return this.parseQuestionsFromResponse(text);
    } catch (error) {
      this.logger.error('Error generating questions with Gemini:', error);
      throw new Error('Failed to generate questions');
    }
  }

  async generateLearningPath(topic: string, userLevel: string): Promise<string[]> {
    const prompt = `
    Como experto en educación y diseño curricular, crea una ruta de aprendizaje progresiva para el tema: "${topic}".
    
    Nivel del usuario: ${userLevel}
    
    Proporciona una lista de 5-8 subtemas ordenados desde lo más básico hasta lo más avanzado.
    Cada subtema debe ser específico y alcanzable.
    
    Formato de respuesta:
    1. [Subtema básico]
    2. [Siguiente nivel]
    ...
    
    Responde únicamente con la lista numerada, sin explicaciones adicionales.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.split('\n').filter(line => line.trim().match(/^\d+\./)).map(line =>
        line.replace(/^\d+\.\s*/, '').trim()
      );
    } catch (error) {
      this.logger.error('Error generating learning path:', error);
      throw new Error('Failed to generate learning path');
    }
  }

  async generateModuleDescription(moduleName: string, topics: string[]): Promise<string> {
    const prompt = `
    Crea una descripción atractiva y motivadora para un módulo educativo llamado "${moduleName}".
    
    El módulo incluye estos temas: ${topics.join(', ')}
    
    La descripción debe:
    - Ser emocionante y gamificada (estilo YACHAY)
    - Explicar qué aprenderá el usuario
    - Usar emojis relevantes
    - Tener entre 100-150 palabras
    - Motivar al usuario a comenzar
    
    Responde únicamente con la descripción, sin títulos adicionales.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      this.logger.error('Error generating module description:', error);
      throw new Error('Failed to generate module description');
    }
  }

  private buildQuestionPrompt(request: QuestionGenerationRequest): string {
    const questionTypesText = request.questionTypes.map(type => {
      switch (type) {
        case 'multiple_choice': return 'opción múltiple (4 opciones)';
        case 'true_false': return 'verdadero/falso';
        case 'fill_blank': return 'completar espacios en blanco';
        default: return type;
      }
    }).join(', ');

    // Construir la sección de enfoque específico si hay descripción
    const specificFocusSection = request.description && request.description.trim()
      ? `\n📋 ENFOQUE ESPECÍFICO REQUERIDO POR EL ESTUDIANTE:
"${request.description.trim()}"

IMPORTANTE: Las preguntas deben estar especialmente orientadas hacia estos aspectos mencionados por el estudiante. Prioriza estos elementos específicos al crear las preguntas.`
      : '';

    return `
Eres un experto creador de contenido educativo para YACHAY, una plataforma gamificada de aprendizaje personalizado.

Crea exactamente ${request.questionCount} preguntas sobre el tema: "${request.topic}"
${specificFocusSection}

Especificaciones:
- Nivel de dificultad: ${request.difficulty}
- Tipos de pregunta: ${questionTypesText}
- Idioma: ${request.language || 'español'}
- Las preguntas deben ser precisas, educativas y divertidas
- Incluye explicaciones breves para cada respuesta correcta
${request.description ? '- PRIORIZA los aspectos específicos mencionados en el enfoque del estudiante' : ''}

INSTRUCCIONES DE CREACIÓN:
${request.description
        ? `1. Analiza cuidadosamente lo que el estudiante quiere repasar específicamente
2. Al menos el 70% de las preguntas deben estar directamente relacionadas con su enfoque específico
3. El resto pueden ser preguntas complementarias del tema general
4. Asegúrate de que las preguntas aborden exactamente lo que el estudiante necesita practicar`
        : `1. Crea preguntas que cubran los aspectos más importantes del tema
2. Distribuye las preguntas para abarcar diferentes subtemas relevantes
3. Mantén un equilibrio entre conceptos fundamentales y aplicaciones prácticas`}

Formato de respuesta JSON:
{
  "questions": [
    {
      "question": "Texto de la pregunta",
      "type": "multiple_choice|true_false|fill_blank",
      "options": ["opción1", "opción2", "opción3", "opción4"], // solo para multiple_choice
      "correctAnswer": "respuesta correcta",
      "explanation": "breve explicación de por qué es correcta",
      "difficulty": "${request.difficulty}",
      "isSpecificFocus": true // true si la pregunta está directamente relacionada con el enfoque específico del estudiante
    }
  ]
}

Distribuye los tipos de pregunta de manera equilibrada. Asegúrate de que las preguntas sean desafiantes pero justas para el nivel especificado.

Responde ÚNICAMENTE con el JSON válido, sin texto adicional.
    `;
  }

  private parseQuestionsFromResponse(response: string): GeneratedQuestion[] {
    try {
      // Limpiar la respuesta para extraer solo el JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    } catch (error) {
      this.logger.error('Error parsing questions response:', error);
      this.logger.debug('Raw response:', response);

      // Fallback: intentar parsear manualmente
      return this.fallbackParseQuestions(response);
    }
  }

  private fallbackParseQuestions(response: string): GeneratedQuestion[] {
    // Implementación de respaldo si el JSON falla
    // Esto es opcional pero recomendado para robustez
    const questions: GeneratedQuestion[] = [];

    // Lógica simple de parseo como respaldo
    const lines = response.split('\n').filter(line => line.trim());

    // Esta es una implementación básica - puedes mejorarla según necesites
    return questions;
  }
}