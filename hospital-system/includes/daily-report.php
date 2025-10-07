<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

include 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

    try {
        // Get total patients (unique patients with activities on the date)
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT patient_id) as total FROM laboratory_tests WHERE DATE(date) = ?");
        $stmt->execute([$date]);
        $totalPatients = $stmt->fetch()['total'];

        // Get total lab tests on the date
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM laboratory_tests WHERE DATE(date) = ?");
        $stmt->execute([$date]);
        $totalLabTests = $stmt->fetch()['total'];

        // Get total prescriptions on the date
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM prescriptions WHERE DATE(created_at) = ?");
        $stmt->execute([$date]);
        $totalPrescriptions = $stmt->fetch()['total'];

        // Get total bills on the date
        $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bills WHERE DATE(date) = ?");
        $stmt->execute([$date]);
        $totalBills = $stmt->fetch()['total'];

        // Get total revenue on the date
        $stmt = $pdo->prepare("SELECT SUM(amount) as total FROM bills WHERE DATE(date) = ? AND status = 'paid'");
        $stmt->execute([$date]);
        $totalRevenue = $stmt->fetch()['total'] ?? 0;

        // Get lab tests details
        $stmt = $pdo->prepare("
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                lab.name as test_name,
                lab.status,
                lab.type
            FROM laboratory_tests lab
            LEFT JOIN patients p ON lab.patient_id = p.id
            LEFT JOIN doctors d ON lab.doctor = d.id
            WHERE DATE(lab.date) = ?
        ");
        $stmt->execute([$date]);
        $labTests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get prescriptions details
        $stmt = $pdo->prepare("
            SELECT
                CONCAT(p.first_name, ' ', p.last_name) as patient_name,
                CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
                COUNT(pr.id) as medicines
            FROM prescriptions pr
            LEFT JOIN patients p ON pr.patient_id = p.id
            LEFT JOIN doctors d ON pr.doctor_id = d.id
            WHERE DATE(pr.created_at) = ?
            GROUP BY pr.patient_id, pr.doctor_id
        ");
        $stmt->execute([$date]);
        $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get bills details
        $stmt = $pdo->prepare("
            SELECT
                patient_name,
                amount,
                status
            FROM bills
            WHERE DATE(date) = ?
        ");
        $stmt->execute([$date]);
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => [
                'totalPatients' => (int)$totalPatients,
                'totalLabTests' => (int)$totalLabTests,
                'totalPrescriptions' => (int)$totalPrescriptions,
                'totalBills' => (int)$totalBills,
                'totalRevenue' => (float)$totalRevenue,
                'labTests' => $labTests,
                'prescriptions' => $prescriptions,
                'bills' => $bills
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>