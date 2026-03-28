import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, type JwtUserPayload } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { JoinGroupDto } from './dto/join-group.dto.js';
import { AddTournamentDto } from './dto/add-tournament.dto.js';
import { GroupResponseDto } from './dto/group-response.dto.js';
import { GroupMemberResponseDto } from './dto/group-member-response.dto.js';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiResponse({ status: 201, description: 'Group created', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all groups the current user belongs to' })
  @ApiResponse({ status: 200, description: 'List of groups', type: [GroupResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<GroupResponseDto[]> {
    return this.groupsService.findAllByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group details by ID' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Group details', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async findById(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupResponseDto> {
    return this.groupsService.findById(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group details (admin only)' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Group updated', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can update the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete or archive a group (admin only)' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Group deleted or archived',
    schema: {
      properties: {
        action: { type: 'string', enum: ['deleted', 'archived'] },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can delete the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async delete(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ action: 'deleted' | 'archived' }> {
    return this.groupsService.delete(id, user.sub);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a group using an invite code' })
  @ApiResponse({ status: 200, description: 'Joined group successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Group is full' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invalid invite code' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async joinByCode(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: JoinGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.joinByCode(user.sub, dto.inviteCode);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get group members' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of members', type: [GroupMemberResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getMembers(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupMemberResponseDto[]> {
    return this.groupsService.getMembers(id, user.sub);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the group (admin only)' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiParam({ name: 'userId', description: 'User ID to remove (UUID)' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 400, description: 'Cannot remove yourself' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can remove members' })
  @ApiResponse({ status: 404, description: 'Group or member not found' })
  async removeMember(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ): Promise<void> {
    return this.groupsService.removeMember(id, user.sub, targetUserId);
  }

  @Post(':id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a group' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Left the group' })
  @ApiResponse({ status: 400, description: 'Cannot leave as sole admin' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not a member of this group' })
  async leaveGroup(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.groupsService.leaveGroup(id, user.sub);
    return { message: 'Left the group' };
  }

  @Post(':id/tournaments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a tournament to the group (admin only)' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Tournament added to group' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can add tournaments' })
  @ApiResponse({ status: 404, description: 'Group or tournament not found' })
  @ApiResponse({ status: 409, description: 'Tournament already associated' })
  async addTournament(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTournamentDto,
  ): Promise<{ groupId: string; tournamentId: string }> {
    return this.groupsService.addTournament(id, user.sub, dto.tournamentId);
  }

  @Get(':id/tournaments')
  @ApiOperation({ summary: 'Get tournaments associated with a group' })
  @ApiParam({ name: 'id', description: 'Group ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of tournaments' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of the group' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupTournaments(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.groupsService.getGroupTournaments(id, user.sub);
  }
}
