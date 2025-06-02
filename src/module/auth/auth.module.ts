import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from './jwt/jwt.config';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserProfile } from '../user/entities/user-profile';
import { UserAvatar } from '../user/entities/user-avatar.entity';


@Module({
  imports : [
    TypeOrmModule.forFeature([User , UserProfile , UserAvatar]),
    JwtModule.register(jwtConfig)
  ],
  controllers: [AuthController],
  providers: [AuthService , JwtStrategy],
})
export class AuthModule {}
