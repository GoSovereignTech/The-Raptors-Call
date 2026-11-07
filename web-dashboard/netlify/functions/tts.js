// web-dashboard/netlify/functions/tts.js
import { Communicate } from '@andresaya/edge-tts';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, voice = 'en-US-AndrewNeural', rate = '0%', pitch = '0Hz' } = JSON.parse(event.body);

    if (!text || !text.trim()) {
      return { statusCode: 400, body: 'Text is required' };
    }

    const communicate = new Communicate(text, {
      voice,
      rate,
      pitch,
    });

    const chunks = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio') {
        chunks.push(chunk.data);
      }
    }

    const audioBuffer = Buffer.concat(chunks);

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