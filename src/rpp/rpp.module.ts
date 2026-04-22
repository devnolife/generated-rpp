import { Module } from '@nestjs/common';
import { RppResolver } from './rpp.resolver';
import { RppService } from './rpp.service';

// LlmService disediakan oleh LlmModule (@Global di app.module.ts).
@Module({
  providers: [RppResolver, RppService],
})
export class RppModule {}