import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { EducationService } from './education.service';
import { LessonDto, BahanAjarDto, QuestionsDto, KisiKisiDto } from './dto';
import {
  EducationRppResponse,
  EducationBahanAjarResponse,
  EducationQuestionsResponse,
  EducationKisiKisiResponse
} from './models';

@Resolver()
export class EducationResolver {
  constructor(private readonly educationService: EducationService) { }

  @Mutation(() => EducationRppResponse)
  async generateLesson(@Args('input') data: LessonDto) {
    return this.educationService.generateLesson(data);
  }

  @Mutation(() => EducationBahanAjarResponse)
  async generateBahanAjar(@Args('input') data: BahanAjarDto) {
    return this.educationService.generateBahanAjar(data);
  }

  @Mutation(() => EducationQuestionsResponse)
  async generateQuestions(@Args('input') data: QuestionsDto) {
    return this.educationService.generateQuestions(data);
  }

  @Mutation(() => EducationKisiKisiResponse)
  async generateKisiKisi(@Args('input') data: KisiKisiDto) {
    return this.educationService.generateKisiKisi(data);
  }
} 
