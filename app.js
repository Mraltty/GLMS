// Начальный список студентов (если папка accounts еще пуста)
const DEFAULT_LEADERBOARD = [
    { name: "Michael Jordan", level: 5, pts: 1200 },
    { name: "Kanye West", level: 4, pts: 850 },
    { name: "Justin Bieber", level: 3, pts: 600 },
    { name: "Steve from Minecraft", level: 2, pts: 350 },
    { name: "Igilik Altair", level: 1, pts: 0 }
];

// Состояние приложения
let state = {
    user: { name: "Igilik Altair", level: 1, xp: 0, xpNeeded: 100, pts: 0, unlocked: [] },
    activeTask: null,
    leaderboard: [],
    courses: [
        {
            id: 1, title: "Основы GLMS и Геймификации", desc: "Узнайте, как работают баллы и уровни.",
            tasks: [
                { id: 101, title: "Тест: Что такое GLMS?", type: "mcq", question: "Главный элемент GLMS?", options: ["Случайные оценки", "Игровые механики", "Сложные экзамены"], correct: 1, xp: 50, pts: 100 },
                { id: 102, title: "Открытый вопрос", type: "text", question: "Зачем студентам баллы?", xp: 50, pts: 100 }
            ]
        },
        {
            id: 2, title: "Веб-разработка", desc: "Практические задания.",
            tasks: [{ id: 201, title: "Тест: HTML/JS", type: "mcq", question: "Какой тег подключает JS?", options: ["<style>", "<script>", "<link>"], correct: 1, xp: 75, pts: 150 }]
        }
    ],
    achievements: [
        { id: 'first_task', title: 'Первый шаг', desc: 'Выполните 1 задание', icon: '🎯' },
        { id: 'level_2', title: 'Восходящая звезда', desc: 'Достигните 2 уровня', icon: '⭐' },
        { id: 'all_tasks', title: 'Гений GLMS', desc: 'Завершите все задания', icon: '🏆' }
    ]
};

const $ = id => document.getElementById(id);
const toggle = (el, show) => $(el).classList.toggle('hidden', !show);

// 1. ЧТЕНИЕ ИЗ ПАПКИ ACCOUNTS (Запрос к серверу)
async function loadStudentsFromFolder() {
    try {
        const res = await fetch('/api/students');
        const students = await res.json();
        return students.length ? students : DEFAULT_LEADERBOARD;
    } catch (e) {
        // Если сервер еще не запущен — возвращаем дефолтных
        return DEFAULT_LEADERBOARD;
    }
}

// 2. СОХРАНЕНИЕ В ПАПКУ ACCOUNTS (Отправка файла на сервер)
async function saveStudentToFolder(student) {
    try {
        await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
    } catch (e) {
        console.error("Не удалось сохранить файл пользователя:", e);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Подгружаем студентов при старте
    state.leaderboard = await loadStudentsFromFolder();

    // Авторизация / Регистрация
    $("auth-form").onsubmit = async e => {
        e.preventDefault();
        const inputName = $("auth-name").value.trim();
        if (!inputName) return;

        state.user.name = inputName;

        // Проверяем, есть ли такой студент в списке файлов
        let student = state.leaderboard.find(s => s.name.toLowerCase() === inputName.toLowerCase());

        if (student) {
            state.user.level = student.level;
            state.user.pts = student.pts;
        } else {
            // Если новый — создаем профиль и сохраняем его JSON в папку accounts/
            student = { name: inputName, level: 1, pts: 0 };
            state.leaderboard.push(student);
            await saveStudentToFolder(student);
        }

        toggle("auth-screen", false);
        toggle("app-screen", true);
        updateUI();
    };

    $("btn-logout").onclick = () => { toggle("app-screen", false); toggle("auth-screen", true); };

    // Переключение вкладок Вход / Регистрация
    ["login", "register"].forEach(mode => {
        $(`tab-${mode}`).onclick = () => {
            $("tab-login").className = `flex-1 py-2 font-semibold ${mode === 'login' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`;
            $("tab-register").className = `flex-1 py-2 font-semibold ${mode === 'register' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`;
            $("auth-submit-btn").innerText = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
        };
    });

    // Навигация по разделам
    ["courses", "leaderboard", "achievements"].forEach(tab => {
        $(`nav-${tab}`).onclick = () => {
            ["courses", "leaderboard", "achievements"].forEach(t => {
                toggle(`view-${t}`, t === tab);
                $(`nav-${t}`).className = `py-3 border-b-2 ${t === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500'} font-medium`;
            });
        };
    });

    // Модалка
    $("btn-close-modal").onclick = $("btn-cancel-modal").onclick = closeModal;
    $("btn-submit-task").onclick = submitTask;
});

