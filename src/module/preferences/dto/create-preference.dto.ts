import { IsNotEmpty } from "class-validator";

export class CreatePreferenceDto {
  @IsNotEmpty()
  name: string;
   @IsNotEmpty()
  description?: string;
}
