<script setup>
import ListeCollaborateur from '@/components/collaborateur/ListeCollaborateur.vue'
import RightDrawer from '@/components/common/RightDrawer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiRequest } from '@/services/api'
import { connectCollaborationSocket } from '@/services/collaborationSocket'

const saveStatus = ref('Enregistré')
const collaborationSocket = ref(null)
const documentVersion = ref(0)
const isApplyingRemoteChange = ref(false)
const previousContent = ref('')
const operationCounter = ref(0)
const pendingOperationIds = ref(new Set())

const documentTitle = ref('Document de travail')
const documentContent = ref('')
const lastModified = ref('')
const lastModifiedBy = ref(null)
const showRightMenu = ref(false)

const route = useRoute()
const currentDocumentId = computed(() => String(route.query.document ?? ''))
const isLoading = ref(true)
const errorMessage = ref('')
const files = ref([])
const isLoadingFiles = ref(false)
const fileError = ref('')
const isUploadingFile = ref(false)
const fileInput = ref(null)

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const loadFiles = async () => {
  try {
    isLoadingFiles.value = true
    fileError.value = ''

    const documentId = currentDocumentId.value

    if (!documentId || !/^\d+$/.test(documentId) || Number(documentId) <= 0) {
      throw new Error('Identifiant du document invalide.')
    }

    const response = await apiRequest(`/documents/${documentId}/files`)
    files.value = response.files || []
  } catch (error) {
    fileError.value = error.message || 'Impossible de charger les fichiers.'
  } finally {
    isLoadingFiles.value = false
  }
}

const uploadFile = async (event) => {
  const selectedFile = event.target.files[0]

  if (!selectedFile) return

  try {
    isUploadingFile.value = true
    fileError.value = ''

    if (selectedFile.size > 20 * 1024 * 1024) {
      throw new Error('Le fichier ne doit pas dépasser 20 Mo.')
    }

    const documentId = currentDocumentId.value
    const formData = new FormData()

    formData.append('file', selectedFile)

    await apiRequest(`/documents/${documentId}/files`, {
      method: 'POST',
      body: formData
    })

    await loadFiles()
  } catch (error) {
    fileError.value = error.message || 'Impossible d’envoyer le fichier.'
  } finally {
    isUploadingFile.value = false
    event.target.value = ''
  }
}

const downloadFile = async (file) => {
  try {
    fileError.value = ''

    const documentId = currentDocumentId.value
    const token = localStorage.getItem('token') ?? localStorage.getItem('authToken')

    const response = await fetch(
      `http://localhost:5000/api/documents/${documentId}/files/${file.id}/download`,
      {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {}
      }
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || 'Impossible de télécharger le fichier.')
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  } catch (error) {
    fileError.value = error.message || 'Une erreur est survenue lors du téléchargement.'
  }
}

const deleteFile = async (file) => {
  if (!window.confirm(`Voulez-vous vraiment supprimer le fichier « ${file.originalName} » ?`)) {
    return
  }

  try {
    fileError.value = ''

    const documentId = currentDocumentId.value

    await apiRequest(`/documents/${documentId}/files/${file.id}`, {
      method: 'DELETE'
    })

    files.value = files.value.filter((item) => item.id !== file.id)
  } catch (error) {
    fileError.value = error.message || 'Impossible de supprimer le fichier.'
  }
}

onMounted(async () => {
  try {
    const documentId = currentDocumentId.value

    if (!documentId || !/^\d+$/.test(documentId) || Number(documentId) <= 0) {
      throw new Error('Identifiant du document invalide.')
    }

    const response = await apiRequest(`/documents/${documentId}`)
    const document = response.document

    documentTitle.value = document.name
    documentContent.value = document.content || ''
    previousContent.value = documentContent.value
    lastModifiedBy.value = document.lastModifiedBy || null

    connectToDocument()

    if (document.updatedAt) {
      lastModified.value = formatDate(new Date(document.updatedAt))
    } else {
      lastModified.value = formatDate(new Date())
    }

    await loadFiles()
    isLoading.value = false
  } catch (error) {
    errorMessage.value = error.message || 'Une erreur est survenue lors du chargement du document.'
    isLoading.value = false
  }
})


let saveTimeout = null

