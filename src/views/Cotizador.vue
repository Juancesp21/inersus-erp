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
            <label>Tubería de columna</label>
            <select v-model="form.tuberia">
              <option value="no">No incluir</option>
              <option value="si">Incluir</option>
            </select>
          </div>
          <template v-if="form.tuberia === 'si'">
            <div class="field">
              <label>Serie de tubería</label>
              <select v-model="form.tuberiaSerie">
                <option value="150">Serie 150 (hasta 150m CDT)</option>
                <option value="250">Serie 250 (más de 250m CDT)</option>
              </select>
            </div>
            <div class="field">
              <label>Tramos de tubería (c/u 3m)</label>
              <input type="number" v-model.number="form.tuberiaTramos" min="1" max="200"/>
              <span class="hint">Sugerido: {{ tramosSugeridos }}  tramos ({{ tramosSugeridos * 3 }}m)</span>
            </div>
            <div class="field">
              <label>Adaptador de tubería</label>
              <select v-model="form.adaptador">
                <option value="no">No incluir</option>
                <option value="hierro">Hierro</option>
                <option value="acero">Acero inoxidable</option>
              </select>
            </div>
            <div class="field">
              <label>Válvula check</label>
              <select v-model="form.valvula">
                <option value="no">No incluir</option>
                <option value="si">Incluir</option>
              </select>
            </div>
          </template>

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
            :extras="kit.extras"
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
import {
  calcularCostoCable, calcularCostoTuberia, calcularCostoAdaptador,
  calcularCostoValvula, calcularTotalProyecto, seleccionarOpciones, tramosSugeridos
} from '../controllers/precios.js'

const form = ref({
  cliente: '', ciudad: 'Monterrey, NL', asesor: localStorage.getItem('ins_asesor') || 'Ing. Miguel González',
  nd: 40, dt: 10, tirada: 50, presion: 0,
  ctipo: 'CABLE3X12A', cmts: 95, bases: 0,
  tuberia: 'no', tuberiaSerie: '150', tuberiaTramos: 14,
  adaptador: 'no', valvula: 'no'
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
const tramosSugeridosVal = computed(() => tramosSugeridos(form.value.nd))

function upd() {
  form.value.cmts = cableSugerido.value
  form.value.tuberiaTramos = tramosSugeridosVal.value
}

function buildExtras(kit) {
  const diametro = kit.sal === '2"' ? '2' : '1.25'
  const cc = calcularCostoCable(form.value.ctipo, form.value.cmts)
  const costoTuberia = calcularCostoTuberia(
    form.value.tuberia === 'si',
    form.value.tuberiaSerie,
    diametro,
    form.value.tuberiaTramos
  )
  const costoAdaptador = calcularCostoAdaptador(
    form.value.adaptador !== 'no',
    form.value.adaptador,
    diametro
  )
  const costoValvula = calcularCostoValvula(form.value.valvula === 'si', diametro)

  return {
    ctipo: form.value.ctipo,
    cmts: form.value.cmts,
    costoCable: cc,
    tuberia: form.value.tuberia,
    tuberiaSerie: form.value.tuberiaSerie,
    tuberiaTramos: form.value.tuberiaTramos,
    diametro,
    costoTuberia,
    adaptador: form.value.adaptador,
    costoAdaptador,
    valvula: form.value.valvula,
    costoValvula,
    bases: form.value.bases
  }
}

async function calcular() {
  const { cdt } = cdtData.value
  const aptos = kits.value
    .map(k => ({ ...k, fr: flujoEnCDT(k, cdt) }))
    .filter(k => k.fr > 0)
    .sort((a, b) => a.precio - b.precio)

  const opciones = seleccionarOpciones(aptos)
  resultados.value = opciones.map(k => {
    const extras = buildExtras(k)
    return {
      ...k,
      caudales: calcularCaudales(k.fr),
      margen: calcularMargen(k, extras),
      extras,
      total: calcularTotalProyecto(k, extras)
    }
  })
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
    precio_total: kit.total,
    extras: kit.extras
  })
  alert('Cotización guardada ✓')
}

onMounted(async () => {
  kits.value = await getKits()
  cargando.value = false
  upd()
})
</script>
