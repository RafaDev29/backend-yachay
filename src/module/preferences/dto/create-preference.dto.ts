import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreatePreferenceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
