document.addEventListener('DOMContentLoaded', () => {
    let currentEndpoint = 'trims';
    let currentLang = 'response';
    let lastResponseJson = null;
    let lastRequestUrl = '';

    const endpointTabs = document.querySelectorAll('#endpoint-tabs .ep-tab');
    const langTabs = document.querySelectorAll('.console-lang-selector .lang-tab-btn');
    const codeOutput = document.getElementById('code-output-element');
    const statusBadge = document.getElementById('status-badge');
    const durationBadge = document.getElementById('duration-badge');
    const btnExecute = document.getElementById('btn-execute');
    const btnCopy = document.getElementById('btn-copy');

    // Form Groups
    const groupModel = document.getElementById('group-model');
    const groupCountry = document.getElementById('group-country');
    const groupSearch = document.getElementById('group-search');
    const groupVin = document.getElementById('group-vin');

    const selectModel = document.getElementById('select-model');
    const selectCountry = document.getElementById('select-country');
    const inputSearch = document.getElementById('input-search');
    const inputVin = document.getElementById('input-vin');

    // Pricing elements
    const btnMonthly = document.getElementById('btn-monthly');
    const btnYearly = document.getElementById('btn-yearly');
    const pricePro = document.getElementById('price-pro');
    const priceTeams = document.getElementById('price-teams');

    // Tab switching
    endpointTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            endpointTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentEndpoint = tab.dataset.endpoint;
            updateFormVisibility();
            executeRequest();
        });
    });

    langTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            langTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentLang = tab.dataset.lang;
            renderCodeOutput();
        });
    });

    btnExecute.addEventListener('click', executeRequest);

    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(codeOutput.textContent);
        const orig = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(() => { btnCopy.textContent = orig; }, 1500);
    });

    // Pricing toggle
    if (btnMonthly && btnYearly) {
        btnMonthly.addEventListener('click', () => {
            btnMonthly.classList.add('active');
            btnYearly.classList.remove('active');
            if (pricePro) pricePro.innerHTML = '$19<span> / mo</span>';
            if (priceTeams) priceTeams.innerHTML = '$29<span> / mo</span>';
        });

        btnYearly.addEventListener('click', () => {
            btnYearly.classList.add('active');
            btnMonthly.classList.remove('active');
            if (pricePro) pricePro.innerHTML = '$15<span> / mo</span>';
            if (priceTeams) priceTeams.innerHTML = '$23<span> / mo</span>';
        });
    }

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (btn) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                faqItems.forEach(i => i.classList.remove('open'));
                if (!isOpen) {
                    item.classList.add('open');
                }
            });
        }
    });

    function updateFormVisibility() {
        groupModel.style.display = 'none';
        groupCountry.style.display = 'none';
        groupSearch.style.display = 'none';
        groupVin.style.display = 'none';

        if (currentEndpoint === 'trims') {
            groupModel.style.display = 'block';
            groupCountry.style.display = 'block';
        } else if (currentEndpoint === 'models') {
            groupCountry.style.display = 'block';
        } else if (currentEndpoint === 'search') {
            groupSearch.style.display = 'block';
            groupCountry.style.display = 'block';
        } else if (currentEndpoint === 'nhtsa') {
            groupVin.style.display = 'block';
        } else if (currentEndpoint === 'manufacturers') {
            groupCountry.style.display = 'block';
        }
    }

    function buildUrl() {
        const origin = window.location.origin;
        if (currentEndpoint === 'trims') {
            return `${origin}/api/v1/trims?model=${encodeURIComponent(selectModel.value)}&country=${encodeURIComponent(selectCountry.value)}`;
        } else if (currentEndpoint === 'models') {
            return `${origin}/api/v1/models?country=${encodeURIComponent(selectCountry.value)}`;
        } else if (currentEndpoint === 'search') {
            return `${origin}/api/v1/search?q=${encodeURIComponent(inputSearch.value)}&country=${encodeURIComponent(selectCountry.value)}`;
        } else if (currentEndpoint === 'nhtsa') {
            return `${origin}/api/v1/nhtsa/decode/${encodeURIComponent(inputVin.value.trim())}`;
        } else if (currentEndpoint === 'manufacturers') {
            return `${origin}/api/v1/manufacturers?country=${encodeURIComponent(selectCountry.value)}`;
        } else if (currentEndpoint === 'countries') {
            return `${origin}/api/v1/countries`;
        } else if (currentEndpoint === 'health') {
            return `${origin}/health`;
        }
        return `${origin}/health`;
    }

    async function executeRequest() {
        const url = buildUrl();
        lastRequestUrl = url;
        const startTime = performance.now();

        codeOutput.textContent = 'Fetching payload...';
        statusBadge.className = 'console-status-pill';
        statusBadge.textContent = '...';

        try {
            const res = await fetch(url);
            const duration = Math.round(performance.now() - startTime);

            durationBadge.textContent = `${duration}ms`;
            statusBadge.textContent = `${res.status} ${res.statusText || 'OK'}`;
            if (res.status === 200) {
                statusBadge.className = 'console-status-pill status-green';
            } else if (res.status === 504) {
                statusBadge.className = 'console-status-pill status-yellow';
            } else {
                statusBadge.className = 'console-status-pill status-red';
            }

            lastResponseJson = await res.json();
            renderCodeOutput();
        } catch (err) {
            statusBadge.className = 'console-status-pill status-red';
            statusBadge.textContent = 'Error';
            lastResponseJson = { error: err.message };
            renderCodeOutput();
        }
    }

    function renderCodeOutput() {
        if (currentLang === 'response') {
            codeOutput.textContent = JSON.stringify(lastResponseJson, null, 2);
        } else if (currentLang === 'curl') {
            codeOutput.textContent = `curl -X GET "${lastRequestUrl}" \\\n  -H "Accept: application/json"`;
        } else if (currentLang === 'js') {
            codeOutput.textContent = `const response = await fetch("${lastRequestUrl}");\nconst data = await response.json();\nconsole.log(data);`;
        } else if (currentLang === 'python') {
            codeOutput.textContent = `import requests\n\nresponse = requests.get("${lastRequestUrl}")\ndata = response.json()\nprint(data)`;
        }
    }

    // Initial load
    updateFormVisibility();
    executeRequest();
});
