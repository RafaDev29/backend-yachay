import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserProfile } from '../user/entities/user-profile';

@Injectable()
export class AuthService {
 
constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
     @InjectRepository(UserProfile)
    private readonly profileRepo : Repository<UserProfile>
  ) {}

async login(dto: LoginUserDto) {
  const user = await this.userRepo.findOne({
    where: { email: dto.email },
  });

  if (!user) {
    throw new UnauthorizedException('Credenciales inválidas');
  }

  const isPasswordValid = await bcrypt.compare(dto.password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Credenciales inválidas');
  }


  let profile: UserProfile | null = null;

  if (user.isConfigured) {
    profile = await this.profileRepo.findOne({
      where: { user: { id: user.id } },
    });
  }

  const payload = { sub: user.id, email: user.email };
  const token = await this.jwtService.signAsync(payload);

  return {
   
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isConfigured: user.isConfigured,
        profile: profile || null,
      },
  };
}
 
}
