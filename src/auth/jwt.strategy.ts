import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PersonsService } from 'src/persons/persons.service';
import { UsersService } from 'src/users/users.service';
import { Roles } from './roles.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly personsService: PersonsService,
  ) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
       ('No es valido.');
      throw new UnauthorizedException('Acceso no autorizado');
    }

    const person = await this.personsService.findById(user.person_id);

    if (!person) {
       ('No es valido.');

      throw new UnauthorizedException('Acceso no autorizado');
    }

    return {
      sub: user.id,
      username: user.username,
      role: user.role,
      person_id: person.id,
      person_role: person.role,
      iat: 1770400321,
      exp: 1770486721,
    };
  }
}
