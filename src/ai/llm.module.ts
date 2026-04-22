import { Global, Module } from '@nestjs/common';
import { LlmService } from './llm.service';

/**
 * Global module: LlmService bisa di-inject dari semua module tanpa
 * perlu disebut di `imports` masing-masing.
 */
@Global()
@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
