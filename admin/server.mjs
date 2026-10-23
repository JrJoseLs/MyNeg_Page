/**
 * Editor local de la landing: npm run admin → http://127.0.0.1:4322
 *
 * Edita src/data/sitio.json (contacto, clientes, planes, preguntas…), sube logos a
 * public/clientes/, muestra la vista previa (astro dev en el puerto 4321) y publica con
 * git commit + git push. GitHub Actions compila y sube el sitio a GitHub Pages.
 *
 * Solo escucha en este equipo (127.0.0.1) y nunca se publica: el sitio es solo dist/.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src', 'data', 'sitio.json');
const LOGOS = path.join(ROOT, 'public', 'clientes');
const PORT = Number(process.env.EDITOR_PORT ?? 4322);
const PREVIEW_PORT = 4321;
const LOGO_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
const isWin = process.platform === 'win32';

/** Corre un comando y devuelve su salida (código y texto) */
function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd: ROOT, shell: isWin, windowsHide: true });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('error', (e) => resolve({ code: 1, out: `${out}\n${e.message}` }));
    child.on('close', (code) => resolve({ code, out: out.trim() }));
  });
}

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

function readBody(req, limit = 3 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('El archivo es muy grande (máximo 3 MB)'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/** Revisa lo mínimo para que la página siga compilando */
function validate(d) {
  const problems = [];
  if (!d || typeof d !== 'object') return ['El contenido no es válido'];
  if (!d.sitio?.name) problems.push('Falta el nombre del sitio');
  if (!/^\d{8,15}$/.test(String(d.sitio?.whatsapp ?? '')))
    problems.push('El WhatsApp debe ser solo números con el código del país (ej. 18095551234)');
  for (const k of ['planes', 'clientes', 'tiposDeNegocio', 'roles', 'preguntas'])
    if (!Array.isArray(d[k])) problems.push(`Falta la lista «${k}»`);
  (d.clientes ?? []).forEach((c, i) => {
    if (!c.name?.trim()) problems.push(`Cliente ${i + 1}: falta el nombre`);
    if (!c.type?.trim()) problems.push(`Cliente ${i + 1}: falta el tipo de negocio`);
    if (c.logo && !fs.existsSync(path.join(LOGOS, c.logo)))
      problems.push(`Cliente ${c.name}: no se encuentra el logo ${c.logo}`);
  });
  (d.planes ?? []).forEach((p, i) => {
    if (!p.name?.trim()) problems.push(`Plan ${i + 1}: falta el nombre`);
    if (!(p.price >= 0)) problems.push(`Plan ${p.name || i + 1}: el precio no es un número`);
  });
  (d.preguntas ?? []).forEach((f, i) => {
    if (!f.q?.trim() || !f.a?.trim()) problems.push(`Pregunta ${i + 1}: falta la pregunta o la respuesta`);
  });
  return problems;
}

/** Quita campos vacíos de los clientes (así el JSON queda limpio) */
function tidy(d) {
  d.clientes = (d.clientes ?? []).map((c) =>
    Object.fromEntries(Object.entries(c).filter(([, v]) => v !== '' && v != null)),
  );
  return d;
}

async function api(req, res, url) {
  // Solo esta página puede usar la API: otra web abierta en el navegador no manda esta cabecera
  if (req.headers['x-editor'] !== 'myneg') return send(res, 403, { error: 'No permitido' });

  if (url.pathname === '/api/data' && req.method === 'GET')
    return send(res, 200, JSON.parse(fs.readFileSync(DATA, 'utf8')));

  if (url.pathname === '/api/data' && req.method === 'PUT') {
    let data;
    try {
      data = tidy(JSON.parse((await readBody(req)).toString('utf8')));
    } catch {
      return send(res, 400, { error: 'El contenido no es JSON válido' });
    }
    const problems = validate(data);
    if (problems.length) return send(res, 400, { error: problems.join('\n') });
    fs.writeFileSync(DATA, `${JSON.stringify(data, null, 2)}\n`);
    // Los logos que ya no usa ningún cliente se borran (si no, se publicarían igual)
    const used = new Set(data.clientes.map((c) => c.logo).filter(Boolean));
    for (const f of fs.existsSync(LOGOS) ? fs.readdirSync(LOGOS) : []) {
      if (LOGO_TYPES[path.extname(f).toLowerCase()] && !used.has(f)) fs.rmSync(path.join(LOGOS, f));
    }
    // Mismo formato que el resto del proyecto (la revisión de los PR lo exige)
    await run('npx', ['prettier', '--write', 'src/data/sitio.json']);
    return send(res, 200, { ok: true });
  }

  if (url.pathname === '/api/logo' && req.method === 'POST') {
    // El nombre viene codificado (las cabeceras no admiten tildes ni ñ)
    const original = decodeURIComponent(String(req.headers['x-filename'] ?? ''));
    const ext = path.extname(original).toLowerCase();
    if (!LOGO_TYPES[ext]) return send(res, 400, { error: 'Usa un logo PNG, JPG, WebP o SVG' });
    const slug =
      path
        .basename(original, ext)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'logo';
    let body;
    try {
      body = await readBody(req);
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
    if (ext === '.svg' && /<script|on\w+\s*=/i.test(body.toString('utf8')))
      return send(res, 400, { error: 'Ese SVG trae código: expórtalo de nuevo como imagen' });
    fs.mkdirSync(LOGOS, { recursive: true });
    let name = `${slug}${ext}`;
    for (let i = 2; fs.existsSync(path.join(LOGOS, name)); i++) name = `${slug}-${i}${ext}`;
    fs.writeFileSync(path.join(LOGOS, name), body);
    return send(res, 200, { file: name });
  }

  if (url.pathname === '/api/status' && req.method === 'GET') {
    const st = await run('git', ['status', '-sb']);
    const last = await run('git', ['log', '-1', '--format=%h · %s · %cr']);
    return send(res, 200, { status: st.out, last: last.out });
  }

  if (url.pathname === '/api/publish' && req.method === 'POST') {
    let message = 'Actualiza el contenido de la landing';
    try {
      message = JSON.parse((await readBody(req)).toString('utf8')).message?.trim() || message;
    } catch {
      /* mensaje por defecto */
    }
    const log = [];
    // Antes de subir: que compile (si no, GitHub Pages fallaría igual)
    const build = await run('npm', ['run', 'build']);
    log.push('$ npm run build', build.out.split('\n').slice(-15).join('\n'));
    if (build.code !== 0)
      return send(res, 400, { error: 'La página no compila: no se subió nada', log: log.join('\n') });
    for (const args of [['add', '-A'], ['commit', '-m', message], ['push']]) {
      const r = await run('git', args);
      log.push(`$ git ${args.join(' ')}`, r.out);
      if (r.code !== 0 && !(args[0] === 'commit' && /nothing to commit|nada para hacer commit/i.test(r.out))) {
        return send(res, 400, { error: `Falló git ${args[0]}`, log: log.join('\n') });
      }
    }
    return send(res, 200, { ok: true, log: log.join('\n') });
  }

  send(res, 404, { error: 'No existe' });
}

const server = http.createServer(async (req, res) => {
  // Solo desde este equipo (también frena páginas que se hacen pasar por localhost)
  const host = String(req.headers.host ?? '');
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return send(res, 403, 'No permitido', 'text/plain');
  const url = new URL(req.url ?? '/', `http://${host}`);
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname.startsWith('/clientes/')) {
      const file = path.join(LOGOS, path.basename(url.pathname));
      const type = LOGO_TYPES[path.extname(file).toLowerCase()];
      if (type && fs.existsSync(file)) return send(res, 200, fs.readFileSync(file), type);
      return send(res, 404, 'No existe', 'text/plain');
    }
    if (url.pathname === '/' || url.pathname === '/index.html')
      return send(res, 200, fs.readFileSync(path.join(ROOT, 'admin', 'index.html')), 'text/html; charset=utf-8');
    send(res, 404, 'No existe', 'text/plain');
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Editor de la landing: http://127.0.0.1:${PORT}`);
  if (process.argv.includes('--sin-vista')) return;
  // La vista previa se recarga sola al guardar
  const dev = spawn('npx', ['astro', 'dev', '--port', String(PREVIEW_PORT), '--host', '127.0.0.1'], {
    cwd: ROOT,
    shell: isWin,
    stdio: 'ignore',
    windowsHide: true,
  });
  console.log(`  Vista previa:         http://127.0.0.1:${PREVIEW_PORT}\n`);
  const stop = () => {
    // En Windows la vista previa cuelga de una consola: se cierra con todo lo que abrió
    if (isWin)
      spawn('taskkill', ['/pid', String(dev.pid), '/T', '/F'], { windowsHide: true }).on('close', () =>
        process.exit(0),
      );
    else {
      dev.kill();
      process.exit(0);
    }
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
});
