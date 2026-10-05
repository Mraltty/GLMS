const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

const ACCOUNTS_DIR = path.join(__dirname, 'accounts');


// тут кароче берутся и читаются акки в папке
app.get('/api/students', (req, res) => {
    try {
        const files = fs.readdirSync(ACCOUNTS_DIR);
        const students = files
            .filter(file => file.endsWith('.json'))
            .map(file => JSON.parse(fs.readFileSync(path.join(ACCOUNTS_DIR, file), 'utf-8')));
        res.json(students);
    } catch (e) {
        res.json([]);
    }
});

// добавляем или обновляем инфо про студ
app.post('/api/students', (req, res) => {
    try {
        const student = req.body;
        const filename = `${student.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
        const filePath = path.join(ACCOUNTS_DIR, filename);

        fs.writeFileSync(filePath, JSON.stringify(student, null, 2), 'utf-8');
        console.log(`[БД] Сохранен файл: accounts/${filename}`);
        res.json({ success: true, filename });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3000, () => {
    console.log('http://localhost:3000');
});