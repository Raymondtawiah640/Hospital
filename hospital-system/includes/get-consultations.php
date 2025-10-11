<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_connect.php';

try {
    // Get all consultations with patient and doctor details
    $consultationsQuery = $pdo->prepare("
        SELECT
            c.*,
            CONCAT(p.first_name, ' ', p.last_name) as patient_name,
            p.date_of_birth as patient_dob,
            p.gender as patient_gender,
            p.phone_number as patient_phone,
            p.email as patient_email,
            p.residential_address as patient_address,
            s.full_name as doctor_name,
            s.department as doctor_department
        FROM consultations c
        JOIN patients p ON c.patient_id = p.id
        LEFT JOIN staff s ON c.doctor_id = s.id
        ORDER BY c.created_at DESC
    ");

    $consultationsQuery->execute();
    $consultations = $consultationsQuery->fetchAll(PDO::FETCH_ASSOC);

    // Get symptoms for each consultation
    foreach ($consultations as &$consultation) {
        $symptomQuery = $pdo->prepare("
            SELECT s.name FROM consultation_symptoms cs
            JOIN symptoms s ON cs.symptom_id = s.id
            WHERE cs.consultation_id = ?
        ");
        $symptomQuery->execute([$consultation['id']]);
        $consultation['symptoms'] = $symptomQuery->fetchAll(PDO::FETCH_COLUMN);
    }

    // Get conditions for each consultation
    foreach ($consultations as &$consultation) {
        $conditionQuery = $pdo->prepare("
            SELECT c.name FROM consultation_conditions cc
            JOIN conditions c ON cc.condition_id = c.id
            WHERE cc.consultation_id = ?
        ");
        $conditionQuery->execute([$consultation['id']]);
        $consultation['conditions'] = $conditionQuery->fetchAll(PDO::FETCH_COLUMN);
    }

    echo json_encode([
        'success' => true,
        'consultations' => $consultations
    ]);

} catch(PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch(Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>