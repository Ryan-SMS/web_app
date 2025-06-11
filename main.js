// --- API Base URL ---
const API_BASE_URL = "https://creditwiseai.onrender.com";

// --- Page Elements ---
const loginPage = document.getElementById('login-page');
const mainContent = document.getElementById('main-content');
const customerValidationPage = document.getElementById('customer-validation-page');
const dashboardPage = document.getElementById('dashboard-page');

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

// --- Filter Elements ---
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
let assetConcentrationChartInstance, nonPerformingLoansCountChartInstance, nonPerformingLoansAmountChartInstance;

const chartColors = [
  'rgba(75, 192, 192, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
  'rgba(0, 204, 102, 0.8)', 'rgba(204, 0, 204, 0.8)', 'rgba(102, 0, 204, 0.8)',
  'rgba(255, 51, 0, 0.8)', 'rgba(0, 153, 204, 0.8)', 'rgba(153, 204, 0, 0.8)', 'rgba(204, 51, 0, 0.8)', 'rgba(51, 102, 204, 0.8)'
];

const chartBorderColors = chartColors.map(color => color.replace('0.8', '1'));

const loadingSpinner = document.getElementById('loading-spinner');
function showLoading() { loadingSpinner.classList.remove('hidden'); }
function hideLoading() { loadingSpinner.classList.add('hidden'); }

function showPage(pageElement) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.add('hidden'));
  if (pageElement) {
    pageElement.classList.remove('hidden');
    pageElement.classList.add('active');
  }
  predictionResults.classList.add('hidden');
  predictionError.textContent = '';
}

function setActiveNav(navElement) {
  document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active-nav'));
  if (navElement) navElement.classList.add('active-nav');
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username === 'admin' && password === 'admin') {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('loggedInUser', username);
    loginError.textContent = '';
    loginPage.classList.add('hidden');
    mainContent.classList.remove('hidden');
    showPage(customerValidationPage);
    setActiveNav(navPredict);

    // --- Log login event ---
    fetch(`${API_BASE_URL}/log_user_action/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: username,
        action: 'login',
        ip_address: '127.0.0.1'
      })
    });

  } else {
    loginError.textContent = 'نام کاربری یا رمز عبور اشتباه است.';
  }
});

navLogout.addEventListener('click', (e) => {
  e.preventDefault();
  const username = localStorage.getItem('loggedInUser') || 'anonymous';

  // --- Log logout event ---
  fetch(`${API_BASE_URL}/log_user_action/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: username,
      action: 'logout',
      ip_address: '127.0.0.1'
    })
  });

  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('loggedInUser');
  mainContent.classList.add('hidden');
  showPage(loginPage);
  setActiveNav(null);
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  if (localStorage.getItem('isAuthenticated') === 'true') {
    loginPage.classList.add('hidden');
    mainContent.classList.remove('hidden');
    showPage(customerValidationPage);
    setActiveNav(navPredict);
  } else {
    showPage(loginPage);
    mainContent.classList.add('hidden');
    setActiveNav(null);
  }
});

navPredict.addEventListener('click', (e) => {
  e.preventDefault();
  showPage(customerValidationPage);
  setActiveNav(navPredict);
});

navDashboard.addEventListener('click', async (e) => {
  e.preventDefault();
  showPage(dashboardPage);
  setActiveNav(navDashboard);
  await fetchDashboardData();
});

pdPredictionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  predictionError.textContent = '';
  predictionResults.classList.add('hidden');
  showLoading();

  const formData = new FormData(pdPredictionForm);
  const data = {};
  for (let [key, value] of formData.entries()) {
    if (["person_age", "person_income", "person_emp_exp", "loan_amnt", "loan_int_rate", "loan_percent_income", "cb_person_cred_hist_length", "credit_score"].includes(key)) {
      data[key] = parseFloat(value);
    } else {
      data[key] = value;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/predict_pd/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`خطا در پیش‌بینی PD: ${response.status}`);
    }

    const result = await response.json();
    pdValueSpan.textContent = `${(result.pd_probability * 100).toFixed(2)}%`;
    pdProgressBar.style.width = `${(result.pd_probability * 100).toFixed(2)}%`;
    riskCategorySpan.textContent = result.risk_category;
    predictionResults.classList.remove('hidden');

    // --- Log user action to Supabase ---
    fetch(`${API_BASE_URL}/log_user_action/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: localStorage.getItem('loggedInUser') || 'anonymous',
        action: 'predict_pd',
        ip_address: '127.0.0.1'
      })
    })
    .then(res => res.json())
    .then(data => console.log("✅ لاگ ثبت شد:", data))
    .catch(err => console.error("❌ خطا در ثبت لاگ:", err));

  } catch (error) {
    predictionError.textContent = error.message;
    predictionResults.classList.add('hidden');
  } finally {
    hideLoading();
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
        console.log("✅ داده‌های دریافتی کامل:", JSON.stringify(data, null, 2));
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
    // حذف نمودارهای قبلی
    if (nplChartInstance) nplChartInstance.destroy();
    if (industryChartInstance) industryChartInstance.destroy();
    if (provinceChartInstance) provinceChartInstance.destroy();
    if (collateralChartInstance) collateralChartInstance.destroy();
    if (assetConcentrationChartInstance) assetConcentrationChartInstance.destroy();
    if (nonPerformingLoansCountChartInstance) nonPerformingLoansCountChartInstance.destroy();
    if (nonPerformingLoansAmountChartInstance) nonPerformingLoansAmountChartInstance.destroy();

    // 📈 NPL Chart
    const nplCtx = document.getElementById('nplChart').getContext('2d');
    nplChartInstance = new Chart(nplCtx, {
        type: 'pie',
        data: {
            labels: data.npl_chart_data.map(item => item.label),
            datasets: [{
                label: 'مبلغ تسهیلات غیرجاری (میلیارد ریال)',
                data: data.npl_chart_data.map(item => item.value),
                backgroundColor: chartColors.slice(0, data.npl_chart_data.length),
                borderColor: chartBorderColors.slice(0, data.npl_chart_data.length),
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
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed.toLocaleString()} میلیارد ریال`
                    }
                }
            }
        }
    });


    // 📊 Industry Chart
    const industryCtx = document.getElementById('industryChart').getContext('2d');
    industryChartInstance = new Chart(industryCtx, {
        type: 'bar',
        data: {
            labels: data.portfolio_by_industry_chart_data.map(item => item.label),
            datasets: [{
                label: 'مبلغ تسهیلات (میلیارد ریال)',
                data: data.portfolio_by_industry_chart_data.map(item => item.value),
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'مبلغ (میلیارد ریال)' } },
                x: { title: { display: true, text: 'صنعت' } }
            }
        }
    });

    // 📍 Province Chart
    const provinceCtx = document.getElementById('provinceChart').getContext('2d');
    provinceChartInstance = new Chart(provinceCtx, {
        type: 'bar',
        data: {
            labels: data.portfolio_by_province_chart_data.map(item => item.label),
            datasets: [{
                label: 'مبلغ تسهیلات (میلیارد ریال)',
                data: data.portfolio_by_province_chart_data.map(item => item.value),
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'مبلغ (میلیارد ریال)' } },
                x: { title: { display: true, text: 'استان' } }
            }
        }
    });

    // 🏦 Collateral Chart
    const collateralCtx = document.getElementById('collateralChart').getContext('2d');
    collateralChartInstance = new Chart(collateralCtx, {
        type: 'pie',
        data: {
            labels: data.collateral_type_chart_data.map(item => item.label),
            datasets: [{
                label: 'ارزش وثیقه',
                data: data.collateral_type_chart_data.map(item => item.value),
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', rtl: true },
                tooltip: { rtl: true }
            }
        }
    });

    // 🧭 Asset Concentration Chart
    const assetConcentrationCtx = document.getElementById('assetConcentrationChart').getContext('2d');
    assetConcentrationChartInstance = new Chart(assetConcentrationCtx, {
        type: 'doughnut',
        data: {
            labels: data.asset_concentration_chart_data.map(item => item.label),
            datasets: [{
                label: 'درصد تمرکز',
                data: data.asset_concentration_chart_data.map(item => item.value),
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', rtl: true },
                tooltip: {
                    rtl: true,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed}%`
                    }
                }
            }
        }
    });

    // 🧮 NPL by Industry - Count
    const countCtx = document.getElementById('nonPerformingLoansCountChart').getContext('2d');
    nonPerformingLoansCountChartInstance = new Chart(countCtx, {
        type: 'bar',
        data: {
            labels: data.non_performing_loans_by_industry_count_chart_data.map(item => item.label),
            datasets: [{
                label: 'درصد تعداد',
                data: data.non_performing_loans_by_industry_count_chart_data.map(item => item.value),
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    rtl: true,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed.x}%`
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, title: { display: true, text: 'درصد' } },
                y: { title: { display: true, text: 'صنعت' } }
            }
        }
    });

    // 💰 NPL by Industry - Amount
    const amountCtx = document.getElementById('nonPerformingLoansAmountChart').getContext('2d');
    nonPerformingLoansAmountChartInstance = new Chart(amountCtx, {
        type: 'bar',
        data: {
            labels: data.non_performing_loans_by_industry_amount_chart_data.map(item => item.label),
            datasets: [{
                label: 'درصد مبلغ',
                data: data.non_performing_loans_by_industry_amount_chart_data.map(item => item.value),
                backgroundColor: chartColors,
                borderColor: chartBorderColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    rtl: true,
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.parsed.x}%`
                    }
                }
            },
            scales: {
                x: { beginAtZero: true, title: { display: true, text: 'درصد' } },
                y: { title: { display: true, text: 'صنعت' } }
            }
        }
    });
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