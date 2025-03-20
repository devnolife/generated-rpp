import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeminiService {
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private readonly geminiApiKey = 'AIzaSyB_YC1tD6gZGkuAdyAFLN01Dej1mKupiEI'

  constructor() {}

  async optimizePrompt(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `Perbaiki dan optimalkan prompt berikut agar lebih jelas dan terstruktur:\n\n${prompt}` }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Periksa apakah respons dari Gemini valid
      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gagal menerima respons dari Gemini API');
      }

      // Ambil teks hasil optimasi dari Gemini
      return response.data.candidates[0]?.content?.parts[0]?.text || prompt;
    } catch (error) {
      console.error('Error optimizing prompt with Gemini:', error);
      throw new Error('Terjadi kesalahan saat mengoptimalkan prompt dengan Gemini');
    }
  }
}
