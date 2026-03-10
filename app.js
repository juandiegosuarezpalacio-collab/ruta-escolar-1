const DEFAULT_BARRIOS = [
  "Centro", "El Turbai", "Villa Carolina", "Villa Juliana", "La Isabela", "Santa Helena", "Guaduales",
  "Cacique", "Ciudad Alegría", "La Julia", "La Esmeralda", "Alaska", "Pueblo Tapao", "Obrero"
];

const DEFAULT_STUDENTS = [
  { id: crypto.randomUUID(), nombre: "Juan Pablo", acudiente: "Mamá", telefono: "573225940033", barrio: "El Turbai", ruta: "Bachillerato 1", ordenRecogida: 1, ordenDejada: 3, nota: "Recoger frente a la tienda" },
  { id: crypto.randomUUID(), nombre: "Nicolás Bedoya", acudiente: "Mamá", telefono: "573128840559", barrio: "El Turbai", ruta: "Bachillerato 1", ordenRecogida: 2, ordenDejada: 2, nota: "Llamar al llegar" },
  { id: crypto.randomUUID(), nombre: "Dilan Gañán", acudiente: "Abuela Teresa", telefono: "573206342481", barrio: "El Turbai", ruta: "Bachillerato 1", ordenRecogida: 3, ordenDejada: 1, nota: "Esperar 1 minuto" },
  { id: crypto.randomUUID(), nombre: "Sofía Ramírez", acudiente: "Mamá", telefono: "573010000001", barrio: "Centro", ruta: "Primaria", ordenRecogida: 1, ordenDejada: 2, nota: "Portón azul" },
  { id: crypto.randomUUID(), nombre: "Mateo López", acudiente: "Papá", telefono: "573010000002", barrio: "Villa Carolina", ruta: "Primaria", ordenRecogida: 2, ordenDejada: 1, nota: "Tocar timbre" }
];

const state = {
  estudiantes: [],
  barrios: [],
  rutaActual: "Bachillerato 1",
  tipoOrden: "recogida",
  indiceActual: 0,
  iniciado: false,
  completados: [],
  currentPosition: null,
  watchId: null,
  lastBarrioNotified: null,
  backend: { url: "", key: "" }
};

const el = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEls();
  loadConfig();
  await loadData();
  bindEvents();
  paintAll();
  addLog("Aplicación cargada correctamente.");
}

function bindEls() {
  [
    "gpsEstado","resumenRuta","btnIniciarRuta","btnGPS","statActivos","statPendientes","statCompletados","filtroRuta","tonoMensajes",
    "modoEnvio","tipoOrden","btnAlistamiento","btnBarrio","btnSiguiente","btnSubio","btnLlegadaColegio","btnEntrega","badgeRutaActual",
    "estudianteActual","backendUrl","backendKey","btnGuardarBackend","btnProbarBackend","estadoBackend","tipoMensaje","previewMensaje",
    "btnMejorarMensaje","btnGenerarPreview","btnEnviarActual","btnEnviarRuta","listaOrden","labelOrden","formEstudiante","estudianteId",
    "nombre","acudiente","telefono","barrioInput","rutaInput","ordenRecogida","ordenDejada","nota","btnEliminar","btnLimpiarFormulario",
    "tablaEstudiantes","listaBarrios","logEventos","btnLimpiarLog","badgeModo"
  ].forEach((id) => el[id] = document.getElementById(id));
}

