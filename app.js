const SUPABASE_URL = 'https://mqodrhsrzwsixqonzphx.supabase.co'
const SUPABASE_KEY = "sb_publishable_ul0kxpolvUOp3x0IfVUc_g_Cdo-bC9L"

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
}

const CUADRANTES = {
  'Vendedor Élite':     { clase: 'cell-elite',             emoji: '🏆', colorBg: '#d1fae5', colorText: '#065f46' },
  'Consultor Avanzado': { clase: 'cell-consultor-avanzado', emoji: '🟢', colorBg: '#dcfce7', colorText: '#166534' },
  'Relacionador':       { clase: 'cell-relacionador',       emoji: '🟡', colorBg: '#fef9c3', colorText: '#854d0e' },
  'Técnico Comercial':  { clase: 'cell-tecnico-comercial',  emoji: '🟣', colorBg: '#ede9fe', colorText: '#4c1d95' },
  'Perfil Balanceado':  { clase: 'cell-balanceado',         emoji: '🔵', colorBg: '#dbeafe', colorText: '#1e3a8a' },
  'En Construcción':    { clase: 'cell-construccion',       emoji: '🟠', colorBg: '#ffedd5', colorText: '#7c2d12' },
  'Técnico Puro':       { clase: 'cell-tecnico-puro',       emoji: '⚡', colorBg: '#e0f2fe', colorText: '#0c4a6e' },
  'Especialista Base':  { clase: 'cell-especialista',       emoji: '🟤', colorBg: '#f1f5f9', colorText: '#334155' },
  'Zona de Riesgo':     { clase: 'cell-riesgo',             emoji: '🔴', colorBg: '#fee2e2', colorText: '#7f1d1d' },
}

const GRID_LAYOUT = [
  ['Relacionador',    'Consultor Avanzado', 'Vendedor Élite'],
  ['En Construcción', 'Perfil Balanceado',  'Técnico Comercial'],
  ['Zona de Riesgo',  'Especialista Base',  'Técnico Puro'],
]

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

function avatarColor(nombre) { return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length] }
function initials(nombre) { return nombre.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() }
function calcularEje(p) { return p >= 75 ? 'Alto' : p >= 50 ? 'Medio' : 'Bajo' }
function ejeColor(e) { return e === 'Alto' ? '#059669' : e === 'Medio' ? '#d97706' : '#dc2626' }

function calcularCuadrante(c, t) {
  if (c==='Alto'  && t==='Alto')  return 'Vendedor Élite'
  if (c==='Alto'  && t==='Medio') return 'Consultor Avanzado'
  if (c==='Alto'  && t==='Bajo')  return 'Relacionador'
  if (c==='Medio' && t==='Alto')  return 'Técnico Comercial'
  if (c==='Medio' && t==='Medio') return 'Perfil Balanceado'
  if (c==='Medio' && t==='Bajo')  return 'En Construcción'
  if (c==='Bajo'  && t==='Alto')  return 'Técnico Puro'
  if (c==='Bajo'  && t==='Medio') return 'Especialista Base'
  return 'Zona de Riesgo'
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers })
  return res.json()
}

async function supabasePost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  })
  return res.json()
}

let state = { vendedores: [], evaluaciones: [], pilares: [], selectedVendedor: null }

function getUltimaEval(id) { return state.evaluaciones.find(e => e.vendedor_id === id) || null }

