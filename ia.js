(function () {
  const templates = {
    alistamiento: {
      formal: (d) => `Buen día, ${d.acudiente}. La ruta ${d.ruta} se está alistando para iniciar el recorrido de ${d.estudiante}. Orden de recogida: ${d.orden}. Barrio: ${d.barrio}. Por favor estar atentos.`,
      cercano: (d) => `Hola ${d.acudiente}, la ruta ${d.ruta} ya se está alistando para recoger a ${d.estudiante}. Van en el orden ${d.orden} por ${d.barrio}. Por favor alistarlo.`,
      breve: (d) => `Ruta ${d.ruta} alistándose para ${d.estudiante}. Orden ${d.orden}. Barrio ${d.barrio}.`
    },
    barrio: {
      formal: (d) => `Buen día, ${d.acudiente}. La ruta ${d.ruta} acaba de ingresar al barrio ${d.barrio}. Por favor preparar a ${d.estudiante}.`,
      cercano: (d) => `Hola ${d.acudiente}, ya ingresamos a ${d.barrio}. Por favor alistar a ${d.estudiante}.`,
      breve: (d) => `Ya ingresamos a ${d.barrio}. Alistar a ${d.estudiante}.`
    },
    cerca: {
      formal: (d) => `Buen día, ${d.acudiente}. La ruta ${d.ruta} está próxima a recoger a ${d.estudiante} en ${d.barrio}. Tiempo estimado: ${d.minutos} minutos.`,
      cercano: (d) => `Hola ${d.acudiente}, la ruta ya va cerca para recoger a ${d.estudiante} en ${d.barrio}. Llegamos en ${d.minutos} minutos aprox.`,
      breve: (d) => `La ruta va cerca para ${d.estudiante}. Llegada aprox: ${d.minutos} min.`
    },
    subio: {
      formal: (d) => `Informamos que ${d.estudiante} ya abordó la ruta ${d.ruta} correctamente.`,
      cercano: (d) => `Hola ${d.acudiente}, ${d.estudiante} ya subió a la ruta sin novedad.`,
      breve: (d) => `${d.estudiante} ya subió a la ruta.`
    },
    llegadaColegio: {
      formal: (d) => `Buen día. Informamos que ${d.estudiante} ya llegó al colegio en la ruta ${d.ruta}.`,
      cercano: (d) => `Hola ${d.acudiente}, ${d.estudiante} ya llegó al colegio.`,
      breve: (d) => `${d.estudiante} ya llegó al colegio.`
    },
    entrega: {
      formal: (d) => `Buen día. Informamos que ${d.estudiante} fue entregado correctamente al finalizar el recorrido.`,
      cercano: (d) => `Hola ${d.acudiente}, ${d.estudiante} ya fue entregado correctamente.`,
      breve: (d) => `${d.estudiante} ya fue entregado.`
    },
    retraso: {
      formal: (d) => `Buen día, ${d.acudiente}. La ruta ${d.ruta} presenta un retraso estimado de ${d.minutos} minutos para recoger a ${d.estudiante}.`,
      cercano: (d) => `Hola ${d.acudiente}, vamos con un retraso aproximado de ${d.minutos} minutos para recoger a ${d.estudiante}.`,
      breve: (d) => `Retraso de ${d.minutos} min para ${d.estudiante}.`
    },
    personalizado: {
      formal: (d) => d.texto || `Buen día, ${d.acudiente}. Tenemos una novedad con la ruta ${d.ruta}.`,
      cercano: (d) => d.texto || `Hola ${d.acudiente}, este es un mensaje personalizado para ${d.estudiante}.`,
      breve: (d) => d.texto || `Mensaje para ${d.estudiante}.`
    }
  };

  function cleanSentence(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .replace(/\s,/, ",")
      .trim();
  }

  window.generarMensajeIA = function generarMensajeIA(tipo, tono, datos) {
    const group = templates[tipo] || templates.personalizado;
    const fn = group[tono] || group.cercano;
    const base = cleanSentence(fn(datos));
    if (!datos.nota) return base;
    return `${base} Nota: ${cleanSentence(datos.nota)}.`;
  };

  window.mejorarTextoIA = function mejorarTextoIA(texto, tono) {
    const raw = cleanSentence(texto);
    if (!raw) return "";
    if (tono === "formal") return raw.replace(/^hola/i, "Buen día") + (/[.!?]$/.test(raw) ? "" : ".");
    if (tono === "breve") return raw.split(". ")[0].trim() + (/[.!?]$/.test(raw) ? "" : ".");
    return raw + (/[.!?]$/.test(raw) ? "" : ".");
  };
})();
