<template>
  <div class="view-container">
    <div class="view-header">
      <h1>Catálogo</h1>
    </div>

    <div class="tabs">
      <button :class="['tab', tab === 'kits' ? 'active' : '']" @click="tab = 'kits'">Kits de bombeo</button>
      <button :class="['tab', tab === 'productos' ? 'active' : '']" @click="tab = 'productos'">Productos</button>
    </div>

    <div v-if="tab === 'kits'">
      <div class="loading" v-if="loadingKits">Cargando kits...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Kit</th>
            <th>Serie</th>
            <th>HP</th>
            <th>Paneles</th>
            <th>CDT máx.</th>
            <th>Precio venta</th>
            <th>Costo</th>
            <th>Margen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="k in kits" :key="k.id">
            <td><strong>{{ k.id }}</strong><br><span class="sub">{{ k.descripcion }}</span></td>
            <td>{{ k.serie }}</td>
            <td>{{ k.hp }} HP</td>
            <td>{{ k.paneles }}</td>
            <td>{{ k.cdt_max }}m</td>
            <td class="mono">${{ Number(k.precio_venta || 0).toLocaleString('es-MX') }}</td>
            <td class="mono">${{ Number(k.costo_componentes || 0).toLocaleString('es-MX') }}</td>
            <td>
              <span :class="['badge-margen', Number(k.margen_pct) >= 20 ? 'ok' : 'low']">
                {{ k.margen_pct }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="tab === 'productos'">
      <div class="toolbar">
        <input v-model="busqueda" placeholder="Buscar producto..." class="search-input" />
        <select v-model="filtroCategoria" class="filter-select">
          <option value="">Todas las categorías</option>
          <option value="bomba">Bomba</option>
          <option value="panel">Panel</option>
          <option value="controlador">Controlador</option>
          <option value="cable">Cable</option>
          <option value="accesorio">Accesorio</option>
          <option value="tuberia">Tubería</option>
          <option value="bateria">Batería</option>
          <option value="inversor">Inversor</option>
        </select>
      </div>
      <div class="loading" v-if="loadingProductos">Cargando productos...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Unidad</th>
            <th>Costo MXN</th>
            <th>Precio venta</th>
            <th>Fuente</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in productosFiltrados" :key="p.id">
            <td class="mono">{{ p.id }}</td>
            <td>{{ p.descripcion }}</td>
            <td><span class="badge-cat" :class="p.categoria">{{ p.categoria }}</span></td>
            <td>{{ p.unidad }}</td>
            <td class="mono">${{ Number(p.precio_costo_mxn || 0).toLocaleString('es-MX') }}</td>
            <td class="mono">${{ Number(p.precio_venta_mxn || 0).toLocaleString('es-MX') }}</td>
            <td><span :class="['badge-fuente', p.fuente === 'PDF' ? 'pdf' : 'excel']">{{ p.fuente }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../models/supabase.js'

const tab = ref('kits')
const kits = ref([])
const productos = ref([])
const loadingKits = ref(true)
const loadingProductos = ref(true)
const busqueda = ref('')
const filtroCategoria = ref('')

const productosFiltrados = computed(() => {
  return productos.value.filter(p => {
    const matchBusqueda = !busqueda.value ||
      p.id.toLowerCase().includes(busqueda.value.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.value.toLowerCase())
    const matchCategoria = !filtroCategoria.value || p.categoria === filtroCategoria.value
    return matchBusqueda && matchCategoria
  })
})

onMounted(async () => {
  const { data: kitsData } = await supabase.from('v_kits_margen').select('*')
  kits.value = kitsData || []
  loadingKits.value = false

  const { data: prodData } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('categoria')
  productos.value = prodData || []
  loadingProductos.value = false
})
</script>
