from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
app=FastAPI(title="Sevensa Installer",version="1.0")
app.mount("/static", StaticFiles(directory="./static"), name="static")
tpl=Jinja2Templates(directory="installer/templates")
def compose(agency_domain, wpcs_domain, n8n_user, n8n_pass):
  return f'''version: "3.9"
services:
  proxy:
    image: nginx:latest
    restart: unless-stopped
    ports: ["80:80"]
    volumes: [ "./nginx.conf:/etc/nginx/conf.d/default.conf:ro" ]
    depends_on: [agency,wpcs,n8n,mcp,installer]
  agency:
    image: python:3.11-slim
    working_dir: /app/agency
    command: bash -lc "pip install -r /app/agency/requirements.txt && uvicorn api.main:app --host 0.0.0.0 --port 8081"
    volumes: [ "./agency:/app/agency", "./core:/app/core" ]
  wpcs:
    image: python:3.11-slim
    working_dir: /app/wpcs
    command: bash -lc "pip install -r /app/wpcs/requirements.txt && uvicorn backend.main:app --host 0.0.0.0 --port 8082"
    volumes: [ "./wpcs:/app/wpcs", "./core:/app/core" ]
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER={n8n_user}
      - N8N_BASIC_AUTH_PASSWORD={n8n_pass}
      - N8N_HOST={agency_domain}
      - N8N_PROTOCOL=https
    ports: ["5678:5678"]
    volumes: [ "./n8n/flows:/data/flows" ]
  mcp:
    image: python:3.11-slim
    working_dir: /app
    command: bash -lc "pip install fastapi uvicorn pyyaml && uvicorn mcp.server:app --host 0.0.0.0 --port 8787"
    volumes: [ "./mcp:/app/mcp", "./core:/app/core", "./mcp/policy:/app/mcp/policy:ro", "/opt/data:/opt/data:ro", "/var/www:/var/www:ro", "/opt/repos/default:/opt/repos/default:ro" ]
  redis:
    image: redis:alpine
  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
  installer:
    image: python:3.11-slim
    working_dir: /app
    command: bash -lc "pip install -r installer/requirements.txt && uvicorn installer.server:app --host 0.0.0.0 --port 8089"
    volumes: [ "./installer:/app/installer", "./core:/app/core" ]
    ports: ["8089:8089"]
'''
@app.get("/setup", response_class=HTMLResponse)
def idx(r: Request):
  return tpl.TemplateResponse("index.html", {"request": r})
@app.post("/setup", response_class=HTMLResponse)
def do(r: Request, agency_domain: str=Form("agency.sevensa.nl"), wpcs_domain: str=Form("wpcs.sevensa.nl"), n8n_user: str=Form("admin"), n8n_pass: str=Form("changeme")):
  c=compose(agency_domain, wpcs_domain, n8n_user, n8n_pass)
  os.makedirs("generated", exist_ok=True)
  open("generated/docker-compose.override.yml","w",encoding="utf-8").write(c)
  return tpl.TemplateResponse("done.html", {"request": r, "compose": c})
