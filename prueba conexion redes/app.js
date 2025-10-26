// Variables globales
let currentData = null;
let currentPlatform = null;
let currentUser = null;

// Funciones de navegación entre pantallas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Manejar inicio de sesión
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Mostrar estado de carga
    const loginBtn = document.getElementById('login-btn');
    const btnText = document.getElementById('login-btn-text');
    const spinner = document.getElementById('login-spinner');
    const errorMessage = document.getElementById('error-message');

    loginBtn.disabled = true;
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');

    // Simular autenticación (1.5 segundos)
    setTimeout(() => {
        // Validar que tenga formato de email y contraseña no vacía
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (emailRegex.test(email) && password.length >= 3) {
            // Login exitoso - aceptar cualquier email/password válido
            currentUser = {
                email: email,
                name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                company: 'Reputación Online'
            };

            // Limpiar formulario
            document.getElementById('login-form').reset();

            // Mostrar pantalla de selección de plataforma
            setTimeout(() => {
                showScreen('platform-selector');
                loginBtn.disabled = false;
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
            }, 300);
        } else {
            // Login fallido
            if (!emailRegex.test(email)) {
                errorMessage.textContent = '❌ Por favor ingresa un email válido.';
            } else {
                errorMessage.textContent = '❌ La contraseña debe tener al menos 3 caracteres.';
            }
            errorMessage.classList.remove('hidden');

            loginBtn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');

            // Agregar efecto de sacudida al formulario
            const loginBox = document.querySelector('.login-box');
            loginBox.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                loginBox.style.animation = '';
            }, 500);
        }
    }, 1500);
}

// Alternar visibilidad de contraseña
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('password-eye');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
}

// Conectar plataforma
async function connectPlatform(platform) {
    currentPlatform = platform;
    showScreen('connection-screen');

    // Configurar UI de conexión
    const platformName = platform === 'facebook' ? 'Facebook' : 'Instagram';
    const apiVersion = platform === 'facebook' ? 'Graph API v19.0' : 'Instagram Graph API v18.0';

    // Logo SVG según plataforma
    const logoSvg = platform === 'facebook'
        ? `<svg width="80" height="80" viewBox="0 0 24 24" fill="#1877f2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>`
        : `<svg width="80" height="80" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
            <defs>
                <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#f09433;stop-opacity:1" />
                    <stop offset="25%" style="stop-color:#e6683c;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#dc2743;stop-opacity:1" />
                    <stop offset="75%" style="stop-color:#cc2366;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#bc1888;stop-opacity:1" />
                </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>`;

    document.getElementById('connecting-logo').innerHTML = logoSvg;
    document.getElementById('connecting-title').textContent = `Conectando con ${platformName}`;
    document.getElementById('api-version').textContent = apiVersion;

    // Iniciar proceso de conexión
    await simulateConnection(platform);
}

