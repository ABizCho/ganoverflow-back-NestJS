import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginUserDto } from "src/user/dto/login-user.dto";
import { User } from "src/user/entities/user.entity";
import { UserService } from "src/user/user.service";
import { jwtConstants } from "./constants";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async login(loginUserDto: LoginUserDto) {
    const user = await this.userService.validateUser(loginUserDto);
    if (user) {
      const resUserData = {
        id: user.id,
        nickname: user.nickname,
        access_token: await this.generateAccessToken(user),
        refresh_token: await this.generateRefreshToken(user),
      };

      console.log("resUserData - login:", resUserData);

      return resUserData;
    }
  }

  async logout(userId: string) {
    return await this.userService.removeRefreshToken(userId);
  }

  async generateAccessToken(user: User) {
    const payload = { sub: user.id, username: user.username };
    return this.jwtService.signAsync(payload, { expiresIn: "15m" });
  }

  // Refresh token 생성 함수
  async generateRefreshToken(user: User) {
    const refresh_token = this.jwtService.sign(
      {},
      {
        subject: String(user.id),
        expiresIn: "7d", // JWT 토큰 자체의 만료 시간을 설정
      }
    );
    await this.userService.setUserRefreshToken(refresh_token, user.id); // refresh token을 사용자 정보에 저장

    return refresh_token;
  }

  async setCookieWithRefreshToken(res: any, refresh_token: string) {
    res.cookie("refresh_token", refresh_token, {
      httpOnly: process.env.COOKIE_SECURE !== "false",
      secure: process.env.COOKIE_SECURE !== "false",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res;
  }

  // Refresh token 확인 함수
  async resolveRefreshToken(encoded) {
    console.log("encoded", encoded);
    const payload = await this.jwtService.verifyAsync(encoded.toString(), {
      secret: jwtConstants.secret,
    });

    console.log("malformed error payload", payload);
    const tokenExists = await this.userService.getUserIfRefreshTokenMatches(
      encoded.toString(),
      payload.sub
    );

    if (!tokenExists) {
      throw new Error("Expired token");
    }

    return this.userService.findOneById(payload.sub);
  }
}
