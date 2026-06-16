import subprocess
import tempfile
import os


GLADOS_PATH = r"C:\Users\GeraldOpitz\Documents\GLaDOS-TTS"

PYTHON_EXE = os.path.join(
    GLADOS_PATH,
    ".venv",
    "Scripts",
    "python.exe"
)

SPEAK_SCRIPT = os.path.join(
    GLADOS_PATH,
    "speak.py"
)


def generate_audio(text):

    output = os.path.join(
        tempfile.gettempdir(),
        "glados_output.wav"
    )

    if os.path.exists(output):
        os.remove(output)

    cmd = [
        PYTHON_EXE,
        SPEAK_SCRIPT,
        "--text",
        text,
        "--output",
        output,
        "--quiet"
    ]

    subprocess.run(
        cmd,
        check=True
    )

    return output