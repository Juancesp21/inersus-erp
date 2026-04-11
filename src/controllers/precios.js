export const PRECIOS_CABLE = {
  'CABLE3X12A': 55,
  'CABLE3X10A': 81.5,
  'CABLE3X8A': 121
}

export function calcularTotalKit(kit, extras) {
  return kit.precio + extras.costoCable + extras.bases
}

export function calcularCostoCable(tipo, metros) {
  if (tipo === 'none') return 0
  return (PRECIOS_CABLE[tipo] || 0) * metros
}

export function seleccionarOpciones(aptos) {
  const op = [aptos[0]]
  const maxF = [...aptos].sort((a, b) => b.fr - a.fr)[0]
  if (maxF.id !== op[0].id) op.push(maxF)
  aptos.filter(k => !op.find(o => o.id === k.id)).slice(0, 1).forEach(k => op.push(k))
  return op
}
