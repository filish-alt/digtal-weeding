import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  coupleNames!: string;

  @IsDateString()
  eventDate!: string;

  @IsString()
  @IsNotEmpty()
  venue!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  verse?: string;
}
