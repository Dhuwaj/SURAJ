const DATA = [
    { id: 'thermostat', name: 'Smart Thermostat', consumption: [18, 17, 19, 20, 22, 24, 30, 28, 25, 21, 19, 18], production: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'solarCam', name: 'Solar Camera', consumption: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], production: [8, 9, 9, 10, 11, 12, 13, 11, 10, 9, 8, 8] },
    { id: 'smartPlug', name: 'Smart Plug (Various)', consumption: [12, 11, 13, 14, 16, 15, 18, 17, 16, 14, 13, 12], production: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'evCharger', name: 'EV Charger (Home)', consumption: [30, 28, 32, 40, 45, 50, 55, 48, 42, 35, 32, 30], production: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'smartFridge', name: 'Smart Fridge', consumption: [9, 9, 10, 10, 11, 11, 12, 12, 11, 10, 9, 9], production: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'pvInverter', name: 'Roof PV Inverter (shared)', consumption: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], production: [40, 45, 50, 60, 65, 70, 72, 68, 60, 50, 45, 42] }
];

const MONTHS = (() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toLocaleString(undefined, { month: 'short', year: '2-digit' }));
    }
    return months;
})();

const deviceListEl = document.getElementById('deviceList');
const metricSelect = document.getElementById('metricSelect');
const monthsRange = document.getElementById('monthsRange');
const monthsCount = document.getElementById('monthsCount');
const exportCsvBtn = document.getElementById('exportCsv');
const resetBtn = document.getElementById('resetFilters');

DATA.forEach(d => {
    const id = 'chk_' + d.id;
    const wrapper = document.createElement('label');
    wrapper.className = 'flex items-center gap-2 p-1 rounded hover:bg-[#ecfdf5]';
    wrapper.innerHTML = `<input type="checkbox" id="${id}" data-device="${d.id}" checked class="w-4 h-4"> <span>${d.name}</span>`;
    deviceListEl.appendChild(wrapper);
});

let barChart, lineChart, doughnutChart;

function reduceLastN(arr, n) {
    return arr.slice(arr.length - n);
}

function buildCharts() {
    const n = parseInt(monthsRange.value);
    const labels = MONTHS.slice(MONTHS.length - n);

    const selectedDevices = Array.from(document.querySelectorAll('#deviceList input[type=checkbox]'))
        .filter(ch => ch.checked).map(ch => ch.dataset.device);

    const consumptionSeries = new Array(n).fill(0);
    const productionSeries = new Array(n).fill(0);

    selectedDevices.forEach(id => {
        const dev = DATA.find(d => d.id === id);
        const c = reduceLastN(dev.consumption, n);
        const p = reduceLastN(dev.production, n);
        for (let i = 0; i < n; i++) {
            consumptionSeries[i] += c[i] || 0;
            productionSeries[i] += p[i] || 0;
        }
    });

    const metric = metricSelect.value;

    if (barChart) barChart.destroy();
    if (lineChart) lineChart.destroy();
    if (doughnutChart) doughnutChart.destroy();

    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Consumption (kWh)', data: metric === 'production' ? new Array(n).fill(0) : consumptionSeries, backgroundColor: '#1a9f55' },
                { label: 'Production (kWh)', data: metric === 'consumption' ? new Array(n).fill(0) : productionSeries, backgroundColor: '#f2c94c' }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
    });

    const lineCtx = document.getElementById('lineChart').getContext('2d');
    const palette = ['#1a9f55', '#f2c94c', '#2c5282', '#d97706', '#0f766e', '#b91c1c'];

    const lineDatasets = selectedDevices.map((id, idx) => {
        const dev = DATA.find(d => d.id === id);
        const c = reduceLastN(dev.consumption, n);
        const p = reduceLastN(dev.production, n);
        const tot = c.map((v, i) => (v || 0) + (p[i] || 0));
        return { label: dev.name, data: tot, borderColor: palette[idx % palette.length], tension: 0.3, fill: false };
    });

    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: { labels, datasets: lineDatasets },
        options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    const totalConsumption = consumptionSeries.reduce((a, b) => a + b, 0);
    const totalProduction = productionSeries.reduce((a, b) => a + b, 0);
    const doughnutCtx = document.getElementById('doughnutChart').getContext('2d');
    doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Consumption', 'Production'],
            datasets: [{ data: [totalConsumption, totalProduction], backgroundColor: ['#1a9f55', '#f2c94c'] }],
        },
        options: { responsive: true }
    });

    populateTable(selectedDevices, n, consumptionSeries, productionSeries);
}

function populateTable(selectedDevices, n, consumptionSeries, productionSeries) {
    const tbody = document.querySelector('#dataTable tbody');
    tbody.innerHTML = '';
    selectedDevices.forEach(id => {
        const dev = DATA.find(d => d.id === id);
        const c = reduceLastN(dev.consumption, n).reduce((a, b) => a + (b || 0), 0);
        const p = reduceLastN(dev.production, n).reduce((a, b) => a + (b || 0), 0);
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="px-4 py-2">${dev.name}</td><td class="px-4 py-2 text-right">${c.toFixed(1)}</td><td class="px-4 py-2 text-right">${p.toFixed(1)}</td>`;
        tbody.appendChild(tr);
    });

    const totalC = consumptionSeries.reduce((a, b) => a + b, 0);
    const totalP = productionSeries.reduce((a, b) => a + b, 0);
    const tr = document.createElement('tr');
    tr.className = 'border-t';
    tr.innerHTML = `<td class="px-4 py-2 font-medium">Total (last ${n} months)</td><td class="px-4 py-2 text-right font-medium">${totalC.toFixed(1)}</td><td class="px-4 py-2 text-right font-medium">${totalP.toFixed(1)}</td>`;
    tbody.appendChild(tr);
}

function exportCsv() {
    const n = parseInt(monthsRange.value);
    const headers = ['Device', 'Metric', 'Month', 'Value_kWh'];
    const rows = [];
    const labels = MONTHS.slice(MONTHS.length - n);
    DATA.forEach(d => {
        labels.forEach((m, i) => {
            rows.push([d.name, 'Consumption', m, (d.consumption[d.consumption.length - n + i] || 0)]);
        });
        labels.forEach((m, i) => {
            rows.push([d.name, 'Production', m, (d.production[d.production.length - n + i] || 0)]);
        });
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suraj_energy_data.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

metricSelect.addEventListener('change', buildCharts);
monthsRange.addEventListener('input', () => {
    monthsCount.textContent = monthsRange.value;
    buildCharts();
});
deviceListEl.addEventListener('change', buildCharts);
exportCsvBtn.addEventListener('click', exportCsv);
resetBtn.addEventListener('click', () => {
    metricSelect.value = 'both';
    monthsRange.value = 12;
    monthsCount.textContent = 12;
    document.querySelectorAll('#deviceList input[type=checkbox]').forEach(ch => ch.checked = true);
    buildCharts();
});

window.addEventListener('load', buildCharts);