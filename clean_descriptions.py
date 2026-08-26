"""Thin shim for the canonical Asia Stays description cleaner.

Always executes clean_run.py as a fresh __main__ so macOS never serves a stale
.pyc cache of this module (the original bug: editing clean_descriptions.py and
re-running it loaded OLD bytecode, so DB got "almost clean" rows). Use
clean_run.py directly; this shim exists only so old muscle-memory invocations
stay correct.

Run:  python3 clean_descriptions.py          # DRY
      WRITE=1 python3 clean_descriptions.py  # PATCH Supabase
"""
import os
import sys
import runpy

HERE = os.path.dirname(os.path.abspath(__file__))
target = os.path.join(HERE, 'clean_run.py')
sys.argv = [target] + sys.argv[1:]
runpy.run_path(target, run_name='__main__')
