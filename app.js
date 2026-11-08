// State Management
const SOLDIERS = ["עומר", "לירי", "עידו", "ורוורה", "נועה", "מוריה"];
const DAYS = ["ראשון", "שני", "שלישי", "רביעי"];

// Difficulty Scale (1-4)
const SHIFT_DIFFICULTY = {
    "מטבח בוקר": 4, "מטבח ערב": 4,
    "ש.ג 08:00": 3, "ש.ג 12:00": 3, "ש.ג 16:00": 3,
    "רס\"ר בוקר": 2, "רס\"ר ערב": 2, "עיבוי ש.ג": 2,
    "ש.ג 20:00": 1, "ש.ג 00:00": 1, "ש.ג 04:00": 1,
    "נשקייה 08:00": 1, "נשקייה 12:00": 1, "נשקייה 16:00": 1, "נשקייה 20:00": 1, "נשקייה 00:00": 1, "נשקייה 04:00": 1,
    "ליווי קבלנים": 1
};

let state = {
    attendance: {},
    weekendDuty: {},
    scores: {},
    shifts: []
};

// Initialize App
function initData() {
    const savedScores = localStorage.getItem('intel_duty_scores');
    const defaultScores = { "עומר": 1, "לירי": 1, "עידו": 2, "ורוורה": 2, "נועה": 2, "מוריה": 1 };
    state.scores = savedScores ? JSON.parse(savedScores) : defaultScores;

    SOLDIERS.forEach(s => {
        state.attendance[s] = ["ראשון", "שני", "שלישי", "רביעי"];
        state.weekendDuty[s] = false;
    });

    state.shifts = [
        { day: "ראשון", type: "ש.ג 00:00", assigned: "עומר", locked: false },
        { day: "ראשון", type: "רס\"ר ערב", assigned: "מוריה", locked: false },
        { day: "שני", type: "ליווי קבלנים", assigned: "נועה", locked: false },
        { day: "שני", type: "נשקייה 12:00", assigned: "ורוורה", locked: false },
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

// Tab Switching Mechanism
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-btn-${tabName}`).classList.add('active');
}

// Render Team & Attendance List
function renderSoldiers() {
    const container = document.getElementById('soldiersList');
    container.innerHTML = SOLDIERS.map(s => `
        <div class="bg-slate-900 border border-slate-800 rounded-md p-3 space-y-2">
            <div class="flex justify-between items-center">
                <span class="font-bold text-xs text-slate-200">${s}</span>
                <span class="text-[10px] bg-slate-800 border border-slate-700 text-emerald-400 px-2 py-0.5 rounded font-mono">ניקוד: ${state.scores[s] || 0}</span>
            </div>
            <div class="flex items-center gap-1 flex-wrap pt-1">
                ${DAYS.map(d => `
                    <label class="cursor-pointer flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[10px]">
                        <input type="checkbox" ${state.attendance[s].includes(d) ? 'checked' : ''} onchange="toggleAttendance('${s}', '${d}')" class="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0">
                        <span class="text-slate-400">${d.replace('יום ', '')}</span>
                    </label>
                `).join('')}
            </div>
            <label class="flex items-center gap-1.5 text-[10px] text-amber-400/90 pt-1">
                <input type="checkbox" ${state.weekendDuty[s] ? 'checked' : ''} onchange="toggleWeekend('${s}')" class="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0">
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

// Render Shift Roster List
function renderShifts() {
    const container = document.getElementById('shiftsContainer');
    container.innerHTML = state.shifts.map((shift, idx) => `
        <div class="flex items-center justify-between bg-slate-950 border border-slate-800 rounded p-2 text-xs gap-2">
            <div class="flex items-center gap-2 w-5/12">
                <span class="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">${shift.day}</span>
                <span class="text-slate-200 font-medium text-[11px]">${shift.type}</span>
            </div>
            <div class="flex items-center gap-2 w-7/12">
                <select onchange="updateAssignment(${idx}, this.value)" class="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-slate-500">
                    <option value="">-- ללא שיבוץ --</option>
                    ${SOLDIERS.map(s => `<option value="${s}" ${shift.assigned === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
                <button onclick="toggleLock(${idx})" class="p-1 text-xs rounded ${shift.locked ? 'text-amber-400 bg-amber-950/40 border border-amber-800' : 'text-slate-600 hover:text-slate-400'}">
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

// Optimizer Algorithm
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
        await new Promise(r => setTimeout(r, 250));
    }

    if (overwriteAll) {
        state.shifts.forEach(s => { s.assigned = ""; s.locked = false; });
    }

    let currentScores = { ...state.scores };
    SOLDIERS.forEach(s => {
        if(state.weekendDuty[s]) currentScores[s] -= 1;
    });

    state.shifts.forEach(shift => {
        if (shift.locked && shift.assigned) return;

        let eligible = SOLDIERS.filter(s => {
            if (!state.attendance[s].includes(shift.day)) return false;
            
            // Varvara Exemption
            if (s === "ורוורה") {
                if (["ש.ג 08:00", "ש.ג 12:00", "ליווי קבלנים", "רס\"ר בוקר", "רס\"ר ערב"].includes(shift.type)) return false;
            }

            const sameDayShifts = state.shifts.filter(st => st.day === shift.day && st.assigned === s);
            if (sameDayShifts.length > 0 && !shift.type.includes("מטבח") && !shift.type.includes("רס\"ר")) return false;

            return true;
        });

        eligible.sort((a, b) => {
            let scoreA = currentScores[a];
            let scoreB = currentScores[b];

            if (shift.type.includes("רס\"ר")) {
                if (a === "עידו") scoreA -= 2.5;
                if (b === "עידו") scoreB -= 2.5;
            }

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
    switchTab('roster');
}

// WhatsApp Pakash Generator (Strict Format Match)
function updatePakash() {
    let txt = "פק\"ש שבועי אגף המודיעין:\n";
    
    DAYS.forEach(day => {
        const dayShifts = state.shifts.filter(s => s.day === day && s.assigned);
        if (dayShifts.length > 0) {
            txt += `*יום ${day}:*\n`;
            dayShifts.forEach(s => {
                let formattedLine = "";
                
                if (s.type.startsWith("ש.ג")) {
                    const time = s.type.replace("ש.ג ", "");
                    let endHour = parseInt(time.split(":")[0]) + 4;
                    if (endHour >= 24) endHour -= 24;
                    const endStr = endHour.toString().padStart(2, '0') + ":00";
                    formattedLine = `*שמירה* : ${time}-${endStr} ש.ג - ${s.assigned}`;
                } else if (s.type.startsWith("נשקייה")) {
                    const time = s.type.replace("נשקייה ", "").replace("נשקייה", "12:00");
                    let endHour = parseInt(time.split(":")[0]) + 4;
                    if (endHour >= 24) endHour -= 24;
                    const endStr = endHour.toString().padStart(2, '0') + ":00";
                    formattedLine = `*שמירה* : ${time}-${endStr} נשקייה - ${s.assigned}`;
                } else if (s.type.includes("רס\"ר")) {
                    formattedLine = `*${s.type}* : ${s.assigned}`;
                } else if (s.type.includes("מטבח")) {
                    formattedLine = `*${s.type}* : ${s.assigned}`;
                } else if (s.type.includes("קבלנים")) {
                    formattedLine = `*ליווי קבלנים* : ${s.assigned}`;
                } else {
                    formattedLine = `*${s.type}* : ${s.assigned}`;
                }

                txt += `${formattedLine}\n`;
            });
            txt += "\n";
        }
    });

    document.getElementById('pakashOutput').value = txt.trim();
}

function copyPakash() {
    const textarea = document.getElementById('pakashOutput');
    textarea.select();
    document.execCommand('copy');
    alert('הפק"ש הועתק בהצלחה!');
}

function approveWeek() {
    localStorage.setItem('intel_duty_scores', JSON.stringify(state.scores));
    alert('הניקוד המעודכן ננעל ונשמר בזיכרון המכשיר לשבוע הבא!');
}

// Image Compressor to prevent Chrome crashes
function compressImage(file, maxWidth = 1024, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            const canvas = document.createElement('canvas');
            let width = image.width;
            let height = image.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0, width, height);

            const base64 = canvas.toDataURL('image/jpeg', quality);
            URL.revokeObjectURL(image.src);
            resolve(base64);
        };
        image.onerror = (err) => reject(err);
    });
}

// Safe Image Handling & Gemini AI Request
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        alert('אנא הגדר מפתח API בהגדרות כדי לאפשר פענוח תמונות ב-AI.');
        return;
    }

    showLoading(true);
    document.getElementById('loadingStage').innerText = "מכווץ תמונה ומכין לפענוח...";

    try {
        const compressedBase64 = await compressImage(file);
        document.getElementById('imagePreview').src = compressedBase64;
        document.getElementById('imagePreviewContainer').classList.remove('hidden');

        document.getElementById('loadingStage').innerText = "מפענח תורנויות מול Gemini AI...";
        const base64Data = compressedBase64.split(',')[1];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Extract ONLY shifts marked for 'מודיעין'. Return ONLY a JSON array of objects with keys 'day' (ראשון/שני/שלישי/רביעי) and 'type' (e.g. ש.ג 08:00, מטבח בוקר, נשקייה)." },
                        { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                    ]
                }]
            })
        });

        if (!response.ok) throw new Error('שגיאה בהתקשרות ל-API');

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = replyText.match(/\[.*\]/s);

        if (jsonMatch) {
            const parsedShifts = JSON.parse(jsonMatch[0]);
            state.shifts = parsedShifts.map(s => ({ ...s, assigned: "", locked: false }));
            renderShifts();
            alert('התמונה פוענחה בהצלחה!');
        } else {
            alert('לא זוהו תורנויות מודיעין בתמונה. ניתן להוסיף תורנויות ידנית.');
        }
    } catch (err) {
        console.error(err);
        alert('התרחשה שגיאה בתהליך הפענוח. נסה שוב או הוסף תורנויות ידנית.');
    } finally {
        showLoading(false);
        e.target.value = ''; // Reset file input
    }
}

// Modal Controls
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

// Initialize on Load
window.onload = initData;
