import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  primaryContactName!: string;

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
