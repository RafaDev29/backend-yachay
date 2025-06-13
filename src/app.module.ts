import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { AcademicModule } from './module/academic/academic.module';
import { CareersModule } from './module/careers/careers.module';
import { UploadModule } from './module/upload/upload.module';
import { PreferencesModule } from './module/preferences/preferences.module';
import { CategoryModule } from './module/category/category.module';
import { CharactersModule } from './module/characters/characters.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true}),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    UserModule,
    AcademicModule,
    CareersModule,
    CharactersModule,
    UploadModule,
    PreferencesModule,
    CategoryModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
