import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class LessonDto {
  @Field({ nullable: true })
  @ApiProperty({ description: 'Nama penyusun RPP', example: 'John Doe', required: false })
  nama_penyusun?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Institusi penyusun', example: 'SMA Negeri 1', required: false })
  institusi?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Tahun pembuatan RPP', example: '2024', required: false })
  tahun_pembuatan?: string;

  @Field()
  @ApiProperty({ description: 'Mata pelajaran', example: 'Matematika', required: true })
  mata_pelajaran: string;

  @Field()
  @ApiProperty({ description: 'Jenjang pendidikan', example: 'SMA', required: true })
  jenjang: string;

  @Field()
  @ApiProperty({ description: 'Kelas', example: 'X', required: true })
  kelas: string;

  @Field()
  @ApiProperty({ description: 'Alokasi waktu pembelajaran', example: '2x45 menit', required: true })
  alokasi_waktu: string;

  @Field()
  @ApiProperty({ description: 'Tahapan pembelajaran', example: 'Pendahuluan', required: true })
  tahapan: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Capaian pembelajaran', example: 'Siswa mampu memahami konsep aljabar', required: false })
  capaian_pembelajaran?: string;

  @Field()
  @ApiProperty({ description: 'Domain konten pembelajaran', example: 'Aljabar', required: true })
  domain_konten: string;

  @Field()
  @ApiProperty({ description: 'Tujuan pembelajaran', example: 'Siswa dapat menyelesaikan persamaan kuadrat', required: true })
  tujuan_pembelajaran: string;

  @Field()
  @ApiProperty({ description: 'Konten utama pembelajaran', example: 'Persamaan kuadrat dan pemfaktoran', required: true })
  konten_utama: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Prasyarat pembelajaran', example: 'Siswa telah memahami persamaan linear', required: false })
  prasyarat?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Pemahaman bermakna yang diharapkan', example: 'Siswa dapat mengaplikasikan persamaan kuadrat dalam kehidupan sehari-hari', required: false })
  pemahaman_bermakna?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Profil pelajar yang diharapkan', example: 'Kreatif, kritis, dan analitis', required: false })
  profil_pelajar?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Sarana pembelajaran', example: 'Laptop, proyektor, papan tulis', required: false })
  sarana?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Target peserta pembelajaran', example: 'Siswa kelas X', required: false })
  target_peserta?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Jumlah peserta pembelajaran', example: '30', required: false })
  jumlah_peserta?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Model pembelajaran', example: 'Discovery Learning', required: false })
  model_pembelajaran?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Sumber belajar', example: 'Buku paket Matematika kelas X', required: false })
  sumber_belajar?: string;

  @Field({ nullable: true })
  @ApiProperty({ description: 'Catatan tambahan', example: 'Perhatikan kemampuan awal siswa dalam memahami aljabar', required: false })
  catatan?: string;
} 
