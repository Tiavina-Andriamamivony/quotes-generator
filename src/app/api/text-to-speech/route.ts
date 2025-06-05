import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, voice = "Rachel" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + getVoiceId(voice), {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs API error:", errorText)
      return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 })
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Error generating speech:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getVoiceId(voiceName: string): string {
  const voices = {
    Rachel: "21m00Tcm4TlvDq8ikWAM",
    Drew: "29vD33N1CtxCmqQRPOHJ",
    Clyde: "2EiwWnXFnvU5JabPnv8n",
    Paul: "5Q0t7uMcjvnagumLfvZi",
    Domi: "AZnzlk1XvdvUeBnXmlld",
    Dave: "CYw3kZ02Hs0563khs1Fj",
    Fin: "D38z5RcWu1voky8WS1ja",
    Sarah: "EXAVITQu4vr4xnSDxMaL",
    Antoni: "ErXwobaYiN019PkySvjV",
    Thomas: "GBv7mTt0atIp3Br8iCZE",
  }
  return voices[voiceName as keyof typeof voices] || voices.Rachel
}
