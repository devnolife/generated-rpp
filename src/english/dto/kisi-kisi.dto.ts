import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class KisiKisiDto {
  @Field()
  rpp_data: string; // JSON string of RPP data

  @Field()
  questions_data: string; // JSON string of questions data
} 
