/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
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

interface Window {
  Quill?: QuillConstructor;
}
