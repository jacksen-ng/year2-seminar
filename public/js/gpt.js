const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

async function callChatGPT(userInput) {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
    };

    const systemMessage = `Please follow these rules when analyzing the user's sentence:
1) If there is a special word in the sentence, pull out the special word.
2) Special words: Dribble, Jump Shot, Defense, CloseScreen, cube, sphere, cylinder, cone, torus.
3) Just answer the word you pulled out.
4) Don't give answers that are not related to this sentence.
5) The answer should be without ','.
6) The answer without any space.
7) If the special word isn't in English, please translate it into English.
8) For shapes, respond with exactly: cube, sphere, cylinder, cone, or torus.
9) If you see words like "create", "make", "give me" followed by a shape name, return that shape name.`;

    const data = {
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userInput },
        ],
        max_tokens: 200
    };

    try {
        const response = await axios.post(url, data, { headers });
        const result = response.data.choices[0].message.content;
        return result;
    } catch (error) {
        console.error("Error calling ChatGPT API:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = callChatGPT;
