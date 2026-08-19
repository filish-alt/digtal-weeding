import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateGuestDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  relationshipGroup?: string;

  @IsBoolean()
  @IsOptional()
  needsPhysicalCard?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  tableNumber?: number;
}
