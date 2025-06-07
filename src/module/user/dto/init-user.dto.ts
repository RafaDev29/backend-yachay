
import { IsNotEmpty, IsOptional, IsUUID, IsDateString, IsIn } from 'class-validator';

export class InitUserDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsIn(['male', 'female', 'other'])
  gender: string;

  @IsDateString()
  birthDate: string;

  @IsUUID()
  academicLevelId: string;

  @IsOptional()
  @IsUUID()
  careerId?: string;
}
