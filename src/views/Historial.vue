<template>
  <div class="historial">
    <div class="historial-header">
      <h2>Historial de cotizaciones</h2>
      <button @click="cargar">↻ Actualizar</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Cliente</th><th>Asesor</th>
          <th>Kit</th><th>CDT</th><th>L/día</th><th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td colspan="7">Cargando...</td></tr>
        <tr v-else-if="!rows.length"><td colspan="7">Sin cotizaciones.</td></tr>
        <tr v-for="r in rows" :key="r.id">
          <td>{{ fecha(r.created_at) }}</td>
          <td>{{ r.cliente }}</td>
          <td>{{ r.asesor }}</td>
          <td>{{ r.kit_id }}</td>
          <td>{{ r.cdt }}m</td>
          <td>{{ Number(r.lpd).toLocaleString() }} L</td>
          <td>${{ Math.round(r.precio_total).toLocaleString('es-MX') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCotizaciones } from '../models/kits.js'

const rows = ref([])
const loading = ref(true)

async function cargar() {
  loading.value = true
  rows.value = await getCotizaciones()
  loading.value = false
}

function fecha(ts) {
  return new Date(ts).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(cargar)
</script>
