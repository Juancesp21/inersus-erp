export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const ODOO_URL = 'https://inersus.odoo.com'
  const ODOO_DB = 'inersus'
  const ODOO_USER = 'espinozaj@inersus.mx'
  const ODOO_KEY = process.env.ODOO_API_KEY

  const CORS = { 'Access-Control-Allow-Origin': '*' }

  // Quita espacios entre tags para que los regex no dependan del formato del XML
  const norm = (t) => t.replace(/>\s+</g, '><')

  function jsonToXml(val) {
    if (Array.isArray(val)) {
      return `<array><data>${val.map(v => `<value>${jsonToXml(v)}</value>`).join('')}</data></array>`
    } else if (val === null || val === undefined) {
      return '<boolean>0</boolean>'
    } else if (typeof val === 'boolean') {
      return `<boolean>${val ? 1 : 0}</boolean>`
    } else if (typeof val === 'number' && Number.isInteger(val)) {
      return `<int>${val}</int>`
    } else if (typeof val === 'number') {
      return `<double>${val}</double>`
    } else if (typeof val === 'string') {
      return `<string>${val.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</string>`
    } else if (typeof val === 'object') {
      const members = Object.entries(val).map(([k,v]) =>
        `<member><name>${k}</name><value>${jsonToXml(v)}</value></member>`
      ).join('')
      return `<struct>${members}</struct>`
    }
    return `<string>${val}</string>`
  }

  // Extractores fault-aware: si Odoo devuelve <fault>, no agarramos el faultCode por error
  function extractInt(text) {
    const t = norm(text)
    if (t.includes('<fault>')) return null
    const m = t.match(/<value><int>(\d+)<\/int><\/value>/)
    return m ? parseInt(m[1]) : null
  }

  function extractInts(text) {
    const t = norm(text)
    if (t.includes('<fault>')) return []
    const ids = []
    const regex = /<value><int>(\d+)<\/int><\/value>/g
    let m
    while ((m = regex.exec(t)) !== null) ids.push(parseInt(m[1]))
    return ids
  }

  function extractFault(text) {
    const m = norm(text).match(/<name>faultString<\/name><value><string>([\s\S]*?)<\/string>/)
    return m ? m[1] : null
  }

  function kitIdToTemplateName(kitId) {
    const m = (kitId || '').match(/^KOLOS(\d+)-(\d+)$/)
    if (m) return `KIT KOLOS ${m[1]}-${m[2]}`
    return null
  }

  // Parsea un search_read de lineas de plantilla
  function parseTemplateLines(raw) {
    const out = []
    const n = norm(raw)
    const structRegex = /<struct>([\s\S]*?)<\/struct>/g
    let sm
    while ((sm = structRegex.exec(n)) !== null) {
      const b = sm[1]
      const pid = b.match(/<name>product_id<\/name><value><array><data><value><int>(\d+)<\/int>/)
      const qty = b.match(/<name>product_uom_qty<\/name><value>(?:<double>|<int>)([\d.]+)/)
      const dty = b.match(/<name>display_type<\/name><value><string>([^<]*)<\/string>/)
      const nme = b.match(/<name>name<\/name><value><string>([\s\S]*?)<\/string>/)
      out.push({
        product_id: pid ? parseInt(pid[1]) : false,
        qty: qty ? parseFloat(qty[1]) : 1,
        display_type: dty ? dty[1] : false,
        name: nme ? nme[1] : ''
      })
    }
    return out
  }

  try {
    const { action, payload } = JSON.parse(event.body)

    // Auth XML-RPC
    const authBody = `<?xml version="1.0"?>
<methodCall><methodName>authenticate</methodName><params>
<param><value><string>${ODOO_DB}</string></value></param>
<param><value><string>${ODOO_USER}</string></value></param>
<param><value><string>${ODOO_KEY}</string></value></param>
<param><value><struct></struct></value></param>
</params></methodCall>`

    const authRes = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
      method: 'POST', headers: { 'Content-Type': 'text/xml' }, body: authBody
    })
    const uid = extractInt(await authRes.text())
    console.log('[odoo] uid:', uid)
    if (!uid) return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Auth failed' }) }

    async function rpc(model, method, args, kwargs = {}) {
      const body = `<?xml version="1.0"?>
<methodCall><methodName>execute_kw</methodName><params>
<param><value><string>${ODOO_DB}</string></value></param>
<param><value><int>${uid}</int></value></param>
<param><value><string>${ODOO_KEY}</string></value></param>
<param><value><string>${model}</string></value></param>
<param><value><string>${method}</string></value></param>
<param><value>${jsonToXml(args)}</value></param>
<param><value>${jsonToXml(kwargs)}</value></param>
</params></methodCall>`
      const res = await fetch(`${ODOO_URL}/xmlrpc/2/object`, {
        method: 'POST', headers: { 'Content-Type': 'text/xml' }, body
      })
      return await res.text()
    }

    // Busca el id del IVA 16% de ventas para aplicarlo a líneas manuales
    async function getIvaTaxId() {
      const raw = await rpc('account.tax', 'search',
        [[['type_tax_use', '=', 'sale'], ['amount', '=', 16]]], { limit: 1 })
      return extractInt(raw)
    }

    // Busca un producto real de Odoo por su Referencia interna (default_code)
    async function findProductByRef(ref) {
      if (!ref) return null
      const raw = await rpc('product.product', 'search', [[['default_code', '=', ref]]], { limit: 1 })
      return extractInt(raw)
    }

    // BUSCAR CLIENTES
    if (action === 'search_partners') {
      const raw = await rpc('res.partner', 'search_read',
        [[['name', 'ilike', payload.query], ['customer_rank', '>', 0]]],
        { fields: ['id', 'name', 'city', 'vat'], limit: 8 }
      )
      const results = []
      const n = norm(raw)
      const structRegex = /<struct>([\s\S]*?)<\/struct>/g
      let sm
      while ((sm = structRegex.exec(n)) !== null) {
        const obj = {}
        const mr = /<member><name>([^<]+)<\/name><value>(?:<string>([^<]*)<\/string>|<int>(\d+)<\/int>)<\/value><\/member>/g
        let mm
        while ((mm = mr.exec(sm[1])) !== null) {
          obj[mm[1]] = mm[3] !== undefined ? parseInt(mm[3]) : mm[2]
        }
        if (obj.id) results.push(obj)
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify(results) }
    }

    // CREAR COTIZACIÓN
    if (action === 'create_quotation') {
      const { cliente_id, cliente_nombre, kit_id, lineas, extras_lineas } = payload
      let partnerId = cliente_id

      // Buscar o crear cliente
      if (!partnerId) {
        const foundRaw = await rpc('res.partner', 'search', [[['name', '=', cliente_nombre]]])
        const ids = extractInts(foundRaw)
        if (ids.length) {
          partnerId = ids[0]
        } else {
          const createRaw = await rpc('res.partner', 'create', [{ name: cliente_nombre, customer_rank: 1 }])
          partnerId = extractInt(createRaw)
        }
      }
      console.log('[odoo] partnerId:', partnerId)
      if (!partnerId) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'No partner' }) }
      }

      // Buscar plantilla — MODELO CORRECTO para Odoo 13+/17/19
      let templateId = null
      const templateName = kitIdToTemplateName(kit_id)
      if (templateName) {
        const tplRaw = await rpc('sale.order.template', 'search', [[['name', '=', templateName]]])
        templateId = extractInt(tplRaw)
      }
      console.log('[odoo] templateName:', templateName, '-> templateId:', templateId)

      // IVA 16% para líneas manuales (accesorios y fallback sin plantilla)
      const ivaTaxId = await getIvaTaxId()
      console.log('[odoo] ivaTaxId:', ivaTaxId)

      // Helper: línea de texto libre (fallback sin plantilla)
      const toOrderLine = (l) => {
        const v = { name: l.descripcion, product_uom_qty: l.cantidad, price_unit: l.precio }
        if (ivaTaxId) v.tax_id = [[6, 0, [ivaTaxId]]]
        return [0, 0, v]
      }

      // Crear la orden
      const orderData = { partner_id: partnerId }
      if (templateId) {
        orderData.sale_order_template_id = templateId
      } else {
        orderData.order_line = (lineas || []).map(toOrderLine)
      }

      const saleRaw = await rpc('sale.order', 'create', [orderData])
      const fault = extractFault(saleRaw)
      if (fault) {
        console.error('[odoo] create fault:', fault)
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: fault }) }
      }
      const saleId = extractInt(saleRaw)
      if (!saleId) {
        console.error('[odoo] sin saleId. raw:', norm(saleRaw).slice(0, 400))
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'No se pudo crear la orden', raw: norm(saleRaw).slice(0, 400) }) }
      }
      console.log('[odoo] saleId:', saleId)

      // Self-heal: si se usó plantilla pero la orden quedó sin líneas
      // (el onchange que copia las líneas no siempre dispara en un create por XML-RPC en v17/19),
      // se leen las líneas de la plantilla y se aplican. Solo actúa si quedó en 0, no duplica.
      if (templateId) {
        const olRaw = await rpc('sale.order', 'read', [[saleId]], { fields: ['order_line'] })
        const olMatch = norm(olRaw).match(/<name>order_line<\/name><value><array><data>([\s\S]*?)<\/data><\/array>/)
        const lineCount = olMatch ? (olMatch[1].match(/<int>/g) || []).length : 0
        console.log('[odoo] lineCount tras create:', lineCount)

        if (lineCount === 0) {
          const tplLinesRaw = await rpc('sale.order.template.line', 'search_read',
            [[['sale_order_template_id', '=', templateId]]],
            { fields: ['product_id', 'product_uom_qty', 'name', 'display_type'] }
          )
          const tplLines = parseTemplateLines(tplLinesRaw)
          const orderLines = tplLines.map(l => {
            if (l.display_type) return [0, 0, { display_type: l.display_type, name: l.name }]
            const v = { product_uom_qty: l.qty || 1 }
            if (l.product_id) v.product_id = l.product_id
            if (l.name) v.name = l.name
            return [0, 0, v]
          })
          if (orderLines.length) {
            const wFault = extractFault(await rpc('sale.order', 'write', [[saleId], { order_line: orderLines }]))
            if (wFault) console.error('[odoo] write líneas fault:', wFault)
            else console.log('[odoo] líneas aplicadas desde plantilla:', orderLines.length)
          } else {
            console.warn('[odoo] la plantilla no devolvió líneas')
          }
        }
      }

      // Agregar accesorios (cable, tubería, bases, adaptador, válvula) encima del kit.
      // Si el accesorio trae 'ref', se busca el producto real de Odoo y se liga (mejor para CFDI).
      // Si no se encuentra, queda como línea de texto con el precio. No duplica el kit.
      if (templateId && Array.isArray(extras_lineas) && extras_lineas.length) {
        const extraOrderLines = []
        for (const l of extras_lineas) {
          let pid = null
          if (l.ref) {
            pid = await findProductByRef(l.ref)
            console.log('[odoo] accesorio ref', l.ref, '-> productId', pid)
          }
          const v = { name: l.descripcion, product_uom_qty: l.cantidad, price_unit: l.precio }
          if (pid) v.product_id = pid
          if (ivaTaxId) v.tax_id = [[6, 0, [ivaTaxId]]]
          extraOrderLines.push([0, 0, v])
        }
        const exFault = extractFault(await rpc('sale.order', 'write', [[saleId], { order_line: extraOrderLines }]))
        if (exFault) console.error('[odoo] write accesorios fault:', exFault)
        else console.log('[odoo] accesorios agregados:', extraOrderLines.length)
      }

      // Número real de la cotización
      // FIX: el regex /S\d+/ no tiene grupo de captura, así que se usa match[0], no match[1]
      const numRaw = await rpc('sale.order', 'read', [[saleId]], { fields: ['name'] })
      const numMatch = norm(numRaw).match(/S\d+/)
      const nombre = numMatch ? numMatch[0] : `S${saleId}`
      console.log('[odoo] nombre:', nombre)

      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({
          id: saleId,
          nombre,
          url: `${ODOO_URL}/odoo/sales/${saleId}`,
          plantilla: templateName || null
        })
      }
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Unknown action' }) }

  } catch (err) {
    console.error('[odoo] error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}