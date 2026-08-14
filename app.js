// ============================================================
// SALES TRAINING DIIO — app.js
// ============================================================

const SUPABASE_URL = 'https://mqodrhsrzwsixqonzphx.supabase.co'
const SUPABASE_KEY = 'sb_publishable_ul0kxpolvUOp3x0IfVUc_g_Cdo-bC9L'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
}

// ── Cuadrantes ─────────────────────────────────────────────

const CUADRANTES = {
  'Vendedor Élite':      { clase: 'cell-elite',            emoji: '🏆', colorBg: '#d1fae5', colorText: '#065f46' },
  'Consultor Avanzado':  { clase: 'cell-consultor-avanzado', emoji: '🟢', colorBg: '#dcfce7', colorText: '#166534' },
  'Relacionador':        { clase: 'cell-relacionador',      emoji: '🟡', colorBg: '#fef9c3', colorText: '#854d0e' },
  'Técnico Comercial':   { clase: 'cell-tecnico-comercial', emoji: '🟣', colorBg: '#ede9fe', colorText: '#4c1d95' },
  'Perfil Balanceado':   { clase: 'cell-balanceado',        emoji: '🔵', colorBg: '#dbeafe', colorText: '#1e3a8a' },
  'En Construcción':     { clase: 'cell-construccion',      emoji: '🟠', colorBg: '#ffedd5', colorText: '#7c2d12' },
  'Técnico Puro':        { clase: 'cell-tecnico-puro',      emoji: '⚡', colorBg: '#e0f2fe', colorText: '#0c4a6e' },
  'Especialista Base':   { clase: 'cell-especialista',      emoji: '🟤', colorBg: '#f1f5f9', colorText: '#334155' },
  'Zona de Riesgo':      { clase: 'cell-riesgo',            emoji: '🔴', colorBg: '#fee2e2', colorText: '#7f1d1d' },
}

const GRID_LAYOUT = [
  ['Relacionador',    'Consultor Avanzado', 'Vendedor Élite'],
  ['En Construcción', 'Perfil Balanceado',  'Técnico Comercial'],
  ['Zona de Riesgo',  'Especialista Base',  'Técnico Puro'],
]

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b',
  '#10b981','#3b82f6','#ef4444','#14b8a6'
]

function avatarColor(nombre) {
  return AVATAR_COLORS[nombre.charCodeAt(0) % AVATAR_COLORS.length]
}

function initials(nombre) {
  return nombre.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase()
}

function calcularEje(puntaje) {
  if (puntaje >= 75) return 'Alto'
  if (puntaje >= 50) return 'Medio'
  return 'Bajo'
}

function ejeColor(eje) {
  if (eje === 'Alto') return '#059669'
  if (eje === 'Medio') return '#d97706'
  return '#dc2626'
}

function calcularCuadrante(ejeC, ejeT) {
  if (ejeC==='Alto'  && ejeT==='Alto')  return 'Vendedor Élite'
  if (ejeC==='Alto'  && ejeT==='Medio') return 'Consultor Avanzado'
  if (ejeC==='Alto'  && ejeT==='Bajo')  return 'Relacionador'
  if (ejeC==='Medio' && ejeT==='Alto')  return 'Técnico Comercial'
  if (ejeC==='Medio' && ejeT==='Medio') return 'Perfil Balanceado'
  if (ejeC==='Medio' && ejeT==='Bajo')  return 'En Construcción'
  if (ejeC==='Bajo'  && ejeT==='Alto')  return 'Técnico Puro'
  if (ejeC==='Bajo'  && ejeT==='Medio') return 'Especialista Base'
  return 'Zona de Riesgo'
}

// ── API Supabase ────────────────────────────────────────────

async function supabase(path) {
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

async function supabasePatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body)
  })
  return res.json()
}

// ── Estado global ───────────────────────────────────────────

let state = {
  vendedores: [],
  evaluaciones: [],
  pilares: [],
  selectedVendedor: null,
  page: 'nine-box'
}

// ── Cargar datos ────────────────────────────────────────────

async function cargarDatos() {
  const [vendedores, evaluaciones, pilares] = await Promise.all([
    supabase('vendedores?select=
