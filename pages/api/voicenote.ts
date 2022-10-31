import type { NextApiRequest, NextApiResponse } from 'next';
import * as banana from '@banana-dev/banana-dev';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const {
    BANANA_API_KEY: bananaApiKey,
    BANANA_MODEL_KEY: modelKey,
    CONNECTLY_API_KEY: connectlyApiKey,
    CONNECTLY_BUSINESS_ID: businessId,
    WHATSAPP_NUMBER: aiNUmber
  } = process.env;

  if (
    !bananaApiKey ||
    !modelKey ||
    !connectlyApiKey ||
    !businessId ||
    !aiNUmber
  ) {
    console.log('ERROR -->> no env variables');
    return res.status(500).json({ error: 'No env variables' });
  }

  console.log('Received', req.body);
  const userNumber = req.body.sender.id;
  const typeOfMedia = req.body.message.attachments[0]?.type || 'not audio';

  if (typeOfMedia !== 'audio') {
    console.log('ERROR -->> not audio');

    await axios.post(
      `https://api.connectly.ai/v1/businesses/${businessId}/send/messages`,
      {
        sender: {
          id: aiNUmber,
          channelType: 'whatsapp'
        },
        recipient: {
          id: userNumber,
          channelType: 'whatsapp'
        },
        message: {
          text: 'You can only send audio files'
        }
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': connectlyApiKey
        }
      }
    );

    res.status(400).json({ error: 'Not audio' });
  }

  await axios.post(
    `https://api.connectly.ai/v1/businesses/${businessId}/send/messages`,
    {
      sender: {
        id: aiNUmber,
        channelType: 'whatsapp'
      },
      recipient: {
        id: userNumber,
        channelType: 'whatsapp'
      },
      message: {
        text: 'Your request has been received. Please give us a a minute or two to process your request.'
      }
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': connectlyApiKey
      }
    }
  );

  const audio = req.body.message.attachments[0].url;

  let result: any = await axios
    .get(audio, {
      responseType: 'arraybuffer'
    })
    .then((response: any) =>
      // @ts-ignore
      new Buffer.from(response.data, 'binary').toString('base64')
    );

  console.log('result length', (result.length - 814) / 1.37);

  const output: any = await banana
    .run(bananaApiKey, modelKey, { mp3BytesString: result })
    .catch((error) => console.error('Error =>', error));

  console.log('Output =>', output);

  if (!output || !output.modelOutputs || !output.modelOutputs[0].text) {
    console.log('ERROR -->> no output');
    return res.status(500).json({ error: 'No output' });
  }

  console.log();

  let message = `Your request has been processed. Here is the text we extracted from your audio file:\n\n${output.modelOutputs[0].text}`;
  const numberOfMessagesToSend = message.length / 1010 + 1;
  console.log('number of messages to send', numberOfMessagesToSend);
  const messagesToSend = [];
  for (let i = 0; i < numberOfMessagesToSend; i++) {
    messagesToSend.push(message.substring(1010 * (i - 1), 1010 * i));
  }

  console.log('messages to send', messagesToSend);

  for (let i = 0; i < messagesToSend.length; i++) {
    await axios.post(
      `https://api.connectly.ai/v1/businesses/${businessId}/send/messages`,
      {
        sender: {
          id: aiNUmber,
          channelType: 'whatsapp'
        },
        recipient: {
          id: userNumber,
          channelType: 'whatsapp'
        },
        message: {
          text: `Part ${i + 1} of ${messagesToSend.length}\n\n\n${
            messagesToSend[i]
          }`
        }
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-API-Key': connectlyApiKey
        }
      }
    );
  }
  res.status(200).json({ message: output });
}
