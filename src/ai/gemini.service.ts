import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly geminiApiUrlV1 = process.env.GEMINI_API_URL_V1;
  private readonly geminiApiUrlV2 = process.env.GEMINI_API_URL_V2;
  private readonly geminiApiUrlV3 = process.env.GEMINI_API_URL_V3;
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  constructor() {}

  getTokenUsage() {
    return { ...this.tokenUsage };
  }

  resetTokenUsage() {
    this.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  // Estimate token count - approximately 4 characters per token for English text
  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Default method - uses GuruPintarV1
  async optimizePrompt(prompt: string): Promise<string> {
    return this.GuruPintarV1(prompt);
  }

  async GuruPintarV1(prompt: string): Promise<string> {
    try {
      // Estimate prompt tokens before sending
      const promptTokens = this.estimateTokenCount(prompt);
      
      const response = await axios.post(
        `${this.geminiApiUrlV1}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${prompt}` }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gagal menerima respons dari Gemini API');
      }

      const result = response.data.candidates[0]?.content?.parts[0]?.text || prompt;
      
      // Estimate completion tokens
      const completionTokens = this.estimateTokenCount(result);
      
      // Update token usage
      this.tokenUsage.promptTokens += promptTokens;
      this.tokenUsage.completionTokens += completionTokens;
      this.tokenUsage.totalTokens += (promptTokens + completionTokens);
      
      // Log token usage
      console.log('Gemini token usage estimate:', {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      });

      return result;
    } catch (error) {
      console.error('Error optimizing prompt with Gemini:', error);
      throw new Error('Terjadi kesalahan saat mengoptimalkan prompt dengan Gemini');
    }
  }

  async GuruPintarV2(prompt: string): Promise<string> {
    try {
      // Estimate prompt tokens before sending
      const promptTokens = this.estimateTokenCount(prompt);
      
      const response = await axios.post(
        `${this.geminiApiUrlV2}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${prompt}` }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gagal menerima respons dari Gemini API');
      }

      const result = response.data.candidates[0]?.content?.parts[0]?.text || prompt;
      
      // Estimate completion tokens
      const completionTokens = this.estimateTokenCount(result);
      
      // Update token usage
      this.tokenUsage.promptTokens += promptTokens;
      this.tokenUsage.completionTokens += completionTokens;
      this.tokenUsage.totalTokens += (promptTokens + completionTokens);
      
      // Log token usage
      console.log('Gemini token usage estimate:', {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      });

      return result;
    } catch (error) {
      console.error('Error optimizing prompt with Gemini:', error);
      throw new Error('Terjadi kesalahan saat mengoptimalkan prompt dengan Gemini');
    }
  }
  
  async GuruPintarV3(prompt: string): Promise<string> {
    try {
      // Estimate prompt tokens before sending
      const promptTokens = this.estimateTokenCount(prompt);
      
      const response = await axios.post(
        `${this.geminiApiUrlV3}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${prompt}` }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gagal menerima respons dari Gemini API');
      }

      const result = response.data.candidates[0]?.content?.parts[0]?.text || prompt;
      
      // Estimate completion tokens
      const completionTokens = this.estimateTokenCount(result);
      
      // Update token usage
      this.tokenUsage.promptTokens += promptTokens;
      this.tokenUsage.completionTokens += completionTokens;
      this.tokenUsage.totalTokens += (promptTokens + completionTokens);
      
      // Log token usage
      console.log('Gemini token usage estimate:', {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      });

      return result;
    } catch (error) {
      console.error('Error optimizing prompt with Gemini:', error);
      throw new Error('Terjadi kesalahan saat mengoptimalkan prompt dengan Gemini');
    }
  }
}