// Simular proceso de conexión
async function simulateConnection(platform) {
    const steps = [
        { progress: 0, message: 'Iniciando conexión...', delay: 100, step: 0 },
        { progress: 15, message: 'Autenticando con OAuth 2.0...', delay: 800, log: 'Estableciendo conexión SSL/TLS...', step: 1 },
        { progress: 25, message: 'Autenticando con OAuth 2.0...', delay: 200, log: 'Token de acceso generado', step: 1 },
        { progress: 35, message: 'Verificando permisos de API...', delay: 700, log: 'Permisos verificados: read_insights, pages_read_engagement', step: 2 },
        { progress: 45, message: 'Verificando permisos de API...', delay: 300, log: 'Rate limit verificado: 1000 requests/hour', step: 2 },
        { progress: 55, message: 'Obteniendo datos de perfil...', delay: 900, log: 'Extrayendo metadatos de cuenta...', step: 3 },
        { progress: 65, message: 'Obteniendo datos de perfil...', delay: 400, log: 'Información de perfil obtenida', step: 3 },
        { progress: 70, message: 'Recolectando publicaciones...', delay: 1000, log: 'Extrayendo últimas 20 publicaciones...', step: 4 },
        { progress: 80, message: 'Recolectando publicaciones...', delay: 500, log: 'Analizando engagement metrics...', step: 4 },
        { progress: 85, message: 'Procesando métricas...', delay: 800, log: 'Calculando sentiment analysis...', step: 5 },
        { progress: 92, message: 'Procesando métricas...', delay: 400, log: 'Procesando datos demográficos...', step: 5 },
        { progress: 95, message: 'Finalizando conexión...', delay: 600, log: 'Sincronizando datos...', step: 6 },
        { progress: 100, message: '✓ Conexión completada', delay: 500, log: '✓ Conexión exitosa', step: 6 }
    ];

    const logsContainer = document.getElementById('logs-content');
    const progressFill = document.getElementById('progress-fill');
    const progressMessage = document.getElementById('progress-message');
    const progressPercent = document.getElementById('progress-percent');

    let currentStepIndex = -1;

    for (const step of steps) {
        // Actualizar indicador de paso visual
        if (step.step !== currentStepIndex) {
            currentStepIndex = step.step;
            updateStepIndicator(currentStepIndex);
        }

        if (step.log) {
            const timestamp = new Date().toISOString().substring(11, 23);
            const logLine = document.createElement('div');
            logLine.className = 'log-line';
            logLine.style.animation = 'slideInLeft 0.3s ease-out';

            // Añadir color según el tipo de log
            let logColor = '#94a3b8';
            if (step.log.includes('✓')) logColor = '#10b981';
            else if (step.log.includes('verificado')) logColor = '#06b6d4';
            else if (step.log.includes('generado')) logColor = '#f59e0b';

            logLine.innerHTML = `<span style="color: #64748b;">[${timestamp}]</span> <span style="color: ${logColor};">${step.log}</span>`;
            logsContainer.appendChild(logLine);
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }

        // Animar barra de progreso con efecto suave
        progressFill.style.width = `${step.progress}%`;
        progressMessage.textContent = step.message;
        progressPercent.textContent = `${step.progress}%`;

        // Cambiar color de la barra según el progreso
        if (step.progress === 100) {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
        }

        await new Promise(resolve => setTimeout(resolve, step.delay));
    }

    // Obtener datos
    currentData = await dataService.connect(platform);

    // Añadir logs finales con animación
    const finalLog = document.createElement('div');
    finalLog.className = 'log-line';
    finalLog.style.animation = 'slideInLeft 0.3s ease-out';
    const timestamp = new Date().toISOString().substring(11, 23);
    finalLog.innerHTML = `<span style="color: #64748b;">[${timestamp}]</span> <span style="color: #10b981;">Datos recolectados: ${currentData.apiData.dataPoints} puntos</span>`;
    logsContainer.appendChild(finalLog);

    const timeLog = document.createElement('div');
    timeLog.className = 'log-line';
    timeLog.style.animation = 'slideInLeft 0.3s ease-out';
    timeLog.innerHTML = `<span style="color: #64748b;">[${new Date().toISOString().substring(11, 23)}]</span> <span style="color: #06b6d4;">Tiempo de respuesta: ${currentData.apiData.collectionTime}ms</span>`;
    logsContainer.appendChild(timeLog);

    logsContainer.scrollTop = logsContainer.scrollHeight;

    // Esperar un momento y mostrar dashboard
    await new Promise(resolve => setTimeout(resolve, 1000));
    showDashboard();
}

// Actualizar indicador de paso visual
function updateStepIndicator(stepIndex) {
    const stepElements = document.querySelectorAll('.step');
    stepElements.forEach((el, i) => {
        if (i < stepIndex) {
            el.classList.add('completed');
            el.classList.remove('active');
        } else if (i === stepIndex) {
            el.classList.add('active');
            el.classList.remove('completed');
        } else {
            el.classList.remove('active', 'completed');
        }
    });
}

// Mostrar dashboard
function showDashboard() {
    showScreen('dashboard-screen');

    // Configurar header
    document.getElementById('profile-img').src = currentData.profileImage;
    document.getElementById('account-name').textContent = currentData.accountName;
    document.getElementById('account-id').textContent = currentData.accountId;
    document.getElementById('last-sync').textContent = currentData.apiData.lastSync.toLocaleTimeString('es-ES');

    // Animar métricas
    animateMetrics();

    // Renderizar tabs
    renderOverviewTab();
    renderPostsTab();
    renderAudienceTab();
    renderTechnicalTab();
}

