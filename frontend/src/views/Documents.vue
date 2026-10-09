
<template>
  <div class="min-h-screen bg-slate-50">
    <div
      v-if="showLoginSuccess"
      class="fixed top-5 right-5 z-50 rounded-xl border border-green-200
            bg-green-50 px-5 py-4 text-sm font-medium text-green-800
            shadow-lg"
      role="status"
    >
      <span class="mr-2">✓</span>
      Connexion réussie !
    </div>
    <div class="max-w-7xl mx-auto px-14 py-8">

      <!-- En-tête -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">
            {{ currentFolder ? currentFolder.title : 'Mes documents' }}
          </h1>
          <p class="text-slate-500 mt-2">
            Organisez et retrouvez tous vos documents.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3">

          <!-- Bouton Créer -->
          <div class="relative">
            <button
              @click="showCreateMenu = !showCreateMenu"
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3
                     text-white font-medium shadow-sm hover:bg-blue-700
                     hover:shadow-md transition cursor-pointer"
            >
              <span class="text-xl leading-none">+</span>
              Créer
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <!-- Menu de création -->
            <div
              v-if="showCreateMenu"
              class="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200
                     bg-white p-2 shadow-xl z-20"
            >
              <button
                @click="createDocument"
                type="button"
                class="w-full rounded-xl px-3 py-3 text-left text-sm text-slate-700
                       hover:bg-blue-50 hover:text-blue-700 transition
                       flex items-center gap-3"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <svg class="w-5 h-5 text-blue-600" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
                    <path d="M13 3v7h7M8 14h8M8 17h8" />
                  </svg>
                </span>
                <span>
                  <span class="block font-semibold">Nouveau document</span>
                  <span class="block mt-1 text-xs text-slate-500">Créer un document</span>
                </span>
              </button>

              <button
                v-if="!folderId"
                @click="createFolder"
                type="button"
                class="w-full rounded-xl px-3 py-3 text-left text-sm text-slate-700
                       hover:bg-blue-50 hover:text-blue-700 transition
                       flex items-center gap-3"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
                  <svg class="w-5 h-5 text-sky-600" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="1.7"
                       stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
                <span>
                  <span class="block font-semibold">Nouveau dossier</span>
                  <span class="block mt-1 text-xs text-slate-500">Organiser vos documents</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Menu du profil -->
          <div class="relative">
            <button
              @click="showProfileMenu = !showProfileMenu"
              type="button"
              title="Mon profil"
              aria-label="Ouvrir le menu du profil"
              :aria-expanded="showProfileMenu"
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full
                     border border-slate-200 bg-white text-slate-600 shadow-sm
                     hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600
                     hover:shadow-md transition duration-200 cursor-pointer
                     focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <svg
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            </button>

            <!-- Menu déroulant du profil -->
            <div
              v-if="showProfileMenu"
              class="absolute right-0 top-full z-30 mt-2 w-52
                     rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
            >
              <button
                @click="goToProfile"
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3
                       text-left text-sm text-slate-700 hover:bg-blue-50
                       hover:text-blue-700 transition"
              >
                <svg
                  class="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                </svg>
                Mon profil
              </button>

              <div class="my-1 border-t border-slate-100"></div>

              <button
                @click="logout"
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3
                       text-left text-sm text-red-600 hover:bg-red-50
                       transition"
              >
                <svg
                  class="h-5 w-5 shrink-0 cursor-pointer"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Fil d'Ariane -->
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button @click="goToRoot" class="hover:text-blue-600 transition">
          Mes documents
        </button>

        <template v-if="currentFolder">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span class="font-medium text-slate-800">{{ currentFolder.title }}</span>
        </template>
      </div>

      <!-- Recherche -->
      <div class="relative mb-8">
        <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
             viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Rechercher un document ou un dossier..."
          class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4
                 text-slate-800 outline-none focus:border-blue-500
                 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <!-- Dossiers -->
      <section v-if="visibleFolders.length" class="mb-10">
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Dossiers</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="folder in visibleFolders"
            :key="folder.id"
            @click="openFolder(folder)"
            class="group flex items-center gap-4 rounded-2xl border border-slate-200
                   bg-white p-5 text-left hover:border-blue-300 hover:shadow-md transition"
          >
            <div class="w-12 h-12 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg class="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
                <path d="M3 10h18" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-slate-800 truncate group-hover:text-blue-600">
                {{ folder.title }}
              </h3>
              <p class="text-sm text-slate-500 mt-1">Dossier</p>
            </div>
            <svg class="w-5 h-5 shrink-0 text-slate-400 group-hover:text-blue-600"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </section>

      <!-- Documents -->
      <section>
        <h2 class="text-lg font-semibold text-slate-800 mb-4">Documents</h2>
        <div v-if="visibleDocuments.length"
             class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="doc in visibleDocuments"
            :key="doc.id"
            @click="openDocument(doc)"
            class="group flex items-center gap-4 rounded-2xl border border-slate-200
                   bg-white p-5 text-left hover:border-blue-300 hover:shadow-md transition"
          >
            <div class="w-12 h-12 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg class="w-7 h-7 text-slate-600" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
                <path d="M13 3v7h7M8 14h8M8 17h8" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="font-semibold text-slate-800 truncate group-hover:text-blue-600">
                {{ doc.title }}
              </h3>
              <p class="text-sm text-slate-500 mt-1">
                Modifié le {{ formatDate(doc.lastModified) }}
              </p>
            </div>
            <svg class="w-5 h-5 shrink-0 text-slate-400 group-hover:text-blue-600"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        <!-- État vide -->
        <div v-else-if="!visibleFolders.length"
             class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <svg class="w-7 h-7 text-slate-500" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
              <path d="M13 3v7h7M8 14h8M8 17h8" />
            </svg>
          </div>
          <h3 class="font-semibold text-slate-800">
            {{ search ? 'Aucun résultat trouvé' : 'Aucun document pour le moment' }}
          </h3>
          <p class="text-sm text-slate-500 mt-2">
            {{ search ? 'Essayez avec un autre mot-clé.' : 'Créez un document pour commencer à travailler.' }}
          </p>
          <button v-if="!search" @click="createDocument"
                  class="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 transition">
            Créer un document
          </button>
        </div>
      </section>
    </div>

    <!-- Fenêtre modale : dossier ou document -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-6"
      @click.self="closeCreateModal"
      @keydown.esc="closeCreateModal"
    >
      <div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

        <div class="border-b border-slate-100 px-6 pt-6 pb-5">
          <div class="flex items-start gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                 :class="modalType === 'folder' ? 'bg-sky-100' : 'bg-blue-100'">
              <svg v-if="modalType === 'folder'" class="h-6 w-6 text-sky-600"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
                <path d="M3 10h18" />
              </svg>
              <svg v-else class="h-6 w-6 text-blue-600"
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
                <path d="M13 3v7h7M8 14h8M8 17h8" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-slate-900">
                {{ modalType === 'folder' ? 'Créer un dossier' : 'Créer un document' }}
              </h2>
              <p class="mt-1 text-sm text-slate-500 cursor-pointer">
                {{ modalType === 'folder'
                  ? 'Donnez un nom à votre nouveau dossier.'
                  : 'Donnez un titre à votre nouveau document.' }}
              </p>
            </div>

            <button type="button" @click="closeCreateModal" aria-label="Fermer"
                    class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form @submit.prevent="saveItem" class="p-6">
          <label for="itemName" class="mb-2 block text-sm font-semibold text-slate-700">
            {{ modalType === 'folder' ? 'Nom du dossier' : 'Titre du document' }}
          </label>
          <input
            id="itemName"
            ref="itemInput"
            v-model="itemName"
            type="text"
            maxlength="80"
            required
            :placeholder="modalType === 'folder' ? 'Ex. : Mes projets' : 'Ex. : Notes de réunion'"
            class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
          />
          <p v-if="itemError" class="mt-2 text-sm text-red-600">{{ itemError }}</p>

          <div class="mt-7 flex justify-end gap-3">
            <button type="button" @click="closeCreateModal"
                    class="rounded-xl border border-slate-200 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 transition">
              Annuler
            </button>
            <button type="submit"
                    class="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white shadow-sm transition hover:shadow-md"
                    :class="modalType === 'folder' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-blue-600 hover:bg-blue-700'">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const search = ref('')
