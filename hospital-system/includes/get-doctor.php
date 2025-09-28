<?php
require_once 'db_connect.php'; // Include the database connection file

header('Content-Type: application/json');

// Query the database to fetch doctors
$query = "SELECT id, first_name, last_name, specialization, department FROM doctors";
$stmt = $pdo->prepare($query);
$stmt->execute();

// Fetch all doctors from the database
$doctors = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Return the result as JSON
if ($doctors) {
    echo json_encode(["success" => true, "doctors" => $doctors]);
} else {
    echo json_encode(["success" => false, "message" => "No doctors found."]);
}
?>
