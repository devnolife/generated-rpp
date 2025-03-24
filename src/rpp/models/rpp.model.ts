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

  @Field()
  satuan_pendidikan: string;

  @Field()
  mataPelajaran: string;

  @Field()
  kelas_semester: string;

  @Field()
  alokasi_waktu: string;

  @Field()
  materi_pokok: string;

  @Field(() => MateriPembelajaran)
  materi_pembelajaran: MateriPembelajaran;

  @Field(() => [String])
  tujuan_pembelajaran: string[];

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