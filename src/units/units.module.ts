import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [UnitsController],
  providers: [UnitsService],
  imports: [DatabaseModule]
})
export class UnitsModule {}