// Animar métricas principales con efecto de contador suave
function animateMetrics() {
    const duration = 2500;
    const steps = 100;
    const interval = duration / steps;

    const metrics = {
        followers: { element: 'followers-count', target: currentData.metrics.followers, current: 0 },
        engagement: { element: 'engagement-rate', target: currentData.metrics.avgEngagement, current: 0, suffix: '%' },
        reach: { element: 'total-reach', target: currentData.metrics.totalReach, current: 0 },
        growth: { element: 'growth-rate', target: currentData.metrics.growthRate, current: 0, prefix: '+', suffix: '%' }
    };

    let step = 0;
    const timer = setInterval(() => {
        step++;
        // Usar función de easing para animación más suave (ease-out)
        const easeProgress = 1 - Math.pow(1 - (step / steps), 3);

        Object.values(metrics).forEach(metric => {
            metric.current = metric.target * easeProgress;
            let displayValue;

            if (metric.element === 'followers-count' || metric.element === 'total-reach') {
                displayValue = dataService.formatNumber(Math.floor(metric.current));
            } else {
                displayValue = metric.current.toFixed(1);
            }

            const prefix = metric.prefix || '';
            const suffix = metric.suffix || '';
            const element = document.getElementById(metric.element);

            if (element) {
                element.textContent = `${prefix}${displayValue}${suffix}`;

                // Añadir efecto de pulso en los últimos pasos
                if (step === steps) {
                    element.style.animation = 'pulse 0.5s ease-out';
                    setTimeout(() => {
                        element.style.animation = '';
                    }, 500);
                }
            }
        });

        if (step >= steps) {
            clearInterval(timer);

            // Añadir efecto final a las cards de métricas
            const metricCards = document.querySelectorAll('.metric-card');
            metricCards.forEach((card, i) => {
                setTimeout(() => {
                    card.style.animation = 'scaleIn 0.3s ease-out';
                    setTimeout(() => {
                        card.style.animation = '';
                    }, 300);
                }, i * 100);
            });
        }
    }, interval);
}

// Renderizar tab de vista general
function renderOverviewTab() {
    const container = document.getElementById('tab-overview');
    const data = currentData;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
            <!-- Distribución de Sentimiento -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Distribución de Sentimiento</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${renderSentimentBar('Positivo', data.sentimentDistribution.positive, '#10b981')}
                    ${renderSentimentBar('Neutral', data.sentimentDistribution.neutral, '#f59e0b')}
                    ${renderSentimentBar('Negativo', data.sentimentDistribution.negative, '#ef4444')}
                </div>
            </div>

            <!-- Tendencias de Engagement -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Tendencias de Engagement (30 días)</h3>
                ${renderEngagementChart(data.engagementTrends)}
            </div>

            <!-- Métricas de Rendimiento -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Métricas de Rendimiento</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${renderMetricRow('Posts Totales', data.metrics.totalPosts)}
                    ${renderMetricRow('Siguiendo', dataService.formatNumber(data.metrics.following))}
                    ${renderMetricRow('Horas Pico', data.metrics.peakHours.join(', ') + ' hrs')}
                </div>
            </div>

            <!-- Info de API -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Información de Conexión</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #10b981;">
                        <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: blink 1.5s ease-in-out infinite;"></span>
                        <span>Estado: Conectado</span>
                    </div>
                    <div style="font-size: 0.875rem; color: #94a3b8; line-height: 1.6;">
                        <div>API: ${data.apiData.apiVersion}</div>
                        <div>Puntos de datos: ${data.apiData.dataPoints}</div>
                        <div>Rate Limit: ${data.apiData.rateLimit}/${data.apiData.rateLimitMax}</div>
                        <div>Tiempo de respuesta: ${data.apiData.collectionTime}ms</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSentimentBar(label, percentage, color) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                <span style="color: #cbd5e1;">${label}</span>
                <span style="color: #f1f5f9; font-weight: 600;">${percentage}%</span>
            </div>
            <div style="width: 100%; height: 8px; background: rgba(51, 65, 85, 0.8); border-radius: 1rem; overflow: hidden;">
                <div style="height: 100%; background: ${color}; width: ${percentage}%; transition: width 1s ease-out;"></div>
            </div>
        </div>
    `;
}

function renderEngagementChart(trends) {
    const recentTrends = trends.slice(-15);
    const maxValue = Math.max(...recentTrends.map(t => t.value));

    const bars = recentTrends.map((trend, index) => {
        const height = (trend.value / maxValue) * 100;
        return `<div style="flex: 1; background: linear-gradient(to top, #3b82f6, #8b5cf6); border-radius: 4px 4px 0 0; height: ${height}%; transition: height 0.5s ease-out ${index * 0.05}s;"></div>`;
    }).join('');

    return `
        <div style="height: 180px; display: flex; align-items: flex-end; gap: 2px; margin-bottom: 0.5rem;">
            ${bars}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b;">
            <span>Hace 15 días</span>
            <span>Hoy</span>
        </div>
    `;
}

function renderMetricRow(label, value) {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(51, 65, 85, 0.5);">
            <span style="color: #cbd5e1;">${label}</span>
            <span style="color: #f1f5f9; font-weight: 600;">${value}</span>
        </div>
    `;
}

