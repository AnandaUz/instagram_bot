import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 2000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const CODE_WORD = (process.env.CODE_WORD || 'START').toLowerCase();
const RESPONSE_LINK = process.env.RESPONSE_LINK;

// Страница приветствия для проверки работы сервера
app.get('/', (req, res) => {
    res.send('<h1>Instagram Bot Server is running!</h1><p>Welcome to the greeting page.</p>');
});

// Проверка Webhook (Hub Verification)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Обработка входящих сообщений
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'instagram') {
        body.entry.forEach(async (entry) => {
            if (entry.messaging && entry.messaging.length > 0) {
                const webhook_event = entry.messaging[0];
                const sender_psid = webhook_event.sender.id;

                if (webhook_event.message && webhook_event.message.text) {
                    const received_text = webhook_event.message.text.trim().toLowerCase();

                    if (received_text === CODE_WORD) {
                        await sendResponse(sender_psid, `Вот ваша ссылка: ${RESPONSE_LINK}`);
                    }
                }
            }
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Функция отправки сообщения
const sendResponse = async (sender_psid, text) => {
    const response_body = {
        recipient: { id: sender_psid },
        message: { text: text }
    };

    try {
        await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${ACCESS_TOKEN}`, response_body);
        console.log('Message sent successfully to:', sender_psid);
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
};

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
