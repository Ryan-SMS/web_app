// --- API Base URL ---
// IMPORTANT: Replace this with your actual deployed Render API URL
const API_BASE_URL = "https://creditwiseai.onrender.com";

// --- Page Elements ---
const loginPage = document.getElementById('login-page');
const mainContent = document.getElementById('main-content');
const customerValidationPage = document.getElementById('customer-validation-page'); // صفحه اعتبارسنجی مشتری (پیش‌بینی PD)
const dashboardPage = document.getElementById('dashboard-page'); // صفحه داشبورد تحلیلی

const loginForm = document.getElementById('login-form');
const pdPredictionForm = document.getElementById('pd-prediction-form');
const predictionResults = document.getElementById('prediction-results');
const pdValueSpan = document.getElementById('pd-value');
const pdProgressBar = document.getElementById('pd-progress-bar');
const riskCategorySpan = document.getElementById('risk-category');
const predictionError = document.getElementById('prediction-error');
const loginError = document.getElementById('login-error');

const navPredict = document.getElementById('nav-predict');
const navDashboard = document.getElementById('nav-dashboard');
const navLogout = document.getElementById('nav-logout');

// --- Dashboard KPI Elements ---
const kpiAvgPd = document.getElementById('kpi-avg-pd');
const kpiElRatio = document.getElementById('kpi-el-ratio');
const kpiTotalEl = document.getElementById('kpi-total-el');
const kpiCar = document.getElementById('kpi-car');
const kpiLtdRatio = document.getElementById('kpi-ltd-ratio');

// --- Filter Elements for Dashboard ---
const filterIndustrySelect = document.getElementById('filter-industry');
const filterProvinceSelect = document.getElementById('filter-province');
const filterLoanMinInput = document.getElementById('filter-loan-min');
const filterLoanMaxInput = document.getElementById('filter-loan-max');
const loanMinValSpan = document.getElementById('loan-min-val');
const loanMaxValSpan = document.getElementById('loan-max-val');
const filterCreditMinInput = document.getElementById('filter-credit-min');
const filterCreditMaxInput = document.getElementById('filter-credit-max');
const creditMinValSpan = document.getElementById('credit-min-val');
const creditMaxValSpan = document.getElementById('credit-max-val');
const applyFilterBtn = document.getElementById('apply-filter-btn');
const resetFilterBtn = document.getElementById('reset-filter-btn');

// --- Chart Instances ---
let nplChartInstance, industryChartInstance, provinceChartInstance, collateralChartInstance;
let assetConcentrationChartInstance; // نمودار جدید: تمرکز انواع وثایق
let nonPerformingLoansCountChartInstance; // نمودار جدید: تسهیلات غیرجاری در صنایع (تعداد)
let nonPerformingLoansAmountChartInstance; // نمودار جدید: تسهیلات غیرجاری در صنایع (مبلغ)

// Define a color palette for charts with good contrast
const chartColors = [
    'rgba(75, 192, 192, 0.8)', // Teal
    'rgba(255, 99, 132, 0.8)', // Red
    'rgba(54, 162, 235, 0.8)', // Blue
    'rgba(255, 206, 86, 0.8)', // Yellow
    'rgba(153, 102, 255, 0.8)', // Purple
    'rgba(255, 159, 64, 0.8)', // Orange
    'rgba(0, 204, 102, 0.8)',  // Green
    'rgba(204, 0, 204, 0.8)',  // Magenta
    'rgba(102, 0, 204, 0.8)',  // Dark Purple
    'rgba(255, 51, 0, 0.8)',   // Bright Red
    'rgba(0, 153, 204, 0.8)',  // Light Blue
    'rgba(153, 204, 0, 0.8)',  // Lime Green
    'rgba(204, 51, 0, 0.8)',   // Orange-Red
    'rgba(51, 102, 204, 0.8)'  // Dodger Blue
];

// Border colors (slightly darker for contrast)
const chartBorderColors = chartColors.map(color => color.replace('0.8', '1'));

// --- Loading Spinner Element ---
const loadingSpinner = document.getElementById('loading-spinner');

// --- Loading Spinner Functions ---
function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

