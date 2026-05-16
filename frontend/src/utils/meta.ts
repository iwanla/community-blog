import { getOgLocale, setLink, setMeta } from "../i18n/index";

interface BaseMetaInput {
  title: string;
  description: string;
  url: string;
  image: string;
  type?: string;
}

export function resetArticleMeta() {
  setMeta('meta[property="article:published_time"]', "");
  setMeta('meta[property="article:modified_time"]', "");
  setMeta('meta[property="article:author"]', "");
  setMeta('meta[property="article:section"]', "");
}

export function setRobots(content = "index, follow") {
  setMeta('meta[name="robots"]', content);
}

export function setBaseMeta({ title, description, url, image, type = "website" }: BaseMetaInput) {
  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:type"]', type);
  setMeta('meta[property="og:url"]', url);
  setMeta('meta[property="og:image"]', image);
  setMeta('meta[property="og:locale"]', getOgLocale());
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image"]', image);
  setLink('link[rel="canonical"]', url);
}
