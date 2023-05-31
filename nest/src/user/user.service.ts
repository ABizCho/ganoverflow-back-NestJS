import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "src/entities/user.entity";
import { LoginUserDto } from "./dto/login-user.dto";
import { RegisterUserDto } from "./dto/register-user.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  myPage(userId: string) {
    return `My page of ${userId} `;
  }

  async register(registerUserDto: RegisterUserDto): Promise<User> {
    const user = new User();

    // 패스워드 해싱
    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    user.username = registerUserDto.username;
    user.password = hashedPassword;
    user.nickname = registerUserDto.nickname;
    user.status = "N";
    user.gender = registerUserDto.gender;
    user.birth_date = registerUserDto.birth_date;
    user.svc_use_pcy_agmt = registerUserDto.svc_use_pcy_agmt;
    user.ps_info_proc_agmt = registerUserDto.ps_info_proc_agmt;
    user.mkt_info_recv_agmt = registerUserDto.mkt_info_recv_agmt;
    user.provider = null;
    user.social_id = null;

    // 사용자 저장 및 반환
    return this.usersRepository.save(user);
  }

  async login(loginUserDto: LoginUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { username: loginUserDto.username },
    });

    if (
      !user ||
      !(await bcrypt.compare(loginUserDto.password, user.password))
    ) {
      throw new Error("Invalid username or password");
    }

    return user;
  }
}
