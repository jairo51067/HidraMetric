// ==========================================
// Estado Global
// ==========================================
const state = {
    goalTotal: 2500,
    goalWater: 1500,
    intakeWater: 0,
    intakeTotal: 0,
    history: [],
    nextDrinkTime: Date.now() + (60 * 60 * 1000),
    timerInterval: null
};

const DOM = {
    waterLevel: document.getElementById('water-level'),
    waterText: document.getElementById('water-text'),
    totalProgressFill: document.getElementById('total-progress-fill'),
    totalText: document.getElementById('total-text'),
    countdownTime: document.getElementById('time'),
    statusText: document.getElementById('status-text'),
    bottomSheet: document.getElementById('bottom-sheet'),
    historyList: document.getElementById('history-list'),
    historyChart: document.getElementById('historyChart')
};

// ==========================================
// Lógica de Hidratación
// ==========================================
function addDrink(type, amount) {
    state.history.push({
        type, amount,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    });
    if (type === 'water') state.intakeWater += amount;
    state.intakeTotal += amount;
    state.nextDrinkTime = Date.now() + (60 * 60 * 1000);
    updateUI();
    if (document.getElementById('view-history').classList.contains('active')) renderHistory();
    checkOverhydration();
}

function updateUI() {
    let waterPercent = Math.min((state.intakeWater / state.goalWater) * 100, 100);
    DOM.waterLevel.style.height = `${waterPercent}%`;
    DOM.waterText.textContent = `${state.intakeWater} ml / ${state.goalWater} ml (Agua Pura)`;

    let totalPercent = Math.min((state.intakeTotal / state.goalTotal) * 100, 100);
    DOM.totalProgressFill.style.width = `${totalPercent}%`;
    DOM.totalText.textContent = `Total líquidos: ${state.intakeTotal} ml / ${state.goalTotal} ml`;

    if ('setAppBadge' in navigator) {
        let remaining = Math.max(0, state.goalTotal - state.intakeTotal);
        remaining > 0 ? navigator.setAppBadge(Math.ceil(remaining / 100)) : navigator.clearAppBadge();
    }
}

function checkOverhydration() {
    if (state.intakeTotal > (state.goalTotal * 1.15)) {
        alert("⚠️ Alerta: has superado el 115% de la ingesta máxima. Riesgo de hiponatremia.");
    }
}

// ==========================================
// Temporizador
// ==========================================
function startTimer() {
    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        let distance = state.nextDrinkTime - Date.now();
        if (distance < 0) {
            clearInterval(state.timerInterval);
            DOM.countdownTime.textContent = "00:00:00";
            DOM.statusText.textContent = "¡Es hora de hidratarse!";
            DOM.countdownTime.style.color = "#ff5252";
            return;
        }
        let h = Math.floor(distance / 3600000);
        let m = Math.floor((distance % 3600000) / 60000);
        let s = Math.floor((distance % 60000) / 1000);
        DOM.countdownTime.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        DOM.statusText.textContent = "Próxima toma en";
        DOM.countdownTime.style.color = "#0d47a1";
    }, 1000);
}

// ==========================================
// Historial
// ==========================================
function renderHistory() {
    DOM.historyList.innerHTML = state.history.length === 0
        ? '<p style="text-align:center;color:#888;padding:20px;">Aún no has registrado bebidas hoy.</p>'
        : state.history.map(item => {
            const labels = {water:'💧 Agua', coffee:'☕ Café', tea:'🍵 Té', juice:'🧃 Zumo'};
            return `<div class="history-item"><span>${labels[item.type]||item.type}</span><span>${item.amount} ml <small>(${item.time})</small></span></div>`;
        }).join('');

    const ctx = DOM.historyChart.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);
    const grouped = state.history.reduce((acc,c)=>{acc[c.type]=(acc[c.type]||0)+c.amount;return acc;},{});
    const colors = {water:'#2196f3', coffee:'#8d6e63', tea:'#8bc34a', juice:'#ff9800'};
    let startAngle = -Math.PI/2;
    const total = state.intakeTotal;
    if (total === 0) {
        ctx.fillStyle='#ccc'; ctx.beginPath(); ctx.arc(100,100,80,0,2*Math.PI); ctx.fill();
        return;
    }
    Object.keys(grouped).forEach(key => {
        const slice = (grouped[key]/total)*2*Math.PI;
        ctx.beginPath(); ctx.fillStyle=colors[key]||'#ccc';
        ctx.moveTo(100,100); ctx.arc(100,100,80,startAngle,startAngle+slice); ctx.fill();
        startAngle += slice;
    });
    ctx.beginPath(); ctx.fillStyle='white'; ctx.arc(100,100,50,0,2*Math.PI); ctx.fill();
    ctx.fillStyle='#333'; ctx.font='bold 16px Poppins'; ctx.textAlign='center';
    ctx.fillText(`${state.intakeTotal} ml`, 100, 95);
    ctx.font='12px Poppins'; ctx.fillText('Total', 100, 115);
}

