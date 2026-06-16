let pageSections = [];
let currentSectionIndex = 0;

const MAX_SECTION_CHARS = 3500;
const MIN_BLOCK_CHARS = 30;

function cleanText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\b(Previous|Next|Feedback|Table of contents|Submit and view feedback for)\b/gi, "")
    .trim();
}

function removeUnwanted(root) {
  const unwantedSelectors = [
    "nav", "header", "footer", "aside",
    "script", "style", "noscript", "form",
    "button", "input", "select", "textarea",
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    "[aria-label*='breadcrumb' i]",
    ".navbar", ".nav", ".sidebar", ".breadcrumb",
    ".footer", ".header", ".menu",
    ".toc", ".table-of-contents",
    ".feedback", ".pagination",
    ".learn-toc", ".metadata", ".contributors"
  ];

  unwantedSelectors.forEach(selector => {
    root.querySelectorAll(selector).forEach(el => el.remove());
  });
}

function getMainContentRoot() {
  const clonedDocument = document.cloneNode(true);
  removeUnwanted(clonedDocument);

  const candidates = [
    clonedDocument.querySelector("main"),
    clonedDocument.querySelector("article"),
    clonedDocument.querySelector("[role='main']"),
    clonedDocument.querySelector("#main"),
    clonedDocument.querySelector("#content"),
    clonedDocument.querySelector(".content"),
    clonedDocument.querySelector(".main-content"),
    clonedDocument.querySelector(".markdown-body"),
    clonedDocument.querySelector(".docon"),
    clonedDocument.body
  ].filter(Boolean);

  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    if (
      candidate.innerText &&
      bestCandidate.innerText &&
      candidate.innerText.length > bestCandidate.innerText.length
    ) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function getReadableBlocks(root) {
  const selectors = [
    "h1", "h2", "h3",
    "p",
    "li",
    "blockquote",
    "pre",
    "table"
  ];

  const elements = Array.from(root.querySelectorAll(selectors.join(",")));
  const blocks = [];
  const seenTexts = new Set();

  for (const el of elements) {
    // Evita duplicar texto si el elemento está dentro de otro bloque ya capturado
    const parentReadable = el.parentElement?.closest("p, li, blockquote, pre, table");
    if (parentReadable && parentReadable !== el) {
      continue;
    }

    let text = cleanText(el.innerText);

    if (!text || text.length < MIN_BLOCK_CHARS) {
      continue;
    }

    // Evita duplicados exactos
    const normalized = text.toLowerCase();
    if (seenTexts.has(normalized)) {
      continue;
    }

    seenTexts.add(normalized);

    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      blocks.push({
        type: "heading",
        text
      });
      continue;
    }

    if (tag === "pre") {
      text = "Code block. " + text.slice(0, 1200);
    }

    if (tag === "table") {
      text = "Table. " + text.slice(0, 1500);
    }

    blocks.push({
      type: "body",
      text
    });
  }

  return blocks;
}

function buildSections() {
  const root = getMainContentRoot();
  const blocks = getReadableBlocks(root);

  if (!blocks.length) {
    const fallback = cleanText(root.innerText);
    return fallback ? [{ title: "Page", text: fallback.slice(0, MAX_SECTION_CHARS) }] : [];
  }

  const sections = [];
  let currentTitle = document.title || "Page";
  let currentText = "";

  for (const block of blocks) {
    if (block.type === "heading") {
      if (currentText.length > 0) {
        sections.push({
          title: currentTitle,
          text: currentText.trim()
        });
      }

      currentTitle = block.text;
      currentText = block.text + ". ";
      continue;
    }

    const nextText = currentText + block.text + ". ";

    if (nextText.length > MAX_SECTION_CHARS && currentText.length > 0) {
      sections.push({
        title: currentTitle,
        text: currentText.trim()
      });

      currentText = block.text + ". ";
    } else {
      currentText = nextText;
    }
  }

  if (currentText.length > 0) {
    sections.push({
      title: currentTitle,
      text: currentText.trim()
    });
  }

  return sections.filter(section => section.text.length > 80);
}

function getSectionText(index) {
  if (!pageSections.length) {
    pageSections = buildSections();
    currentSectionIndex = 0;
  }

  if (!pageSections.length) {
    return "";
  }

  currentSectionIndex = Math.max(0, Math.min(index, pageSections.length - 1));

  const section = pageSections[currentSectionIndex];

  return `Section ${currentSectionIndex + 1} of ${pageSections.length}. ${section.text}`;
}

function speakText(text, personality) {
  browser.runtime.sendMessage({
    action: "SPEAK_TEXT",
    text,
    personality: personality || "light"
  });
}

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "READ_SELECTION") {
    speakText(message.text, message.personality || "light");
  }

  if (message.action === "READ_PAGE") {
    pageSections = buildSections();
    currentSectionIndex = 0;
    speakText(getSectionText(currentSectionIndex), message.personality);
  }

  if (message.action === "READ_NEXT_SECTION") {
    speakText(getSectionText(currentSectionIndex + 1), message.personality);
  }

  if (message.action === "READ_PREVIOUS_SECTION") {
    speakText(getSectionText(currentSectionIndex - 1), message.personality);
  }
});