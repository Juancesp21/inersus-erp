export const HRS = 6
export const DIAS = 7
const EA = 10

export function calcularCDT({ nd, dt, tirada, presion, ffric = 4.5 }) {
  const _nd = parseFloat(nd) || 0
  const _dt = parseFloat(dt) || 0
  const _tirada = parseFloat(tirada) || 0
  const _presion = parseFloat(presion) || 0
  const pf = (_tirada + EA) * (ffric / 100) * 1.2
  return {
    nd: _nd, dt: _dt, tirada: _tirada, presion: _presion,
    pf: parseFloat(pf.toFixed(2)),
    cdt: parseFloat((_nd + _dt + _presion + pf).toFixed(2))
  }
}

export function sugerirCable(nd, tirada) {
  return Math.ceil((nd + tirada + 5) / 5) * 5
}

export function flujoEnCDT(kit, cdt) {
  if (cdt > kit.cdtMax) return 0
  const ds = Object.keys(kit.flujo).map(Number).sort((a, b) => a - b)
  if (!ds.length) return 0
  const bel = ds.filter(d => d <= cdt)
  const ab = ds.filter(d => d > cdt)
  if (!bel.length) return kit.flujo[ds[0]]
  if (!ab.length) return kit.flujo[ds[ds.length - 1]]
  const d1 = bel[bel.length - 1], d2 = ab[0]
  const t = (cdt - d1) / (d2 - d1)
  return Math.max(0, Math.round(kit.flujo[d1] + (kit.flujo[d2] - kit.flujo[d1]) * t))
}

export function calcularCaudales(lpm) {
  return {
    lps: (lpm / 60).toFixed(2),
    lpm,
    lph: Math.round(lpm * 60),
    lpd: Math.round(lpm * 60 * HRS),
    lsem: Math.round(lpm * 60 * HRS * DIAS)
  }
}

export function calcularMargen(kit, extras) {
  const costoAcum = kit.costoBase
  const pvSinIva = kit.precio / 1.16
  if (!costoAcum) return null
  return Math.round(((pvSinIva - costoAcum) / pvSinIva) * 100)
}

export function generarResumen({ kit, nd, tirada, dt, caudales }) {
  const c = caudales
  return `Considerando ${nd}m de profundidad, ${tirada}m de tirada horizontal con ${dt}m de desnivel, el equipo ${kit.id} puede entregar aproximadamente ${c.lpm} litros por minuto a descarga libre, igual a ${c.lph.toLocaleString('es-MX')} litros por hora o ${c.lpd.toLocaleString('es-MX')} litros por día.`
}
