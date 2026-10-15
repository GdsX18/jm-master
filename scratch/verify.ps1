$patterns = 'onClick=','onChange=','onSubmit=','onBlur=','useState','useEffect','useMemo','useCallback','useRef','fetch(','supabase','href=','router.','localStorage','permissionForPath','canAccess','disabled='
$files = Get-ChildItem src\app\painel -Recurse -Include *.tsx,*.ts
$out = @{}
foreach ($f in $files) { 
    $txt = Get-Content $f.FullName -Raw
    $row = @{}
    foreach ($p in $patterns) { 
        $row[$p] = ([regex]::Matches($txt, [regex]::Escape($p))).Count 
    }
    $rel = $f.FullName.Substring((Get-Location).Path.Length + 1)
    $out[$rel] = $row 
}
$out | ConvertTo-Json -Depth 4 | Set-Content scratch\after.json

$base = Get-Content scratch\baseline.json -Raw | ConvertFrom-Json
$after = Get-Content scratch\after.json -Raw | ConvertFrom-Json

$diffFound = $false
foreach ($prop in $base.PSObject.Properties) {
    $file = $prop.Name
    $baseRow = $prop.Value
    $afterRow = $after.$file
    if (-not $afterRow) {
        Write-Host "ARQUIVO REMOVIDO OU RENOMEADO: $file" -ForegroundColor Red
        $diffFound = $true
        continue
    }
    foreach ($pProp in $baseRow.PSObject.Properties) {
        $pName = $pProp.Name
        $bCount = $pProp.Value
        $aCount = $afterRow.$pName
        if ($bCount -ne $aCount) {
            Write-Host "DIFERENÇA DETECTADA em $file [$pName]: Antes=$bCount, Depois=$aCount" -ForegroundColor Red
            $diffFound = $true
        }
    }
}
if (-not $diffFound) {
    Write-Host "VERIFICAÇÃO BEM-SUCEDIDA: Contadores de lógica 100% idênticos!" -ForegroundColor Green
} else {
    Write-Host "ALERTA: Diferenças encontradas!" -ForegroundColor Red
    exit 1
}
