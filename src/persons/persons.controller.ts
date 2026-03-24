import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonsService } from './persons.service';
import { UpdatePersonDto } from './dto/update-person.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/enums/user-role.enum';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePersonDto) {
    return this.personsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE_MANAGER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePersonDto,
  ) {

    console.log(dto);
    const person = await this.personsService.update(id, dto);

    return {
      success: true,
      message: 'Persona actualizada exitosamente.',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: any) {
    return this.personsService.findAll(query);
  }

  @Get(':id/locations')
  @UseGuards(JwtAuthGuard)
  async getPersonLocations(@Param('id', ParseIntPipe) id: number) {
    return this.personsService.getLocations(id);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    const person = await this.personsService.findById(id);

    return {
      success: true,
      data: person,
    };
  }

  
}
