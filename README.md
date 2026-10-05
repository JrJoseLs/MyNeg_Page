# MyNeg · Landing page

Sitio de presentación de [MyNeg](https://github.com/JrJoseLs/MyNeg), el sistema de caja, inventario y facturación electrónica para negocios de República Dominicana.

**Tecnología:** [Astro](https://astro.build) (HTML estático, ideal para SEO) · [Three.js](https://threejs.org) (escena 3D de partículas) · [GSAP](https://gsap.com) + ScrollTrigger (animaciones al hacer scroll) · [Lenis](https://lenis.darkroom.engineering) (scroll suave) · [Remotion](https://remotion.dev) (video generado con código).

## Arrancar

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # revisa tipos y compila en dist/
npm run preview    # sirve dist/ como en producción
```

## Qué se cambia dónde

| Quiero cambiar… | Archivo |
|---|---|
| WhatsApp, correo, precios, preguntas, roles | `src/config.ts` |
| Textos e imágenes de una sección | `src/components/*.astro` |
| Formas 3D (logo, recibo, cajas, red, gráfico) | `src/scripts/scene.ts` |
| Animaciones de scroll | `src/scripts/main.ts` |
| SEO (meta, Open Graph, JSON-LD) | `src/layouts/Base.astro` |
| Video | `video/` (ver `video/PUBLICAR.md`) |
| Manuales por rol | Ya no van aquí: están dentro de MyNeg (menú → Ayuda), con video y PDF por rol. Se editan en `packages/shared/src/help.ts` del repositorio MyNeg (ver `tools/guias/README.md`). `privado/manuales/` queda como versión anterior. |

> **Antes de publicar:** cambia el `email` en `src/config.ts` (hoy es de ejemplo) y revisa los precios, que son los de ejemplo de Plataforma → Planes.

## Publicar en GitHub Pages

1. Crea el repositorio `MyNeg_Page` en GitHub (puede ser público; los manuales en `privado/` nunca se suben).
2. Sube el código:
   ```bash
   git init -b main
   git add .
   git commit -m "Landing de MyNeg"
   git remote add origin https://github.com/JrJoseLs/MyNeg_Page.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Source: GitHub Actions**.
4. Cada `push` a `main` publica solo en `https://myneg.duckdns.org` (dominio en `public/CNAME`).

**Dominio propio** (ej. `myneg.do`): agrega `public/CNAME` con el dominio, apunta el DNS a GitHub Pages y en `.github/workflows/deploy.yml` cambia `SITE_URL=https://myneg.do` y `BASE_PATH=/`. Actualiza también la línea `Sitemap:` de `public/robots.txt`.

## Buenas prácticas incluidas

- **Rendimiento:** HTML estático; el 3D (Three.js) se carga en segundo plano después del primer pintado y se pausa si no se ve; menos partículas en el celular.
- **SEO:** título y descripción con palabras clave locales, `lang="es-DO"`, URL canónica, Open Graph y Twitter Card con imagen 1200×630, `sitemap.xml`, `robots.txt` y datos estructurados `SoftwareApplication`, `FAQPage` y `VideoObject` (Google puede mostrar las preguntas y el video en los resultados).
- **Accesibilidad:** HTML semántico, enlace «Saltar al contenido», pestañas de roles navegables con teclado, foco visible, subtítulos en el video, y todo funciona sin animaciones si el sistema pide `prefers-reduced-motion`. Sin JavaScript, la página se lee completa.
- **Calidad:** TypeScript estricto, `astro check` en cada build, Prettier y EditorConfig, CI que revisa cada Pull Request y Dependabot mensual.
- **Seguridad:** sin secretos en el código; `privado/` y `.env` están en `.gitignore`.

### Para el día a día

- Trabaja en ramas (`feat/precios`, `fix/menu-movil`) y entra a `main` con Pull Request: así corre la CI antes de publicar.
- Mensajes de commit claros y en presente: `Agrega sección de testimonios`.
- Prueba en el celular de verdad antes de publicar (`npm run dev -- --host` y abre la IP desde el teléfono).
- Mide con Lighthouse (Chrome → DevTools → Lighthouse) después de cada cambio grande.
- Cuando tengas clientes, agrega testimonios reales y logos: es lo que más convierte.

## Estructura

```
src/
  config.ts          contenido editable (contacto, planes, FAQ, roles)
  layouts/Base.astro SEO y estructura HTML
  pages/index.astro  la página
  components/        una sección por archivo
  scripts/scene.ts   escena 3D de partículas
  scripts/main.ts    scroll, animaciones y control del 3D
public/              favicon, og.png, video/, robots.txt
video/               proyecto Remotion (voz, música, escenas)
privado/             manuales por rol (no se publica)
```
