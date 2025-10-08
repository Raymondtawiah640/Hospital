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

// ----------------- CHECK LOCKOUT -----------------
$attemptData = null;
try {
    $lockoutCheckStmt = $pdo->prepare("SELECT attempts, lockout_until FROM login_attempts WHERE staff_id = ?");
    $lockoutCheckStmt->execute([$staff_id]);
    $attemptData = $lockoutCheckStmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Table may not exist, skip lockout
    error_log("DEBUG: login_attempts table not found, skipping lockout: " . $e->getMessage());
}

$currentTime = time();
if ($attemptData && $attemptData['lockout_until'] > $currentTime) {
    $remainingTime = $attemptData['lockout_until'] - $currentTime;
    $minutes = ceil($remainingTime / 60);
    http_response_code(429); // Too Many Requests
    echo json_encode([
        "success" => false,
        "message" => "❌ Too many failed attempts. Try again in $minutes minute(s).",
        "lockout" => true,
        "remainingTime" => $remainingTime
    ]);
    exit;
}

// ----------------- AUTH LOGIC -----------------
try {
    // Check if staff exists in database
    $stmt = $pdo->prepare("SELECT staff_id, full_name, department, password FROM staff WHERE staff_id = :staff_id LIMIT 1");
    $stmt->execute([':staff_id' => $staff_id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    $isValid = true;
    $errorMessage = '';

    // Handle case where staff ID doesn't exist
    if (!$staff) {
        $isValid = false;
        $errorMessage = "❌ Invalid Staff ID.";
    } elseif (strtolower($department) !== strtolower($staff['department'])) {
        $isValid = false;
        $errorMessage = "❌ Department does not match the staff record.";
    } elseif (!in_array(strtolower($staff['department']), ["administration", "nursing", "surgery", "pharmacy", "pediatrics", "laboratory", "finance"])) {
        $isValid = false;
        $errorMessage = "⛔ Access denied. Your department is not authorized.";
    } elseif (!empty($staff['password']) && !password_verify($password, $staff['password'])) {
        $isValid = false;
        $errorMessage = "❌ Invalid password.";
    }

    if (!$isValid) {
        // Increment attempts
        try {
            $attempts = ($attemptData ? $attemptData['attempts'] : 0) + 1;
            $lockoutUntil = 0;
            if ($attempts >= 3) {
                $lockoutMinutes = 5 + (($attempts - 3) * 5); // 5 min for 3rd, 10 for 4th, etc.
                $lockoutUntil = $currentTime + ($lockoutMinutes * 60);
            }
            if ($attemptData) {
                $updateStmt = $pdo->prepare("UPDATE login_attempts SET attempts = ?, lockout_until = ? WHERE staff_id = ?");
                $updateStmt->execute([$attempts, $lockoutUntil, $staff_id]);
            } else {
                $insertStmt = $pdo->prepare("INSERT INTO login_attempts (staff_id, attempts, lockout_until) VALUES (?, ?, ?)");
                $insertStmt->execute([$staff_id, $attempts, $lockoutUntil]);
            }
        } catch (PDOException $e) {
            // If table doesn't exist, just log
            error_log("DEBUG: Could not update login_attempts: " . $e->getMessage());
        }
        http_response_code(401);
        echo json_encode(["success" => false, "message" => $errorMessage]);
        exit;
    }

    // Successful login: reset attempts
    try {
        $resetStmt = $pdo->prepare("DELETE FROM login_attempts WHERE staff_id = ?");
        $resetStmt->execute([$staff_id]);
    } catch (PDOException $e) {
        // If table doesn't exist, skip
    }

    // Handle password: if empty in DB, accept any password and hash it
    if (empty($staff['password'])) {
        // First login, hash the provided password and update DB
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $updateStmt = $pdo->prepare("UPDATE staff SET password = ? WHERE staff_id = ?");
        $updateStmt->execute([$hashedPassword, $staff_id]);
        $staff['password'] = $hashedPassword; // Update for session
    }

    // Set session variables
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