const showCreateMenu = ref(false)
const showProfileMenu = ref(false)
const showCreateModal = ref(false)
const modalType = ref('document')
const itemName = ref('')
const itemError = ref('')
const itemInput = ref(null)

const showLoginSuccess = ref(false)

if (sessionStorage.getItem('connexionReussie') === 'true') {
  sessionStorage.removeItem('connexionReussie')
  showLoginSuccess.value = true

  setTimeout(() => {
    showLoginSuccess.value = false
  }, 3000)
}

const folders = ref([])
const documents = ref([])

const folderId = computed(() => {
  return typeof route.query.folder === 'string'
    ? route.query.folder
    : ''
})

const currentFolder = computed(() => {
  return folders.value.find(folder => folder.id === folderId.value) || null
})

function loadData() {
  const loadedFolders = []
  const loadedDocuments = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    if (key.startsWith('dossier-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        if (data && typeof data === 'object' && data.title) {
          loadedFolders.push({
            id: key,
            title: data.title,
            createdAt: data.createdAt || new Date().toISOString()
          })
        }
      } catch {
        // Ignore les données invalides.
      }
    }

    if (key.startsWith('document-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        if (data && typeof data === 'object' && data.title) {
          loadedDocuments.push({
            id: key,
            title: data.title,
            content: data.content || '',
            folderId: data.folderId || '',
            lastModified: data.lastModified || new Date().toISOString()
          })
        }
      } catch {
        // Ignore les données invalides.
      }
    }
  }

  if (!loadedFolders.some(folder => folder.id === 'dossier-projets')) {
    loadedFolders.push({
      id: 'dossier-projets',
      title: 'Projets',
      createdAt: new Date().toISOString(),
      isBuiltIn: true
    })
  }

  if (!loadedDocuments.some(doc => doc.id === 'document-racine')) {
    loadedDocuments.push({
      id: 'document-racine',
      title: 'Mon premier document',
      content: '',
      folderId: '',
      lastModified: new Date().toISOString(),
      isBuiltIn: true
    })
  }

  folders.value = loadedFolders
  documents.value = loadedDocuments
}

