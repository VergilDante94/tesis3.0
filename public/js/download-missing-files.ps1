# Script para descargar archivos faltantes
$ErrorActionPreference = "Stop"

# Crear directorios si no existen
$directories = @(
    "public/css/webfonts",
    "public/js",
    "public/css"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creando directorio: $dir"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Definir archivos a descargar
$files = @(
    @{
        url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-solid-900.woff"
        path = "public/css/webfonts/fa-solid-900.woff"
    },
    @{
        url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/webfonts/fa-solid-900.ttf"
        path = "public/css/webfonts/fa-solid-900.ttf"
    },
    @{
        url = "https://cdn.jsdelivr.net/npm/chart.js@3.7.0/dist/chart.umd.js.map"
        path = "public/js/chart.umd.js.map"
    },
    @{
        url = "https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/feather.min.js.map"
        path = "public/js/feather.min.js.map"
    },
    @{
        url = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css.map"
        path = "public/css/bootstrap.min.css.map"
    }
)

# Descargar cada archivo
foreach ($file in $files) {
    if (-not (Test-Path $file.path)) {
        Write-Host "Descargando: $($file.path)"
        try {
            Invoke-WebRequest -Uri $file.url -OutFile $file.path
            Write-Host "Descargado exitosamente: $($file.path)" -ForegroundColor Green
        } catch {
            Write-Host "Error al descargar $($file.path): $_" -ForegroundColor Red
        }
    } else {
        Write-Host "El archivo ya existe: $($file.path)" -ForegroundColor Yellow
    }
}

Write-Host "`nProceso completado!" -ForegroundColor Green
Write-Host "Nota: Los archivos .map son opcionales y solo se usan para depuracion." 