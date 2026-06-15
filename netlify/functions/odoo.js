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

    // Autenticar con JSON-RPC
    const authRes = await fetch(`${ODOO_URL}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 1,
        params: {
          db: ODOO_DB,
          login: ODOO_USER,
          password: ODOO_KEY
        }
      })
    })

    const authData = await authRes.json()
    const uid = authData.result?.uid

    if (!uid) {
      return {
        statusCode: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Auth failed: ' + JSON.stringify(authData.result) })
      }
    }

    // Extraer cookies de sesión
    const cookies = authRes.headers.get('set-cookie')

    async function rpc(model, method, args, kwargs = {}) {
      const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies || ''
        },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'call', id: Math.random(),
          params: { model, method, args, kwargs }
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.data?.message || data.error.message)
      return data.result
    }

    // BUSCAR CLIENTES
    if (action === 'search_partners') {
      const result = await rpc('res.partner', 'search_read',
        [[['name', 'ilike', payload.query], ['customer_rank', '>', 0]]],
        { fields: ['id', 'name', 'street', 'city', 'state_id', 'vat', 'phone', 'email'], limit: 8 }
      )
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result || [])
      }
    }

    // CREAR COTIZACIÓN
    if (action === 'create_quotation') {
      const { cliente_id, cliente_nombre, lineas } = payload

      let partnerId = cliente_id

      if (!partnerId) {
        const found = await rpc('res.partner', 'search_read',
          [[['name', '=', cliente_nombre]]],
          { fields: ['id'], limit: 1 }
        )
        if (found?.length) {
          partnerId = found[0].id
        } else {
          partnerId = await rpc('res.partner', 'create',
            [{ name: cliente_nombre, customer_rank: 1 }]
          )
        }
      }

      const saleId = await rpc('sale.order', 'create', [{
        partner_id: partnerId,
        order_line: lineas.map(l => [0, 0, {
          name: l.descripcion,
          product_uom_qty: l.cantidad,
          price_unit: l.precio,
        }])
      }])

      const saleData = await rpc('sale.order', 'read', [[saleId]], { fields: ['name'] })
      const nombre = saleData?.[0]?.name || `S${saleId}`

      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          id: saleId,
          nombre,
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