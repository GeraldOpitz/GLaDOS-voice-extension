from flask import Flask, request, send_file, jsonify
from flask_cors import CORS

from personality import apply_personality
from tts import generate_audio

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "GLAdOS Reader Backend"
    })


@app.route("/speak", methods=["POST"])
def speak():
    data = request.get_json(force=True)

    text = data.get("text", "")
    personality = data.get("personality", "light")

    if not text.strip():
        return jsonify({"error": "Text is required"}), 400

    final_text = apply_personality(text, personality)
    audio_path = generate_audio(final_text)

    return send_file(
        audio_path,
        mimetype="audio/wav",
        as_attachment=False
    )


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5050,
        debug=True
    )