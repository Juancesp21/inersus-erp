<template>
  <div class="kcard" :class="`r${rank + 1}`">
    <div class="khead">
      <div class="khead-top">
        <div>
          <div class="kranklbl">{{ label }}</div>
          <div class="kname">{{ kit.name }}</div>
          <div class="kdesc">{{ kit.desc }}</div>
        </div>
        <div class="kprice">
          <div class="amount">${{ kit.precio.toLocaleString('es-MX') }}</div>
          <div class="plbl">kit completo c/IVA</div>
        </div>
      </div>
      <div class="pills">
        <span class="pill">{{ kit.hp }} HP</span>
        <span class="pill">{{ kit.paneles }} paneles</span>
        <span class="pill">⌀ {{ kit.diam }}"</span>
        <span class="pill">Desc. {{ kit.sal }}</span>
        <span class="pill">CDT máx. {{ kit.cdtMax }}m</span>
      </div>
    </div>

    <div class="fsec">
      <div class="ftitle">Agua generada · CDT={{ cdt.toFixed(0) }}m · 6 hrs/día</div>
      <!-- DESKTOP -->
      <div class="fgrid desktop-fgrid">
        <div class="fcell fh">L/seg</div>
        <div class="fcell fh">L/min</div>
        <div class="fcell fh">L/día</div>
        <div class="fcell fh">L/semana</div>
        <div class="fcell"><div class="fv">{{ caudales.lps }}</div></div>
        <div class="fcell"><div class="fv">{{ caudales.lpm }}</div></div>
        <div class="fcell"><div class="fv">{{ caudales.lpd.toLocaleString() }}</div></div>
        <div class="fcell"><div class="fv">{{ caudales.lsem.toLocaleString() }}</div></div>
      </div>
      <!-- MÓVIL -->
      <div class="fgrid mobile-fgrid">
        <div class="fcell frow">
          <span class="flbl">L / segundo</span>
          <span class="fv">{{ caudales.lps }}</span>
        </div>
        <div class="fcell frow">
          <span class="flbl">L / minuto</span>
          <span class="fv">{{ caudales.lpm }}</span>
        </div>
        <div class="fcell frow">
          <span class="flbl">L / día</span>
          <span class="fv">{{ caudales.lpd.toLocaleString() }}</span>
        </div>
        <div class="fcell frow">
          <span class="flbl">L / semana</span>
          <span class="fv">{{ caudales.lsem.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <div class="desglose" v-if="tieneAccesorios">
      <div class="desglose-title">Accesorios del proyecto</div>
      <div class="desglose-row" v-if="extras.costoCable > 0">
        <span>Cable sumergible {{ extras.ctipo }} × {{ extras.cmts }}m</span>
        <span class="mono">${{ extras.costoCable.toLocaleString('es-MX') }}</span>
      </div>
      <div class="desglose-row" v-if="extras.costoTuberia > 0">
        <span>Tubería {{ extras.tuberiaTramos }} tramos × 3m · {{ extras.diametro }}" Serie {{ extras.tuberiaSerie }}</span>
        <span class="mono">${{ extras.costoTuberia.toLocaleString('es-MX') }}</span>
      </div>
      <div class="desglose-row" v-if="extras.costoAdaptador > 0">
        <span>Adaptador {{ extras.adaptador }} {{ extras.diametro }}"</span>
        <span class="mono">${{ extras.costoAdaptador.toLocaleString('es-MX') }}</span>
      </div>
      <div class="desglose-row" v-if="extras.costoValvula > 0">
        <span>Válvula check {{ extras.diametro }}"</span>
        <span class="mono">${{ extras.costoValvula.toLocaleString('es-MX') }}</span>
      </div>
      <div class="desglose-row" v-if="extras.bases > 0">
        <span>Bases inclinadas</span>
        <span class="mono">${{ extras.bases.toLocaleString('es-MX') }}</span>
      </div>
      <div class="desglose-total">
        <span>Total del proyecto</span>
        <span class="mono">${{ totalProyecto.toLocaleString('es-MX') }}</span>
      </div>
    </div>

    <div class="total-proyecto" v-else>
      <span>Total del proyecto</span>
      <span class="mono">${{ totalProyecto.toLocaleString('es-MX') }}</span>
    </div>

    <div class="resumen-box" :class="{ copied }" @click="copiar" title="Clic para copiar">
      <div class="resumen-label">
        <span>Resumen</span>
        <span class="copy-hint">{{ copied ? '✓ Copiado' : '📋 Clic para copiar' }}</span>
      </div>
      <div class="resumen-text">{{ resumen }}</div>
    </div>

    <!-- ODOO RESULT -->
    <div class="odoo-result" v-if="odooResult">
      <span>✓ Cotización creada en Odoo:</span>
      <a :href="odooResult.url" target="_blank" class="odoo-link">{{ odooResult.nombre }}</a>
    </div>

    <div class="kactions">
      <button class="btn-pdf" @click="descargarPDF">Descargar PDF</button>
      <button class="btn-sec" @click="$emit('guardar', kit)">Guardar</button>
      <button class="btn-odoo" @click="enviarOdoo" :disabled="enviandoOdoo">
        {{ enviandoOdoo ? 'Enviando...' : '🔗 Enviar a Odoo' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { generarPDF } from '../controllers/pdf.js'

const props = defineProps(['kit', 'rank', 'label', 'cdt', 'caudales', 'margen', 'extras', 'params'])
const emit = defineEmits(['pdf', 'guardar'])
const copied = ref(false)
const enviandoOdoo = ref(false)
const odooResult = ref(null)

const tieneAccesorios = computed(() => {
  const e = props.extras
  return e && (e.costoCable > 0 || e.costoTuberia > 0 || e.costoAdaptador > 0 || e.costoValvula > 0 || e.bases > 0)
})

const totalProyecto = computed(() => {
  const e = props.extras
  if (!e) return props.kit.precio
  return props.kit.precio + (e.costoCable||0) + (e.costoTuberia||0) + (e.costoAdaptador||0) + (e.costoValvula||0) + (e.bases||0)
})

const resumen = computed(() => {
  const { nd, tirada, dt } = props.params
  const c = props.caudales
  return `Considerando ${nd}m de profundidad, ${tirada}m de tirada horizontal con ${dt}m de desnivel, el equipo ${props.kit.id} puede entregar aproximadamente ${c.lpm} litros por minuto a descarga libre, igual a ${c.lph.toLocaleString('es-MX')} litros por hora o ${c.lpd.toLocaleString('es-MX')} litros por día.`
})

// Referencia interna en Odoo de la válvula check según diámetro
function refValvula(diam) {
  if (diam === '2') return '80DI2'
  if (diam === '1.25') return '80DI11/4'
  return null
}

// Referencia interna en Odoo del adaptador según material, diámetro y serie
function refAdaptador(mat, diam, serie) {
  if (diam === '1.25') return mat === 'acero' ? 'KA150/250-1.25"' : 'KAH150/250-1.25"'
  if (diam === '2') {
    if (mat === 'acero') return serie === '250' ? 'KA250-2"' : 'KA150-2"'
    return 'KAH150-2"' // hierro 2" solo existe en serie 150
  }
  return null
}

async function copiar() {
  await navigator.clipboard.writeText(resumen.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function enviarOdoo() {
  enviandoOdoo.value = true
  odooResult.value = null
  try {
    // Línea del kit (precio sin IVA; Odoo la trae de la plantilla)
    const kitLinea = {
      descripcion: `${props.kit.name} — Sistema de bombeo solar`,
      cantidad: 1,
      precio: props.kit.precio / 1.16
    }

    // Accesorios aparte, con su referencia de Odoo cuando se conoce.
    // Precios sin IVA (la función agrega el IVA 16%).
    const extrasLineas = []
    const e = props.extras
    if (e?.costoCable > 0) {
      extrasLineas.push({
        ref: e.ctipo, // CABLE3X12A / CABLE3X10A / CABLE3X8A
        descripcion: `Cable sumergible ${e.ctipo} × ${e.cmts}m`,
        cantidad: e.cmts, // se vende por metro
        precio: (e.costoCable / 1.16) / e.cmts
      })
    }
    if (e?.costoTuberia > 0) {
      extrasLineas.push({
        ref: `TUBOA${e.tuberiaSerie} ${e.diametro}"`, // ej: TUBOA150 2"
        descripcion: `Tubería columna ${e.diametro}" serie ${e.tuberiaSerie} × ${e.tuberiaTramos} tramos`,
        cantidad: e.tuberiaTramos, // se vende por tramo
        precio: (e.costoTuberia / 1.16) / e.tuberiaTramos
      })
    }
    if (e?.costoAdaptador > 0) {
      extrasLineas.push({
        ref: refAdaptador(e.adaptador, e.diametro, e.tuberiaSerie),
        descripcion: `Adaptador ${e.adaptador} ${e.diametro}"`,
        cantidad: 1,
        precio: e.costoAdaptador / 1.16
      })
    }
    if (e?.costoValvula > 0) {
      extrasLineas.push({
        ref: refValvula(e.diametro),
        descripcion: `Válvula check ${e.diametro}"`,
        cantidad: 1,
        precio: e.costoValvula / 1.16
      })
    }
    if (e?.bases > 0) {
      extrasLineas.push({
        ref: 'RAINADIC2', // Soporte adicional ($1,250)
        descripcion: 'Bases inclinadas',
        cantidad: 1,
        precio: e.bases / 1.16
      })
    }

    // lineas = kit + extras (se usa solo en el fallback sin plantilla)
    const lineas = [kitLinea, ...extrasLineas]

    const res = await fetch('/.netlify/functions/odoo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_quotation',
        payload: {
          cliente_id: props.params.clienteId || null,
          cliente_nombre: props.params.cliente || 'A quien corresponda',
          kit_id: props.kit.id || '',
          lineas,
          extras_lineas: extrasLineas
        }
      })
    })
    odooResult.value = await res.json()
  } catch (err) {
    alert('Error al enviar a Odoo: ' + err.message)
  } finally {
    enviandoOdoo.value = false
  }
}

function descargarPDF() {
  generarPDF({
    kit: props.kit,
    caudales: props.caudales,
    extras: props.extras || {},
    params: props.params,
    form: {
      asesor: props.params?.asesor || 'Ing. Miguel González',
      cliente: props.params?.cliente || '',
      ciudad: props.params?.ciudad || 'Monterrey, NL'
    },
    cdt: props.cdt
  })
}
</script>

<style scoped>
.mobile-fgrid { display: none; }

.btn-odoo {
  background: #714B67;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-odoo:hover { background: #5a3a52; }
.btn-odoo:disabled { opacity: .6; cursor: not-allowed; }

.odoo-result {
  margin: 0 1.25rem .5rem;
  padding: 8px 12px;
  background: #e6f4ea;
  border-radius: 6px;
  font-size: 12px;
  color: #1a7a4a;
  display: flex;
  align-items: center;
  gap: 8px;
}
.odoo-link {
  font-weight: 700;
  color: #1a7a4a;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .desktop-fgrid { display: none; }
  .mobile-fgrid {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--g100);
    border-radius: 8px;
    overflow: hidden;
  }
  .fcell.frow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .65rem .9rem;
    border-bottom: 1px solid var(--g100);
    background: white;
  }
  .fcell.frow:nth-child(odd) { background: var(--g50); }
  .fcell.frow:last-child { border-bottom: none; }
  .flbl {
    font-size: 11px;
    font-weight: 600;
    color: var(--g300);
    text-transform: uppercase;
    letter-spacing: .05em;
  }
  .fv {
    font-size: 15px;
    font-weight: 600;
    color: var(--navy);
    font-family: 'DM Mono', monospace;
  }
}
</style>