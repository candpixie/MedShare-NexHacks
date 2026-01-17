const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');

const OpenAI = require("openai");
require("dotenv").config();

const openrouter = new OpenAI({
  apiKey: process.env.KEY_OPENROUTER,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "MedShare-NexHacks"
  }
});

const NEWS_API_KEY = process.env.NEWS_API_KEY;
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

async function callGemini(prompt) {
  const completion = await openrouter.chat.completions.create({
    model: "google/gemini-2.5-pro", // ← Gemini, but via OpenRouter
    messages: [
      {
        role: "system",
        content: "You are a medical supply chain analyst."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2
  });

  return completion.choices[0].message.content;
}

router.get('/health-inventory-analysis', async (req, res) => {
    try {
        // Step 1: Fetch all health news
        const articles = await fetchHealthNews();
        console.log('Fetched articles:', articles);

        // Step 2: Prepare system prompt for Gemini
        const systemPrompt = `
You are a medical supply chain analyst.

Analyze the following health news articles for relevance to medical inventory demand forecasting.
For each article, respond with JSON containing:
- "title": the article title
- "relevant": true/false
- "reason": short explanation if relevant

Articles:
${JSON.stringify(articles, null, 2)}
        `;

        // Step 3: Send entire news list to Gemini
        const geminiResponse = await callGemini(systemPrompt);
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