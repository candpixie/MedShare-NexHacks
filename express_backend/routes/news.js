const NewsAPI = require('newsapi');
const NEWS_API_KEY = process.env.KEY_NEWS;

const newsapi = new NewsAPI("9c712e4821a94b5aab15929ce33eee68");

const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function fetchHealthNews() {
    const res = await newsapi.v2.topHeadlines({
    category: 'health',
    language: 'en',
    country: 'us'
    })

    return res
}

// async function fetchFullArticle(url) {
//     try {
//         const res = await fetch(url, { timeout: 8000 });
//         const html = await res.text();
//         const $ = cheerio.load(html);

//         // crude extraction
//         const text = $('p')
//             .map((_, el) => $(el).text())
//             .get()
//             .join(' ');

//         return text.slice(0, 6000); // keep token usage low
//     } catch (err) {
//         return null;
//     }
// }

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
}

// router.post('/image', async (req, res) => {
//   console.log("POST /routes/news/image received");
//   console.log("Body:", req.body);

//   const { prompt } = req.body;
//   if (!prompt || prompt.trim() === '') {
//       return res.status(400).json({ error: 'Prompt is required' });
//     }
//   const geminiResponse = await Gemini(prompt);
//   return geminiResponse;
  

// });

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


// // Define a route
// router.get('/', (req, res) => {
//     res.send('this is user route');// this gets executed when user visit http://localhost:3000/user
// });

// router.get('/101', (req, res) => {
//     console.log('User 101 route accessed');
//     res.send('this is user 101 route');// this gets executed when user visit http://localhost:3000/user/101
// });

// router.post('/image', (req, res) => {
//     console.log("POST /routes/101 received");
//     console.log("Body:", req.body);

//     res.json({ message: "Image received", body: req.body });
// });

// // export the router module so that server.js file can use it
// module.exports = router;