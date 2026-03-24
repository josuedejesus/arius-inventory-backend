import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonsModule } from './persons/persons.module';
import { UsersModule } from './users/users.module';
import { UnitsModule } from './units/units.module';
import { AuthModule } from './auth/auth.module';
import { LocationsModule } from './locations/locations.module';
import { ItemsModule } from './items/items.module';
import { AccessoriesModule } from './accessories/accessories.module';
import { ItemAccessoriesModule } from './item-accessories/item-accessories.module';
import { ItemUnitsModule } from './item-units/item-units.module';
import { RequisitionsModule } from './requisitions/requisitions.module';
import { RequisitionLinesModule } from './requisition-lines/requisition-lines.module';
import { StockMovesModule } from './stock_moves/stock_moves.module';
import { EventsModule } from './events/events.module';
import { LocationMembersModule } from './location_members/location_members.module';
import { RequisitionLinePhotosModule } from './requisition_line_photos/requisition_line_photos.module';
import { ItemUnitUsageLogsModule } from './item_unit_usage_logs/item_unit_usage_logs.module';
import { RequisitionLineAccessoriesModule } from './requisition-line-accessories/requisition-line-accessories.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf/pdf.service';
import { PdfModule } from './pdf/pdf.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    PersonsModule,
    UsersModule,
    UnitsModule,
    AuthModule,
    LocationsModule,
    ItemsModule,
    AccessoriesModule,
    ItemAccessoriesModule,
    ItemUnitsModule,
    RequisitionsModule,
    RequisitionLinesModule,
    StockMovesModule,
    EventsModule,
    LocationMembersModule,
    RequisitionLinePhotosModule,
    ItemUnitUsageLogsModule,
    RequisitionLineAccessoriesModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      schema: 'public',
      autoLoadEntities: true,
      synchronize: false,
    }),
    PdfModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService, PdfService],
})
export class AppModule {}
