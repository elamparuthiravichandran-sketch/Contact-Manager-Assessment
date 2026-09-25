#!/usr/bin/env python3
"""Run the API with locally generated .env credentials and a supplied SQL connection."""
import os
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[1]
config = {}
path = root / '.env'
if not path.exists():
    raise SystemExit('Run python scripts/setup.py first.')
for line in path.read_text().splitlines():
    if line.strip() and not line.lstrip().startswith('#'):
        key, value = line.split('=', 1)
        config[key] = value
connection = os.environ.get('ConnectionStrings__Contacts')
if not connection:
    raise SystemExit('Set ConnectionStrings__Contacts to your local SQL Server connection string first. See README.')
env = dict(os.environ, Auth__Username=config['DEMO_USERNAME'], Auth__Password=config['DEMO_PASSWORD'],
           Auth__SigningKey=config['JWT_KEY'], Database__Initialize='true',
           ASPNETCORE_ENVIRONMENT='Development', ASPNETCORE_URLS='http://127.0.0.1:5080')
raise SystemExit(subprocess.call(['dotnet', 'run', '--project', str(root / 'src/Contacts.Api/Contacts.Api.csproj')], env=env, cwd=root))
