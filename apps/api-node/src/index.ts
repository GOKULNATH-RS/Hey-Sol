import express from 'express';

const app = express();
const PORT = 3002;

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello, world!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});