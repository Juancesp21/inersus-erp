import jsPDF from 'jspdf'

const LOGO_B64 = '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5dRWm+0aleWKs5SaSxh8XuOa3u5UK3Wpb9/vO9q3a1s4pC5surraXN5hjy4/UFp7rt32aUdJJK2+mreGktiggeXPPcOAHtK4hRQNPoLYRacpyfrX0O+Wu13wS9/1P3M5r5Xva0Ma5xIaOg7lL9m0v9sh7t1w+sKGqVbOD/wB41Le+IfavoulPF3D75Feud9Jmz2ixb1phlxxZN9RB/AKBKydcNDtN1B+aWH/iA+9Vst+tpK6bXNIws3mkERFEHUEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERASrZy4CvqBniWDA9q32uQfzbn/SZn9oKNbPT/AN+PaXAZhd05nIU8qYIqmB8E8bZI3cHNI5/zhWrS6brWEqae95XuI25ls1k3ywVAis783LL/ALiz9o/ih05Zjn+hM49xXA9BuFzXv+hu8tplYorJdpayuGPczh6JCv5+atl3d33M/wBPaHK8/AbntXtf0PfLafeVuizb3RtoLpPStJLGO80nnhYSh5xcJOL4o6k8rIREWJ6EREAREQBERAEREAREQBERAEREAREQBEW/0tYI7vDNNNO+NrHbo3RzOMrbRozrTUILLZjOagss0CKdt0VQD4VXUk+G6PuK9G6MtY5y1bvS4fgpFaLdvkvaaPK6ZAFKNnI/70qHd0P/ALgt2NIWjHKc/rrY2mz0NsL3UkbmukABLnE8l2WWkXFGvGpLGEaa11CcHFczE1sQNNVQJ4ksA/bCrZWBtCl3LG1g/wASZo+on7lX65Nbf+69SNtn+mERFEHUEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAEREAREQBERAbXSUph1DSOHynFh9YIVnKoqKY09XFOCRuPDuHPCtuNwfG14IIIGMHIKtHR+r5k6fr+/YR19HemfpF+JZYoWF8sjY2gZJcccPSVqK3U9ppmnExmd0bGM54/V61NVrqlRXnySOOFOU/RWTdISAMk4AUFrdZ1cgc2lp44RkbrnecQOP1rRV1zr645qaqR46NzgD1KKra9Rj+mm/cdMLKb4vBmawkhlv8AO+F7Xtw3i05GcDK06IqtVqdZNzfN5JKMdlJBERazIIi9KcROnjE7nMiLgHuaMkNzxIQG50Tpqs1PemUFN73GPOmmI4Rt/Hu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'

