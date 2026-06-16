let pageSections = [];
let currentSectionIndex = 0;

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/Previous|Next|Feedback|Table of contents/gi, "")
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
    ".feedback", ".pagination"
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
    clonedDocument.querySelector(".content"),
    clonedDocument.querySelector(".main-content"),
    clonedDocument.querySelector(".markdown-body"),
    clonedDocument.body
  ].filter(Boolean);

  let bestCandidate = candidates[0];

  for (const candidate of candidates) {
    if (candidate.innerText && candidate.innerText.length > bestCandidate.innerText.length) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

function buildSections() {
  const root = getMainContentRoot();

  const headings = Array.from(root.querySelectorAll("h1, h2, h3"))
    .filter(h => cleanText(h.innerText).length > 0);

  const sections = [];

  if (headings.length === 0) {
    const text = cleanText(root.innerText);
    return text ? [{ title: document.title || "Page", text }] : [];
  }

  headings.forEach((heading, index) => {
    const title = cleanText(heading.innerText);
    let textParts = [title];

    let node = heading.nextElementSibling;

    while (node && !["H1", "H2", "H3"].includes(node.tagName)) {
      const part = cleanText(node.innerText || "");

      if (part.length > 40) {
        textParts.push(part);
      }

      node = node.nextElementSibling;
    }

    const text = cleanText(textParts.join(". "));

    if (text.length > 80) {
      sections.push({
        title,
        text
      });
    }
  });

  return sections;
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