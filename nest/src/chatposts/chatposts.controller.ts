import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ChatpostsService } from "./chatposts.service";
import { CreateChatpostDto } from "./dto/create-chatpost.dto";
import { UpdateChatpostDto } from "./dto/update-chatpost.dto";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ChatPairsService } from "src/chat-pairs/chat-pairs.service";
import { AuthGuard } from "src/auth/auth.guard";
import { Public } from "src/auth/public.decorator";
import { UserService } from "src/user/user.service";

@ApiBearerAuth("jwt")
@ApiTags("chatposts")
@Controller("chatposts")
export class ChatpostsController {
  constructor(
    private readonly chatpostsService: ChatpostsService,
    private readonly userService: UserService,
    private readonly chatpairsService: ChatPairsService
  ) {}

  @Post()
  async create(@Body() createChatpostDto: CreateChatpostDto, @Req() req) {
    console.log("chatposts controller - req.user", req.user);
    const user = await this.userService.findOneByUsername(req.user.username);

    console.log("chatposts controller - user", user);
    // ^ chatPosts 먼저 등록 => chatPostTitle 등록, Id 추출
    const chatPost = await this.chatpostsService.create(
      createChatpostDto,
      user
    );
    // const chatPostId = chatPost.chatPostId;
    await this.chatpairsService.create(createChatpostDto, chatPost);
  }

  @Public()
  @Get()
  findAll() {
    return this.chatpostsService.findAll();
  }

  @Get("my-chats")
  async findAllByUserId(@Req() request) {
    const user = await this.userService.findOneById(request.user.id);
    return this.chatpostsService.findAllByUserId(user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() request) {
    return this.chatpostsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateChatpostDto: UpdateChatpostDto
  ) {
    return this.chatpostsService.update(+id, updateChatpostDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.chatpostsService.remove(+id);
  }
}