const saveDocument = () => {
  saveStatus.value = 'Enregistrement...'
  errorMessage.value = ''

  clearTimeout(saveTimeout)

  saveTimeout = setTimeout(async () => {
    try {
      const documentId = currentDocumentId.value

      if (!documentId || !/^\d+$/.test(documentId) || Number(documentId) <= 0) {
        throw new Error('Identifiant du document invalide.')
      }

      const response = await apiRequest(`/documents/${documentId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: documentTitle.value,
        })
      })

      const modificationDate = response.document.updatedAt
        ? new Date(response.document.updatedAt)
        : new Date()

      lastModified.value = formatDate(modificationDate)
      lastModifiedBy.value = response.document.lastModifiedBy || null
      saveStatus.value = 'Enregistré'
    } catch (error) {
      saveStatus.value = 'Erreur'
      errorMessage.value = error.message || 'Une erreur est survenue lors de la sauvegarde du document.'
    }
  }, 1000)
}

const handleTitleChange = () => {
  saveDocument()
}


const handleContentChange = () => {
  if (isApplyingRemoteChange.value) {
    return
  }

  const socket = collaborationSocket.value

  if (!socket?.connected) {
    saveStatus.value = 'Connexion en attente'
    return
  }

  const oldContent = previousContent.value
  const newContent = documentContent.value

  let start = 0

  while (
    start < oldContent.length &&
    start < newContent.length &&
    oldContent[start] === newContent[start]
  ) {
    start++
  }

  let oldEnd = oldContent.length
  let newEnd = newContent.length

  while (
    oldEnd > start &&
    newEnd > start &&
    oldContent[oldEnd - 1] === newContent[newEnd - 1]
  ) {
    oldEnd--
    newEnd--
  }

  if (oldContent === newContent) {
    return
  }

  const operation = {
    position: start,
    deleteCount: oldEnd - start,
    insertText: newContent.slice(start, newEnd)
  }

  operationCounter.value++

  const operationId = `${Date.now()}-${operationCounter.value}`
  pendingOperationIds.value.add(operationId)

  saveStatus.value = 'Enregistrement...'

  socket.emit(
    'document:update',
    {
      documentId: currentDocumentId.value,
      operationId,
      baseVersion: documentVersion.value,
      ...operation
    },
    (response) => {
      if (!response.success) {
        saveStatus.value = 'Erreur'

        if (response.conflict) {
          errorMessage.value =
            'Le document a changé. Rechargez le document avant de continuer.'
        } else {
          errorMessage.value =
            response.message || 'Impossible d’enregistrer la modification.'
        }

        return
      }

      previousContent.value = response.state.content
      documentContent.value = response.state.content
      documentVersion.value = response.state.version

      lastModified.value = response.state.updatedAt
        ? formatDate(new Date(response.state.updatedAt))
        : formatDate(new Date())

      lastModifiedBy.value = response.updatedBy || null
      saveStatus.value = 'Enregistré'
    }
  )
}

const applyOperationsToContent = (content, operations) => {
  let result = content

  for (const operation of operations) {
    result =
      result.slice(0, operation.position) +
      operation.insertText +
      result.slice(operation.position + operation.deleteCount)
  }

  return result
}

const connectToDocument = () => {
  try {
    const socket = connectCollaborationSocket()
    collaborationSocket.value = socket

    socket.off('document:updated')

    socket.on('document:updated', (update) => {
      if (pendingOperationIds.value.has(update.operationId)) {
        return
      }

      if (update.state.version <= documentVersion.value) {
        return
      }

      isApplyingRemoteChange.value = true

      documentContent.value = applyOperationsToContent(
        documentContent.value,
        update.operations
      )

      previousContent.value = documentContent.value
      documentVersion.value = update.state.version

      lastModified.value = update.state.updatedAt
        ? formatDate(new Date(update.state.updatedAt))
        : formatDate(new Date())

      lastModifiedBy.value = update.updatedBy || null

      isApplyingRemoteChange.value = false
      saveStatus.value = 'Enregistré'
    })

    socket.emit(
      'document:join',
      { documentId: currentDocumentId.value },
      (response) => {
        if (!response.success) {
          errorMessage.value = response.message || 'Impossible de rejoindre le document.'
          return
        }

        documentContent.value = response.document.content || ''
        previousContent.value = documentContent.value
        documentVersion.value = response.document.version
        lastModified.value = response.document.updatedAt
          ? formatDate(new Date(response.document.updatedAt))
          : formatDate(new Date())
      }
    )
  } catch (error) {
    errorMessage.value = error.message || 'Impossible de se connecter à la collaboration.'
  }
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
                {{ lastModifiedBy
                  ? `${lastModifiedBy.firstName?.charAt(0) || ''}${lastModifiedBy.lastName?.charAt(0) || ''}`.toUpperCase()
                  : '?'
                }}
              </div>

              <span class="text-sm font-medium text-slate-700">
                {{ lastModifiedBy
                  ? `${lastModifiedBy.firstName} ${lastModifiedBy.lastName}`
                  : 'Utilisateur inconnu'
                }}
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

        <div class="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-base font-semibold text-slate-900">
                Fichiers joints
              </h2>
              <p class="mt-1 text-sm text-slate-500">
                Fichiers associés à ce document.
              </p>
            </div>

            <button
              type="button"
              :disabled="isUploadingFile"
              @click="fileInput.click()"
              class="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isUploadingFile ? 'Envoi...' : 'Ajouter un fichier' }}
            </button>

            <input
              ref="fileInput"
              type="file"
              class="hidden"
              :disabled="isUploadingFile"
              @change="uploadFile"
            />
          </div>

          <p v-if="isLoadingFiles" class="mt-4 text-sm text-slate-500">
            Chargement des fichiers...
          </p>

          <p v-else-if="fileError" class="mt-4 text-sm text-red-600">
            {{ fileError }}
          </p>

          <p v-else-if="files.length === 0" class="mt-4 text-sm text-slate-500">
            Aucun fichier joint pour le moment.
          </p>

          <ul v-else class="mt-4 divide-y divide-slate-100">
            <li
              v-for="file in files"
              :key="file.id"
              class="py-3 flex items-center justify-between gap-4"
            >
              <div class="min-w-0">
                <p class="text-sm font-medium text-slate-800 break-words">
                  {{ file.originalName }}
                </p>
                <p class="mt-1 text-xs text-slate-500">
                  {{ (file.size / 1024 / 1024).toFixed(2) }} Mo
                </p>
              </div>
              
              <button
                type="button"
                @click="downloadFile(file)"
                class="shrink-0 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Télécharger
              </button>

              <button
                type="button"
                @click="deleteFile(file)"
                class="shrink-0 px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Supprimer
              </button>
            </li>
          </ul>
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