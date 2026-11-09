/**
 * Yeni görev formunun URL'den gelen İLK DEĞERLERİ (W76; 05b / 08 / 08b "Görev ata" girişi):
 * `?yeni=1&koordinatorluk=<birim>&atanan=<hesap>`. Girişi okuyan (`use-new-task-entry`) doğrular
 * ve sağlar (`provide`), form (`NewTaskDialog`) okur (`inject`); sayfa bileşeni aracı olmaz.
 *
 *  - `departmentId`: formun hedefi olur yalnız çağıranın o birimde görev açma YETKİSİ varsa (form
 *    seçenekleri `canManageWorkItem`, s.139; mercekten bağımsız, P1) — yoksa yok sayılır ve
 *    çağıranın önseçimi geçerli kalır.
 *  - `assignee`: formun birimindeki ekipte (`listMembers`) varsa ön dolar; yoksa sessizce düşer.
 * Ön değerler bir kez uygulanır; form kapanınca giriş temizlenir (sonraki açılış normaldir).
 */
import type { InjectionKey, Ref } from 'vue'

export interface NewTaskPreset {
  departmentId: string | null
  assignee: string | null
}

export const NEW_TASK_PRESET: InjectionKey<Readonly<Ref<NewTaskPreset | null>>> =
  Symbol('new-task-preset')
