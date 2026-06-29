import { IsString, IsIP, IsIn, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsIP()
  @IsNotEmpty()
  ip: string;

  @IsIn(['AP', 'Router', 'Server'])
  type: 'AP' | 'Router' | 'Server';

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(17)
  macAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firmware?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @IsOptional()
  @IsString()
  description?: string;

}
