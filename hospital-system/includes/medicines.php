<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';  // Include the PDO database connection

try {
    // Prepare the SQL query to fetch all medicines
    $sql = "SELECT * FROM `medicines`";
    $stmt = $pdo->prepare($sql);

    // Execute the query
    $stmt->execute();

    // Check if any results were found
    if ($stmt->rowCount() > 0) {
        // Initialize an array to hold the results
        $medicines = [];

        // Fetch all rows and store in the array
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $medicines[] = [
                'id' => $row["id"],
                'name' => $row["name"],
                'price' => $row["price"],
                'stock_quantity' => $row["stock_quantity"],
                'description' => $row["description"] ?? null,  // Handle NULL values for description
                'created_at' => $row["created_at"]
            ];
        }

        // Return the JSON response
        echo json_encode($medicines);
    } else {
        echo json_encode(['message' => 'No medicines found.']);
    }
} catch (PDOException $e) {
    // Return the error in JSON format
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
