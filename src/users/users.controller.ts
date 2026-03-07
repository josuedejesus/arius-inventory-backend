import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDTO) {
    return this.userService.create(dto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async findAvailable() {
    return this.userService.findAvailable();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Get('with-profile')
  @UseGuards(JwtAuthGuard)
  async findAllWithProfile() {
    return this.userService.findAllWithProfile();
  }

  @Get(':id/person')
  async findByPersonId(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findByPersonId(id);
  }
}
