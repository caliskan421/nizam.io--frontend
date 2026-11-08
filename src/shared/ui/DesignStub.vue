<script setup lang="ts">
import './styles/ui.css'

import { uiText } from './messages'

/**
 * Tasarımda olup backend'de karşılığı olmayan öğenin işareti (K13). YALNIZ ortak-kurallar §3
 * koşulunda: uygulanmış arayüzde, kabul edilmiş işlev eksikliği, `docs/backend-eksikleri/kayit.md`
 * içinde `açık`/`backend'de` satırı olan `BE-NNN`. Faz ertelemesi, v1 dışı modül, ürün kararı
 * bekleyen seçenek için KULLANILMAZ (orada devre dışı + faz notu).
 *
 * Geliştirme yapısında kesikli çerçeve; üretimde normal görünür. İçerideki eylemler tetiklenmez
 * (tıklama, gönderme, Enter/Boşluk yakalanır); içerideki düğmeyi devre dışı bırakmak çağıranın işi.
 */
withDefaults(defineProps<{ id: `BE-${string}`; as?: 'span' | 'div' }>(), { as: 'span' })

const dev = import.meta.env.DEV

function block(event: Event): void {
  event.preventDefault()
  event.stopPropagation()
}

function blockKeys(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') block(event)
}
</script>

<template>
  <component
    :is="as"
    class="ui-stub"
    :class="{ 'ui-stub--dev': dev }"
    :data-design-stub="id"
    :title="uiText('ui.stub.hint')"
    @click.capture="block"
    @submit.capture="block"
    @keydown.capture="blockKeys"
  >
    <slot />
  </component>
</template>
