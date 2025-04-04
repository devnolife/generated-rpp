import { Field, InputType } from '@nestjs/graphql';
import { EnglishLessonDto } from './english-lesson.dto';

@InputType()
export class BahanAjarDto extends EnglishLessonDto {
  // Extends EnglishLessonDto since it needs the same input data
  // Can add additional fields specific to bahan ajar if needed
} 
