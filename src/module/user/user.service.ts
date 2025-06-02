import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserProfile } from './entities/user-profile';
import { InitUserDto } from './dto/init-user.dto';
import { Academic } from '../academic/entities/academic.entity';
import { Career } from '../careers/entities/career.entity';
@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(Academic)
    private readonly academicLevelRepo : Repository<Academic>,
    @InjectRepository(Career)
    private readonly careerRepo : Repository<Career>
  ) { }


  create(createUserDto: RegisterUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


  async register(createUserDto: RegisterUserDto) {
    const existing = await this.userRepo.findOne({ where: { email: createUserDto.email } });
    if (existing) throw new ConflictException('El correo ya está en uso');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepo.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
    });

    return await this.userRepo.save(user);

  }

  async initUser(userId: string, dto: InitUserDto) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  if (user.isConfigured) {
    throw new BadRequestException('User profile is already configured');
  }

  const academic = await this.academicLevelRepo.findOne({
    where: { id: dto.academicLevelId },
  });

  if (!academic) {
    throw new NotFoundException('Academic level not found');
  }

  let career: Career | null = null;
  if (dto.careerId) {
    career = await this.careerRepo.findOne({
      where: { id: dto.careerId },
    });

    if (!career) {
      throw new NotFoundException('Career not found');
    }
  }

  const profile = this.profileRepo.create({
    user,
    ...dto,
  });

  await this.profileRepo.save(profile);

  user.isConfigured = true;
  await this.userRepo.save(user);

  return { message: 'User profile initialized successfully' };
}


}
