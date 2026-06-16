import os
import tempfile
import pyttsx3


def generate_audio(text: str) -> str:
    output_path = os.path.join(
        tempfile.gettempdir(),
        "glados_reader_output.wav"
    )

    engine = pyttsx3.init()
    engine.setProperty("rate", 145)
    engine.setProperty("volume", 1.0)

    voices = engine.getProperty("voices")

    # Intenta elegir una voz femenina si existe
    for voice in voices:
        name = voice.name.lower()
        if "zira" in name or "female" in name:
            engine.setProperty("voice", voice.id)
            break

    engine.save_to_file(text, output_path)
    engine.runAndWait()

    return output_path