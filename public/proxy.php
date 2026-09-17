<?php
/**
 * TEOS Sentinel Shield v5.0.0 — Hostinger reverse proxy
 *
 * Lets sentinel.teosegypt.com (static-only shared hosting) serve the API
 * endpoints on the same origin by forwarding them to the Railway backend.
 * Intended to be uploaded to the Hostinger document root:
 *   /home/u461931265/domains/sentinel.teosegypt.com/public_html/proxy.php
 *
 * Security model:
 *   - Whitelisted path prefixes only (no open proxy).
 *   - Auth is NOT stored here: the client's X-API-Key / Authorization header
 *     is forwarded as-is to Railway, which enforces it.
 *   - Only header/body/method passthrough; no secrets in this file.
 *
 * NOTE: /ws (WebSocket) cannot be proxied on shared hosting. Frontends route
 * the live feed to the Railway WebSocket directly (see config.js).
 */

$BACKEND = 'https://teos-sentinel-shield-production-7f0d.up.railway.app';

$ALLOWED_PREFIXES = array(
    'scan',
    'stats',
    'events',
    'health',
    'live',
    'ready',
    'fullreport',
    'ingest',
    'engines',
    'api/rules',
    'api/version',
    'api/audit',
);

function api_not_found() {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(array('error' => 'not_found'));
    exit;
}

function api_error($code, $msg) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(array('error' => $msg));
    exit;
}

$uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '/';
if (strpos($uri, '?') !== false) {
    $uri = substr($uri, 0, strpos($uri, '?'));
}
$path = ltrim($uri, '/');
if ($path === '' || strpos($path, '..') !== false || preg_match('/^https?:/i', $path)) {
    api_not_found();
}

$ok = false;
foreach ($ALLOWED_PREFIXES as $prefix) {
    if ($path === $prefix || strpos($path, $prefix . '/') === 0) {
        $ok = true;
        break;
    }
}
if (!$ok) {
    api_not_found();
}

$target = $BACKEND . '/' . $path;
if (!empty($_SERVER['QUERY_STRING'])) {
    $target .= '?' . $_SERVER['QUERY_STRING'];
}

$headers = array();
if (function_exists('getallheaders')) {
    $pass = array('content-type', 'accept', 'x-api-key', 'authorization');
    foreach (getallheaders() as $name => $value) {
        if (in_array(strtolower($name), $pass, true)) {
            $headers[] = $name . ': ' . $value;
        }
    }
}

$ch = curl_init($target);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 40);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}
$method = strtoupper($_SERVER['REQUEST_METHOD']);
if (in_array($method, array('POST', 'PUT', 'PATCH')) || $method === 'DELETE') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$errno    = curl_errno($ch);
$code     = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if ($response === false || $errno !== 0) {
    api_error(502, 'upstream_unreachable');
}

$split = strpos($response, "\r\n\r\n");
if ($split !== false) {
    $head = substr($response, 0, $split);
    $body = substr($response, $split + 4);
} else {
    $head = '';
    $body = $response;
}

foreach (preg_split('/\r?\n/', $head) as $line) {
    if ($line === '' || strpos($line, ':') === false) {
        continue;
    }
    $name = strtolower(substr($line, 0, strpos($line, ':')));
    if (in_array($name, array('content-type', 'cache-control', 'x-request-id', 'x-ratelimit-limit', 'x-ratelimit-remaining'), true)) {
        header($line);
    }
}

http_response_code($code);
header('Cache-Control: no-store');
echo $body;