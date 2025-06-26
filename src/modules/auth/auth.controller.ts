import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginAuthDto: LoginUserDto) {
    return this.authService.login(loginAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('firebase-login')
  async firebaseLogin(@Body() firebaseAuthDto: FirebaseAuthDto) {
    return this.authService.firebaseLogin(firebaseAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('check-profile')
  async checkProfile(@Body() firebaseAuthDto: FirebaseAuthDto) {
    return this.authService.checkUserProfile(firebaseAuthDto);
  }
}
