<template>
  <div class="cotizador-proveedor">

    <!-- HEADER -->
    <div class="module-header">
      <div class="header-icon">📄</div>
      <div>
        <h1>Quote Creator</h1>
        <p>Importa una cotización de proveedor y genera tu propuesta Inersus</p>
      </div>
    </div>

    <!-- STEP 1: UPLOAD -->
    <div class="card" v-if="step >= 1">
      <div class="card-title">
        <span class="step-badge">1</span>
        Cotización del proveedor
      </div>

      <div
        class="dropzone"
        :class="{ 'dragover': isDragging, 'loaded': items.length > 0 }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        @click="$refs.fileInput.click()"
      >
        <input ref="fileInput" type="file" accept=".pdf" style="display:none" @change="onFileChange" />
        <div v-if="!pdfFile && !loading">
          <div class="drop-icon">⬆</div>
          <p class="drop-label">Arrastra el PDF del proveedor aquí</p>
          <p class="drop-sub">o haz clic para seleccionar</p>
        </div>
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Leyendo cotización con IA...</p>
        </div>
        <div v-if="pdfFile && !loading" class="loaded-state">
          <span class="file-icon">📋</span>
          <span class="file-name">{{ pdfFile.name }}</span>
          <button class="btn-clear" @click.stop="resetFile">✕ Cambiar</button>
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">⚠ {{ errorMsg }}</div>
    </div>

    <!-- STEP 2: DATOS -->
    <div class="card" v-if="items.length > 0">
      <div class="card-title">
        <span class="step-badge">2</span>
        Datos de la cotización
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Cliente *</label>
          <input v-model="form.cliente" placeholder="Nombre del cliente o empresa" />
        </div>
        <div class="form-group">
          <label>Ubicación *</label>
          <input v-model="form.ciudad" placeholder="Ciudad, Estado" />
        </div>
        <div class="form-group form-full">
          <label>Resumen del proyecto</label>
          <textarea v-model="form.resumen" rows="3" placeholder="Describe brevemente el proyecto..."></textarea>
        </div>
        <div class="form-group">
          <label>Tipo de cambio (MXN/USD)</label>
          <div class="input-with-hint">
            <input v-model.number="form.tdc" type="number" step="0.01" min="1" />
            <span class="input-hint">TDC en tiempo real + $0.10</span>
          </div>
        </div>
        <div class="form-group">
          <label>Margen objetivo sobre precio de venta</label>
          <div class="margin-mode-row">
            <div class="toggle-group">
              <button :class="['toggle-btn', margenMode === 'global' ? 'active' : '']" @click="setMargenMode('global')">Global</button>
              <button :class="['toggle-btn', margenMode === 'item' ? 'active' : '']" @click="setMargenMode('item')">Por ítem</button>
            </div>
            <div v-if="margenMode === 'global'" class="global-margin-input">
              <input v-model.number="form.margenGlobal" type="number" min="0" max="99" step="1" />
              <span>%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: TABLA DE ÍTEMS -->
    <div class="card" v-if="items.length > 0">
      <div class="card-title">
        <span class="step-badge">3</span>
        Partidas detectadas
        <span class="items-count">{{ items.length }} ítems</span>
      </div>

      <div class="table-wrapper">
        <table class="items-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>SKU</th>
              <th class="center">Cant.</th>
              <th class="center">U.M.</th>
              <th class="right">Precio USD</th>
              <th class="right">Costo MXN</th>
              <th v-if="margenMode === 'item'" class="center">Margen %</th>
              <th class="right">Precio venta MXN</th>
              <th class="right">Total MXN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in items" :key="i" :class="i % 2 === 0 ? 'row-even' : 'row-odd'">
              <td class="desc">
                <input class="cell-input" v-model="item.descripcion" />
              </td>
              <td class="sku">
                <input class="cell-input sku-input" v-model="item.sku" />
              </td>
              <td class="center">{{ item.cantidad }}</td>
              <td class="center">{{ item.um }}</td>
              <td class="right">$ {{ fmtUSD(item.precioUSD) }}</td>
              <td class="right muted">$ {{ fmtMXN(item.precioUSD * form.tdc) }}</td>
              <td v-if="margenMode === 'item'" class="center">
                <div class="item-margin-input">
                  <input v-model.number="item.margen" type="number" min="0" max="99" step="1" />
                  <span>%</span>
                </div>
              </td>
              <td class="right bold-blue">$ {{ fmtMXN(precioVenta(item)) }}</td>
              <td class="right bold-navy">$ {{ fmtMXN(precioVenta(item) * item.cantidad) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CARGOS ADICIONALES -->
      <div class="cargos-row">
        <div class="cargo-item">
          <label>Mano de obra</label>
          <div class="cargo-input">
            <span class="cargo-prefix">$</span>
            <input v-model.number="form.manoObra" type="number" min="0" step="100" placeholder="0" />
            <span class="cargo-hint">MXN</span>
          </div>
        </div>
        <div class="cargo-item">
          <label>Envío</label>
          <div class="cargo-input">
            <span class="cargo-prefix">$</span>
            <input v-model.number="form.envio" type="number" min="0" step="100" placeholder="0" />
            <span class="cargo-hint">MXN</span>
          </div>
        </div>
      </div>

      <!-- TOTALES -->
      <div class="totales-row">
        <div class="totales-box">
          <div class="total-line">
            <span>Subtotal equipos</span>
            <span>$ {{ fmtMXN(subtotal) }}</span>
          </div>
          <div class="total-line" v-if="form.manoObra > 0">
            <span>Mano de obra</span>
            <span>$ {{ fmtMXN(form.manoObra) }}</span>
          </div>
          <div class="total-line" v-if="form.envio > 0">
            <span>Envío</span>
            <span>$ {{ fmtMXN(form.envio) }}</span>
          </div>
          <div class="total-line">
            <span>IVA 16%</span>
            <span>$ {{ fmtMXN(totalConCargos * 0.16) }}</span>
          </div>
          <div class="total-line total-final">
            <span>TOTAL</span>
            <span>$ {{ fmtMXN(totalConCargos * 1.16) }}</span>
          </div>
          <div class="margen-badge" :class="margenPromedio >= 20 ? 'badge-green' : 'badge-orange'">
            Margen promedio: {{ margenPromedio.toFixed(1) }}%
          </div>
        </div>
      </div>

      <!-- BOTÓN GENERAR PDF -->
      <div class="actions-row">
        <button class="btn-pdf" @click="generarPDF" :disabled="!form.cliente || !form.ciudad">
          <span>📄</span> Generar PDF Inersus
        </button>
      </div>
    </div>

  </div>
</template>

<script>
import jsPDF from 'jspdf'
import logoUrl from '../assets/logo-inersus.png'

const TERMINOS_DEFAULT = `Información de pago:
- Beneficiario: Inersus Ingeniería Sustentable SA de CV
- CLABE: 012580001234645395
- Guía de rastreo en máx. 1 día hábil tras embarque
- Equipo con seguro de paquetería — reportar daños en 24hrs
- Garantía de 2 años en bomba y controlador`

function folio() {
  const d = new Date()
  return String(d.getDate()).padStart(2,'0') +
    String(d.getMonth()+1).padStart(2,'0') +
    String(d.getFullYear()).slice(-2) +
    String(Math.floor(Math.random()*90+10))
}

export default {
  name: 'CotizadorProveedor',
  data() {
    return {
      step: 1,
      pdfFile: null,
      isDragging: false,
      loading: false,
      errorMsg: '',
      items: [],
      margenMode: 'global',
      form: {
        cliente: '',
        ciudad: '',
        resumen: '',
        tdc: 17.40,
        margenGlobal: 30,
        manoObra: 0,
        envio: 0,
        asesor: localStorage.getItem('ins_asesor') || 'Ing. Miguel González',
      }
    }
  },
  async mounted() {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await res.json()
      this.form.tdc = parseFloat((data.rates.MXN + 0.10).toFixed(2))
    } catch {
      // default 17.40
    }
  },
  computed: {
    subtotal() {
      return this.items.reduce((acc, item) => acc + this.precioVenta(item) * item.cantidad, 0)
    },
    totalConCargos() {
      return this.subtotal + (this.form.manoObra || 0) + (this.form.envio || 0)
    },
    margenPromedio() {
      if (!this.items.length) return 0
      const total = this.items.reduce((acc, item) => {
        const m = this.margenMode === 'global' ? this.form.margenGlobal : (item.margen ?? this.form.margenGlobal)
        return acc + m
      }, 0)
      return total / this.items.length
    }
  },
  methods: {
    setMargenMode(mode) {
      if (mode === 'item' && this.margenMode === 'global') {
        this.items.forEach(item => { item.margen = this.form.margenGlobal })
      }
      this.margenMode = mode
    },
    precioVenta(item) {
      const costoMXN = item.precioUSD * this.form.tdc
      const margen = this.margenMode === 'global'
        ? this.form.margenGlobal
        : (item.margen ?? this.form.margenGlobal)
      if (margen >= 100) return costoMXN
      return costoMXN / (1 - margen / 100)
    },
    fmtUSD(v) {
      return (v || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    fmtMXN(v) {
      return Math.round(v || 0).toLocaleString('es-MX')
    },
    onDrop(e) {
      this.isDragging = false
      const file = e.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') {
        this.procesarPDF(file)
      } else {
        this.errorMsg = 'Por favor arrastra un archivo PDF'
      }
    },
    onFileChange(e) {
      const file = e.target.files[0]
      if (file) this.procesarPDF(file)
    },
    resetFile() {
      this.pdfFile = null
      this.items = []
      this.errorMsg = ''
      this.$refs.fileInput.value = ''
    },
    async procesarPDF(file) {
      this.pdfFile = file
      this.loading = true
      this.errorMsg = ''
      this.items = []

      try {
        const base64 = await this.fileToBase64(file)
        const response = await fetch('/.netlify/functions/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5',
            max_tokens: 1000,
            system: `Eres un extractor de datos de cotizaciones. Extrae todos los ítems de la tabla de productos.
Responde SOLO con JSON válido, sin backticks, sin texto adicional.
Formato exacto:
{"items":[{"sku":"STRING","descripcion":"STRING","cantidad":NUMBER,"um":"STRING","precioUSD":NUMBER}]}
- precioUSD es el precio UNITARIO en USD (número, sin símbolos)
- Si hay ítems duplicados con mismo SKU de distintos almacenes, combínalos sumando cantidades
- um puede ser PZA, M, KG, etc.`,
            messages: [{
              role: 'user',
              content: [
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
                { type: 'text', text: 'Extrae todos los ítems de esta cotización de proveedor.' }
              ]
            }]
          })
        })

        const data = await response.json()
        const text = data.content?.map(b => b.text || '').join('') || ''
        if (!text) throw new Error('Respuesta vacía de API')
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        const consolidado = []
        parsed.items.forEach(it => {
          const existing = consolidado.find(x => x.sku === it.sku)
          if (existing) { existing.cantidad += it.cantidad }
          else { consolidado.push({ ...it, margen: this.form.margenGlobal }) }
        })
        this.items = consolidado

      } catch (err) {
        this.errorMsg = 'No se pudo leer el PDF. Intenta de nuevo o revisa que sea una cotización válida.'
        console.error(err)
      } finally {
        this.loading = false
      }
    },
    fileToBase64(file) {
      return new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = () => rej(new Error('Error al leer archivo'))
        r.readAsDataURL(file)
      })
    },
    generarPDF() {
      const doc = new jsPDF('p', 'mm', 'letter')
      const W = 216, mg = 18
      let y = 10
      const NV = [13, 34, 64], GR = [120, 120, 120]
      const num = folio()
      const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

      // LOGO
      doc.addImage(logoUrl, 'PNG', mg, y, 24, 20)

      // EMPRESA
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('INERSUS INGENIERÍA SUSTENTABLE SA DE CV', mg + 28, y + 5)
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
      ;['Av. Penitenciaria 2224', 'Monterrey, NL México 64270',
        'Asesor de venta: ' + this.form.asesor,
        'Teléfono: (81) 1639 2002',
        'Mail: gonzalezm@inersus.mx'].forEach((l, i) => doc.text(l, mg + 28, y + 10 + i * 4))
      doc.setTextColor(...NV); doc.setFont('helvetica', 'bold')
      doc.text('www.inersus.mx', mg + 28, y + 31)

      // TÍTULO
      doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('COTIZACIÓN', W - mg, y + 7, { align: 'right' })

      // FOLIO TABLE
      const fx = W - mg - 65, fw = 65, fh = 6
      ;[['FECHA', hoy], ['COTIZACIÓN #', num], ['CLIENTE ID', 'N/A']].forEach(([lbl, val], i) => {
        const ry = y + 12 + i * fh
        if (i % 2 === 0) { doc.setFillColor(244, 244, 244); doc.rect(fx, ry, fw, fh, 'F') }
        doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(fx, ry, fw, fh)
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
        doc.text(lbl, fx + 2, ry + 4)
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
        doc.text(val, fx + fw - 2, ry + 4, { align: 'right' })
      })
      y += 36

      // CLIENTE + UBICACIÓN
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('Cliente:', mg, y + 4)
      const cliW = doc.getTextWidth('Cliente:')
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
      doc.text(this.form.cliente || 'A quien corresponda', mg + cliW + 2, y + 4)
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('Ubicación:', mg, y + 10)
      const ubW = doc.getTextWidth('Ubicación:')
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
      doc.text(this.form.ciudad || '', mg + ubW + 2, y + 10)
      y += 18

      // RESUMEN
      if (this.form.resumen) {
        doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 5.5, 'F')
        doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
        doc.text('RESUMEN DEL PROYECTO', W / 2, y + 3.8, { align: 'center' })
        y += 5.5
        const rLines = doc.splitTextToSize(this.form.resumen, W - mg * 2 - 4)
        const rH = rLines.length * 4.5 + 5
        doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(mg, y, W - mg * 2, rH)
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
        doc.text(rLines, mg + 2, y + 4)
        y += rH + 4
      }

      // TABLA PARTIDAS
      const tcols = [mg + 2, mg + 78, mg + 122, mg + 134, mg + 156, W - mg - 2]
      doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 6.5, 'F')
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
      ;[['DESCRIPCIÓN','left'],['MARCA / SKU','left'],['CANT.','right'],['U.M.','left'],['PRECIO UNIT.','right'],['TOTAL MXN','right']]
        .forEach(([h, a], i) => doc.text(h, tcols[i], y + 4.5, { align: a }))
      y += 6.5

      let sub = 0
      this.items.forEach((item, i) => {
        const rh = 6.5
        const pv = this.precioVenta(item)
        const tot = pv * item.cantidad
        sub += tot

        if (i % 2 === 0) { doc.setFillColor(248, 248, 245) } else { doc.setFillColor(255, 255, 255) }
        doc.rect(mg, y, W - mg * 2, rh, 'F')
        doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.2); doc.rect(mg, y, W - mg * 2, rh)

        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
        const descTrunc = (item.descripcion || '').length > 40 ? item.descripcion.substring(0, 40) + '…' : item.descripcion
        doc.text(descTrunc, tcols[0], y + 4.2)

        doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
        const skuTrunc = (item.sku || '').length > 18 ? item.sku.substring(0, 18) + '…' : item.sku
        doc.text(skuTrunc, tcols[1], y + 4.2)

        doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
        doc.text(String(item.cantidad), tcols[2], y + 4.2, { align: 'right' })
        doc.text(item.um || '', tcols[3], y + 4.2)
        doc.text('$' + Math.round(pv).toLocaleString('es-MX'), tcols[4], y + 4.2, { align: 'right' })

        doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
        doc.text('$' + Math.round(tot).toLocaleString('es-MX'), tcols[5], y + 4.2, { align: 'right' })
        y += rh
      })

      // MANO DE OBRA y ENVÍO en tabla
      if (this.form.manoObra > 0) {
        const rh = 6.5
        doc.setFillColor(255, 255, 255); doc.rect(mg, y, W - mg * 2, rh, 'F')
        doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.2); doc.rect(mg, y, W - mg * 2, rh)
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
        doc.text('Mano de obra', tcols[0], y + 4.2)
        doc.text('SERVICIO', tcols[1], y + 4.2)
        doc.text('1', tcols[2], y + 4.2, { align: 'right' })
        doc.text('SVC', tcols[3], y + 4.2)
        doc.text('$' + Math.round(this.form.manoObra).toLocaleString('es-MX'), tcols[4], y + 4.2, { align: 'right' })
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
        doc.text('$' + Math.round(this.form.manoObra).toLocaleString('es-MX'), tcols[5], y + 4.2, { align: 'right' })
        y += rh
      }

      if (this.form.envio > 0) {
        const rh = 6.5
        doc.setFillColor(248, 248, 245); doc.rect(mg, y, W - mg * 2, rh, 'F')
        doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.2); doc.rect(mg, y, W - mg * 2, rh)
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
        doc.text('Envío y flete', tcols[0], y + 4.2)
        doc.text('FLETE', tcols[1], y + 4.2)
        doc.text('1', tcols[2], y + 4.2, { align: 'right' })
        doc.text('SVC', tcols[3], y + 4.2)
        doc.text('$' + Math.round(this.form.envio).toLocaleString('es-MX'), tcols[4], y + 4.2, { align: 'right' })
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
        doc.text('$' + Math.round(this.form.envio).toLocaleString('es-MX'), tcols[5], y + 4.2, { align: 'right' })
        y += rh
      }

      y += 3

      // TÉRMINOS + TOTALES
      const tw = 72, tx = W - mg - tw
      const terminos = localStorage.getItem('ins_terminos') || TERMINOS_DEFAULT
      const termLines = doc.splitTextToSize(terminos, tx - mg - 6)
      const termH = Math.max(termLines.length * 4 + 8, 30)

      doc.setFillColor(...NV); doc.rect(mg, y, tx - mg - 4, 5.5, 'F')
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
      doc.text('TÉRMINOS Y CONDICIONES', mg + 2, y + 3.8)
      doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(mg, y + 5.5, tx - mg - 4, termH)
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
      doc.text(termLines, mg + 2, y + 9.5)

      const totY = y
      const totalFinal = this.totalConCargos
      const iva = totalFinal * 0.16
      ;[['Subtotal', totalFinal, false], ['IVA 16%', iva, false], ['TOTAL', totalFinal + iva, true]].forEach(([lbl, val, bold], i) => {
        const ry2 = totY + i * 6
        if (bold) { doc.setFillColor(180, 210, 240) } else { doc.setFillColor(255, 255, 255) }
        doc.rect(tx, ry2, tw, 6, 'F')
        doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(tx, ry2, tw, 6)
        doc.setFontSize(bold ? 8.5 : 7.5); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...NV)
        doc.text(lbl, tx + 2, ry2 + 4)
        doc.setFont('helvetica', 'bold')
        doc.text('$' + Math.round(val).toLocaleString('es-MX'), tx + tw - 2, ry2 + 4, { align: 'right' })
      })
      doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GR)
      doc.text('Todos nuestros precios incluyen IVA', tx + tw - 2, totY + 22, { align: 'right' })

      y += termH + 10

      // FOOTER
      doc.addImage(logoUrl, 'PNG', W / 2 - 8, y, 16, 13)
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('INERSUS.MX', W / 2, y + 16, { align: 'center' })
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
      doc.text('Un compromiso con la sustentabilidad', W / 2, y + 20, { align: 'center' })
      doc.text('RFC: IIS240227CBA', W / 2, y + 24, { align: 'center' })
      doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('AVISO:', W / 2, y + 29, { align: 'center' })
      const avisoTxt = 'Esta cotización fue elaborada por INERSUS INGENIERÍA SUSTENTABLE SA DE CV. Los precios son estimaciones sujetas a cambios basados en la evaluación final del sitio y los requisitos del proyecto.'
      doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
      doc.text(doc.splitTextToSize(avisoTxt, W - mg * 2), W / 2, y + 32, { align: 'center' })

      doc.save('Inersus_Proveedor_' + num + '.pdf')
    }
  }
}
</script>

