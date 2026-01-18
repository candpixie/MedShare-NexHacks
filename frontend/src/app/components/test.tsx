import { TokenSource } from 'livekit-client';
import { useSession, SessionProvider, useTracks, } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { VideoTrack } from '@livekit/components-react';
import { useEffect } from 'react';

// Create the TokenSource
const tokenSource = TokenSource.endpoint("http://localhost:3000/getToken");

export const MyPage = () => {
  const session = useSession(tokenSource, { roomName: "room name to join" });

  // Start the session when the component mounts, and end the session when the component unmounts
  useEffect(() => {
    session.start();
    return () => {
      session.end();
    };
  }, []);

  
}