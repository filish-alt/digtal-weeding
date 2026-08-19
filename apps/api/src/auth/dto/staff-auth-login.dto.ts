import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StaffAuthLoginDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  pinCode: string;

  @IsOptional()
  @IsString()
  stationId?: string;
}
