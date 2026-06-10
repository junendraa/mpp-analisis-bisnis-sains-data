/**
 * ============================================================
 *  APP.JS - Main Dashboard Controller & Statistical Math Engine
 *  Handles sidebar page navigation, randomized client-side sampling,
 *  statistical Z-testing, and dynamic Chart.js rendering.
 *  ============================================================
 */

// Global Dashboard Data Reference
const D = DASHBOARD_DATA;

// Corporate Color Palette for Marketing Channels
const CHANNEL_COLORS = {
    'ppc':          '#3b82f6', // Corporate blue
    'referral':     '#a855f7', // Purple
    'email':        '#06b6d4', // Cyan
    'seo':          '#10b981', // Green
    'social media': '#f59e0b', // Amber/Yellow
};

const CHANNEL_COLORS_ALPHA = (ch, a = 0.2) => {
    const hex = CHANNEL_COLORS[ch] || '#3b82f6';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const CHANNELS = ['ppc', 'referral', 'email', 'seo', 'social media'];
const CHANNEL_LABELS = {
    'ppc':          'PPC',
    'referral':     'Referral',
    'email':        'Email',
    'seo':          'SEO',
    'social media': 'Social Media'
};

// Set Light-Themed Chart.js Visual Defaults
Chart.defaults.color = '#475569'; // Slate 600 for text labels
Chart.defaults.borderColor = '#e2e8f0'; // Slate 200 for gridlines
Chart.defaults.font.family = 'Inter';

const chartInstances = {};

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

function mkChart(id, config) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    chartInstances[id] = new Chart(ctx, config);
    return chartInstances[id];
}

// Formatting Utilities
function fmt(n, dec = 2) { 
    return (+n).toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec }); 
}
function fmtPct(n) { 
    return (n * 100).toFixed(2) + '%'; 
}
function fmtMoney(n) { 
    return 'Rp ' + (+n).toLocaleString('id-ID'); 
}

// ==================== SIDEBAR NAVIGATION ====================
function navigate(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
    
    const targetPage = document.getElementById('page-' + page);
    const targetNav = document.getElementById('nav-' + page);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    if (page === 'overview' && !chartInstances['chartChannelDist']) renderOverview();
    if (page === 'eda' && !chartInstances['chartAgeHist']) renderEDA();
    if (page === 'testing') refreshTestingPage();
}

// Expose navigate globally so inline HTML clicks work (e.g. warning banners)
window.navigate = navigate;

