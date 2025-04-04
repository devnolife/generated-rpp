import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { EnglishService } from './english.service';
import { EnglishLessonDto, BahanAjarDto, QuestionsDto, KisiKisiDto } from './dto';
import { RppResponse, BahanAjarResponse, QuestionsResponse, KisiKisiResponse } from './models';

@Resolver()
export class EnglishResolver {
  constructor(private readonly englishService: EnglishService) { }

  @Mutation(() => RppResponse)
  async generateEnglishLesson(@Args('data') data: EnglishLessonDto): Promise<RppResponse> {
    return this.englishService.generateEnglishLesson(data);
  }

  @Mutation(() => BahanAjarResponse)
  async generateBahanAjar(@Args('data') data: BahanAjarDto): Promise<BahanAjarResponse> {
    return this.englishService.generateBahanAjar(data);
  }

  @Mutation(() => QuestionsResponse)
  async generateQuestions(@Args('data') data: QuestionsDto): Promise<QuestionsResponse> {
    return this.englishService.generateQuestions(data);
  }

  @Mutation(() => KisiKisiResponse)
  async generateKisiKisi(@Args('data') data: KisiKisiDto): Promise<KisiKisiResponse> {
    return this.englishService.generateKisiKisi(data);
  }
} 
