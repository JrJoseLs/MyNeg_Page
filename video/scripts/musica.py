"""
Música original y efectos del video, sintetizados aquí mismo (sin licencias de terceros).

  python scripts/musica.py

La música sigue la historia del timeline: tensa y oscura mientras se plantean los
problemas, un "riser" antes del logo, y un ritmo luminoso y optimista desde ahí.
"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / "public" / "audio"
SR = 44100
BPM = 100
BEAT = 60 / BPM
rng = np.random.default_rng(7)

timeline = json.loads((ROOT / "src" / "timeline.json").read_text(encoding="utf-8"))
fps = timeline["fps"]
scene_start = {s["id"]: s["from"] / fps for s in timeline["scenes"]}
TOTAL = timeline["frames"] / fps
DROP = scene_start["logo"]  # aquí entra el ritmo


def note(n: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    pitch, octave = n[:-1], int(n[-1])
    return 440 * 2 ** ((names[pitch] + 12 * (octave - 4) - 9) / 12)


def env(n: int, a: float, r: float) -> np.ndarray:
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    tail = np.clip((n / SR - t) / max(r, 1e-4), 0, 1)
    return e * tail


def lowpass(x: np.ndarray, alpha: float) -> np.ndarray:
    # filtro de un polo, suficiente para suavizar los armónicos
    y = np.empty_like(x)
    acc = 0.0
    for i in range(0, len(x), 4096):
        seg = x[i : i + 4096]
        out = np.empty_like(seg)
        for j, v in enumerate(seg):
            acc += alpha * (v - acc)
            out[j] = acc
        y[i : i + 4096] = out
    return y


def pad_voice(freq: float, n: int) -> np.ndarray:
    t = np.arange(n) / SR
    detune = [0.997, 1.0, 1.004]
    sig = sum(np.sin(2 * np.pi * freq * d * t) + 0.35 * np.sin(4 * np.pi * freq * d * t) for d in detune)
    return sig / 4


out = np.zeros(int(TOTAL * SR) + SR)


def add(sig: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    j = min(len(out), i + len(sig))
    out[i:j] += sig[: j - i] * gain


# Progresiones: tensa (Am – F – Dm – E) y luminosa (C – G – Am – F)
dark = [["A2", "E3", "A3", "C4"], ["F2", "C3", "F3", "A3"], ["D2", "A2", "D3", "F3"], ["E2", "B2", "E3", "G#3"]]
bright = [["C3", "G3", "C4", "E4"], ["G2", "D3", "G3", "B3"], ["A2", "E3", "A3", "C4"], ["F2", "C3", "F3", "A3"]]
BAR = BEAT * 4

# Pad tenso hasta el drop
t = 0.0
k = 0
while t < DROP:
    dur = min(BAR, DROP - t + 0.6)
    n = int(dur * SR)
    chord = sum(pad_voice(note(x), n) for x in dark[k % 4]) * env(n, 0.8, 0.9)
    add(chord, t, 0.10)
    t += BAR
    k += 1

# Latido grave en la parte del problema
t = 0.6
while t < DROP - 2.5:
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (55 + 30 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12)
    add(thump, t, 0.35)
    add(thump, t + 0.28, 0.18)
    t += BEAT * 2

# Riser: ruido que sube durante 2.5 s antes del logo
n = int(2.5 * SR)
noise = rng.standard_normal(n)
sweep = np.linspace(0.002, 0.25, n)
riser = np.zeros(n)
acc = 0.0
for i in range(n):
    acc += sweep[i] * (noise[i] - acc)
    riser[i] = acc
riser *= np.linspace(0, 1, n) ** 2
add(riser, DROP - 2.5, 0.35)

# Parte luminosa: pad + arpegio + bajo + batería suave
t = DROP
k = 0
while t < TOTAL:
    chord = bright[k % 4]
    n = int(BAR * SR) + int(0.5 * SR)
    add(sum(pad_voice(note(x), n) for x in chord) * env(n, 0.3, 0.6), t, 0.07)
    # bajo en negras
    for b in range(4):
        nb = int(BEAT * 0.9 * SR)
        tb = np.arange(nb) / SR
        bass = np.sin(2 * np.pi * note(chord[0]) * tb) * np.exp(-tb * 3.5)
        add(bass, t + b * BEAT, 0.16)
    # arpegio en corcheas
    arp = [note(chord[1]), note(chord[2]), note(chord[3]), note(chord[2]) * 2]
    for e in range(8):
        f = arp[e % len(arp)] * 2
        ne = int(BEAT * 0.5 * SR)
        te = np.arange(ne) / SR
        pluck = (np.sin(2 * np.pi * f * te) + 0.3 * np.sin(4 * np.pi * f * te)) * np.exp(-te * 9)
        add(pluck, t + e * BEAT / 2, 0.05)
    # bombo en 1 y 3, platillo cerrado en contratiempos, palmas en 2 y 4
    for b in range(4):
        tk = np.arange(int(0.3 * SR)) / SR
        if b in (0, 2):
            kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tk * 40)) * tk) * np.exp(-tk * 9)
            add(kick, t + b * BEAT, 0.42)
        else:
            clap = rng.standard_normal(len(tk)) * np.exp(-tk * 28)
            add(np.diff(clap, prepend=0), t + b * BEAT, 0.07)
        hat = np.diff(rng.standard_normal(int(0.05 * SR)), prepend=0) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90)
        add(hat, t + b * BEAT + BEAT / 2, 0.05)
    t += BAR
    k += 1

# Final: acorde de C que se queda sonando
n = int(4 * SR)
add(sum(pad_voice(note(x), n) for x in ["C3", "G3", "C4", "E4", "G4"]) * env(n, 0.05, 3.5), TOTAL - 4, 0.08)

out = out[: int(TOTAL * SR)]
fade = int(1.5 * SR)
out[-fade:] *= np.linspace(1, 0, fade)
out[: int(0.5 * SR)] *= np.linspace(0, 1, int(0.5 * SR))
out = lowpass(out, 0.55)
out /= np.max(np.abs(out)) * 1.12


def save(path: Path, mono: np.ndarray) -> None:
    pcm = (np.clip(mono, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


AUDIO.mkdir(parents=True, exist_ok=True)
save(AUDIO / "musica.wav", out)

# Efectos
n = int(0.6 * SR)
tt = np.arange(n) / SR
whoosh = rng.standard_normal(n)
wo = np.zeros(n)
acc = 0.0
alpha = 0.02 + 0.25 * np.sin(np.pi * tt / tt[-1])
for i in range(n):
    acc += alpha[i] * (whoosh[i] - acc)
    wo[i] = acc
wo *= np.sin(np.pi * tt / tt[-1]) ** 2
save(AUDIO / "whoosh.wav", wo / np.max(np.abs(wo)) * 0.6)

n = int(0.9 * SR)
tt = np.arange(n) / SR
ding = (np.sin(2 * np.pi * 1318.5 * tt) + 0.6 * np.sin(2 * np.pi * 1975.5 * tt)) * np.exp(-tt * 5)
ding[: int(0.12 * SR)] += (np.sin(2 * np.pi * 987.8 * tt) * np.exp(-tt * 20))[: int(0.12 * SR)]
save(AUDIO / "ding.wav", ding / np.max(np.abs(ding)) * 0.5)

n = int(0.12 * SR)
tt = np.arange(n) / SR
pop = np.sin(2 * np.pi * (300 + 900 * np.exp(-tt * 60)) * tt) * np.exp(-tt * 40)
save(AUDIO / "pop.wav", pop / np.max(np.abs(pop)) * 0.5)

print(f"Música: {TOTAL:.0f}s, drop en {DROP:.1f}s · efectos: whoosh, ding, pop")
