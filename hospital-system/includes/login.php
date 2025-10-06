<?php
// ----------------- DEBUG & ERROR -----------------
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/apache2/php_errors.log');
error_reporting(E_ALL);

// ----------------- HEADERS -----------------
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ----------------- SESSION -----------------
if (session_status() === PHP_SESSION_NONE) {
    if (!session_start()) {
        error_log("DEBUG: Failed to start session");
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "❌ Failed to start session."]);
        exit;
    }
}

// ----------------- DB CONNECTION -----------------
require_once 'db_connect.php';
if (!isset($pdo)) {
    error_log("DEBUG: PDO not set after db_connect.php");
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Database connection missing."]);
    exit;
}

// ----------------- INPUT -----------------
$inputJSON = file_get_contents("php://input");
if ($inputJSON === false) {
    error_log("DEBUG: Failed to read php://input");
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "❌ Failed to read request data."]);
    exit;
}

$input = json_decode($inputJSON, true);
if ($input === null) {
    error_log("DEBUG: JSON decode failed: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "❌ Invalid JSON input."]);
    exit;
}

$staff_id   = trim($input['staff_id'] ?? '');
$department = trim($input['department'] ?? '');
$password   = trim($input['password'] ?? '');

// Check if required fields are empty
if (!$staff_id || !$department || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "⚠️ All fields are required."]);
    exit;
}

// ----------------- AUTH LOGIC -----------------
try {
    // Check if staff exists in database
    $stmt = $pdo->prepare("SELECT staff_id, full_name, department, password FROM staff WHERE staff_id = :staff_id LIMIT 1");
    $stmt->execute([':staff_id' => $staff_id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    // Handle case where staff ID doesn't exist
    if (!$staff) {
        error_log("DEBUG: Staff ID not found: $staff_id");
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "❌ Invalid Staff ID."]);
        exit;
    }

    // Check if the provided department matches the one in the database
    $allowedDepartments = ["administration", "nursing", "Surgery", "Pharmacy", "Pediatrics"];

    if (!in_array(strtolower($staff['department']), $allowedDepartments)) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "⛔ Access denied. Your department is not authorized."
        ]);
        exit;
    }


    // Verify the provided password against the hashed one
    if (!password_verify($password, $staff['password'])) {
        error_log("DEBUG: Invalid password attempt for staff_id: $staff_id");
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "❌ Invalid password."]);
        exit;
    }

    // Successful login: Set session variables
    $_SESSION['staff_id']   = $staff['staff_id'];
    $_SESSION['full_name']  = $staff['full_name'];
    $_SESSION['department'] = $staff['department'];

    echo json_encode(["success" => true, "message" => "✅ Login successful", "staff" => $staff]);

} catch (PDOException $e) {
    // Handle database errors
    error_log("DB ERROR in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
} catch (Exception $e) {
    // Handle general errors
    error_log("GENERAL ERROR in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
}
