
import { IsNotEmpty } from 'class-validator';

export class CreateCareerDto {
  @IsNotEmpty()
  name: string;
}