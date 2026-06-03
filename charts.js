/**
 * ============================================================
 *  CHARTS.JS - Chart.js Visualizations for Sidebar Dashboard
 *  Creates all BI-style interactive charts matching screenshots 1-4
 * ============================================================
 */

const ChartManager = {
    charts: {},

    // Theme colors matching the screenshots
    colors: {
        blueMain: '#3b82f6',       /* Bright corporate blue */
        blueDark: '#1e3a8a',       /* Dark blue */
        blueLight: '#60a5fa',      /* Light blue */
        blueAccent: '#2563eb',     /* Royal blue */
        blueSoft: '#93c5fd',       /* Soft sky blue */
        amber: '#eab308',          /* Logo yellow */
        emerald: '#10b981',        /* Success green */
        pink: '#db2777',           /* Accent pink */
        violet: '#8b5cf6',         /* Accent violet */
        orange: '#f97316',         /* Accent orange */
        greyBorder: '#cbd5e1',     /* Grid lines */
        greyText: '#64748b'        /* Muted labels text */
    },

    // Chart.js global style options
    getOptions(titleText, isDark = false, hideLegend = true) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: !hideLegend,
                    position: 'right',
                    labels: {
                        color: isDark ? '#ffffff' : '#334155',
                        font: { family: "'Inter', sans-serif", size: 10, weight: '500' },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                title: {
                    display: false
                },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#0f172a',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 8,
                    cornerRadius: 6,
                    titleFont: { family: "'Inter', sans-serif", size: 11, weight: '600' },
                    bodyFont: { family: "'Inter', sans-serif", size: 10 }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                        font: { family: "'Inter', sans-serif", size: 9 }
                    }
                },
                y: {
                    grid: { color: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0', drawBorder: false },
                    ticks: {
                        color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#64748b',
                        font: { family: "'Inter', sans-serif", size: 9 }
                    }
                }
            }
        };
    },

    destroyChart(id) {
        if (this.charts[id]) {
            this.charts[id].destroy();
            delete this.charts[id];
        }
    },

    // ==========================================
    // TAB 1: CUSTOMER CHARTS
    // ==========================================

    // Horizontal Bar Chart: Campaign Type by Gender
    createCustomerGenderBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const femaleCount = users.filter(u => u.Gender === 'Female').length;
        const maleCount = users.filter(u => u.Gender === 'Male').length;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Female', 'Male'],
                datasets: [{
                    data: [femaleCount, maleCount],
                    backgroundColor: [this.colors.blueMain, this.colors.blueLight],
                    borderRadius: 4,
                    barThickness: 28
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                indexAxis: 'y',
                scales: {
                    x: {
                        grid: { color: '#e2e8f0' },
                        ticks: { color: '#64748b', font: { size: 9 } },
                        title: { display: true, text: 'Count of CampaignChannel', color: '#64748b', font: { size: 9 } }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#334155', font: { size: 10, weight: '500' } }
                    }
                }
            }
        });
    },

    // Donut Chart: Gender Distribution (In Dark Card)
    createCustomerGenderDonut(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const femaleCount = users.filter(u => u.Gender === 'Female').length;
        const maleCount = users.filter(u => u.Gender === 'Male').length;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Female', 'Male'],
                datasets: [{
                    data: [femaleCount, maleCount],
                    backgroundColor: ['#0284c7', '#1e40af'],
                    borderColor: '#0f172a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            font: { family: "'Inter', sans-serif", size: 10 },
                            usePointStyle: true,
                            boxWidth: 6
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        bodyColor: '#ffffff'
                    }
                }
            }
        });
    },

    // Column Chart: Age Distribution Histogram
    createCustomerAgeBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Group ages from 18 to 70 into bins or direct ages
        const ageCounts = {};
        for (let a = 18; a <= 70; a++) ageCounts[a] = 0;
        users.forEach(u => {
            if (u.Age >= 18 && u.Age <= 70) {
                ageCounts[u.Age]++;
            }
        });

        const labels = Object.keys(ageCounts);
        const data = Object.values(ageCounts);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this.colors.blueMain,
                    barPercentage: 0.9,
                    categoryPercentage: 0.9
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 9 }, maxRotation: 0 }
                    },
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: { color: '#64748b', font: { size: 9 } },
                        title: { display: true, text: 'CustomerID', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // Line Chart: Income based on Age
    createCustomerIncomeAgeLine(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Average Income grouped by age
        const ageSums = {};
        const ageCounts = {};
        users.forEach(u => {
            if (!ageSums[u.Age]) {
                ageSums[u.Age] = 0;
                ageCounts[u.Age] = 0;
            }
            ageSums[u.Age] += u.Income;
            ageCounts[u.Age]++;
        });

        const sortedAges = Object.keys(ageSums).sort((a, b) => a - b);
        const avgIncomes = sortedAges.map(age => ageSums[age] / ageCounts[age]);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedAges,
                datasets: [{
                    data: avgIncomes,
                    borderColor: this.colors.blueMain,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.3
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 8 } },
                        title: { display: true, text: 'Age', color: '#64748b', font: { size: 8 } }
                    },
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#64748b', 
                            font: { size: 8 },
                            callback: v => (v / 1000000).toFixed(1) + 'M'
                        },
                        title: { display: true, text: 'Income', color: '#64748b', font: { size: 8 } }
                    }
                }
            }
        });
    },

    // Column Chart: Income based on Gender
    createCustomerIncomeGenderBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const femaleUsers = users.filter(u => u.Gender === 'Female');
        const maleUsers = users.filter(u => u.Gender === 'Male');

        const femaleIncomeSum = femaleUsers.reduce((sum, u) => sum + u.Income, 0);
        const maleIncomeSum = maleUsers.reduce((sum, u) => sum + u.Income, 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Female', 'Male'],
                datasets: [{
                    data: [femaleIncomeSum, maleIncomeSum],
                    backgroundColor: [this.colors.blueMain, this.colors.blueLight],
                    borderRadius: 4,
                    barThickness: 32
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#64748b',
                            font: { size: 8 },
                            callback: v => (v / 1000000000).toFixed(1) + 'bn'
                        },
                        title: { display: true, text: 'Income', color: '#64748b', font: { size: 8 } }
                    }
                }
            }
        });
    },

    // ==========================================
    // TAB 2: CAMPAIGN EFFECTIVENESS CHARTS
    // ==========================================

    // Column Chart: Total AdSpend per Channel
    createCampaignSpendBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const channels = ['referral', 'ppc', 'email', 'seo', 'social media'];
        const spends = channels.map(c => {
            return users.filter(u => u.CampaignChannel === c).reduce((sum, u) => sum + u.AdSpend, 0);
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: channels,
                datasets: [{
                    data: spends,
                    backgroundColor: this.colors.blueDark,
                    borderRadius: 4,
                    barThickness: 40
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                scales: {
                    x: {
                        grid: { display: false },
                        title: { display: true, text: 'CampaignChannel', color: '#64748b', font: { size: 9 } }
                    },
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#64748b',
                            callback: v => (v / 1000000).toFixed(1) + 'M'
                        },
                        title: { display: true, text: 'AdSpend', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // Donut Chart: Campaign Distribution (In Dark Card)
    createCampaignDistDonut(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const channels = ['referral', 'ppc', 'email', 'seo', 'social media'];
        const counts = channels.map(c => users.filter(u => u.CampaignChannel === c).length);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: channels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#c026d3', '#3b82f6', '#f97316', '#0f766e', '#db2777'],
                    borderColor: '#0f172a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            font: { family: "'Inter', sans-serif", size: 8 },
                            usePointStyle: true,
                            boxWidth: 6
                        }
                    }
                }
            }
        });
    },

    // Horizontal Bar: Conversion per Channel (Referral vs PPC)
    createCampaignConvBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const refConversions = users.filter(u => u.CampaignChannel === 'referral' && u.Conversion === 1).length;
        const ppcConversions = users.filter(u => u.CampaignChannel === 'ppc' && u.Conversion === 1).length;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['referral', 'ppc'],
                datasets: [{
                    data: [refConversions, ppcConversions],
                    backgroundColor: '#f97316',
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                indexAxis: 'y',
                scales: {
                    x: {
                        grid: { color: '#e2e8f0' }
                    },
                    y: {
                        grid: { display: false },
                        title: { display: true, text: 'CampaignChannel', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // Horizontal Bar: AdSpend per Campaign Type
    createCampaignTypeSpendBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const types = ['conversion', 'consideration', 'awareness', 'retention'];
        const spends = types.map(t => {
            return users.filter(u => u.CampaignType === t).reduce((sum, u) => sum + u.AdSpend, 0);
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types,
                datasets: [{
                    data: spends,
                    backgroundColor: this.colors.blueAccent,
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                indexAxis: 'y',
                scales: {
                    x: {
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            color: '#64748b',
                            callback: v => (v / 1000000).toFixed(1) + 'M'
                        }
                    },
                    y: {
                        grid: { display: false },
                        title: { display: true, text: 'CampaignType', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // ==========================================
    // TAB 3: DIGITAL ENGAGEMENT CHARTS
    // ==========================================

    // Grouped Chart: Visits (Bar) and Duration (Line)
    createEngagementVisitsDurationGrouped(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const refUsers = users.filter(u => u.CampaignChannel === 'referral');
        const ppcUsers = users.filter(u => u.CampaignChannel === 'ppc');

        const refVisits = refUsers.reduce((sum, u) => sum + u.WebsiteVisits, 0);
        const ppcVisits = ppcUsers.reduce((sum, u) => sum + u.WebsiteVisits, 0);

        const refDuration = refUsers.reduce((sum, u) => sum + u.TimeOnSite, 0);
        const ppcDuration = ppcUsers.reduce((sum, u) => sum + u.TimeOnSite, 0);

        this.charts[canvasId] = new Chart(ctx, {
            data: {
                labels: ['referral', 'ppc'],
                datasets: [
                    {
                        type: 'bar',
                        label: 'WebsiteVisits',
                        data: [refVisits, ppcVisits],
                        backgroundColor: this.colors.blueMain,
                        borderRadius: 4,
                        barThickness: 50,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'TimeOnSite',
                        data: [refDuration, ppcDuration],
                        borderColor: this.colors.blueDark,
                        borderWidth: 3,
                        fill: false,
                        pointRadius: 4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { boxWidth: 10, font: { size: 9 } }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        title: { display: true, text: 'CampaignChannel', color: '#64748b', font: { size: 9 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: '#f1f5f9' },
                        title: { display: true, text: 'WebsiteVisits', color: '#64748b', font: { size: 9 } },
                        ticks: {
                            callback: v => (v / 1000).toFixed(0) + 'K'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        title: { display: true, text: 'TimeOnSite', color: '#64748b', font: { size: 9 } },
                        ticks: {
                            callback: v => (v / 1000).toFixed(1) + 'K'
                        }
                    }
                }
            }
        });
    },

    // Pie Chart: Clicks engagement (Referral vs PPC)
    createEngagementClickPie(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const refCTR = users.filter(u => u.CampaignChannel === 'referral').reduce((sum, u) => sum + u.ClickThroughRate, 0);
        const ppcCTR = users.filter(u => u.CampaignChannel === 'ppc').reduce((sum, u) => sum + u.ClickThroughRate, 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['referral', 'ppc'],
                datasets: [{
                    data: [refCTR, ppcCTR],
                    backgroundColor: [this.colors.blueMain, this.colors.blueDark],
                    borderColor: '#0f172a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            font: { family: "'Inter', sans-serif", size: 9 },
                            usePointStyle: true,
                            boxWidth: 6
                        }
                    }
                }
            }
        });
    },

    // Horizontal Bar: PagesPerVisit & CTR per Channel
    createEngagementPagesCTRBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const refUsers = users.filter(u => u.CampaignChannel === 'referral');
        const ppcUsers = users.filter(u => u.CampaignChannel === 'ppc');

        const refPages = refUsers.reduce((sum, u) => sum + u.PagesPerVisit, 0);
        const ppcPages = ppcUsers.reduce((sum, u) => sum + u.PagesPerVisit, 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['referral', 'ppc'],
                datasets: [{
                    data: [refPages, ppcPages],
                    backgroundColor: '#10b981',
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                indexAxis: 'y',
                scales: {
                    x: {
                        grid: { color: '#e2e8f0' },
                        ticks: {
                            callback: v => (v / 1000).toFixed(1) + 'K'
                        }
                    },
                    y: {
                        grid: { display: false },
                        title: { display: true, text: 'CampaignChannel', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // Pie Chart: Email Click vs Web Visits
    createEngagementEmailWebPie(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const totalEmailClicks = users.reduce((sum, u) => sum + u.EmailClicks, 0);
        const totalWebVisits = users.reduce((sum, u) => sum + u.WebsiteVisits, 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['EmailClicks', 'WebsiteVisits'],
                datasets: [{
                    data: [totalEmailClicks, totalWebVisits],
                    backgroundColor: [this.colors.blueMain, this.colors.blueDark],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 10 },
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    }
                }
            }
        });
    },

    // ==========================================
    // TAB 4: LOYALTY & RETENTION CHARTS
    // ==========================================

    // Scatter/Line Chart: Loyalty Points VS Previous Purchase
    createLoyaltyPurchaseScatter(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Group average LoyaltyPoints per Purchase count
        const purchaseSums = {};
        const purchaseCounts = {};
        users.forEach(u => {
            const p = u.PreviousPurchases;
            if (!purchaseSums[p]) {
                purchaseSums[p] = 0;
                purchaseCounts[p] = 0;
            }
            purchaseSums[p] += u.LoyaltyPoints;
            purchaseCounts[p]++;
        });

        const sortedPurchases = Object.keys(purchaseSums).sort((a, b) => a - b);
        const avgLoyalty = sortedPurchases.map(p => purchaseSums[p] / purchaseCounts[p]);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedPurchases,
                datasets: [{
                    data: avgLoyalty,
                    borderColor: this.colors.blueMain,
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: this.colors.blueMain,
                    tension: 0.2
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                scales: {
                    x: {
                        grid: { display: false },
                        title: { display: true, text: 'PreviousPurchases', color: '#64748b', font: { size: 9 } }
                    },
                    y: {
                        grid: { color: '#f1f5f9' },
                        title: { display: true, text: 'LoyaltyPoints', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // Donut: Loyalty by Gender (In Dark Card)
    createLoyaltyGenderDonut(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const femaleLoyalty = users.filter(u => u.Gender === 'Female').reduce((sum, u) => sum + u.LoyaltyPoints, 0);
        const maleLoyalty = users.filter(u => u.Gender === 'Male').reduce((sum, u) => sum + u.LoyaltyPoints, 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Female', 'Male'],
                datasets: [{
                    data: [femaleLoyalty, maleLoyalty],
                    backgroundColor: ['#0284c7', '#1e40af'],
                    borderColor: '#0f172a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            color: '#ffffff',
                            font: { family: "'Inter', sans-serif", size: 9 },
                            usePointStyle: true,
                            boxWidth: 6
                        }
                    }
                }
            }
        });
    },

    // Grouped Bar: Loyalty Points by Type and Channel
    createLoyaltyTypeChannelBar(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const types = ['conversion', 'consideration', 'awareness', 'retention'];
        const refAverages = types.map(t => {
            const group = users.filter(u => u.CampaignType === t && u.CampaignChannel === 'referral');
            return group.length > 0 ? group.reduce((sum, u) => sum + u.LoyaltyPoints, 0) / group.length : 0;
        });
        const ppcAverages = types.map(t => {
            const group = users.filter(u => u.CampaignType === t && u.CampaignChannel === 'ppc');
            return group.length > 0 ? group.reduce((sum, u) => sum + u.LoyaltyPoints, 0) / group.length : 0;
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: types,
                datasets: [
                    {
                        label: 'referral',
                        data: refAverages,
                        backgroundColor: this.colors.blueMain,
                        borderRadius: 4,
                        barThickness: 24
                    },
                    {
                        label: 'ppc',
                        data: ppcAverages,
                        backgroundColor: this.colors.blueDark,
                        borderRadius: 4,
                        barThickness: 24
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: { font: { size: 9 }, usePointStyle: true, boxWidth: 6 }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        grid: { color: '#f1f5f9' },
                        title: { display: true, text: 'Average LoyaltyPoints', color: '#64748b', font: { size: 9 } }
                    }
                }
            }
        });
    },

    // Scatter Chart: Loyalty Points vs Income
    createLoyaltyIncomeScatter(canvasId, users) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Take a random sample of 200 users to prevent cluttering and slow rendering
        const sampledUsers = [...users].sort(() => Math.random() - 0.5).slice(0, 200);
        const scatterData = sampledUsers.map(u => ({ x: u.LoyaltyPoints, y: u.Income }));

        this.charts[canvasId] = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: scatterData,
                    backgroundColor: this.colors.blueMain,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                ...this.getOptions('', false, true),
                scales: {
                    x: {
                        grid: { color: '#f1f5f9' },
                        ticks: { color: '#64748b', font: { size: 8 } },
                        title: { display: true, text: 'LoyaltyPoints', color: '#64748b', font: { size: 8 } }
                    },
                    y: {
                        grid: { color: '#f1f5f9' },
                        ticks: {
                            color: '#64748b',
                            font: { size: 8 },
                            callback: v => (v / 1000000).toFixed(1) + 'M'
                        },
                        title: { display: true, text: 'Income', color: '#64748b', font: { size: 8 } }
                    }
                }
            }
        });
    }
};

window.ChartManager = ChartManager;
