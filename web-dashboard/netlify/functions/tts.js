// web-dashboard/netlify/functions/tts.js
import { EdgeTTS } from '@andresaya/edge-tts';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, voice = 'en-US-AndrewNeural', rate = '0%', pitch = '0Hz' } = JSON.parse(event.body);

    if (!text || !text.trim()) {
      return { statusCode: 400, body: 'Text is required' };
    }

    // 1. Initialize the EdgeTTS class
    const tts = new EdgeTTS();

    // 2. Use the synthesize method
    await tts.synthesize(text, voice, {
      rate: rate,
      pitch: pitch,
    });

    // 3. Export the audio to a raw buffer
    const audioBuffer = await tts.toRaw();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="audio.mp3"',
      },
      body: audioBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Synthesis failed: ' + err.message };
  }
};