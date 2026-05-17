/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface QuillInstance {
  root: HTMLElement;
  getText(): string;
  getSemanticHTML?: () => string;
  on(eventName: "text-change", handler: () => void): void;
  setText(value: string): void;
}

interface QuillConstructor {
  new (
    element: HTMLElement,
    options: {
      theme: string;
      placeholder: string;
      modules: Record<string, unknown>;
    },
  ): QuillInstance;
}

type TurnstileWidgetId = string;

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): TurnstileWidgetId;
  reset(widgetId?: TurnstileWidgetId): void;
  remove(widgetId: TurnstileWidgetId): void;
}

interface Window {
  Quill?: QuillConstructor;
  turnstile?: TurnstileApi;
}
