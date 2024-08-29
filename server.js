import express from 'express';
import { makeWASocket, useSingleFileAuthState, DisconnectReason } from 'maher-zubair-baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

// Initialize WhatsApp socket
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
const sock = makeWASocket({
    auth: state
});

// Save the authentication state to avoid QR code scanning on every restart
sock.ev.on('creds.update', saveState);

sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;
    if (qr) {
        QRCode.toDataURL(qr, (err, url) => {
            console.log('Scan this QR code to connect:', url);
        });
    }

    if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error instanceof Boom && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed. Reconnecting:', shouldReconnect);
        if (shouldReconnect) {
            connectToWhatsApp();
        }
    } else if (connection === 'open') {
        console.log('Connection opened successfully!');
    }
});

// Serve static files
app.use(express.static('public'));

// Route to serve the webpage
app.get('/', (req, res) => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Generate session ID and send it to the connected WhatsApp number
app.post('/generate-session-id', async (req, res) => {
    const sessionID = 'AbraXas:' + Math.random().toString(36).substring(2, 34);
    // Send the session ID via WhatsApp (assuming you've set up the necessary logic to send messages)
    const chatId = req.body.phoneNumber + '@s.whatsapp.net';
    await sock.sendMessage(chatId, { text: `Connection successful! Your session ID: ${sessionID}` });
    res.json({ sessionID });
});
