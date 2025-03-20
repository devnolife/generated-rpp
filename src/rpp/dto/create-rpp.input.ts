import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Definisikan enum terlebih dahulu
export enum JenjangPendidikan {
  SD = 'SD',
  SMP = 'SMP',
  SMA = 'SMA',
}

export enum Fase {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
}

// Daftarkan enum untuk GraphQL
registerEnumType(JenjangPendidikan, {
  name: 'JenjangPendidikan',
  description: 'Jenjang pendidikan yang tersedia',
});

registerEnumType(Fase, {
  name: 'Fase',
  description: 'Fase pembelajaran dalam Kurikulum Merdeka',
});

@InputType()
export class CreateRppInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  satuanPendidikan: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  mataPelajaran: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  topik: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  kelas: string;

  @Field(() => JenjangPendidikan)
  @IsEnum(JenjangPendidikan)
  jenjangPendidikan: JenjangPendidikan;

  @Field(() => Fase)
  @IsEnum(Fase)
  fase: Fase;

  @Field()
  @IsNotEmpty()
  @IsString()
  cakupanMateri: string;


  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  alokasi_waktu?: string;
}
