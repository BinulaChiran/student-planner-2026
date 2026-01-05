// --- 1. DATA & STATE ---
let exams = JSON.parse(localStorage.getItem('studentExams')) || [];
let tasks = JSON.parse(localStorage.getItem('studentTasks')) || []; // Corrected [cite: 29, 31]
let selectedExamId = null;
let editingId = null;

const themes = {
    nord: { '--bg': '#2E3440', '--text': '#ECEFF4', '--border': '#4C566A', '--icon-invert': '1' },
    peach: { '--bg': '#FFF5E1', '--text': '#5D4037', '--border': '#D7CCC8', '--icon-invert': '0' },
    matrix: { '--bg': '#000000', '--text': '#00ff41', '--border': '#003300', '--icon-invert': '1' }
};

// --- 2. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Render
    renderTasks();

    // 2. Theme Restoration [cite: 31]
    const savedTheme = localStorage.getItem('preferredTheme') || 'nord';
    if (savedTheme === 'custom') {
        const customData = JSON.parse(localStorage.getItem('customThemeData'));
        if (customData) applyThemeColors(customData);
    } else {
        setTheme(savedTheme);
    }

    const lastSection = sessionStorage.getItem('lastSection') || 'dashboard';
    showSection(lastSection);

    setInterval(() => {
        const timeEl = document.getElementById('time');
        if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();
    }, 1000);
});

// --- 3. THEME & BACKUP ---
function setTheme(name) {
    applyThemeColors(themes[name]);
    localStorage.setItem('preferredTheme', name);
}

function applyThemeColors(themeObj) {
    Object.keys(themeObj).forEach(key => {
        document.documentElement.style.setProperty(key, themeObj[key]);
    });
}

function saveCustomTheme() {
    const bg = document.getElementById('colorBg').value;
    const text = document.getElementById('colorText').value;
    const customTheme = { '--bg': bg, '--text': text, '--border': text, '--icon-invert': '0.5' };
    applyThemeColors(customTheme);
    localStorage.setItem('customThemeData', JSON.stringify(customTheme));
    localStorage.setItem('preferredTheme', 'custom');
}

function panicReset() {
    if (confirm("Reset to default theme?")) {
        localStorage.removeItem('customThemeData');
        setTheme('nord');
        location.reload(); // Refresh to make sure everything is clean
    }
}

function exportData() {
    const allData = {
        exams: exams,
        tasks: tasks,
        theme: JSON.parse(localStorage.getItem('customThemeData'))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = "planner_backup_2026.json";
    a.click();
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const imported = JSON.parse(e.target.result);
        if (confirm("Overwrite all data?")) {
            localStorage.setItem('studentExams', JSON.stringify(imported.exams || []));
            localStorage.setItem('studentTasks', JSON.stringify(imported.tasks || []));
            if (imported.theme) localStorage.setItem('customThemeData', JSON.stringify(imported.theme));
            localStorage.setItem('preferredTheme', imported.theme ? 'custom' : 'nord');
            location.reload();
        }
    };
    reader.readAsText(event.target.files[0]);
}

// --- 4. DASHBOARD LOGIC ---
function renderTasks() {
    const list = document.getElementById('taskList');
    if (!list) return;
    list.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = "task-item";
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.marginBottom = "8px";
        li.innerHTML = `<span>${task}</span><button onclick="deleteTask(${index})">[X]</button>`;
        list.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById('taskInput');
    if (!input.value.trim()) return;
    tasks.push(input.value.trim());
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
    input.value = "";
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
    renderTasks();
}

