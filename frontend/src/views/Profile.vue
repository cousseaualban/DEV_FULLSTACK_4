<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../services/api'
import QRCode from 'qrcode'

const nom = ref('Utilisateur')
const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(true)
const isSaving = ref(false)


const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordErrorMessage = ref('')
const passwordSuccessMessage = ref('')
const isChangingPassword = ref(false)

const twoFactorEnabled = ref(false)
const otpAuthUrl = ref('')
const twoFactorCode = ref('')
const twoFactorErrorMessage = ref('')
const twoFactorSuccessMessage = ref('')
const isSettingUpTwoFactor = ref(false)
const isVerifyingTwoFactor = ref(false)
const qrCodeDataUrl = ref('')

onMounted(async () => {
  try {
    const data = await apiRequest('/auth/me')

    nom.value = `${data.user.firstName} ${data.user.lastName}`.trim()
    email.value = data.user.email
    twoFactorEnabled.value = data.user.twoFactorEnabled
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible de récupérer votre profil.'
  } finally {
    isLoading.value = false
  }
})

async function enregistrerProfil() {
  errorMessage.value = ''
  successMessage.value = ''

  const nomComplet = nom.value.trim()
  const nomParts = nomComplet.split(/\s+/)

  if (nomParts.length < 2) {
    errorMessage.value = 'Veuillez saisir votre prénom et votre nom.'
    return
  }

  if (!email.value.trim()) {
    errorMessage.value = 'Veuillez saisir une adresse e-mail.'
    return
  }

  const firstName = nomParts[0]
  const lastName = nomParts.slice(1).join(' ')

  isSaving.value = true

  try {
    const data = await apiRequest('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({
        firstName,
        lastName,
        email: email.value.trim()
      })
    })

    nom.value = `${data.user.firstName} ${data.user.lastName}`.trim()
    email.value = data.user.email

    localStorage.setItem('user', JSON.stringify(data.user))
    successMessage.value = data.message || 'Profil mis à jour avec succès.'
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible d’enregistrer les modifications.'
  } finally {
    isSaving.value = false
  }
}


async function changerMotDePasse() {
  passwordErrorMessage.value = ''
  passwordSuccessMessage.value = ''

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    passwordErrorMessage.value = 'Veuillez remplir tous les champs.'
    return
  }

  if (newPassword.value.length < 8) {
    passwordErrorMessage.value = 'Le nouveau mot de passe doit contenir au moins 8 caractères.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordErrorMessage.value = 'Les deux nouveaux mots de passe ne correspondent pas.'
    return
  }

  if (currentPassword.value === newPassword.value) {
    passwordErrorMessage.value = 'Le nouveau mot de passe doit être différent de l’ancien.'
    return
  }

  isChangingPassword.value = true

  try {
    const data = await apiRequest('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      })
    })

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''

    passwordSuccessMessage.value = data.message || 'Mot de passe modifié avec succès.'
  } catch (error) {
    passwordErrorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible de modifier le mot de passe.'
  } finally {
    isChangingPassword.value = false
  }
}

async function configurerDoubleAuthentification() {
  twoFactorErrorMessage.value = ''
  twoFactorSuccessMessage.value = ''
  twoFactorCode.value = ''

  isSettingUpTwoFactor.value = true

  try {
    const data = await apiRequest('/auth/2fa/setup', {
      method: 'POST'
    })

    otpAuthUrl.value = data.otpAuthUrl
    qrCodeDataUrl.value = await QRCode.toDataURL(data.otpAuthUrl)

  } catch (error) {
    twoFactorErrorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible de configurer la double authentification.'
  } finally {
    isSettingUpTwoFactor.value = false
  }
}


async function verifierDoubleAuthentification() {
  twoFactorErrorMessage.value = ''
  twoFactorSuccessMessage.value = ''

  if (!/^\d{6}$/.test(twoFactorCode.value)) {
    twoFactorErrorMessage.value = 'Veuillez saisir un code valide à 6 chiffres.'
    return
  }

  isVerifyingTwoFactor.value = true

  try {
    const data = await apiRequest('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({
        code: twoFactorCode.value
      })
    })

    twoFactorEnabled.value = data.user.twoFactorEnabled
    twoFactorCode.value = ''
    otpAuthUrl.value = ''
    qrCodeDataUrl.value = ''

    twoFactorSuccessMessage.value =
      data.message || 'Double authentification activée avec succès.'

  } catch (error) {
    twoFactorErrorMessage.value = error instanceof Error
      ? error.message
      : 'Impossible de vérifier le code de double authentification.'
  } finally {
    isVerifyingTwoFactor.value = false
  }
}

