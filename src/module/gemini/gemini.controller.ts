import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GeminiService, QuestionGenerationRequest } from './gemini.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateModuleDto } from './dto/create-module.dto';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) { }

  @Post('generate-quiz')
  async generateQuiz(@Body() createQuizDto: CreateQuizDto) {
    try {
      if (!createQuizDto.difficulty) {
        throw new Error('Difficulty is required');
      }
      if (!createQuizDto.questionTypes || createQuizDto.questionTypes.length === 0) {
        throw new Error('QuestionTypes is required and must not be empty');
      }

      const quickRequest: QuestionGenerationRequest = {
        topic: createQuizDto.topic,
        description: createQuizDto.description,
        difficulty: createQuizDto.difficulty,
        questionCount: createQuizDto.questionCount || 5,
        questionTypes: createQuizDto.questionTypes,
        language: createQuizDto.language || 'español'
      };

      const questions = await this.geminiService.generateQuestions(quickRequest);

      return {
        success: true,
        data: {
          quiz: {
            topic: createQuizDto.topic,
            difficulty: createQuizDto.difficulty,
            totalQuestions: questions.length,
            questions: questions
          }
        },
        message: `Quiz sobre "${createQuizDto.topic}" generado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al generar el quiz'
      };
    }
  }

  @Get('learning-path/:topic')
  async getLearningPath(
    @Param('topic') topic: string,
    @Query('level') level: string = 'beginner'
  ) {
    try {
      const path = await this.geminiService.generateLearningPath(topic, level);

      return {
        success: true,
        data: {
          topic,
          userLevel: level,
          learningPath: path
        },
        message: `Ruta de aprendizaje para "${topic}" generada exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al generar la ruta de aprendizaje'
      };
    }
  }

  @Post('create-module')
  async createModule(@Body() createModuleDto: CreateModuleDto) {
    try {
      const description = await this.geminiService.generateModuleDescription(
        createModuleDto.name,
        createModuleDto.topics
      );

      return {
        success: true,
        data: {
          module: {
            name: createModuleDto.name,
            topics: createModuleDto.topics,
            description: description,
            createdAt: new Date().toISOString()
          }
        },
        message: `Módulo "${createModuleDto.name}" creado exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al crear el módulo'
      };
    }
  }

  @Post('quick-exam')
  async generateQuickExam(@Body() body: { topic: string; count?: number }) {
    try {
      const quickRequest: QuestionGenerationRequest = {
        topic: body.topic,
        description: '',
        difficulty: 'intermediate',
        questionCount: body.count || 5,
        questionTypes: ['multiple_choice', 'true_false'],
        language: 'español'
      };
      const questions = await this.geminiService.generateQuestions(quickRequest);

      return {
        success: true,
        data: {
          quickExam: {
            topic: body.topic,
            questions: questions,
            timeLimit: questions.length * 30,
            totalPoints: questions.length * 10
          }
        },
        message: `Examen rápido sobre "${body.topic}" listo para comenzar! 🚀`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Error al generar el examen rápido'
      };
    }
  }
}