function bindEvents() {
  el.filtroRuta.addEventListener("change", () => { state.rutaActual = el.filtroRuta.value; state.indiceActual = 0; state.completados = []; paintAll(); });
  el.tipoOrden.addEventListener("change", () => { state.tipoOrden = el.tipoOrden.value; paintAll(); });
  el.modoEnvio.addEventListener("change", () => { paintMode(); saveConfig(); });
  el.btnIniciarRuta.addEventListener("click", iniciarRuta);
  el.btnGPS.addEventListener("click", activarGPS);
  el.btnGenerarPreview.addEventListener("click", refreshPreview);
  el.btnMejorarMensaje.addEventListener("click", () => { el.previewMensaje.value = mejorarTextoIA(el.previewMensaje.value, el.tonoMensajes.value); });
  el.btnEnviarActual.addEventListener("click", () => enviarMensajeActual(el.tipoMensaje.value));
  el.btnEnviarRuta.addEventListener("click", () => enviarMensajeMasivoRuta(el.tipoMensaje.value));
  el.btnAlistamiento.addEventListener("click", () => enviarMensajeMasivoRuta("alistamiento"));
  el.btnBarrio.addEventListener("click", avisarBarrioActual);
  el.btnSiguiente.addEventListener("click", siguienteEstudiante);
  el.btnSubio.addEventListener("click", marcarSubio);
  el.btnLlegadaColegio.addEventListener("click", () => enviarMensajeMasivoRuta("llegadaColegio"));
  el.btnEntrega.addEventListener("click", () => enviarMensajeActual("entrega"));
  el.btnGuardarBackend.addEventListener("click", guardarBackend);
  el.btnProbarBackend.addEventListener("click", probarBackend);
  el.formEstudiante.addEventListener("submit", guardarEstudiante);
  el.btnEliminar.addEventListener("click", eliminarEstudiante);
  el.btnLimpiarFormulario.addEventListener("click", limpiarFormulario);
  el.btnLimpiarLog.addEventListener("click", () => { localStorage.removeItem("rutaLogs"); paintLogs(); });
}

async function loadData() {
  const [students, barrios] = await Promise.all([safeLoadJson("data/estudiantes.json", DEFAULT_STUDENTS), safeLoadJson("data/barrios.json", DEFAULT_BARRIOS)]);
  const savedStudents = getLocal("rutaEstudiantes", null);
  state.estudiantes = normalizeStudents(savedStudents || students);
  state.barrios = Array.isArray(barrios) && barrios.length ? barrios : DEFAULT_BARRIOS;
}

async function safeLoadJson(path, fallback) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch {
    return fallback;
  }
}

function normalizeStudents(list) {
  return (list || []).map((s, index) => ({
    id: s.id || crypto.randomUUID(),
    nombre: s.nombre || "Sin nombre",
    acudiente: s.acudiente || "Acudiente",
    telefono: normalizePhone(s.telefono || ""),
    barrio: s.barrio || "Centro",
    ruta: s.ruta || "Bachillerato 1",
    ordenRecogida: Number(s.ordenRecogida || s.orden || index + 1),
    ordenDejada: Number(s.ordenDejada || s.ordenEntrega || index + 1),
    nota: s.nota || "",
    lat: s.lat || null,
    lng: s.lng || null
  }));
}

function normalizePhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("57") ? digits : `57${digits}`;
}

function getRutas() {
  return [...new Set(state.estudiantes.map((s) => s.ruta))].sort();
}

function getRutaStudents() {
  const key = state.tipoOrden === "dejada" ? "ordenDejada" : "ordenRecogida";
  return state.estudiantes
    .filter((s) => s.ruta === state.rutaActual)
    .sort((a, b) => Number(a[key]) - Number(b[key]));
}

function getCurrentStudent() {
  const list = getRutaStudents();
  return list[state.indiceActual] || null;
}

function paintAll() {
  paintSelects();
  paintMode();
  paintStats();
  paintCurrentStudent();
  paintOrder();
  paintStudents();
  paintBarrios();
  paintLogs();
  refreshPreview();
}

function paintSelects() {
  const rutas = getRutas();
  if (!rutas.includes(state.rutaActual)) state.rutaActual = rutas[0] || "Bachillerato 1";
  fillSelect(el.filtroRuta, rutas, state.rutaActual);
  fillSelect(el.rutaInput, rutas, el.rutaInput.value || state.rutaActual);
  el.labelOrden.textContent = state.tipoOrden === "dejada" ? "Dejada" : "Recogida";
  el.resumenRuta.textContent = `${state.rutaActual} · ${getRutaStudents().length} estudiantes cargados.`;
}

function fillSelect(select, values, selected) {
  select.innerHTML = values.map((v) => `<option ${v === selected ? "selected" : ""}>${v}</option>`).join("");
}

function paintMode() {
  const modeText = { demo: "Demo", whatsapp: "Abrir WhatsApp", business: "Business" }[el.modoEnvio.value];
  el.badgeModo.textContent = modeText;
}

function paintStats() {
  const routeList = getRutaStudents();
  el.statActivos.textContent = routeList.length;
  el.statPendientes.textContent = Math.max(routeList.length - state.completados.length, 0);
  el.statCompletados.textContent = state.completados.length;
}

