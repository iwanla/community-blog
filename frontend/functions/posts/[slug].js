const DEFAULT_PRODUCTION_API = "https://jelajah-blog-api.iwanlaudin01.workers.dev";
const DEFAULT_SHARE_IMAGE = "/assets/img/logo.png";
const SITE_NAME = "JelajahTaliabu";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function absoluteUrl(value, origin) {
  return new URL(value || DEFAULT_SHARE_IMAGE, origin).toString();
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function excerpt(post) {
  const text = stripHtml(post.excerpt || post.content || "");
  return text.length > 160 ? `${text.slice(0, 160).trimEnd()}...` : text;
}

function imageMimeType(imageUrl) {
  const pathname = new URL(imageUrl).pathname.toLowerCase();
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (pathname.endsWith(".webp")) {
    return "image/webp";
  }
  return "image/png";
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}\n</head>`);
}

function setMeta(html, attribute, key, content) {
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`, "i");
  return replaceTag(html, pattern, tag);
}

function setCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  return replaceTag(html, /<link\s+rel="canonical"[^>]*>/i, tag);
}

function setJsonLd(html, schema) {
  const tag = `<script type="application/ld+json" id="structured-data">${JSON.stringify(schema)}</script>`;
  return replaceTag(html, /<script\s+type="application\/ld\+json"\s+id="structured-data"[^>]*>[\s\S]*?<\/script>/i, tag);
}

async function getPost(env, slug) {
  const apiBaseUrl = env.VITE_API_BASE_URL || DEFAULT_PRODUCTION_API;
  const url = new URL(`/api/posts/${encodeURIComponent(slug)}`, apiBaseUrl);
  const response = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!response.ok) {
    return null;
  }

  const result = await response.json().catch(() => ({}));
  return result.data || null;
}

function injectArticleMeta(html, requestUrl, post) {
  const url = new URL(requestUrl);
  url.hash = "";

  const title = `${post.title || SITE_NAME} - ${SITE_NAME}`;
  const description = excerpt(post) || "Baca cerita, wisata, budaya, kuliner, dan kabar warga dari Pulau Taliabu.";
  const image = absoluteUrl(post.coverImageUrl || post.image_url || DEFAULT_SHARE_IMAGE, url.origin);
  const publishedAt = post.createdAt || post.created_at || "";
  const modifiedAt = post.approvedAt || post.approved_at || publishedAt;
  const author = post.authorName || post.author_name || "";
  const category = post.category || "";

  let output = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  output = setMeta(output, "name", "description", description);
  output = setMeta(output, "property", "og:title", title);
  output = setMeta(output, "property", "og:description", description);
  output = setMeta(output, "property", "og:type", "article");
  output = setMeta(output, "property", "og:url", url.toString());
  output = setMeta(output, "property", "og:image", image);
  output = setMeta(output, "property", "og:image:secure_url", image);
  output = setMeta(output, "property", "og:image:type", imageMimeType(image));
  output = setMeta(output, "property", "og:image:alt", post.title || SITE_NAME);
  output = setMeta(output, "property", "article:published_time", publishedAt);
  output = setMeta(output, "property", "article:modified_time", modifiedAt);
  output = setMeta(output, "property", "article:author", author);
  output = setMeta(output, "property", "article:section", category);
  output = setMeta(output, "name", "twitter:title", title);
  output = setMeta(output, "name", "twitter:description", description);
  output = setMeta(output, "name", "twitter:image", image);
  output = setMeta(output, "name", "twitter:image:alt", post.title || SITE_NAME);
  output = setCanonical(output, url.toString());
  output = setJsonLd(output, {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description,
    image,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    author: { "@type": "Person", name: author || "Kontributor JelajahTaliabu" },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl(DEFAULT_SHARE_IMAGE, url.origin) },
    },
    mainEntityOfPage: url.toString(),
    articleSection: category,
    inLanguage: url.searchParams.get("lang") === "en" ? "en" : "id",
  });

  return output;
}

export async function onRequestGet(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  const slug = Array.isArray(context.params.slug) ? context.params.slug[0] : context.params.slug;
  const post = slug ? await getPost(context.env, slug) : null;
  if (!post) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "public, max-age=300");

  return new Response(injectArticleMeta(await response.text(), context.request.url, post), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
