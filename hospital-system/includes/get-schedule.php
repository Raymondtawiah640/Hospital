<?php
require_once 'db_connect.php'; // Include database connection

header('Content-Type: application/json');

// Initialize the response array to ensure proper JSON format
$response = [
    "success" => false,
    "message" => "An unexpected error occurred"
];

try {
    // Fetch schedules with associated doctor names
    $stmt = $pdo->prepare("
        SELECT ds.id, ds.day, ds.start_time, ds.end_time, ds.department, 
               d.first_name, d.last_name 
        FROM doctor_schedules ds
        JOIN doctors d ON ds.doctor_id = d.id
    ");
    $stmt->execute();

    // Fetch all the schedule records
    $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if we have schedules to return
    if ($schedules) {
        $response["success"] = true;
        $response["schedules"] = $schedules;
    } else {
        $response["message"] = "No schedules found.";
    }
} catch (PDOException $e) {
    // If there's an error with the database query, log it and return a user-friendly message
    $response["message"] = "Database error: " . $e->getMessage();
}

// Output the response as JSON
echo json_encode($response);
?>
