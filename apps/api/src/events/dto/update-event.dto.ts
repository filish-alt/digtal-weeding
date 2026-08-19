import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  coupleNames?: string;

  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  venue?: string;

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