// --- Navigation Functions ---
function showPage(pageElement) {
    console.log("Attempting to show page:", pageElement ? pageElement.id : "null");
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden')); // مطمئن شوید همه صفحات مخفی می‌شوند

    if (pageElement) {
        pageElement.classList.remove('hidden'); // صفحه مورد نظر را نمایش می‌دهد
        pageElement.classList.add('active'); // اطمینان از فعال بودن کلاس active
    }

    // پنهان کردن نتایج پیش‌بینی و پیام خطا هر زمان که صفحه جدیدی نمایش داده می‌شود
    predictionResults.classList.add('hidden');
    predictionError.textContent = '';
}

function setActiveNav(navElement) {
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-nav'));
    if (navElement) {
        navElement.classList.add('active-nav');
    }
}


// --- Authentication ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin') {
        localStorage.setItem('isAuthenticated', 'true');
        loginError.textContent = '';
        loginPage.classList.add('hidden'); // صفحه ورود را مخفی کن
        mainContent.classList.remove('hidden'); // محتوای اصلی را نمایش بده

        showPage(customerValidationPage); // نمایش صفحه اعتبارسنجی مشتری
        setActiveNav(navPredict);
    } else {
        loginError.textContent = 'نام کاربری یا رمز عبور اشتباه است.';
    }
});

navLogout.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('isAuthenticated');
    mainContent.classList.add('hidden'); // محتوای اصلی را مخفی کن
    showPage(loginPage); // فقط صفحه ورود را نمایش بده
    setActiveNav(null); // حالت فعال نوار ناوبری را پاک کن
});

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    // ابتدا مطمئن شوید همه صفحات پنهان هستند
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));

    if (localStorage.getItem('isAuthenticated') === 'true') {
        // اگر کاربر لاگین کرده است، صفحه اصلی محتوا را نمایش بده
        loginPage.classList.add('hidden'); // صفحه ورود را مخفی کن
        mainContent.classList.remove('hidden'); // محتوای اصلی را نمایش بده
        showPage(customerValidationPage); // نمایش صفحه اعتبارسنجی مشتری
        setActiveNav(navPredict);
    } else {
        // اگر لاگین نکرده است، فقط صفحه ورود را نمایش بده
        showPage(loginPage);
        mainContent.classList.add('hidden'); // مطمئن شوید محتوای اصلی مخفی است
        setActiveNav(null);
    }
});

// --- Navigation Event Listeners ---
navPredict.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(customerValidationPage); // نمایش صفحه اعتبارسنجی مشتری
    setActiveNav(navPredict);
});

navDashboard.addEventListener('click', async (e) => {
    e.preventDefault();
    showPage(dashboardPage); // نمایش صفحه داشبورد
    setActiveNav(navDashboard);
    await fetchDashboardData(); // داده‌ها را هنگام نمایش داشبورد بارگذاری کن
});


// --- PD Prediction Form Submission ---
pdPredictionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    predictionError.textContent = '';
    predictionResults.classList.add('hidden');
    showLoading(); // نمایش اسپینر

    const formData = new FormData(pdPredictionForm);
    const data = {};
    for (let [key, value] of formData.entries()) {
        // Convert numeric fields to float, others keep as string
        if (['person_age', 'person_income', 'person_emp_exp', 'loan_amnt', 'loan_int_rate', 'loan_percent_income', 'cb_person_cred_hist_length', 'credit_score'].includes(key)) {
            data[key] = parseFloat(value);
        } else {
            data[key] = value;
        }
    }

    try {
        const response = await fetch(`${API_BASE_URL}/predict_pd/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`خطا در پیش‌بینی PD: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        pdValueSpan.textContent = (result.pd_probability * 100).toFixed(2);
        riskCategorySpan.textContent = result.risk_category;

        // Update progress bar
        const pdPercentage = result.pd_probability * 100;
        pdProgressBar.style.width = `${pdPercentage}%`;

        // Change color based on risk category
        let barColor = '#28a745'; // Green for Low
        if (result.risk_category === 'بسیار پایین') barColor = '#4CAF50';
        else if (result.risk_category === 'پایین') barColor = '#8BC34A';
        else if (result.risk_category === 'متوسط') barColor = '#ffc107';
        else if (result.risk_category === 'بالا') barColor = '#ff9800';
        else if (result.risk_category === 'بسیار بالا') barColor = '#dc3545';
        pdProgressBar.style.backgroundColor = barColor;

        predictionResults.classList.remove('hidden');

    } catch (error) {
        console.error("Error:", error);
        predictionError.textContent = error.message;
        predictionResults.classList.add('hidden');
    } finally {
        hideLoading(); // پنهان کردن اسپینر
    }
});

