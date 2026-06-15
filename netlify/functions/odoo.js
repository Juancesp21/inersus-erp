export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const ODOO_URL = 'https://inersus.odoo.com'
  const ODOO_DB = 'inersus'
  const ODOO_USER = 'espinozaj@inersus.mx'
  const ODOO_KEY = process.env.ODOO_API_KEY

  try {
    const { action, payload } = JSON.parse(event.body)

    // Autenticar con XML-RPC
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

    const authText = await authRes.text()
    const uidMatch = authText.match(/<value><int>(\d+)<\/int><\/value>/)
    const uid = uidMatch ? parseInt(uidMatch[1]) : null

    if (!uid) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Auth failed', detail: authText.substring(0, 200) })
      }
    }

    async function rpc(model, method, args) {
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
    <param><value><struct></struct></value></param>
  </params>
</methodCall>`

      const res = await fetch(`${ODOO_URL}/xmlrpc/2/object`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body
      })
      const text = await res.text()
      return parseXmlRpcResponse(text)
    }

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

    function parseXmlRpcResponse(text) {
      // Simple int extraction for IDs
      const intMatch = text.match(/<value><int>(\d+)<\/int><\/value>/)
      if (intMatch) return parseInt(intMatch[1])
      
      // Array of structs (search_read)
      if (text.includes('<array>')) {
        const items = []
        const memberRegex = /<member><name>(\w+)<\/name><value>(?:<string>([^<]*)<\/string>|<int>(\d+)<\/int>|<boolean>([01])<\/boolean>)<\/value><\/member>/g
        let structText = text
        const structRegex = /<struct>([\s\S]*?)<\/struct>/g
        let structMatch
        while ((structMatch = structRegex.exec(text)) !== null) {
          const obj = {}
          let m
          const mr = /<member><name>(\w+)<\/name><value>(?:<string>([^<]*)<\/string>|<int>(\d+)<\/int>)<\/value><\/member>/g
          while ((m = mr.exec(structMatch[1])) !== null) {
            obj[m[1]] = m[3] !== undefined ? parseInt(m[3]) : m[2]
          }
          items.push(obj)
        }
        return items
      }
      return null
    }

    // BUSCAR CLIENTES
    if (action === 'search_partners') {
      const result = await rpc('res.partner', 'search_read', [
        [['name', 'ilike', payload.query], ['customer_rank', '>', 0]],
        ['id', 'name', 'city', 'vat'],
        0, 8
      ])
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(Array.isArray(result) ? result : [])
      }
    }

    // CREAR COTIZACIÓN
    if (action === 'create_quotation') {
      const { cliente_id, cliente_nombre, lineas } = payload
      let partnerId = cliente_id

      if (!partnerId) {
        const found = await rpc('res.partner', 'search', [[['name', '=', cliente_nombre]]])
        if (Array.isArray(found) && found.length) {
          partnerId = found[0]
        } else {
          partnerId = await rpc('res.partner', 'create', [{ name: cliente_nombre, customer_rank: 1 }])
        }
      }

      const orderLines = lineas.map(l => [0, 0, {
        name: l.descripcion,
        product_uom_qty: l.cantidad,
        price_unit: l.precio
      }])

      const saleId = await rpc('sale.order', 'create', [{
        partner_id: partnerId,
        order_line: orderLines
      }])

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          id: saleId,
          nombre: `S${saleId}`,
          url: `${ODOO_URL}/odoo/sales/${saleId}`
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