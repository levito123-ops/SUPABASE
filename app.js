import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Configuración de tu proyecto lsyvtohbhrgzmqtvuqop
const supabaseUrl = 'https://lsyvtohbhrgzmqtvuqop.supabase.co'
const supabaseAnonKey = 'sb_publishable_Mx1ZMCY26g7i2lbxyrasIQ_Bic7PtjS'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Captura de elementos del DOM
const selectEspecie = document.getElementById('especie_id')
const selectRaza = document.getElementById('raza_id')
const selectAtencion = document.getElementById('tipo_atencion_id')
const selectCondicion = document.getElementById('condicion_medica_id')
const filtroEspecie = document.getElementById('filtroEspecie')
const tablaBody = document.getElementById('tablaMascotasBody')
const formulario = document.getElementById('mascotaForm')
const mensajeAlerta = document.getElementById('mensajeAlerta')

// Variable global para almacenar las mascotas temporalmente para el filtro
let listaMascotasGlobal = []

// Función para lanzar mensajes dinámicos en pantalla
function lanzarAlerta(texto, tipo) {
    mensajeAlerta.innerText = texto
    mensajeAlerta.className = `message ${tipo}`
    mensajeAlerta.style.display = 'block'
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 1. Cargar selects de forma dinámica desde las tablas catálogo obligatorias
async function iniciarCatalogos() {
    try {
        const { data: especies, error: errE } = await supabase.from('especies').select('id, nombre').eq('activo', true)
        const { data: razas, error: errR } = await supabase.from('razas').select('id, nombre').eq('activo', true)
        const { data: atenciones, error: errA } = await supabase.from('tipos_atencion').select('id, nombre')
        const { data: condiciones, error: errC } = await supabase.from('condiciones_medicas').select('id, nombre')

        if (errE || errR || errA || errC) throw new Error("Error cargando catálogos obligatorios.")

        // Llenar Formulario - Especies
        selectEspecie.innerHTML = '<option value="">Seleccione Especie...</option>'
        especies.forEach(e => { selectEspecie.innerHTML += `<option value="${e.id}">${e.nombre}</option>` })

        // Llenar Filtro - Especies (Rúbrica Examen)
        filtroEspecie.innerHTML = '<option value="TODOS">Mostrar todos</option>'
        especies.forEach(e => { filtroEspecie.innerHTML += `<option value="${e.id}">${e.nombre}</option>` })

        // Llenar Formulario - Razas
        selectRaza.innerHTML = '<option value="">Seleccione Raza...</option>'
        razas.forEach(r => { selectRaza.innerHTML += `<option value="${r.id}">${r.nombre}</option>` })

        // Llenar Formulario - Tipos de atención
        selectAtencion.innerHTML = '<option value="">Seleccione Atención...</option>'
        atenciones.forEach(a => { selectAtencion.innerHTML += `<option value="${a.id}">${a.nombre}</option>` })

        // Llenar Formulario - Condiciones médicas
        selectCondicion.innerHTML = '<option value="">Seleccione Condición...</option>'
        condiciones.forEach(c => { selectCondicion.innerHTML += `<option value="${c.id}">${c.nombre}</option>` })

    } catch (err) {
        console.error(err)
        lanzarAlerta("Error al enlazar los catálogos de Supabase.", "error")
    }
}

// 2. Traer registros y renderizarlos mostrando nombres de texto en lugar de IDs numéricos
async function cargarListadoMascotas() {
    try {
        // Hacemos el GET relacionando los nombres de los catálogos en una sola consulta
        const { data: mascotas, error } = await supabase
            .from('mascotas')
            .select(`
                id, nombre_mascota, edad_mascota, peso, nombre_dueno, apellido_dueno, dni_dueno, celular, correo, observaciones,
                especies (nombre),
                razas (nombre),
                tipos_atencion (nombre),
                condiciones_medicas (nombre)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        listaMascotasGlobal = mascotas
        renderizarTabla(mascotas)

    } catch (err) {
        console.error(err)
        tablaBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #991b1b;">Error al leer los datos de mascotas.</td></tr>`
    }
}

// Función que dibuja las filas de la tabla
function renderizarTabla(datos) {
    if (datos.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #64748b;">No hay mascotas registradas con este criterio.</td></tr>`
        return
    }

    tablaBody.innerHTML = ''
    datos.forEach(m => {
        tablaBody.innerHTML += `
            <tr>
                <td><strong>${m.nombre_mascota}</strong></td>
                <td>${m.edad_mascota !== null ? m.edad_mascota + ' años' : '---'}</td>
                <td>${m.peso !== null ? m.peso + ' kg' : '---'}</td>
                <td>${m.nombre_dueno} ${m.apellido_dueno}</td>
                <td>${m.dni_dueno}</td>
                <td>${m.celular}</td>
                <td>${m.especies ? m.especies.nombre : '---'}</td>
                <td>${m.razas ? m.razas.nombre : '---'}</td>
                <td>${m.tipos_atencion ? m.tipos_atencion.nombre : '---'}</td>
                <td>${m.condiciones_medicas ? m.condiciones_medicas.nombre : '---'}</td>
            </tr>
        `
    })
}

// Escuchador del Filtro por Especie (Rúbrica Examen)
filtroEspecie.addEventListener('change', (e) => {
    const seleccion = e.target.value
    if (seleccion === "TODOS") {
        renderizarTabla(listaMascotasGlobal)
    } else {
        // En Supabase, filtramos basándonos en la relación cargada o el ID original guardado en el objeto
        // Para simplificar, como hicimos un GET completo, lo filtramos directamente en la respuesta guardada
        // lsyvtohbhrgzmqtvuqop guarda la relación en el objeto de respuesta del select
        cargarMascotasConFiltroBase(seleccion)
    }
})

async function cargarMascotasConFiltroBase(especieId) {
    try {
        const { data: mascotas, error } = await supabase
            .from('mascotas')
            .select(`
                id, nombre_mascota, edad_mascota, peso, nombre_dueno, apellido_dueno, dni_dueno, celular, correo, observaciones,
                especies (nombre),
                razas (nombre),
                tipos_atencion (nombre),
                condiciones_medicas (nombre)
            `)
            .eq('especie_id', parseInt(especieId))
            .order('created_at', { ascending: false })

        if (error) throw error
        renderizarTabla(mascotas)
    } catch (err) {
        console.error(err)
    }
}

// 3. Procesar Envío del Formulario y ejecutar Validaciones estrictas de la rúbrica
formulario.addEventListener('submit', async (e) => {
    e.preventDefault()
    mensajeAlerta.style.display = 'none'

    // Capturar inputs
    const nombre_mascota = document.getElementById('nombre_mascota').value.trim()
    const edad_mascota = document.getElementById('edad_mascota').value
    const peso = document.getElementById('peso').value
    const nombre_dueno = document.getElementById('nombre_dueno').value.trim()
    const apellido_dueno = document.getElementById('apellido_dueno').value.trim()
    const dni_dueno = document.getElementById('dni_dueno').value.trim()
    const celular = document.getElementById('celular').value.trim()
    const correo = document.getElementById('correo').value.trim()
    const especie_id = selectEspecie.value
    const raza_id = selectRaza.value
    const tipo_atencion_id = selectAtencion.value
    const condicion_medica_id = selectCondicion.value
    const observaciones = document.getElementById('observaciones').value.trim()

    // --- BLOQUE DE VALIDACIONES DE LA RÚBRICA ---
    // Validación: No enviar formulario vacío
    if (!nombre_mascota && !nombre_dueno && !apellido_dueno && !dni_dueno && !celular && !correo) {
        lanzarAlerta("No se puede enviar el formulario vacío.", "error")
        return
    }
    // Validación: Nombres y apellidos obligatorios
    if (!nombre_mascota || !nombre_dueno || !apellido_dueno) {
        lanzarAlerta("El nombre de la mascota, nombres y apellidos del dueño no pueden estar vacíos.", "error")
        return
    }
    // Validación: DNI exacto de 8 dígitos
    if (dni_dueno.length !== 8 || isNaN(dni_dueno)) {
        lanzarAlerta("El DNI del dueño debe tener exactamente 8 dígitos.", "error")
        return
    }
    // Validación: Correo electrónico válido
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!patronCorreo.test(correo)) {
        lanzarAlerta("Por favor, ingrese un correo electrónico válido.", "error")
        return
    }
    // Validación: Celular mínimo 9 dígitos
    if (celular.length < 9 || isNaN(celular)) {
        lanzarAlerta("El celular debe tener como mínimo 9 dígitos.", "error")
        return
    }
    // Validación: Selects obligatorios seleccionados
    if (!especie_id) { lanzarAlerta("Debe seleccionar una especie.", "error"); return }
    if (!raza_id) { lanzarAlerta("Debe seleccionar una raza.", "error"); return }
    if (!tipo_atencion_id) { lanzarAlerta("Debe seleccionar un tipo de atención.", "error"); return }
    if (!condicion_medica_id) { lanzarAlerta("Debe seleccionar una condición médica.", "error"); return }

    // --- GUARDAR REGISTRO EN LA TABLA PRINCIPAL 'mascotas' ---
    const { error } = await supabase
        .from('mascotas')
        .insert([{
            nombre_mascota,
            edad_mascota: edad_mascota ? parseInt(edad_mascota) : null,
            peso: peso ? parseFloat(peso) : null,
            nombre_dueno,
            apellido_dueno,
            dni_dueno,
            celular,
            correo,
            especie_id: parseInt(especie_id),
            raza_id: parseInt(raza_id),
            tipo_atencion_id: parseInt(tipo_atencion_id),
            condicion_medica_id: parseInt(condicion_medica_id),
            observaciones: observaciones || null
        }])

    // --- MANEJO DE RESPUESTAS EXIGIDAS EN LA RÚBRICA ---
    if (error) {
        if (error.code === '23505') { // Código de error de clave duplicada en PostgreSQL/Supabase
            lanzarAlerta("Usuario ya registrado", "error")
        } else {
            lanzarAlerta("No se pudo registrar el paciente. Verifique los datos ingresados.", "error")
        }
    } else {
        lanzarAlerta("Paciente registrado correctamente", "success")
        formulario.reset()
        // Recargar la tabla automáticamente para reflejar la nueva mascota registrada
        cargarListadoMascotas()
    }
})

// Ejecución inicial al cargar la página web
iniciarCatalogos()
cargarListadoMascotas()