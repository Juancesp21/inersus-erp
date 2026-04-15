import jsPDF from 'jspdf'

function folio() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getFullYear()).slice(-2)}${Math.floor(Math.random()*90+10)}`
}

export function generarPDF({ kit, caudales, extras, params, form, cdt }) {
  const doc = new jsPDF('p', 'mm', 'letter')
  const W = 216, mg = 18
  let y = 15
  const NV = [13, 34, 64], GD = [240, 180, 41], GR = [115, 115, 112], LG = [244, 244, 240]

  // HEADER
  doc.setFillColor(...NV); doc.rect(0, 0, W, 28, 'F')
  doc.setFillColor(...GD); doc.circle(mg + 6, 14, 6, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('INS', mg + 6, 15.5, { align: 'center' })
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('INERSUS INGENIERÍA SUSTENTABLE SA DE CV', mg + 16, 12)
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 200, 230)
  doc.text('Av. Penitenciaria 2224, Monterrey NL  |  (81) 1639 2002  |  www.inersus.mx', mg + 16, 19)
  doc.setFillColor(...GD); doc.rect(W - 60, 0, 60, 28, 'F')
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('COTIZACIÓN', W - 30, 15, { align: 'center' })
  y = 36

  // FOLIO Y FECHA
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const num = folio()
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text(`Asesor: ${form.asesor}`, mg, y)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('FECHA:', W - 58, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR); doc.text(hoy, W - 42, y)
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('COTIZACIÓN #:', W - 58, y + 5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR); doc.text(num, W - 35, y + 5)
  y += 16

  // CLIENTE
  doc.setFillColor(...LG); doc.rect(mg, y, W - mg * 2, 14, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NV)
  doc.text('CLIENTE', mg + 4, y + 5)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text((form.cliente || 'A QUIEN CORRESPONDA').toUpperCase(), mg + 4, y + 9)
  doc.text((form.ciudad || 'MONTERREY, NL').toUpperCase(), mg + 70, y + 9)
  y += 18

  // SECCION HEADER
  const secHdr = (txt) => {
    doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 7, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255)
    doc.text(txt, mg + 3, y + 5); y += 9
  }

  const row2 = (l, v, i, col) => {
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(mg, y, W - mg * 2, 6, 'F') }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GR)
    doc.text(l, mg + 3, y + 4.2)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...(col || NV))
    doc.text(v, mg + 85, y + 4.2); y += 6
  }

  // DATOS DEL PROYECTO
  secHdr('DATOS DEL PROYECTO')
  const presLbl = params.presion === 0 ? 'Sin presión especial' : params.presion === 7 ? 'Riego por goteo (10 psi)' : 'Cañón de riego (30 psi)'
  ;[
    ['Profundidad del pozo (ND):', `${params.nd} m`],
    ['Desnivel al destino (DT):', `${params.dt} m`],
    ['Tirada horizontal:', `${params.tirada} m`],
    ['Presión requerida:', presLbl],
    ['CDT — Carga Dinámica Total:', `${cdt.toFixed(1)} m`]
  ].forEach(([l, v], i) => row2(l, v, i))

  // AGUA GENERADA
  secHdr('AGUA GENERADA (6 hrs/día · 7 días/sem)')
  ;[
    ['Litros por segundo:', `${caudales.lps} L/s`],
    ['Litros por minuto:', `${caudales.lpm} L/min`],
    ['Litros por hora:', `${caudales.lph.toLocaleString()} litros`],
    ['Litros por día:', `${caudales.lpd.toLocaleString()} litros`],
    ['Litros por semana:', `${caudales.lsem.toLocaleString()} litros`]
  ].forEach(([l, v], i) => row2(l, v, i, [26, 122, 74]))

  // RESUMEN
  secHdr('RESUMEN DEL SISTEMA')
  const resumenTxt = `Considerando ${params.nd}m de profundidad, ${params.tirada}m de tirada horizontal con ${params.dt}m de desnivel, el equipo ${kit.id} puede entregar aproximadamente ${caudales.lpm} litros por minuto a descarga libre, igual a ${caudales.lph.toLocaleString('es-MX')} litros por hora o ${caudales.lpd.toLocaleString('es-MX')} litros por día.`
  doc.setFillColor(248, 248, 245); doc.rect(mg, y, W - mg * 2, 16, 'F')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GR)
  const lines = doc.splitTextToSize(resumenTxt, W - mg * 2 - 6)
  doc.text(lines, mg + 3, y + 5)
  y += 20

  // PARTIDAS
  secHdr('PARTIDAS DEL KIT')
  y -= 9
  doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 7, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(255, 255, 255)
  doc.text('DESCRIPCIÓN', mg + 2, y + 5)
  doc.text('SKU', 92, y + 5)
  doc.text('CANT', 144, y + 5, { align: 'right' })
  doc.text('P.UNIT', 167, y + 5, { align: 'right' })
  doc.text('TOTAL', W - mg - 2, y + 5, { align: 'right' })
  y += 9

  let sub = 0
  const items = [...(kit.comp || [])]
  if (extras.costoCable > 0) items.push({ d: `CABLE SUMERGIBLE ${extras.ctipo}`, s: extras.ctipo, c: extras.cmts, p: extras.costoCable / extras.cmts })
  if (extras.costoTuberia > 0) items.push({ d: `TUBERÍA ${extras.diametro}" SERIE ${extras.tuberiaSerie} × ${extras.tuberiaTramos} TRAMOS`, s: `TUBO${extras.tuberiaSerie}-${extras.diametro}`, c: extras.tuberiaTramos, p: extras.costoTuberia / extras.tuberiaTramos })
  if (extras.costoAdaptador > 0) items.push({ d: `ADAPTADOR ${extras.adaptador.toUpperCase()} ${extras.diametro}"`, s: `ADAPT-${extras.diametro}`, c: 1, p: extras.costoAdaptador })
  if (extras.costoValvula > 0) items.push({ d: `VÁLVULA CHECK ${extras.diametro}"`, s: `VALV-${extras.diametro}`, c: 1, p: extras.costoValvula })
  if (extras.bases > 0) items.push({ d: 'BASES INCLINADAS AL PISO', s: 'RAINBASE-INC', c: 1, p: extras.bases })

  items.forEach((it, i) => {
    const rh = 7
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(mg, y, W - mg * 2, rh, 'F') }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GR)
    doc.text(doc.splitTextToSize(it.d, 55), mg + 2, y + 4.5)
    doc.text(it.s || '', 92, y + 4.5)
    doc.text(String(it.c), 144, y + 4.5, { align: 'right' })
    doc.text('$' + (it.p || 0).toLocaleString('es-MX'), 167, y + 4.5, { align: 'right' })
    const tot = it.c * (it.p || 0); sub += tot
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text('$' + tot.toLocaleString('es-MX'), W - mg - 2, y + 4.5, { align: 'right' })
    y += rh
  })

  // TOTALES
  y += 4
  ;[[' SUBTOTAL (con IVA):', sub, LG, GR, false], ['  TOTAL:', sub, NV, [255, 255, 255], true]].forEach(([l, v, bg, tc, big]) => {
    const rh = big ? 10 : 8
    doc.setFillColor(...bg); doc.rect(112, y, W - mg - 112, rh, 'F')
    doc.setFont('helvetica', big ? 'bold' : 'normal'); doc.setFontSize(big ? 10 : 8.5); doc.setTextColor(...tc)
    doc.text(l, 162, y + rh * .65, { align: 'right' })
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...(big ? GD : NV))
    doc.text('$' + Math.round(v).toLocaleString('es-MX'), W - mg - 2, y + rh * .65, { align: 'right' })
    y += rh + 1
  })

  // CONDICIONES
  y += 4
  doc.setFillColor(...LG); doc.rect(mg, y, W - mg * 2, 22, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(...NV)
  doc.text('CONDICIONES DE VENTA', mg + 4, y + 5)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GR)
  ;['• Precios en MXN con IVA incluido.', '• Cotización válida durante el mes en curso. Sujeta a disponibilidad.',
    '• Tiempo de entrega: 1-3 días hábiles. Se solicita 50% de anticipo.',
    '• No incluye instalación ni tubería salvo indicación explícita.'].forEach((l, i) => doc.text(l, mg + 4, y + 10 + i * 3.5))

  // FOOTER
  doc.setFillColor(...NV); doc.rect(0, 252, W, 16, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 200, 230)
  doc.text('INERSUS · Av. Penitenciaria 2224, Monterrey NL · (81) 1639 2002 · www.inersus.mx', W / 2, 258, { align: 'center' })
  doc.text('Documento generado electrónicamente.', W / 2, 263, { align: 'center' })

  doc.save(`Inersus_${kit.id}_${num}.pdf`)
}