// ==========================================
// Navegación (helper)
// ==========================================
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');
    document.getElementById('sidebar').classList.remove('active');
}

// ==========================================
// Event Listeners
// ==========================================
document.getElementById('add-drink-btn').addEventListener('click', () => {
    DOM.bottomSheet.classList.add('active');
});
document.getElementById('close-sheet').addEventListener('click', () => {
    DOM.bottomSheet.classList.remove('active');
});
document.querySelectorAll('.drink-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        addDrink(e.target.dataset.type, parseInt(e.target.dataset.amount));
        DOM.bottomSheet.classList.remove('active');
    });
});
document.getElementById('add-custom-btn').addEventListener('click', () => {
    const amount = parseInt(document.getElementById('custom-amount').value);
    const type = document.getElementById('custom-type').value;
    if (amount > 0) {
        addDrink(type, amount);
        document.getElementById('custom-amount').value = '';
        DOM.bottomSheet.classList.remove('active');
    }
});

document.getElementById('history-btn').addEventListener('click', () => {
    showView('history'); renderHistory();
});
document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
});

// Navegación del sidebar
document.getElementById('nav-home').addEventListener('click', (e) => { e.preventDefault(); showView('home'); });
document.getElementById('nav-history').addEventListener('click', (e) => { e.preventDefault(); showView('history'); renderHistory(); });
document.getElementById('nav-alarms').addEventListener('click', (e) => { e.preventDefault(); showView('alarms'); });
document.getElementById('nav-profile').addEventListener('click', (e) => { e.preventDefault(); showView('profile'); });
document.getElementById('nav-science').addEventListener('click', (e) => { e.preventDefault(); showView('science'); });
document.getElementById('nav-libro').addEventListener('click', (e) => { e.preventDefault(); showView('libro'); loadLibro(); });

// Botones "Volver"
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.target));
});

// Guardar intervalo de alarma
document.getElementById('save-alarm').addEventListener('click', () => {
    const mins = parseInt(document.getElementById('alarm-interval').value) || 60;
    state.nextDrinkTime = Date.now() + mins * 60000;
    startTimer();
    alert(`Alarma configurada: próxima toma en ${mins} minutos.`);
});

// Recalcular meta (Mifflin-St Jeor simplificado)
document.getElementById('calc-goal').addEventListener('click', () => {
    const w = parseFloat(document.getElementById('profile-weight').value) || 70;
    const h = parseFloat(document.getElementById('profile-height').value) || 170;
    const a = parseFloat(document.getElementById('profile-age').value) || 30;
    const sex = document.getElementById('profile-sex').value;
    const bmr = 10*w + 6.25*h - 5*a + (sex === 'male' ? 5 : -161);
    const tdee = bmr * 1.375;
    const waterGoal = Math.round(tdee * 0.8 * 0.8); // ≈80% de 1ml/kcal
    state.goalTotal = waterGoal;
    state.goalWater = Math.round(waterGoal * 0.6);
    updateUI();
    alert(`Nueva meta: ${state.goalTotal} ml totales (${state.goalWater} ml de agua pura).`);
});

// Cargar libro desde data/beneficios_hidratacion.json
async function loadLibro() {
    const cont = document.getElementById('libro-content');
    try {
        const res = await fetch('data/beneficios_hidratacion.json');
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        cont.innerHTML = `<pre style="white-space:pre-wrap;font-size:14px;">${JSON.stringify(data, null, 2)}</pre>`;
    } catch (err) {
        cont.innerHTML = `<p>No se pudo cargar <code>data/beneficios_hidratacion.json</code>.</p>
        <p><strong>Beneficios de la hidratación (resumen):</strong></p>
        <ul style="text-align:left;padding-left:20px;margin-top:10px;">
            <li>Mejora la función cognitiva y concentración.</li>
            <li>Regula la temperatura corporal.</li>
            <li>Favorece la digestión y el tránsito intestinal.</li>
            <li>Protege articulaciones y tejidos.</li>
            <li>Ayuda a mantener la presión arterial estable.</li>
        </ul>`;
    }
}

// ==========================================
// Inicialización
// ==========================================
function init() {
    updateUI();
    startTimer();
    // Service Worker: solo registrar si no estamos en localhost/desarrollo
    if ('serviceWorker' in navigator && location.hostname !== '127.0.0.1' && location.hostname !== 'localhost') {
        navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW error:', err));
    }
}
init();