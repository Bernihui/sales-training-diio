const SUPABASE_URL = 'https://mqodrhsrzwsixqonzphx.supabase.co'
const SUPABASE_KEY = "TU_ANON_KEY"

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