// --- 5. CALENDAR LOGIC ---
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthName = now.toLocaleString('default', { month: 'long' });
    document.querySelector('#calendar h3').innerText = `// ${monthName.toUpperCase()}_${year}`;

    const firstDay = new Date(year, month, 0).getDay(); // Adjusted for MON start [cite: 63]
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        empty.style.opacity = '0.3';
        grid.appendChild(empty);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (i === now.getDate()) dayDiv.style.boxShadow = 'inset 0 0 5px var(--text)';
        dayDiv.innerHTML = `<span>${i}</span>`;

        const dayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        const dayExams = exams.filter(e => e.date === dayStr);

        dayExams.forEach(ex => {
            const marker = document.createElement('div');
            marker.className = 'event-marker';
            // Added Time back to marker display [cite: 71]
            marker.innerHTML = `<b>${ex.code}</b><br><small>${ex.time}</small>`;
            marker.onclick = (e) => { e.stopPropagation(); showDetails(ex.id); };
            dayDiv.appendChild(marker);
        });
        grid.appendChild(dayDiv);
    }
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => {
        sec.classList.remove('active');
        sec.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionId);
    if (!activeSection) return;

    activeSection.style.display = 'block';
    setTimeout(() => activeSection.classList.add('active'), 10);

    // Update buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + sectionId);
    if (activeBtn) activeBtn.classList.add('active');

    sessionStorage.setItem('lastSection', sectionId);
    if (sectionId === 'calendar') renderCalendar();
}

function showDetails(examId) {
    selectedExamId = examId;
    const exam = exams.find(e => e.id === examId);
    const box = document.getElementById('exam-details');

    // Fill the content
    document.getElementById('detail-content').innerHTML = `
        <strong>Module:</strong> ${exam.code}<br>
        <strong>Time:</strong> ${exam.time}<br>
        <strong>Notes:</strong> ${exam.notes || 'None'}
    `;

    // Show with transition
    box.style.display = 'block';
    setTimeout(() => box.classList.add('visible'), 10);
}

// Visual hiding
function closeForm() {
    const form = document.getElementById('exam-form-container');
    form.classList.remove('open');
    setTimeout(() => {
        form.style.display = 'none';
        clearFormInputs();
    }, 400);
}

// Data clearing only
function clearFormInputs() {
    editingId = null;
    document.getElementById('moduleCode').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('examNotes').value = '';
}

function openCreateForm() {
    clearFormInputs(); // Don't call the timer!
    const form = document.getElementById('exam-form-container');
    form.style.display = 'flex';
    setTimeout(() => form.classList.add('open'), 10);
}

function openUpdateForm() {
    const exam = exams.find(e => e.id === selectedExamId);
    if (!exam) return;

    editingId = exam.id;
    document.getElementById('moduleCode').value = exam.code;
    document.getElementById('examDate').value = exam.date;
    document.getElementById('examTime').value = exam.time;
    document.getElementById('examNotes').value = exam.notes;

    const form = document.getElementById('exam-form-container');
    form.style.display = 'flex';
    setTimeout(() => form.classList.add('open'), 10);
}

function addExam() {
    const code = document.getElementById('moduleCode').value;
    const date = document.getElementById('examDate').value;
    const time = document.getElementById('examTime').value;
    const notes = document.getElementById('examNotes').value;

    if (!code || !date) return alert("Missing fields!");

    if (editingId) {
        const index = exams.findIndex(e => e.id === editingId);
        exams[index] = { id: editingId, code, date, time, notes };
    } else {
        exams.push({ id: Date.now(), code, date, time, notes });
    }

    localStorage.setItem('studentExams', JSON.stringify(exams));
    renderCalendar();
    closeForm();
}

function hideDetails() {
    const box = document.getElementById('exam-details');
    box.classList.remove('visible'); // Start the fade out

    // Wait 400ms (matching the CSS transition) before seting display to none
    setTimeout(() => {
        box.style.display = 'none';
        selectedExamId = null;
    }, 400);
}

function deleteExam() {
    if (!selectedExamId || !confirm("Delete this entry?")) return;

    exams = exams.filter(ex => ex.id !== selectedExamId);
    localStorage.setItem('studentExams', JSON.stringify(exams));

    hideDetails(); // Use our new timed hide function
    renderCalendar();
    closeForm();
}
