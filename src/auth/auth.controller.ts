import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PersonsService } from 'src/persons/persons.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const login = await this.authService.login(dto);

    return {
      success: true,
      data: login,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const userId = req.user.sub;

    const person = await this.authService.me(userId);

    return {
      success: true,
      data: person,
    };
  }
}
