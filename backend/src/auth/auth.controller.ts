import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async loginSocialGoogle(@Body() body: any) {
    // Simulated token exchange for social login with Google
    return {
      access_token: 'google_token_simulated_jwt_token',
      user: {
        id: 'user_u_social_google',
        email: body.email || 'google.user@gmail.com',
        name: body.name || 'Google Racer Member'
      }
    };
  }
}
