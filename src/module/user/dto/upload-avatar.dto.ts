import { IsOptional, IsUUID } from 'class-validator';

export class SetAvatarDto {
  @IsOptional()
  @IsUUID()
  characterId?: string;
}
