import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  IsArray,
  IsObject,
  ArrayMinSize,
} from 'class-validator';

export class ImportMasterTemplateDto {
  @IsNumber()
  clinicId!: number;

  @IsString()
  @IsNotEmpty()
  twilioSid!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsIn(['UTILITY', 'MARKETING', 'AUTHENTICATION'])
  category!: string;

  @IsOptional()
  @IsObject()
  variableMapping?: Record<string, string>;
}

export class DeployMasterTemplateDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  clinicIds!: number[];
}

export class UpdateVariableMappingDto {
  @IsObject()
  variableMapping!: Record<string, string>;
}
