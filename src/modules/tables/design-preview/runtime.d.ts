declare module '*-preview.mjs' {
  export function mount(root: HTMLElement): (() => void) | void
}
