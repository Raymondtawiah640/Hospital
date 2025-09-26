<?php
$dbhost = "localhost"; 
$dbport = "3306";
$dbuser = "dbuser";          
$dbpass = "kilnpassword1";   
$dbname = "Presbyterian_Hospital";

try {
    $pdo = new PDO(
        "mysql:host=$dbhost;port=$dbport;dbname=$dbname;charset=utf8mb4", 
        $dbuser, 
        $dbpass
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    echo "Connected successfully";
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
?>
