export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "ruta-escolar-worker" }, 200, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/send") {
      const apiKey = request.headers.get("x-api-key");
      if (!env.API_KEY || apiKey !== env.API_KEY) {
        return json({ ok: false, error: "No autorizado" }, 401, corsHeaders);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "JSON inválido" }, 400, corsHeaders);
      }

      const telefono = String(body.telefono || "").replace(/\D/g, "");
      const mensaje = String(body.mensaje || "").trim();
      if (!telefono || !mensaje) {
        return json({ ok: false, error: "Faltan teléfono o mensaje" }, 400, corsHeaders);
      }

      const response = await fetch(`https://graph.facebook.com/v23.0/${env.PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: telefono,
          type: "text",
          text: { body: mensaje }
        })
      });

      const data = await response.json();
      if (!response.ok) {
        return json({ ok: false, error: data }, 500, corsHeaders);
      }
      return json({ ok: true, data }, 200, corsHeaders);
    }

    return json({ ok: false, error: "Ruta no encontrada" }, 404, corsHeaders);
  }
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}
