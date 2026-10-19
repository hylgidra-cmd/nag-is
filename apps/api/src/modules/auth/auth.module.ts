import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UsersModule } from '../users/users.module';

@Module({
  // Secrets are passed per sign/verify call rather than registered here,
  // because access and refresh tokens are deliberately signed with different
  // keys. JwtModule is re-exported because the globally registered
  // AccessTokenGuard is constructed in the AppModule injector and needs
  // JwtService there.
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService],
  exports: [JwtModule, TokenService, PasswordService],
})
export class AuthModule {}
