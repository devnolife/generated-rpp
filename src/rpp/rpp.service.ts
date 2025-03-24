import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../ai/openai.service';
import { CreateRppInput } from './dto/create-rpp.input';
import { Rpp } from './models/rpp.model';
import { v4 as uuidv4 } from 'uuid';
import { GeminiService } from 'src/ai/gemini.service';
import { generateRppPrompt } from 'src/utils/rppPrompt';

@Injectable()
export class RppService {
  constructor(
    private openAiService: OpenAiService,
    private geminiAiService: GeminiService
  ) {}

  async generateRpp(input: CreateRppInput): Promise<Rpp> {
    try {
      const prompt = this.createRppPrompt(input);
      // const openAiResponse = await this.openAiService.generateContent(prompt);
      const openAiResponse = await this.geminiAiService.optimizePrompt(prompt);

      if (!openAiResponse) {
        throw new Error('Gagal menerima respons dari OpenAI');
      }

      const rppData = this.parseOpenAiResponse(openAiResponse);

      if (!rppData.materi_pembelajaran || !rppData.alur_kegiatan_pembelajaran) {
        throw new Error('Respons OpenAI tidak sesuai dengan format yang diharapkan');
      }

      console.log('RPP data:', rppData);

      return {
        id: uuidv4(),
        ...input,
        ...rppData,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating RPP:', error);
      throw new Error('Terjadi kesalahan dalam pembuatan RPP');
    }
  }

  private createRppPrompt(input: CreateRppInput): string {
    return generateRppPrompt(input);
  }

  private parseOpenAiResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Tidak ditemukan format JSON dalam respons');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Format JSON tidak valid dalam respons dari OpenAI');
    }
  }
}
