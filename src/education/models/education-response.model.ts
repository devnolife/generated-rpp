import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EducationResponse {
  @Field()
  status: string;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  data?: string; // JSON string of the generated content
}

@ObjectType()
export class EducationRppResponse extends EducationResponse {
  @Field({ nullable: true })
  rpp?: string; // JSON string of the RPP
}

@ObjectType()
export class EducationBahanAjarResponse extends EducationResponse {
  @Field({ nullable: true })
  bahan_ajar?: string; // JSON string of the bahan ajar
}

@ObjectType()
export class EducationQuestionsResponse extends EducationResponse {
  @Field({ nullable: true })
  questions?: string; // JSON string of the questions
}

@ObjectType()
export class EducationKisiKisiResponse extends EducationResponse {
  @Field({ nullable: true })
  kisi_kisi?: string; // JSON string of the kisi-kisi
} 
