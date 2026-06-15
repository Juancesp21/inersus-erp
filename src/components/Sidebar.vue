<template>
  <div>
    <!-- OVERLAY móvil -->
    <div class="sidebar-overlay" v-if="menuOpen" @click="menuOpen = false"></div>

    <!-- TOPBAR móvil -->
    <div class="mobile-topbar">
      <button class="hamburger" @click="menuOpen = !menuOpen">
        <span></span><span></span><span></span>
      </button>
      <div class="mobile-logo">
        <img src="/inersussolo-rb.png" alt="Inersus" style="width:28px;height:28px;object-fit:contain;" />
        <span class="logo-text">INERSUS</span>
      </div>
      <div class="mobile-user">
        <div class="user-avatar">{{ userInitial }}</div>
      </div>
    </div>

    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ 'open': menuOpen }">
      <div class="sidebar-logo">
        <img src="/inersussolo-rb.png" alt="Inersus" style="width:34px;height:34px;object-fit:contain;border-radius:50%;background:white;padding:2px;" />
        <div>
          <div class="logo-text">INERSUS</div>
          <div class="logo-sub">ERP Solar</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/cotizador" class="nav-item" @click="menuOpen = false">
          <span>💧</span>
          <span>Cotizaaador</span>
        </router-link>
        <router-link to="/cotizador-proveedor" class="nav-item" @click="menuOpen = false">
          <span>📄</span>
          <span>Quote Creator</span>
        </router-link>
        <router-link to="/catalogo" class="nav-item" @click="menuOpen = false">
          <span>📦</span>
          <span>Catálogo</span>
        </router-link>
        <router-link to="/configuracion" class="nav-item" @click="menuOpen = false">
          <span>⚙️</span>
          <span>Configuración</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">{{ userRol }}</div>
          </div>
        </div>
        <button class="sidebar-logout" @click="logout" title="Salir">✕</button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const userName = sessionStorage.getItem('ins_nombre') || sessionStorage.getItem('ins_u') || 'usuario'
const userRol = sessionStorage.getItem('ins_rol') || 'Asesor'
const userInitial = computed(() => userName[0].toUpperCase())
const menuOpen = ref(false)

function logout() {
  sessionStorage.clear()
  location.reload()
}
</script>