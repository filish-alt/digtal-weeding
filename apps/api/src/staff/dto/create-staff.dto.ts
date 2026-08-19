import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  pinCode: string;

  @IsString()
  @IsOptional()
  stationId?: string;

  @IsDateString()
  @IsOptional()
  tokenExpiresAt?: string;
}
