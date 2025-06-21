import { Injectable, Logger } from '@nestjs/common';
import { QuestionGenerationRequest } from './interfaces/question-generation-request.interface';
import { GeneratedQuestion, QuestionType } from './interfaces/generated-question.interface';
import { QuestionHint } from './interfaces/question-hint.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class LearningService {
  private readonly logger = new Logger(LearningService.name);
  private readonly openRouterApiKey = process.env.OPENROUTER_API_KEY;
  private readonly geminiInstances: GoogleGenerativeAI[];
  private readonly models: any[];

  constructor() {
    const apiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
    ].filter(key => key);

    this.geminiInstances = apiKeys.map(apiKey => new GoogleGenerativeAI(apiKey ? apiKey : ""));
    this.models = this.geminiInstances.map(genAI =>
      genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        }
      })
    );
  }

  async generateQuestions(request: QuestionGenerationRequest): Promise<GeneratedQuestion[]> {
    const startTime = Date.now();

    const specificTopics = await this.generateDiverseTopics(request);
    this.logger.log(`Generated ${specificTopics.length} diverse topics`);

    const promises: Promise<GeneratedQuestion | null>[] = [];

    for (let i = 0; i < request.questionCount; i++) {
      const modelIndex = i % this.models.length;
      const specificTopic = specificTopics[i % specificTopics.length];

      const singleQuestionRequest = {
        ...request,
        questionCount: 1,
        specificTopic: specificTopic
      };

      promises.push(
        this.generateSingleQuestionWithGemini(
          singleQuestionRequest,
          this.models[modelIndex],
          modelIndex + 1,
          i + 1
        )
      );
    }

    const results = await Promise.allSettled(promises);
    const questions = results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter((q): q is GeneratedQuestion => q !== null);

    const duration = Date.now() - startTime;
    this.logger.log(`Generated ${questions.length}/${request.questionCount} questions in ${duration}ms`);

    return questions;
  }

  private async generateDiverseTopics(request: QuestionGenerationRequest): Promise<string[]> {
    const focusAreasContext = request.focusAreas?.length
      ? `\nFocus on: ${request.focusAreas.join(', ')}`
      : '';

    const topicPrompt = `Create ${request.questionCount} specific subtopics for quiz questions about: ${request.topic}

${request.description}${focusAreasContext}
Difficulty: ${request.difficulty} | Language: ${request.language}

IMPORTANT: Return ONLY a JSON array of strings (not an object). Example format:
["Subtopic 1", "Subtopic 2", "Subtopic 3"]

Generate exactly ${request.questionCount} subtopics as a JSON array:`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Quiz Generator'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-7b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a quiz topic generator. Always respond with a JSON array of strings only, never an object. Format: ["topic1", "topic2", "topic3"]'
            },
            {
              role: 'user',
              content: topicPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 400,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      let topics: string[];

      try {
        const parsed = JSON.parse(content);

        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          topics = Object.values(parsed).map(value => String(value));
        }
        else if (Array.isArray(parsed)) {
          topics = parsed.map(item => String(item));
        }
        else {
          throw new Error('Unexpected JSON format');
        }

      } catch (parseError) {
        try {
          const jsonMatch = content.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            topics = JSON.parse(jsonMatch[0]);
          } else {
            const objectMatch = content.match(/\{[\s\S]*?\}/);
            if (objectMatch) {
              const obj = JSON.parse(objectMatch[0]);
              topics = Object.values(obj).map(value => String(value));
            } else {
              const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('-') && !line.startsWith('*'))
                .map(line => line.replace(/^[\d\.\-\*\s]+/, '').replace(/['"]/g, ''))
                .slice(0, request.questionCount);

              if (lines.length > 0) {
                topics = lines;
              } else {
                throw new Error('Could not extract topics from response');
              }
            }
          }
        } catch (secondParseError) {
          throw new Error(`Failed to parse response: ${content}`);
        }
      }

      if (Array.isArray(topics) && topics.length > 0) {
        const cleanTopics = topics
          .map(topic => typeof topic === 'string' ? topic.trim() : String(topic).trim())
          .filter(topic => topic.length > 3)
          .slice(0, request.questionCount);

        if (cleanTopics.length > 0) {
          return cleanTopics;
        }
      }

      throw new Error('Invalid or empty topics format');

    } catch (error) {
      this.logger.warn('Error generating topics with OpenRouter, using fallback:', error.message);
      return this.generateFallbackTopics(request);
    }
  }

  private generateFallbackTopics(request: QuestionGenerationRequest): string[] {
    if (request.focusAreas?.length) {
      const expandedTopics: string[] = [];

      request.focusAreas.forEach(area => {
        expandedTopics.push(
          `Basic concepts in ${area}`,
          `Advanced applications of ${area}`,
          `Practical examples of ${area}`,
          `Common challenges in ${area}`
        );
      });

      // Mezclar y tomar la cantidad requerida
      const shuffled = expandedTopics.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, request.questionCount);
    }

    // Fallback genérico si no hay focusAreas
    const baseTopics = [
      `Basic concepts of ${request.topic}`,
      `Advanced applications in ${request.topic}`,
      `Historical development of ${request.topic}`,
      `Current trends in ${request.topic}`,
      `Practical examples of ${request.topic}`,
      `Key principles of ${request.topic}`,
      `Common challenges in ${request.topic}`,
      `Best practices for ${request.topic}`,
      `Future perspectives on ${request.topic}`,
      `Case studies in ${request.topic}`
    ];

    return baseTopics.slice(0, request.questionCount);
  }

  private async generateSingleQuestionWithGemini(
    request: QuestionGenerationRequest,
    model: any,
    instanceNumber: number,
    questionNumber: number
  ): Promise<GeneratedQuestion | null> {
    try {
      const prompt = this.buildCompactPrompt(request, questionNumber);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const questions = this.parseEnhancedQuestions(text, request, `GEMINI-${instanceNumber}`);
      return questions[0] || null;
    } catch (error) {
      this.logger.warn(`Error generating question ${questionNumber} with GEMINI-${instanceNumber}:`, error.message);
      return null;
    }
  }

  private buildCompactPrompt(request: QuestionGenerationRequest, questionNumber: number): string {
    const questionTypesText = this.formatQuestionTypes(request.questionTypes);
    const focusSection = this.buildDualFocusSection(request);

    return `🎓 YACHAY - Genera 1 pregunta de quiz en JSON.

📋 SPECS: "${request.topic}" | ${request.difficulty} | ${request.language}
Tipos: ${questionTypesText}

${focusSection}

🎯 TIPOS:
multiple_choice(4 opts,1 correcta)|multiple_select(4-6 opts,2-3 correctas)|true_false|fill_blank(1-3 espacios)|drag_drop|sequence_order(4-6 elementos)|match_pairs(4-6 pares)|select_text|categorize(6-8 elementos,2-3 categorías)|short_answer(1-3 palabras)

🧠 NIVELES: Recordar(20%)→Comprender(25%)→Aplicar(25%)→Analizar(20%)→Evaluar(10%)

📊 JSON REQUERIDO:
{
  "questions": [{
    "id": "${questionNumber}_${Date.now()}",
    "question": "Texto pregunta",
    "type": "tipo_pregunta",
    "difficulty": "${request.difficulty}",
    "topic": "${request.topic}",
    "language": "${request.language}",
    "options": [{"id":"opt_1","text":"Texto","isCorrect":boolean,"order":1,"explanation":"Por qué"}],
    "correctAnswers": ["opt_1"],
    "hints": [
      {"level":"subtle","text":"Pista sutil","pointsDeduction":5},
      {"level":"moderate","text":"Pista moderada","pointsDeduction":15},
      {"level":"obvious","text":"Pista obvia","pointsDeduction":25}
    ],
    "explanation": {"brief":"Breve","detailed":"Detallada","relatedConcepts":["concepto1"]},
    "tags": ["tag1","tag2"]
  }]
}

🚨 SOLO JSON válido. Exactamente 1 pregunta.`;
  }

  private buildDualFocusSection(request: QuestionGenerationRequest): string {
    let section = '📍 ENFOQUE ESPECÍFICO:\n';

    if (request.description) {
      section += `Descripción: "${request.description}"\n`;
    }

    if (request.focusAreas?.length) {
      section += `🎯 Áreas prioritarias: ${request.focusAreas.join(', ')}\n`;
    }

    if (request.specificTopic) {
      section += `🤖 Enfoque específico: "${request.specificTopic}"\n`;
    }

    if (request.focusAreas?.length && request.specificTopic) {
      section += '⚠️ PRIORIDAD: Crear pregunta sobre el enfoque específico dentro del contexto de las áreas prioritarias\n';
    } else if (request.focusAreas?.length) {
      section += '⚠️ 70% de preguntas deben abordar las áreas prioritarias\n';
    } else if (request.specificTopic) {
      section += '⚠️ Crear pregunta específicamente sobre el enfoque proporcionado\n';
    }

    return section;
  }

  private formatQuestionTypes(types: Array<{ type: QuestionType; percentage: number }>): string {
    return types.map(t => `${t.type}(${t.percentage}%)`).join(', ');
  }

  private parseEnhancedQuestions(text: string, request: QuestionGenerationRequest, model: string): GeneratedQuestion[] {
    try {
      const cleanJson = this.extractJsonFromResponse(text);

      if (!cleanJson) {
        this.logger.warn(`No JSON válido encontrado en respuesta de ${model}`);
        return [];
      }

      const parsed = JSON.parse(cleanJson);

      if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        this.logger.warn(`Estructura JSON inválida en respuesta de ${model}`);
        return [];
      }

      return parsed.questions.map((q: any, index: number) => this.sanitizeQuestion(q, request, index));

    } catch (error) {
      this.logger.error(`Error parsing questions from ${model}:`, error.message);
      return [];
    }
  }

  // Método optimizado y simplificado para extraer JSON
  private extractJsonFromResponse(text: string): string | null {
    if (!text?.trim()) return null;

    try {
      // Método 1: Remover bloques de código markdown
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (codeBlockMatch) {
        const candidate = codeBlockMatch[1].trim();
        if (this.isValidQuestionJson(candidate)) return candidate;
      }

      // Método 2: Buscar JSON entre llaves (el más común)
      const braceMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (braceMatch) {
        const candidate = this.extractBalancedBraces(braceMatch[0]);
        if (candidate && this.isValidQuestionJson(candidate)) return candidate;
      }

      // Método 3: Si ya es JSON válido tal como está
      if (this.isValidQuestionJson(text.trim())) {
        return text.trim();
      }

      // Método 4: Buscar desde "questions" hacia atrás y adelante
      const questionsIndex = text.indexOf('"questions"');
      if (questionsIndex > -1) {
        const candidate = this.extractFromQuestionsKeyword(text, questionsIndex);
        if (candidate && this.isValidQuestionJson(candidate)) return candidate;
      }

    } catch (error) {
      this.logger.debug('Error during JSON extraction:', error.message);
    }

    return null;
  }

  private isValidQuestionJson(str: string): boolean {
    try {
      const parsed = JSON.parse(str);
      return !!(parsed?.questions && Array.isArray(parsed.questions));
    } catch {
      return false;
    }
  }

  private extractBalancedBraces(text: string): string | null {
    let braces = 0;
    let start = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (start === -1) start = i;
        braces++;
      } else if (text[i] === '}') {
        braces--;
        if (braces === 0 && start !== -1) {
          return text.slice(start, i + 1);
        }
      }
    }
    return null;
  }

  private extractFromQuestionsKeyword(text: string, questionsIndex: number): string | null {
    let start = questionsIndex;
    while (start > 0 && text[start] !== '{') start--;

    if (text[start] !== '{') return null;

    return this.extractBalancedBraces(text.slice(start));
  }

  private sanitizeQuestion(q: any, request: QuestionGenerationRequest, index: number): GeneratedQuestion {
    return {
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      question: q.question || `Pregunta ${index + 1}`,
      type: q.type || 'multiple_choice',
      difficulty: q.difficulty || request.difficulty,
      topic: q.topic || request.topic,
      language: q.language || request.language,
      options: this.sanitizeOptions(q.options, index),
      correctAnswers: this.sanitizeCorrectAnswers(q.correctAnswers, q.options),
      hints: this.sanitizeHints(q.hints),
      explanation: this.sanitizeExplanation(q.explanation),
      tags: Array.isArray(q.tags) ? q.tags : []
    };
  }

  private sanitizeOptions(options: any, questionIndex: number): any[] {
    if (!Array.isArray(options)) return [];

    return options.map((opt, i) => ({
      id: opt?.id || `opt_${questionIndex}_${i + 1}`,
      text: opt?.text || `Opción ${i + 1}`,
      isCorrect: Boolean(opt?.isCorrect),
      order: opt?.order ?? i + 1,
      explanation: opt?.explanation || ''
    }));
  }

  private sanitizeCorrectAnswers(correctAnswers: any, options: any[]): string[] {
    if (Array.isArray(correctAnswers)) return correctAnswers;

    return Array.isArray(options)
      ? options.filter(opt => opt?.isCorrect).map(opt => opt.id || opt.text)
      : [];
  }

  private sanitizeHints(hints: any): QuestionHint[] {
    if (Array.isArray(hints) && hints.length > 0) {
      return hints.map(hint => ({
        level: hint?.level || 'moderate',
        text: hint?.text || 'Pista no disponible',
        pointsDeduction: hint?.pointsDeduction ?? 10
      }));
    }

    return [
      { level: 'subtle', text: 'Considera los conceptos clave del tema', pointsDeduction: 5 },
      { level: 'moderate', text: 'Elimina las opciones menos probables', pointsDeduction: 15 },
      { level: 'obvious', text: 'Revisa las definiciones básicas', pointsDeduction: 25 }
    ];
  }

  private sanitizeExplanation(explanation: any): any {
    if (explanation && typeof explanation === 'object') {
      return {
        brief: explanation.brief || 'Sin explicación',
        detailed: explanation.detailed || explanation.brief || 'Sin explicación detallada',
        relatedConcepts: Array.isArray(explanation.relatedConcepts) ? explanation.relatedConcepts : []
      };
    }

    return {
      brief: 'Sin explicación',
      detailed: 'Sin explicación detallada',
      relatedConcepts: []
    };
  }
}