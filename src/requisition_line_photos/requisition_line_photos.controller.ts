import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RequisitionLinePhotosService } from './requisition_line_photos.service';
import { CreateRequisitionDto } from 'src/requisitions/dto/create-requisition.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/multer.config';
import { CreateRequisitionLinePhotosDto } from './dto/create-requisition-line-photos.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('requisition-line-photos')
export class RequisitionLinePhotosController {
  constructor(
    private readonly requisitionLinePhotosService: RequisitionLinePhotosService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_MANAGER')
  @UseInterceptors(FilesInterceptor('images', 10, multerConfig))
  async createMany(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateRequisitionLinePhotosDto,
    @Req() req: any,
  ) {
    const user = req.user;

    await this.requisitionLinePhotosService.createMany(dto.requisition_line_id, user.person_id, files);

    return {
      success: true,
      message: 'Fotos guardadas correctamente',
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findByRequisitionLineId(@Param('id') id: string) {
    const photos = await this.requisitionLinePhotosService.findByRequisitionLineId(id);

    return {
        success: true,
        data: photos,
    };
  }
}
