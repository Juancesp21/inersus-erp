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
      <div class="fgrid">
        <div class="fcell fh">L/seg</div>
        <div class="fcell fh">L/min</div>
        <div class="fcell fh">L/día</div>
        <div class="fcell fh">L/semana</div>
        <div class="fcell"><div class="fv">{{ caudales.lps }}</div></div>
        <div class="fcell"><div class="fv">{{ caudales.lpm }}</div></div>
        <div class="fcell"><div class="fv">{{ caudales.lpd.toLocaleString() }}</div></div>
        <div class="fcell"><div class="fv">{{ caudales.lsem.toLocaleString() }}</div></div>
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

    <div class="kactions">
      <button class="btn-pdf" @click="descargarPDF">Descargar PDF</button>
      <button class="btn-sec" @click="$emit('guardar', kit)">Guardar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { generarPDF } from '../controllers/pdf.js'

const props = defineProps(['kit', 'rank', 'label', 'cdt', 'caudales', 'margen', 'extras', 'params'])
const emit = defineEmits(['pdf', 'guardar'])
const copied = ref(false)

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

async function copiar() {
  await navigator.clipboard.writeText(resumen.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
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
