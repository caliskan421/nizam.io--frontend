/**
 * Web Push hedef kimliği (E-14-79): `registerPushTarget` yanıtındaki `target_id` oturum süresince
 * YALNIZ bellekte tutulur (depolama yok, K2; sayfa yenilemesinde kaybolur — sunucu hedefi sonraki
 * teslimde 404/410 ile düşürür, K12). Çıkışta bir kez alınır ve silinir.
 */
let current: string | null = null

export function rememberPushTarget(targetId: string): void {
  current = targetId
}

/** Kimliği döndürür ve unutur (aynı hedef iki kez silinmez). */
export function takePushTarget(): string | null {
  const id = current
  current = null
  return id
}

export function peekPushTarget(): string | null {
  return current
}
