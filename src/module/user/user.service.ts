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
import { UserAvatar } from './entities/user-avatar.entity';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from 'src/config/s3.config';
import { UploadService } from '../upload/upload.service';

import { Character } from '../characters/entities/character.entity';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>,
    @InjectRepository(Academic)
    private academicLevelRepo: Repository<Academic>,
    @InjectRepository(Career)
    private careerRepo: Repository<Career>,
    @InjectRepository(UserAvatar)
    private avatarRepo: Repository<UserAvatar>,
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,

    private readonly uploadService: UploadService,
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

 
  async uploadAvatar(userId: string, file?: Express.Multer.File, characterId?: string) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  let imageUrl: string;
  let type: 'custom' | 'character';

  if (file) {
    // Subida personalizada
    imageUrl = await this.uploadService.uploadFile(file, 'avatar', userId);
    type = 'custom';
  } else if (characterId) {
    // Avatar predefinido
    const character = await this.characterRepo.findOne({ where: { id: characterId } });
    if (!character) throw new NotFoundException('Character not found');

    imageUrl = character.imageUrl;
    type = 'character';
  } else {
    throw new BadRequestException('Debe enviar una imagen o un ID de avatar existente');
  }

  // Buscar si ya tiene un avatar
  let avatar = await this.avatarRepo.findOne({ where: { user: { id: userId } }, relations: ['user'] });

  if (avatar) {
    // Si era personalizado antes, eliminar imagen anterior del bucket
    if (avatar.type === 'custom' && type === 'custom') {
      const previousKey = this.extractFileName(avatar.imageUrl);
      await s3Client.send(new DeleteObjectCommand({ Bucket: 'avatar', Key: previousKey }));
    }

    avatar.imageUrl = imageUrl;
    avatar.type = type;
  } else {
    avatar = this.avatarRepo.create({ user, imageUrl, type });
  }

  await this.avatarRepo.save(avatar);

  user.hasAvatar = true;
  await this.userRepo.save(user);

  return { imageUrl, type };
}


  private extractFileName(url: string): string {
    return url.split('/').slice(-2).join('/');
  }
}
