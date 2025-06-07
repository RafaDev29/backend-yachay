import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Preference } from './entities/preference.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preference)
    private preferenceRepo: Repository<Preference>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) { }

  async createBulk(createPreferencesDto: CreatePreferenceDto[]) {
    try {
      const existingNames = createPreferencesDto.map(dto => dto.name);
      const existing = await this.preferenceRepo.find({
        where: existingNames.map(name => ({ name })),
      });

      if (existing.length > 0) {
        const duplicateNames = existing.map(p => p.name);
        throw new ConflictException(
          `Las siguientes preferencias ya existen: ${duplicateNames.join(', ')}`
        );
      }

      // Validar categorías si se proporcionan
      const preferencesWithCategories: any[] = [];
      for (const dto of createPreferencesDto) {
        const preferenceData: any = { name: dto.name };

        if (dto.categoryId) {
          const category = await this.categoryRepo.findOne({
            where: { id: dto.categoryId }
          });
          if (!category) {
            throw new NotFoundException(`Categoría con ID ${dto.categoryId} no encontrada`);
          }
          preferenceData.categoryId = dto.categoryId;
        }

        preferencesWithCategories.push(preferenceData);
      }

      const preferences = this.preferenceRepo.create(preferencesWithCategories);
      const savedPreferences = await this.preferenceRepo.save(preferences);

      return {
        success: true,
        count: savedPreferences.length,
        data: savedPreferences,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error al crear preferencias: ${error.message}`);
    }
  }

  // Crear preferencia individual con categoría
  async create(createPreferenceDto: CreatePreferenceDto) {
    const preferenceData: any = { name: createPreferenceDto.name };

    if (createPreferenceDto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: createPreferenceDto.categoryId }
      });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${createPreferenceDto.categoryId} no encontrada`);
      }
      preferenceData.categoryId = createPreferenceDto.categoryId;
    }

    const preference = this.preferenceRepo.create(preferenceData);
    return this.preferenceRepo.save(preference);
  }

  findAll() {
    return this.preferenceRepo.find({
      relations: ['category'] // Incluir información de la categoría
    });
  }

  // Obtener preferencias por categoría
  async findByCategory(categoryId: string) {
    return this.preferenceRepo.find({
      where: { categoryId },
      relations: ['category']
    });
  }

  async findOne(id: string) {
    const preference = await this.preferenceRepo.findOne({
      where: { id },
      relations: ['category'] // Incluir información de la categoría
    });
    if (!preference) throw new NotFoundException('Preference not found');
    return preference;
  }

  async update(id: string, updatePreferenceDto: UpdatePreferenceDto) {
    const preference = await this.findOne(id);

    // Si se está actualizando la categoría, validarla
    if (updatePreferenceDto.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: updatePreferenceDto.categoryId }
      });
      if (!category) {
        throw new NotFoundException(`Categoría con ID ${updatePreferenceDto.categoryId} no encontrada`);
      }
    }

    Object.assign(preference, updatePreferenceDto);
    return this.preferenceRepo.save(preference);
  }

  // Asignar categoría a preferencia
  async assignCategory(preferenceId: string, categoryId: string) {
    const preference = await this.findOne(preferenceId);
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${categoryId} no encontrada`);
    }

    preference.categoryId = categoryId;
    return this.preferenceRepo.save(preference);
  }

  async remove(id: string) {
    const preference = await this.findOne(id);
    return this.preferenceRepo.remove(preference);
  }
}