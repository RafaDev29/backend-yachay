import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import * as multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) { }

  @Post('add')
  @UseInterceptors(FileInterceptor('image'))
  async createCharacter(
    @Body() dto: CreateCharacterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.charactersService.create(dto, file);
  }

  @Get('all')
  findAll() {
    return this.charactersService.findAll();
  }


}
