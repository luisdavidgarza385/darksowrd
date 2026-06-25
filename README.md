# DarkSword - Web Control Panel

Panel de control remoto para **SPECTRAL X PRO**. Controla todas las funciones desde tu celular o PC a través del navegador web.

## Features

- **Aimbot Control** - Aimbot 3s, Ruby, Silent Aim, AI Aimbot, Aim HEX
- **ESP Control** - Línea, Caja, Esqueleto, Vida, Arma, Nombre, Distancia, Radar, etc.
- **Chams** - 19 modos de chams (3D, Glow, Lava, Galaxy, Matrix, Spiderman, etc.)
- **Misc Functions** - Speed Hack, Balas Infinitas, NoClip, Fly Hack, Pull Enemy
- **System** - Stream Mode, FPS Unlock, Bloqueo de Red, Limpieza de Memoria
- **Emergency Kill** - Botón de emergencia para desactivar todo

## Requisitos

- Python 3.7+
- Navegador web (Chrome, Safari, Firefox)
- Mismo WiFi en PC y celular

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/luisdavidgarza385/darksowrd.git
cd darksword

# Instalar dependencias
pip install -r requirements.txt

# Iniciar el servidor
python server.py
```

O simplemente ejecuta `start.bat` en Windows.

## Uso

1. Ejecuta `start.bat` o `python server.py` en tu PC
2. Desde tu celular, abrí el navegador y entrá a `http://IP-DE-TU-PC:8080`
3. Para saber tu IP, el servidor la muestra al iniciar

### Obtener tu IP

```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
```

Buscá la dirección IPv4 (ej: `192.168.1.105`)

## Integración con C++

Para conectar el panel web con tu programa C++, agregá en tu `main.cpp`:

```cpp
#include "WebControl.hpp"

// En el MainThread después de la inicialización:
WebControl::Start();
```

## Estructura

```
web_control/
  index.html    - Panel de control principal
  style.css     - Estilos dark/neon
  app.js        - Lógica WebSocket y controles
  server.py     - Servidor Python (bridge)
  start.bat     - Script de inicio rápido
  requirements.txt - Dependencias
```

## Configuración

El servidor corre por defecto en:
- **HTTP:** `127.0.0.1:8080`
- **WebSocket:** `127.0.0.1:8081`

Para cambiar el puerto o IP:

```bash
python server.py --port 9090 --ip 0.0.0.0
```

## Atajos de Teclado (Panel Web)

| Tecla | Función |
|-------|---------|
| INSERT | Mostrar/Ocultar menú |
| DELETE | Cerrar todo |
| F9 | Aimbot Ruby |
| F10 | Aimbot 3s |
| R | Reset entidades |

## Licencia

MIT
