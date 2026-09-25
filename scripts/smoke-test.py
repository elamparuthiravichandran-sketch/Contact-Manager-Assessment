#!/usr/bin/env python3
"""Exercise the running application against its real SQL Server database using only Python's standard library."""
import json
import os
from pathlib import Path
import urllib.error
import urllib.request
import uuid
root = Path(__file__).resolve().parents[1]
config = dict(line.split('=', 1) for line in (root / '.env').read_text().splitlines() if line and not line.startswith('#'))
base = os.environ.get('CONTACTS_URL', 'http://localhost:8080')
token = None

def request(method, path, data=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, method=method, headers=headers,
                                 data=None if data is None else json.dumps(data).encode())
    try:
        response = urllib.request.urlopen(req, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read()
        assert response.status == expected, f'{method} {path}: expected {expected}, got {response.status}; {body.decode()}'
        return json.loads(body) if body else None

request('GET', '/api/contacts', expected=401)
login = request('POST', '/api/auth/login', {'username': config['DEMO_USERNAME'], 'password': config['DEMO_PASSWORD']})
token = login['accessToken']
request('GET', '/api/contacts')
contact = None
try:
    payload = {'firstName': 'Smoke', 'lastName': 'Test', 'email': f'smoke-{uuid.uuid4().hex}@example.com',
               'phoneNumber': '+1 202 555 0199', 'address': '1 Test Road', 'city': 'Test City',
               'state': 'Test State', 'country': 'Test Country', 'postalCode': '00001'}
    invalid = dict(payload, email='invalid')
    request('POST', '/api/contacts', invalid, expected=400)
    contact = request('POST', '/api/contacts', payload, expected=201)
    path = '/api/contacts/' + contact['id']
    assert request('GET', '/api/contacts')[0]['id'] == contact['id']
    old_version = contact['version']
    payload['city'] = 'Updated City'
    contact = request('PUT', path, dict(payload, version=old_version))
    assert request('GET', path)['city'] == 'Updated City'
    request('PUT', path, dict(payload, version=old_version), expected=409)
    request('DELETE', path + '?version=' + old_version, expected=409)
    request('POST', '/api/client-logs', {'event': 'contact-created', 'code': 'smoke-test'}, expected=204)
    request('DELETE', path + '?version=' + contact['version'], expected=204)
    contact = None
    request('GET', path, expected=404)
    print('PASS: authentication, validation, list, create, read, update, stale-write protection, UI logs, delete.')
finally:
    if contact:
        request('DELETE', '/api/contacts/' + contact['id'] + '?version=' + contact['version'], expected=204)
