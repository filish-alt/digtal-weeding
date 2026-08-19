import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGuestDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

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
