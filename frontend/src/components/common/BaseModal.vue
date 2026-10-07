<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title?: string
    hideCloseButton?: boolean
  }>(),
  {
    title: '',
    hideCloseButton: false,
  }
)

const emit = defineEmits<{
  close: []
}>()

function closeModal() {
  emit('close')
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    @click.self="closeModal"
  >
    <div
      :class="[
        'w-full rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 max-w-md'
      ]"
    >
      <header
        v-if="title || $slots.header"
        class="flex items-center justify-between border-b border-slate-200 px-5 py-4"
      >
        <slot name="header">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ title }}
          </h2>
        </slot>

        <button
          v-if="!hideCloseButton"
          type="button"
          aria-label="Fermer la modal"
          class="ml-4 text-2xl leading-none text-slate-400 transition hover:text-slate-700"
          @click="closeModal"
        >
          ×
        </button>
      </header>

      <div class="px-5 py-4">
        <slot />
      </div>

      <footer
        v-if="$slots.footer"
        class="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4"
      >
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>
