import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Career } from './entities/career.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CareersService {

    constructor(
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
  ) {}

  async create(createCareerDto: CreateCareerDto) {
    const career = this.careerRepo.create(createCareerDto);
    return await this.careerRepo.save(career);
  }

   async findAll() {
    return await this.careerRepo.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} career`;
  }

 
  async update(id: string, updateCareerDto: UpdateCareerDto) {
    const career = await this.careerRepo.findOne({ where: { id } });
    if (!career) throw new NotFoundException('Carrera no encontrada');

    Object.assign(career, updateCareerDto);
    return await this.careerRepo.save(career);
  }

 

   async remove(id: string) {
    const result = await this.careerRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Carrera no encontrada');
    }
    return { message: 'Carrera eliminada con éxito' };
  }
}
