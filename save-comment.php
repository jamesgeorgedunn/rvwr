<?php

$file = __DIR__ . '/review-comments.txt';

if (!file_exists($file)) {
    file_put_contents($file, json_encode([]));
}

$content = file_get_contents($file);
$comments = json_decode($content, true);

if (!is_array($comments)) {
    $comments = [];
}

header('Content-Type: application/json');

// =======================
// LOAD
// =======================

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode($comments);
    exit;
}

// =======================
// POST
// =======================

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// DELETE
if (isset($data['action']) && $data['action'] === 'delete') {

    $id = $data['id'];

    $comments = array_values(array_filter($comments, function ($c) use ($id) {
        return $c['id'] !== $id;
    }));

    file_put_contents($file, json_encode($comments, JSON_PRETTY_PRINT), LOCK_EX);

    echo json_encode(['status' => 'deleted']);
    exit;
}

// CREATE
$newComment = [
    'id' => uniqid(),
    'url' => $data['url'],
    'x' => $data['x'],
    'y' => $data['y'],
    'viewport_width' => $data['viewport_width'],
    'viewport_height' => $data['viewport_height'],
    'comment' => $data['comment'],
    'created_at' => date('Y-m-d H:i:s')
];

$comments[] = $newComment;

file_put_contents($file, json_encode($comments, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode($newComment);