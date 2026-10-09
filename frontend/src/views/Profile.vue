
<script setup>
import { ref } from 'vue'

const nom = ref('Utilisateur')
const email = ref('')

function enregistrerProfil() {
  // La sauvegarde sera connectée à l'API plus tard.
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
              class="px-5 py-3 rounded-xl bg-blue-600
                     text-white text-sm font-medium
                     hover:bg-blue-700 shadow-sm
                     hover:shadow-md transition cursor-pointer"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </section>

    </main>
  </div>
</template>
