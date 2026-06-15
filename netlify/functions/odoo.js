export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const ODOO_URL = 'https://inersus.odoo.com'
  const ODOO_DB = 'inersus'
  const ODOO_USER = 'espinozaj@inersus.mx'
  const ODOO_KEY = process.env.ODOO_API_KEY

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

  function extractInt(text) {
    const m = text.match(/<value><int>(\d+)<\/int><\/value>/)
    return m ? parseInt(m[1]) : null
  }

  function extractInts(text) {
    const ids = []
    const regex = /<value><int>(\d+)<\/int><\/value>/g
    let m
    while ((m = regex.exec(text)) !== null) ids.push(parseInt(m[1]))
    return ids
  }

  function kitIdToTemplateName(kitId) {
    const m = kitId.match(/^KOLOS(\d+)-(\d+)$/)
    if (m) return `KIT KOLOS ${m[1]}-${m[2]}`
    return null
  }

  try {
    const { action, payload } = JSON.parse(event.body)

    // Auth XML-RPC
    const authBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>authenticate</methodName>
  <params>
    <param><value><string>${ODOO_DB}</string></value></param>
    <param><value><string>${ODOO_USER}</string></value></param>
    <param><value><string>${ODOO_KEY}</string></value></param>
    <param><value><struct></struct></value></param>
  </params>
</methodCall>`

    const authRes = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: authBody
    })
    const uid = extractInt(await authRes.text())
    if (!uid) return { statusCode: 401, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Auth failed' }) }

    async function rpc(model, method, args, kwargs = {}) {
      const body = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${ODOO_KEY}</string></value></param>
    <param><value><string>${model}</string></value></param>
    <param><value><string>${method}</string></value></param>
    <param><value>${jsonToXml(args)}</value></param>
    <param><value>${jsonToXml(kwargs)}</value></param>
  </params>
</methodCall>`
      const res = await fetch(`${ODOO_URL}/xmlrpc/2/object`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body
      })
      return await res.text()
    }

    // BUSCAR CLIENTES
    if (action === 'search_partners') {
      const raw = await rpc('res.partner', 'search_read',
        [[['name', 'ilike', payload.query], ['customer_rank', '>', 0]]],
        { fields: ['id', 'name', 'city', 'vat'], limit: 8 }
      )
      const results = []
      const structRegex = /<struct>([\s\S]*?)<\/struct>/g
      let sm
      while ((sm = structRegex.exec(raw)) !== null) {
        const obj = {}
        const mr = /<member><name>([^<]+)<\/name><value>(?:<string>([^<]*)<\/string>|<int>(\d+)<\/int>)<\/value><\/member>/g
        let mm
        while ((mm = mr.exec(sm[1])) !== null) {
          obj[mm[1]] = mm[3] !== undefined ? parseInt(mm[3]) : mm[2]
        }
        if (obj.id) results.push(obj)
      }
      return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(results) }
    }

    // CREAR COTIZACIÓN
    if (action === 'create_quotation') {
      const { cliente_id, cliente_nombre, kit_id, lineas } = payload
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

      if (!partnerId) {
        return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'No partner' }) }
      }

      // Buscar plantilla
      let templateId = null
      const templateName = kitIdToTemplateName(kit_id)
      if (templateName) {
        const tplRaw = await rpc('sale.quote.template', 'search', [[['name', '=', templateName]]])
        const tplMatch = tplRaw.match(/<data>[\s\S]*?<value><int>(\d+)<\/int><\/value>/)
        if (tplMatch) templateId = parseInt(tplMatch[1])
      }

      // Crear cotización con plantilla — Odoo aplica las líneas automáticamente
      const orderData = { partner_id: partnerId }
      if (templateId) {
        orderData.sale_order_template_id = templateId
      } else {
        orderData.order_line = lineas.map(l => [0, 0, {
          name: l.descripcion,
          product_uom_qty: l.cantidad,
          price_unit: l.precio
        }])
      }

      const saleRaw = await rpc('sale.order', 'create', [orderData])
      const saleId = extractInt(saleRaw)

      // Obtener número real de cotización
      const numRaw = await rpc('sale.order', 'read', [[saleId]], { fields: ['name'] })
      const numMatch = numRaw.match(/S\d+/)
      const nombre = numMatch ? numMatch[1] : `S${saleId}`

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          id: saleId,
          nombre,
          url: `${ODOO_URL}/odoo/sales/${saleId}`,
          plantilla: templateName || null
        })
      }
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) }

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    }
  }
}