
  // ==================== UTILITIES ====================
  const D = DASHBOARD_DATA;
  const CHANNEL_COLORS = {
    'ppc':          '#6366f1',
    'referral':     '#a855f7',
    'email':        '#06b6d4',
    'seo':          '#10b981',
    'social media': '#f59e0b',
  };
  const CHANNEL_COLORS_ALPHA = (ch, a=0.2) => {
    const hex = CHANNEL_COLORS[ch] || '#6366f1';
    // convert hex to rgba
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };
  const CHANNELS = ['ppc','referral','email','seo','social media'];
  const CHANNEL_LABELS = {'ppc':'PPC','referral':'Referral','email':'Email','seo':'SEO','social media':'Social Media'};

  Chart.defaults.color = '#8892b0';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = 'Inter';

  const chartInstances = {};
  function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
  }
  function mkChart(id, config) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    chartInstances[id] = new Chart(ctx, config);
    return chartInstances[id];
  }

  function fmt(n, dec=2) { return (+n).toLocaleString('id-ID', {minimumFractionDigits:dec, maximumFractionDigits:dec}); }
  function fmtPct(n) { return (n*100).toFixed(2) + '%'; }
  function fmtMoney(n) { return 'Rp ' + (+n).toLocaleString('id-ID'); }

  // ==================== NAVIGATION ====================
  function navigate(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('nav-' + page).classList.add('active');

    if (page === 'overview' && !chartInstances['chartChannelDist']) renderOverview();
    if (page === 'eda' && !chartInstances['chartAgeHist']) renderEDA();
    if (page === 'testing') refreshTestingPage();
  }

  // ==================== OVERVIEW ====================
  function renderOverview() {
    const ov = D.overall;
    // KPI Cards
    const kpis = [
      { icon: '👥', color: 'accent', value: ov.total.toLocaleString('id-ID'), label: 'Total Users', sub: 'Dalam Dataset' },
      { icon: '✅', color: 'green', value: fmtPct(ov.cr), label: 'Overall Conversion Rate', sub: `${ov.converted.toLocaleString('id-ID')} users converted` },
      { icon: '💰', color: 'yellow', value: 'Rp ' + (ov.total_spend/1e6).toFixed(1) + 'M', label: 'Total Ad Spend', sub: 'Semua Channel' },
      { icon: '🖱️', color: 'cyan', value: fmtPct(ov.avg_ctr), label: 'Avg Click-Through Rate', sub: `CVR: ${fmtPct(ov.avg_cvr)}` },
    ];
    document.getElementById('kpiGrid').innerHTML = kpis.map(k => `
      <div class="kpi-card ${k.color}">
        <div class="kpi-icon ${k.color}">${k.icon}</div>
        <div class="kpi-value ${k.color}">${k.value}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-sub">${k.sub}</div>
      </div>`).join('');

    const labels = CHANNELS.map(c => CHANNEL_LABELS[c]);
    const colors = CHANNELS.map(c => CHANNEL_COLORS[c]);
    const colorsAlpha = CHANNELS.map(c => CHANNEL_COLORS_ALPHA(c, 0.25));

    // Channel Distribution
    mkChart('chartChannelDist', {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: CHANNELS.map(c => D.channel_stats[c]?.total||0), backgroundColor: colors, borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2, hoverOffset: 8 }]
      },
      options: { plugins: { legend: { position:'right', labels:{ boxWidth:12, padding:16, font:{size:12} } } }, cutout:'60%' }
    });

    // CR per channel
    mkChart('chartChannelCR', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Conversion Rate',
          data: CHANNELS.map(c => +(D.channel_stats[c]?.cr*100||0).toFixed(2)),
          backgroundColor: colorsAlpha,
          borderColor: colors,
          borderWidth: 2, borderRadius: 6,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, min: 85, max: 91, ticks: { callback: v => v+'%' } },
          x: { grid: { display: false } }
        }
      }
    });

    // Ad Spend
    mkChart('chartAdSpend', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg AdSpend (Rp)',
          data: CHANNELS.map(c => +(D.channel_stats[c]?.avg_spend||0).toFixed(0)),
          backgroundColor: colorsAlpha,
          borderColor: colors,
          borderWidth: 2, borderRadius: 6,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => 'Rp '+(v/1000).toFixed(0)+'K' } },
          x: { grid: { display: false } }
        }
      }
    });

    // CTR
    mkChart('chartCTR', {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg CTR',
          data: CHANNELS.map(c => +(D.channel_stats[c]?.avg_ctr*100||0).toFixed(2)),
          backgroundColor: colorsAlpha,
          borderColor: colors,
          borderWidth: 2, borderRadius: 6,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, min: 14.5, max: 16.5, ticks: { callback: v => v+'%' } },
          x: { grid: { display: false } }
        }
      }
    });

    // Campaign Type Dist
    const types = Object.keys(D.type_stats);
    const typeColors = ['#6366f1','#a855f7','#06b6d4','#10b981'];
    mkChart('chartTypeDist', {
      type: 'doughnut',
      data: {
        labels: types.map(t => t.charAt(0).toUpperCase()+t.slice(1)),
        datasets: [{ data: types.map(t => D.type_stats[t].total), backgroundColor: typeColors, borderColor:'rgba(0,0,0,0.3)', borderWidth:2, hoverOffset:8 }]
      },
      options: { plugins: { legend:{ position:'right', labels:{boxWidth:12, padding:16, font:{size:12}} } }, cutout:'60%' }
    });

    // Type CR
    mkChart('chartTypeCR', {
      type: 'bar',
      data: {
        labels: types.map(t => t.charAt(0).toUpperCase()+t.slice(1)),
        datasets: [{
          label: 'Conversion Rate',
          data: types.map(t => +(D.type_stats[t].cr*100).toFixed(2)),
          backgroundColor: typeColors.map(c => c+'44'),
          borderColor: typeColors,
          borderWidth: 2, borderRadius: 6,
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: false, min: 85, max: 91, ticks:{ callback: v => v+'%' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // ==================== SETUP ====================
  let sampledData = null;

  function onSetupChange() {
    const ctrl = document.getElementById('selectControl').value;
    const treat = document.getElementById('selectTreatment').value;
    const cs = D.channel_stats;
    document.getElementById('controlTotal').textContent = cs[ctrl]?.total?.toLocaleString('id-ID') || '—';
    document.getElementById('treatmentTotal').textContent = cs[treat]?.total?.toLocaleString('id-ID') || '—';
    if (ctrl === treat) {
      document.getElementById('controlInfo').style.borderColor = 'rgba(239,68,68,0.4)';
      document.getElementById('treatmentInfo').style.borderColor = 'rgba(239,68,68,0.4)';
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
    document.getElementById('totalSampleCounter').textContent = (2*+v).toLocaleString('id-ID');
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function runSampling() {
    const ctrl = document.getElementById('selectControl').value;
    const treat = document.getElementById('selectTreatment').value;
    if (ctrl === treat) { alert('Grup A dan Grup B tidak boleh sama!'); return; }
    const n = +document.getElementById('sampleSizeRange').value;

    const btn = document.getElementById('btnRunSampling');
    btn.innerHTML = '<span class="spin-sm"></span> Sampling...';
    btn.disabled = true;

    setTimeout(() => {
      const ctrlRecords = shuffle(D.records.filter(r => r.channel === ctrl)).slice(0, n);
      const treatRecords = shuffle(D.records.filter(r => r.channel === treat)).slice(0, n);

      function groupStats(recs) {
        const N = recs.length;
        const conv = recs.filter(r => r.conv === 1).length;
        const cr = conv/N;
        const avgSpend = recs.reduce((s,r)=>s+r.spend,0)/N;
        const avgCtr = recs.reduce((s,r)=>s+r.ctr,0)/N;
        const avgCvr = recs.reduce((s,r)=>s+r.cvr,0)/N;
        const avgVisits = recs.reduce((s,r)=>s+r.visits,0)/N;
        const avgTime = recs.reduce((s,r)=>s+r.time,0)/N;
        const avgLoyalty = recs.reduce((s,r)=>s+r.loyalty,0)/N;
        return { N, conv, cr, avgSpend, avgCtr, avgCvr, avgVisits, avgTime, avgLoyalty };
      }

      const A = groupStats(ctrlRecords);
      const B = groupStats(treatRecords);

      sampledData = { ctrl, treat, n, A, B, ctrlRecords, treatRecords };

      // Table
      const rows = [
        ['Sample Size (N)', A.N, B.N, null],
        ['Converted', A.conv, B.conv, B.conv-A.conv],
        ['Conversion Rate', fmtPct(A.cr), fmtPct(B.cr), ((B.cr-A.cr)*100).toFixed(3)+'pp'],
        ['Avg Ad Spend', 'Rp '+fmt(A.avgSpend,0), 'Rp '+fmt(B.avgSpend,0), null],
        ['Avg CTR', fmtPct(A.avgCtr), fmtPct(B.avgCtr), ((B.avgCtr-A.avgCtr)*100).toFixed(3)+'pp'],
        ['Avg Time on Site', fmt(A.avgTime)+'m', fmt(B.avgTime)+'m', null],
        ['Avg Loyalty Points', fmt(A.avgLoyalty,0), fmt(B.avgLoyalty,0), null],
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
          <td style="color:var(--text-secondary)">${r[0]}</td>
          <td class="val-control">${r[1]}</td>
          <td class="val-treatment">${r[2]}</td>
          <td>${diffCell}</td>
        </tr>`;
      }).join('');

      // Charts
      destroyChart('chartSamplingCR'); destroyChart('chartSamplingSpend'); destroyChart('chartSamplingCTR');
      const ctrlLabel = CHANNEL_LABELS[ctrl];
      const treatLabel = CHANNEL_LABELS[treat];

      mkChart('chartSamplingCR', {
        type: 'bar',
        data: {
          labels: [ctrlLabel+' (Kontrol A)', treatLabel+' (Treatment B)'],
          datasets: [{
            label: 'Conversion Rate (%)',
            data: [+(A.cr*100).toFixed(3), +(B.cr*100).toFixed(3)],
            backgroundColor: [CHANNEL_COLORS_ALPHA(ctrl,0.4), CHANNEL_COLORS_ALPHA(treat,0.4)],
            borderColor: [CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]],
            borderWidth: 2, borderRadius: 8,
          }]
        },
        options: {
          plugins:{ legend:{display:false} },
          scales:{ y:{ beginAtZero:false, min: Math.max(0, Math.min(A.cr,B.cr)*100-3), ticks:{callback:v=>v.toFixed(1)+'%'} }, x:{grid:{display:false}} }
        }
      });

      mkChart('chartSamplingSpend', {
        type: 'bar',
        data: {
          labels: [ctrlLabel, treatLabel],
          datasets: [{ label:'Avg AdSpend', data:[+A.avgSpend.toFixed(0), +B.avgSpend.toFixed(0)], backgroundColor:[CHANNEL_COLORS_ALPHA(ctrl,0.4), CHANNEL_COLORS_ALPHA(treat,0.4)], borderColor:[CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]], borderWidth:2, borderRadius:6 }]
        },
        options: { plugins:{legend:{display:false}}, scales:{ y:{ticks:{callback:v=>'Rp '+(v/1000).toFixed(0)+'K'}}, x:{grid:{display:false}} } }
      });

      mkChart('chartSamplingCTR', {
        type: 'bar',
        data: {
          labels: [ctrlLabel, treatLabel],
          datasets: [{ label:'Avg CTR', data:[+(A.avgCtr*100).toFixed(3), +(B.avgCtr*100).toFixed(3)], backgroundColor:[CHANNEL_COLORS_ALPHA(ctrl,0.4), CHANNEL_COLORS_ALPHA(treat,0.4)], borderColor:[CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]], borderWidth:2, borderRadius:6 }]
        },
        options: { plugins:{legend:{display:false}}, scales:{ y:{ticks:{callback:v=>v.toFixed(1)+'%'}}, x:{grid:{display:false}} } }
      });

      // Narrative
      const diff = ((B.cr - A.cr)*100).toFixed(3);
      const higher = B.cr >= A.cr ? `<strong style="color:var(--purple)">${treatLabel} (Treatment B)</strong>` : `<strong style="color:var(--accent-light)">${ctrlLabel} (Kontrol A)</strong>`;
      document.getElementById('experimentNarrative').innerHTML = `
        Dalam eksperimen ini, dari total populasi data historis, dilakukan <strong style="color:var(--text-primary)">random sampling</strong> sebanyak 
        <strong style="color:var(--accent-light)">${n} sampel</strong> untuk setiap grup guna menghilangkan bias karakteristik user.<br/><br/>
        <strong style="color:var(--accent-light)">Grup A (Kontrol — ${ctrlLabel})</strong> merepresentasikan campaign channel yang sudah berjalan/existing.
        Dari ${n} sampel acak, sebanyak <strong>${A.conv} user (${fmtPct(A.cr)})</strong> berhasil melakukan konversi.<br/><br/>
        <strong style="color:var(--purple)">Grup B (Treatment — ${treatLabel})</strong> merepresentasikan campaign channel alternatif yang ingin diuji.
        Dari ${n} sampel acak, sebanyak <strong>${B.conv} user (${fmtPct(B.cr)})</strong> berhasil melakukan konversi.<br/><br/>
        Perbedaan Conversion Rate antara kedua grup adalah <strong style="color:var(--text-primary)">${diff > 0 ? '+' : ''}${diff} percentage point</strong>,
        dengan ${higher} menunjukkan angka yang lebih tinggi. Untuk menentukan apakah perbedaan ini 
        <em>signifikan secara statistik</em>, silakan lanjutkan ke tab <strong>Statistical Testing</strong>.
      `;

      document.getElementById('samplingTimestamp').textContent = 'Dijalankan: ' + new Date().toLocaleTimeString('id-ID');
      document.getElementById('samplingResults').style.display = 'block';
      document.getElementById('samplingResults').scrollIntoView({ behavior:'smooth', block:'start' });

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

  // ==================== STATISTICAL TESTING ====================
  function normalPDF(x) { return Math.exp(-0.5*x*x) / Math.sqrt(2*Math.PI); }
  function normalCDF(z) {
    const a1=0.254829592, a2=-0.284496736, a3=1.421413741, a4=-1.453152027, a5=1.061405429, p=0.3275911;
    const sign = z < 0 ? -1 : 1;
    const absz = Math.abs(z);
    const t = 1/(1+p*absz);
    const y = 1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-absz*absz);
    return 0.5*(1+sign*y);
  }
  function zTestProportions(x1,n1,x2,n2) {
    const p1=x1/n1, p2=x2/n2;
    const p_pool=(x1+x2)/(n1+n2);
    const se=Math.sqrt(p_pool*(1-p_pool)*(1/n1+1/n2));
    const z=(p1-p2)/se;
    const pval=2*(1-normalCDF(Math.abs(z)));
    const se2=Math.sqrt(p1*(1-p1)/n1 + p2*(1-p2)/n2);
    const ci_lo=(p1-p2)-1.96*se2, ci_hi=(p1-p2)+1.96*se2;
    const cohens_h = 2*(Math.asin(Math.sqrt(p1))-Math.asin(Math.sqrt(p2)));
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

    // Hypothesis text
    document.getElementById('h0Text').textContent = `Tidak ada perbedaan signifikan antara Conversion Rate ${ctrlLabel} (Kontrol A) dan ${treatLabel} (Treatment B) — p_A = p_B`;
    document.getElementById('h1Text').textContent = `Terdapat perbedaan signifikan antara Conversion Rate ${ctrlLabel} dan ${treatLabel} — p_A ≠ p_B (two-tailed, α = 0.05)`;

    // Result Cards
    const significant = res.pval < 0.05;
    document.getElementById('rcZScore').textContent = res.z.toFixed(4);
    document.getElementById('rcPValue').textContent = res.pval < 0.0001 ? '< 0.0001' : res.pval.toFixed(4);
    document.getElementById('rcPValue').className = 'rc-value ' + (significant ? 'good' : 'neutral');
    document.getElementById('rcCI').textContent = `[${(res.ci_lo*100).toFixed(3)}%, ${(res.ci_hi*100).toFixed(3)}%]`;
    const h = Math.abs(res.cohens_h);
    const effectLabel = h < 0.2 ? 'Kecil' : h < 0.5 ? 'Sedang' : 'Besar';
    document.getElementById('rcEffect').textContent = res.cohens_h.toFixed(4);
    document.getElementById('rcEffect').className = 'rc-value ' + (h < 0.2 ? 'neutral' : h < 0.5 ? 'info' : 'good');

    // Conclusion
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

    // Calc Table
    document.getElementById('calcTable').querySelector('tbody').innerHTML = [
      ['Channel A (Kontrol)', ctrlLabel],
      ['Channel B (Treatment)', treatLabel],
      ['Sampel A (n₁)', A.N],
      ['Sampel B (n₂)', B.N],
      ['Converted A (x₁)', A.conv],
      ['Converted B (x₂)', B.conv],
      ['p̂₁ (CR Grup A)', fmtPct(res.p1)],
      ['p̂₂ (CR Grup B)', fmtPct(res.p2)],
      ['Selisih (p̂₁ - p̂₂)', ((res.p1-res.p2)*100).toFixed(3)+'pp'],
      ['p̂ Pool', res.p_pool.toFixed(6)],
      ['SE (Pooled)', res.se.toFixed(6)],
      ['Z-Statistic', res.z.toFixed(4)],
      ['Z-Critical (α=0.05)', '±1.96'],
      ['P-Value (two-tailed)', res.pval < 0.0001 ? '< 0.0001' : res.pval.toFixed(6)],
      ['Kesimpulan', significant ? '✅ Tolak H₀' : '⚠️ Gagal Tolak H₀'],
    ].map(([k,v]) => `<tr><td style="color:var(--text-secondary);font-size:12.5px">${k}</td><td style="font-weight:600;font-size:13px;text-align:right">${v}</td></tr>`).join('');

    // Bell Curve
    destroyChart('chartBellCurve');
    const zArr = [], yArr = [], zVal = res.z;
    for (let x = -4; x <= 4; x += 0.05) { zArr.push(+x.toFixed(2)); yArr.push(normalPDF(x)); }
    const critZ = 1.96;
    mkChart('chartBellCurve', {
      type: 'line',
      data: {
        labels: zArr,
        datasets: [
          {
            label: 'Normal Distribution',
            data: zArr.map(x => normalPDF(x)),
            borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
          },
          {
            label: 'Rejection Region (α=0.05)',
            data: zArr.map(x => (Math.abs(x) >= critZ) ? normalPDF(x) : null),
            borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.25)',
            fill: true, tension: 0.4, pointRadius: 0, borderWidth: 0,
          },
          {
            label: `Z-Score = ${zVal.toFixed(3)}`,
            data: zArr.map(x => (Math.abs(x-Math.abs(zVal)) < 0.03) ? normalPDF(x) : null),
            borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.6)',
            fill: true, tension: 0, pointRadius: 0, borderWidth: 0,
          }
        ]
      },
      options: {
        plugins: { legend:{ labels:{boxWidth:12, font:{size:11}} }, tooltip:{mode:'index', intersect:false} },
        scales: {
          x: { ticks:{ maxTicksLimit:9, callback:(v,i) => zArr[i] }, title:{display:true,text:'Z-Score'} },
          y: { title:{display:true,text:'Probability Density'} }
        }
      }
    });

    // Test CR Chart
    destroyChart('chartTestCR');
    mkChart('chartTestCR', {
      type: 'bar',
      data: {
        labels: [`${ctrlLabel} (Kontrol A)\nn=${A.N}`, `${treatLabel} (Treatment B)\nn=${B.N}`],
        datasets: [{
          label: 'Conversion Rate',
          data: [+(res.p1*100).toFixed(3), +(res.p2*100).toFixed(3)],
          backgroundColor: [CHANNEL_COLORS_ALPHA(ctrl,0.5), CHANNEL_COLORS_ALPHA(treat,0.5)],
          borderColor: [CHANNEL_COLORS[ctrl], CHANNEL_COLORS[treat]],
          borderWidth: 2, borderRadius: 10,
          errorBars: {}
        }]
      },
      options: {
        plugins: { legend:{display:false}, tooltip:{ callbacks:{ label: ctx => ` Conversion Rate: ${ctx.parsed.y.toFixed(3)}%` } } },
        scales: {
          y: { beginAtZero:false, min: Math.max(0, Math.min(res.p1,res.p2)*100-5), ticks:{callback:v=>v.toFixed(2)+'%'} },
          x: { grid:{display:false} }
        }
      }
    });
  }

  // ==================== EDA ====================
  function renderEDA() {
    // Age Histogram
    mkChart('chartAgeHist', {
      type: 'bar',
      data: {
        labels: D.age_hist.labels,
        datasets: [{
          label: 'Jumlah Users',
          data: D.age_hist.values,
          backgroundColor: D.age_hist.values.map((_,i) => `hsl(${230+i*3},70%,${50+i}%)`),
          borderRadius: 4,
        }]
      },
      options: { plugins:{legend:{display:false}}, scales:{ y:{title:{display:true,text:'Jumlah Users'}}, x:{title:{display:true,text:'Usia'}, ticks:{maxRotation:45}} } }
    });

    // Conversion Distribution
    const convCount = D.records.filter(r=>r.conv===1).length;
    const noConvCount = D.records.length - convCount;
    mkChart('chartConvDist', {
      type: 'doughnut',
      data: {
        labels: ['Converted (1)', 'Not Converted (0)'],
        datasets: [{ data:[convCount, noConvCount], backgroundColor:['#10b981','rgba(239,68,68,0.7)'], borderColor:'rgba(0,0,0,0.3)', borderWidth:2, hoverOffset:8 }]
      },
      options: {
        plugins: {
          legend:{ position:'right', labels:{boxWidth:12, padding:16, font:{size:12}} },
          tooltip:{ callbacks:{ label:ctx => `${ctx.label}: ${ctx.parsed.toLocaleString('id-ID')} (${(ctx.parsed/D.records.length*100).toFixed(1)}%)` } }
        }, cutout:'55%'
      }
    });

    // BoxPlot-style (using scatter + floating bar)
    const chLabels = CHANNELS.map(c=>CHANNEL_LABELS[c]);
    mkChart('chartBoxSpend', {
      type: 'bar',
      data: {
        labels: chLabels,
        datasets: [
          {
            label: 'IQR (Q1-Q3)',
            data: CHANNELS.map(c => {
              const s = D.adspend_by_channel[c];
              return [s.q1/1000, s.q3/1000];
            }),
            backgroundColor: CHANNELS.map(c => CHANNEL_COLORS_ALPHA(c, 0.4)),
            borderColor: CHANNELS.map(c => CHANNEL_COLORS[c]),
            borderWidth: 2, borderRadius: 4,
          },
          {
            label: 'Median',
            data: CHANNELS.map(c => D.adspend_by_channel[c].median/1000),
            type: 'line', borderColor: '#f59e0b', backgroundColor:'rgba(245,158,11,0.8)',
            borderWidth: 2, pointRadius: 6, pointBackgroundColor: '#f59e0b',
          }
        ]
      },
      options: {
        plugins:{ legend:{ labels:{boxWidth:12,font:{size:11}} } },
        scales:{ y:{title:{display:true,text:'Ad Spend (Ribu Rp)'}}, x:{grid:{display:false}} }
      }
    });

    // Gender CR
    const genders = Object.keys(D.gender_stats);
    mkChart('chartGenderCR', {
      type: 'bar',
      data: {
        labels: genders,
        datasets: [
          { label:'Converted', data:genders.map(g=>D.gender_stats[g].converted), backgroundColor:'rgba(99,102,241,0.6)', borderColor:'#6366f1', borderWidth:2, borderRadius:6 },
          { label:'Not Converted', data:genders.map(g=>D.gender_stats[g].total-D.gender_stats[g].converted), backgroundColor:'rgba(239,68,68,0.4)', borderColor:'#ef4444', borderWidth:2, borderRadius:6 },
        ]
      },
      options: {
        plugins:{ legend:{ labels:{boxWidth:12,font:{size:11}} } },
        scales:{ x:{stacked:true,grid:{display:false}}, y:{stacked:true} }
      }
    });

    // Correlation Heatmap
    renderCorrHeatmap();

    // Visits vs Time on Site
    mkChart('chartVisitsTime', {
      type: 'bar',
      data: {
        labels: chLabels,
        datasets: [
          { label:'Avg Website Visits', data:CHANNELS.map(c=>D.channel_stats[c].avg_visits.toFixed(2)), backgroundColor:'rgba(99,102,241,0.5)', borderColor:'#6366f1', borderWidth:2, borderRadius:5, yAxisID:'y' },
          { label:'Avg Time on Site (min)', data:CHANNELS.map(c=>D.channel_stats[c].avg_time.toFixed(2)), backgroundColor:'rgba(168,85,247,0.5)', borderColor:'#a855f7', borderWidth:2, borderRadius:5, yAxisID:'y1' },
        ]
      },
      options: {
        plugins:{ legend:{labels:{boxWidth:12,font:{size:11}}} },
        scales:{
          x:{grid:{display:false}},
          y:{type:'linear', position:'left', title:{display:true,text:'Website Visits'}},
          y1:{type:'linear', position:'right', title:{display:true,text:'Time on Site (min)'}, grid:{drawOnChartArea:false}}
        }
      }
    });

    // Email Opens & Clicks
    mkChart('chartEmailEng', {
      type: 'bar',
      data: {
        labels: chLabels,
        datasets: [
          { label:'Avg Email Opens', data:CHANNELS.map(c=>{ const recs=D.records.filter(r=>r.channel===c); return (recs.reduce((s,r)=>s+r.email_opens,0)/recs.length).toFixed(2); }), backgroundColor:'rgba(6,182,212,0.5)', borderColor:'#06b6d4', borderWidth:2, borderRadius:5 },
          { label:'Avg Email Clicks', data:CHANNELS.map(c=>{ const recs=D.records.filter(r=>r.channel===c); return (recs.reduce((s,r)=>s+r.email_clicks,0)/recs.length).toFixed(2); }), backgroundColor:'rgba(16,185,129,0.5)', borderColor:'#10b981', borderWidth:2, borderRadius:5 },
        ]
      },
      options: {
        plugins:{legend:{labels:{boxWidth:12,font:{size:11}}}},
        scales:{x:{grid:{display:false}}}
      }
    });
  }

  function renderCorrHeatmap() {
    const labels = D.corr.labels;
    const matrix = D.corr.matrix;
    const n = labels.length;
    const canvas = document.getElementById('chartCorr');
    if (!canvas) return;
    canvas.width = canvas.offsetParent?.offsetWidth || 700;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const cellW = canvas.width / n;
    const cellH = canvas.height / n;

    function corrColor(v) {
      if (v > 0) { const t = v; return `rgba(99,102,241,${0.1+t*0.85})`; }
      else { const t = -v; return `rgba(239,68,68,${0.1+t*0.85})`; }
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let i=0; i<n; i++) {
      for (let j=0; j<n; j++) {
        const v = matrix[i][j];
        ctx.fillStyle = corrColor(v);
        ctx.fillRect(j*cellW, i*cellH, cellW-1, cellH-1);
        ctx.fillStyle = Math.abs(v) > 0.5 ? 'white' : 'rgba(255,255,255,0.7)';
        ctx.font = `bold ${Math.max(9, Math.min(11, cellW/4))}px Inter`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(2), j*cellW+cellW/2, i*cellH+cellH/2);
      }
    }
    // Labels X
    ctx.fillStyle = 'rgba(136,146,176,0.9)';
    ctx.font = `${Math.max(8,Math.min(10,cellW/5))}px Inter`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    labels.forEach((l,j) => {
      ctx.save(); ctx.translate(j*cellW+cellW/2, canvas.height+2);
      ctx.fillText(l, 0, 0); ctx.restore();
    });
    // Labels Y
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    labels.forEach((l,i) => {
      ctx.fillText(l, -2, i*cellH+cellH/2);
    });
  }

  // ==================== INIT ====================
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      document.getElementById('loadingOverlay').style.opacity = '0';
      setTimeout(() => document.getElementById('loadingOverlay').style.display='none', 500);
      renderOverview();
      onSetupChange();
    }, 1200);
  });
  