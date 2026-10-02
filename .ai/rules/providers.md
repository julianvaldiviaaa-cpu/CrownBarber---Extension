---
paths:
  - 'app/Providers/**'
---

# Providers

## Carpeta temporal de las subidas en Windows
Conservar TEMP, TMP y TMPDIR en ServeCommand::$passthroughVariables desde AppServiceProvider. Artisan serve filtra esas variables cuando recarga .env; PHP cae en C:\Windows y las cargas fallan antes de validar. Cambiar el provider requiere reiniciar el proceso padre del servidor de desarrollo.
