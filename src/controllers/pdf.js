import jsPDF from 'jspdf'

const LOGO =  + logo + 

function folio() {
  const d = new Date()
  return String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + String(d.getFullYear()).slice(-2) + String(Math.floor(Math.random()*90+10))
}

export function generarPDF({ kit, caudales, extras, params, form, cdt }) {
  const doc = new jsPDF('p', 'mm', 'letter')
  const W = 216, mg = 18
  let y = 10
  const NV = [13, 34, 64], GD = [240, 180, 41], GR = [120, 120, 120], LG = [244, 244, 244]

  // LOGO
  doc.addImage(LOGO, 'PNG', mg, y, 26, 22)

  // EMPRESA
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(13, 34, 64)
  doc.text('INERSUS INGENIERÍA SUSTENTABLE SA DE CV', mg + 30, y + 6)
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
  const asesorNombre = form.asesor || 'Ing. Miguel González'
  ;['Av. Penitenciaria 2224', 'Monterrey, NL México 64270',
    'Asesor de venta: ' + asesorNombre,
    'Teléfono: (81) 1639 2002',
    'Mail: gonzalezm@inersus.mx'].forEach((l, i) => doc.text(l, mg + 30, y + 11 + i * 4.5))
  doc.setTextColor(13, 34, 64); doc.setFont('helvetica', 'bold')
  doc.text('www.inersus.mx', mg + 30, y + 34)

  // COTIZACIÓN título
  doc.setFontSize(24); doc.setFont('helvetica', 'bold'); doc.setTextColor(13, 34, 64)
  doc.text('COTIZACIÓN', W - mg, y + 8, { align: 'right' })

  // FOLIO TABLE
  const hoy = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const num = folio()
  const fx = W - mg - 68, fw = 68, fh = 7
  ;[['FECHA', hoy], ['COTIZACIÓN #', num], ['CLIENTE ID', 'N/A']].forEach(([lbl, val], i) => {
    const ry = y + 14 + i * fh
    if (i % 2 === 0) { doc.setFillColor(244,244,244); doc.rect(fx, ry, fw, fh, 'F') }
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.3); doc.rect(fx, ry, fw, fh)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(13, 34, 64)
    doc.text(lbl, fx + 2, ry + 4.5)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
    doc.text(val, fx + fw - 2, ry + 4.5, { align: 'right' })
  })
  y += 40

  // CLIENTE
  doc.setFillColor(13, 34, 64); doc.rect(mg, y, 68, 6, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255,255,255)
  doc.text('CLIENTE', mg + 2, y + 4.2)
  y += 6
  doc.setDrawColor(180,180,180); doc.setLineWidth(0.3); doc.rect(mg, y, 68, 13)
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(13,34,64)
  doc.text((form.cliente || 'A QUIEN CORRESPONDA').toUpperCase(), mg + 2, y + 5)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100,100,100)
  doc.text((form.ciudad || 'MONTERREY, NL').toUpperCase(), mg + 2, y + 10)
  y += 17

  // RESUMEN
  doc.setFillColor(13,34,64); doc.rect(mg, y, W-mg*2, 6, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255,255,255)
  doc.text('RESUMEN', W/2, y+4.2, { align: 'center' })
  y += 6
  const rTxt = 'Considerando ' + params.nd + 'm de profundidad, ' + params.tirada + 'm de tirada horizontal con ' + params.dt + 'm de desnivel, el equipo ' + kit.id + ' puede entregar aproximadamente ' + caudales.lpm + ' litros por minuto a descarga libre, igual a ' + caudales.lph.toLocaleString('es-MX') + ' litros por hora o ' + caudales.lpd.toLocaleString('es-MX') + ' litros por día.'
  const rLines = doc.splitTextToSize(rTxt, W-mg*2-4)
  const rH = rLines.length * 5 + 5
  doc.setDrawColor(180,180,180); doc.setLineWidth(0.3); doc.rect(mg, y, W-mg*2, rH)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(0,0,0)
  doc.text(rLines, mg+2, y+5)
  y += rH + 5

  // DOS COLUMNAS
  const colW = (W - mg*2 - 5) / 2
  const c1 = mg, c2 = mg + colW + 5
  const presLbl = params.presion === 0 ? 'Sin presión' : params.presion === 7 ? 'Goteo (10 psi)' : 'Cañón (30 psi)'
  const pRows = [['Profundidad (ND):', params.nd + ' m'], ['Desnivel (DT):', params.dt + ' m'], ['Tirada horizontal:', params.tirada + ' m'], ['Presión:', presLbl], ['CDT Total:', cdt.toFixed(1) + ' m']]
  const aRows = [['Litros / segundo:', caudales.lps + ' L/s'], ['Litros / minuto:', caudales.lpm + ' L/min'], ['Litros / hora:', caudales.lph.toLocaleString() + ' L'], ['Litros / día:', caudales.lpd.toLocaleString() + ' L'], ['Litros / semana:', caudales.lsem.toLocaleString() + ' L']]
  const rH2 = 6

  ;[[c1,'DATOS DEL PROYECTO'],[c2,'AGUA GENERADA']].forEach(([cx,lbl]) => {
    doc.setFillColor(13,34,64); doc.rect(cx, y, colW, 6, 'F')
    doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255)
    doc.text(lbl, cx+colW/2, y+4.2, { align:'center' })
  })
  y += 6

  const tH = pRows.length * rH2
  doc.setDrawColor(180,180,180); doc.setLineWidth(0.3)
  doc.rect(c1, y, colW, tH); doc.rect(c2, y, colW, tH)

  pRows.forEach(([lbl,val],i) => {
    const ry = y + i*rH2
    if(i%2===0){doc.setFillColor(248,248,245);doc.rect(c1,ry,colW,rH2,'F')}
    doc.setDrawColor(200,200,200);doc.setLineWidth(0.1);doc.line(c1,ry+rH2,c1+colW,ry+rH2)
    doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(100,100,100)
    doc.text(lbl, c1+2, ry+4.2)
    doc.setFont('helvetica','bold');doc.setTextColor(13,34,64)
    doc.text(val, c1+colW-2, ry+4.2, { align:'right' })
  })
  aRows.forEach(([lbl,val],i) => {
    const ry = y + i*rH2
    if(i%2===0){doc.setFillColor(248,248,245);doc.rect(c2,ry,colW,rH2,'F')}
    doc.setDrawColor(200,200,200);doc.setLineWidth(0.1);doc.line(c2,ry+rH2,c2+colW,ry+rH2)
    doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(100,100,100)
    doc.text(lbl, c2+2, ry+4.2)
    doc.setFont('helvetica','bold');doc.setTextColor(26,122,74)
    doc.text(val, c2+colW-2, ry+4.2, { align:'right' })
  })
  y += tH + 5

  // TABLA PARTIDAS
  const tcols = [mg+2, mg+72, mg+120, mg+148, W-mg-2]
  doc.setFillColor(13,34,64); doc.rect(mg, y, W-mg*2, 7, 'F')
  doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255)
  ;[['DESCRIPCIÓN','left'],['MARCA-SERIE','left'],['CANT.','right'],['PRECIO UNIT.','right'],['TOTAL','right']].forEach(([h,a],i) => doc.text(h,tcols[i],y+5,{align:a}))
  y += 7

  let sub = 0
  const items = [...(kit.comp||[])]
  if(extras.costoCable>0) items.push({d:'CABLE SUMERGIBLE '+extras.ctipo, s:extras.ctipo, c:extras.cmts, p:Math.round(extras.costoCable/extras.cmts)})
  if(extras.costoTuberia>0) items.push({d:'TUBERÍA '+extras.diametro+'" SERIE '+extras.tuberiaSerie, s:'TUBO'+extras.tuberiaSerie, c:extras.tuberiaTramos, p:Math.round(extras.costoTuberia/extras.tuberiaTramos)})
  if(extras.costoAdaptador>0) items.push({d:'ADAPTADOR '+(extras.adaptador||'').toUpperCase()+' '+extras.diametro+'"', s:'ADAPT-'+extras.diametro, c:1, p:extras.costoAdaptador})
  if(extras.costoValvula>0) items.push({d:'VÁLVULA CHECK '+extras.diametro+'"', s:'VALV-'+extras.diametro, c:1, p:extras.costoValvula})
  if(extras.bases>0) items.push({d:'BASES INCLINADAS AL PISO', s:'RAINBASE-INC', c:1, p:extras.bases})

  items.forEach((it,i) => {
    const rh=7
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2)
    if(i%2===0){doc.setFillColor(248,248,245);doc.rect(mg,y,W-mg*2,rh,'FD')}
    else{doc.setFillColor(255,255,255);doc.rect(mg,y,W-mg*2,rh,'FD')}
    doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(80,80,80)
    doc.text(doc.splitTextToSize(it.d,65)[0], tcols[0], y+4.5)
    doc.text(it.s||'', tcols[1], y+4.5)
    doc.text(String(it.c), tcols[2], y+4.5, {align:'right'})
    doc.text('$'+(it.p||0).toLocaleString('es-MX'), tcols[3], y+4.5, {align:'right'})
    const tot=it.c*(it.p||0); sub+=tot
    doc.setFont('helvetica','bold'); doc.setTextColor(13,34,64)
    doc.text('$'+tot.toLocaleString('es-MX'), tcols[4], y+4.5, {align:'right'})
    y+=rh
  })
  // borde exterior tabla
  doc.setDrawColor(180,180,180); doc.setLineWidth(0.3)

  // TOTALES
  y += 3
  const tw=75, tx=W-mg-tw
  ;[['Importe',sub,false],['DESCUENTO',null,false],['TOTAL',sub,true]].forEach(([lbl,val,bold]) => {
    if(bold){doc.setFillColor(180,210,240)}else{doc.setFillColor(255,255,255)}
    doc.rect(tx,y,tw,7,'F')
    doc.setDrawColor(180,180,180); doc.setLineWidth(0.3); doc.rect(tx,y,tw,7)
    doc.setFontSize(bold?9:8); doc.setFont('helvetica',bold?'bold':'normal'); doc.setTextColor(13,34,64)
    doc.text(lbl, tx+2, y+4.8)
    if(val!==null){
      doc.setFont('helvetica','bold'); doc.setTextColor(13,34,64)
      doc.text('$'+Math.round(val).toLocaleString('es-MX'), tx+tw-2, y+4.8, {align:'right'})
    }
    y+=7
  })
  doc.setFontSize(7.5); doc.setFont('helvetica','italic'); doc.setTextColor(100,100,100)
  doc.text('Todos nuestros precios incluyen IVA', tx+tw-2, y+3, {align:'right'})

  // TÉRMINOS (mismo Y, izquierda)
  const termY = y - 21 - 6
  const termW = tx - mg - 4
  doc.setFillColor(13,34,64); doc.rect(mg, termY, termW, 6, 'F')
  doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255)
  doc.text('TÉRMINOS Y CONDICIONES', mg+2, termY+4.2)
  const termTxt = ['INFORMACIÓN DE PAGO:', 'Depósito o transferencia a:', 'CLABE 012580001234645395', 'Att: Inersus Ingenieria Sustentable SA de CV.', 'Guía de rastreo en máx. 1 día hábil.', 'Nota: Equipo con seguro de paquetería.', '', '2. BOMBA Y CONTROLADOR CON GARANTÍA DE 2 AÑOS.']
  const termH = termTxt.length * 4.2 + 8
  doc.setDrawColor(180,180,180); doc.setLineWidth(0.3); doc.rect(mg, termY+6, termW, termH)
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100)
  termTxt.forEach((l,i) => doc.text(l, mg+2, termY+10+i*4.2))
  y += 6

  // FOOTER — misma página
  const footY = y + 8
  doc.addImage(LOGO, 'PNG', W/2-9, footY, 18, 15)
  doc.setFontSize(9); doc.setFont('helvetica','bold'); doc.setTextColor(13,34,64)
  doc.text('INERSUS.MX', W/2, footY+18, {align:'center'})
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(100,100,100)
  doc.text('Un compromiso con la sustentabilidad', W/2, footY+22, {align:'center'})
  doc.text('RFC: IIS240227CBA', W/2, footY+26, {align:'center'})
  doc.setFontSize(6.5); doc.setFont('helvetica','bold'); doc.setTextColor(13,34,64)
  doc.text('AVISO:', W/2, footY+31, {align:'center'})
  const avisoTxt = 'Esta cotización fue elaborada por INERSUS INGENIERÍA SUSTENTABLE SA DE CV. Los precios son estimaciones sujetas a cambios basados en la evaluación final del sitio y los requisitos específicos del proyecto. Los costos finales pueden variar. Estamos comprometidos a proporcionar la cotización más precisa posible.'
  doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.setTextColor(120,120,120)
  const avisoLines = doc.splitTextToSize(avisoTxt, W-mg*2)
  doc.text(avisoLines, W/2, footY+35, {align:'center'})

  doc.save('Inersus_' + kit.id + '_' + num + '.pdf')
}
