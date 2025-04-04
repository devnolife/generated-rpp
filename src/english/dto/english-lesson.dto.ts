import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class EnglishLessonDto {
  @Field({ nullable: true })
  nama_penyusun?: string;

  @Field({ nullable: true })
  institusi?: string;

  @Field({ nullable: true })
  tahun_pembuatan?: string;

  @Field()
  mata_pelajaran: string;

  @Field()
  jenjang: string;

  @Field()
  kelas: string;

  @Field()
  alokasi_waktu: string;

  @Field()
  tahapan: string;

  @Field({ nullable: true })
  capaian_pembelajaran?: string;

  @Field()
  domain_konten: string;

  @Field()
  tujuan_pembelajaran: string;

  @Field()
  konten_utama: string;

  @Field({ nullable: true })
  prasyarat?: string;

  @Field({ nullable: true })
  pemahaman_bermakna?: string;

  @Field({ nullable: true })
  profil_pelajar?: string;

  @Field({ nullable: true })
  sarana?: string;

  @Field({ nullable: true })
  target_peserta?: string;

  @Field({ nullable: true })
  jumlah_peserta?: string;

  @Field({ nullable: true })
  model_pembelajaran?: string;

  @Field({ nullable: true })
  sumber_belajar?: string;

  @Field({ nullable: true })
  catatan?: string;
} 
