import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({ description: 'Plan unique ID', example: '00000000-0000-4000-a000-000000000001' })
  id!: string;

  @ApiProperty({ description: 'Plan name', example: 'FREE' })
  name!: string;

  @ApiProperty({ description: 'Max groups a user can create', example: 3 })
  maxGroupsCreated!: number;

  @ApiProperty({ description: 'Max group memberships a user can have', example: 5 })
  maxMemberships!: number;

  @ApiProperty({ description: 'Max members allowed per group', example: 10 })
  maxMembersPerGroup!: number;

  @ApiProperty({ description: 'Max tournaments per group', example: 2 })
  maxTournamentsPerGroup!: number;
}