async function cargarDatos() {
  const [v, e, p] = await Promise.all([
    supabaseGet('vendedores?select=*,pais:paises(nombre),area:areas(nombre),lider:lideres(nombre)&activo=eq.true&order=nombre'),
    supabaseGet('evaluaciones?select=*&order=anio.desc,periodo.desc'),
    supabaseGet('pilares_consultivos?select=*&order=orden')
  ])
  state.vendedores = Array.isArray(v) ? v : []
  state.evaluaciones = Array.isArray(e) ? e : []
  state.pilares = Array.isArray(p) ? p : []
}
function renderNineBox() {
  const grid = document.getElementById('nineBoxGrid')
  if (!grid) return

  const porCuadrante = {}
  state.vendedores.forEach(v => {
    const ev = getUltimaEval(v.id)
    const c = ev?.cuadrante
    if (c) {
      if (!porCuadrante[c]) porCuadrante[c] = []
      porCuadrante[c].push({ ...v, evaluacion: ev })
    }
  })

  grid.innerHTML = GRID_LAYOUT.map(row =>
    row.map(cuadrante => {
      const cfg = CUADRANTES[cuadrante]
      const vends = porCuadrante[cuadrante] || []
      return `<div class="cell ${cfg.clase}">
        <div class="cell-header">
          <span class="cell-name">${cfg.emoji} ${cuadrante}</span>
          <span class="cell-count">${vends.length}</span>
        </div>
        <div class="cell-avatars">
          ${vends.map(v => `
            <div class="avatar ${state.selectedVendedor?.id === v.id ? 'selected' : ''}"
              style="background:${avatarColor(v.nombre)}"
              onclick="selectVendedor('${v.id}')"
              title="${v.nombre}">
              ${initials(v.nombre)}
            </div>`).join('')}
          ${vends.length === 0 ? '<span class="empty-cell">Sin evaluaciones</span>' : ''}
        </div>
      </div>`
    }).join('')
  ).join('')
}

async function selectVendedor(id) {
  state.selectedVendedor = state.vendedores.find(v => v.id === id)
  renderNineBox()
  await renderFicha()
}

async function renderFicha() {
  const panel = document.getElementById('fichaPanel')
  if (!panel) return
  const v = state.selectedVendedor
  if (!v) {
    panel.innerHTML = `<div class="ficha-empty"><div class="icon">👤</div><p>Selecciona un vendedor</p></div>`
    return
  }
  const ev = getUltimaEval(v.id)
  let items = []
  if (ev) {
    items = await supabaseGet(`items_consultivos?select=*,pilar:pilares_consultivos(*)&evaluacion_id=eq.${ev.id}`)
    items = Array.isArray(items) ? items.sort((a,b) => a.pilar.orden - b.pilar.orden) : []
  }
  const ejeC = ev?.eje_consultivo || '—'
  const ejeT = ev?.eje_tecnico || '—'
  const cuadrante = ev?.cuadrante || 'Sin evaluar'
  const cfg = CUADRANTES[cuadrante] || { emoji: '—', colorBg: '#f1f5f9', colorText: '#334155' }

  panel.innerHTML = `
    <div class="ficha-header">
      <div class="ficha-header-top">
        <div class="ficha-avatar-big">${initials(v.nombre)}</div>
        <div class="ficha-info">
          <h2>${v.nombre}</h2>
          <p>${v.rol || ''} ${v.nivel_org ? '· ' + v.nivel_org : ''}</p>
          <div class="ficha-tags">
            <span class="tag" style="background:${cfg.colorBg};color:${cfg.colorText}">${cfg.emoji} ${cuadrante}</span>
            ${v.pais?.nombre ? `<span class="tag" style="background:#e2e8f0;color:#475569">📍 ${v.pais.nombre}</span>` : ''}
          </div>
        </div>
        ${ev ? `<div class="ficha-scores">
          <div class="score-box">
            <label>Consultivo</label>
            <div class="score-num" style="color:${ejeColor(ejeC)}">${ev.puntaje_consultivo?.toFixed(0) || '—'}</div>
            <div class="score-eje" style="color:${ejeColor(ejeC)}">${ejeC}</div>
          </div>
          <div class="score-divider"></div>
          <div class="score-box">
            <label>Técnico</label>
            <div class="score-num" style="color:${ejeColor(ejeT)}">${ev.nota_tecnica_raw?.toFixed(0) || '—'}</div>
            <div class="score-eje" style="color:${ejeColor(ejeT)}">${ejeT}</div>
          </div>
          ${ev.performance_ytd ? `<div class="score-divider"></div>
          <div class="score-box">
            <label>YTD</label>
            <div class="score-num" style="color:#059669">${ev.performance_ytd}%</div>
            <div class="score-eje" style="color:#94a3b8">de meta</div>
          </div>` : ''}
        </div>` : ''}
      </div>
      <div class="ficha-meta">
        <div class="meta-item"><label>Área</label><p>${v.area?.nombre || '—'}</p></div>
        <div class="meta-item"><label>Líder</label><p>${v.lider?.nombre || '—'}</p></div>
        <div class="meta-item"><label>Ingreso</label><p>${v.fecha_ingreso || '—'}</p></div>
        <div class="meta-item"><label>País</label><p>${v.pais?.nombre || '—'}</p></div>
      </div>
    </div>

    ${items.length > 0 ? `
    <div class="card">
      <h3>📊 Perfil Consultivo</h3>
      <div class="arana-container">
        <canvas id="aranaChart" width="260" height="260"></canvas>
        <div class="arana-legend">
          ${items.map(item => `
            <div class="arana-item">
              <span style="font-size:11px;color:#64748b;width:160px;flex-shrink:0">${item.pilar.nombre}</span>
              <div class="bar-bg"><div class="bar-fill" style="width:${item.puntaje}%"></div></div>
              <span class="bar-val">${item.puntaje}</span>
            </div>`).join('')}
        </div>
      </div>
    </div>` : ''}

    <div class="two-cols">
      <div class="card fortalezas">
        <h3>⭐ Fortalezas</h3>
        ${ev?.fortalezas?.length > 0 ? `<ul>${ev.fortalezas.map(f=>`<li>${f}</li>`).join('')}</ul>` : '<p style="font-size:13px;color:#94a3b8;font-style:italic">Sin registrar</p>'}
      </div>
      <div class="card oportunidades">
        <h3>📈 Oportunidades de mejora</h3>
        ${ev?.oportunidades_mejora?.length > 0 ? `<ul>${ev.oportunidades_mejora.map(o=>`<li>${o}</li>`).join('')}</ul>` : '<p style="font-size:13px;color:#94a3b8;font-style:italic">Sin registrar</p>'}
      </div>
    </div>

    ${ev?.comentario_lider ? `
    <div class="card">
      <h3>💬 Comentario del líder</h3>
      <p style="font-size:13px;color:#475569;line-height:1.6">${ev.comentario_lider}</p>
    </div>` : ''}
    <div style="height:20px"></div>`

  if (items.length > 0) setTimeout(() => drawArana(items), 100)
}

