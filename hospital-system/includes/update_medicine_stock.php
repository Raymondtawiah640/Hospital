<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


// Include database connection file
include_once 'db_connection.php';  // Ensure this file connects to your database

// Set response header to JSON for better response handling
header('Content-Type: application/json');

// Get the incoming POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if the necessary parameters are provided
if (isset($data['id']) && isset($data['stock_quantity'])) {
    $medicineId = $data['id'];
    $newStockQuantity = $data['stock_quantity'];

    // Validate that the stock quantity is a valid number (must be non-negative)
    if ($newStockQuantity >= 0) {
        // Prepare the SQL query to update the stock quantity
        $query = "UPDATE medicines SET stock_quantity = ? WHERE id = ?";

        if ($stmt = $conn->prepare($query)) {
            // Bind parameters
            $stmt->bind_param("ii", $newStockQuantity, $medicineId);
            
            // Execute the query
            if ($stmt->execute()) {
                // Return success response
                echo json_encode(["success" => true, "message" => "Stock updated successfully."]);
            } else {
                // Error in execution
                echo json_encode(["success" => false, "message" => "Failed to update stock."]);
            }

            // Close statement
            $stmt->close();
        } else {
            // SQL preparation failed
            echo json_encode(["success" => false, "message" => "Failed to prepare the SQL query."]);
        }
    } else {
        // Invalid stock quantity
        echo json_encode(["success" => false, "message" => "Invalid stock quantity. It should be a non-negative number."]);
    }
} else {
    // Missing parameters
    echo json_encode(["success" => false, "message" => "Missing required parameters (id, stock_quantity)."]);
}

// Close the database connection
$conn->close();

?>
