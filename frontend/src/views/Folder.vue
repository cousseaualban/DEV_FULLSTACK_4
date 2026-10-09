
<script setup>
import { ref, onMounted } from 'vue'

const lastModified = ref('05/10/2026')
const documentTitle = ref('Document de travail')
const STORAGE_KEY = 'document-projets'
const isLoading = ref(true)
const errorMessage = ref('')

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

onMounted(() => {
  try {
    const savedDocument = localStorage.getItem(STORAGE_KEY)

    if (savedDocument) {
      const document = JSON.parse(savedDocument)

      if (document.title) {
        documentTitle.value = document.title
      }

      if (document.lastModified) {
        lastModified.value = formatDate(
          new Date(document.lastModified)
        )
      }
    }

    isLoading.value = false
  } catch (error) {
    errorMessage.value =
      'Une erreur est survenue lors du chargement du document.'
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">

    <header class="bg-white border-b border-slate-200">
      <div class="max-w-7xl mx-auto px-6 py-6">

        <p class="text-sm text-slate-400 mb-4">
          Documents / Projets
        </p>

        <div class="flex items-center gap-4">

          <button
            @click="$router.back()"
            aria-label="Retour"
            class="w-10 h-10 shrink-0 rounded-xl
                   border border-slate-200
                   bg-white text-slate-600
                   hover:bg-blue-50 hover:text-blue-600
                   transition cursor-pointer text-xl"
          >
            ←
          </button>

          <div>
            <h1 class="text-2xl font-bold text-slate-900">
              Projets
            </h1>

            <p class="mt-1 text-sm text-slate-500">
              Documents contenus dans ce dossier.
            </p>
          </div>

        </div>

      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">

      <div class="mb-5">
        <h2 class="text-lg font-semibold text-slate-900">
          Documents
        </h2>

        <p class="text-sm text-slate-500 mt-1">
          1 document
        </p>
      </div>

      <div v-if="isLoading" class="text-center py-10">
        <p class="text-sm text-slate-500">
          Chargement...
        </p>
      </div>

      <div
        v-else-if="errorMessage"
        class="flex items-start gap-3 rounded-lg
               border border-red-200 bg-red-50 px-4 py-3"
      >
        <div class="shrink-0 mt-0.5">
          <svg
            class="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01M12 3a9 9 0 110 18 9 9 0 010-18z"
            />
          </svg>
        </div>

        <p class="text-sm font-medium text-red-700">
          {{ errorMessage }}
        </p>
      </div>

      <div
        v-else
        @click="$router.push('/documents/editor?document=document-projets')"
        class="group max-w-md bg-white rounded-2xl
               border border-slate-200 p-5
               shadow-sm hover:shadow-md
               hover:border-blue-200
               transition cursor-pointer"
      >

        <div class="flex items-start justify-between">

          <div
            class="w-12 h-12 rounded-xl bg-indigo-50
                   flex items-center justify-center text-xl"
          >
            📄
          </div>

          <span
            class="text-xs font-medium px-2.5 py-1
                   rounded-full bg-slate-100 text-slate-500"
          >
            Texte
          </span>

        </div>

        <div class="mt-5">
          <h3
            class="font-semibold text-slate-900
                   group-hover:text-blue-600 transition"
          >
            {{ documentTitle }}
          </h3>

          <p class="text-sm text-slate-500 mt-1">
            Dernière modification : {{ lastModified }}
          </p>
        </div>

        <div
          class="mt-5 pt-4 border-t border-slate-100
                 flex items-center justify-between"
        >

          <div class="flex items-center gap-2">
            <div
              class="w-7 h-7 rounded-full bg-slate-900
                     flex items-center justify-center
                     text-xs font-semibold text-white"
            >
              U
            </div>

            <span class="text-xs text-slate-500">
              Utilisateur
            </span>
          </div>

          <span
            class="text-sm font-medium text-blue-600
                   group-hover:translate-x-1 transition"
          >
            Ouvrir →
          </span>

        </div>
      </div>

    </main>
  </div>
</template>
