import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateInvitationDto {
  @IsString()
  @IsOptional()
  primaryContactName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  deliveryChannel?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  partySizeAllowed?: number;
}
