import { Module } from '@nestjs/common';
import { ItemAccessoriesController } from './item-accessories.controller';
import { ItemAccessoriesService } from './item-accessories.service';
import { DatabaseModule } from 'src/database/database.module';
import { ItemsModule } from 'src/items/items.module';

@Module({
  controllers: [ItemAccessoriesController],
  providers: [ItemAccessoriesService],
  imports: [DatabaseModule],
  exports: [ItemAccessoriesService]
})
export class ItemAccessoriesModule {}
