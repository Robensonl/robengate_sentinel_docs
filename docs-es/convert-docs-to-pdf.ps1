# convert-docs-to-pdf.ps1
$source = ".\docs-es"
$destination = ".\docs-es-pdfs"

# Eliminar carpeta de destino si ya existe (para limpiar)
if (Test-Path $destination) {
    Remove-Item -Recurse -Force $destination
}
New-Item -ItemType Directory -Force -Path $destination | Out-Null

# Obtener todos los archivos .md recursivamente
$mdFiles = Get-ChildItem -Path $source -Recurse -Filter *.md

foreach ($md in $mdFiles) {
    # Ruta relativa desde docs-es (ej: "project-inventory/system-overview.md")
    $relativePath = $md.FullName.Substring((Get-Location).Path.Length + $source.Length + 1)
    # Ruta del PDF de salida (cambiamos extensión a .pdf)
    $pdfPath = Join-Path $destination ($relativePath -replace '\.md$', '.pdf')
    
    # Crear subcarpeta de destino si no existe
    $pdfDir = Split-Path $pdfPath -Parent
    if (-not (Test-Path $pdfDir)) {
        New-Item -ItemType Directory -Force -Path $pdfDir | Out-Null
    }
    
    Write-Host "Convirtiendo: $relativePath" -ForegroundColor Cyan
    # Ejecutar md-to-pdf
    npx md-to-pdf "$($md.FullName)" --output-file "$pdfPath"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Generado: $pdfPath" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Error en: $md" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Conversión completada. Revisa la carpeta: $destination" -ForegroundColor Yellow