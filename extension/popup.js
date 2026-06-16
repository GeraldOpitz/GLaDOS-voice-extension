document.addEventListener("DOMContentLoaded", async () => {
  const saved = await browser.storage.local.get("personality");
  const personalitySelect = document.getElementById("personality");

  personalitySelect.value = saved.personality || "light";

  personalitySelect.addEventListener("change", async () => {
    await browser.storage.local.set({
      personality: personalitySelect.value
    });
  });
});

document.getElementById("read").addEventListener("click", async () => {
  const text = document.getElementById("text").value;
  const personality = document.getElementById("personality").value;

  await browser.storage.local.set({ personality });

  browser.runtime.sendMessage({
    action: "SPEAK_TEXT",
    text,
    personality
  });
});

document.getElementById("pause").addEventListener("click", () => {
  browser.runtime.sendMessage({
    action: "PAUSE_AUDIO"
  });
});

document.getElementById("resume").addEventListener("click", () => {
  browser.runtime.sendMessage({
    action: "RESUME_AUDIO"
  });
});

document.getElementById("stop").addEventListener("click", () => {
  browser.runtime.sendMessage({
    action: "STOP_AUDIO"
  });
});