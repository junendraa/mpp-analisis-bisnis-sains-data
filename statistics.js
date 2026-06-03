/**
 * ============================================================
 *  STATISTICS.JS - Statistical Testing Engine
 *  Implements Z-Test, Welch's T-Test, and effect size measures
 * ============================================================
 */

const StatEngine = {
    /**
     * Standard normal CDF using Abramowitz & Stegun approximation
     */
    normalCDF(x) {
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        const p = 0.3275911;

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return 0.5 * (1.0 + sign * y);
    },

    /**
     * Student's t-distribution CDF using regularized incomplete beta function
     */
    tCDF(t, df) {
        const x = df / (df + t * t);
        const a = df / 2;
        const b = 0.5;
        const ibeta = this.regularizedIncompleteBeta(x, a, b);
        if (t >= 0) {
            return 1 - 0.5 * ibeta;
        } else {
            return 0.5 * ibeta;
        }
    },

    /**
     * Regularized incomplete beta function using continued fraction
     */
    regularizedIncompleteBeta(x, a, b) {
        if (x === 0 || x === 1) return x;

        const lnBeta = this.lnGamma(a + b) - this.lnGamma(a) - this.lnGamma(b);
        const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

        // Use continued fraction (Lentz's method)
        let f = 1, c = 1, d = 0;
        for (let i = 0; i <= 200; i++) {
            let m = Math.floor(i / 2);
            let numerator;

            if (i === 0) {
                numerator = 1;
            } else if (i % 2 === 0) {
                numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
            } else {
                numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
            }

            d = 1 + numerator * d;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            d = 1 / d;

            c = 1 + numerator / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;

            f *= c * d;
            if (Math.abs(c * d - 1) < 1e-10) break;
        }

        return front * (f - 1);
    },

    /**
     * Log Gamma function using Stirling's approximation
     */
    lnGamma(x) {
        const cof = [
            76.18009172947146, -86.50532032941677, 24.01409824083091,
            -1.231739572450155, 0.001208650973866179, -0.000005395239384953
        ];
        let y = x;
        let tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        let ser = 1.000000000190015;
        for (let j = 0; j < 6; j++) {
            ser += cof[j] / (++y);
        }
        return -tmp + Math.log(2.5066282746310005 * ser / x);
    },

    /**
     * Two-Proportion Z-Test
     * Tests H₀: p₁ = p₂ vs H₁: p₁ ≠ p₂
     * 
     * @param {number} x1 - Number of successes in group 1
     * @param {number} n1 - Sample size of group 1
     * @param {number} x2 - Number of successes in group 2
     * @param {number} n2 - Sample size of group 2
     * @returns {object} Test results
     */
    twoProportionZTest(x1, n1, x2, n2) {
        const p1 = x1 / n1;
        const p2 = x2 / n2;
        const pPooled = (x1 + x2) / (n1 + n2);

        const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));
        const z = (p1 - p2) / se;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        // 95% Confidence interval for difference
        const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
        const diff = p1 - p2;
        const ci95 = [diff - 1.96 * seDiff, diff + 1.96 * seDiff];

        // Cohen's h effect size
        const h = 2 * Math.asin(Math.sqrt(p1)) - 2 * Math.asin(Math.sqrt(p2));

        return {
            testName: "Two-Proportion Z-Test",
            testType: "Z-Test",
            hypothesisH0: "p₁ = p₂ (Tidak ada perbedaan conversion rate)",
            hypothesisH1: "p₁ ≠ p₂ (Terdapat perbedaan conversion rate)",
            p1: p1,
            p2: p2,
            pPooled: pPooled,
            difference: diff,
            standardError: se,
            zStatistic: z,
            pValue: pValue,
            alpha: 0.05,
            significant: pValue < 0.05,
            ci95: ci95,
            effectSize: Math.abs(h),
            effectSizeName: "Cohen's h",
            effectSizeInterpretation: this.interpretCohenH(Math.abs(h)),
            conclusion: pValue < 0.05
                ? "Tolak H₀: Terdapat perbedaan signifikan pada conversion rate antara kedua kelompok."
                : "Gagal Tolak H₀: Tidak terdapat perbedaan signifikan pada conversion rate antara kedua kelompok.",
            n1: n1,
            n2: n2
        };
    },

    /**
     * Welch's T-Test (two-sample, unequal variance)
     * Tests H₀: μ₁ = μ₂ vs H₁: μ₁ ≠ μ₂
     * 
     * @param {number[]} sample1 - First sample values
     * @param {number[]} sample2 - Second sample values
     * @param {string} variableName - Name of the variable being tested
     * @returns {object} Test results
     */
    welchTTest(sample1, sample2, variableName = "Variable") {
        const n1 = sample1.length;
        const n2 = sample2.length;

        const mean1 = sample1.reduce((a, b) => a + b, 0) / n1;
        const mean2 = sample2.reduce((a, b) => a + b, 0) / n2;

        const var1 = sample1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (n1 - 1);
        const var2 = sample2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (n2 - 1);

        const se = Math.sqrt(var1 / n1 + var2 / n2);
        const t = (mean1 - mean2) / se;

        // Welch-Satterthwaite degrees of freedom
        const df = Math.pow(var1 / n1 + var2 / n2, 2) /
            (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

        // P-value from t-distribution (two-tailed)
        const pValue = 2 * (1 - this.tCDF(Math.abs(t), df));

        // 95% CI for difference in means
        // Approximate critical t value for large df
        const tCrit = this.tInverse(0.025, df);
        const diff = mean1 - mean2;
        const ci95 = [diff - tCrit * se, diff + tCrit * se];

        // Cohen's d
        const pooledSD = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
        const d = Math.abs(diff) / pooledSD;

        return {
            testName: `Welch's T-Test: ${variableName}`,
            testType: "Welch's T-Test",
            variableName: variableName,
            hypothesisH0: `μ₁ = μ₂ (Tidak ada perbedaan rata-rata ${variableName})`,
            hypothesisH1: `μ₁ ≠ μ₂ (Terdapat perbedaan rata-rata ${variableName})`,
            mean1: mean1,
            mean2: mean2,
            var1: var1,
            var2: var2,
            std1: Math.sqrt(var1),
            std2: Math.sqrt(var2),
            difference: diff,
            standardError: se,
            tStatistic: t,
            degreesOfFreedom: df,
            pValue: pValue,
            alpha: 0.05,
            significant: pValue < 0.05,
            ci95: ci95,
            effectSize: d,
            effectSizeName: "Cohen's d",
            effectSizeInterpretation: this.interpretCohenD(d),
            conclusion: pValue < 0.05
                ? `Tolak H₀: Terdapat perbedaan signifikan pada rata-rata ${variableName} antara kedua kelompok.`
                : `Gagal Tolak H₀: Tidak terdapat perbedaan signifikan pada rata-rata ${variableName} antara kedua kelompok.`,
            n1: n1,
            n2: n2
        };
    },

    /**
     * Approximate inverse t-distribution
     * Uses normal approximation for large df
     */
    tInverse(alpha, df) {
        // For large df, use normal approximation
        if (df > 100) return 1.96;

        // Newton's method starting from normal approx
        let t = 1.96;
        for (let i = 0; i < 20; i++) {
            const p = 1 - this.tCDF(t, df);
            const dp = -0.5 * Math.pow(1 + t * t / df, -(df + 1) / 2) *
                Math.exp(this.lnGamma((df + 1) / 2) - this.lnGamma(df / 2)) /
                Math.sqrt(df * Math.PI);
            t = t - (p - alpha) / dp;
        }
        return Math.abs(t);
    },

    /**
     * Interpret Cohen's d effect size
     */
    interpretCohenD(d) {
        if (d < 0.2) return { level: "Negligible", description: "Efek sangat kecil, tidak bermakna secara praktis" };
        if (d < 0.5) return { level: "Small", description: "Efek kecil" };
        if (d < 0.8) return { level: "Medium", description: "Efek sedang" };
        return { level: "Large", description: "Efek besar" };
    },

    /**
     * Interpret Cohen's h effect size
     */
    interpretCohenH(h) {
        if (h < 0.2) return { level: "Negligible", description: "Efek sangat kecil, tidak bermakna secara praktis" };
        if (h < 0.5) return { level: "Small", description: "Efek kecil" };
        if (h < 0.8) return { level: "Medium", description: "Efek sedang" };
        return { level: "Large", description: "Efek besar" };
    },

    /**
     * Run all statistical tests on the dataset
     */
    runAllTests(controlGroup, treatmentGroup, fullDataset = null) {
        const results = {};
        const full = fullDataset || [...controlGroup, ...treatmentGroup];

        // 1. Conversion Rate - Z-Test (Control/PPC vs Treatment/Referral)
        const controlConversions = controlGroup.filter(u => u.Conversion === 1).length;
        const treatmentConversions = treatmentGroup.filter(u => u.Conversion === 1).length;

        results.conversionRate = this.twoProportionZTest(
            controlConversions, controlGroup.length,
            treatmentConversions, treatmentGroup.length
        );

        // 2. AdSpend - Welch's T-Test (Treatment/Referral vs Control/PPC)
        results.adSpend = this.welchTTest(
            treatmentGroup.map(u => u.AdSpend),
            controlGroup.map(u => u.AdSpend),
            "Ad Spend"
        );

        // 3. LoyaltyPoints - Welch's T-Test (Treatment/Referral vs Control/PPC, Converted Only)
        const convertedControl = controlGroup.filter(u => u.Conversion === 1);
        const convertedTreatment = treatmentGroup.filter(u => u.Conversion === 1);
        results.loyaltyPoints = this.welchTTest(
            convertedTreatment.map(u => u.LoyaltyPoints),
            convertedControl.map(u => u.LoyaltyPoints),
            "Loyalty Points"
        );

        // 4. TimeOnSite - Welch's T-Test (Treatment/Referral vs Control/PPC)
        results.timeOnSite = this.welchTTest(
            treatmentGroup.map(u => u.TimeOnSite),
            controlGroup.map(u => u.TimeOnSite),
            "Time On Site"
        );

        // 5. PagesPerVisit - Welch's T-Test (Treatment/Referral vs Control/PPC)
        results.pagesPerVisit = this.welchTTest(
            treatmentGroup.map(u => u.PagesPerVisit),
            controlGroup.map(u => u.PagesPerVisit),
            "Pages Per Visit"
        );

        // 6. Gender Segmentation - Conversion Rate by Gender (Female vs Male, Entire Dataset)
        const femaleGroup = full.filter(u => u.Gender === 'Female');
        const maleGroup = full.filter(u => u.Gender === 'Male');

        results.genderConversion = this.twoProportionZTest(
            femaleGroup.filter(u => u.Conversion === 1).length,
            femaleGroup.length,
            maleGroup.filter(u => u.Conversion === 1).length,
            maleGroup.length
        );
        results.genderConversion.testName = "Gender Segmentation: Conversion Rate";
        results.genderConversion.hypothesisH0 = "p_female = p_male (Tidak ada bias gender pada conversion)";
        results.genderConversion.hypothesisH1 = "p_female ≠ p_male (Terdapat bias gender pada conversion)";

        // 7. Gender Segmentation - Loyalty Points (Female vs Male, Entire Dataset)
        results.genderLoyalty = this.welchTTest(
            femaleGroup.map(u => u.LoyaltyPoints),
            maleGroup.map(u => u.LoyaltyPoints),
            "Loyalty Points (Gender)"
        );
        results.genderLoyalty.testName = "Gender Segmentation: Loyalty Points";

        return results;
    },

    /**
     * Calculate statistical power for a given test
     */
    calculatePower(effectSize, n1, n2, alpha = 0.05) {
        const n = (n1 * n2) / (n1 + n2); // harmonic mean-like
        const ncp = effectSize * Math.sqrt(n); // non-centrality parameter
        const zAlpha = 1.96; // two-tailed
        const power = 1 - this.normalCDF(zAlpha - ncp) + this.normalCDF(-zAlpha - ncp);
        return Math.max(0, Math.min(1, power));
    }
};

window.StatEngine = StatEngine;
