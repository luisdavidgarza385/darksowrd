# DarkSword - Web Control Panel

Panel de control remoto para **SPECTRAL X PRO**. Controla todas las funciones desde tu celular o PC a traves del navegador web.

## Live Demo

**https://darksowrd.vercel.app**

## Como funciona

```
CELULAR (Vercel)  <--- WiFi Local --->  PC (server.py)  <--- command.json --->  SPECTRAL X PRO
```

1. El panel web esta alojado en **Vercel** (gratis, siempre online)
2. Cada cliente corre **server.py** en su propia PC
3. Desde el celular abren la web, ponen su IP, y controlan su PC

## Features

- **Aimbot Control** - Aimbot 3s, Ruby, Silent Aim, AI Aimbot, Aim HEX
- **ESP Control** - Linea, Caja, Esqueleto, Vida, Arma, Nombre, Distancia, Radar, etc.
- **Chams** - 19 modos de chams (3D, Glow, Lava, Galaxy, Matrix, Spiderman, etc.)
- **Misc Functions** - Speed Hack, Balas Infinitas, NoClip, Fly Hack, Pull Enemy
- **System** - Stream Mode, FPS Unlock, Bloqueo de Red, Limpieza de Memoria
- **Emergency Kill** - Boton de emergencia para desactivar todo

## Instalacion (para clientes)

### Requisitos
- Python 3.7+ ([descargar](https://www.python.org/downloads/))
- SPECTRAL X PRO corriendo en la PC
- Celular y PC en la misma WiFi

### Pasos

1. **Descargar** los archivos del servidor:
   - Opcion A: `git clone https://github.com/luisdavidgarza385/darksowrd.git`
   - Opcion B: Descargar [darksword.zip](https://github.com/luisdavidgarza385/darksowrd/archive/refs/heads/main.zip)

2. **Instalar dependencias**:
   ```bash
   pip install websocket_server
   ```

3. **Correr el servidor**:
   ```bash
   python server.py
   ```
   O ejecutar `start.bat` (Windows)

4. **Desde el celular**:
   - Abrir **https://darksowrd.vercel.app**
   - Ir a Config (icono gear)
   - Poner la IP que mostro el servidor
   - Puerto: `8080`
   - Guardar Conexion

### Modo Daemon (invisible)

Para correr sin ventana:
```bash
python server.py --daemon
```

### Puerto personalizado

```bash
python server.py --port 9090
```

## Estructura

```
darksword/
  index.html      - Panel de control principal
  style.css       - Estilos dark/neon responsive
  app.js          - Logica WebSocket y controles
  server.py       - Servidor Python local (bridge)
  start.bat       - Script de inicio rapido
  vercel.json     - Config para Vercel
  .vercelignore   - Archivos excluidos de Vercel
  requirements.txt - Dependencias Python
  README.md       - Esta documentacion
```

## Keyboard Shortcuts (Panel Web)

| Tecla | Funcion |
|-------|---------|
| INSERT | Mostrar/Ocultar menu |
| DELETE | Cerrar todo |
| F9 | Aimbot Ruby |
| F10 | Aimbot 3s |
| R | Reset entidades |

## Integracion con C++

Para conectar el panel web con tu programa C++, agregá en tu `main.cpp`:

```cpp
#include "WebControl.hpp"

// En el MainThread despues de la inicializacion:
WebControl::Start();
```

## API Endpoints

El servidor local expone estos endpoints:

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/ping` | GET | Verifica conexion, devuelve IP |
| `/api/state` | GET | Estado actual de todas las funciones |
| `/api/command` | POST | Enviar comando al programa |

## Licencia

MIT
