<?php
session_start();
require 'includes/db_connect.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow your Angular app domain if needed
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$data = json_decode(file_get_contents("php://input"), true);

$staff_id   = trim($data['staff_id'] ?? '');
$department = trim($data['department'] ?? '');
$password   = trim($data['password'] ?? '');

$response = ["success" => false, "message" => "", "staff" => null];

if ($staff_id && $department && $password) {
    $check = $pdo->prepare("SELECT * FROM staff WHERE staff_id = :staff_id LIMIT 1");
    $check->execute([':staff_id' => $staff_id]);
    $staff = $check->fetch(PDO::FETCH_ASSOC);

    if (!$staff) {
        $response['message'] = "❌ Invalid Staff ID";
    } elseif ($staff['department'] !== $department) {
        $response['message'] = "⚠️ Incorrect department";
    } elseif (password_verify($password, $staff['password'])) {
        $_SESSION['staff_id']   = $staff['staff_id'];
        $_SESSION['full_name']  = $staff['full_name'];
        $_SESSION['department'] = $staff['department'];

        $response['success'] = true;
        $response['message'] = "✅ Login successful";

        // Include staff info in response for Angular
        $response['staff'] = [
            'staff_id'   => $staff['staff_id'],
            'full_name'  => $staff['full_name'],
            'department' => $staff['department']
        ];
    } else {
        $response['message'] = "❌ Invalid password";
    }
} else {
    $response['message'] = "⚠️ All fields are required";
}

echo json_encode($response);
