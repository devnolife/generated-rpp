import { Module } from '@nestjs/common';
import { EnglishService } from './english.service';
import { EnglishResolver } from './english.resolver';
import { EnglishController } from './english.controller';

@Module({
  providers: [EnglishService, EnglishResolver],
  controllers: [EnglishController],
  exports: [EnglishService],
})
export class EnglishModule { }
