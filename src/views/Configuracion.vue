<template>
  <div class="view-container">
    <div class="view-header">
      <h1>Configuración</h1>
    </div>
    <div class="config-grid">
      <div class="config-card">
        <h3>Parámetros del sistema</h3>
        <div class="config-field">
          <label>TDC (MXN por USD)</label>
          <input type="number" v-model="tdc" step="0.01" />
        </div>
        <div class="config-field">
          <label>Horas de sol por día</label>
          <input type="number" v-model="hrs" step="0.5" />
        </div>
        <div class="config-field">
          <label>Días por semana</label>
          <input type="number" v-model="dias" />
        </div>
        <div class="config-field">
          <label>Margen mínimo (%)</label>
          <input type="number" v-model="margenMin" />
        </div> 
        <div class="config-field">
          <label>Factor de fricción (%)</label>
          <input type="number" v-model="ffric" step="0.1" />
        </div>
        
        <div class="config-field">
          <label>Términos y condiciones (PDF)</label>
          <textarea v-model="terminos" rows="8" style="border:1px solid var(--g100);border-radius:5px;padding:8px;font-family:inherit;font-size:12px;width:100%;resize:vertical;"></textarea>
        </div>
        <button class="btn-save" @click="guardarParams">Guardar parámetros</button>
        <div class="save-msg" v-if="savedParams">✓ Guardado</div>
      </div>

      <div class="config-card">
        <h3>Usuarios</h3>
        <div class="usuarios-list">
          <div class="usuario-item" v-for="u in usuarios" :key="u.user">
            <div class="user-avatar-sm">{{ u.user[0].toUpperCase() }}</div>
            <div>
              <div class="user-name-sm">{{ u.user }}</div>
              <div class="user-role-sm">{{ u.role }}</div>
            </div>
          </div>
        </div>
        <p class="config-note">Para agregar usuarios contacta al administrador.</p>
      </div>

      <div class="config-card">
        <h3>Conexión Supabase</h3>
        <div class="config-field">
          <label>URL del proyecto</label>
          <input type="text" :value="sbUrl" readonly />
        </div>
        <div class="db-status">
          <span class="db-dot" :class="dbOk ? 'ok' : 'off'"></span>
          {{ dbOk ? 'Conectado' : 'Sin conexión' }}
        </div>
      </div>

      <div class="config-card">
        <h3>Mi perfil</h3>
        <div class="config-field">
          <label>Nombre del asesor</label>
          <input type="text" v-model="nombreAsesor" />
        </div>
        <div class="config-field">
          <label>Teléfono</label>
          <input type="text" v-model="telefono" />
        </div>
        <div class="config-field">
          <label>Email</label>
          <input type="text" v-model="email" />
        </div>
        <button class="btn-save" @click="guardarPerfil">Guardar perfil</button>
        <div class="save-msg" v-if="savedPerfil">✓ Guardado</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../models/supabase.js'

const tdc = ref(18.15)
const hrs = ref(6)
const dias = ref(7)
const margenMin = ref(20)
const ffric = ref(parseFloat(localStorage.getItem('ins_ffric') || 4.5))
const terminos = ref(localStorage.getItem('ins_terminos') || `Información de pago:\n- Beneficiario: Inersus Ingeniería Sustentable SA de CV\n- CLABE: 012580001234645395\n- Guía de rastreo en máx. 1 día hábil tras embarque\n- Equipo con seguro de paquetería — reportar daños en 24hrs\n- Garantía de 2 años en bomba y controlador`)
const savedParams = ref(false)
const savedPerfil = ref(false)
const dbOk = ref(false)
const sbUrl = 'https://glxuzzzjfnqmsgxljctx.supabase.co'
const nombreAsesor = ref(localStorage.getItem('ins_asesor') || 'Ing. Miguel González')
const telefono = ref(localStorage.getItem('ins_tel') || '(81) 1639 2002')
const email = ref(localStorage.getItem('ins_email') || 'gonzalezm@inersus.mx')

const usuarios = [
  { user: 'inersus', role: 'Administrador' },
  { user: 'ventas', role: 'Asesor' },
  { user: 'miguel', role: 'Asesor' }
]

function guardarParams() {
  localStorage.setItem('ins_tdc', tdc.value)
  localStorage.setItem('ins_hrs', hrs.value)
  localStorage.setItem('ins_dias', dias.value)
  localStorage.setItem('ins_margen_min', margenMin.value)
  savedParams.value = true
  setTimeout(() => { savedParams.value = false }, 2000)
  localStorage.setItem('ins_ffric', ffric.value)
  localStorage.setItem('ins_terminos', terminos.value)
}

function guardarPerfil() {
  localStorage.setItem('ins_asesor', nombreAsesor.value)
  localStorage.setItem('ins_tel', telefono.value)
  localStorage.setItem('ins_email', email.value)
  savedPerfil.value = true
  setTimeout(() => { savedPerfil.value = false }, 2000)
}

onMounted(async () => {
  tdc.value = localStorage.getItem('ins_tdc') || 18.15
  hrs.value = localStorage.getItem('ins_hrs') || 6
  dias.value = localStorage.getItem('ins_dias') || 7
  margenMin.value = localStorage.getItem('ins_margen_min') || 20
  const { error } = await supabase.from('kits').select('id').limit(1)
  dbOk.value = !error
})
</script>
