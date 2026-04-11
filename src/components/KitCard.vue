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
        <span class="pill">CDT máx. {{ kit.cdtMax }}m</span>
        <span class="pill" :class="margen >= 20 ? 'margen' : 'margen-low'" v-if="margen">Margen ~{{ margen }}%</span>
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

    <div class="resumen-box" :class="{ copied }" @click="copiar" title="Clic para copiar">
      <div class="resumen-label">
        <span>Resumen</span>
        <span class="copy-hint">{{ copied ? '✓ Copiado' : '📋 Clic para copiar' }}</span>
      </div>
      <div class="resumen-text">{{ resumen }}</div>
    </div>

    <div class="kactions">
      <button class="btn-pdf" @click="$emit('pdf', kit)">Descargar PDF</button>
      <button class="btn-sec" @click="$emit('guardar', kit)">Guardar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps(['kit', 'rank', 'label', 'cdt', 'caudales', 'margen', 'params'])
const emit = defineEmits(['pdf', 'guardar'])
const copied = ref(false)

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
</script>