// Renderizar tab de publicaciones con animación escalonada
function renderPostsTab() {
    const container = document.getElementById('tab-posts');
    const posts = currentData.posts.slice(0, 10);

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${posts.map((post, index) => renderPost(post, index)).join('')}
        </div>
    `;

    // Aplicar animación escalonada a los posts
    const postElements = container.querySelectorAll('.post-card');
    postElements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, i * 100);
    });
}

function renderPost(post, index = 0) {
    const sentimentColors = {
        positive: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', emoji: '😊' },
        neutral: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', emoji: '😐' },
        negative: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', emoji: '😞' }
    };

    const sentiment = sentimentColors[post.sentiment];

    return `
        <div class="post-card" style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5); transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer;"
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 20px 40px rgba(0, 0, 0, 0.4)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <p style="color: #f1f5f9; margin-bottom: 0.75rem; line-height: 1.6;">${post.content}</p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                        ${post.hashtags.slice(0, 3).map(tag =>
                            `<span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; transition: all 0.3s ease;"
                                   onmouseover="this.style.background='rgba(59, 130, 246, 0.4)'; this.style.transform='scale(1.05)';"
                                   onmouseout="this.style.background='rgba(59, 130, 246, 0.2)'; this.style.transform='scale(1)';">${tag}</span>`
                        ).join('')}
                    </div>
                </div>
                <div style="background: ${sentiment.bg}; color: ${sentiment.text}; padding: 0.5rem 1rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 600; white-space: nowrap; margin-left: 1rem;">
                    ${sentiment.emoji}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; text-align: center; margin-bottom: 1rem; padding: 1rem 0; border-top: 1px solid rgba(51, 65, 85, 0.5); border-bottom: 1px solid rgba(51, 65, 85, 0.5);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <div style="color: #94a3b8; font-size: 0.7rem;">Likes</div>
                    <div style="color: #f1f5f9; font-weight: 600; font-size: 0.95rem;">${dataService.formatNumber(post.likes)}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <div style="color: #94a3b8; font-size: 0.7rem;">Comentarios</div>
                    <div style="color: #f1f5f9; font-weight: 600; font-size: 0.95rem;">${post.comments}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                    <div style="color: #94a3b8; font-size: 0.7rem;">Compartidos</div>
                    <div style="color: #f1f5f9; font-weight: 600; font-size: 0.95rem;">${post.shares}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <div style="color: #94a3b8; font-size: 0.7rem;">Alcance</div>
                    <div style="color: #f1f5f9; font-weight: 600; font-size: 0.95rem;">${dataService.formatNumber(post.reach)}</div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <div style="color: #94a3b8; font-size: 0.7rem;">Engagement</div>
                    <div style="color: #10b981; font-weight: 700; font-size: 0.95rem;">${post.engagement_rate}%</div>
                </div>
            </div>

            <div style="color: #64748b; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>${dataService.formatDate(post.timestamp)} • ${post.media_type}</span>
                </div>
                <span style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.7rem; font-family: monospace;">ID: ${post.id.substring(0, 8)}</span>
            </div>
        </div>
    `;
}

// Renderizar tab de audiencia
function renderAudienceTab() {
    const container = document.getElementById('tab-audience');
    const demographics = currentData.metrics.demographics;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
            <!-- Distribución por Edad -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Distribución por Edad</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${demographics.ageRanges.map(range => renderAgeBar(range)).join('')}
                </div>
            </div>

            <!-- Distribución por Género -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Distribución por Género</h3>
                ${renderGenderChart(demographics.gender)}
            </div>

            <!-- Principales Ubicaciones -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5); grid-column: 1 / -1;">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Principales Ubicaciones</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${demographics.locations.map((loc, i) => renderLocation(loc, i)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderAgeBar(range) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                <span style="color: #cbd5e1;">${range.range} años</span>
                <span style="color: #f1f5f9; font-weight: 600;">${range.percentage}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(51, 65, 85, 0.8); border-radius: 1rem; overflow: hidden;">
                <div style="height: 100%; background: linear-gradient(to right, #3b82f6, #8b5cf6); width: ${range.percentage}%; transition: width 1s ease-out;"></div>
            </div>
        </div>
    `;
}

