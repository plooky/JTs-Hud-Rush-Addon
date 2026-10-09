param([switch]$Install)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    & node --test assignments.test.mjs model.test.mjs motion.test.mjs radar.test.mjs theme.test.mjs view.test.mjs
    if ($LASTEXITCODE -ne 0) { throw 'HUD tests failed.' }
    & node --check app.mjs
    if ($LASTEXITCODE -ne 0) { throw 'HUD syntax check failed.' }
    $outputDirectory = Join-Path $PSScriptRoot 'dist'
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    $version = (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'hud.json') -Raw | ConvertFrom-Json).version
    $archive = Join-Path $outputDirectory 'rush-hud.zip'
    Compress-Archive -Path index.html,hud.json,panel.json,images.json,app.mjs,assignments.mjs,model.mjs,motion.mjs,radar.mjs,theme.mjs,view.mjs,style.css,preview.mjs,assets,README.md,FEATURE-PARITY.md,LICENSE -DestinationPath $archive -Force
    $compiler = @(
        (Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe')
        (Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe')
    ) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $compiler) { throw '.NET Framework C# compiler not found.' }
    $installer = Join-Path $outputDirectory "RUSH-Live-for-JT-Hud-v$version-Setup.exe"
    & $compiler /nologo /target:winexe /platform:anycpu /optimize+ "/out:$installer" "/resource:$archive,RushHud.zip" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll (Join-Path $PSScriptRoot 'installer\RushHudInstaller.cs')
    if ($LASTEXITCODE -ne 0) { throw 'Installer compilation failed.' }

    $testRoot = Join-Path $outputDirectory ("rush-hud-installer-test-" + [Guid]::NewGuid().ToString('N'))
    $testTarget = Join-Path $testRoot 'rush-hud'
    $testLog = Join-Path $testRoot 'installer.log'
    try {
        New-Item -ItemType Directory -Path (Join-Path $testTarget 'assets\custom') -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $testTarget 'assets\custom\keep.txt') -Value 'preserve' -Encoding ascii
        Set-Content -LiteralPath (Join-Path $testTarget 'images.json') -Value '{"test":"preserve"}' -Encoding ascii
        Set-Content -LiteralPath (Join-Path $testTarget 'stale.txt') -Value 'remove' -Encoding ascii
        $installerProcess = Start-Process -FilePath $installer -ArgumentList @('/quiet', "/target=$testTarget", "/log=$testLog") -Wait -PassThru
        if ($installerProcess.ExitCode -ne 0) {
            $details = if (Test-Path -LiteralPath $testLog) { Get-Content -LiteralPath $testLog -Raw } else { 'No installer log was written.' }
            throw "Installer self-test failed with exit code $($installerProcess.ExitCode).`n$details"
        }
        if (-not (Test-Path -LiteralPath (Join-Path $testTarget 'hud.json'))) { throw 'Installer self-test did not install hud.json.' }
        if ((Get-Content -LiteralPath (Join-Path $testTarget 'assets\custom\keep.txt') -Raw).Trim() -ne 'preserve') { throw 'Installer self-test did not preserve assets/custom.' }
        if ((Get-Content -LiteralPath (Join-Path $testTarget 'images.json') -Raw).Trim() -ne '{"test":"preserve"}') { throw 'Installer self-test did not preserve images.json.' }
        if (Test-Path -LiteralPath (Join-Path $testTarget 'stale.txt')) { throw 'Installer self-test did not replace the old HUD.' }
        if (-not (Get-ChildItem -LiteralPath $testRoot -Directory | Where-Object Name -Like 'rush-hud.backup-*')) { throw 'Installer self-test did not create a backup.' }
    } finally {
        if (Test-Path -LiteralPath $testRoot) { Remove-Item -LiteralPath $testRoot -Recurse -Force }
    }

    $archiveHash = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
    $installerHash = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath (Join-Path $outputDirectory 'SHA256SUMS.txt') -Value @(
        "$archiveHash  rush-hud.zip"
        "$installerHash  $(Split-Path -Leaf $installer)"
    ) -Encoding ascii
    Write-Output "Package: $archive"
    Write-Output "Installer: $installer"
    if ($Install) {
        if ($PSVersionTable.PSVersion.Major -lt 7) { throw 'Use pwsh (PowerShell 7) for -Install.' }
        Invoke-RestMethod -Uri 'http://localhost:1349/api/huds/upload-zip' -Method Post -Form @{ hud = Get-Item $archive }
    }
} finally {
    Pop-Location
}
