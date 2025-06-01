import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';




@Controller('auth')

export class AuthController {
  constructor(private readonly authService: AuthService) {}

 
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginAuthDto: LoginUserDto) {
    return this.authService.login(loginAuthDto);
  }


  

 
}
