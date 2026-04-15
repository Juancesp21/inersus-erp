import jsPDF from 'jspdf'
import logoUrl from '../assets/logo-inersus.png'

function folio() {
  const d = new Date()
  return String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + String(d.getFullYear()).slice(-2) + String(Math.floor(Math.random()*90+10))
}

const TERMINOS_DEFAULT = `Información de pago:
- Beneficiario: Inersus Ingeniería Sustentable SA de CV
- CLABE: 012580001234645395
- Guía de rastreo en máx. 1 día hábil tras embarque
- Equipo con seguro de paquetería — reportar daños en 24hrs
- Garantía de 2 años en bomba y controlador`

export function generarPDF({ kit, caudales, extras, params, form, cdt }) {
  const doc = new jsPDF('p', 'mm', 'letter')
  const W = 216, mg = 18
  let y = 10
  const NV = [13, 34, 64], GR = [120, 120, 120]

  // LOGO
  doc.addImage(logoUrl, 'PNG', mg, y, 24, 20)

  // EMPRESA
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('INERSUS INGENIERÍA SUSTENTABLE SA DE CV', mg + 28, y + 5)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  ;['Av. Penitenciaria 2224', 'Monterrey, NL México 64270',
    'Asesor de venta: ' + (form.asesor || 'Ing. Miguel González'),
    'Teléfono: (81) 1639 2002',
    'Mail: gonzalezm@inersus.mx'].forEach((l, i) => doc.text(l, mg + 28, y + 10 + i * 4))
  doc.setTextColor(...NV); doc.setFont('helvetica', 'bold')
  doc.text('www.inersus.mx', mg + 28, y + 31)

  // COTIZACIÓN título
  doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('COTIZACIÓN', W - mg, y + 7, { align: 'right' })

  // FOLIO TABLE — filas más pequeñas
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const num = folio()
  const fx = W - mg - 65, fw = 65, fh = 6
  ;[['FECHA', hoy], ['COTIZACIÓN #', num], ['CLIENTE ID', 'N/A']].forEach(([lbl, val], i) => {
    const ry = y + 12 + i * fh
    if (i % 2 === 0) { doc.setFillColor(244, 244, 244); doc.rect(fx, ry, fw, fh, 'F') }
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(fx, ry, fw, fh)
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text(lbl, fx + 2, ry + 4)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(val, fx + fw - 2, ry + 4, { align: 'right' })
  })
  y += 36

  // CLIENTE — texto simple
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('Cliente:', mg, y + 4)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text((form.cliente || 'A quien corresponda'), mg + 14, y + 4)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text((form.ciudad || 'Monterrey, NL'), mg, y + 9)
  y += 15

  // RESUMEN
  doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 5.5, 'F')
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('RESUMEN', W / 2, y + 3.8, { align: 'center' })
  y += 5.5
  const rTxt = 'Considerando ' + params.nd + 'm de profundidad, ' + params.tirada + 'm de tirada horizontal con ' + params.dt + 'm de desnivel, el equipo ' + kit.id + ' puede entregar aproximadamente ' + caudales.lpm + ' litros por minuto a descarga libre, igual a ' + caudales.lph.toLocaleString('es-MX') + ' litros por hora o ' + caudales.lpd.toLocaleString('es-MX') + ' litros por día.'
  const rLines = doc.splitTextToSize(rTxt, W - mg * 2 - 4)
  const rH = rLines.length * 4.5 + 5
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(mg, y, W - mg * 2, rH)
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
  doc.text(rLines, mg + 2, y + 4)
  y += rH + 4

  // DOS COLUMNAS
  const colW = (W - mg * 2 - 4) / 2
  const c1 = mg, c2 = mg + colW + 4
  const presLbl = params.presion === 0 ? 'Sin presión' : params.presion === 7 ? 'Goteo (10 psi)' : 'Cañón (30 psi)'
  const pRows = [['Profundidad (ND):', params.nd + ' m'], ['Desnivel (DT):', params.dt + ' m'], ['Tirada horizontal:', params.tirada + ' m'], ['Presión:', presLbl], ['CDT Total:', cdt.toFixed(1) + ' m']]
  const aRows = [['Litros / segundo:', caudales.lps + ' L/s'], ['Litros / minuto:', caudales.lpm + ' L/min'], ['Litros / hora:', caudales.lph.toLocaleString() + ' L'], ['Litros / día:', caudales.lpd.toLocaleString() + ' L'], ['Litros / semana:', caudales.lsem.toLocaleString() + ' L']]
  const rH2 = 5.5

  ;[[c1, 'DATOS DEL PROYECTO'], [c2, 'AGUA GENERADA']].forEach(([cx, lbl]) => {
    doc.setFillColor(...NV); doc.rect(cx, y, colW, 5.5, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(lbl, cx + colW / 2, y + 3.8, { align: 'center' })
  })
  y += 5.5

  const tH = pRows.length * rH2
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3)
  doc.rect(c1, y, colW, tH); doc.rect(c2, y, colW, tH)

  pRows.forEach(([lbl, val], i) => {
    const ry = y + i * rH2
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(c1, ry, colW, rH2, 'F') }
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.1); doc.line(c1, ry + rH2, c1 + colW, ry + rH2)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(lbl, c1 + 2, ry + 3.8)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text(val, c1 + colW - 2, ry + 3.8, { align: 'right' })
  })
  aRows.forEach(([lbl, val], i) => {
    const ry = y + i * rH2
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(c2, ry, colW, rH2, 'F') }
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.1); doc.line(c2, ry + rH2, c2 + colW, ry + rH2)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(lbl, c2 + 2, ry + 3.8)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 122, 74)
    doc.text(val, c2 + colW - 2, ry + 3.8, { align: 'right' })
  })
  y += tH + 4

  // TABLA PARTIDAS
  const tcols = [mg + 2, mg + 72, mg + 122, mg + 150, W - mg - 2]
  doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 6.5, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  ;[['DESCRIPCIÓN', 'left'], ['MARCA-SERIE', 'left'], ['CANT.', 'right'], ['PRECIO UNIT.', 'right'], ['TOTAL', 'right']].forEach(([h, a], i) => doc.text(h, tcols[i], y + 4.5, { align: a }))
  y += 6.5

  let sub = 0
  const items = [...(kit.comp || [])]
  if (extras.costoCable > 0) items.push({ d: 'Cable sumergible ' + extras.ctipo, s: extras.ctipo, c: extras.cmts, p: Math.round(extras.costoCable / extras.cmts) })
  if (extras.costoTuberia > 0) items.push({ d: 'Tubería ' + extras.diametro + '" Serie ' + extras.tuberiaSerie, s: 'TUBO' + extras.tuberiaSerie, c: extras.tuberiaTramos, p: Math.round(extras.costoTuberia / extras.tuberiaTramos) })
  if (extras.costoAdaptador > 0) items.push({ d: 'Adaptador ' + (extras.adaptador || '') + ' ' + extras.diametro + '"', s: 'ADAPT-' + extras.diametro, c: 1, p: extras.costoAdaptador })
  if (extras.costoValvula > 0) items.push({ d: 'Válvula check ' + extras.diametro + '"', s: 'VALV-' + extras.diametro, c: 1, p: extras.costoValvula })
  if (extras.bases > 0) items.push({ d: 'Bases inclinadas al piso', s: 'RAINBASE-INC', c: 1, p: extras.bases })

  items.forEach((it, i) => {
    const rh = 6.5
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245) } else { doc.setFillColor(255, 255, 255) }
    doc.rect(mg, y, W - mg * 2, rh, 'F')
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.2); doc.rect(mg, y, W - mg * 2, rh)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    const descTrunc = it.d.length > 38 ? it.d.substring(0, 38) + '...' : it.d
    doc.text(descTrunc, tcols[0], y + 4.2)
    doc.text(it.s || '', tcols[1], y + 4.2)
    doc.text(String(it.c), tcols[2], y + 4.2, { align: 'right' })
    doc.text('$' + (it.p || 0).toLocaleString('es-MX'), tcols[3], y + 4.2, { align: 'right' })
    const tot = it.c * (it.p || 0); sub += tot
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text('$' + tot.toLocaleString('es-MX'), tcols[4], y + 4.2, { align: 'right' })
    y += rh
  })
  y += 3

  // TÉRMINOS + TOTALES lado a lado
  const tw = 72, tx = W - mg - tw
  const terminos = localStorage ? (localStorage.getItem('ins_terminos') || TERMINOS_DEFAULT) : TERMINOS_DEFAULT
  const termLines = doc.splitTextToSize(terminos, tx - mg - 6)
  const termH = termLines.length * 4 + 8

  // Header términos
  doc.setFillColor(...NV); doc.rect(mg, y, tx - mg - 4, 5.5, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('TÉRMINOS Y CONDICIONES', mg + 2, y + 3.8)
  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(mg, y + 5.5, tx - mg - 4, termH)
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text(termLines, mg + 2, y + 9.5)

  // Totales
  const totY = y
  ;[['Importe', sub, false], ['Descuento', null, false], ['TOTAL', sub, true]].forEach(([lbl, val, bold]) => {
    if (bold) { doc.setFillColor(180, 210, 240) } else { doc.setFillColor(255, 255, 255) }
    doc.rect(tx, totY + (bold ? 12 : bold === false && lbl === 'Descuento' ? 6 : 0), tw, 6, 'F')
    const ry2 = totY + (lbl === 'Importe' ? 0 : lbl === 'Descuento' ? 6 : 12)
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3); doc.rect(tx, ry2, tw, 6)
    doc.setFontSize(bold ? 8.5 : 7.5); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...NV)
    doc.text(lbl, tx + 2, ry2 + 4)
    if (val !== null) {
      doc.setFont('helvetica', 'bold')
      doc.text('$' + Math.round(val).toLocaleString('es-MX'), tx + tw - 2, ry2 + 4, { align: 'right' })
    }
  })
  doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GR)
  doc.text('Todos nuestros precios incluyen IVA', tx + tw - 2, totY + 22, { align: 'right' })

  y += termH + 10

  // FOOTER
  doc.addImage(logoUrl, 'PNG', W / 2 - 8, y, 16, 13)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('INERSUS.MX', W / 2, y + 16, { align: 'center' })
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text('Un compromiso con la sustentabilidad', W / 2, y + 20, { align: 'center' })
  doc.text('RFC: IIS240227CBA', W / 2, y + 24, { align: 'center' })
  doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('AVISO:', W / 2, y + 29, { align: 'center' })
  const avisoTxt = 'Esta cotización fue elaborada por INERSUS INGENIERÍA SUSTENTABLE SA DE CV. Los precios son estimaciones sujetas a cambios basados en la evaluación final del sitio y los requisitos del proyecto.'
  doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150)
  doc.text(doc.splitTextToSize(avisoTxt, W - mg * 2), W / 2, y + 32, { align: 'center' })

  doc.save('Inersus_' + kit.id + '_' + num + '.pdf')
}
