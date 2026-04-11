import { createRouter, createWebHashHistory } from 'vue-router'
import Cotizador from './views/Cotizador.vue'
import Catalogo from './views/Catalogo.vue'
import Configuracion from './views/Configuracion.vue'

const routes = [
  { path: '/', redirect: '/cotizador' },
  { path: '/cotizador', component: Cotizador },
  { path: '/catalogo', component: Catalogo },
  { path: '/configuracion', component: Configuracion }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
