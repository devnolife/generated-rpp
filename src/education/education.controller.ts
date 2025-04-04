import { Controller, Post, Body } from '@nestjs/common';
import { EducationService } from './education.service';
import { LessonDto, BahanAjarDto, QuestionsDto, KisiKisiDto } from './dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('education')
@Controller('education')
export class EducationController {
  constructor(private readonly educationService: EducationService) { }

  @Post('generate-rpp')
  @ApiOperation({
    summary: 'Generate RPP',
    description: 'Menghasilkan Rencana Pelaksanaan Pembelajaran (RPP) berdasarkan input yang diberikan'
  })
  @ApiResponse({
    status: 200,
    description: 'RPP berhasil dibuat',
  })
  async generateLesson(@Body() data: LessonDto) {
    return this.educationService.generateLesson(data);
  }

  @Post('generate-bahan-ajar')
  @ApiOperation({
    summary: 'Generate Bahan Ajar',
    description: 'Menghasilkan Bahan Ajar berdasarkan mata pelajaran, kelas, dan materi yang diberikan'
  })
  @ApiResponse({
    status: 200,
    description: 'Bahan Ajar berhasil dibuat',
  })
  async generateBahanAjar(@Body() data: BahanAjarDto) {
    return this.educationService.generateBahanAjar(data);
  }

  @Post('generate-questions')
  @ApiOperation({
    summary: 'Generate Soal',
    description: 'Menghasilkan soal-soal berdasarkan mata pelajaran, kelas, dan materi yang diberikan'
  })
  @ApiResponse({
    status: 200,
    description: 'Soal-soal berhasil dibuat',
  })
  async generateQuestions(@Body() data: QuestionsDto) {
    return this.educationService.generateQuestions(data);
  }

  @Post('generate-kisi-kisi')
  @ApiOperation({
    summary: 'Generate Kisi-Kisi',
    description: 'Menghasilkan kisi-kisi soal berdasarkan mata pelajaran, kelas, dan materi yang diberikan'
  })
  @ApiResponse({
    status: 200,
    description: 'Kisi-kisi berhasil dibuat',
  })
  async generateKisiKisi(@Body() data: KisiKisiDto) {
    return this.educationService.generateKisiKisi(data);
  }
} 