function folio() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getFullYear()).slice(-2)}${Math.floor(Math.random()*90+10)}`
}

export function generarPDF({ kit, caudales, extras, params, form, cdt }) {
  const doc = new jsPDF('p', 'mm', 'letter')
  const W = 216, mg = 18
  let y = 10
  const NV = [13, 34, 64], GD = [240, 180, 41], GR = [100, 100, 100], LG = [240, 240, 240], BL = [0, 0, 0]

  // ── LOGO ──────────────────────────────────────────
  doc.addImage(LOGO_B64, 'JPEG', mg, y, 28, 22)

  // ── EMPRESA ───────────────────────────────────────
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('INERSUS INGENIERÍA SUSTENTABLE SA DE CV', mg + 32, y + 6)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text('Av. Penitenciaria 2224', mg + 32, y + 11)
  doc.text('Monterrey, NL México 64270', mg + 32, y + 15)
  doc.text(`Asesor de venta: ${form.asesor}`, mg + 32, y + 19)
  doc.text('Teléfono: (81) 1639 2002', mg + 32, y + 23)
  doc.text('Mail: gonzalezm@inersus.mx', mg + 32, y + 27)
  doc.setTextColor(...NV)
  doc.text('www.inersus.mx', mg + 32, y + 31)

  // ── COTIZACIÓN título ─────────────────────────────
  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('COTIZACIÓN', W - mg, y + 8, { align: 'right' })

  // ── FOLIO / FECHA ─────────────────────────────────
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const num = folio()
  const presLbl = params.presion === 0 ? 'Sin presión especial' : params.presion === 7 ? 'Riego por goteo (10 psi)' : 'Cañón de riego (30 psi)'

  // tabla folio
  const fx = W - mg - 70, fw = 70, fh = 7
  ;[['FECHA', hoy], ['COTIZACIÓN #', num], ['CLIENTE ID', 'N/A']].forEach(([lbl, val], i) => {
    doc.setDrawColor(...GR); doc.setLineWidth(0.3)
    doc.rect(fx, y + 14 + i * fh, fw, fh)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text(lbl, fx + 2, y + 14 + i * fh + 4.5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(val, fx + fw - 2, y + 14 + i * fh + 4.5, { align: 'right' })
  })
  y += 36

  // ── CLIENTE ───────────────────────────────────────
  doc.setFillColor(...NV); doc.rect(mg, y, 70, 6, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('CLIENTE', mg + 2, y + 4.2)
  y += 6
  doc.setDrawColor(...GR); doc.setLineWidth(0.3); doc.rect(mg, y, 70, 14)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text((form.cliente || 'A QUIEN CORRESPONDA').toUpperCase(), mg + 2, y + 5)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text((form.ciudad || 'MONTERREY, NL').toUpperCase(), mg + 2, y + 10)
  y += 18

  // ── RESUMEN ───────────────────────────────────────
  doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 6, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('RESUMEN', W / 2, y + 4.2, { align: 'center' })
  y += 6
  const resumenTxt = `Considerando ${params.nd}m de profundidad, ${params.tirada}m de tirada horizontal con ${params.dt}m de desnivel, el equipo ${kit.id} puede entregar aproximadamente ${caudales.lpm} litros por minuto a descarga libre, igual a ${caudales.lph.toLocaleString('es-MX')} litros por hora o ${caudales.lpd.toLocaleString('es-MX')} litros por día.`
  const rLines = doc.splitTextToSize(resumenTxt, W - mg * 2 - 4)
  const rH = rLines.length * 5 + 6
  doc.setDrawColor(...GR); doc.setLineWidth(0.3); doc.rect(mg, y, W - mg * 2, rH)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...BL)
  doc.text(rLines, mg + 2, y + 5)
  y += rH + 4

  // ── DOS COLUMNAS: PROYECTO | AGUA ─────────────────
  const colW = (W - mg * 2 - 6) / 2
  const col1x = mg, col2x = mg + colW + 6

  // Headers
  ;[[col1x, 'DATOS DEL PROYECTO'], [col2x, 'AGUA GENERADA']].forEach(([cx, lbl]) => {
    doc.setFillColor(...NV); doc.rect(cx, y, colW, 6, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
    doc.text(lbl, cx + colW / 2, y + 4.2, { align: 'center' })
  })
  y += 6

  const pRows = [
    ['Profundidad (ND):', `${params.nd} m`],
    ['Desnivel (DT):', `${params.dt} m`],
    ['Tirada horizontal:', `${params.tirada} m`],
    ['Presión:', presLbl],
    ['CDT Total:', `${cdt.toFixed(1)} m`],
  ]
  const aRows = [
    ['Litros / segundo:', `${caudales.lps} L/s`],
    ['Litros / minuto:', `${caudales.lpm} L/min`],
    ['Litros / hora:', `${caudales.lph.toLocaleString()} L`],
    ['Litros / día:', `${caudales.lpd.toLocaleString()} L`],
    ['Litros / semana:', `${caudales.lsem.toLocaleString()} L`],
  ]
  const rowH = 6, maxRows = Math.max(pRows.length, aRows.length)
  const tableH = rowH * maxRows
  doc.setDrawColor(...GR); doc.setLineWidth(0.3)
  doc.rect(col1x, y, colW, tableH)
  doc.rect(col2x, y, colW, tableH)

  pRows.forEach(([lbl, val], i) => {
    const ry = y + i * rowH
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(col1x, ry, colW, rowH, 'F') }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(lbl, col1x + 2, ry + 4.2)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text(val, col1x + colW - 2, ry + 4.2, { align: 'right' })
  })
  aRows.forEach(([lbl, val], i) => {
    const ry = y + i * rowH
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(col2x, ry, colW, rowH, 'F') }
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(lbl, col2x + 2, ry + 4.2)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 122, 74)
    doc.text(val, col2x + colW - 2, ry + 4.2, { align: 'right' })
  })
  y += tableH + 6

  // ── TABLA PARTIDAS ────────────────────────────────
  doc.setFillColor(...NV); doc.rect(mg, y, W - mg * 2, 7, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  const cols = [mg + 2, 95, 138, 163, W - mg - 2]
  const hdrs = ['DESCRIPCIÓN', 'MARCA-SERIE', 'CANT.', 'PRECIO UNIT.', 'TOTAL']
  const aligns = ['left', 'left', 'right', 'right', 'right']
  hdrs.forEach((h, i) => doc.text(h, cols[i], y + 5, { align: aligns[i] }))
  y += 7

  let sub = 0
  const items = [...(kit.comp || [])]
  if (extras.costoCable > 0) items.push({ d: `CABLE SUMERGIBLE ${extras.ctipo}`, s: extras.ctipo, c: extras.cmts, p: Math.round(extras.costoCable / extras.cmts) })
  if (extras.costoTuberia > 0) items.push({ d: `TUBERÍA ${extras.diametro}" SERIE ${extras.tuberiaSerie}`, s: `TUBO${extras.tuberiaSerie}`, c: extras.tuberiaTramos, p: Math.round(extras.costoTuberia / extras.tuberiaTramos) })
  if (extras.costoAdaptador > 0) items.push({ d: `ADAPTADOR ${(extras.adaptador||'').toUpperCase()} ${extras.diametro}"`, s: `ADAPT-${extras.diametro}`, c: 1, p: extras.costoAdaptador })
  if (extras.costoValvula > 0) items.push({ d: `VÁLVULA CHECK ${extras.diametro}"`, s: `VALV-${extras.diametro}`, c: 1, p: extras.costoValvula })
  if (extras.bases > 0) items.push({ d: 'BASES INCLINADAS AL PISO', s: 'RAINBASE-INC', c: 1, p: extras.bases })

  const rh = 7
  items.forEach((it, i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 248, 245); doc.rect(mg, y, W - mg * 2, rh, 'F') }
    doc.setDrawColor(...GR); doc.setLineWidth(0.2); doc.rect(mg, y, W - mg * 2, rh)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
    doc.text(doc.splitTextToSize(it.d, 70)[0], cols[0], y + 4.5)
    doc.text(it.s || '', cols[1], y + 4.5)
    doc.text(String(it.c), cols[2], y + 4.5, { align: 'right' })
    doc.text('$' + (it.p || 0).toLocaleString('es-MX'), cols[3], y + 4.5, { align: 'right' })
    const tot = it.c * (it.p || 0); sub += tot
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
    doc.text('$' + tot.toLocaleString('es-MX'), cols[4], y + 4.5, { align: 'right' })
    y += rh
  })
  // Filas vacías hasta completar 10
  const emptyRows = Math.max(0, 10 - items.length)
  for (let i = 0; i < emptyRows; i++) {
    doc.setDrawColor(...GR); doc.setLineWidth(0.2); doc.rect(mg, y, W - mg * 2, rh); y += rh
  }

  // ── TOTALES ───────────────────────────────────────
  y += 2
  const tw = 80, tx = W - mg - tw
  ;[['Importe', sub, false], ['DESCUENTO', null, false], ['TOTAL', sub, true]].forEach(([lbl, val, bold]) => {
    if (bold) { doc.setFillColor(180, 210, 240); doc.rect(tx, y, tw, 7, 'F') }
    doc.setDrawColor(...GR); doc.setLineWidth(0.2); doc.rect(tx, y, tw, 7)
    doc.setFontSize(bold ? 9 : 8); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...(bold ? NV : GR))
    doc.text(lbl, tx + 2, y + 4.8)
    if (val !== null) {
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
      doc.text('$' + Math.round(val).toLocaleString('es-MX'), tx + tw - 2, y + 4.8, { align: 'right' })
    }
    y += 7
  })
  doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GR)
  doc.text('Todos nuestros precios incluyen IVA', tx + tw - 2, y + 4, { align: 'right' })
  y += 8

  // ── TÉRMINOS ──────────────────────────────────────
  if (y > 215) { doc.addPage(); y = 15 }
  const termW = W - mg - tw - 4
  const termY = y - 29 // alinear con tabla totales
  doc.setFillColor(...NV); doc.rect(mg, termY, termW, 6, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
  doc.text('TÉRMINOS Y CONDICIONES', mg + 2, termY + 4.2)
  const termLines = [
    'INFORMACIÓN DE PAGO:',
    'Una vez aceptada la cotización formal,',
    'favor de hacer depósito o transferencia a:',
    'CLABE 012580001234645395',
    'Con atención: Inersus Ingenieria Sustentable',
    'Se compartirá guía en máx. 1 día hábil.',
    'Nota: Equipo con seguro de paquetería.',
    '',
    '2. LA BOMBA SUMERGIBLE Y CONTROLADOR',
    'CUENTAN CON GARANTÍA DE DOS AÑOS.',
  ]
  doc.setDrawColor(...GR); doc.setLineWidth(0.3); doc.rect(mg, termY + 6, termW, termLines.length * 4.5 + 4)
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  termLines.forEach((l, i) => doc.text(l, mg + 2, termY + 10 + i * 4.5))

  // ── FOOTER ────────────────────────────────────────
  const pageH = 279
  // Logo centrado
  doc.addImage(LOGO_B64, 'JPEG', W / 2 - 10, pageH - 42, 20, 16)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('INERSUS.MX', W / 2, pageH - 23, { align: 'center' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  doc.text('Un compromiso con la sustentabilidad', W / 2, pageH - 19, { align: 'center' })
  doc.text('RFC: IIS240227CBA', W / 2, pageH - 15, { align: 'center' })

  // Aviso
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...NV)
  doc.text('AVISO:', W / 2, pageH - 10, { align: 'center' })
  const avisoTxt = 'Esta cotización fue elaborada por INERSUS INGENIERÍA SUSTENTABLE SA DE CV. Los precios presentados son estimaciones sujetas a cambios basados en la evaluación final del sitio y los requisitos específicos del proyecto.'
  doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GR)
  const avisoLines = doc.splitTextToSize(avisoTxt, W - mg * 2)
  doc.text(avisoLines, W / 2, pageH - 7, { align: 'center' })

  doc.save(`Inersus_${kit.id}_${num}.pdf`)
}
