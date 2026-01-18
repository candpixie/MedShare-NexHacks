require('dotenv').config();

const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');

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