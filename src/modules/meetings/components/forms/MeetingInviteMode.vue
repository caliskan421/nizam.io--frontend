<script setup lang="ts">
import { trMeetings } from '@/shared/i18n/tr/meetings'
const mode = defineModel<'person' | 'coordinatorship'>({ required: true })
const text = trMeetings.meetings.forms
</script>
<template>
  <fieldset class="meeting-form__group meeting-form__modes">
    <legend>{{ text.mode }}</legend>
    <label
      ><input v-model="mode" type="radio" value="coordinatorship" /><span
        ><strong>{{ text.coordinatorship }}</strong
        ><small>{{ text.coordinatorshipHint }}</small></span
      ></label
    >
    <label
      ><input v-model="mode" type="radio" value="person" /><span
        ><strong>{{ text.person }}</strong
        ><small>{{ text.personHint }}</small></span
      ></label
    >
  </fieldset>
</template>
