const EA = 10
const FFRIC = 3
export const HRS = 6
export const DIAS = 7

export function calcularCDT({ nd, dt, tirada, presion }) {
  const pf = (tirada + EA) * (FFRIC / 100) * 1.2
  return {
    nd,
    dt,
    tirada,
    presion,
    pf: parseFloat(pf.toFixed(2)),
    cdt: parseFloat((nd + dt + presion + pf).toFixed(2))
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

export function generarResumen({ kit, cdt, nd, tirada, dt, presionLabel, caudales }) {
  const presionTxt = presionLabel ? `, con ${presionLabel},` : ''
  return `Considerando ${nd}m de profundidad, ${tirada}m de tirada horizontal${presionTxt} con ${dt}m de desnivel, el equipo ${kit.id} puede entregar aproximadamente ${caudales.lpm} litros por minuto a descarga libre, igual a ${caudales.lph.toLocaleString('es-MX')} litros por hora o ${caudales.lpd.toLocaleString('es-MX')} litros por día.`
}
