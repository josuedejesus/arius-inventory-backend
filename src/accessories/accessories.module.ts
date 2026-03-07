import { Module } from '@nestjs/common';
import { AccessoriesController } from './accessories.controller';
import { AccessoriesService } from './accessories.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [AccessoriesController],
  providers: [AccessoriesService],
  imports: [DatabaseModule]
})
export class AccessoriesModule {}
