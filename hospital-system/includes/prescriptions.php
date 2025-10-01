<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';  // Include the PDO database connection

try {
    // SQL query to fetch all prescriptions and join with medicines table
    $sql = "SELECT prescriptions.id, prescriptions.doctor_id, prescriptions.patient_id, 
                   medicines.name AS medicine_name, prescriptions.dosage, prescriptions.instructions
            FROM `prescriptions`
            JOIN `medicines` ON prescriptions.medicine_id = medicines.id";
    $stmt = $pdo->prepare($sql);

    // Execute the query
    $stmt->execute();

    // Check if any results were found
    if ($stmt->rowCount() > 0) {
        // Output data of each row
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "Prescription ID: " . $row["id"] . " - Doctor ID: " . $row["doctor_id"] . 
                 " - Patient ID: " . $row["patient_id"] . " - Medicine: " . $row["medicine_name"] . 
                 " - Dosage: " . $row["dosage"] . " - Instructions: " . $row["instructions"] . "<br>";
        }
    } else {
        echo "No prescriptions found.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}

// Close the connection (handled automatically by PDO)
?>