async function updateUI() {
    const { user, achievements } = state;
    $("user-display-name").innerText = user.name;
    $("stat-level-badge").innerText = user.level;
    $("stat-pts").innerText = user.pts;
    $("stat-xp-text").innerText = `${user.xp} / ${user.xpNeeded} XP`;
    $("stat-xp-bar").style.width = `${Math.min(100, (user.xp / user.xpNeeded) * 100)}%`;
    $("stat-level-title").innerText = ["Новичок", "Исследователь", "Знаток", "Мастер", "Легенда"][Math.min(4, user.level - 1)];
    $("stat-badges-count").innerText = `${user.unlocked.length} / ${achievements.length}`;

    // Рендер курсов
    $("courses-list").innerHTML = state.courses.map(c => `
        <div class="bg-white p-5 rounded-lg shadow border">
            <h3 class="font-bold text-gray-800 mb-1">${c.title}</h3>
            <p class="text-xs text-gray-500 mb-3">${c.desc}</p>
            <div class="space-y-1">${c.tasks.map(t => `
                <div class="flex items-center justify-between py-2 border-t text-sm">
                    <div>
                        <span class="${t.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}">${t.title}</span>
                        <div class="text-xs text-gray-400">+${t.xp} XP \vert{} +${t.pts} PTS</div>
                    </div>
                    <button onclick="openTask(${c.id}, ${t.id})" ${t.completed ? 'disabled' : ''}
                        class="px-3 py-1 rounded text-xs font-semibold ${t.completed ? 'bg-gray-100 text-gray-400' : 'bg-indigo-50 text-indigo-600'}">
                        ${t.completed ? 'Готово' : 'Начать'}
                    </button>
                </div>`).join('')}
            </div>
        </div>`).join('');

    // Обновляем текущего юзера и перезаписываем его файл в папке accounts
    let student = state.leaderboard.find(s => s.name.toLowerCase() === user.name.toLowerCase());
    if (student) {
        student.pts = user.pts;
        student.level = user.level;
        await saveStudentToFolder(student);
    }

    // Рендер Лидерборда (сортировка)
    $("leaderboard-body").innerHTML = [...state.leaderboard]
        .sort((a, b) => b.pts - a.pts)
        .map((item, i) => {
            const isMe = item.name.toLowerCase() === user.name.toLowerCase();
            return `
            <tr class="border-b ${isMe ? 'bg-indigo-50 font-bold' : ''}">
                <td class="py-3 px-4">${i + 1}</td>
                <td class="py-3 px-4">${item.name} ${isMe ? '(Вы)' : ''}</td>
                <td class="py-3 px-4">Ур. ${item.level}</td>
                <td class="py-3 px-4 text-right">${item.pts}</td>
            </tr>`;
        }).join('');

    // Рендер Ачивок
    $("achievements-list").innerHTML = achievements.map(a => {
        const has = user.unlocked.includes(a.id);
        return `
            <div class="p-4 rounded-lg border text-center ${has ? 'bg-white border-yellow-300' : 'bg-gray-50 opacity-60'}">
                <div class="text-3xl mb-2">${a.icon}</div>
                <div class="font-bold text-sm text-gray-800">${a.title}</div>
                <div class="text-xs text-gray-500 mt-1">${a.desc}</div>
                <div class="mt-2 text-[10px] font-semibold uppercase ${has ? 'text-green-600' : 'text-gray-400'}">
                    ${has ? '✓ Разблокировано' : 'Заблокировано'}
                </div>
            </div>`;
    }).join('');
}

window.openTask = (cId, tId) => {
    const task = state.courses.find(c => c.id === cId)?.tasks.find(t => t.id === tId);
    if (!task || task.completed) return;

    state.activeTask = task;
    $("modal-task-title").innerText = task.title;
    $("modal-task-desc").innerText = `Награда: +${task.xp} XP, +${task.pts} PTS`;
    
    $("modal-task-content").innerHTML = task.type === "mcq" 
        ? `<p class="text-sm font-medium mb-3">${task.question}</p>` + task.options.map((o, i) => `
            <label class="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50 mb-2">
                <input type="radio" name="task-opt" value="${i}"> <span class="text-sm">${o}</span>
            </label>`).join('')
        : `<p class="text-sm font-medium mb-2">${task.question}</p>
           <textarea id="task-text-answer" class="w-full border rounded p-2 text-sm" rows="3" placeholder="Введите ваш ответ..."></textarea>`;

    toggle("task-modal", true);
};

function closeModal() { toggle("task-modal", false); state.activeTask = null; }

async function submitTask() {
    const task = state.activeTask;
    if (!task) return;

    if (task.type === "mcq") {
        const sel = document.querySelector('input[name="task-opt"]:checked');
        if (!sel) return alert("Выберите вариант!");
        if (+sel.value !== task.correct) return alert("Неверный ответ!");
    } else if (!($("task-text-answer")?.value.trim())) {
        return alert("Напишите ответ!");
    }

    task.completed = true;
    const { user } = state;
    user.xp += task.xp;
    user.pts += task.pts;

    if (!user.unlocked.includes("first_task")) user.unlocked.push("first_task");

    if (user.xp >= user.xpNeeded) {
        user.level++;
        user.xp -= user.xpNeeded;
        user.xpNeeded = Math.floor(user.xpNeeded * 1.5);
        alert(`🎉 Поздравляем! Достигнут ${user.level} уровень!`);
        if (user.level >= 2 && !user.unlocked.includes("level_2")) user.unlocked.push("level_2");
    }

    if (state.courses.every(c => c.tasks.every(t => t.completed)) && !user.unlocked.includes("all_tasks")) {
        user.unlocked.push("all_tasks");
    }

    closeModal();
    await updateUI();
}