function paintCurrentStudent() {
  const current = getCurrentStudent();
  if (!current) {
    el.estudianteActual.innerHTML = '<div class="current-empty">No hay estudiante seleccionado.</div>';
    el.badgeRutaActual.textContent = state.iniciado ? "Ruta completa" : "Sin iniciar";
    return;
  }
  el.badgeRutaActual.textContent = `${state.rutaActual} · ${state.indiceActual + 1}`;
  el.estudianteActual.innerHTML = `
    <div class="student-header">
      <div>
        <strong>${current.nombre}</strong>
        <div class="current-meta">${current.acudiente} · ${formatPhone(current.telefono)}</div>
      </div>
      <span class="badge">${current.barrio}</span>
    </div>
    <div class="current-meta">Orden recogida: ${current.ordenRecogida} · Orden dejada: ${current.ordenDejada}</div>
    <div class="current-meta">Nota: ${current.nota || "Sin nota"}</div>
  `;
}

function paintOrder() {
  const current = getCurrentStudent();
  const idsDone = new Set(state.completados);
  el.listaOrden.innerHTML = getRutaStudents().map((s) => {
    const active = current && current.id === s.id;
    const done = idsDone.has(s.id);
    const key = state.tipoOrden === "dejada" ? s.ordenDejada : s.ordenRecogida;
    return `
      <div class="order-item ${active ? "active" : ""} ${done ? "done" : ""}">
        <strong>${key}. ${s.nombre}</strong>
        <div class="student-meta">${s.barrio} · ${s.acudiente}</div>
      </div>`;
  }).join("");
}

function paintStudents() {
  el.tablaEstudiantes.innerHTML = state.estudiantes
    .sort((a, b) => a.ruta.localeCompare(b.ruta) || a.ordenRecogida - b.ordenRecogida)
    .map((s) => `
      <article class="student-row">
        <div class="student-header">
          <div>
            <strong>${s.nombre}</strong>
            <div class="student-meta">${s.ruta} · ${s.barrio}</div>
            <div class="student-meta">${formatPhone(s.telefono)} · ${s.acudiente}</div>
          </div>
          <span class="badge soft">R ${s.ordenRecogida} / D ${s.ordenDejada}</span>
        </div>
        <div class="student-meta">${s.nota || "Sin nota"}</div>
        <div class="student-actions">
          <button class="btn secondary" onclick="editarEstudiante('${s.id}')">Editar</button>
          <button class="btn secondary" onclick="enviarMensajeDirecto('${s.id}')">Enviar</button>
        </div>
      </article>
    `).join("");
}

function paintBarrios() {
  el.listaBarrios.innerHTML = state.barrios.map((b) => `<option value="${b}"></option>`).join("");
}

function paintLogs() {
  const logs = getLogs();
  el.logEventos.innerHTML = logs.length ? logs.map((item) => `
    <div class="log-item">
      <div>${item.texto}</div>
      <small>${new Date(item.fecha).toLocaleString()}</small>
    </div>`).join("") : '<div class="current-empty">Aún no hay eventos.</div>';
}

function iniciarRuta() {
  state.iniciado = true;
  state.indiceActual = 0;
  state.completados = [];
  addLog(`Ruta ${state.rutaActual} iniciada.`);
  paintAll();
}

function siguienteEstudiante() {
  if (!state.iniciado) iniciarRuta();
  const current = getCurrentStudent();
  if (current) markDone(current.id);
  state.indiceActual += 1;
  const next = getCurrentStudent();
  addLog(next ? `Siguiente estudiante: ${next.nombre}.` : `Ruta ${state.rutaActual} terminada.`);
  paintAll();
}

function marcarSubio() {
  const current = getCurrentStudent();
  if (!current) return addLog("No hay estudiante actual.");
  markDone(current.id);
  addLog(`${current.nombre} marcado como recogido.`);
  refreshPreview("subio");
  paintAll();
}

function markDone(id) {
  if (!state.completados.includes(id)) state.completados.push(id);
}

