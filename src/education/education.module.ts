import { Module } from '@nestjs/common';
import { EducationService } from './education.service';
import { EducationResolver } from './education.resolver';
import { EducationController } from './education.controller';

@Module({
  providers: [EducationService, EducationResolver],
  controllers: [EducationController],
  exports: [EducationService],
})
export class EducationModule { } 
