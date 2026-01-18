const NewsAPI = require('newsapi');
const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const OpenAI = require("openai");
require("dotenv").config();


// const openrouter = new OpenAI({
//   apiKey: process.env.KEY_OPENROUTER,
//   baseURL: "https://openrouter.ai/api/v1",
//   defaultHeaders: {
//     "HTTP-Referer": "http://localhost:3000",
//     "X-Title": "MedShare-NexHacks"
//   }
// });

// The client gets the API key from the environment variable `GEMINI_API_KEY`.

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize clients only if API keys are available
let newsapi = null;
let ai = null;

if (NEWS_API_KEY) {
  const NewsAPI = require('newsapi');
  newsapi = new NewsAPI(NEWS_API_KEY);
} else {
  console.warn('NEWS_API_KEY not configured - news endpoints will be unavailable');
}

if (GEMINI_API_KEY) {
  const { GoogleGenAI } = require("@google/genai");
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
  console.warn('GEMINI_API_KEY not configured - AI analysis will be unavailable');
}

async function fetchHealthNews() {
    if (!newsapi) {
      throw new Error('News API not configured. Set NEWS_API_KEY in .env file.');
    }
    const res = await newsapi.v2.topHeadlines({
      category: 'health',
      language: 'en',
      country: 'us'
    });
    return res;
}

// async function callGemini(prompt) {

//     const res = await openRouter.chat.send({
//     model: 'google/gemini-2.5-pro',
//     messages: [
//         {
//         role: 'user',
//         content: prompt,
//         },
//     ],
//     stream: false,
//     });

//     console.log(res)
//     return res; // ✅ THIS is what you parse later
// }

// async function callGemini(prompt) {
//   const completion = await openrouter.chat.completions.create({
//     model: "google/gemini-2.5-pro", // ← Gemini, but via OpenRouter
//     messages: [
//       {
//         role: "system",
//         content: "You are a medical supply chain analyst."
//       },
//       {
//         role: "user",
//         content: prompt
//       }
//     ],
//     temperature: 0.2
//   });

//   return completion.choices[0].message.content;
// }


async function Gemini(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
async function callGemini(prompt) {
    if (!ai) {
      throw new Error('Gemini API not configured. Set GEMINI_API_KEY in .env file.');
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    console.log(response);
    return response;
}


router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const base64Image = req.file.buffer.toString('base64');
    console.log('Image received, size:', base64Image);

    const contents = [
      {
        inlineData: {
          mimeType: req.file.mimetype || 'image/jpeg',
          data: base64Image,
        },
      },
      { text: 'Analyze this drug label image. Extract: drug name, NDC code, strength/dosage, quantity, lot number, and expiration date. Return as structured data.' },
    ];

    console.log('Sending to Gemini...');
    const geminiResponse = await Gemini(contents);

    console.log('Gemini response:', geminiResponse);

    res.json({
      id: Date.now().toString(),
      analysis: geminiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in /image route:', err);
    res.status(500).json({ error: 'Failed to process image: ' + err.message });
  }
});


router.get('/generate-insights', async (req, res) => {
  try {
    console.log('Generating AI insights...');

    const prompt = `
You are a medical supply chain analytics expert. Based on typical pharmacy inventory patterns, 
provide 3 actionable insights for hospital pharmacy management:

1. Order optimization recommendations
2. Waste reduction opportunities  
3. Compliance and safety alerts

Format the response as a numbered list with brief, practical insights.
    `;

    const geminiResponse = await Gemini(prompt);

    res.json({
      insights: geminiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in /generate-insights:', err);
    res.status(500).json({ error: 'Failed to generate insights: ' + err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Optional: You can include a system instruction to make Gemini act like a support bot
    const systemPrompt = `
You are MedShare's support assistant. Answer user questions clearly, politely, 
and provide helpful guidance related to medical inventory, reports, and hospital operations.

User: ${prompt}
    `;

    const geminiResponse = await Gemini(systemPrompt);

    res.json({ text: geminiResponse });
  } catch (err) {
    console.error('Error in /chat:', err);
    res.status(500).json({ error: 'Failed to get response from Gemini.' });
  }
});


router.get('/health-inventory-analysis', async (req, res) => {
    try {
        // Step 1: Fetch all health news
        const articles = await fetchHealthNews();
        console.log('Fetched articles:', articles);

        // Step 2: Prepare system prompt for Gemini
        const systemPrompt = `
You are a medical supply chain analyst.
Analyze the following health news articles for relevance to medical inventory demand forecasting. If an article is relevant, write a one to two sentence summary. Output in bullet point format. 

Articles:
${JSON.stringify(articles, null, 2)}
        `;

        // Step 3: Send entire news list to Gemini
        const geminiResponse = await Gemini(systemPrompt);
        console.log('Gemini response:', geminiResponse);

        res.json({
            analysis: geminiResponse
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to analyze health news' });
    }
});

module.exports = router;
