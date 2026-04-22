<template>
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">INS</div>
      <div>
        <div class="logo-text">INERSUS</div>
        <div class="logo-sub">ERP Solar</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/cotizador" class="nav-item">
        <span>💧</span>
        <span>Cotizador</span>
      </router-link>
      <router-link to="/cotizador-proveedor" class="nav-item">
        <span>📄</span>
        <span>Cot. Proveedor</span>
      </router-link>
      <router-link to="/catalogo" class="nav-item">
        <span>📦</span>
        <span>Catálogo</span>
      </router-link>
      <router-link to="/configuracion" class="nav-item">
        <span>⚙️</span>
        <span>Configuración</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">Asesor</div>
        </div>
      </div>
      <button class="sidebar-logout" @click="logout" title="Salir">✕</button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const userName = sessionStorage.getItem('ins_u') || 'usuario'
const userInitial = computed(() => userName[0].toUpperCase())

function logout() {
  sessionStorage.removeItem('ins_u')
  location.reload()
}
</script>
