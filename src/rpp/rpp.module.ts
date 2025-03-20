import { Module } from '@nestjs/common';
import { RppResolver } from './rpp.resolver';
import { RppService } from './rpp.service';
import { OpenAiService } from '../openai/openai.service';

@Module({
  providers: [RppResolver, RppService, OpenAiService],
})
export class RppModule {}