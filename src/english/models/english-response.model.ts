import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EnglishResponse {
  @Field()
  status: string;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  data?: string; // JSON string of the generated content
}

@ObjectType()
export class RppResponse extends EnglishResponse {
  @Field({ nullable: true })
  rpp?: string; // JSON string of the RPP
}

@ObjectType()
export class BahanAjarResponse extends EnglishResponse {
  @Field({ nullable: true })
  bahan_ajar?: string; // JSON string of the bahan ajar
}

@ObjectType()
export class QuestionsResponse extends EnglishResponse {
  @Field({ nullable: true })
  questions?: string; // JSON string of the questions
}

@ObjectType()
export class KisiKisiResponse extends EnglishResponse {
  @Field({ nullable: true })
  kisi_kisi?: string; // JSON string of the kisi-kisi
} 
