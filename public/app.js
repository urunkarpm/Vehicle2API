document.addEventListener('DOMContentLoaded', () => {
    let currentEndpoint = 'trims';
    let currentLang = 'response';
    let lastResponseJson = null;
    let lastRequestUrl = '';

    const endpointTabs = document.querySelectorAll('#endpoint-tabs .tab-btn');
    const langTabs = document.querySelectorAll('.code-lang-tabs .lang-btn');
    const codeContent = document.getElementById('code-content');
    const responseStatus = document.getElementById('response-status');
    const responseTime = document.getElementById('response-time');
    const btnSendRequest = document.getElementById('btn-send-request');
    const btnCopyCode = document.getElementById('btn-copy-code');

    // Param input groups
    const paramModelGroup = document.getElementById('param-model-group');
    const paramCountryGroup = document.getElementById('param-country-group');
    const paramSearchGroup = document.getElementById('param-search-group');
    const paramVinGroup = document.getElementById('param-vin-group');

    const paramModel = document.getElementById('param-model');
    const paramCountry = document.getElementById('param-country');
    const paramSearch = document.getElementById('param-search');
    const paramVin = document.getElementById('param-vin');

    // Fetch initial health metrics
    fetchMetrics();

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
            renderCode();
        });
    });

    btnSendRequest.addEventListener('click', executeRequest);

    btnCopyCode.addEventListener('click', () => {
        navigator.clipboard.writeText(codeContent.textContent);
        const origText = btnCopyCode.textContent;
        btnCopyCode.textContent = 'Copied!';
        setTimeout(() => { btnCopyCode.textContent = origText; }, 1500);
    });

    function updateFormVisibility() {
        paramModelGroup.style.display = 'none';
        paramCountryGroup.style.display = 'none';
        paramSearchGroup.style.display = 'none';
        paramVinGroup.style.display = 'none';

        if (currentEndpoint === 'trims') {
            paramModelGroup.style.display = 'block';
            paramCountryGroup.style.display = 'block';
        } else if (currentEndpoint === 'models') {
            paramCountryGroup.style.display = 'block';
        } else if (currentEndpoint === 'search') {
            paramSearchGroup.style.display = 'block';
            paramCountryGroup.style.display = 'block';
        } else if (currentEndpoint === 'nhtsa') {
            paramVinGroup.style.display = 'block';
        } else if (currentEndpoint === 'manufacturers') {
            paramCountryGroup.style.display = 'block';
        }
    }

    function buildUrl() {
        const origin = window.location.origin;
        if (currentEndpoint === 'trims') {
            return `${origin}/api/v1/trims?model=${encodeURIComponent(paramModel.value)}&country=${encodeURIComponent(paramCountry.value)}`;
        } else if (currentEndpoint === 'models') {
            return `${origin}/api/v1/models?country=${encodeURIComponent(paramCountry.value)}`;
        } else if (currentEndpoint === 'search') {
            return `${origin}/api/v1/search?q=${encodeURIComponent(paramSearch.value)}&country=${encodeURIComponent(paramCountry.value)}`;
        } else if (currentEndpoint === 'nhtsa') {
            return `${origin}/api/v1/nhtsa/decode/${encodeURIComponent(paramVin.value.trim())}`;
        } else if (currentEndpoint === 'manufacturers') {
            return `${origin}/api/v1/manufacturers?country=${encodeURIComponent(paramCountry.value)}`;
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

        codeContent.textContent = 'Fetching payload...';
        responseStatus.className = 'code-status';
        responseStatus.textContent = '...';

        try {
            const res = await fetch(url);
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            responseTime.textContent = `${duration}ms`;
            responseStatus.textContent = `${res.status} ${res.statusText || 'OK'}`;
            if (res.status === 200) {
                responseStatus.className = 'code-status status-200';
            } else if (res.status === 504) {
                responseStatus.className = 'code-status status-504';
            } else {
                responseStatus.className = 'code-status status-400';
            }

            lastResponseJson = await res.json();
            renderCode();
        } catch (err) {
            responseStatus.className = 'code-status status-400';
            responseStatus.textContent = 'Error';
            lastResponseJson = { error: err.message };
            renderCode();
        }
    }

    function renderCode() {
        if (currentLang === 'response') {
            codeContent.textContent = JSON.stringify(lastResponseJson, null, 2);
        } else if (currentLang === 'curl') {
            codeContent.textContent = `curl -X GET "${lastRequestUrl}" \\\n  -H "Accept: application/json"`;
        } else if (currentLang === 'js') {
            codeContent.textContent = `const response = await fetch("${lastRequestUrl}");\nconst data = await response.json();\nconsole.log(data);`;
        } else if (currentLang === 'python') {
            codeContent.textContent = `import requests\n\nresponse = requests.get("${lastRequestUrl}")\ndata = response.json()\nprint(data)`;
        }
    }

    async function fetchMetrics() {
        try {
            const res = await fetch('/health');
            if (res.ok) {
                const data = await res.json();
                if (data.metrics) {
                    document.getElementById('metric-countries').textContent = `${data.metrics.total_countries} Markets`;
                    document.getElementById('metric-manufacturers').textContent = `${data.metrics.total_manufacturers} Brands`;
                    document.getElementById('metric-models').textContent = `${data.metrics.total_models} Models`;
                    document.getElementById('metric-trims').textContent = `${data.metrics.total_trims} Trims`;
                }
            }
        } catch (e) {
            // fallback stays default
        }
    }

    // Initial render
    updateFormVisibility();
    executeRequest();
});
