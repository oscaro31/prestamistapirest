<?php
function listCargos() {
    $pdo = getDB();
    jsonResponse($pdo->query("SELECT * FROM Cargos ORDER BY nombre")->fetchAll());
}
