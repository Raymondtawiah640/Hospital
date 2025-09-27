<?php
// ----------------- DEBUG & ERROR -----------------
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
error_log("login.php started");

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
    }
}

// ----------------- DB CONNECTION -----------------
require_once 'db_connect.php';
if (!isset($pdo)) {
    error_log("DEBUG: PDO not set after db_connect.php");
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection missing"]);
    exit;
}

// ----------------- INPUT -----------------
$inputJSON = file_get_contents("php://input");
if ($inputJSON === false) {
    error_log("DEBUG: Failed to read php://input");
}
$input = json_decode($inputJSON, true);
if ($input === null) {
    error_log("DEBUG: JSON decode failed: " . json_last_error_msg());
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid JSON input"]);
    exit;
}

$staff_id   = trim($input['staff_id'] ?? '');
$department = trim($input['department'] ?? '');
$password   = trim($input['password'] ?? '');

if (!$staff_id || !$department || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "⚠️ All fields are required."]);
    exit;
}

// ----------------- AUTH LOGIC -----------------
try {
    $stmt = $pdo->prepare("SELECT staff_id, full_name, department, password FROM staff WHERE staff_id = :staff_id LIMIT 1");
    $stmt->execute([':staff_id' => $staff_id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$staff) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "❌ Invalid Staff ID."]);
        exit;
    }

    // First-time login: password empty
    if (empty($staff['password'])) {
        if (strlen($password) < 8 || strlen($password) > 20) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "⚠️ Password must be 8–20 characters."]);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $update = $pdo->prepare("UPDATE staff SET password = :password, department = :department WHERE staff_id = :staff_id");
        $update->execute([
            ':password' => $hashedPassword,
            ':department' => $department,
            ':staff_id' => $staff_id
        ]);

        $staff['password'] = $hashedPassword;
        $staff['department'] = $department;
    }

    if ($staff['department'] !== $department) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "⚠️ Incorrect department."]);
        exit;
    }

    if (!password_verify($password, $staff['password'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "❌ Invalid password."]);
        exit;
    }

    $_SESSION['staff_id']   = $staff['staff_id'];
    $_SESSION['full_name']  = $staff['full_name'];
    $_SESSION['department'] = $staff['department'];

    echo json_encode(["success" => true, "message" => "✅ Login successful", "staff" => $staff]);

} catch (PDOException $e) {
    error_log("DB ERROR in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
} catch (Exception $e) {
    error_log("GENERAL ERROR in login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "❌ Server error. Please try again later."]);
}
