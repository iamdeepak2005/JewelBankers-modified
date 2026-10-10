/**
 * JewelBankers Headless Protocol Engine (Baileys)
 * Ultra-Low Latency (~50ms - 150ms) Pure Backend WhatsApp Service
 * 
 * Features:
 * - Zero Browser / Zero GUI (no Chrome, no Puppeteer, purely binary WebSocket protocol)
 * - Single One-Time Pair (scanned once via terminal QR or browser /qr endpoint)
 * - Persistent Auth Session in ./whatsapp_auth_info/
 * - Instant HTTP POST /message/send API for Spring Boot backend
 */

const express = require('express');
const cors = require('cors');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  delay
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const AUTH_FOLDER = path.join(__dirname, 'whatsapp_auth_info');
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

let sock = null;
let currentQr = null;
let connectionState = 'DISCONNECTED';
let userJid = null;

const logger = pino({ level: 'error' });

async function startWhatsAppSocket() {
  console.log('\n======================================================');
  console.log('🔄 Initializing WhatsApp Headless Protocol Engine...');
  console.log('======================================================');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`Using WA Web Version: ${version.join('.')} (latest: ${isLatest})`);

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false, // We handle printing with qrcode-terminal explicitly
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      connectionState = 'QR_READY';
      console.log('\n======================================================');
      console.log('📱 SCAN THIS QR CODE IN WHATSAPP (LINKED DEVICES):');
      console.log('======================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n(Or view status anytime at: http://localhost:' + PORT + '/status)\n');
    }

    if (connection === 'close') {
      connectionState = 'DISCONNECTED';
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`⚠️ Connection closed. Status Code: ${statusCode}, Reason: ${lastDisconnect?.error?.message || 'Unknown'}`);

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('❌ Device logged out. Clearing auth credentials for fresh pairing...');
        try {
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          fs.mkdirSync(AUTH_FOLDER, { recursive: true });
        } catch (e) {
          console.error('Error clearing auth folder:', e);
        }
      }

      if (shouldReconnect) {
        console.log('🔁 Reconnecting in 5 seconds...');
        setTimeout(() => startWhatsAppSocket(), 5000);
      } else {
        console.log('🔁 Restarting for fresh pairing in 3 seconds...');
        setTimeout(() => startWhatsAppSocket(), 3000);
      }
    } else if (connection === 'connecting') {
      connectionState = 'CONNECTING';
      console.log('⏳ Connecting to WhatsApp servers...');
    } else if (connection === 'open') {
      connectionState = 'CONNECTED';
      currentQr = null;
      userJid = sock.user?.id || 'Connected Device';
      console.log('\n======================================================');
      console.log('✅ WhatsApp Protocol Engine Connected Successfully!');
      console.log(`📱 Paired Account: ${userJid}`);
      console.log(`⚡ Pure-Backend API Ready on: http://localhost:${PORT}/message/send`);
      console.log('======================================================\n');
    }
  });
}

/**
 * Clean phone number to valid WhatsApp JID
 * E.g., "9876543210" -> "919876543210@s.whatsapp.net"
 * "+91 98765 43210" -> "919876543210@s.whatsapp.net"
 */
function formatToJid(numberStr) {
  if (!numberStr) return null;
  let digits = String(numberStr).replace(/\D/g, '');
  if (digits.length === 10) {
    // Default country code: India (91)
    digits = '91' + digits;
  }
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  return `${digits}@s.whatsapp.net`;
}

// ---------------- REST API ENDPOINTS ---------------- //

// Health & Status
app.get('/status', (req, res) => {
  res.json({
    engine: 'Baileys Headless Protocol Engine',
    status: connectionState,
    connected: connectionState === 'CONNECTED',
    user: userJid,
    hasQrReady: connectionState === 'QR_READY',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// View QR state
app.get('/qr', (req, res) => {
  if (connectionState === 'CONNECTED') {
    return res.send('<h2>✅ WhatsApp is already connected and active!</h2>');
  }
  if (!currentQr) {
    return res.send('<h2>⏳ WhatsApp is connecting or generating QR. Refresh in a few seconds...</h2>');
  }
  // Render quick web QR helper
  res.send(`
    <html>
      <head><title>JewelBankers WhatsApp Pairing</title></head>
      <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
        <h1 style="color: #38bdf8;">JewelBankers WhatsApp Engine</h1>
        <p style="color: #94a3b8;">Scan the QR code below or in your terminal window using WhatsApp -> Linked Devices:</p>
        <div style="background: white; padding: 20px; display: inline-block; border-radius: 12px; margin-top: 20px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(currentQr)}" alt="WhatsApp QR Code" />
        </div>
        <p style="margin-top: 20px; font-size: 13px; color: #64748b;">Auto-refreshes every 20 seconds</p>
        <script>setTimeout(() => window.location.reload(), 20000);</script>
      </body>
    </html>
  `);
});

/**
 * Pure Backend High-Speed Send API
 * Accepts:
 * {
 *   "number": "919876543210", // or 10-digit mobile
 *   "message": "Text to send...", // or "text"
 *   "text": "Fallback text"
 * }
 */
app.post('/message/send', async (req, res) => {
  const startTime = Date.now();
  const { number, phone, mobileno, message, text, body } = req.body;
  const targetNumber = number || phone || mobileno;
  const messageText = message || text || body;

  if (!targetNumber) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: number (customer mobile number)'
    });
  }

  if (!messageText || !messageText.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: message text'
    });
  }

  const jid = formatToJid(targetNumber);
  if (!jid) {
    return res.status(400).json({
      success: false,
      error: `Invalid phone number format: "${targetNumber}". Must be 10 to 15 digits.`
    });
  }

  if (connectionState !== 'CONNECTED' || !sock) {
    return res.status(503).json({
      success: false,
      error: 'WhatsApp engine is not connected yet. Please link your WhatsApp account by scanning the QR code.',
      state: connectionState
    });
  }

  try {
    // Binary Protobuf send over active WebSocket
    const sentMsg = await sock.sendMessage(jid, { text: messageText.trim() });
    const latencyMs = Date.now() - startTime;

    console.log(`⚡ [SENT in ${latencyMs}ms] -> ${jid.split('@')[0]} (ID: ${sentMsg?.key?.id})`);

    return res.json({
      success: true,
      status: 'SENT',
      recipient: jid.split('@')[0],
      messageId: sentMsg?.key?.id,
      latencyMs: latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    console.error(`❌ [FAILED after ${latencyMs}ms] -> ${jid}:`, err.message);

    return res.status(500).json({
      success: false,
      error: err.message,
      latencyMs: latencyMs
    });
  }
});

// Start Express and WhatsApp socket
app.listen(PORT, () => {
  console.log(`🚀 Headless Protocol REST API listening on http://localhost:${PORT}`);
  startWhatsAppSocket().catch(err => {
    console.error('Failed to start WhatsApp socket:', err);
  });
});
