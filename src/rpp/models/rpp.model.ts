import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { JenjangPendidikan, Fase } from '../dto/create-rpp.input';

registerEnumType(JenjangPendidikan, {
  name: 'JenjangPendidikan',
  description: 'Jenjang pendidikan yang tersedia',
});

registerEnumType(Fase, {
  name: 'Fase',
  description: 'Fase pembelajaran dalam Kurikulum Merdeka',
});

@ObjectType()
export class KegiatanPembelajaran {
  @Field()
  kegiatan: string;

  @Field()
  deskripsi: string;
}


@ObjectType()
export class MateriPembelajaran {
  @Field(() => [KegiatanPembelajaran])
  pendahuluan: KegiatanPembelajaran[];

  @Field(() => [KegiatanPembelajaran])
  inti: KegiatanPembelajaran[];

  @Field(() => [KegiatanPembelajaran])
  penutup: KegiatanPembelajaran[];
}


@ObjectType()
export class KegiatanDetail {
  @Field()
  deskripsi: string;

  @Field()
  durasi: string;
}

@ObjectType()
export class AlurKegiatanPembelajaran {
  @Field(() => KegiatanDetail)
  pendahuluan: KegiatanDetail;

  @Field(() => KegiatanDetail)
  inti: KegiatanDetail;

  @Field(() => KegiatanDetail)
  penutup: KegiatanDetail;
}


@ObjectType()
export class AsesmenPembelajaran {
  @Field()
  diagnostik: string;

  @Field()
  formatif: string;

  @Field()
  sumatif: string;
}

@ObjectType()
export class SumberDanMediaPembelajaran {
  @Field(() => [String])
  buku: string[];

  @Field(() => [String])
  media_digital: string[];

  @Field(() => [String])
  metode: string[];
}

@ObjectType()
export class RefleksiGuru {
  @Field()
  pencapaian_tujuan: string;

  @Field()
  tantangan: string;

  @Field()
  strategi_perbaikan: string;
}

@ObjectType()
export class Rpp {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  nama_penyusun?: string;
  
  @Field({ nullable: true })
  institusi?: string;
  
  @Field({ nullable: true })
  tahun_pembuatan?: string;
  
  @Field({ nullable: true })
  mata_pelajaran?: string;
  
  @Field({ nullable: true })
  jenjang?: string;
  
  @Field({ nullable: true })
  kelas?: string;
  
  @Field()
  alokasi_waktu: string;
  
  @Field({ nullable: true })
  tahapan?: string;
  
  @Field({ nullable: true })
  capaian_pembelajaran?: string;
  
  @Field({ nullable: true })
  domain_konten?: string;
  
  @Field(() => [String])
  tujuan_pembelajaran_list: string[];
  
  @Field({ nullable: true })
  tujuan_pembelajaran?: string;
  
  @Field({ nullable: true })
  konten_utama?: string;
  
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

  @Field()
  satuan_pendidikan: string;

  @Field()
  mataPelajaran: string;

  @Field()
  kelas_semester: string;

  @Field()
  materi_pokok: string;

  @Field(() => MateriPembelajaran)
  materi_pembelajaran: MateriPembelajaran;

  @Field(() => [String])
  profil_pelajar_pancasila: string[];

  @Field(() => AlurKegiatanPembelajaran)
  alur_kegiatan_pembelajaran: AlurKegiatanPembelajaran;

  @Field(() => AsesmenPembelajaran)
  asesmen_pembelajaran: AsesmenPembelajaran;

  @Field(() => SumberDanMediaPembelajaran)
  sumber_dan_media_pembelajaran: SumberDanMediaPembelajaran;

  @Field(() => RefleksiGuru)
  refleksi_guru: RefleksiGuru;
}