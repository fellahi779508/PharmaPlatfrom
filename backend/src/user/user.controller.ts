import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { SubscriptionGuard } from 'src/auth/guards/jwt-auth/subscription.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('unsub')
  @UseGuards(JwtAuthGuard,)
  revokeUser(@Req() req: any, @Body('password') password: string) {
    return this.userService.revokeSubscription(req.user.id, password);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.userService.findAll(page, limit, search);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Put('reset-password')
  resetPassword(@Body() body: any) {
    return this.userService.resetPasswordByEmail(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Get('stats')
  getStats(@Req() req) {
    return this.userService.getAllUserStats(req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('isActived')
  isActived(@Req() req: any) {
    return this.userService.checkUserActivation(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('isVerifed')
  isVerifed(@Req() req: any) {
    return this.userService.isVerifed(req.user.id);
  }
  @UseGuards(JwtAuthGuard)
  @Get('leaderboard')
  getLeaderboard(@Req() req) {
    return this.userService.getLeaderboardWithUserRank(req.user.id);
  }

  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  changePassword(@Req() req, @Body() changePasswordDto: any) {
    return this.userService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }


  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put('activate/:id')
  activateUser(@Param('id') id: string) {
    return this.userService.activateUser(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  update(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.id, updateUserDto);
  }


  @Roles(Role.ADMIN, Role.OWNER)
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  updateAdmin(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }



  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