function renderGenderChart(gender) {
    const genderData = [
        { label: 'Hombres', value: gender.male, color: 'linear-gradient(135deg, #3b82f6, #1e40af)' },
        { label: 'Mujeres', value: gender.female, color: 'linear-gradient(135deg, #ec4899, #be185d)' },
        { label: 'Otro', value: gender.other, color: 'linear-gradient(135deg, #6b7280, #374151)' }
    ];

    return `
        <div style="display: flex; justify-content: space-around; align-items: center; height: 200px;">
            ${genderData.map((item, i) => `
                <div style="text-align: center; animation: scaleIn 0.5s ease-out ${i * 0.2}s both;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; background: ${item.color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem;">
                        ${item.value}%
                    </div>
                    <div style="color: #cbd5e1; font-size: 0.875rem;">${item.label}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderLocation(location, index) {
    return `
        <div style="background: rgba(51, 65, 85, 0.5); padding: 1rem; border-radius: 0.75rem; animation: scaleIn 0.5s ease-out ${index * 0.1}s both; transition: all 0.3s ease;">
            <div style="margin-bottom: 0.75rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
            </div>
            <div style="color: #f1f5f9; font-weight: 600; margin-bottom: 0.25rem; font-size: 0.95rem;">${location.name}</div>
            <div style="color: #94a3b8; font-size: 0.875rem;">${location.percentage}% de audiencia</div>
        </div>
    `;
}

// Renderizar tab técnico
function renderTechnicalTab() {
    const container = document.getElementById('tab-technical');
    const apiData = currentData.apiData;

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
            <!-- Información de API -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5); font-family: 'Courier New', monospace;">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; font-family: -apple-system, sans-serif;">Información de API</h3>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem;">
                    ${renderTechRow('Versión API:', apiData.apiVersion)}
                    ${renderTechRow('Account ID:', currentData.accountId)}
                    ${renderTechRow('Datos Recolectados:', `${apiData.dataPoints} puntos`)}
                    ${renderTechRow('Tiempo de Respuesta:', `${apiData.collectionTime}ms`)}
                    ${renderTechRow('Rate Limit:', `${apiData.rateLimit}/${apiData.rateLimitMax}`, '#10b981')}
                    ${renderTechRow('Última Sync:', apiData.lastSync.toLocaleString('es-ES'))}
                </div>
            </div>

            <!-- Estadísticas de Conexión -->
            <div style="background: rgba(15, 23, 42, 0.6); padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(51, 65, 85, 0.5);">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Estadísticas de Conexión</h3>
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    ${renderProgressMetric('Estabilidad de Conexión', 99.8, '%', '#10b981')}
                    ${renderProgressMetric('Uso de Rate Limit', Math.round((1000 - apiData.rateLimit) / 10), '%', '#3b82f6')}
                </div>

                <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(15, 23, 42, 0.8); border-radius: 0.75rem;">
                    <div style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 0.75rem;">Protocolo de Seguridad</div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem;">
                        ${renderSecurityItem('OAuth 2.0 Authentication')}
                        ${renderSecurityItem('SSL/TLS Encryption')}
                        ${renderSecurityItem('Token Refresh Enabled')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTechRow(label, value, color = '#f1f5f9') {
    return `
        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(51, 65, 85, 0.5);">
            <span style="color: #94a3b8;">${label}</span>
            <span style="color: ${color};">${value}</span>
        </div>
    `;
}

function renderProgressMetric(label, value, suffix, color) {
    return `
        <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                <span style="color: #cbd5e1;">${label}</span>
                <span style="color: ${color}; font-weight: 600;">${value}${suffix}</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(51, 65, 85, 0.8); border-radius: 1rem; overflow: hidden;">
                <div style="height: 100%; background: ${color}; width: ${value}%; transition: width 1s ease-out;"></div>
            </div>
        </div>
    `;
}

function renderSecurityItem(text) {
    return `
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #cbd5e1;">
            <span style="color: #10b981;">✓</span>
            <span>${text}</span>
        </div>
    `;
}

// Cambiar tabs
function switchTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Desconectar de la plataforma
function disconnect() {
    currentData = null;
    currentPlatform = null;
    showScreen('platform-selector');
}

// Cerrar sesión (logout)
function logout() {
    // Confirmar logout
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        currentData = null;
        currentPlatform = null;
        currentUser = null;
        showScreen('login-screen');
    }
}
