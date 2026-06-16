let currentAudio = null;
let isPaused = false;
let requestId = 0;

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "glados-read-selection",
    title: "Leer selección con GLAdOS Reader",
    contexts: ["selection"]
  });

  browser.contextMenus.create({
    id: "glados-read-page",
    title: "Leer primera sección importante",
    contexts: ["page"]
  });

  browser.contextMenus.create({
    id: "glados-next-section",
    title: "Leer siguiente sección",
    contexts: ["page"]
  });

  browser.contextMenus.create({
    id: "glados-previous-section",
    title: "Leer sección anterior",
    contexts: ["page"]
  });

  browser.contextMenus.create({
    id: "glados-pause",
    title: "Pausar GLAdOS Reader",
    contexts: ["page", "selection"]
  });

  browser.contextMenus.create({
    id: "glados-resume",
    title: "Reanudar GLAdOS Reader",
    contexts: ["page", "selection"]
  });

  browser.contextMenus.create({
    id: "glados-stop",
    title: "Detener GLAdOS Reader",
    contexts: ["page", "selection"]
  });
});

async function getPersonality() {
  const saved = await browser.storage.local.get("personality");
  return saved.personality || "light";
}

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const personality = await getPersonality();

  if (info.menuItemId === "glados-read-selection") {
    speakFromBackend(info.selectionText, personality);
  }

  if (info.menuItemId === "glados-read-page") {
    browser.tabs.sendMessage(tab.id, {
      action: "READ_PAGE",
      personality
    });
  }

  if (info.menuItemId === "glados-next-section") {
    browser.tabs.sendMessage(tab.id, {
      action: "READ_NEXT_SECTION",
      personality
    });
  }

  if (info.menuItemId === "glados-previous-section") {
    browser.tabs.sendMessage(tab.id, {
      action: "READ_PREVIOUS_SECTION",
      personality
    });
  }

  if (info.menuItemId === "glados-pause") {
    pauseAudio();
  }

  if (info.menuItemId === "glados-resume") {
    resumeAudio();
  }

  if (info.menuItemId === "glados-stop") {
    stopAudio();
  }
});

function pauseAudio() {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    isPaused = true;
  }
}

function resumeAudio() {
  if (currentAudio && isPaused) {
    currentAudio.play();
    isPaused = false;
  }
}

function stopAudio() {
  requestId++;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  isPaused = false;
}

async function speakFromBackend(text, personality) {
  if (!text || !text.trim()) return;

  stopAudio();

  const thisRequestId = ++requestId;

  const response = await fetch("http://127.0.0.1:5050/speak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      personality: personality || "light"
    })
  });

  if (thisRequestId !== requestId) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`);
  }

  const audioBlob = await response.blob();

  if (thisRequestId !== requestId) {
    return;
  }

  const audioUrl = URL.createObjectURL(audioBlob);

  currentAudio = new Audio(audioUrl);
  isPaused = false;

  await currentAudio.play();
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "SPEAK_TEXT") {
    return speakFromBackend(message.text, message.personality || "light");
  }

  if (message.action === "STOP_AUDIO") {
    stopAudio();
  }

  if (message.action === "PAUSE_AUDIO") {
    pauseAudio();
  }

  if (message.action === "RESUME_AUDIO") {
    resumeAudio();
  }
});