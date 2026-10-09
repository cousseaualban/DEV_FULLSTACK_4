<script setup>
import ListeCollaborateur from '@/components/collaborateur/ListeCollaborateur.vue'
import RightDrawer from '@/components/common/RightDrawer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

const saveStatus = ref('Enregistré')

const documentTitle = ref('Document de travail')
const documentContent = ref('')
const lastModified = ref('')
const showRightMenu = ref(false)

const route = useRoute()
const currentDocumentId = computed(() => String(route.query.documentId ?? '1'))

const STORAGE_KEY = route.query.document || 'document-racine'
const isLoading = ref(true)
const errorMessage = ref('')


const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

onMounted(() => {
  try {
    const savedDocument = localStorage.getItem(STORAGE_KEY)

    if (savedDocument) {
      const document = JSON.parse(savedDocument)

      documentTitle.value = document.title
      documentContent.value = document.content

      if (document.lastModified) {
        lastModified.value = formatDate(
          new Date(document.lastModified)
        )
      }
    } else {
      lastModified.value = formatDate(new Date())
    }

    isLoading.value = false
  } catch (error) {
    errorMessage.value = 'Une erreur est survenue lors du chargement du document.'
    isLoading.value = false
  }
})

const saveDocument = () => {
  saveStatus.value = 'Enregistrement...'
  errorMessage.value = ''

  setTimeout(() => {
    try {
      const modificationDate = new Date()

      const document = {
        title: documentTitle.value,
        content: documentContent.value,
        lastModified: modificationDate.toISOString()
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(document)
      )

      lastModified.value = formatDate(modificationDate)

      saveStatus.value = 'Enregistré'
    } catch (error) {
      saveStatus.value = 'Erreur'
      errorMessage.value = 'Une erreur est survenue lors de la sauvegarde du document.'
    }
  }, 1000)
}

const handleTitleChange = () => {
  saveDocument()
}

const handleContentChange = () => {
  saveDocument()
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">

    <div
      v-if="isLoading"
      class="min-h-screen flex items-center justify-center"
    >
      <p class="text-sm text-slate-500">
        Chargement...
      </p>
    </div>

    <div
      v-else-if="errorMessage"
      class="min-h-screen flex items-center justify-center px-6"
    >
      <div
        class="flex items-start gap-3 rounded-lg border border-red-200
               bg-red-50 px-4 py-3"
      >
        <div class="flex-shrink-0 mt-0.5">
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
    </div>

    <div v-else>

      <header class="bg-white border-b border-slate-200">

        <div class="max-w-7xl mx-auto px-6">

          <div class="h-20 flex items-center justify-between">

            <div class="flex items-center gap-4">
              <button
                @click="$router.back()"
                class="w-10 h-10 rounded-xl
                       border border-slate-200
                       bg-white
                       text-slate-500
                       hover:bg-slate-50
                       hover:text-slate-900
                       cursor-pointer
                       transition"
              >
                ←
              </button>

              <div>

   
                <div class="flex items-center gap-2">

                  <p class="text-xs text-slate-400">
                    Documents
                  </p>

                  <span class="text-slate-300">
                    /
                  </span>

                  <p class="text-xs text-slate-400">
                    Projets
                  </p>

                </div>

                <!-- Titre -->
                <input
                  v-model="documentTitle"
                  @input="handleTitleChange"
                  type="text"
                  class="mt-1 w-80
                         bg-transparent
                         border-0
                         outline-none
                         text-lg
                         font-semibold
                         text-slate-900
                         placeholder-slate-400
                         focus:ring-0"
                />

              </div>

            </div>

            <div class="flex items-center gap-3">
              <div
                class="hidden sm:flex items-center gap-2
                       px-3 py-2
                       rounded-lg
                       bg-emerald-50
                       text-emerald-700
                       text-xs font-medium"
              >

                <span
                  class="w-2 h-2 rounded-full bg-emerald-500"
                ></span>

                {{ saveStatus }}

              </div>

              <button
                type="button"
                class="px-4 py-2.5
                       rounded-xl
                       border border-slate-200
                       bg-white
                       text-sm font-semibold
                       text-slate-700
                       hover:bg-slate-50
                       transition"
                @click="showRightMenu = true"
              >
                Collaborateurs
              </button>

            </div>

          </div>

        </div>

      </header>

      <main class="max-w-5xl mx-auto px-6 py-8">

        <div class="mb-6 flex items-center justify-between">

          <div>

            <p class="text-sm text-slate-500">
              Dernière modification
            </p>

            <div class="flex items-center gap-3 mt-2">

              <div
                class="w-8 h-8 rounded-full
                       bg-slate-900
                       flex items-center justify-center
                       text-xs font-semibold text-white"
              >
                U
              </div>

              <span class="text-sm font-medium text-slate-700">
                Utilisateur
              </span>

              <span class="text-sm text-slate-400">
                ·
              </span>

              <span class="text-sm text-slate-400">
                {{ lastModified }}
              </span>

            </div>

          </div>

        </div>

        <div
          v-if="errorMessage"
          class="mb-6 flex items-start gap-3 rounded-lg border border-red-200
                 bg-red-50 px-4 py-3"
        >
          <div class="flex-shrink-0 mt-0.5">
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
          class="bg-white
                 rounded-2xl
                 border border-slate-200
                 shadow-sm
                 overflow-hidden"
        >

          <div
            class="h-14
                   px-5
                   border-b border-slate-200
                   flex items-center justify-between
                   bg-slate-50/70"
          >


            <div class="flex items-center gap-1">


              <button
                class="w-9 h-9 rounded-lg
                       text-sm font-bold
                       text-slate-600
                       hover:bg-white
                       transition"
              >
                B
              </button>

              <button
                class="w-9 h-9 rounded-lg
                       text-sm italic
                       text-slate-600
                       hover:bg-white
                       transition"
              >
                I
              </button>

  
              <button
                class="w-9 h-9 rounded-lg
                       text-sm underline
                       text-slate-600
                       hover:bg-white
                       transition"
              >
                U
              </button>

              <div class="w-px h-6 bg-slate-200 mx-2"></div>

              <button
                class="w-9 h-9 rounded-lg
                       text-slate-600
                       hover:bg-white
                       transition"
              >
                ≡
              </button>

              <button
                class="w-9 h-9 rounded-lg
                       text-slate-600
                       hover:bg-white
                       transition"
              >
                ☰
              </button>

            </div>

            <span class="text-xs text-slate-400">
              Document texte
            </span>

          </div>

  
          <div class="p-8 md:p-12">

            <textarea
              v-model="documentContent"
              @input="handleContentChange"
              placeholder="Commencez à écrire votre document..."
              class="w-full
                     min-h-[600px]
                     resize-none
                     border-0
                     outline-none
                     text-slate-800
                     text-base
                     leading-8
                     placeholder-slate-300"
            ></textarea>

          </div>

        </div>

      </main>

    </div>

  </div>
  <RightDrawer
    :open="showRightMenu"
    title="Liste des collaborateurs"
    @close="showRightMenu = false"
  >
    <ListeCollaborateur
      :document-id="currentDocumentId"
    />
  </RightDrawer>
</template>