<template>
  <div id="app-wrap">
    <header>
      <div class="logo">
        <div class="logo-icon">INS</div>
        <div>
          <div class="logo-text">INERSUS</div>
          <div class="logo-sub">Cotizador de Bombeo Solar</div>
        </div>
      </div>
      <nav>
        <router-link to="/">Cotizador</router-link>
        <router-link to="/historial">Historial</router-link>
      </nav>
      <button class="logout-btn" @click="logout">Salir</button>
    </header>
    <router-view />
  </div>
</template>

<script setup>
function logout() {
  sessionStorage.removeItem('ins_u')
  location.reload()
}
</script>

<style>
#app-wrap {
  min-height: 100vh;
}
</style>