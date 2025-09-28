<?php
require_once 'db_connect.php'; // Include database connection

header('Content-Type: application/json');

// Check for POST request to add a new schedule
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Gather input data
    $doctorName = isset($_POST['doctorName']) ? $_POST['doctorName'] : '';  // Change to doctorName
    $day = isset($_POST['day']) ? $_POST['day'] : '';
    $startTime = isset($_POST['startTime']) ? $_POST['startTime'] : '';
    $endTime = isset($_POST['endTime']) ? $_POST['endTime'] : '';
    $department = isset($_POST['department']) ? $_POST['department'] : '';

    // Validate input
    if (empty($doctorName) || empty($day) || empty($startTime) || empty($endTime) || empty($department)) {
        echo json_encode(["success" => false, "message" => "All fields are required."]);
        exit;
    }

    // Fetch doctor information by name
    $doctorStmt = $pdo->prepare("SELECT * FROM doctors WHERE CONCAT(first_name, ' ', last_name) = :doctorName");
    $doctorStmt->execute([':doctorName' => $doctorName]);
    $doctor = $doctorStmt->fetch(PDO::FETCH_ASSOC);

    if (!$doctor) {
        echo json_encode(["success" => false, "message" => "Doctor not found."]);
        exit;
    }

    // Insert the schedule into the database
    $stmt = $pdo->prepare("INSERT INTO doctor_schedules (doctor_id, day, start_time, end_time, department) 
                           VALUES (:doctorId, :day, :startTime, :endTime, :department)");
    $stmt->execute([
        ':doctorId' => $doctor['id'],  // Use the doctor's ID from the fetched record
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
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>
