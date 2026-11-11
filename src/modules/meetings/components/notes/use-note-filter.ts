import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
export function useNoteFilter() {
  const route = useRoute()
  const router = useRouter()
  const filter = computed(() =>
    route.query.notlar === 'gorev' ? 'converted' : route.query.notlar === 'benim' ? 'mine' : 'all',
  )
  function setFilter(value: 'all' | 'converted' | 'mine') {
    void router.replace({
      query: {
        ...route.query,
        notlar: value === 'converted' ? 'gorev' : value === 'mine' ? 'benim' : 'tumu',
      },
    })
  }
  return { filter, setFilter }
}
