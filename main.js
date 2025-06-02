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
    // Destroy previous chart instances if they exist
    if (nplChartInstance) nplChartInstance.destroy();
    if (industryChartInstance) industryChartInstance.destroy();
    if (provinceChartInstance) provinceChartInstance.destroy();
    if (collateralChartInstance) collateralChartInstance.destroy();

    // NPL Chart
    const nplCtx = document.getElementById('nplChart').getContext('2d');
    nplChartInstance = new Chart(nplCtx, {
        type: 'bar',
        data: {
            labels: data.npl_chart_data.map(item => item.label),
            datasets: [{
                label: 'مبلغ (میلیارد ریال)',
                data: data.npl_chart_data.map(item => item.value),
                backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545', '#6c757d'], // Green, Yellow, Orange, Red, Grey
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'مبلغ (میلیارد ریال)'
                    }
                }
            }
        }
    });

    // Portfolio by Industry Chart (Doughnut)
    const industryCtx = document.getElementById('industryChart').getContext('2d');
    industryChartInstance = new Chart(industryCtx, {
        type: 'doughnut',
        data: {
            labels: data.portfolio_by_industry_chart_data.map(item => item.label),
            datasets: [{
                label: 'مبلغ (میلیارد ریال)',
                data: data.portfolio_by_industry_chart_data.map(item => item.value),
                backgroundColor: [
                    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d', '#17a2b8',
                    '#e83e8c', '#fd7e14', '#20c997', '#6f42c1'
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('fa-IR', { style: 'decimal', minimumFractionDigits: 2 }).format(context.parsed) + ' میلیارد ریال';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Portfolio by Province Chart (Bar)
    const provinceCtx = document.getElementById('provinceChart').getContext('2d');
    provinceChartInstance = new Chart(provinceCtx, {
        type: 'bar',
        data: {
            labels: data.portfolio_by_province_chart_data.map(item => item.label),
            datasets: [{
                label: 'مبلغ (میلیارد ریال)',
                data: data.portfolio_by_province_chart_data.map(item => item.value),
                backgroundColor: '#17a2b8',
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal bars
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'مبلغ (میلیارد ریال)'
                    }
                }
            }
        }
    });

    // Collateral Type Chart (Pie)
    const collateralCtx = document.getElementById('collateralChart').getContext('2d');
    collateralChartInstance = new Chart(collateralCtx, {
        type: 'pie',
        data: {
            labels: data.collateral_type_chart_data.map(item => item.label),
            datasets: [{
                label: 'ارزش (میلیارد ریال)',
                data: data.collateral_type_chart_data.map(item => item.value),
                backgroundColor: [
                    '#f8b400', '#74b9ff', '#5f27cd', '#eb4d4b', '#badc58', '#95a5a6'
                ],
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('fa-IR', { style: 'decimal', minimumFractionDigits: 2 }).format(context.parsed) + ' میلیارد ریال';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// --- Filter and Parametric Reporting Logic ---
function populateFilterOptions(data) {
    // Populate Industry Select
    filterIndustrySelect.innerHTML = '<option value="">همه</option>';
    data.available_industries.forEach(industry => {
        const option = document.createElement('option');
        option.value = industry;
        option.textContent = industry;
        filterIndustrySelect.appendChild(option);
    });

    // Populate Province Select
    filterProvinceSelect.innerHTML = '<option value="">همه</option>';
    data.available_provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        filterProvinceSelect.appendChild(option);
    });

    // Set slider ranges based on fetched data
    // Convert loan amounts to Billions for display in sliders
    filterLoanMinInput.min = (data.min_loan_amount / 1_000_000_000).toFixed(0);
    filterLoanMinInput.max = (data.max_loan_amount / 1_000_000_000).toFixed(0);
    filterLoanMaxInput.min = (data.min_loan_amount / 1_000_000_000).toFixed(0);
    filterLoanMaxInput.max = (data.max_loan_amount / 1_000_000_000).toFixed(0);
    
    filterCreditMinInput.min = data.min_credit_score;
    filterCreditMinInput.max = data.max_credit_score;
    filterCreditMaxInput.min = data.min_credit_score;
    filterCreditMaxInput.max = data.max_credit_score;

    // Set initial values for range sliders to full range (only if not already filtered by user)
    // This check is important to prevent resetting user-applied filters immediately
    if (filterIndustrySelect.value === '' && filterProvinceSelect.value === '' && 
        parseFloat(filterLoanMinInput.value) === parseFloat(filterLoanMinInput.min) &&
        parseFloat(filterLoanMaxInput.value) === parseFloat(filterLoanMaxInput.max) &&
        parseInt(filterCreditMinInput.value) === parseInt(filterCreditMinInput.min) &&
        parseInt(filterCreditMaxInput.value) === parseInt(filterCreditMaxInput.max)) {
            
        filterLoanMinInput.value = filterLoanMinInput.min;
        filterLoanMaxInput.value = filterLoanMaxInput.max;
        filterCreditMinInput.value = filterCreditMinInput.min;
        filterCreditMaxInput.value = filterCreditMaxInput.max;
    }
    updateRangeSliderValuesDisplay(); // Initial update of display values
}

function updateRangeSliderValuesDisplay() {
    loanMinValSpan.textContent = filterLoanMinInput.value;
    loanMaxValSpan.textContent = filterLoanMaxInput.value;
    creditMinValSpan.textContent = filterCreditMinInput.value;
    creditMaxValSpan.textContent = filterCreditMaxInput.value;
}

// Event listeners for range sliders to update displayed values
filterLoanMinInput.addEventListener('input', () => {
    updateRangeSliderValuesDisplay();
    if (parseInt(filterLoanMinInput.value) > parseInt(filterLoanMaxInput.value)) {
        filterLoanMaxInput.value = filterLoanMinInput.value;
        updateRangeSliderValuesDisplay();
    }
});
filterLoanMaxInput.addEventListener('input', () => {
    updateRangeSliderValuesDisplay();
    if (parseInt(filterLoanMaxInput.value) < parseInt(filterLoanMinInput.value)) {
        filterLoanMinInput.value = filterLoanMaxInput.value;
        updateRangeSliderValuesDisplay();
    }
});

filterCreditMinInput.addEventListener('input', () => {
    updateRangeSliderValuesDisplay();
    if (parseInt(filterCreditMinInput.value) > parseInt(filterCreditMaxInput.value)) {
        filterCreditMaxInput.value = filterCreditMinInput.value;
        updateRangeSliderValuesDisplay();
    }
});
filterCreditMaxInput.addEventListener('input', () => {
    updateRangeSliderValuesDisplay();
    if (parseInt(filterCreditMaxInput.value) < parseInt(filterCreditMinInput.value)) {
        filterCreditMinInput.value = filterCreditMaxInput.value;
        updateRangeSliderValuesDisplay();
    }
});


applyFilterBtn.addEventListener('click', () => {
    const filters = {
        industry: filterIndustrySelect.value,
        province: filterProvinceSelect.value,
        // Convert slider values back to Rials from Billions for API
        min_loan: parseFloat(filterLoanMinInput.value) * 1_000_000_000, 
        max_loan: parseFloat(filterLoanMaxInput.value) * 1_000_000_000,
        min_credit: parseInt(filterCreditMinInput.value),
        max_credit: parseInt(filterCreditMaxInput.value)
    };
    fetchDashboardData(filters);
});

resetFilterBtn.addEventListener('click', () => {
    // Reset select inputs
    filterIndustrySelect.value = '';
    filterProvinceSelect.value = '';
    
    // Trigger a fetch with no filters, which will also re-populate sliders to their full range
    fetchDashboardData({}); 
});