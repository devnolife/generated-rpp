import { Field, InputType } from '@nestjs/graphql';
import { EnglishLessonDto } from './english-lesson.dto';

@InputType()
export class QuestionsDto extends EnglishLessonDto {
  // Extends EnglishLessonDto since it needs the same input data
  // Can add additional fields specific to questions if needed
} 
