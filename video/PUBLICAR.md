# Video de MyNeg (90 s): cómo publicarlo

Archivos en `video/out/` (y copia en `public/video/` para la landing):

| Archivo | Para qué |
|---|---|
| `myneg-90s.mp4` | YouTube, Facebook, LinkedIn, la landing (1920×1080) |
| `myneg-90s-vertical.mp4` | Reels, TikTok, Shorts, estados de WhatsApp (1080×1920) |
| `myneg-90s.srt` / `.vtt` | Subtítulos (súbelos aparte: YouTube los indexa y mejora el SEO) |
| `poster.jpg` | Miniatura |

Los subtítulos ya vienen quemados en el video (el 85 % de los videos en redes se ve sin sonido).

## Estructura (problema → solución → acción)

| Tiempo | Escena | Objetivo |
|---|---|---|
| 0:00 | «¿Tu caja cuadró ayer? ¿Seguro?» | Gancho: detener el scroll en 3 s |
| 0:05 | Fiado en cuaderno, inventario a ojo, sin internet | Dolor reconocible |
| 0:14 | 15 de noviembre: e-CF obligatorio | Urgencia real (Ley 32-23) |
| 0:20 | Aparece MyNeg | Revelación de la marca |
| 0:27 | Caja, cobro, comprobante y cuadre | Beneficio principal |
| 0:38 | Sin internet | Diferenciador |
| 0:46 | Pedido sugerido y compras con XML | Ahorro de tiempo |
| 0:55 | Módulos | Sirve para su tipo de negocio |
| 1:04 | Roles | Control y confianza |
| 1:13 | ITBIS, 606, 607 | Tranquilidad fiscal |
| 1:20 | 14 días gratis + WhatsApp | Llamado a la acción |

## YouTube

**Título** (≤ 70 caracteres, palabra clave al inicio):

> Sistema de caja e inventario con e-CF para negocios en RD | MyNeg

**Descripción:**

```
¿Tu caja cuadró ayer? MyNeg es el sistema de punto de venta, inventario y facturación electrónica (e-CF) hecho para negocios de República Dominicana. Funciona hasta sin internet.

✅ Caja rápida con NCF y e-CF (E31, E32, E34) y QR de la DGII
✅ Cuadre de caja guiado billete por billete
✅ Sigue vendiendo sin internet y se sincroniza solo
✅ Pedido sugerido y compras desde el XML del proveedor
✅ ITBIS, 606 y 607 listos cada mes
✅ Delivery, mesas, taller, nómina (TSS, ISR) y contabilidad
✅ Cada empleado ve solo lo suyo. Usuarios ilimitados.

📅 Desde el 15 de noviembre de 2026 la DGII exige factura electrónica a los contribuyentes pequeños y micro. MyNeg ya está listo.

👉 Prueba 14 días gratis: https://jrjosels.github.io/MyNeg_Page
💬 Escríbenos por WhatsApp: https://wa.me/18093603722

00:00 El problema
00:20 MyNeg: la caja y el cuadre
00:38 Sin internet e inventario
00:55 Módulos y roles
01:13 DGII y prueba gratis

#facturaelectronica #ecf #DGII #puntodeventa #RepublicaDominicana #colmado #ferreteria #emprendedoresRD
```

**Etiquetas:** sistema punto de venta república dominicana, facturación electrónica dgii, e-cf, software inventario rd, sistema para colmado, sistema para ferretería, reporte 606 607, cuadre de caja, pos restaurante rd, ley 32-23

**Ajustes:** idioma español (República Dominicana), sube el `.srt` como subtítulo, miniatura `poster.jpg`, agrégalo a una lista «MyNeg en 90 segundos» y fija un comentario con el enlace de WhatsApp.

## Reels / TikTok / Shorts (vertical)

**Texto:** `¿Tu caja cuadró ayer? 🤔 MyNeg: caja, inventario y e-CF para tu negocio. Funciona sin internet. 14 días gratis 👉 link en la bio`

**Hashtags:** `#emprendedoresRD #negociosRD #facturaelectronica #DGII #colmado #ferreteria #puntodeventa #santodomingo #santiagoRD`

Publica entre 7 y 9 p. m. y los domingos al mediodía; responde los comentarios la primera hora.

## Cambiar el video y volver a renderizar

```bash
cd video
npm install
npm run voz       # regenera la voz y el timeline (edita el guion en scripts/voz.py)
npm run musica    # regenera la música al nuevo timeline
npm run studio    # previsualiza y ajusta en el navegador
npm run render    # genera las dos versiones en out/
npm run poster
```

El enlace y el texto del botón final se cambian en `src/Root.tsx`.

## Licencias, antes de pautar

- **Voz:** voces neurales dominicanas de Microsoft (Ramona y Emilio) generadas con `edge-tts`. Para anuncios pagados, regenérala con las mismas voces en **Azure Speech** (licencia comercial) o graba una voz humana con el guion de `scripts/voz.py`.
- **Música y efectos:** sintetizados en `scripts/musica.py`. Son originales, sin derechos de terceros.
- **Remotion:** gratis para personas y empresas de hasta 3 empleados; por encima, requiere licencia de empresa (remotion.dev/license).
