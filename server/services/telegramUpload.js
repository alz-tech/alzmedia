const { getClient } = require('../config/telegram');
const { Api }       = require('telegram');
const fs            = require('fs');
const path          = require('path');

const CHANNEL_ID = BigInt(process.env.TELEGRAM_CHANNEL_ID);

/**
 * Upload a file buffer to the Telegram channel
 * Returns { file_id, file_url }
 */
async function uploadToTelegram(fileBuffer, filename, mimeType) {
  const client = await getClient();

  const ext       = path.extname(filename);
  const isVideo   = mimeType.startsWith('video/');
  const isImage   = mimeType.startsWith('image/');

  // Write buffer to temp file
  const tmpPath = `/tmp/${Date.now()}${ext}`;
  fs.writeFileSync(tmpPath, fileBuffer);

  try {
    let message;

    if (isImage) {
      message = await client.sendFile(CHANNEL_ID, {
        file:    tmpPath,
        caption: `AlzMedia Ad Creative | ${filename}`,
        forceDocument: false,
      });
    } else if (isVideo) {
      message = await client.sendFile(CHANNEL_ID, {
        file:       tmpPath,
        caption:    `AlzMedia Ad Video | ${filename}`,
        attributes: [new Api.DocumentAttributeVideo({ supportsStreaming: true, w: 1280, h: 720, duration: 0 })],
      });
    } else {
      message = await client.sendFile(CHANNEL_ID, {
        file:    tmpPath,
        caption: `AlzMedia File | ${filename}`,
        forceDocument: true,
      });
    }

    const fileId = message?.media?.photo?.id?.toString()
      || message?.media?.document?.id?.toString()
      || null;

    const fileUrl = `${process.env.SERVER_URL}/api/ad/media/${message.id}`;

    return { file_id: fileId, file_url: fileUrl, message_id: message.id };
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

/**
 * Stream a Telegram file by message ID to an HTTP response
 */
async function streamFromTelegram(messageId, res) {
  const client = await getClient();

  const [message] = await client.getMessages(CHANNEL_ID, { ids: [parseInt(messageId)] });
  if (!message) throw new Error('Media not found');

  const buffer = await client.downloadMedia(message, { progressCallback: () => {} });

  const mimeType = message.media?.document?.mimeType
    || message.media?.photo ? 'image/jpeg' : 'application/octet-stream';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(buffer);
}

module.exports = { uploadToTelegram, streamFromTelegram };
