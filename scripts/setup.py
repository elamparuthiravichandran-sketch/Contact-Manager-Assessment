#!/usr/bin/env python3
"""Generate local demo configuration without embedding credentials in source control."""
from pathlib import Path
import secrets
root = Path(__file__).resolve().parents[1]
path = root / '.env'
if path.exists():
    raise SystemExit('.env already exists; keeping existing credentials. Read it for your login.')
password = 'Demo9!' + secrets.token_hex(10)
path.write_text('DB_PASSWORD=Sql9!' + secrets.token_hex(16) + '\nDEMO_USERNAME=reviewer\nDEMO_PASSWORD=' + password + '\nJWT_KEY=' + secrets.token_hex(32) + '\n')
try:
    path.chmod(0o600)
except OSError:
    pass
print('Configuration created in .env (keep this file private).')
print('Username: reviewer')
print('Password: ' + password)
print('Next: docker compose up --build -d')
print('Then open http://localhost:8080')
