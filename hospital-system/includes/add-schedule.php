<?php
require_once 'db_connect.php'; // Include database connection

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

header('Content-Type: application/json');

// Debugging: Check if the method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method. Requested method: " . $_SERVER['REQUEST_METHOD']]);
    exit;
}

// Read the raw POST data
$inputData = json_decode(file_get_contents('php://input'), true);

// Debugging: Output raw POST data to check if data is being received
if (!$inputData) {
    echo json_encode(["success" => false, "message" => "No data received in the POST request"]);
    exit;
}

// Gather input data from the decoded JSON
$doctorId = isset($inputData['doctorId']) ? $inputData['doctorId'] : '';
$day = isset($inputData['day']) ? $inputData['day'] : '';
$startTime = isset($inputData['startTime']) ? $inputData['startTime'] : '';
$endTime = isset($inputData['endTime']) ? $inputData['endTime'] : '';
$department = isset($inputData['department']) ? $inputData['department'] : '';

// Validate input
if (empty($doctorId) || empty($day) || empty($startTime) || empty($endTime) || empty($department)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

// Insert the schedule into the database
$stmt = $pdo->prepare("INSERT INTO doctor_schedules (doctor_id, day, start_time, end_time, department) 
                       VALUES (:doctorId, :day, :startTime, :endTime, :department)");
$stmt->execute([
    ':doctorId' => $doctorId,
    ':day' => $day,
    ':startTime' => $startTime,
    ':endTime' => $endTime,
    ':department' => $department
]);

// Check if the insertion was successful
if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => true, "message" => "Schedule added successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to add schedule."]);
}
?>