</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">

    <header class="bg-white border-b border-slate-200">
      <div class="max-w-6xl mx-auto py-5">
        <div class="flex items-center gap-4">
          <button
            @click="$router.back()"
            aria-label="Retour"
            class="w-10 h-10 rounded-xl border border-slate-200
                   bg-white text-slate-600 hover:bg-blue-50
                   hover:text-blue-600 transition cursor-pointer text-xl"
          >
            ←
          </button>

          <h1 class="text-lg font-semibold text-slate-900">
            Profil
          </h1>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto py-10 lg:py-14">

      <div class="mb-10">
        <h2 class="text-3xl font-bold tracking-tight">
          Informations personnelles
        </h2>

        <p class="text-slate-500 mt-3">
          Gérez les informations associées à votre profil.
        </p>

        <p v-if="isLoading" class="mt-3 text-sm text-blue-600">
          Chargement du profil...
        </p>

        <p v-if="errorMessage" class="mt-3 text-sm text-red-600">
          {{ errorMessage }}
        </p>

        <div class="w-14 h-1 bg-blue-600 rounded-full mt-5"></div>
      </div>

      <section
        class="bg-white rounded-2xl border border-slate-200
               p-6 sm:p-8 mb-8 shadow-sm"
      >
        <div class="flex items-center gap-5">
          <div
            class="w-20 h-20 rounded-2xl bg-blue-50
                   border border-blue-100
                   flex items-center justify-center
                   text-3xl font-semibold text-blue-700"
          >
            {{ (nom || 'U').charAt(0).toUpperCase() }}
          </div>

          <div>
            <h3 class="text-xl font-semibold">
              {{ nom || 'Utilisateur' }}
            </h3>

            <p class="text-sm text-slate-500 mt-2">
              Votre espace personnel
            </p>

            <p
              v-if="email"
              class="text-sm text-blue-600 mt-1"
            >
              {{ email }}
            </p>
          </div>
        </div>
      </section>

      <section
        class="bg-white rounded-2xl border border-slate-200
               overflow-hidden shadow-sm"
      >
        <div class="px-6 sm:px-8 py-6 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-blue-50
                     flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                class="w-5 h-5 text-blue-600"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>

            <div>
              <h3 class="text-lg font-semibold">
                Coordonnées
              </h3>

              <!-- Changement de mot de passe -->
              <section class="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 class="mb-2 text-xl font-semibold text-gray-900">
                  Changer de mot de passe
                </h2>

                <p class="mb-6 text-sm text-gray-500">
                  Renseignez votre mot de passe actuel, puis choisissez un nouveau mot de passe.
                </p>

                <form @submit.prevent="changerMotDePasse">
                  <div class="mb-5">
                    <label for="currentPassword" class="mb-2 block text-sm font-medium text-gray-700">
                      Mot de passe actuel
                    </label>
                    <input
                      id="currentPassword"
                      v-model="currentPassword"
                      type="password"
                      autocomplete="current-password"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div class="mb-5">
                    <label for="newPassword" class="mb-2 block text-sm font-medium text-gray-700">
                      Nouveau mot de passe
                    </label>
                    <input
                      id="newPassword"
                      v-model="newPassword"
                      type="password"
                      autocomplete="new-password"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div class="mb-5">
                    <label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-700">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      id="confirmPassword"
                      v-model="confirmPassword"
                      type="password"
                      autocomplete="new-password"
                      class="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <p v-if="passwordSuccessMessage" class="mb-5 text-sm text-green-600">
                    {{ passwordSuccessMessage }}
                  </p>

                  <p v-if="passwordErrorMessage" class="mb-5 text-sm text-red-600">
                    {{ passwordErrorMessage }}
                  </p>

                  <button
                    type="submit"
                    :disabled="isChangingPassword"
                    class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ isChangingPassword ? 'Modification...' : 'Modifier le mot de passe' }}
                  </button>
                </form>
              </section>

              
              <!-- Double authentification -->
              <section class="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 class="mb-2 text-xl font-semibold text-gray-900">
                  Double authentification
                </h2>

                <p class="mb-6 text-sm text-gray-500">
                  Renforcez la sécurité de votre compte en demandant un code généré par une application d'authentification lors de la connexion.
                </p>

                <div v-if="twoFactorEnabled" class="rounded-lg bg-green-50 p-4">
                  <p class="text-sm font-medium text-green-700">
                    La double authentification est activée sur votre compte.
                  </p>
                </div>

                <div v-else>
                  <p class="mb-5 text-sm text-gray-600">
                    La double authentification n'est pas encore activée.
                  </p>

                  <button
                    v-if="!qrCodeDataUrl"
                    type="button"
                    :disabled="isSettingUpTwoFactor"
                    @click="configurerDoubleAuthentification"
                    class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ isSettingUpTwoFactor ? 'Préparation...' : 'Configurer la double authentification' }}
                  </button>

                  <div v-if="qrCodeDataUrl" class="mt-6">
                    <p class="mb-3 text-sm text-gray-700">
                      1. Ouvrez votre application d'authentification et scannez ce QR code.
                    </p>

                    <img
                      :src="qrCodeDataUrl"
                      alt="QR code de configuration de la double authentification"
                      class="mx-auto mb-5 h-48 w-48"
                    />

                    <p class="mb-2 text-sm text-gray-700">
                      2. Saisissez le code à 6 chiffres affiché par votre application.
                    </p>

                    <form @submit.prevent="verifierDoubleAuthentification">
                      <label
                        for="twoFactorCode"
                        class="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Code de vérification
                      </label>

                      <input
                        id="twoFactorCode"
                        v-model="twoFactorCode"
                        type="text"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        maxlength="6"
                        placeholder="123456"
                        class="mb-5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                      />

                      <button
                        type="submit"
                        :disabled="isVerifyingTwoFactor"
                        class="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {{ isVerifyingTwoFactor ? 'Vérification...' : 'Activer la double authentification' }}
                      </button>
                    </form>
                  </div>
                </div>

                <p v-if="twoFactorSuccessMessage" class="mt-5 text-sm text-green-600">
                  {{ twoFactorSuccessMessage }}
                </p>

                <p v-if="twoFactorErrorMessage" class="mt-5 text-sm text-red-600">
                  {{ twoFactorErrorMessage }}
                </p>
              </section>

              <p class="text-sm text-slate-500 mt-1">
                Modifiez votre nom ou votre adresse e-mail.
              </p>
            </div>
          </div>
        </div>

        <form
          @submit.prevent="enregistrerProfil"
          class="p-6 sm:p-8"
        >

        <p v-if="successMessage" class="mb-5 text-sm text-green-600">
          {{ successMessage }}
        </p>

        <p v-if="errorMessage" class="mb-5 text-sm text-red-600">
          {{ errorMessage }}
        </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label
                for="nom"
                class="block text-sm font-medium
                       text-slate-700 mb-2"
              >
                Nom complet
              </label>

              <input
                id="nom"
                v-model="nom"
                type="text"
                placeholder="Votre nom complet"
                class="w-full px-4 py-3 rounded-xl
                       border border-slate-200 bg-white
                       outline-none transition
                       focus:border-blue-500
                       focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label
                for="email"
                class="block text-sm font-medium
                       text-slate-700 mb-2"
              >
                Adresse e-mail
              </label>

              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                class="w-full px-4 py-3 rounded-xl
                       border border-slate-200 bg-white
                       outline-none transition
                       focus:border-blue-500
                       focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div
            class="mt-8 pt-6 border-t border-slate-100
                   flex flex-col-reverse sm:flex-row
                   justify-end gap-3"
          >
            <button
              type="button"
              @click="$router.back()"
              class="px-5 py-3 rounded-xl border
                     border-slate-200 text-slate-700
                     text-sm font-medium hover:bg-slate-50
                     transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              :disabled="isSaving"
              class="px-5 py-3 rounded-xl bg-blue-600
                    text-white text-sm font-medium
                    hover:bg-blue-700 shadow-sm
                    hover:shadow-md transition cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isSaving ? 'Enregistrement...' : 'Enregistrer les modifications' }}
            </button>
          </div>
        </form>
      </section>

    </main>
  </div>
</template>
