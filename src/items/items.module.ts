import { forwardRef, Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { DatabaseModule } from 'src/database/database.module';
import { ItemAccessoriesModule } from 'src/item-accessories/item-accessories.module';
import { ItemUnitsModule } from 'src/item-units/item-units.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
  imports: [DatabaseModule, ItemAccessoriesModule, forwardRef(() => ItemUnitsModule), S3Module],
  exports: [ItemsService]
})
export class ItemsModule {}
