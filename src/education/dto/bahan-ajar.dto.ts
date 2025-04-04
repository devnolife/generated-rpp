import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class BahanAjarDto {
  @Field()
  @ApiProperty({ description: 'Mata pelajaran', example: 'Matematika', required: true })
  mata_pelajaran: string;

  @Field()
  @ApiProperty({ description: 'Kelas', example: 'X', required: true })
  kelas: string;

  @Field()
  @ApiProperty({ description: 'Materi pembelajaran', example: 'Persamaan Kuadrat', required: true })
  materi: string;
} 