function drawArana(items) {
  const canvas = document.getElementById('aranaChart')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const n = items.length
  const cx = 130, cy = 130, r = 100
  ctx.clearRect(0, 0, 260, 260)
  for (let lv = 1; lv <= 5; lv++) {
    const lr = r * lv / 5
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const a = (i/n)*Math.PI*2 - Math.PI/2
      i===0 ? ctx.moveTo(cx+lr*Math.cos(a), cy+lr*Math.sin(a)) : ctx.lineTo(cx+lr*Math.cos(a), cy+lr*Math.sin(a))
    }
    ctx.closePath(); ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=1; ctx.stroke()
  }
  for (let i = 0; i < n; i++) {
    const a = (i/n)*Math.PI*2 - Math.PI/2
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))
    ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=1; ctx.stroke()
  }
  ctx.font='9px sans-serif'; ctx.fillStyle='#64748b'; ctx.textAlign='center'
  for (let i = 0; i < n; i++) {
    const a = (i/n)*Math.PI*2 - Math.PI/2
    ctx.fillText(items[i].pilar.nombre.split(' ')[0], cx+(r+18)*Math.cos(a), cy+(r+18)*Math.sin(a)+3)
  }
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const a = (i/n)*Math.PI*2 - Math.PI/2
    const val = items[i].puntaje/100
    i===0 ? ctx.moveTo(cx+r*val*Math.cos(a),cy+r*val*Math.sin(a)) : ctx.lineTo(cx+r*val*Math.cos(a),cy+r*val*Math.sin(a))
  }
  ctx.closePath(); ctx.fillStyle='rgba(59,130,246,0.15)'; ctx.fill()
  ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2; ctx.stroke()
  for (let i = 0; i < n; i++) {
    const a = (i/n)*Math.PI*2 - Math.PI/2
    const val = items[i].puntaje/100
    ctx.beginPath(); ctx.arc(cx+r*val*Math.cos(a),cy+r*val*Math.sin(a),4,0,Math.PI*2)
    ctx.fillStyle='#3b82f6'; ctx.fill()
  }
}

async function init() {
  const grid = document.getElementById('nineBoxGrid')
  if (grid) grid.innerHTML = '<div class="loading">Cargando</div>'
  await cargarDatos()
  renderNineBox()
}

document.addEventListener('DOMContentLoaded', init)
async function supabasePatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  })
  return res.json()
}
