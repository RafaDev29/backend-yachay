import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post('add')
  create(@Body() createPreferenceDto: CreatePreferenceDto) {
    return this.preferencesService.create(createPreferenceDto);
  }

  @Get('all')
  findAll() {
    return this.preferencesService.findAll();
  }

  @Get('list/:id')
  findOne(@Param('id') id: string) {
    return this.preferencesService.findOne(id);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updatePreferenceDto: UpdatePreferenceDto) {
    return this.preferencesService.update(id, updatePreferenceDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.preferencesService.remove(id);
  }
}
