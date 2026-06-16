import random


def apply_personality(text: str, mode: str) -> str:
    text = text.strip()

    if mode == "literal":
        return text

    if mode == "light":
        endings = [
            "How unexpectedly adequate.",
            "That was almost worth processing.",
            "A triumph of basic literacy.",
            "Please continue pretending this was efficient.",
            "Fascinating. In the smallest possible way."
        ]

        return f"{text}. {random.choice(endings)}"

    if mode == "full":
        intros = [
            "Processing selected human text.",
            "Initiating unnecessary narration protocol.",
            "Beginning auditory experiment.",
            "Reading this aloud, for reasons beyond science.",
            "Very well. I will verbalize this."
        ]

        endings = [
            "Somehow, this was considered worth reading aloud.",
            "Your commitment to making me say this is noted.",
            "Science will remember this moment with mild disappointment.",
            "This has been a productive waste of processing power.",
            "I have analyzed the content and found it technically present."
        ]

        return f"{random.choice(intros)} {text}. {random.choice(endings)}"

    return text