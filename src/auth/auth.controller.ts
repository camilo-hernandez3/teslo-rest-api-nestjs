import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  SetMetadata,

} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { Auth, GetUser, RawHeaders } from './decorators';
import { User } from './entities/user.entity';
import { IncomingHttpHeaders } from 'http';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { RoleProtected } from './decorators/role-protected/role-protected.decorator';
import { validRoles } from './interfaces';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createuserDto: CreateUserDto) {
    return this.authService.create(createuserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);

  }

  @Get('check-auth-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ){

     return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute( 
    @Req() request: Express.Request,
    @GetUser() user:User, 
    @GetUser('email') userEmail:string,
    @RawHeaders() rawHeader: string[],
    @Headers() headers: IncomingHttpHeaders ){

    

    return {
      ok: true,
      user,
      userEmail,
      rawHeader,
      headers
    }

  }

  //@SetMetadata('roles',['admin', 'super-user'])

  @Get('private2')
  @RoleProtected(validRoles.superUser, validRoles.admin, validRoles.user)
  @UseGuards( AuthGuard(), UserRoleGuard )
  privateRoute2( @GetUser() user: User){

    return {
      ok: true,
      user
    }

  }

  @Get('private3')
  @Auth(validRoles.admin)
  privateRoute3(
    @GetUser() user: User
  ){

  }
}
