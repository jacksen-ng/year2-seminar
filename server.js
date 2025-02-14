const express = require('express');
const path = require('path');
const callChatGPT = require('./public/js/gpt'); 

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
// Add specific route for model files
app.use('/model', express.static(path.join(__dirname, 'public', 'model')));

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/gpt-api', async (req, res) => {
    const { prompt } = req.body;

    try {
    const response = await callChatGPT(prompt);
    res.json({ message: response });
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong' });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

