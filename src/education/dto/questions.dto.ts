import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class QuestionsDto {
  @Field()
  @ApiProperty({ description: 'Mata pelajaran', example: 'Matematika', required: true })
  mata_pelajaran: string;

  @Field()
  @ApiProperty({ description: 'Kelas', example: 'X', required: true })
  kelas: string;

  @Field()
  @ApiProperty({ description: 'Materi pembelajaran', example: 'Persamaan Kuadrat', required: true })
  materi: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Jumlah soal yang akan dibuat', example: '10', required: false })
  jumlah?: string;
} 
