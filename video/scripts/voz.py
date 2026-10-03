"""
Genera la voz en off del video (voces neurales dominicanas) y el timeline de escenas.

  python scripts/voz.py

Salida:
  public/audio/vo-XX.mp3     una pista por escena
  src/timeline.json          duración de cada escena (en cuadros) y subtítulos
  out/myneg-90s.srt / .vtt   subtítulos para YouTube, Facebook y la landing

Para una versión comercial definitiva, usa las mismas voces con licencia en Azure Speech
(es-DO-RamonaNeural / es-DO-EmilioNeural) o graba una voz humana con este mismo guion.
"""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
OUT = ROOT / "out"
FPS = 30
TOTAL_SECONDS = 90

DUENA = "es-DO-RamonaNeural"  # la dueña de negocio: plantea el problema
NARRADOR = "es-DO-EmilioNeural"  # MyNeg: la solución

# (escena, voz, texto que se lee, texto en pantalla, pausa extra después en segundos)
# "Mai Neg" se escribe así para que la voz lo pronuncie bien; en pantalla dice MyNeg.
GUION = [
    ("hook", DUENA, "¿Tu caja cuadró ayer?... ¿Seguro?", "¿Tu caja cuadró ayer? ¿Seguro?", 0.6),
    ("dolor", DUENA,
     "El fiado, en un cuaderno. El inventario, a ojo. Y si se va el internet... se para todo.",
     "El fiado, en un cuaderno. El inventario, a ojo. Y si se va el internet… se para todo.", 0.5),
    ("urgencia", NARRADOR, "Y desde el quince de noviembre, la DGII exige factura electrónica.",
     "Y desde el 15 de noviembre, la DGII exige factura electrónica.", 0.4),
    ("logo", NARRADOR, "Por eso existe Mai Neg. Tu negocio, en orden.", "Por eso existe MyNeg. Tu negocio, en orden.", 1.0),
    ("caja", NARRADOR,
     "Escaneas y cobras: efectivo, tarjeta o transferencia, con su comprobante fiscal. Y al cerrar, el cuadre te guía billete por billete.",
     "Escaneas y cobras: efectivo, tarjeta o transferencia, con su comprobante fiscal. Y al cerrar, el cuadre te guía billete por billete.", 0.4),
    ("offline", NARRADOR, "¿Se fue el internet? La caja sigue vendiendo. Cuando vuelve, todo se sube solo.",
     "¿Se fue el internet? La caja sigue vendiendo. Cuando vuelve, todo se sube solo.", 0.4),
    ("inventario", NARRADOR,
     "El inventario te dice qué pedir, a quién y cuánto. Y la compra se registra sola, con el XML del proveedor.",
     "El inventario te dice qué pedir, a quién y cuánto. Y la compra se registra sola, con el XML del proveedor.", 0.4),
    ("modulos", NARRADOR, "¿Delivery, mesas, taller, nómina o contabilidad? Activas solo lo que tu negocio necesita.",
     "¿Delivery, mesas, taller, nómina o contabilidad? Activas solo lo que tu negocio necesita.", 0.4),
    ("roles", NARRADOR,
     "Cada empleado ve solo lo suyo: la cajera vende, pero no ve tus costos. Y tú lo ves todo, desde el celular.",
     "Cada empleado ve solo lo suyo: la cajera vende, pero no ve tus costos. Y tú lo ves todo, desde el celular.", 0.4),
    ("fiscal", NARRADOR, "A fin de mes, el itbis, el seis cero seis y el seis cero siete ya están listos.",
     "A fin de mes, el ITBIS, el 606 y el 607 ya están listos.", 0.5),
    ("cta", NARRADOR,
     "Mai Neg. Catorce días gratis. Escríbenos por WhatsApp, y pon tu negocio en orden. Hoy.",
     "MyNeg. 14 días gratis. Escríbenos por WhatsApp y pon tu negocio en orden. Hoy.", 0.0),
]