async function activarGPS() {
  if (!navigator.geolocation) return addLog("Este celular no soporta GPS.");
  if (state.watchId) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
    el.gpsEstado.textContent = "GPS apagado";
    addLog("GPS detenido.");
    return;
  }
  state.watchId = navigator.geolocation.watchPosition((pos) => {
    state.currentPosition = pos.coords;
    el.gpsEstado.textContent = `GPS activo · ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    detectarBarrioActual();
  }, (err) => addLog(`Error GPS: ${err.message}`), { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
  addLog("GPS activado.");
}

function detectarBarrioActual() {
  const current = getCurrentStudent();
  if (!current || !state.iniciado) return;
  if (state.lastBarrioNotified === current.barrio) return;
  state.lastBarrioNotified = current.barrio;
  addLog(`Barrio detectado para aviso: ${current.barrio}.`);
}

function getMessageData(student, overrides = {}) {
  return {
    estudiante: student?.nombre || "estudiante",
    acudiente: student?.acudiente || "familia",
    telefono: student?.telefono || "",
    barrio: student?.barrio || "barrio",
    ruta: student?.ruta || state.rutaActual,
    orden: state.tipoOrden === "dejada" ? student?.ordenDejada : student?.ordenRecogida,
    minutos: 3,
    nota: student?.nota || "",
    texto: overrides.texto || el.previewMensaje.value
  };
}

function refreshPreview(forceType) {
  const tipo = forceType || el.tipoMensaje.value;
  const current = getCurrentStudent() || getRutaStudents()[0] || state.estudiantes[0];
  const texto = generarMensajeIA(tipo, el.tonoMensajes.value, getMessageData(current));
  el.previewMensaje.value = texto;
}

async function enviarMensajeActual(tipo) {
  const current = getCurrentStudent();
  if (!current) return addLog("No hay estudiante actual para enviar mensaje.");
  const mensaje = tipo === "personalizado" ? mejorarTextoIA(el.previewMensaje.value, el.tonoMensajes.value) : generarMensajeIA(tipo, el.tonoMensajes.value, getMessageData(current));
  const ok = await dispatchMessage(current, mensaje);
  if (ok) addLog(`Mensaje ${tipo} enviado a ${current.nombre}.`);
}

async function enviarMensajeMasivoRuta(tipo) {
  const list = getRutaStudents();
  if (!list.length) return addLog("No hay estudiantes en la ruta.");
  for (const student of list) {
    const mensaje = tipo === "personalizado" ? mejorarTextoIA(el.previewMensaje.value, el.tonoMensajes.value) : generarMensajeIA(tipo, el.tonoMensajes.value, getMessageData(student));
    await dispatchMessage(student, mensaje);
  }
  addLog(`Envío masivo ${tipo} completado para ${state.rutaActual}.`);
}

async function avisarBarrioActual() {
  const current = getCurrentStudent();
  if (!current) return addLog("No hay barrio actual disponible.");
  const delBarrio = getRutaStudents().filter((s) => s.barrio === current.barrio);
  if (!delBarrio.length) return addLog("No hay estudiantes para ese barrio.");
  for (const student of delBarrio) {
    const mensaje = generarMensajeIA("barrio", el.tonoMensajes.value, getMessageData(student));
    await dispatchMessage(student, mensaje);
  }
  addLog(`Aviso de barrio enviado para ${current.barrio}.`);
}

async function dispatchMessage(student, mensaje) {
  const mode = el.modoEnvio.value;
  if (!student.telefono) {
    addLog(`Falta teléfono para ${student.nombre}.`);
    return false;
  }
  try {
    if (mode === "demo") {
      addLog(`[DEMO] ${student.nombre}: ${mensaje}`);
      return true;
    }
    if (mode === "whatsapp") {
      openWhatsApp(student.telefono, mensaje);
      return true;
    }
    if (mode === "business") {
      const result = await sendBusinessMessage(student.telefono, mensaje, student.nombre);
      if (result.ok) return true;
      throw new Error(result.error || "Error backend");
    }
  } catch (error) {
    addLog(`Error enviando a ${student.nombre}: ${error.message}`);
    return false;
  }
  return false;
}

function openWhatsApp(phone, message) {
  const clean = phone.replace(/\D/g, "");
  const text = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const appUrl = `whatsapp://send?phone=${clean}&text=${text}`;
  const webUrl = `https://wa.me/${clean}?text=${text}`;
  if (isMobile) {
    window.location.href = appUrl;
    setTimeout(() => window.open(webUrl, "_blank"), 700);
  } else {
    window.open(webUrl, "_blank");
  }
}

async function sendBusinessMessage(phone, message, nombre) {
  const url = (el.backendUrl.value || "").trim().replace(/\/$/, "");
  const key = (el.backendKey.value || "").trim();
  if (!url || !key) return { ok: false, error: "Falta URL o API key del backend." };
  const res = await fetch(`${url}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({ telefono: phone, mensaje: message, nombre })
  });
  let data = {};
  try { data = await res.json(); } catch { data = { ok: res.ok }; }
  if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };
  return data;
}

async function probarBackend() {
  const url = (el.backendUrl.value || "").trim().replace(/\/$/, "");
  if (!url) return addLog("Falta la URL del backend.");
  try {
    const res = await fetch(`${url}/health`);
    const data = await res.json();
    el.estadoBackend.textContent = data.ok ? "Conectado" : "Sin conexión";
    addLog(data.ok ? "Backend conectado correctamente." : "Backend respondió sin ok.");
  } catch (error) {
    el.estadoBackend.textContent = "Error";
    addLog(`No se pudo conectar con el backend: ${error.message}`);
  }
}

function guardarBackend() {
  saveConfig();
  addLog("Configuración del backend guardada.");
}

function loadConfig() {
  const cfg = getLocal("rutaConfig", { mode: "demo", backendUrl: "", backendKey: "" });
  el.modoEnvio.value = cfg.mode || "demo";
  el.backendUrl.value = cfg.backendUrl || "";
  el.backendKey.value = cfg.backendKey || "";
}

function saveConfig() {
  localStorage.setItem("rutaConfig", JSON.stringify({ mode: el.modoEnvio.value, backendUrl: el.backendUrl.value, backendKey: el.backendKey.value }));
}

function guardarEstudiante(ev) {
  ev.preventDefault();
  const payload = {
    id: el.estudianteId.value || crypto.randomUUID(),
    nombre: el.nombre.value.trim(),
    acudiente: el.acudiente.value.trim(),
    telefono: normalizePhone(el.telefono.value),
    barrio: el.barrioInput.value.trim(),
    ruta: el.rutaInput.value.trim(),
    ordenRecogida: Number(el.ordenRecogida.value || 1),
    ordenDejada: Number(el.ordenDejada.value || 1),
    nota: el.nota.value.trim()
  };
  const index = state.estudiantes.findIndex((s) => s.id === payload.id);
  if (index >= 0) state.estudiantes[index] = payload; else state.estudiantes.push(payload);
  persistStudents();
  limpiarFormulario();
  addLog(`Estudiante guardado: ${payload.nombre}.`);
  paintAll();
}

function persistStudents() {
  localStorage.setItem("rutaEstudiantes", JSON.stringify(state.estudiantes));
}

window.editarEstudiante = function editarEstudiante(id) {
  const s = state.estudiantes.find((item) => item.id === id);
  if (!s) return;
  el.estudianteId.value = s.id;
  el.nombre.value = s.nombre;
  el.acudiente.value = s.acudiente;
  el.telefono.value = s.telefono;
  el.barrioInput.value = s.barrio;
  el.rutaInput.value = s.ruta;
  el.ordenRecogida.value = s.ordenRecogida;
  el.ordenDejada.value = s.ordenDejada;
  el.nota.value = s.nota;
};

window.enviarMensajeDirecto = function enviarMensajeDirecto(id) {
  const s = state.estudiantes.find((item) => item.id === id);
  if (!s) return;
  const msg = generarMensajeIA(el.tipoMensaje.value, el.tonoMensajes.value, getMessageData(s));
  dispatchMessage(s, msg);
};

function eliminarEstudiante() {
  const id = el.estudianteId.value;
  if (!id) return addLog("Selecciona un estudiante para eliminar.");
  const currentLength = state.estudiantes.length;
  state.estudiantes = state.estudiantes.filter((s) => s.id !== id);
  if (state.estudiantes.length === currentLength) return;
  persistStudents();
  limpiarFormulario();
  addLog("Estudiante eliminado.");
  paintAll();
}

function limpiarFormulario() {
  el.formEstudiante.reset();
  el.estudianteId.value = "";
  el.rutaInput.value = state.rutaActual;
}

function addLog(texto) {
  const logs = getLogs();
  logs.unshift({ texto, fecha: Date.now() });
  localStorage.setItem("rutaLogs", JSON.stringify(logs.slice(0, 100)));
  paintLogs();
}

function getLogs() {
  return getLocal("rutaLogs", []);
}

function getLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function formatPhone(phone) {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 10) return phone;
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}
