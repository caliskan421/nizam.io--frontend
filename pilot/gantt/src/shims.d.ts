// frappe-gantt 1.2.2 tip tanımı taşımaz (bulgu: TS desteği yok).
declare module 'frappe-gantt' {
  export default class Gantt {
    constructor(el: HTMLElement | string, tasks: unknown[], options?: Record<string, unknown>)
    refresh(tasks: unknown[]): void
    change_view_mode(mode?: string, maintain?: boolean): void
  }
}
