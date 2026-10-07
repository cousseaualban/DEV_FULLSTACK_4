<script setup lang="ts">
import { ref } from 'vue'
import RightDrawer from '../components/common/RightDrawer.vue'
import ListeCollaborateur from '@/components/collaborateur/ListeCollaborateur.vue';

const showRightMenu = ref(false)

</script>

<template>
  <h1 class="text-2xl font-bold text-slate-900">
    Mon document
  </h1>

  <button
    type="button"
    class="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
    @click="showRightMenu = true"
  >
    Ouvrir le menu
  </button>

<RightDrawer
  :open="showRightMenu"
  title="Liste des collaborateurs"
  @close="showRightMenu = false"
>
  <ListeCollaborateur />
</RightDrawer>
</template>