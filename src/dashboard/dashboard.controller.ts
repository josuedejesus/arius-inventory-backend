import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor( private readonly dashboardService: DashboardService) {}

  @Get('summary/internal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE_MANAGER, UserRole.WAREHOUSE_MANAGER)
  async getDashboardData() {
    const data = await this.dashboardService.getDashboardDataForInternalUser();
    return data;
  }

  @Get('summary/external')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.CONTRACTOR)
  async getDashboardDataForExternal(@Req() req) {
    const user = req.user;
    const data = await this.dashboardService.getDashboardDataForExternalUser(user.sub);
    console.log('Dashboard data for external user:', data);
    return data;
  }
}
