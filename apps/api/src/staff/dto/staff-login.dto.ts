import { IsNotEmpty, IsString } from 'class-validator';

export class StaffLoginDto {
  @IsString()
  @IsNotEmpty()
  stationId: string;

  @IsString()
  @IsNotEmpty()
  pinCode: string;
}
