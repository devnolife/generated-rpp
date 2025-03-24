import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;

  constructor() {}

  async optimizePrompt(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
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

      return response.data.candidates[0]?.content?.parts[0]?.text || prompt;
    } catch (error) {
      console.error('Error optimizing prompt with Gemini:', error);
      throw new Error('Terjadi kesalahan saat mengoptimalkan prompt dengan Gemini');
    }
  }
}
