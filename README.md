# Ruta Escolar Montenegro

## Qué se corrigió
- enlaces de archivos correctos
- interfaz móvil funcional
- modos Demo, Abrir WhatsApp y WhatsApp Business
- estudiantes cargados con fallback, incluso si `fetch` falla
- backend Cloudflare Worker con `/health`, `/send` y CORS
- editor de estudiantes y orden de recogida/dejada

## Cómo probar rápido
1. Abre `index.html` en el navegador o súbelo a GitHub Pages.
2. En modo **Demo** todo funciona sin backend.
3. En modo **Abrir WhatsApp** abre la app o WhatsApp Web con el mensaje listo.
4. En modo **WhatsApp Business** debes desplegar `backend/cloudflare-worker.js` en Cloudflare.

## Variables secretas del Worker
- `API_KEY`
- `PHONE_NUMBER_ID`
- `WHATSAPP_TOKEN`

## Nota
Si abres el HTML directo en el celular y no carga el JSON, la app usará la lista interna por defecto, así no queda en blanco.
