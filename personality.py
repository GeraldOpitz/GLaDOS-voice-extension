def apply_personality(text: str, mode: str) -> str:
    text = text.strip()

    if mode == "literal":
        return text

    if mode == "light":
        return f"{text}. How unexpectedly adequate."

    if mode == "full":
        return (
            "Processing selected human text. "
            f"{text}. "
            "Fascinating. Somehow, this was considered worth reading aloud."
        )

    return text