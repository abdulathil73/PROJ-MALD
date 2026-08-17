"""
Deepgram Speech-to-Text (STT) Integration Module.
Transcribes voice audio streams/files using Deepgram API.
Includes preset audio fallback for easy testing when API key is pending.
"""

import os
import httpx
from typing import Dict, Any, Optional

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")

def transcribe_audio_bytes(audio_bytes: bytes, content_type: str = "audio/webm") -> Dict[str, Any]:
    """
    Transcribes raw audio bytes using Deepgram Nova-2 / Nova-3 speech recognition API.
    """
    api_key = os.getenv("DEEPGRAM_API_KEY") or DEEPGRAM_API_KEY
    if not api_key:
        return {
            "status": "FALLBACK_USED",
            "message": "DEEPGRAM_API_KEY not set in .env. Using audio transcript fallback mechanism.",
            "transcript": "Sell 5 kg Basmati Rice to Customer A",
        }

    url = (
        "https://api.deepgram.com/v1/listen?"
        "model=nova-3"
        "&smart_format=true"
        "&punctuate=true"
        "&numerals=true"
        "&dictation=true"
        "&keywords=Basmati:3,Rice:3,Sunflower:3,Oil:3,Cumin:3,Turmeric:3,Cardamom:3,Cloves:3,Cinnamon:3,Pepper:3,Spice:3,Sugar:3,Flour:3,Godown:3,Warehouse:3,Invoice:3,Bill:3,Customer:3,Supplier:3,pista:3,cashew:3,raisin:3,almond:3,Rate:3,GST:3"
    )
    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": content_type
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(url, headers=headers, content=audio_bytes)
            
        if response.status_code == 200:
            data = response.json()
            channels = data.get("results", {}).get("channels", [])
            if channels and len(channels) > 0:
                transcript = channels[0].get("alternatives", [{}])[0].get("transcript", "")
                confidence = channels[0].get("alternatives", [{}])[0].get("confidence", 0.0)
                return {
                    "status": "SUCCESS",
                    "transcript": transcript,
                    "confidence": confidence,
                    "raw_response": data
                }
            return {"status": "ERROR", "message": "No transcript detected in audio."}
        else:
            return {
                "status": "ERROR",
                "message": f"Deepgram API error ({response.status_code}): {response.text}"
            }
    except Exception as e:
        return {
            "status": "ERROR",
            "message": f"Failed to connect to Deepgram: {str(e)}"
        }

def get_preset_transcripts() -> Dict[str, str]:
    """Returns sample voice input transcripts for quick UI testing."""
    return {
        "sample_1": "Bill 10 bags of Premium Royal Basmati Rice and 5 tins of Sunflower Oil to Customer City Mart on Credit.",
        "sample_2": "Purchase 50 Sugar Sacks from Supplier Global Spice Distributors at 1200 per sack into Godown C.",
        "sample_3": "Sell 15 kg of Green Cardamom and 20 kg of Organic Cumin Seeds to Maldives Grand Resort.",
        "sample_4": "Quote 30 Wheat Flour bags and 10 Black Pepper sacks to Island Wholesale Traders."
    }