// --- Dashboard Data Fetching and Chart Rendering ---

async function fetchDashboardData(filters = {}) {
    showLoading(); // نمایش اسپینر
    const url = new URL(`${API_BASE_URL}/dashboard_data/`);
    for (const key in filters) {
        if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
            url.searchParams.append(key, filters[key]);
        }
    }
    console.log("Fetching dashboard data from URL:", url.toString());

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`خطا در دریافت داده‌های داشبورد: ${response.status}`);
        }
        const data = await response.json();
        console.log("Dashboard Data:", data); // برای دیباگ داده‌های دریافتی
        updateKPIs(data.kpis);
        renderCharts(data); // تابع رندر چارت‌ها
        populateFilterOptions(data); // پر کردن گزینه‌های فیلتر
        updateRangeSliderValuesDisplay(); // به‌روزرسانی مقادیر نمایش اسلایدرها
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        alert(`خطا در بارگذاری داشبورد: ${error.message}`);
    } finally {
        hideLoading(); // پنهان کردن اسپینر
    }
}

function updateKPIs(kpis) {
    kpiAvgPd.textContent = `${(kpis.avg_portfolio_pd * 100).toFixed(2)}%`;
    kpiElRatio.textContent = `${(kpis.el_ratio * 100).toFixed(2)}%`;
    kpiTotalEl.textContent = `${kpis.total_el_billion_rials.toFixed(2)} میلیارد`;
    kpiCar.textContent = `${(kpis.capital_adequacy_ratio * 100).toFixed(2)}%`;
    kpiLtdRatio.textContent = `${kpis.total_loan_to_deposit_ratio.toFixed(2)}`;
}

