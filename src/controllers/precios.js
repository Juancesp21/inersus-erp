export const PRECIOS_CABLE = {
  'CABLE3X12A': 55,
  'CABLE3X10A': 81.5,
  'CABLE3X8A': 121
}

export const PRECIOS_TUBERIA = {
  'TUBOA150-1.25': 205,
  'TUBOA150-2':    455,
  'TUBOA250-1.25': null,
  'TUBOA250-2':    null
}

export const PRECIOS_ADAPTADOR = {
  'hierro-1.25':  550,
  'hierro-2':     600,
  'acero-1.25':   null,
  'acero-2':      null
}

export const PRECIOS_VALVULA = {
  '1.25': 1240,
  '2':    3180
}

export function calcularCostoCable(tipo, metros) {
  if (tipo === 'none') return 0
  return (PRECIOS_CABLE[tipo] || 0) * metros
}

export function calcularCostoTuberia(incluir, serie, diametro, tramos) {
  if (!incluir) return 0
  const key = `TUBOA${serie}-${diametro}`
  return (PRECIOS_TUBERIA[key] || 0) * tramos
}

export function calcularCostoAdaptador(incluir, material, diametro) {
  if (!incluir) return 0
  const key = `${material}-${diametro}`
  return PRECIOS_ADAPTADOR[key] || 0
}

export function calcularCostoValvula(incluir, diametro) {
  if (!incluir) return 0
  return PRECIOS_VALVULA[diametro] || 0
}

export function calcularTotalProyecto(kit, extras) {
  return kit.precio
    + extras.costoCable
    + extras.costoTuberia
    + extras.costoAdaptador
    + extras.costoValvula
    + extras.bases
}

export function seleccionarOpciones(aptos) {
  const op = [aptos[0]]
  const maxF = [...aptos].sort((a, b) => b.fr - a.fr)[0]
  if (maxF.id !== op[0].id) op.push(maxF)
  aptos.filter(k => !op.find(o => o.id === k.id)).slice(0, 1).forEach(k => op.push(k))
  return op
}

export function tramosSugeridos(profundidad) {
  return Math.ceil(profundidad / 3)
}
