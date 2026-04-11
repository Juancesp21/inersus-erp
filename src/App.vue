<template>
  <div id="app-layout" v-if="loggedIn">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>

  <div id="login-screen" v-else>
    <div class="login-box">
      <div class="login-logo">INS</div>
      <h2>Inersus</h2>
      <p>Cotizador interno — solo equipo Inersus</p>
      <input type="text" v-model="user" placeholder="Usuario" @keydown.enter="doLogin" />
      <input type="password" v-model="pass" placeholder="Contraseña" @keydown.enter="doLogin" />
      <button class="login-btn" @click="doLogin">Entrar</button>
      <div class="login-error" v-if="error">Usuario o contraseña incorrectos</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'

const USERS = { 'inersus': 'kolosal2026', 'ventas': 'bombeo2026', 'miguel': 'inersus123' }

const loggedIn = ref(!!sessionStorage.getItem('ins_u'))
const user = ref('')
const pass = ref('')
const error = ref(false)

function doLogin() {
  const u = user.value.trim().toLowerCase()
  if (USERS[u] && USERS[u] === pass.value) {
    sessionStorage.setItem('ins_u', u)
    loggedIn.value = true
    error.value = false
  } else {
    error.value = true
  }
}
</script>
