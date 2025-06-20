import { Type } from "class-transformer";
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateQuizDto {
  @IsNotEmpty({ message: 'El tema es obligatorio' })
  @IsString({ message: 'El tema debe ser un texto' })
  topic: string;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser un texto' })
  description: string;

  @IsNotEmpty({ message: 'La dificultad es obligatoria' })
  @IsIn(['beginner', 'intermediate', 'advanced'], { 
    message: 'La dificultad debe ser: beginner, intermediate o advanced' 
  })
  difficulty: 'beginner' | 'intermediate' | 'advanced';

  @IsNotEmpty({ message: 'La cantidad de preguntas es obligatoria' })
  @IsNumber({}, { message: 'La cantidad de preguntas debe ser un número' })
  @Type(() => Number) // Importante: transforma string a number
  @Min(1, { message: 'Debe haber al menos 1 pregunta' })
  @Max(50, { message: 'Máximo 50 preguntas por vez' })
  questionCount: number;

  @IsNotEmpty({ message: 'Los tipos de pregunta son obligatorios' })
  @IsArray({ message: 'Los tipos de pregunta deben ser un array' })
  @IsIn(['multiple_choice', 'true_false', 'fill_blank'], { 
    each: true, 
    message: 'Tipos válidos: multiple_choice, true_false, fill_blank' 
  })
  questionTypes: ('multiple_choice' | 'true_false' | 'fill_blank')[];

  @IsOptional()
  @IsString({ message: 'El idioma debe ser un texto' })
  language?: string;
}