LEAD_IN = 0.3  # silencio antes de que hable en cada escena


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


def chunks(text: str) -> list[str]:
    """Parte el texto en frases cortas para los subtítulos: corta en comas o conjunciones, cerca de la mitad."""
    parts = [p.strip() for p in re.split(r"(?<=[.?!:…])\s+", text) if p.strip()]
    out: list[str] = []

    def split(words: list[str]) -> None:
        if len(words) <= 7:
            out.append(" ".join(words))
            return
        mid = len(words) / 2
        cands = [i for i in range(2, len(words) - 1) if words[i - 1].endswith(",") or words[i] in ("y", "pero", "con")]
        cut = min(cands, key=lambda i: abs(i - mid)) if cands else round(mid)
        split(words[:cut])
        split(words[cut:])

    for p in parts:
        split(p.split())
    return out


def ts(seconds: float, sep: str) -> str:
    ms = round(seconds * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02}{sep}{ms:03}"


async def main() -> None:
    AUDIO.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for i, (scene, voice, spoken, *_rest) in enumerate(GUION):
        path = AUDIO / f"vo-{i:02}.mp3"
        await edge_tts.Communicate(spoken, voice, rate="+10%").save(str(path))
        print(f"  voz {scene:<11} {duration(path):5.2f}s")

    speech = [duration(AUDIO / f"vo-{i:02}.mp3") for i in range(len(GUION))]
    base = [LEAD_IN + s + g[4] for s, g in zip(speech, GUION)]
    spare = TOTAL_SECONDS - sum(base)
    if spare < 0:
        raise SystemExit(f"El guion dura {sum(base):.1f}s: recórtalo {-spare:.1f}s para que quepa en {TOTAL_SECONDS}s")
    # el tiempo que sobra se lo damos sobre todo al logo y al cierre, el resto parejo
    weights = {"logo": 3, "cta": 4, "hook": 1.5}
    wsum = sum(weights.get(g[0], 1) for g in GUION)
    scenes = []
    cues = []
    t = 0.0
    frames_used = 0
    for i, (g, s, b) in enumerate(zip(GUION, speech, base)):
        dur = b + spare * weights.get(g[0], 1) / wsum
        frames = round((t + dur) * FPS) - frames_used if i < len(GUION) - 1 else TOTAL_SECONDS * FPS - frames_used
        start = frames_used
        frames_used += frames
        # subtítulos repartidos según el largo de cada frase
        parts = chunks(g[3])
        total_chars = sum(len(p) for p in parts)
        ct = t + LEAD_IN
        scene_cues = []
        for p in parts:
            d = s * len(p) / total_chars
            scene_cues.append({"from": round((ct - t) * FPS), "to": round((ct + d - t) * FPS), "text": p})
            cues.append((ct, ct + d, p))
            ct += d
        scenes.append({
            "id": g[0],
            "from": start,
            "frames": frames,
            "audio": f"audio/vo-{i:02}.mp3",
            "voiceFrom": round(LEAD_IN * FPS),
            "voiceFrames": round(s * FPS),
            "captions": scene_cues,
        })
        t += dur

    (ROOT / "src" / "timeline.json").write_text(
        json.dumps({"fps": FPS, "frames": TOTAL_SECONDS * FPS, "scenes": scenes}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    srt = "\n".join(f"{n}\n{ts(a, ',')} --> {ts(b, ',')}\n{txt}\n" for n, (a, b, txt) in enumerate(cues, 1))
    vtt = "WEBVTT\n\n" + "\n".join(f"{ts(a, '.')} --> {ts(b, '.')}\n{txt}\n" for a, b, txt in cues)
    (OUT / "myneg-90s.srt").write_text(srt, encoding="utf-8")
    (OUT / "myneg-90s.vtt").write_text(vtt, encoding="utf-8")
    print(f"Voz: {sum(speech):.1f}s de {TOTAL_SECONDS}s · {len(cues)} subtítulos · timeline listo")


asyncio.run(main())
