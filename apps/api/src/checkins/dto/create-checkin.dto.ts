import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsString()
  @IsNotEmpty()
  guestQrToken: string;

  @IsString()
  @IsOptional()
  stationId?: string;
}
