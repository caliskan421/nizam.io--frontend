<script setup lang="ts">
// YER TUTUCU: sunucu API sürümü desteklenmiyor (sessiz düşüş yok). Tasarım program sonrası istemci geliştirmesindedir.
import { useInstanceStore, SUPPORTED_API_VERSION } from '@/shared/instance/store'

const instance = useInstanceStore()
</script>

<template>
  <section data-testid="update-required" role="alert">
    <h1>güncelleme gerekli</h1>
    <p>sunucu: {{ instance.profile?.api_version }} · istemci: {{ SUPPORTED_API_VERSION }}</p>
  </section>
</template>
