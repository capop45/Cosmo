# Comprime os videos de Fotos/ em versoes web (<base>_web.mp4, H.264 + AAC).
# Sao essas versoes que o site exibe e que vao para o GitHub (os originais
# continuam ignorados pelo .gitignore). Limita o lado menor a 720px e usa
# faststart para streaming progressivo no navegador.
#
# Uso: powershell -File scripts\compress-videos-web.ps1 [-FfmpegPath caminho\ffmpeg.exe]

param(
    [string]$FfmpegPath = "ffmpeg",
    [string]$FotosDir = (Join-Path $PSScriptRoot "..\Fotos"),
    [int]$Crf = 23
)

$ErrorActionPreference = "Stop"
$FotosDir = (Resolve-Path $FotosDir).Path

# escala mantendo proporcao, limitando o lado menor a 720px (nunca amplia)
$scale = "scale='trunc(iw*min(1\,720/min(iw\,ih))/2)*2':'trunc(ih*min(1\,720/min(iw\,ih))/2)*2'"

$videos = Get-ChildItem $FotosDir |
    Where-Object { $_.Extension -match '^\.(mp4|mov)$' -and $_.BaseName -notmatch '_web$' } |
    Sort-Object Length

foreach ($v in $videos) {
    $out = Join-Path $FotosDir ($v.BaseName + "_web.mp4")
    & $FfmpegPath -hide_banner -loglevel error -y -i $v.FullName -map 0:v:0 -map "0:a?" `
        -vf $scale -c:v libx264 -crf $Crf -preset slow -pix_fmt yuv420p `
        -c:a aac -b:a 128k -movflags +faststart $out
    if ($LASTEXITCODE -ne 0) {
        Write-Output "ERRO: $($v.Name)"
        continue
    }
    $mb = [math]::Round((Get-Item $out).Length / 1MB, 1)
    Write-Output "OK  $($v.Name) -> $([System.IO.Path]::GetFileName($out)) ($mb MB)"
}

Write-Output "--- Compressao concluida ---"
