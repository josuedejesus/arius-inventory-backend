import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { PersonsService } from 'src/persons/persons.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly personsService: PersonsService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username);

    if (!user) {
      throw new UnauthorizedException('Acceso no autorizado.');
    }

    if (!user.is_active || user.person_id == null) {
      throw new UnauthorizedException('Acceso no autorizado.');
    }

    const match = await bcrypt.compare(dto.password, user.password_hash);

    if (!match) {
      throw new UnauthorizedException('Acceso no autorizado.');
    }

    const person = await this.personsService.findById(user.person_id);

    return this.generateToken(user, person);
  }

  private generateToken(user: any, person: any) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user_data: person,
    };
  }

  async me(userId: number) {
    const user = await this.usersService.findById(String(userId));


    if (!user) {
      throw new UnauthorizedException('Acceso denegado.');
    }

    const person = await this.personsService.findById(user.person_id);


    if (!person) {
      throw new UnauthorizedException('Acceso denegado');
    }

    return {
      //person
      person_id: person.id,
      name: person.name,
      phone: person.phone,
      email: person.email,
      person_role: person.role,
      //user
      user_id: user.id,
      username: user.username,
      user_role: user.role,
    };
  }
}
