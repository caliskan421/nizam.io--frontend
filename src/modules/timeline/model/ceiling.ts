/**
 * 200 tavanı (BE-019, GAP-053; ortak-kurallar §10): üç Gantt ucu ilk 200 kalemi döndürür, imleç
 * ve kesilme sinyali yoktur. Yanıt TAM 200 kalemse liste sınıra ulaşmış olabilir; sayaçlar ve
 * histogram "yüklenen kayıtlar içinde" diye etiketlenir (E-03C-02, 15, 82).
 */
export const GANTT_CEILING = 200

export function atCeiling(taskCount: number): boolean {
  return taskCount >= GANTT_CEILING
}
