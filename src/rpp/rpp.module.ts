import { Module } from '@nestjs/common';
import { RppResolver } from './rpp.resolver';
import { RppService } from './rpp.service';
import { OpenAiService } from '../ai/openai.service';
import { GeminiService } from 'src/ai/gemini.service';

@Module({
  providers: [RppResolver, RppService, OpenAiService, GeminiService],
})
export class RppModule {}