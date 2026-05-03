<template>
  <div id="app-layout" v-if="loggedIn">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>

  <div id="login-screen" v-else>
    <div class="login-box">
      <img src="/inersussolo.png" alt="Inersus" class="login-logo-img" />
      <h2>Inersus</h2>
      <p>Cotizador interno — solo equipo Inersus</p>
      <input type="text" v-model="user" placeholder="Usuario" @keydown.enter="doLogin" :disabled="loading" />
      <input type="password" v-model="pass" placeholder="Contraseña" @keydown.enter="doLogin" :disabled="loading" />
      <button class="login-btn" @click="doLogin" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
      <div class="login-error" v-if="error">Usuario o contraseña incorrectos</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'
import { supabase } from './models/supabase.js'

const loggedIn = ref(!!sessionStorage.getItem('ins_u'))
const user = ref('')
const pass = ref('')
const error = ref(false)
const loading = ref(false)

async function doLogin() {
  const u = user.value.trim().toLowerCase()
  if (!u || !pass.value) return
  loading.value = true
  error.value = false

  try {
    const { data, error: err } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', u)
      .eq('password', pass.value)
      .eq('activo', true)
      .single()

    if (err || !data) {
      error.value = true
    } else {
      sessionStorage.setItem('ins_u', data.username)
      sessionStorage.setItem('ins_rol', data.rol)
      sessionStorage.setItem('ins_sucursal', data.sucursal)
      sessionStorage.setItem('ins_nombre', data.nombre)
      sessionStorage.setItem('ins_uid', data.id)
      if (data.terminos) localStorage.setItem('ins_terminos', data.terminos)
      if (data.tdc) localStorage.setItem('ins_tdc', data.tdc)
      loggedIn.value = true
    }
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}
</script>