function renderCharts(data) {
    console.log("Rendering charts with data:", data);

    // Destroy existing chart instances if they exist
    if (nplChartInstance) nplChartInstance.destroy();
    if (industryChartInstance) industryChartInstance.destroy();
    if (provinceChartInstance) provinceChartInstance.destroy();
    if (collateralChartInstance) collateralChartInstance.destroy();
    if (assetConcentrationChartInstance) assetConcentrationChartInstance.destroy(); // جدید
    if (nonPerformingLoansCountChartInstance) nonPerformingLoansCountChartInstance.destroy(); // جدید
    if (nonPerformingLoansAmountChartInstance) nonPerformingLoansAmountChartInstance.destroy(); // جدید


    // NPL Chart (تسهیلات غیرجاری)
    const nplCtx = document.getElementById('nplChart').getContext('2d');
    nplChartInstance = new Chart(nplCtx, {
        type: 'line',
        data: {
            labels: data.npl_chart_data.map(item => item.date),
            datasets: [{
                label: 'درصد تسهیلات غیرجاری',
                data: data.npl_chart_data.map(item => item.percentage),
                borderColor: chartColors[0], // استفاده از رنگ پالت
                backgroundColor: chartColors[0].replace('0.8', '0.2'), // کمرنگ‌تر برای پس‌زمینه
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    rtl: true, // برای RTL
                    labels: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif' // استفاده از فونت فارسی
                        }
                    }
                },
                tooltip: {
                    rtl: true, // برای RTL
                    titleFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    },
                    bodyFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'درصد',
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'تاریخ',
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                }
            }
        }
    });

    // Industry Chart (تسهیلات بر اساس صنعت)
    const industryCtx = document.getElementById('industryChart').getContext('2d');
    industryChartInstance = new Chart(industryCtx, {
        type: 'bar', // یا 'pie' / 'doughnut'
        data: {
            labels: data.portfolio_by_industry_chart_data.map(item => item.industry),
            datasets: [{
                label: 'مبلغ تسهیلات (میلیارد ریال)',
                data: data.portfolio_by_industry_chart_data.map(item => item.amount),
                backgroundColor: chartColors.slice(0, data.portfolio_by_industry_chart_data.length), // استفاده از پالت
                borderColor: chartBorderColors.slice(0, data.portfolio_by_industry_chart_data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    },
                    bodyFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'مبلغ (میلیارد ریال)',
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'صنعت',
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                }
            }
        }
    });

    // Province Chart (تسهیلات بر اساس استان)
    const provinceCtx = document.getElementById('provinceChart').getContext('2d');
    provinceChartInstance = new Chart(provinceCtx, {
        type: 'bar', // یا 'pie' / 'doughnut'
        data: {
            labels: data.portfolio_by_province_chart_data.map(item => item.province),
            datasets: [{
                label: 'مبلغ تسهیلات (میلیارد ریال)',
                data: data.portfolio_by_province_chart_data.map(item => item.amount),
                backgroundColor: chartColors.slice(0, data.portfolio_by_province_chart_data.length).reverse(), // استفاده از پالت معکوس برای تنوع بیشتر
                borderColor: chartBorderColors.slice(0, data.portfolio_by_province_chart_data.length).reverse(),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    },
                    bodyFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'مبلغ (میلیارد ریال)',
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'استان',
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    },
                    ticks: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                }
            }
        }
    });

    // Collateral Chart (ارزش وثایق)
    const collateralCtx = document.getElementById('collateralChart').getContext('2d');
    collateralChartInstance = new Chart(collateralCtx, {
        type: 'pie', // یا 'doughnut'
        data: {
            labels: data.collateral_type_chart_data.map(item => item.type),
            datasets: [{
                label: 'ارزش وثیقه',
                data: data.collateral_type_chart_data.map(item => item.value),
                backgroundColor: chartColors.slice(0, data.collateral_type_chart_data.length),
                borderColor: chartBorderColors.slice(0, data.collateral_type_chart_data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    rtl: true,
                    labels: {
                        font: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        }
                    }
                },
                tooltip: {
                    rtl: true,
                    titleFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    },
                    bodyFont: {
                        family: 'Vazirmatn, Arial, sans-serif'
                    }
                }
            }
        }
    });

    // --- نمودارهای جدید ---

    // Asset Concentration Chart (تمرکز انواع وثایق)
    if (data.asset_concentration_chart_data) {
        const assetConcentrationCtx = document.getElementById('assetConcentrationChart').getContext('2d');
        assetConcentrationChartInstance = new Chart(assetConcentrationCtx, {
            type: 'doughnut',
            data: {
                labels: data.asset_concentration_chart_data.map(item => item.type),
                datasets: [{
                    label: 'درصد',
                    data: data.asset_concentration_chart_data.map(item => item.percentage),
                    backgroundColor: chartColors.slice(0, data.asset_concentration_chart_data.length),
                    borderColor: chartBorderColors.slice(0, data.asset_concentration_chart_data.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        },
                        bodyFont: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += context.parsed + '%';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }


    // Non-Performing Loans by Industry (Count) (تسهیلات غیرجاری در صنایع - تعداد)
    if (data.non_performing_loans_count_chart_data) {
        const nonPerformingLoansCountCtx = document.getElementById('nonPerformingLoansCountChart').getContext('2d');
        nonPerformingLoansCountChartInstance = new Chart(nonPerformingLoansCountCtx, {
            type: 'bar',
            data: {
                labels: data.non_performing_loans_count_chart_data.map(item => item.industry),
                datasets: [{
                    label: 'درصد تعداد',
                    data: data.non_performing_loans_count_chart_data.map(item => item.count),
                    backgroundColor: chartColors.slice(0, data.non_performing_loans_count_chart_data.length),
                    borderColor: chartBorderColors.slice(0, data.non_performing_loans_count_chart_data.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // برای نمودار میله‌ای افقی
                plugins: {
                    legend: {
                        display: true,
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        },
                        bodyFont: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
                                    label += context.parsed.x + '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'درصد',
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'صنعت',
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    }
                }
            }
        });
    }

    // Non-Performing Loans by Industry (Amount) (تسهیلات غیرجاری در صنایع - مبلغ)
    if (data.non_performing_loans_amount_chart_data) {
        const nonPerformingLoansAmountCtx = document.getElementById('nonPerformingLoansAmountChart').getContext('2d');
        nonPerformingLoansAmountChartInstance = new Chart(nonPerformingLoansAmountCtx, {
            type: 'bar',
            data: {
                labels: data.non_performing_loans_amount_chart_data.map(item => item.industry),
                datasets: [{
                    label: 'درصد مبلغ',
                    data: data.non_performing_loans_amount_chart_data.map(item => item.amount),
                    backgroundColor: chartColors.slice(0, data.non_performing_loans_amount_chart_data.length).reverse(),
                    borderColor: chartBorderColors.slice(0, data.non_performing_loans_amount_chart_data.length).reverse(),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // برای نمودار میله‌ای افقی
                plugins: {
                    legend: {
                        display: true,
                        rtl: true,
                        labels: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        titleFont: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        },
                        bodyFont: {
                            family: 'Vazirmatn, Arial, sans-serif'
                        },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.x !== null) {
                                    label += context.parsed.x + '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'درصد',
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'صنعت',
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        },
                        ticks: {
                            font: {
                                family: 'Vazirmatn, Arial, sans-serif'
                            }
                        }
                    }
                }
            }
        });
    }
}


// --- Filter and Parametric Reporting Logic ---
function populateFilterOptions(data) {
    // Populate Industry Select
    if (data.available_industries) {
        const currentIndustry = filterIndustrySelect.value;
        filterIndustrySelect.innerHTML = '<option value="">همه</option>';
        data.available_industries.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry;
            option.textContent = industry;
            filterIndustrySelect.appendChild(option);
        });
        filterIndustrySelect.value = currentIndustry; // Restore selected value if any
    }


    // Populate Province Select
    if (data.available_provinces) {
        const currentProvince = filterProvinceSelect.value;
        filterProvinceSelect.innerHTML = '<option value="">همه</option>';
        data.available_provinces.forEach(province => {
            const option = document.createElement('option');
            option.value = province;
            option.textContent = province;
            filterProvinceSelect.appendChild(option);
        });
        filterProvinceSelect.value = currentProvince; // Restore selected value if any
    }


    // Set slider ranges based on fetched data
    // Convert loan amounts to Billions for display in sliders
    if (data.min_loan_amount !== undefined && data.max_loan_amount !== undefined) {
        const minLoanBillions = (data.min_loan_amount / 1_000_000_000).toFixed(0);
        const maxLoanBillions = (data.max_loan_amount / 1_000_000_000).toFixed(0);
        filterLoanMinInput.min = minLoanBillions;
        filterLoanMinInput.max = maxLoanBillions;
        filterLoanMaxInput.min = minLoanBillions;
        filterLoanMaxInput.max = maxLoanBillions;
    }

    if (data.min_credit_score !== undefined && data.max_credit_score !== undefined) {
        filterCreditMinInput.min = data.min_credit_score;
        filterCreditMinInput.max = data.max_credit_score;
        filterCreditMaxInput.min = data.min_credit_score;
        filterCreditMaxInput.max = data.max_credit_score;
    }

    // Set initial values for range sliders to full range only if they are not already set
    // or if they represent the "all" state (e.g., after a reset or on first load without active filters)
    const noFiltersActive = filterIndustrySelect.value === '' &&
                            filterProvinceSelect.value === '' &&
                            filterLoanMinInput.value === filterLoanMinInput.min &&
                            filterLoanMaxInput.value === filterLoanMaxInput.max &&
                            filterCreditMinInput.value === filterCreditMinInput.min &&
                            filterCreditMaxInput.value === filterCreditMaxInput.max;

    const slidersNotSet = filterLoanMinInput.value === '' || filterLoanMaxInput.value === '' ||
                          filterCreditMinInput.value === '' || filterCreditMaxInput.value === '';

    if (noFiltersActive || slidersNotSet) {
        if (filterLoanMinInput.min) filterLoanMinInput.value = filterLoanMinInput.min;
        if (filterLoanMaxInput.max) filterLoanMaxInput.value = filterLoanMaxInput.max;
        if (filterCreditMinInput.min) filterCreditMinInput.value = filterCreditMinInput.min;
        if (filterCreditMaxInput.max) filterCreditMaxInput.value = filterCreditMaxInput.max;
    }
}


function updateRangeSliderValuesDisplay() {
    if (filterLoanMinInput.value) {
        loanMinValSpan.textContent = `${parseFloat(filterLoanMinInput.value).toLocaleString('fa-IR')} میلیارد ریال`;
    } else if (filterLoanMinInput.min) {
         loanMinValSpan.textContent = `${parseFloat(filterLoanMinInput.min).toLocaleString('fa-IR')} میلیارد ریال`;
    }

    if (filterLoanMaxInput.value) {
        loanMaxValSpan.textContent = `${parseFloat(filterLoanMaxInput.value).toLocaleString('fa-IR')} میلیارد ریال`;
    } else if (filterLoanMaxInput.max) {
        loanMaxValSpan.textContent = `${parseFloat(filterLoanMaxInput.max).toLocaleString('fa-IR')} میلیارد ریال`;
    }


    if (filterCreditMinInput.value) {
        creditMinValSpan.textContent = parseInt(filterCreditMinInput.value).toLocaleString('fa-IR');
    } else if (filterCreditMinInput.min) {
        creditMinValSpan.textContent = parseInt(filterCreditMinInput.min).toLocaleString('fa-IR');
    }

    if (filterCreditMaxInput.value) {
        creditMaxValSpan.textContent = parseInt(filterCreditMaxInput.value).toLocaleString('fa-IR');
    } else if (filterCreditMaxInput.max) {
        creditMaxValSpan.textContent = parseInt(filterCreditMaxInput.max).toLocaleString('fa-IR');
    }
}

// Update display on slider input
filterLoanMinInput.addEventListener('input', updateRangeSliderValuesDisplay);
filterLoanMaxInput.addEventListener('input', updateRangeSliderValuesDisplay);
filterCreditMinInput.addEventListener('input', updateRangeSliderValuesDisplay);
filterCreditMaxInput.addEventListener('input', updateRangeSliderValuesDisplay);


applyFilterBtn.addEventListener('click', () => {
    const filters = {
        industry: filterIndustrySelect.value,
        province: filterProvinceSelect.value,
        loan_min: filterLoanMinInput.value ? parseFloat(filterLoanMinInput.value) * 1_000_000_000 : null,
        loan_max: filterLoanMaxInput.value ? parseFloat(filterLoanMaxInput.value) * 1_000_000_000 : null,
        credit_score_min: filterCreditMinInput.value ? parseInt(filterCreditMinInput.value) : null,
        credit_score_max: filterCreditMaxInput.value ? parseInt(filterCreditMaxInput.value) : null,
    };
    fetchDashboardData(filters);
});

resetFilterBtn.addEventListener('click', () => {
    filterIndustrySelect.value = '';
    filterProvinceSelect.value = '';

    if (filterLoanMinInput.min) filterLoanMinInput.value = filterLoanMinInput.min;
    if (filterLoanMaxInput.max) filterLoanMaxInput.value = filterLoanMaxInput.max;
    if (filterCreditMinInput.min) filterCreditMinInput.value = filterCreditMinInput.min;
    if (filterCreditMaxInput.max) filterCreditMaxInput.value = filterCreditMaxInput.max;

    updateRangeSliderValuesDisplay();
    fetchDashboardData(); // Fetch with no filters
});

// Initial call to fetch data when the dashboard is first loaded (if dashboard is the default page after login)
// Or ensure fetchDashboardData is called when navDashboard is clicked (which it is).
// Call updateRangeSliderValuesDisplay on load to set initial text based on slider default values
document.addEventListener('DOMContentLoaded', () => {
    // ... (auth logic)
    if (localStorage.getItem('isAuthenticated') === 'true') {
        // ...
        // If dashboard is shown by default, data will be fetched by navDashboard click handler or explicitly.
        // For now, ensure sliders display correctly if dashboard is the first view.
        if (dashboardPage.classList.contains('active') || (!loginPage.classList.contains('hidden') && mainContent.classList.contains('hidden'))) {
            // If dashboard is potentially active on load, ensure its filters and displays are initialized
           // This is now better handled by fetchDashboardData -> populateFilterOptions -> updateRangeSliderValuesDisplay
        }
    }
     // Initial population of slider display text
    updateRangeSliderValuesDisplay();
});