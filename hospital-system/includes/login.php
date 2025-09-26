<?php
// Show errors for debugging (remove on production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Always return JSON
header("Content-Type: application/json; charset=UTF-8");

// Allow CORS from all origins (Modify for production to restrict origins)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Start session
session_start();

// Secure PDO connection (adjust credentials accordingly)
try {
    $dsn = "mysql:host=localhost;dbname=your_database;charset=utf8mb4";
    $username = "your_username";
    $password = "your_password";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $e->getMessage()]);
    exit;
}

// Read JSON payload from Angular POST
$data = json_decode(file_get_contents("php://input"), true);

// Sanitize & validate input
$staff_id   = trim($data['staff_id'] ?? '');
$department = trim($data['department'] ?? '');
$password   = trim($data['password'] ?? '');

$response = ["success" => false, "message" => ""];

if (!$staff_id || !$department || !$password) {
    http_response_code(400);
    $response['message'] = "⚠️ All fields are required.";
    echo json_encode($response);
    exit;
}

try {
    // Fetch staff record by staff_id
    $stmt = $pdo->prepare("SELECT * FROM staff WHERE staff_id = :staff_id LIMIT 1");
    $stmt->execute([':staff_id' => $staff_id]);
    $staff = $stmt->fetch();

    if (!$staff) {
        http_response_code(401);
        $response['message'] = "❌ Invalid Staff ID.";
    } elseif ($staff['department'] !== $department) {
        http_response_code(401);
        $response['message'] = "⚠️ Incorrect department.";
    } elseif (!password_verify($password, $staff['password'])) {
        http_response_code(401);
        $response['message'] = "❌ Invalid password.";
    } else {
        // Successful login: set session variables
        $_SESSION['staff_id'] = $staff['staff_id'];
        $_SESSION['full_name'] = $staff['full_name'];
        $_SESSION['department'] = $staff['department'];

        $response = [
            'success' => true,
            'message' => "✅ Login successful.",
            'staff' => [
                'staff_id'   => $staff['staff_id'],
                'full_name'  => $staff['full_name'],
                'department' => $staff['department']
            ]
        ];
    }
} catch (PDOException $e) {
    http_response_code(500);
    $response['message'] = "❌ Server error: " . $e->getMessage();
}

echo json_encode($response);
