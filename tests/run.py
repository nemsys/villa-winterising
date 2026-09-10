#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Пуска трите набора срещу index.html.  Употреба: python3 tests/run.py

logic.js   — чистата логика (наредба, редакции, времена), в node
dom.js     — интерфейсът, в headless Chrome
restart.js — оцеляват ли промените затваряне на браузъра

Харнесът реже index.html, за да не дублира кода: BASE и функциите се
вземат от самия файл, тестовете виждат точно това, което върви на живо.
"""
import io, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, "tests")
PAGE = os.path.join(ROOT, "index.html")
CHROME = next((c for c in ("google-chrome", "google-chrome-stable", "chromium")
               if shutil.which(c)), None)


def slice_js(src, a, b):
    return src[src.index(a):src.index(b)]


def read(p):
    return io.open(p, encoding="utf-8").read()


def run_logic(js, tmp):
    harness = (slice_js(js, "  var BASE = {", "  var app = document.getElementById")
               + slice_js(js, '  var DAYS = ["thu"', "  function rowEl(")
               + slice_js(js, "  function migrate(old)", "  function load()")
               + read(os.path.join(T, "logic.js")))
    f = os.path.join(tmp, "logic_harness.js")
    io.open(f, "w", encoding="utf-8").write(harness)
    r = subprocess.run(["node", f], capture_output=True, text=True)
    return r.returncode == 0, (r.stdout + r.stderr).strip()


def run_browser(page_src, script_path, tmp, profile=False, runs=1):
    if not CHROME:
        return None, "няма Chrome — прескочено"
    f = os.path.join(tmp, os.path.basename(script_path) + ".html")
    io.open(f, "w", encoding="utf-8").write(
        page_src.replace("</body>", read(script_path) + "\n</body>", 1))
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
           "--virtual-time-budget=6000", "--dump-dom", "file://" + f]
    if profile:
        prof = os.path.join(tmp, "prof")
        cmd[4:4] = ["--user-data-dir=" + prof, "--allow-file-access-from-files"]
    out = ""
    for _ in range(runs):
        out = subprocess.run(cmd, capture_output=True, text=True).stdout
    m = re.search(r"<title>([^<]*)</title>", out)
    if not m:
        return False, "браузърът не върна резултат"
    lines = [l for l in m.group(1).split("|")[1:] if l.strip()]
    bad = [l for l in lines if l.startswith("ПАДНА")]
    return not bad, "\n".join(("  " + l) for l in (bad or lines))


def main():
    src = read(PAGE)
    js = re.search(r"<script>(.*)</script>", src, re.S).group(1)
    tmp = tempfile.mkdtemp(prefix="zaz-tests-")
    fails = 0
    try:
        for name, fn in (
            ("логика (node)", lambda: run_logic(js, tmp)),
            ("интерфейс (Chrome)", lambda: run_browser(src, os.path.join(T, "dom.js"), tmp)),
            ("рестарт на браузъра", lambda: run_browser(src, os.path.join(T, "restart.js"), tmp,
                                                        profile=True, runs=2)),
        ):
            ok, msg = fn()
            mark = "прескочено" if ok is None else ("ОК" if ok else "ПАДНА")
            print("== %-22s %s" % (name, mark))
            if msg:
                print(msg if ok else msg)
            if ok is False:
                fails += 1
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    if fails:
        print("\n%d набор(а) паднаха" % fails)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
