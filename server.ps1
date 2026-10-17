$port = 8757
$root = "C:\Organic-chemistry"
$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".json" = "application/json"
}
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Serving $root at http://127.0.0.1:$port/"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart("/")
    if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
    $full = [IO.Path]::Combine($root, $path)
    $fullFull = [IO.Path]::GetFullPath($full)
    if (-not $fullFull.StartsWith($root)) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }
    if (Test-Path $fullFull -PathType Leaf) {
      $bytes = [IO.File]::ReadAllBytes($fullFull)
      $ext = [IO.Path]::GetExtension($fullFull).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch { try { $ctx.Response.StatusCode = 500 } catch {} }
  try { $ctx.Response.Close() } catch {}
}