<style scoped>
.cotizador-proveedor {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px;
  font-family: 'Segoe UI', sans-serif;
}
.module-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.header-icon { font-size: 32px; }
.module-header h1 { margin: 0; font-size: 20px; color: #0d2240; }
.module-header p { margin: 2px 0 0; font-size: 13px; color: #888; }

.card {
  background: white; border-radius: 10px; border: 1px solid #e5e7eb;
  padding: 20px 24px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.card-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 14px; font-weight: 700; color: #0d2240; margin-bottom: 16px;
}
.step-badge {
  background: #0d2240; color: white; width: 22px; height: 22px;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; flex-shrink: 0;
}
.items-count { margin-left: auto; background: #e8f0fe; color: #0d2240; font-size: 11px; padding: 2px 8px; border-radius: 20px; }

.dropzone {
  border: 2px dashed #c8d4e3; border-radius: 10px; padding: 40px 20px;
  text-align: center; cursor: pointer; transition: all 0.2s; background: #f8fafc;
}
.dropzone:hover, .dropzone.dragover { border-color: #0d2240; background: #eef2f8; }
.dropzone.loaded { border-style: solid; border-color: #22c55e; background: #f0fdf4; padding: 20px; }
.drop-icon { font-size: 32px; margin-bottom: 8px; }
.drop-label { font-size: 15px; font-weight: 600; color: #0d2240; margin: 0; }
.drop-sub { font-size: 12px; color: #aaa; margin: 4px 0 0; }

.loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; color: #0d2240; font-weight: 600; }
.spinner { width: 22px; height: 22px; border: 3px solid #c8d4e3; border-top-color: #0d2240; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.loaded-state { display: flex; align-items: center; justify-content: center; gap: 12px; }
.file-icon { font-size: 24px; }
.file-name { font-size: 14px; font-weight: 600; color: #166534; }
.btn-clear { background: none; border: 1px solid #dc2626; color: #dc2626; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; }
.error-msg { margin-top: 10px; color: #dc2626; font-size: 13px; background: #fef2f2; padding: 8px 12px; border-radius: 6px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-full { grid-column: 1 / -1; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 5px; }
.form-group input, .form-group textarea {
  width: 100%; border: 1px solid #d1d5db; border-radius: 6px;
  padding: 8px 10px; font-size: 13px; outline: none; box-sizing: border-box; transition: border-color 0.2s;
}
.form-group input:focus, .form-group textarea:focus { border-color: #0d2240; }
.input-hint { display: block; font-size: 10px; color: #aaa; margin-top: 3px; }

.margin-mode-row { display: flex; align-items: center; gap: 12px; }
.toggle-group { display: flex; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
.toggle-btn { padding: 7px 16px; font-size: 12px; font-weight: 600; background: white; border: none; cursor: pointer; color: #888; transition: all 0.2s; }
.toggle-btn.active { background: #0d2240; color: white; }
.global-margin-input { display: flex; align-items: center; gap: 6px; font-weight: 700; color: #0d2240; }
.global-margin-input input { width: 60px; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; font-size: 14px; text-align: center; font-weight: 700; }
.item-margin-input { display: flex; align-items: center; gap: 4px; justify-content: center; }
.item-margin-input input { width: 48px; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px; font-size: 12px; text-align: center; }

.table-wrapper { overflow-x: auto; margin-bottom: 16px; }
.items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.items-table th { background: #0d2240; color: white; padding: 8px; font-size: 11px; font-weight: 700; white-space: nowrap; }
.items-table td { padding: 4px 8px; vertical-align: middle; }
.row-even { background: #f8f9fa; }
.row-odd { background: white; }
.center { text-align: center; }
.right { text-align: right; }
.sku { font-weight: 700; color: #0d2240; font-size: 11px; min-width: 120px; }
.desc { color: #444; min-width: 180px; }
.muted { color: #999; }
.bold-blue { color: #1a5276; font-weight: 700; }
.bold-navy { color: #0d2240; font-weight: 800; }

.cell-input {
  width: 100%; border: none; background: transparent;
  font-size: 12px; color: #444; padding: 2px 4px;
  border-radius: 4px; outline: none; box-sizing: border-box;
  font-family: 'Segoe UI', sans-serif;
}
.cell-input:focus { background: #f0f4ff; border: 1px solid #0d2240; }
.sku-input { font-weight: 700; color: #0d2240; font-size: 11px; }

/* CARGOS ADICIONALES */
.cargos-row {
  display: flex;
  gap: 24px;
  padding: 14px 0;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 16px;
}
.cargo-item label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}
.cargo-input {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 10px;
  background: white;
  width: 180px;
}
.cargo-input:focus-within { border-color: #0d2240; }
.cargo-prefix { font-size: 13px; color: #888; font-weight: 600; }
.cargo-input input {
  border: none; outline: none; font-size: 13px;
  width: 100%; font-weight: 600; color: #0d2240;
}
.cargo-hint { font-size: 11px; color: #aaa; white-space: nowrap; }

.totales-row { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.totales-box { min-width: 280px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.total-line { display: flex; justify-content: space-between; padding: 8px 14px; font-size: 13px; border-bottom: 1px solid #f0f0f0; color: #444; }
.total-final { background: #0d2240; color: white; font-weight: 800; font-size: 15px; }
.margen-badge { text-align: center; padding: 6px; font-size: 12px; font-weight: 700; }
.badge-green { background: #dcfce7; color: #166534; }
.badge-orange { background: #fff7ed; color: #9a3412; }

.actions-row { display: flex; justify-content: flex-end; }
.btn-pdf {
  display: flex; align-items: center; gap: 8px; background: #0d2240; color: white;
  border: none; padding: 11px 24px; border-radius: 8px; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background 0.2s;
}
.btn-pdf:hover { background: #1a3a60; }
.btn-pdf:disabled { background: #aaa; cursor: not-allowed; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-full { grid-column: 1; }
  .cargos-row { flex-direction: column; }
}
</style>