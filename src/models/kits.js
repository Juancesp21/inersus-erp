import { supabase } from './supabase.js'

export async function getKits() {
  const { data: kits } = await supabase
    .from('kits')
    .select('*')
    .eq('activo', true)

  const { data: comps } = await supabase
    .from('kit_componentes')
    .select('kit_id, cantidad, orden, productos(id, descripcion, precio_venta_mxn, precio_costo_mxn)')

  const { data: flujos } = await supabase
    .from('kit_flujos')
    .select('kit_id, cdt_metros, lpm')
    .order('cdt_metros')

  return kits.map(k => {
    const comp = comps
      .filter(c => c.kit_id === k.id)
      .sort((a, b) => a.orden - b.orden)
      .map(c => ({
        d: c.productos.descripcion,
        s: c.productos.id,
        c: c.cantidad,
        p: c.productos.precio_venta_mxn,
        costo: c.productos.precio_costo_mxn
      }))

    const flujo = {}
    flujos.filter(f => f.kit_id === k.id).forEach(f => { flujo[f.cdt_metros] = f.lpm })

    const costoBase = comp.reduce((s, c) => s + (c.c * (c.costo || 0)), 0)

    return {
      id: k.id,
      name: k.nombre,
      precio: parseFloat(k.precio_venta_mxn),
      hp: k.hp,
      diam: k.diametro_pozo || 4,
      paneles: k.paneles || 0,
      sal: k.descarga || '',
      desc: k.descripcion || '',
      comp,
      flujo,
      cdtMax: k.cdt_max || 100,
      costoBase,
      serie: k.serie
    }
  }).filter(k => k.serie === 'KOLOSAL3' || k.serie === 'KOLOSAL4')
}

export async function saveCotizacion(row) {
  const { error } = await supabase.from('cotizaciones').insert(row)
  return !error
}

export async function getCotizaciones() {
  const { data } = await supabase
    .from('cotizaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  return data || []
}
