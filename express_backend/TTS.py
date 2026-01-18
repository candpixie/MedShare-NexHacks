from livekit import agents, rtc
from livekit.agents import AgentServer
from livekit.agents.tts import SynthesizedAudio
from livekit.plugins import cartesia
from typing import AsyncIterable


server = AgentServer()

@server.rtc_session()
async def my_agent(ctx: agents.JobContext):

    async def text_generator():
        yield "Hello there."
        yield "This is a LiveKit text to speech agent."

    text_stream: AsyncIterable[str] = text_generator()

    audio_source = rtc.AudioSource(44100, 1)

    track = rtc.LocalAudioTrack.create_audio_track("agent-audio", audio_source)
    await ctx.room.local_participant.publish_track(track)

    tts = cartesia.TTS(model="sonic-english")
    tts_stream = tts.stream()

    # create a task to consume and publish audio frames
    ctx.create_task(send_audio(tts_stream))

    # push text into the stream, TTS stream will emit audio frames along with events
    # indicating sentence (or segment) boundaries.
    async for text in text_stream:
        tts_stream.push_text(text)
    tts_stream.end_input()

    async def send_audio(audio_stream: AsyncIterable[SynthesizedAudio]):
        async for a in audio_stream:
            await audio_source.capture_frame(a.audio.frame)

if __name__ == "__main__":
    agents.cli.run_app(server)