import { createRouter, createWebHashHistory } from 'vue-router'
import Cotizador from './views/Cotizador.vue'
import Historial from './views/Historial.vue'

const routes = [
  { path: '/', component: Cotizador },
  { path: '/historial', component: Historial }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