const visibleFolders = computed(() => {
  if (folderId.value) return []

  const term = search.value.trim().toLowerCase()

  return folders.value.filter(folder =>
    folder.title.toLowerCase().includes(term)
  )
})

const visibleDocuments = computed(() => {
  const term = search.value.trim().toLowerCase()

  return documents.value.filter(doc => {
    const belongsHere = folderId.value
      ? doc.folderId === folderId.value
      : !doc.folderId

    return belongsHere && doc.title.toLowerCase().includes(term)
  })
})

async function createDocument() {
  showCreateMenu.value = false
  modalType.value = 'document'
  itemName.value = ''
  itemError.value = ''
  showCreateModal.value = true

  await nextTick()
  itemInput.value?.focus()
}

async function createFolder() {
  showCreateMenu.value = false
  modalType.value = 'folder'
  itemName.value = ''
  itemError.value = ''
  showCreateModal.value = true

  await nextTick()
  itemInput.value?.focus()
}

function closeCreateModal() {
  showCreateModal.value = false
  itemName.value = ''
  itemError.value = ''
}

function saveItem() {
  const title = itemName.value.trim()

  if (!title) {
    itemError.value = modalType.value === 'folder'
      ? 'Veuillez saisir un nom de dossier.'
      : 'Veuillez saisir un titre pour le document.'
    return
  }

  if (modalType.value === 'folder') {
    const duplicate = folders.value.some(
      folder => folder.title.trim().toLowerCase() === title.toLowerCase()
    )

    if (duplicate) {
      itemError.value = 'Un dossier avec ce nom existe déjà.'
      return
    }

    const id = `dossier-${Date.now()}`

    localStorage.setItem(id, JSON.stringify({
      title,
      createdAt: new Date().toISOString()
    }))

    closeCreateModal()
    loadData()
    return
  }

  const id = `document-${Date.now()}`
  const now = new Date().toISOString()

  localStorage.setItem(id, JSON.stringify({
    title,
    content: '',
    folderId: folderId.value || '',
    lastModified: now
  }))

  closeCreateModal()
  loadData()

  router.push({
    path: '/documents/editor',
    query: { document: id }
  })
}

function openFolder(folder) {
  if (folder.id === 'dossier-projets') {
    router.push('/documents/projets')
    return
  }

  router.push({
    path: '/documents',
    query: { folder: folder.id }
  })
}

function openDocument(doc) {
  router.push({
    path: '/documents/editor',
    query: { document: doc.id }
  })
}

function goToRoot() {
  router.push('/documents')
}

function goToProfile() {
  showProfileMenu.value = false
  router.push('/profile')
}

function formatDate(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'date inconnue'

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Déconnexion
async function logout() {
  showProfileMenu.value = false

  try {
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
  } catch (error) {
    console.error('Erreur lors de la déconnexion :', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')

    router.push('/login')
  }
}

watch(
  () => route.query.folder,
  () => {
    search.value = ''
    loadData()
  }
)

watch(
  () => route.fullPath,
  () => {
    showCreateMenu.value = false
    showProfileMenu.value = false
  }
)

loadData()
</script>