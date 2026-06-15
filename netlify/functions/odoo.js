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

    // Autenticar y obtener uid
    const authRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 1,
        params: {
          model: 'res.users',
          method: 'authenticate',
          args: [ODOO_DB, ODOO_USER, ODOO_KEY, {}],
          kwargs: {}
        }
      })
    })
    const authData = await authRes.json()
    const uid = authData.result

    if (!uid) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Auth failed' }) }
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(`${ODOO_USER}:${ODOO_KEY}`).toString('base64')}`
    }

    // BUSCAR CLIENTES
    if (action === 'search_partners') {
      const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'call', id: 2,
          params: {
            model: 'res.partner',
            method: 'search_read',
            args: [[['name', 'ilike', payload.query], ['customer_rank', '>', 0]]],
            kwargs: {
              fields: ['id', 'name', 'street', 'city', 'state_id', 'vat', 'phone', 'email'],
              limit: 8,
              context: { lang: 'es_MX' }
            }
          }
        })
      })
      const data = await res.json()
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(data.result || [])
      }
    }

    // CREAR COTIZACIÓN
    if (action === 'create_quotation') {
      const { cliente_id, cliente_nombre, lineas } = payload

      // Buscar o crear cliente
      let partnerId = cliente_id
      if (!partnerId && cliente_nombre) {
        const searchRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', method: 'call', id: 3,
            params: {
              model: 'res.partner',
              method: 'search_read',
              args: [[['name', '=', cliente_nombre]]],
              kwargs: { fields: ['id'], limit: 1 }
            }
          })
        })
        const searchData = await searchRes.json()
        if (searchData.result?.length) {
          partnerId = searchData.result[0].id
        } else {
          // Crear cliente nuevo
          const createRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', method: 'call', id: 4,
              params: {
                model: 'res.partner',
                method: 'create',
                args: [{ name: cliente_nombre, customer_rank: 1 }],
                kwargs: {}
              }
            })
          })
          const createData = await createRes.json()
          partnerId = createData.result
        }
      }

      // Crear cotización
      const saleRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'call', id: 5,
          params: {
            model: 'sale.order',
            method: 'create',
            args: [{
              partner_id: partnerId,
              order_line: lineas.map(l => [0, 0, {
                name: l.descripcion,
                product_uom_qty: l.cantidad,
                price_unit: l.precio,
                product_uom: 1
              }])
            }],
            kwargs: {}
          }
        })
      })
      const saleData = await saleRes.json()
      const saleId = saleData.result

      // Obtener número de cotización
      const numRes = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', method: 'call', id: 6,
          params: {
            model: 'sale.order',
            method: 'read',
            args: [[saleId]],
            kwargs: { fields: ['name'] }
          }
        })
      })
      const numData = await numRes.json()
      const nombre = numData.result?.[0]?.name || `S${saleId}`

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
      body: JSON.stringify({ error: err.message })
    }
  }
}
