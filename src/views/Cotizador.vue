<template>
  <div class="cotizador">
    <aside class="panel-left">
      <div class="section">
        <div class="slabel">Datos del cliente</div>
        <div class="card">
          <div class="field"><label>Nombre / Empresa</label><input v-model="form.cliente" placeholder="A quien corresponda"/></div>
          <div class="field"><label>Ciudad, Estado</label><input v-model="form.ciudad" placeholder="Monterrey, NL"/></div>
          <div class="field"><label>Asesor</label><input v-model="form.asesor" /></div>
        </div>
      </div>

      <div class="section">
        <div class="slabel">Parámetros del sistema</div>
        <div class="card">
          <div class="field">
            <label>Profundidad del pozo (ND)</label>
            <input type="number" v-model.number="form.nd" min="1" max="250" @input="upd"/>
            <span class="hint">metros — nivel dinámico</span>
          </div>
          <div class="field">
            <label>Desnivel al destino (DT)</label>
            <input type="number" v-model.number="form.dt" min="0" max="200" @input="upd"/>
          </div>
          <div class="field">
            <label>Tirada horizontal</label>
            <input type="number" v-model.number="form.tirada" min="0" max="2000" @input="upd"/>
          </div>
          <div class="field">
            <label>Diámetro del pozo</label>
            <select v-model.number="form.diametro">
              <option :value="3">3 pulgadas</option>
              <option :value="4">4 pulgadas</option>
            </select>
          </div>
          <div class="field">
            <label>Presión requerida</label>
            <select v-model.number="form.presion" @change="upd">
              <option :value="0">Sin presión especial</option>
              <option :value="7">Riego por goteo — 10 psi</option>
              <option :value="21">Cañón de riego — 30 psi</option>
            </select>
          </div>
        </div>
      </div>

      <div class="cdt-box">
        <div>
          <div class="cdt-lbl">CDT — Carga Dinámica Total</div>
          <div class="cdt-break">ND {{ cdtData.nd }}m + DT {{ cdtData.dt }}m + POP {{ cdtData.presion }}m + PF {{ cdtData.pf }}m</div>
        </div>
        <div class="cdt-val">{{ cdtData.cdt.toFixed(1) }} <span class="cdt-unit">m</span></div>
      </div>

      <div class="section">
        <div class="slabel">Accesorios</div>
        <div class="card">
          <div class="field">
            <label>Cable sumergible</label>
            <select v-model="form.ctipo">
              <option value="none">No incluir</option>
              <option value="CABLE3X12A">CABLE3X12A — $55/m</option>
              <option value="CABLE3X10A">CABLE3X10A — $81.50/m</option>
              <option value="CABLE3X8A">CABLE3X8A — $121/m</option>
            </select>
          </div>
          <div class="field">
            <label>Metros de cable</label>
            <input type="number" v-model.number="form.cmts" min="10" max="400" step="5"/>
            <span class="hint">Sugerido: {{ cableSugerido }}m</span>
          </div>
          <div class="field">
            <label>Bases inclinadas</label>
            <select v-model.number="form.bases">
              <option :value="0">No incluir</option>
              <option :value="1250">Incluir — $1,250</option>
            </select>
          </div>
        </div>
      </div>

      <button class="btn-calc" :disabled="cargando" @click="calcular">
        {{ cargando ? 'Cargando catálogo...' : 'Calcular sistema óptimo' }}
      </button>
    </aside>

    <main class="panel-right">
      <div class="empty" v-if="!resultados.length && !calculado">
        <p>Ingresa los parámetros y presiona <strong>Calcular</strong></p>
      </div>
      <div v-else-if="!resultados.length && calculado">
        <p>Sin resultados para CDT = {{ cdtData.cdt.toFixed(1) }}m</p>
      </div>
      <div v-else>
        <div class="rh">
          <h2>Resultados — CDT: {{ cdtData.cdt.toFixed(1) }} m</h2>
          <span>{{ resultados.length }} opciones</span>
        </div>
        <div class="kgrid">
          <KitCard
            v-for="(kit, i) in resultados"
            :key="kit.id"
            :kit="kit"
            :rank="i"
            :label="labels[i]"
            :cdt="cdtData.cdt"
            :caudales="kit.caudales"
            :margen="kit.margen"
            :params="{ nd: form.nd, dt: form.dt, tirada: form.tirada }"
            @guardar="guardar"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import KitCard from '../components/KitCard.vue'
import { getKits, saveCotizacion } from '../models/kits.js'
import { calcularCDT, sugerirCable, flujoEnCDT, calcularCaudales, calcularMargen } from '../controllers/cdt.js'
import { calcularCostoCable, seleccionarOpciones } from '../controllers/precios.js'

const form = ref({
  cliente: '', ciudad: 'Monterrey, NL', asesor: 'Ing. Miguel González',
  nd: 40, dt: 10, tirada: 50, diametro: 4, presion: 0,
  ctipo: 'CABLE3X12A', cmts: 95, bases: 0
})

const kits = ref([])
const resultados = ref([])
const calculado = ref(false)
const cargando = ref(true)
const labels = ['Opción óptima', 'Mayor caudal', 'Alternativa']

const cdtData = computed(() => calcularCDT({
  nd: form.value.nd, dt: form.value.dt,
  tirada: form.value.tirada, presion: form.value.presion
}))

const cableSugerido = computed(() => sugerirCable(form.value.nd, form.value.tirada))

function upd() {
  form.value.cmts = cableSugerido.value
}

async function calcular() {
  const { cdt } = cdtData.value
  const cc = calcularCostoCable(form.value.ctipo, form.value.cmts)
  const extras = { ctipo: form.value.ctipo, cmts: form.value.cmts, cc, bases: form.value.bases }

  const aptos = kits.value
    .filter(k => k.diam <= form.value.diametro)
    .map(k => ({ ...k, fr: flujoEnCDT(k, cdt) }))
    .filter(k => k.fr > 0)
    .sort((a, b) => a.precio - b.precio)

  const opciones = seleccionarOpciones(aptos)
  resultados.value = opciones.map(k => ({
    ...k,
    caudales: calcularCaudales(k.fr),
    margen: calcularMargen(k, extras)
  }))
  calculado.value = true
}

async function guardar(kit) {
  const { cdt, nd, dt, tirada } = cdtData.value
  await saveCotizacion({
    cliente: form.value.cliente || 'A quien corresponda',
    ciudad: form.value.ciudad,
    asesor: form.value.asesor,
    kit_id: kit.id,
    kit_nombre: kit.name,
    cdt, nd, dt, tirada,
    lpm: kit.fr,
    lpd: kit.caudales.lpd,
    precio_kit: kit.precio,
    precio_total: kit.precio + calcularCostoCable(form.value.ctipo, form.value.cmts) + form.value.bases
  })
  alert('Cotización guardada ✓')
}

onMounted(async () => {
  kits.value = await getKits()
  cargando.value = false
})
</script>
