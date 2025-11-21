<?php
header('Content-Type: application/json; charset=utf-8');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['name', 'email', 'message'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Campo obrigatório: $field"]);
        exit();
    }
}

// Sanitize inputs
$name = htmlspecialchars(trim($input['name']), ENT_QUOTES, 'UTF-8');
$email = filter_var(trim($input['email']), FILTER_VALIDATE_EMAIL);
$company = !empty($input['company']) ? htmlspecialchars(trim($input['company']), ENT_QUOTES, 'UTF-8') : 'Não informado';
$projectType = !empty($input['project_type']) ? htmlspecialchars(trim($input['project_type']), ENT_QUOTES, 'UTF-8') : 'Não especificado';
$budget = !empty($input['budget']) ? htmlspecialchars(trim($input['budget']), ENT_QUOTES, 'UTF-8') : 'Não especificado';
$message = htmlspecialchars(trim($input['message']), ENT_QUOTES, 'UTF-8');

if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit();
}

// Format WhatsApp message
$whatsappMessage = "📧 *NOVO CONTATO DO SITE*\n\n";
$whatsappMessage .= "👤 *Nome:* $name\n";
$whatsappMessage .= "📧 *Email:* $email\n";
$whatsappMessage .= "🏢 *Empresa:* $company\n";
$whatsappMessage .= "💼 *Tipo de Projeto:* $projectType\n";
$whatsappMessage .= "💰 *Orçamento:* $budget\n\n";
$whatsappMessage .= "💬 *Mensagem:*\n$message\n\n";
$whatsappMessage .= "---\n";
$whatsappMessage .= "🕐 " . date('d/m/Y H:i:s');

// uazapi configuration - Load from environment or config file
// For security, API tokens should NEVER be hardcoded
// Option 1: Use environment variables (recommended)
$instanceToken = getenv('UAZAPI_TOKEN') ?: 'a19b4636-9ec4-4cd0-acf1-d865a517a2f4';
$recipientNumber = getenv('RECIPIENT_WHATSAPP') ?: '5581996733973';

// Option 2: Load from a config file outside web root
// include_once(__DIR__ . '/../config/whatsapp.php');

$uazapiUrl = 'https://mgm.uazapi.com/send/text';

// Prepare uazapi request
$uazapiPayload = [
    'number' => $recipientNumber,
    'text' => $whatsappMessage
];

// Send to uazapi
$ch = curl_init($uazapiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $instanceToken
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($uazapiPayload));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Check if request was successful
if ($error || $httpCode !== 200) {
    // Log error (in production, use proper logging)
    error_log("uazapi error: $error | HTTP Code: $httpCode | Response: $response");

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao enviar mensagem. Tente novamente ou entre em contato diretamente pelo WhatsApp.'
    ]);
    exit();
}

// Success
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Mensagem enviada com sucesso! Entrarei em contato em breve.'
]);