// ==================== PAGE 1: OVERVIEW ====================
function renderOverview() {
    const ov = D.overall;
    
    // Dynamically Populate Overall KPI Blocks
    const kpis = [
        { icon: '👥', color: 'accent', value: ov.total.toLocaleString('id-ID'), label: 'Total Users', sub: 'Dalam Dataset' },
        { icon: '✅', color: 'green', value: fmtPct(ov.cr), label: 'Overall Conversion Rate', sub: `${ov.converted.toLocaleString('id-ID')} users converted` },
        { icon: '💰', color: 'yellow', value: 'Rp ' + (ov.total_spend / 1e6).toFixed(1) + 'M', label: 'Total Ad Spend', sub: 'Semua Channel' },
        { icon: '🖱️', color: 'cyan', value: fmtPct(ov.avg_ctr), label: 'Avg Click-Through Rate', sub: `CVR: ${fmtPct(ov.avg_cvr)}` },
    ];
    
    const kpiContainer = document.getElementById('kpiGrid');
    if (kpiContainer) {
        kpiContainer.innerHTML = kpis.map(k => `
            <div class="kpi-card ${k.color}">
                <div class="kpi-icon ${k.color}">${k.icon}</div>
                <div class="kpi-value ${k.color}">${k.value}</div>
                <div class="kpi-label">${k.label}</div>
                <div class="kpi-sub">${k.sub}</div>
            </div>`).join('');
    }

    const labels = CHANNELS.map(c => CHANNEL_LABELS[c]);
    const colors = CHANNELS.map(c => CHANNEL_COLORS[c]);
    const colorsAlpha = CHANNELS.map(c => CHANNEL_COLORS_ALPHA(c, 0.25));

    // Channel Distribution Doughnut
    mkChart('chartChannelDist', {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ 
                data: CHANNELS.map(c => D.channel_stats[c]?.total || 0), 
                backgroundColor: colors, 
                borderColor: '#ffffff', 
                borderWidth: 2, 
                hoverOffset: 8 
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'right', 
                    labels: { boxWidth: 12, padding: 16, font: { size: 11 } } 
                } 
            }, 
            cutout: '60%' 
        }
    });

    // Conversion Rate per Channel Bar
    mkChart('chartChannelCR', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Conversion Rate',
                data: CHANNELS.map(c => +(D.channel_stats[c]?.cr * 100 || 0).toFixed(2)),
                backgroundColor: colorsAlpha,
                borderColor: colors,
                borderWidth: 2, 
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, min: 85, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Average Ad Spend Bar
    mkChart('chartAdSpend', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Avg AdSpend (Rp)',
                data: CHANNELS.map(c => +(D.channel_stats[c]?.avg_spend || 0).toFixed(0)),
                backgroundColor: colorsAlpha,
                borderColor: colors,
                borderWidth: 2, 
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { callback: v => 'Rp ' + (v / 1000).toFixed(0) + 'K' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Click-Through Rate per Channel Bar
    mkChart('chartCTR', {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Avg CTR',
                data: CHANNELS.map(c => +(D.channel_stats[c]?.avg_ctr * 100 || 0).toFixed(2)),
                backgroundColor: colorsAlpha,
                borderColor: colors,
                borderWidth: 2, 
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, min: 14.5, max: 16.5, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Campaign Type Distribution Doughnut
    const types = Object.keys(D.type_stats);
    const typeColors = ['#3b82f6', '#a855f7', '#06b6d4', '#10b981'];
    mkChart('chartTypeDist', {
        type: 'doughnut',
        data: {
            labels: types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{ 
                data: types.map(t => D.type_stats[t].total), 
                backgroundColor: typeColors, 
                borderColor: '#ffffff', 
                borderWidth: 2, 
                hoverOffset: 8 
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'right', 
                    labels: { boxWidth: 12, padding: 16, font: { size: 11 } } 
                } 
            }, 
            cutout: '60%' 
        }
    });

    // Conversion Rate per Campaign Type Bar
    mkChart('chartTypeCR', {
        type: 'bar',
        data: {
            labels: types.map(t => t.charAt(0).toUpperCase() + t.slice(1)),
            datasets: [{
                label: 'Conversion Rate',
                data: types.map(t => +(D.type_stats[t].cr * 100).toFixed(2)),
                backgroundColor: typeColors.map(c => c + '44'),
                borderColor: typeColors,
                borderWidth: 2, 
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, min: 85, ticks: { callback: v => v + '%' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ==================== PAGE 2: A/B SAMPLE SETUP ====================
let sampledData = null;

function onSetupChange() {
    const ctrl = document.getElementById('selectControl').value;
    const treat = document.getElementById('selectTreatment').value;
    const cs = D.channel_stats;
    
    document.getElementById('controlTotal').textContent = cs[ctrl]?.total?.toLocaleString('id-ID') || '—';
    document.getElementById('treatmentTotal').textContent = cs[treat]?.total?.toLocaleString('id-ID') || '—';
    
    if (ctrl === treat) {
        document.getElementById('controlInfo').style.borderColor = '#ef4444';
        document.getElementById('treatmentInfo').style.borderColor = '#ef4444';
    } else {
        document.getElementById('controlInfo').style.borderColor = '';
        document.getElementById('treatmentInfo').style.borderColor = '';
    }
    
    document.getElementById('samplingResults').style.display = 'none';
    sampledData = null;
}

function onSampleSizeChange() {
    const v = document.getElementById('sampleSizeRange').value;
    document.getElementById('sampleSizeLabel').textContent = (+v).toLocaleString('id-ID');
    document.getElementById('sampleCounterA').textContent = (+v).toLocaleString('id-ID');
    document.getElementById('sampleCounterB').textContent = (+v).toLocaleString('id-ID');
    document.getElementById('totalSampleCounter').textContent = (2 * +v).toLocaleString('id-ID');
}

// Fisher-Yates Shuffling Helper
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function runSampling() {
    const ctrl = document.getElementById('selectControl').value;
    const treat = document.getElementById('selectTreatment').value;
    
    if (ctrl === treat) { 
        alert('Grup A dan Grup B tidak boleh sama!'); 
        return; 
    }
    
    const n = +document.getElementById('sampleSizeRange').value;
    const btn = document.getElementById('btnRunSampling');
    
    btn.innerHTML = '<span class="spin-sm"></span> Sampling...';
    btn.disabled = true;

    // Simulate database network delay
    setTimeout(() => {
        const ctrlRecords = shuffle(D.records.filter(r => r.channel === ctrl)).slice(0, n);
        const treatRecords = shuffle(D.records.filter(r => r.channel === treat)).slice(0, n);

        function groupStats(recs) {
            const N = recs.length;
            const conv = recs.filter(r => r.conv === 1).length;
            const cr = conv / N;
            const avgSpend = recs.reduce((s, r) => s + r.spend, 0) / N;
            const avgCtr = recs.reduce((s, r) => s + r.ctr, 0) / N;
            const avgCvr = recs.reduce((s, r) => s + r.cvr, 0) / N;
            const avgVisits = recs.reduce((s, r) => s + r.visits, 0) / N;
            const avgTime = recs.reduce((s, r) => s + r.time, 0) / N;
            const avgLoyalty = recs.reduce((s, r) => s + r.loyalty, 0) / N;
            return { N, conv, cr, avgSpend, avgCtr, avgCvr, avgVisits, avgTime, avgLoyalty };
        }

        const A = groupStats(ctrlRecords);
        const B = groupStats(treatRecords);

        sampledData = { ctrl, treat, n, A, B, ctrlRecords, treatRecords };

        // Generate metrics comparison rows
        const rows = [
            ['Sample Size (N)', A.N, B.N, null],
            ['Converted', A.conv, B.conv, B.conv - A.conv],
            ['Conversion Rate', fmtPct(A.cr), fmtPct(B.cr), ((B.cr - A.cr) * 100).toFixed(3) + 'pp'],
            ['Avg Ad Spend', 'Rp ' + fmt(A.avgSpend, 0), 'Rp ' + fmt(B.avgSpend, 0), null],
            ['Avg CTR', fmtPct(A.avgCtr), fmtPct(B.avgCtr), ((B.avgCtr - A.avgCtr) * 100).toFixed(3) + 'pp'],
            ['Avg Time on Site', fmt(A.avgTime) + 'm', fmt(B.avgTime) + 'm', null],
            ['Avg Loyalty Points', fmt(A.avgLoyalty, 0), fmt(B.avgLoyalty, 0), null],
        ];
        
        document.getElementById('samplingTableBody').innerHTML = rows.map(r => {
            const diff = r[3];
            let diffCell = '—';
            if (diff !== null) {
                const isNum = typeof diff === 'number';
                const v = isNum ? diff : parseFloat(diff);
                const cls = isNaN(v) ? 'neu' : v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu';
                const prefix = isNaN(v) ? '' : v > 0 ? '+' : '';
                diffCell = `<span class="val-diff ${cls}">${prefix}${diff}</span>`;
            }
            return `<tr>
                <td style="color:var(--color-text-muted)">${r[0]}</td>
                <td class="val-control">${r[1]}</td>
                <td class="val-treatment">${r[2]}</td>
                <td>${diffCell}</td>
            </tr>`;
        }).join('');

        // Sampling Comparison Charts
        destroyChart('chartSamplingCR'); 
        destroyChart('chartSamplingSpend'); 
        destroyChart('chartSamplingCTR');
        
        const ctrlLabel = CHANNEL_LABELS[ctrl];
        const treatLabel = CHANNEL_LABELS[treat];

        mkChart('chartSamplingCR', {
            type: 'bar',
            data: {
                labels: [ctrlLabel + ' (Kontrol A)', treatLabel + ' (Treatment B)'],
                datasets: [{
                    label: 'Conversion Rate (%)',
                    data: [+(A.cr * 100).toFixed(3), +(B.cr * 100).toFixed(3)],
                    backgroundColor: [CHANNEL_COLORS_ALPHA(ctrl, 0.4), CHANNEL_COLORS_ALPHA(treat, 0.4)],
                    borderColor: [CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]],
                    borderWidth: 2, 
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: false, min: Math.max(0, Math.min(A.cr, B.cr) * 100 - 3), ticks: { callback: v => v.toFixed(1) + '%' } }, 
                    x: { grid: { display: false } } 
                }
            }
        });

        mkChart('chartSamplingSpend', {
            type: 'bar',
            data: {
                labels: [ctrlLabel, treatLabel],
                datasets: [{ 
                    label: 'Avg AdSpend', 
                    data: [+A.avgSpend.toFixed(0), +B.avgSpend.toFixed(0)], 
                    backgroundColor: [CHANNEL_COLORS_ALPHA(ctrl, 0.4), CHANNEL_COLORS_ALPHA(treat, 0.4)], 
                    borderColor: [CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]], 
                    borderWidth: 2, 
                    borderRadius: 6 
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }, 
                scales: { 
                    y: { ticks: { callback: v => 'Rp ' + (v / 1000).toFixed(0) + 'K' } }, 
                    x: { grid: { display: false } } 
                } 
            }
        });

        mkChart('chartSamplingCTR', {
            type: 'bar',
            data: {
                labels: [ctrlLabel, treatLabel],
                datasets: [{ 
                    label: 'Avg CTR', 
                    data: [+(A.avgCtr * 100).toFixed(3), +(B.avgCtr * 100).toFixed(3)], 
                    backgroundColor: [CHANNEL_COLORS_ALPHA(ctrl, 0.4), CHANNEL_COLORS_ALPHA(treat, 0.4)], 
                    borderColor: [CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]], 
                    borderWidth: 2, 
                    borderRadius: 6 
                }]
            },
            options: { 
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }, 
                scales: { 
                    y: { ticks: { callback: v => v.toFixed(1) + '%' } }, 
                    x: { grid: { display: false } } 
                } 
            }
        });

        // Narrative Description Builder
        const diff = ((B.cr - A.cr) * 100).toFixed(3);
        const higher = B.cr >= A.cr ? `<strong style="color:#a855f7">${treatLabel} (Treatment B)</strong>` : `<strong style="color:var(--color-accent-blue)">${ctrlLabel} (Kontrol A)</strong>`;
        
        document.getElementById('experimentNarrative').innerHTML = `
            Dalam eksperimen ini, dari total populasi data historis, dilakukan <strong style="color:var(--color-text-main)">random sampling</strong> sebanyak 
            <strong style="color:var(--color-accent-blue)">${n} sampel</strong> untuk setiap grup guna menghilangkan bias karakteristik user.<br/><br/>
            <strong style="color:var(--color-accent-blue)">Grup A (Kontrol — ${ctrlLabel})</strong> merepresentasikan campaign channel yang sudah berjalan/existing.
            Dari ${n} sampel acak, sebanyak <strong>${A.conv} user (${fmtPct(A.cr)})</strong> berhasil melakukan konversi.<br/><br/>
            <strong style="color:#a855f7">Grup B (Treatment — ${treatLabel})</strong> merepresentasikan campaign channel alternatif yang ingin diuji.
            Dari ${n} sampel acak, sebanyak <strong>${B.conv} user (${fmtPct(B.cr)})</strong> berhasil melakukan konversi.<br/><br/>
            Perbedaan Conversion Rate antara kedua grup adalah <strong style="color:var(--color-text-main)">${diff > 0 ? '+' : ''}${diff} percentage point</strong>,
            dengan ${higher} menunjukkan angka yang lebih tinggi. Untuk menentukan apakah perbedaan ini 
            <em>signifikan secara statistik</em>, silakan lanjutkan ke tab <strong>Statistical Testing</strong>.
        `;

        document.getElementById('samplingTimestamp').textContent = 'Dijalankan: ' + new Date().toLocaleTimeString('id-ID');
        document.getElementById('samplingResults').style.display = 'block';
        document.getElementById('samplingResults').scrollIntoView({ behavior: 'smooth', block: 'start' });

        btn.innerHTML = '<span>🎲</span> Jalankan Random Sampling';
        btn.disabled = false;
    }, 600);
}

function resetSampling() {
    document.getElementById('sampleSizeRange').value = 500;
    onSampleSizeChange();
    document.getElementById('selectControl').value = 'ppc';
    document.getElementById('selectTreatment').value = 'referral';
    onSetupChange();
    sampledData = null;
    document.getElementById('samplingResults').style.display = 'none';
}

// Expose functions globally for range change / selector triggers
window.onSetupChange = onSetupChange;
window.onSampleSizeChange = onSampleSizeChange;
window.runSampling = runSampling;
window.resetSampling = resetSampling;

// ==================== PAGE 3: STATISTICAL TESTING (Z-TEST ENGINE) ====================
function normalPDF(x) { 
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI); 
}

// Approximation of normal cumulative distribution function
function normalCDF(z) {
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const sign = z < 0 ? -1 : 1;
    const absz = Math.abs(z);
    const t = 1 / (1 + p * absz);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absz * absz);
    return 0.5 * (1 + sign * y);
}

// Proportions Z-Test engine
function zTestProportions(x1, n1, x2, n2) {
    const p1 = x1 / n1, p2 = x2 / n2;
    const p_pool = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2));
    const z = (p1 - p2) / se;
    const pval = 2 * (1 - normalCDF(Math.abs(z)));
    const se2 = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
    const ci_lo = (p1 - p2) - 1.96 * se2;
    const ci_hi = (p1 - p2) + 1.96 * se2;
    const cohens_h = 2 * (Math.asin(Math.sqrt(p1)) - Math.asin(Math.sqrt(p2)));
    return { p1, p2, z, pval, ci_lo, ci_hi, se, p_pool, cohens_h };
}

function refreshTestingPage() {
    if (!sampledData) {
        document.getElementById('noSamplingWarning').style.display = 'block';
        document.getElementById('testingContent').style.display = 'none';
        return;
    }
    
    document.getElementById('noSamplingWarning').style.display = 'none';
    document.getElementById('testingContent').style.display = 'block';

    const { ctrl, treat, A, B } = sampledData;
    const ctrlLabel = CHANNEL_LABELS[ctrl];
    const treatLabel = CHANNEL_LABELS[treat];
    
    const res = zTestProportions(A.conv, A.N, B.conv, B.N);
    const significant = res.pval < 0.05;

    // Set hypothesis formulations
    document.getElementById('h0Text').textContent = `Tidak ada perbedaan signifikan antara Conversion Rate ${ctrlLabel} (Kontrol A) dan ${treatLabel} (Treatment B) — p_A = p_B`;
    document.getElementById('h1Text').textContent = `Terdapat perbedaan signifikan antara Conversion Rate ${ctrlLabel} dan ${treatLabel} — p_A ≠ p_B (two-tailed, α = 0.05)`;

    // Populate result indicator cards
    document.getElementById('rcZScore').textContent = res.z.toFixed(4);
    document.getElementById('rcPValue').textContent = res.pval < 0.0001 ? '< 0.0001' : res.pval.toFixed(4);
    document.getElementById('rcPValue').className = 'rc-value ' + (significant ? 'good' : 'neutral');
    document.getElementById('rcCI').textContent = `[${(res.ci_lo * 100).toFixed(3)}%, ${(res.ci_hi * 100).toFixed(3)}%]`;
    
    const h = Math.abs(res.cohens_h);
    document.getElementById('rcEffect').textContent = res.cohens_h.toFixed(4);
    document.getElementById('rcEffect').className = 'rc-value ' + (h < 0.2 ? 'neutral' : h < 0.5 ? 'info' : 'good');

    // Build conclusion box message
    const conclBox = document.getElementById('conclusionBox');
    if (significant) {
        conclBox.className = 'conclusion-box significant';
        document.getElementById('conclusionIcon').textContent = '✅';
        document.getElementById('conclusionTitle').textContent = `Tolak H₀ — Perbedaan Signifikan Secara Statistik (p = ${res.pval.toFixed(4)})`;
        const winner = res.p1 > res.p2 ? ctrlLabel : treatLabel;
        document.getElementById('conclusionText').innerHTML = `Dengan p-value ${res.pval.toFixed(4)} &lt; α (0.05), kita <strong>menolak H₀</strong>. Terdapat bukti statistik yang cukup bahwa perbedaan Conversion Rate antara ${ctrlLabel} dan ${treatLabel} bukan karena kebetulan (random chance). <strong>${winner}</strong> terbukti lebih efektif secara statistik.`;
    } else {
        conclBox.className = 'conclusion-box not-significant';
        document.getElementById('conclusionIcon').textContent = '⚠️';
        document.getElementById('conclusionTitle').textContent = `Gagal Tolak H₀ — Perbedaan Tidak Signifikan (p = ${res.pval < 0.0001 ? '< 0.0001' : res.pval.toFixed(4)})`;
        document.getElementById('conclusionText').innerHTML = `Dengan p-value ${res.pval < 0.0001 ? '< 0.0001' : res.pval.toFixed(4)} ≥ α (0.05), kita <strong>gagal menolak H₀</strong>. Tidak ada bukti statistik yang cukup untuk menyimpulkan bahwa perbedaan Conversion Rate antara ${ctrlLabel} dan ${treatLabel} signifikan. Keputusan pemilihan channel sebaiknya didasarkan pada biaya (Cost per Conversion), bukan hanya CR.`;
    }

    // Calculation details table content
    document.getElementById('calcTable').querySelector('tbody').innerHTML = [
        ['Channel A (Kontrol)', ctrlLabel],
        ['Channel B (Treatment)', treatLabel],
        ['Sampel A (n₁)', A.N],
        ['Sampel B (n₂)', B.N],
        ['Converted A (x₁)', A.conv],
        ['Converted B (x₂)', B.conv],
        ['p̂₁ (CR Grup A)', fmtPct(res.p1)],
        ['p̂₂ (CR Grup B)', fmtPct(res.p2)],
        ['Selisih (p̂₁ - p̂₂)', ((res.p1 - res.p2) * 100).toFixed(3) + 'pp'],
        ['p̂ Pool', res.p_pool.toFixed(6)],
        ['SE (Pooled)', res.se.toFixed(6)],
        ['Z-Statistic', res.z.toFixed(4)],
        ['Z-Critical (α=0.05)', '±1.96'],
        ['P-Value (two-tailed)', res.pval < 0.0001 ? '< 0.0001' : res.pval.toFixed(6)],
        ['Kesimpulan', significant ? '✅ Tolak H₀' : '⚠️ Gagal Tolak H₀'],
    ].map(([k, v]) => `<tr><td style="color:var(--color-text-muted);font-size:12.5px">${k}</td><td style="font-weight:600;font-size:13px;text-align:right;color:var(--color-text-main);">${v}</td></tr>`).join('');

    // Rejection curve plotting
    destroyChart('chartBellCurve');
    const zArr = [], yArr = [], zVal = res.z;
    for (let x = -4; x <= 4; x += 0.05) { 
        zArr.push(+x.toFixed(2)); 
        yArr.push(normalPDF(x)); 
    }
    const critZ = 1.96;
    
    mkChart('chartBellCurve', {
        type: 'line',
        data: {
            labels: zArr,
            datasets: [
                {
                    label: 'Normal Distribution',
                    data: zArr.map(x => normalPDF(x)),
                    borderColor: '#3b82f6', 
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    fill: true, 
                    tension: 0.4, 
                    pointRadius: 0, 
                    borderWidth: 2,
                },
                {
                    label: 'Rejection Region (α=0.05)',
                    data: zArr.map(x => (Math.abs(x) >= critZ) ? normalPDF(x) : null),
                    borderColor: '#ef4444', 
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    fill: true, 
                    tension: 0.4, 
                    pointRadius: 0, 
                    borderWidth: 0,
                },
                {
                    label: `Z-Score = ${zVal.toFixed(3)}`,
                    data: zArr.map(x => (Math.abs(x - Math.abs(zVal)) < 0.03) ? normalPDF(x) : null),
                    borderColor: '#f59e0b', 
                    backgroundColor: 'rgba(245, 158, 11, 0.7)',
                    fill: true, 
                    tension: 0, 
                    pointRadius: 0, 
                    borderWidth: 0,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { labels: { boxWidth: 12, font: { size: 10 } } }, 
                tooltip: { mode: 'index', intersect: false } 
            },
            scales: {
                x: { ticks: { maxTicksLimit: 9, callback: (v, i) => zArr[i] }, title: { display: true, text: 'Z-Score' } },
                y: { title: { display: true, text: 'Probability Density' } }
            }
        }
    });

    // Sub-proportion bar plotting
    destroyChart('chartTestCR');
    mkChart('chartTestCR', {
        type: 'bar',
        data: {
            labels: [`${ctrlLabel} (Kontrol A)\nn=${A.N}`, `${treatLabel} (Treatment B)\nn=${B.N}`],
            datasets: [{
                label: 'Conversion Rate',
                data: [+(res.p1 * 100).toFixed(3), +(res.p2 * 100).toFixed(3)],
                backgroundColor: [CHANNEL_COLORS_ALPHA(ctrl, 0.5), CHANNEL_COLORS_ALPHA(treat, 0.5)],
                borderColor: [CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]],
                borderWidth: 2, 
                borderRadius: 10,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }, 
                tooltip: { callbacks: { label: ctx => ` Conversion Rate: ${ctx.parsed.y.toFixed(3)}%` } } 
            },
            scales: {
                y: { beginAtZero: false, min: Math.max(0, Math.min(res.p1, res.p2) * 100 - 5), ticks: { callback: v => v.toFixed(2) + '%' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ==================== PAGE 4: EXPLORATORY DATA ANALYSIS (EDA) ====================
function renderEDA() {
    // 1. Age distribution histogram
    mkChart('chartAgeHist', {
        type: 'bar',
        data: {
            labels: D.age_hist.labels,
            datasets: [{
                label: 'Jumlah Users',
                data: D.age_hist.values,
                backgroundColor: D.age_hist.values.map((_, i) => `hsl(${220 + i * 3}, 75%, ${50 + i * 0.5}%)`),
                borderRadius: 4,
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }, 
            scales: { 
                y: { title: { display: true, text: 'Jumlah Users' } }, 
                x: { title: { display: true, text: 'Usia' }, ticks: { maxRotation: 45 } } 
            } 
        }
    });

    // 2. Conversion targets ratio doughnut
    const convCount = D.records.filter(r => r.conv === 1).length;
    const noConvCount = D.records.length - convCount;
    mkChart('chartConvDist', {
        type: 'doughnut',
        data: {
            labels: ['Converted (1)', 'Not Converted (0)'],
            datasets: [{ 
                data: [convCount, noConvCount], 
                backgroundColor: ['#10b981', 'rgba(239, 68, 68, 0.25)'], 
                borderColor: ['#10b981', '#ef4444'], 
                borderWidth: 2, 
                hoverOffset: 8 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toLocaleString('id-ID')} (${(ctx.parsed / D.records.length * 100).toFixed(1)}%)` } }
            }, 
            cutout: '55%'
        }
    });

    // 3. Ad Spend Boxplot-style visualization
    const chLabels = CHANNELS.map(c => CHANNEL_LABELS[c]);
    mkChart('chartBoxSpend', {
        type: 'bar',
        data: {
            labels: chLabels,
            datasets: [
                {
                    label: 'IQR (Q1-Q3)',
                    data: CHANNELS.map(c => {
                        const s = D.adspend_by_channel[c];
                        return [s.q1 / 1000, s.q3 / 1000];
                    }),
                    backgroundColor: CHANNELS.map(c => CHANNEL_COLORS_ALPHA(c, 0.4)),
                    borderColor: CHANNELS.map(c => CHANNEL_COLORS[c]),
                    borderWidth: 2, 
                    borderRadius: 4,
                },
                {
                    label: 'Median',
                    data: CHANNELS.map(c => D.adspend_by_channel[c].median / 1000),
                    type: 'line', 
                    borderColor: '#f59e0b', 
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderWidth: 2, 
                    pointRadius: 6, 
                    pointBackgroundColor: '#f59e0b',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 12, font: { size: 10 } } } },
            scales: { y: { title: { display: true, text: 'Ad Spend (Ribu Rp)' } }, x: { grid: { display: false } } }
        }
    });

    // 4. Gender segments conversions stacked bar
    const genders = Object.keys(D.gender_stats);
    mkChart('chartGenderCR', {
        type: 'bar',
        data: {
            labels: genders,
            datasets: [
                { 
                    label: 'Converted', 
                    data: genders.map(g => D.gender_stats[g].converted), 
                    backgroundColor: 'rgba(59, 130, 246, 0.6)', 
                    borderColor: '#3b82f6', 
                    borderWidth: 2, 
                    borderRadius: 6 
                },
                { 
                    label: 'Not Converted', 
                    data: genders.map(g => D.gender_stats[g].total - D.gender_stats[g].converted), 
                    backgroundColor: 'rgba(239, 68, 68, 0.3)', 
                    borderColor: '#ef4444', 
                    borderWidth: 2, 
                    borderRadius: 6 
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 12, font: { size: 10 } } } },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true } }
        }
    });

    // 5. Drawing the interactive Correlation Heatmap
    renderCorrHeatmap();

    // 6. Website Visits vs Time-on-site grouped chart
    mkChart('chartVisitsTime', {
        type: 'bar',
        data: {
            labels: chLabels,
            datasets: [
                { 
                    label: 'Avg Website Visits', 
                    data: CHANNELS.map(c => D.channel_stats[c].avg_visits.toFixed(2)), 
                    backgroundColor: 'rgba(59, 130, 246, 0.5)', 
                    borderColor: '#3b82f6', 
                    borderWidth: 2, 
                    borderRadius: 5, 
                    yAxisID: 'y' 
                },
                { 
                    label: 'Avg Time on Site (min)', 
                    data: CHANNELS.map(c => D.channel_stats[c].avg_time.toFixed(2)), 
                    backgroundColor: 'rgba(168, 85, 247, 0.5)', 
                    borderColor: '#a855f7', 
                    borderWidth: 2, 
                    borderRadius: 5, 
                    yAxisID: 'y1' 
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 12, font: { size: 10 } } } },
            scales: {
                x: { grid: { display: false } },
                y: { type: 'linear', position: 'left', title: { display: true, text: 'Website Visits' } },
                y1: { type: 'linear', position: 'right', title: { display: true, text: 'Time on Site (min)' }, grid: { drawOnChartArea: false } }
            }
        }
    });

    // 7. Email Open vs Email Clicks grouped bar
    mkChart('chartEmailEng', {
        type: 'bar',
        data: {
            labels: chLabels,
            datasets: [
                { 
                    label: 'Avg Email Opens', 
                    data: CHANNELS.map(c => { 
                        const recs = D.records.filter(r => r.channel === c); 
                        return (recs.reduce((s, r) => s + r.email_opens, 0) / recs.length).toFixed(2); 
                    }), 
                    backgroundColor: 'rgba(6, 182, 212, 0.5)', 
                    borderColor: '#06b6d4', 
                    borderWidth: 2, 
                    borderRadius: 5 
                },
                { 
                    label: 'Avg Email Clicks', 
                    data: CHANNELS.map(c => { 
                        const recs = D.records.filter(r => r.channel === c); 
                        return (recs.reduce((s, r) => s + r.email_clicks, 0) / recs.length).toFixed(2); 
                    }), 
                    backgroundColor: 'rgba(16, 185, 129, 0.5)', 
                    borderColor: '#10b981', 
                    borderWidth: 2, 
                    borderRadius: 5 
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 12, font: { size: 10 } } } },
            scales: { x: { grid: { display: false } } }
        }
    });
}

function renderCorrHeatmap() {
    const labels = D.corr.labels;
    const matrix = D.corr.matrix;
    const n = labels.length;
    const canvas = document.getElementById('chartCorr');
    
    if (!canvas) return;
    
    // Make heatmap width responsive to card container
    canvas.width = canvas.offsetParent?.offsetWidth || 700;
    canvas.height = 400;
    
    const ctx = canvas.getContext('2d');
    
    const paddingLeft = 100;
    const paddingBottom = 60;
    const paddingTop = 10;
    const paddingRight = 10;
    
    const gridW = canvas.width - paddingLeft - paddingRight;
    const gridH = canvas.height - paddingTop - paddingBottom;
    
    const cellW = gridW / n;
    const cellH = gridH / n;

    // Find max absolute value (excluding 1) to normalize color scale
    let maxV = 0.01;
    for (let r of matrix) {
        for (let c of r) {
            if (Math.abs(c) < 0.99 && Math.abs(c) > maxV) {
                maxV = Math.abs(c);
            }
        }
    }

    function corrColor(v) {
        if (Math.abs(v) > 0.99) {
            return v > 0 ? '#3b82f6' : '#ef4444'; // Solid blue or red for 1.0 or -1.0
        }
        // Normalize intensity based on the maximum correlation found (excluding 1)
        // This makes even small correlations like 0.02 visible.
        const intensity = 0.15 + (Math.abs(v) / maxV) * 0.85;
        if (v > 0) { 
            return `rgba(59, 130, 246, ${intensity})`; // Blue scale
        } else if (v < 0) { 
            return `rgba(239, 68, 68, ${intensity})`; // Red scale
        } else {
            return `rgba(240, 244, 248, 0.5)`; // Neutral/Zero
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw cells
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const v = matrix[i][j];
            const x = paddingLeft + j * cellW;
            const y = paddingTop + i * cellH;
            
            ctx.fillStyle = corrColor(v);
            ctx.fillRect(x, y, cellW - 1, cellH - 1);
            
            // Text color logic
            const isDark = (Math.abs(v) > 0.99) || (Math.abs(v)/maxV > 0.5);
            ctx.fillStyle = isDark ? '#ffffff' : '#475569';
            ctx.font = `bold ${Math.max(9, Math.min(11, cellW / 4.5))}px Inter`;
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle';
            ctx.fillText(v.toFixed(2), x + cellW / 2, y + cellH / 2);
        }
    }
    
    // Draw X-axis label captions (Bottom)
    ctx.fillStyle = '#475569';
    ctx.font = `${Math.max(10, Math.min(11, cellW / 4))}px Inter`;
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'top';
    labels.forEach((l, j) => {
        ctx.save(); 
        const x = paddingLeft + j * cellW + cellW / 2;
        const y = paddingTop + gridH + 8;
        ctx.translate(x, y);
        // Rotate text slightly if cell is too narrow
        if (cellW < 40) {
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'right';
            ctx.fillText(l, 0, 0); 
        } else {
            ctx.fillText(l, 0, 0); 
        }
        ctx.restore();
    });
    
    // Draw Y-axis label captions (Left)
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'right'; 
    ctx.textBaseline = 'middle';
    labels.forEach((l, i) => {
        const x = paddingLeft - 8;
        const y = paddingTop + i * cellH + cellH / 2;
        ctx.fillText(l, x, y);
    });
}

// ==================== SYSTEM INITIALIZATION & DOM EVENTS ====================
document.addEventListener('DOMContentLoaded', () => {
    // Bind click handlers to sidebar navigation items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = item.getAttribute('data-tab');
            if (tab) {
                e.preventDefault();
                navigate(tab);
            } else if (item.id === 'btn-logout') {
                e.preventDefault();
                alert('Keluar sistem dashboard...');
            } else if (item.id === 'btn-help') {
                e.preventDefault();
                alert('Bantuan Dashboard:\nVisualisasi data riil A/B Testing Kelompok 6.\nHubungi anggota tim jika ada kendala.');
            }
        });
    });

    // Remove loading overlay transition
    setTimeout(() => {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.style.display = 'none', 500);
        }
        // Initialize active page visuals
        renderOverview();
        onSetupChange();
    }, 1200);
});
