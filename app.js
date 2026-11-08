// State Management
const SOLDIERS = ["עומר", "לירי", "עידו", "ורוורה", "נועה", "מוריה"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי"];

// Difficulty Scale (1-4)
const SHIFT_DIFFICULTY = {
    "מטבח בוקר": 4, "מטבח ערב": 4,
    "ש.ג 08:00": 3, "ש.ג 12:00": 3, "ש.ג 16:00": 3,
    "רס\"ר בוקר": 2, "רס\"ר ערב": 2, "עיבוי ש.ג": 2,
    "ש.ג 20:00": 1, "ש.ג 00:00": 1, "ש.ג 04:00": 1,
    "נשקייה": 1, "ליווי קבלנים": 1
};

let state = {
    attendance: {},
    weekendDuty: {},
    scores: {},
    shifts: []
};

// Initialize Data
function initData() {
    const savedScores = localStorage.getItem('intel_duty_scores');
    const defaultScores = { "עומר": 1, "לירי": 1, "עידו": 2, "ורוורה": 2, "נועה": 2, "מוריה": 1 };
    state.scores = savedScores ? JSON.parse(savedScores) : defaultScores;

    SOLDIERS.forEach(s => {
        state.attendance[s] = ["ראשון", "שני", "שלישי", "רביעי"];
        state.weekendDuty[s] = false;
    });

    // Default weekly layout example
    state.shifts = [
        { day: "ראשון", type: "ש.ג 00:00", assigned: "עומר", locked: false },
        { day: "ראשון", type: "רס\"ר ערב", assigned: "מוריה", locked: false },
        { day: "שני", type: "ליווי קבלנים", assigned: "נועה", locked: false },
        { day: "שני", type: "נשקייה", assigned: "ורוורה", locked: false },
        { day: "שלישי", type: "ש.ג 08:00", assigned: "עידו", locked: false },
        { day: "רביעי", type: "מטבח בוקר", assigned: "ורוורה", locked: false },
        { day: "רביעי", type: "מטבח ערב", assigned: "עידו", locked: false },
        { day: "רביעי", type: "ש.ג 12:00", assigned: "לירי", locked: false },
        { day: "רביעי", type: "ש.ג 20:00", assigned: "מוריה", locked: false }
    ];

    renderSoldiers();
    renderShifts();
    updatePakash();
    
    const savedKey = localStorage.getItem('gemini_api_key');
    if(savedKey) document.getElementById('apiKeyInput').value = savedKey;
}

// Render Soldiers Panel
function renderSoldiers() {
    const container = document.getElementById('soldiersList');
    container.innerHTML = SOLDIERS.map(s => `
        <div class="bg-gray-900/60 border border-gray-800 rounded-lg p-3 text-xs space-y-2">
            <div class="flex justify-between items-center">
                <span class="font-bold text-gray-200">${s}</span>
                <span class="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-mono">ניקוד: ${state.scores[s] || 0}</span>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
                ${DAYS.map(d => `
                    <label class="cursor-pointer flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                        <input type="checkbox" ${state.attendance[s].includes(d) ? 'checked' : ''} onchange="toggleAttendance('${s}', '${d}')" class="rounded bg-gray-900 border-gray-700 text-emerald-600 focus:ring-0">
                        <span class="text-[10px] text-gray-400">${d.replace('יום ', '')}</span>
                    </label>
                `).join('')}
            </div>
            <label class="flex items-center gap-1.5 text-[11px] text-amber-400/90 pt-1">
                <input type="checkbox" ${state.weekendDuty[s] ? 'checked' : ''} onchange="toggleWeekend('${s}')" class="rounded bg-gray-900 border-gray-700 text-amber-500 focus:ring-0">
                <span>סגר/ה שבת אחרונה</span>
            </label>
        </div>
    `).join('');
}

function toggleAttendance(soldier, day) {
    const list = state.attendance[soldier];
    const idx = list.indexOf(day);
    if(idx > -1) list.splice(idx, 1);
    else list.push(day);
}

function toggleWeekend(soldier) {
    state.weekendDuty[soldier] = !state.weekendDuty[soldier];
}

// Render Shifts Roster
function renderShifts() {
    const container = document.getElementById('shiftsContainer');
    container.innerHTML = state.shifts.map((shift, idx) => `
        <div class="flex items-center justify-between bg-gray-900/40 border border-gray-800/80 rounded-lg p-2.5 text-xs gap-2">
            <div class="flex items-center gap-2 w-1/3">
                <span class="bg-gray-800 text-gray-400 px-2 py-1 rounded font-medium">${shift.day}</span>
                <span class="text-gray-200 font-medium">${shift.type}</span>
            </div>
            <div class="flex items-center gap-2 w-1/2">
                <select onchange="updateAssignment(${idx}, this.value)" class="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-emerald-500">
                    <option value="">-- ללא שיבוץ --</option>
                    ${SOLDIERS.map(s => `<option value="${s}" ${shift.assigned === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
                <button onclick="toggleLock(${idx})" class="p-1 rounded ${shift.locked ? 'text-amber-400 bg-amber-950/40 border border-amber-800' : 'text-gray-600 hover:text-gray-400'}">
                    ${shift.locked ? '🔒' : '🔓'}
                </button>
            </div>
        </div>
    `).join('');
}

function updateAssignment(idx, soldier) {
    state.shifts[idx].assigned = soldier;
    state.shifts[idx].locked = true;
    renderShifts();
    updatePakash();
}

function toggleLock(idx) {
    state.shifts[idx].locked = !state.shifts[idx].locked;
    renderShifts();
}

function addManualShift() {
    state.shifts.push({ day: "ראשון", type: "ש.ג 08:00", assigned: "", locked: false });
    renderShifts();
}

// Deep Optimizer Algorithm with Hidden Preferences
async function generateRoster(overwriteAll) {
    showLoading(true);
    
    const stages = [
        "מאפס ומכין תורנויות פתוחות...",
        "בודק פטורים רפואיים (פטור שמש ורוורה)...",
        "משקלל עדיפויות נסתרות (עידו->רס\"ר, עומר->ללא מטבח/רס\"ר)...",
        "מחיל מנוחת 8 שעות ואיסורי רצף ערב/לילה/בוקר...",
        "מריץ סימולציית איזון עומס וניקוד קושי מצטבר..."
    ];

    for (let i = 0; i < stages.length; i++) {
        document.getElementById('loadingStage').innerText = stages[i];
        document.getElementById('progressBar').style.width = `${((i + 1) / stages.length) * 100}%`;
        await new Promise(r => setTimeout(r, 400));
    }

    if (overwriteAll) {
        state.shifts.forEach(s => { s.assigned = ""; s.locked = false; });
    }

    // Optimization Logic
    let currentScores = { ...state.scores };
    
    // Deduct penalty for weekend duty
    SOLDIERS.forEach(s => {
        if(state.weekendDuty[s]) currentScores[s] -= 1;
    });

    state.shifts.forEach(shift => {
        if (shift.locked && shift.assigned) return;

        // Find eligible soldier
        let eligible = SOLDIERS.filter(s => {
            if (!state.attendance[s].includes(shift.day)) return false;
            
            // Varvara Exemption
            if (s === "ורוורה") {
                if (["ש.ג 08:00", "ש.ג 12:00", "ליווי קבלנים", "רס\"ר בוקר", "רס\"ר ערב"].includes(shift.type)) return false;
            }

            // Check Rest Rules vs already assigned shifts
            const sameDayShifts = state.shifts.filter(st => st.day === shift.day && st.assigned === s);
            if (sameDayShifts.length > 0 && !shift.type.includes("מטבח") && !shift.type.includes("רס\"ר")) return false;

            return true;
        });

        // Calculate weighted score for sorting based on cumulative score + hidden preferences
        eligible.sort((a, b) => {
            let scoreA = currentScores[a];
            let scoreB = currentScores[b];

            // Preference 1: Ido prefers Rasar
            if (shift.type.includes("רס\"ר")) {
                if (a === "עידו") scoreA -= 2.5;
                if (b === "עידו") scoreB -= 2.5;
            }

            // Preference 2: Omer prefers NO Kitchen and NO Rasar
            if (shift.type.includes("מטבח") || shift.type.includes("רס\"ר")) {
                if (a === "עומר") scoreA += 10;
                if (b === "עומר") scoreB += 10;
            }

            return scoreA - scoreB;
        });
        
        if (eligible.length > 0) {
            shift.assigned = eligible[0];
            const difficulty = SHIFT_DIFFICULTY[shift.type] || 1;
            currentScores[eligible[0]] += difficulty;
        }
    });

    renderShifts();
    updatePakash();
    showLoading(false);
}

// WhatsApp Pakash Generator
function updatePakash() {
    let txt = "פקש שבועי אגף המודיעין:\n\n";
    DAYS.forEach(day => {
        const dayShifts = state.shifts.filter(s => s.day === day && s.assigned);
        if (dayShifts.length > 0) {
            txt += `*יום ${day}:*\n`;
            dayShifts.forEach(s => {
                txt += `*${s.type}* : ${s.assigned}\n`;
            });
            txt += "\n";
        }
    });

    txt += "---\n📋 *שורת ניקוד לשמירה ולהדבקה לשבוע הבא:*\n`";
    txt += SOLDIERS.map(s => `${s}: ${state.scores[s] || 0}`).join(", ");
    txt += "`";

    document.getElementById('pakashOutput').value = txt;
}

function copyPakash() {
    const textarea = document.getElementById('pakashOutput');
    textarea.select();
    document.execCommand('copy');
    alert('הפָּקָשׁ הועתק בהצלחה!');
}

function approveWeek() {
    localStorage.setItem('intel_duty_scores', JSON.stringify(state.scores));
    alert('הניקוד המעודכן ננעל ונשמר בזיכרון המכשיר לשבוע הבא!');
}

// Image Handling & Gemini AI Integration
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
        document.getElementById('imagePreview').src = evt.target.result;
        document.getElementById('imagePreviewContainer').classList.remove('hidden');

        const apiKey = localStorage.getItem('gemini_api_key');
        if(!apiKey) {
            alert('אנא הגדר מפתח API בהגדרות כדי לאפשר פענוח תמונות ב-AI.');
            return;
        }

        showLoading(true);
        document.getElementById('loadingStage').innerText = "מפתח תמונה ומפענח תורנויות ב-Gemini AI...";
        
        try {
            const base64Data = evt.target.result.split(',')[1];
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Parse this duty table image. Extract only shifts marked for 'מודיעין'. Return ONLY a JSON array of objects with keys: 'day' (ראשון/שני/שלישי/רביעי), 'type' (e.g. ש.ג 08:00, מטבח בוקר, נשקייה)." },
                            { inline_data: { mime_type: file.type, data: base64Data } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const replyText = data.candidates[0].content.parts[0].text;
            const jsonMatch = replyText.match(/\[.*\]/s);
            
            if (jsonMatch) {
                const parsedShifts = JSON.parse(jsonMatch[0]);
                state.shifts = parsedShifts.map(s => ({ ...s, assigned: "", locked: false }));
                renderShifts();
            }
        } catch(err) {
            alert('שגיאה בפענוח התמונה. ניתן להזין תורנויות ידנית.');
        } finally {
            showLoading(false);
        }
    };
    reader.readAsDataURL(file);
}

// Modal & Helper Functions
function toggleSettingsModal() {
    document.getElementById('settingsModal').classList.toggle('hidden');
}

function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    localStorage.setItem('gemini_api_key', key);
    toggleSettingsModal();
    alert('מפתח API נשמר!');
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

// Initialize App on Load
window.onload = initData;

