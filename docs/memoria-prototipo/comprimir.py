#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
comprimir_metricas.py - Comprime texto con LLMLingua-2 y calcula tokens reales
utilizando el tokenizador oficial de OpenAI (tiktoken).
"""

import argparse
import codecs
import os
import re
import sys

MODELOS = {
    "ligero": "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank",
    "grande": "microsoft/llmlingua-2-xlm-roberta-large-meetingbank",
}

EXT_CODIGO = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".c", ".h", ".cpp", ".hpp",
    ".cs", ".go", ".rs", ".rb", ".php", ".swift", ".kt", ".sql", ".sh", ".bat",
    ".ps1", ".json", ".yml", ".yaml", ".toml", ".xml", ".html", ".css", ".scss",
}

PATRON_ARCHIVO = re.compile(r"^={4,}\r?\nFile: (.+?)\r?\n={4,}\r?\n", re.MULTILINE)
FORCE_TOKENS = ["\n", ".", "?", "!"] 

def leer_texto(ruta):
    with open(ruta, "rb") as f:
        datos = f.read()
    if datos.startswith((codecs.BOM_UTF16_LE, codecs.BOM_UTF16_BE)):
        print("Aviso: el archivo esta en UTF-16; se convertira a UTF-8.")
        return datos.decode("utf-16")
    try:
        return datos.decode("utf-8-sig")
    except UnicodeDecodeError:
        print("Aviso: el archivo no es UTF-8. Se leera como cp1252.")
        return datos.decode("cp1252", errors="replace")

def elegir_archivo(indicado):
    if indicado:
        if not os.path.isfile(indicado):
            sys.exit(f"Error: no existe el archivo '{indicado}'.")
        return indicado
    candidatos = [
        f for f in os.listdir(".")
        if f.lower().endswith(".txt") and not f.lower().endswith("_comprimido.txt")
    ]
    if not candidatos:
        sys.exit("Error: no hay ningun .txt en esta carpeta.")
    candidatos.sort(key=os.path.getmtime, reverse=True)
    return candidatos[0]

def crear_compresor(nombre_modelo):
    try:
        import torch
        from llmlingua import PromptCompressor
    except ImportError as e:
        sys.exit(f"Error: falta una libreria ({e}). Ejecuta: pip install llmlingua torch tiktoken")

    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Cargando modelo '{nombre_modelo}' en {dispositivo}...")
    try:
        return PromptCompressor(model_name=nombre_modelo, use_llmlingua2=True, device_map=dispositivo)
    except TypeError:
        return PromptCompressor(model_name=nombre_modelo, use_llmlingua2=True)

def minificar_codigo_basico(texto_codigo):
    lineas = texto_codigo.splitlines()
    lineas_limpias = []
    for l in lineas:
        l_stripped = l.strip()
        if l_stripped.startswith("#") or l_stripped.startswith("//"):
            continue
        if l_stripped == "":
            continue
        lineas_limpias.append(l)
    return "\n".join(lineas_limpias)

def comprimir_bloque(compresor, texto, rate):
    texto_limpio = re.sub(r'[ \t]+', ' ', texto)
    r = compresor.compress_prompt_llmlingua2(
        texto_limpio,
        rate=rate,
        force_tokens=FORCE_TOKENS,
        chunk_end_tokens=[".", "\n"],
        drop_consecutive=True,
    )
    return r["compressed_prompt"]

def contar_tokens_reales(texto):
    """Calcula los tokens reales usando el tokenizador de GPT-4o."""
    try:
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")  # Codificación estándar de GPT-4
        return len(enc.encode(texto))
    except ImportError:
        return 0

def procesar(compresor, texto, rate, conservar_codigo, min_chars, optimizar_codigo):
    coincidencias = list(PATRON_ARCHIVO.finditer(texto))
    if not coincidencias:
        out = comprimir_bloque(compresor, texto, rate)
        return out, 1, 0

    partes = [texto[: coincidencias[0].start()]]
    n_comp = n_omit = 0
    total = len(coincidencias)
    
    for i, m in enumerate(coincidencias):
        fin = coincidencias[i + 1].start() if i + 1 < total else len(texto)
        cabecera, cuerpo = m.group(0), texto[m.end():fin]
        ruta = m.group(1).strip()
        ext = os.path.splitext(ruta)[1].lower()
        
        if ext in EXT_CODIGO and optimizar_codigo and not conservar_codigo:
            cuerpo = minificar_codigo_basico(cuerpo)

        omitir = (conservar_codigo and ext in EXT_CODIGO) or len(cuerpo.strip()) < min_chars
        
        if omitir:
            partes.append(cabecera + cuerpo)
            n_omit += 1
            continue
            
        print(f"[{i + 1}/{total}] comprimiendo {ruta}")
        out = comprimir_bloque(compresor, cuerpo, rate)
        
        out_optimizada = re.sub(r'\n{3,}', '\n\n', out) 
        partes.append(cabecera + out_optimizada.rstrip("\n") + "\n\n")
        n_comp += 1
        
    return "".join(partes), n_comp, n_omit

def main():
    ap = argparse.ArgumentParser(description="Comprime texto con métricas exactas de tokens.")
    ap.add_argument("archivo", nargs="?", help="Archivo .txt de entrada.")
    ap.add_argument("--rate", type=float, default=0.5, help="Fracción a conservar.")
    ap.add_argument("--modelo", choices=MODELOS.keys(), default="ligero")
    ap.add_argument("--salida", help="Archivo de salida.")
    ap.add_argument("--conservar-codigo", action="store_true")
    ap.add_argument("--optimizar-codigo", action="store_true")
    ap.add_argument("--min-chars", type=int, default=400)
    args = ap.parse_args()

    if not 0.05 <= args.rate <= 1.0:
        sys.exit("Error: --rate debe estar entre 0.05 y 1.0.")

    origen = elegir_archivo(args.archivo)
    destino = args.salida or os.path.splitext(origen)[0] + "_comprimido.txt"

    texto_original = leer_texto(origen)
    
    # 1. Contar tokens del archivo completo ANTES de hacer nada
    print("Calculando tokens iniciales...")
    tokens_iniciales = contar_tokens_reales(texto_original)

    compresor = crear_compresor(MODELOS[args.modelo])
    resultado, n_comp, n_omit = procesar(
        compresor, texto_original, args.rate, args.conservar_codigo, args.min_chars, args.optimizar_codigo
    )

    with open(destino, "w", encoding="utf-8") as f:
        f.write(resultado)

    # 2. Contar tokens del archivo completo DESPUÉS de compilar el resultado
    tokens_finales = contar_tokens_reales(resultado)

    # Métricas avanzadas adicionales incorporadas
    ahorro_caracteres = (1 - len(resultado) / max(len(texto_original), 1)) * 100
    
    print("\n================ REPORTES DE TOKENS (MÉTRICA REAL LLM) ================")
    if tokens_iniciales > 0:
        ahorro_tokens = (1 - tokens_finales / tokens_iniciales) * 100
        print(f"🔹 Tokens Iniciales:    {tokens_iniciales:,}")
        print(f"🔹 Tokens Reducidos:    {tokens_finales:,}")
        print(f"🔥 AHORRO REAL DE TOKENS: {ahorro_tokens:.2f}% de reducción")
    else:
        print("⚠️ Instala tiktoken ('pip install tiktoken') para ver los tokens exactos.")
        
    print("-----------------------------------------------------------------------")
    print(f"📦 Caracteres:          {len(texto_original):,} -> {len(resultado):,} ({ahorro_caracteres:.1f}% menos)")
    print(f"📁 Bloques procesados:  {n_comp} comprimidos | {n_omit} mantenidos sin cambios")
    print(f"💾 Salida guardada en:  {destino}")
    print("=======================================================================")

if __name__ == "__main__":
    main()
