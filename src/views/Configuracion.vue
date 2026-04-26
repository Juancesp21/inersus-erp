<template>
  <div class="view-container">
    <div class="view-header">
      <h1>Configuración</h1>
    </div>
    <div class="config-grid">

      <!-- PARÁMETROS DEL SISTEMA -->
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
          <span class="config-note" style="margin-top:4px;display:block">Estos términos aplican solo a tu usuario / sucursal</span>
        </div>
        <button class="btn-save" @click="guardarParams">Guardar parámetros</button>
        <div class="save-msg" v-if="savedParams">✓ Guardado</div>
      </div>

      <!-- MI PERFIL -->
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
          <input type="text" v-model="emailAsesor" />
        </div>
        <button class="btn-save" @click="guardarPerfil">Guardar perfil</button>
        <div class="save-msg" v-if="savedPerfil">✓ Guardado</div>
      </div>

      <!-- GESTIÓN DE USUARIOS — solo maestro -->
      <div class="config-card" v-if="esMaestro">
        <h3>Usuarios</h3>
        <div class="usuarios-list">
          <div class="usuario-item" v-for="u in usuarios" :key="u.id" style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0;">
            <div class="user-avatar-sm">{{ u.username[0].toUpperCase() }}</div>
            <div style="flex:1">
              <div class="user-name-sm">{{ u.nombre }} <span style="font-size:11px;color:#888">({{ u.username }})</span></div>
              <div class="user-role-sm">{{ u.rol }} · {{ u.sucursal }}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn-edit-user" @click="editarUsuario(u)">Editar</button>
              <button class="btn-toggle-user" @click="toggleUsuario(u)" :style="u.activo ? 'color:#dc2626' : 'color:#16a34a'">
                {{ u.activo ? 'Desactivar' : 'Activar' }}
              </button>
            </div>
          </div>
        </div>
        <button class="btn-save" style="margin-top:16px" @click="mostrarFormNuevo = true">+ Nuevo usuario</button>

        <!-- FORM NUEVO / EDITAR USUARIO -->
        <div v-if="mostrarFormNuevo || usuarioEditando" class="form-usuario">
          <h4>{{ usuarioEditando ? 'Editar usuario' : 'Nuevo usuario' }}</h4>
          <div class="config-field">
            <label>Username</label>
            <input type="text" v-model="formU.username" :disabled="!!usuarioEditando" />
          </div>
          <div class="config-field">
            <label>Contraseña</label>
            <input type="password" v-model="formU.password" placeholder="Dejar vacío para no cambiar" />
          </div>
          <div class="config-field">
            <label>Nombre completo</label>
            <input type="text" v-model="formU.nombre" />
          </div>
          <div class="config-field">
            <label>Email</label>
            <input type="text" v-model="formU.email" />
          </div>
          <div class="config-field">
            <label>Teléfono</label>
            <input type="text" v-model="formU.telefono" />
          </div>
          <div class="config-field">
            <label>Rol</label>
            <select v-model="formU.rol">
              <option value="maestro">Maestro</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="config-field">
            <label>Sucursal</label>
            <select v-model="formU.sucursal">
              <option value="monterrey">Monterrey</option>
              <option value="mochis">Los Mochis</option>
            </select>
          </div>
          <div class="config-field">
            <label>Términos y condiciones</label>
            <textarea v-model="formU.terminos" rows="5" style="border:1px solid var(--g100);border-radius:5px;padding:8px;font-family:inherit;font-size:12px;width:100%;resize:vertical;"></textarea>
          </div>
          <div style="display:flex;gap:10px;margin-top:12px">
            <button class="btn-save" @click="guardarUsuario">{{ usuarioEditando ? 'Guardar cambios' : 'Crear usuario' }}</button>
            <button class="btn-cancel" @click="cancelarForm">Cancelar</button>
          </div>
          <div class="save-msg" v-if="savedUsuario">✓ Usuario guardado</div>
        </div>
      </div>

      <!-- LISTA USUARIOS — solo admin (solo ve los de su sucursal) -->
      <div class="config-card" v-else>
        <h3>Equipo</h3>
        <div class="usuarios-list">
          <div class="usuario-item" v-for="u in usuarios" :key="u.id" style="display:flex;align-items:center;gap:10px;padding:8px 0;">
            <div class="user-avatar-sm">{{ u.username[0].toUpperCase() }}</div>
            <div>
              <div class="user-name-sm">{{ u.nombre }}</div>
              <div class="user-role-sm">{{ u.rol }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CONEXIÓN SUPABASE -->
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

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../models/supabase.js'

const tdc = ref(18.15)
const hrs = ref(6)
const dias = ref(7)
const margenMin = ref(20)
const ffric = ref(parseFloat(localStorage.getItem('ins_ffric') || 4.5))
const terminos = ref(localStorage.getItem('ins_terminos') || '')
const savedParams = ref(false)
const savedPerfil = ref(false)
const savedUsuario = ref(false)
const dbOk = ref(false)
const sbUrl = 'https://glxuzzzjfnqmsgxljctx.supabase.co'
const nombreAsesor = ref(localStorage.getItem('ins_asesor') || '')
const telefono = ref(localStorage.getItem('ins_tel') || '')
const emailAsesor = ref(localStorage.getItem('ins_email') || '')
const usuarios = ref([])
const mostrarFormNuevo = ref(false)
const usuarioEditando = ref(null)

const uid = sessionStorage.getItem('ins_uid')
const rol = sessionStorage.getItem('ins_rol')
const sucursal = sessionStorage.getItem('ins_sucursal')
const esMaestro = computed(() => rol === 'maestro')

const TERMINOS_DEFAULT = `Información de pago:
- Beneficiario: Inersus Ingeniería Sustentable SA de CV
- CLABE: 012580001234645395
- Guía de rastreo en máx. 1 día hábil tras embarque
- Equipo con seguro de paquetería — reportar daños en 24hrs
- Garantía de 2 años en bomba y controlador`

const formU = ref({
  username: '', password: '', nombre: '', email: '',
  telefono: '', rol: 'admin', sucursal: 'monterrey',
  terminos: TERMINOS_DEFAULT
})

async function cargarUsuarios() {
  let query = supabase.from('usuarios').select('id, username, nombre, rol, sucursal, email, telefono, terminos, activo')
  if (!esMaestro.value) query = query.eq('sucursal', sucursal)
  const { data } = await query.order('created_at')
  if (data) usuarios.value = data
}

async function guardarParams() {
  localStorage.setItem('ins_tdc', tdc.value)
  localStorage.setItem('ins_hrs', hrs.value)
  localStorage.setItem('ins_dias', dias.value)
  localStorage.setItem('ins_margen_min', margenMin.value)
  localStorage.setItem('ins_ffric', ffric.value)
  localStorage.setItem('ins_terminos', terminos.value)
  // Guardar términos en Supabase para este usuario
  await supabase.from('usuarios').update({ terminos: terminos.value, tdc: tdc.value }).eq('id', uid)
  savedParams.value = true
  setTimeout(() => { savedParams.value = false }, 2000)
}

async function guardarPerfil() {
  localStorage.setItem('ins_asesor', nombreAsesor.value)
  localStorage.setItem('ins_tel', telefono.value)
  localStorage.setItem('ins_email', emailAsesor.value)
  await supabase.from('usuarios').update({
    nombre: nombreAsesor.value,
    telefono: telefono.value,
    email: emailAsesor.value
  }).eq('id', uid)
  sessionStorage.setItem('ins_nombre', nombreAsesor.value)
  savedPerfil.value = true
  setTimeout(() => { savedPerfil.value = false }, 2000)
}

function editarUsuario(u) {
  usuarioEditando.value = u
  mostrarFormNuevo.value = false
  formU.value = {
    username: u.username,
    password: '',
    nombre: u.nombre,
    email: u.email || '',
    telefono: u.telefono || '',
    rol: u.rol,
    sucursal: u.sucursal,
    terminos: u.terminos || TERMINOS_DEFAULT
  }
}

function cancelarForm() {
  mostrarFormNuevo.value = false
  usuarioEditando.value = null
  formU.value = { username: '', password: '', nombre: '', email: '', telefono: '', rol: 'admin', sucursal: 'monterrey', terminos: TERMINOS_DEFAULT }
}

async function guardarUsuario() {
  if (!formU.value.username || !formU.value.nombre) return
  if (usuarioEditando.value) {
    const updates = {
      nombre: formU.value.nombre,
      email: formU.value.email,
      telefono: formU.value.telefono,
      rol: formU.value.rol,
      sucursal: formU.value.sucursal,
      terminos: formU.value.terminos
    }
    if (formU.value.password) updates.password = formU.value.password
    await supabase.from('usuarios').update(updates).eq('id', usuarioEditando.value.id)
  } else {
    await supabase.from('usuarios').insert({
      username: formU.value.username,
      password: formU.value.password,
      nombre: formU.value.nombre,
      email: formU.value.email,
      telefono: formU.value.telefono,
      rol: formU.value.rol,
      sucursal: formU.value.sucursal,
      terminos: formU.value.terminos,
      activo: true
    })
  }
  savedUsuario.value = true
  setTimeout(() => { savedUsuario.value = false }, 2000)
  cancelarForm()
  cargarUsuarios()
}

async function toggleUsuario(u) {
  await supabase.from('usuarios').update({ activo: !u.activo }).eq('id', u.id)
  cargarUsuarios()
}

onMounted(async () => {
  tdc.value = localStorage.getItem('ins_tdc') || 18.15
  hrs.value = localStorage.getItem('ins_hrs') || 6
  dias.value = localStorage.getItem('ins_dias') || 7
  margenMin.value = localStorage.getItem('ins_margen_min') || 20

  // Cargar perfil y términos desde Supabase
  const { data } = await supabase.from('usuarios').select('nombre, email, telefono, terminos, tdc').eq('id', uid).single()
  if (data) {
    nombreAsesor.value = data.nombre || ''
    emailAsesor.value = data.email || ''
    telefono.value = data.telefono || ''
    if (data.terminos) terminos.value = data.terminos
    if (data.tdc) tdc.value = data.tdc
  }

  const { error } = await supabase.from('kits').select('id').limit(1)
  dbOk.value = !error

  cargarUsuarios()
})
</script>

<style scoped>
.form-usuario {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
.form-usuario h4 {
  margin: 0 0 14px;
  font-size: 14px;
  color: #0d2240;
}
.btn-edit-user {
  background: none;
  border: 1px solid #0d2240;
  color: #0d2240;
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
}
.btn-toggle-user {
  background: none;
  border: 1px solid currentColor;
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
}
.btn-cancel {
  background: none;
  border: 1px solid #d1d5db;
  color: #666;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
  background: white;
}
</style>