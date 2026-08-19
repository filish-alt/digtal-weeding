import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RsvpGuestItemDto {
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @IsBoolean()
  isAttending: boolean;
}

export class SubmitRsvpDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RsvpGuestItemDto)
  rsvp: RsvpGuestItemDto[];
}
