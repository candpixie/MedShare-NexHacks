// server.js
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

const app = express();
const port = 3000;

app.post('/getToken', async (req, res) => {
  const body = req.body;

  // If this room doesn't exist, it'll be automatically created when
  // the first participant joins
  const roomName = body.room_name ?? 'quickstart-room';
  const roomConfig = body.room_config ?? {};

  // Participant related fields. 
  // `participantIdentity` will be available as LocalParticipant.identity
  // within the livekit-client SDK
  const participantIdentity = body.participant_identity ?? 'quickstart-identity';
  const participantName = body.participant_name ?? 'quickstart-username';
  const participantMetadata = body.participant_metadata ?? '';
  const participantAttributes = body.participant_attributes ?? {};

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    metadata: participantMetadata,
    attributes: participantAttributes,

    // Token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });
  at.roomConfig = roomConfig;

  const participantToken = await at.toJwt();

  res.send({ serverURL: process.env.LIVEKIT_URL, participantToken });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});