import { Controller, Post, Body } from '@nestjs/common';
import { EnglishService } from './english.service';
import { EnglishLessonDto, BahanAjarDto, QuestionsDto, KisiKisiDto } from './dto';

@Controller('english')
export class EnglishController {
  constructor(private readonly englishService: EnglishService) { }

  @Post('generate-rpp')
  async generateEnglishLesson(@Body() data: EnglishLessonDto) {
    return this.englishService.generateEnglishLesson(data);
  }

  @Post('generate-bahan-ajar')
  async generateBahanAjar(@Body() data: BahanAjarDto) {
    return this.englishService.generateBahanAjar(data);
  }

  @Post('generate-questions')
  async generateQuestions(@Body() data: QuestionsDto) {
    return this.englishService.generateQuestions(data);
  }

  @Post('generate-kisi-kisi')
  async generateKisiKisi(@Body() data: KisiKisiDto) {
    return this.englishService.generateKisiKisi(data);
  }
} 
