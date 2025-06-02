import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile';
import { Career } from '../careers/entities/career.entity';
import { Academic } from '../academic/entities/academic.entity';

@Module({
  imports : [
    TypeOrmModule.forFeature([User , UserProfile , Career , Academic])
  ], 
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
