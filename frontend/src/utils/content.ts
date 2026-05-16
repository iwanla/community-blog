type ListBlock = {
  type: "ul" | "ol";
  items: string[];
};

export function escapeHtml(value = ""): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function markdownToPlainText(value = ""): string {
  return String(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/(^|\s)(#{1,6})\s+/g, "$1")
    .replace(/(^|\n)\s*(?:[-*]|\d+\.)\s+/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function htmlToPlainText(value = ""): string {
  const template = document.createElement("template");
  template.innerHTML = sanitizeHtml(value);
  return (template.content.textContent || "").replace(/\s+/g, " ").trim();
}

export function contentToPlainText(value = ""): string {
  return looksLikeHtml(value) ? htmlToPlainText(value) : markdownToPlainText(value);
}

export function contentToHtml(value = ""): string {
  return looksLikeHtml(value) ? sanitizeHtml(value) : markdownToHtml(value);
}

export function sanitizeHtml(value = ""): string {
  const template = document.createElement("template");
  template.innerHTML = String(value || "");
  const allowedTags = new Set(["P", "BR", "STRONG", "EM", "U", "S", "A", "H2", "H3", "OL", "UL", "LI", "BLOCKQUOTE"]);
  const fragment = document.createDocumentFragment();

  Array.from(template.content.childNodes).forEach((node) => {
    const clean = sanitizeNode(node, allowedTags);
    if (clean) {
      fragment.appendChild(clean);
    }
  });

  const output = document.createElement("div");
  output.appendChild(fragment);
  return output.innerHTML;
}

export function markdownToHtml(value = ""): string {
  const lines = String(value || "").replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list: ListBlock | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) {
      return;
    }

    html.push(`<p>${renderInline(paragraph.join("\n")).replaceAll("\n", "<br>")}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) {
      return;
    }

    html.push(`<${list.type}>${list.items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^##\s+(.+)$/);
    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (heading) {
      flushParagraph();
      flushList();
      html.push(`<h2>${renderInline(heading[1])}</h2>`);
      return;
    }

    if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? "ul" : "ol";
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((unordered || ordered)[1]);
      return;
    }

    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return html.join("\n");
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

function sanitizeNode(node: ChildNode, allowedTags: Set<string>): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as Element;
  const tag = element.tagName;

  if (!allowedTags.has(tag)) {
    const fragment = document.createDocumentFragment();
    Array.from(element.childNodes).forEach((child) => {
      const clean = sanitizeNode(child, allowedTags);
      if (clean) {
        fragment.appendChild(clean);
      }
    });
    return fragment;
  }

  const clean = document.createElement(tag.toLowerCase());

  if (tag === "A") {
    const href = element.getAttribute("href") || "";
    if (/^https?:\/\//i.test(href)) {
      clean.setAttribute("href", href);
      clean.setAttribute("target", "_blank");
      clean.setAttribute("rel", "noopener");
    }
  }

  Array.from(element.childNodes).forEach((child) => {
    const cleanChild = sanitizeNode(child, allowedTags);
    if (cleanChild) {
      clean.appendChild(cleanChild);
    }
  });

  if (tag === "A" && !clean.hasAttribute("href")) {
    return document.createTextNode(clean.textContent || "");
  }

  return clean;
}

function renderInline(value: string): string {
  let html = escapeHtml(value);

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, url) => {
    const safeLabel = renderInline(label);
    const safeUrl = escapeHtml(url);
    return `<a href="${safeUrl}" target="_blank" rel="noopener">${safeLabel}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}
