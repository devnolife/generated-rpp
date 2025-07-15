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

export enum AiModel {
  OPENAI = 'OPENAI',
  GEMINI = 'GEMINI',
  SweetV1 = 'SweetV1',
  EmiliaAiV1 = 'EmiliaAiV1',
  EmiliaAiV2 = 'EmiliaAiV2',
  EmiliaAiV3 = 'EmiliaAiV3',
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

registerEnumType(AiModel, {
  name: 'AiModel',
  description: 'Model AI yang digunakan untuk generate RPP',
});

@InputType()
export class CreateRppInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nama_penyusun?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  institusi?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tahun_pembuatan?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mata_pelajaran?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jenjang?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  kelas?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  alokasi_waktu?: string;
  
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tahapan?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  capaian_pembelajaran?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  domain_konten?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  tujuan_pembelajaran?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  konten_utama?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  prasyarat?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  pemahaman_bermakna?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  profil_pelajar?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sarana?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  target_peserta?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jumlah_peserta?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  model_pembelajaran?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sumber_belajar?: string;
  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  catatan?: string;
  
  @Field(() => AiModel, { nullable: true, defaultValue: AiModel.GEMINI })
  @IsOptional()
  @IsEnum(AiModel)
  ai_model?: AiModel;
}
