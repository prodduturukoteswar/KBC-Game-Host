const express = require('express');
const QRCode = require('qrcode');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = [];
let questions = [
  { question: "What is the capital of France?", answer: "Paris" },
  { question: "What is 5 + 5?", answer: "10" },
  { question: "What is the largest planet in our solar system?", answer: "Jupiter" },
  { question: "What is the chemical symbol for water?", answer: "H2O" },
  { question: "Who wrote 'Hamlet'?", answer: "Shakespeare" }
];

let currentQuestionIndex = 0;

app.use(express.static('public'));

app.get('/qr', async (req, res) => {
  const url = 'http://localhost:3000/player'; // Adjust for production
  const qrCode = await QRCode.toDataURL(url);
  res.send(`<img src="${qrCode}"/>`);
});

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'join') {
      players.push({ name: data.name });
      if (currentQuestionIndex < questions.length) {
        ws.send(JSON.stringify({ question: questions[currentQuestionIndex].question }));
      }
    }
    if (data.type === 'answer') {
      const player = players.find(p => p.name === data.name);
      if (player) {
        if (data.answer === questions[currentQuestionIndex].answer) {
          ws.send(JSON.stringify({ result: 'correct', name: player.name }));
          currentQuestionIndex++;
          if (currentQuestionIndex < questions.length) {
            wss.clients.forEach(client => client.send(JSON.stringify({ question: questions[currentQuestionIndex].question })));
          }
        } else {
          ws.send(JSON.stringify({ result: 'wrong' }));
        }
      }
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
