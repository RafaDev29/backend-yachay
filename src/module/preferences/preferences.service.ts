import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Preference } from './entities/preference.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PreferencesService {

  constructor(
    @InjectRepository(Preference)
    private preferenceRepo: Repository<Preference>,
  ) { }

  create(createPreferenceDto: CreatePreferenceDto) {
    const pref = this.preferenceRepo.create(createPreferenceDto);
    return this.preferenceRepo.save(pref);
  }

  findAll() {
    return this.preferenceRepo.find();
  }

  async findOne(id: string) {
    const pref = await this.preferenceRepo.findOne({ where: { id } });
    if (!pref) throw new NotFoundException('Preference not found');
    return pref;
  }

  async update(id: string, dto: UpdatePreferenceDto) {
    const pref = await this.findOne(id);
    Object.assign(pref, dto);
    return this.preferenceRepo.save(pref);
  }

  async remove(id: string) {
    const pref = await this.findOne(id);
    return this.preferenceRepo.remove(pref);
  }
}
