<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
})

const emit = defineEmits<{
  close: []
}>()

function closeDrawer() {
  emit('close')
}
</script>

<template>
  <Transition name="drawer-fade">
    <div
      v-if="props.open"
      class="fixed inset-0 z-50"
    >
      <div
        class="absolute inset-0 bg-slate-900/40"
        @click="closeDrawer"
      />

      <aside
        class="absolute right-0 top-0 flex h-full w-fit min-w-[18rem] max-w-[calc(100vw-2rem)] flex-col bg-white shadow-2xl ring-1 ring-slate-200"
      >
        <header class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <slot name="header">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ props.title }}
            </h2>
          </slot>

          <button
            type="button"
            aria-label="Fermer le menu"
            class="text-2xl leading-none text-slate-400 transition hover:text-slate-700"
            @click="closeDrawer"
          >
            ×
          </button>
        </header>

        <div class="flex-1 overflow-y-auto overflow-x-auto px-5 py-4">
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          class="border-t border-slate-200 bg-slate-50 px-5 py-4"
        >
          <slot name="footer" />
        </footer>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-active aside,
.drawer-fade-leave-active aside {
  transition: transform 0.25s ease;
}

.drawer-fade-enter-from aside,
.drawer-fade-leave-to aside {
  transform: translateX(100%);
}
</style>
