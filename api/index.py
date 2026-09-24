"""
=============================================================================
Vercel Serverless Function Entrypoint
負責將 FastAPI 伺服器掛載於 Vercel Serverless 環境
=============================================================================
"""

import os
import sys

# 將專案根目錄加入路徑
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from server import app

# Vercel entrypoint
handler = app
