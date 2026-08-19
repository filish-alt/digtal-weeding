import { IsDateString, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateEventStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @Length(4, 8)
  pinCode?: string;

  @IsOptional()
  @IsString()
  stationId?: string;

  @IsOptional()
  @IsDateString()
  tokenExpiresAt?: string;
}
