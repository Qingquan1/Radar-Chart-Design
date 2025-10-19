// ===== 数据加载 =====
// 优先级：localStorage > config.js > 默认数据
let phonesData = {};
let abilityLabels = [];

// 1. 检查 localStorage（从编辑器应用的数据）
const savedData = localStorage.getItem('radarChartData');
if (savedData) {
    try {
        const data = JSON.parse(savedData);
        phonesData = {
            phones: data.products
        };
        abilityLabels = data.dimensions;
        // 更新页面标题
        if (data.title) {
            document.addEventListener('DOMContentLoaded', () => {
                document.querySelector('header h1').textContent = data.title;
                if (data.subtitle) {
                    document.querySelector('.subtitle').textContent = data.subtitle;
                }
            });
        }
        console.log('✓ 已加载编辑器数据');
    } catch (e) {
        console.error('localStorage 数据解析失败:', e);
    }
}
// 2. 检查是否有 config.js 配置
else if (typeof CONFIG !== 'undefined') {
    phonesData = {
        phones: CONFIG.products
    };
    abilityLabels = CONFIG.dimensions;
    // 更新页面标题
    if (CONFIG.title) {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelector('header h1').textContent = CONFIG.title;
            if (CONFIG.subtitle) {
                document.querySelector('.subtitle').textContent = CONFIG.subtitle;
            }
        });
    }
    console.log('✓ 已加载 config.js 配置');
}
// 3. 使用默认数据
else {
    // 默认数据（如果没有 config.js）
    phonesData = {
      "phones": [
    {
      "model": "红米K80",
      "abilities": {
        "游戏": 3,
        "续航": 5,
        "充电": 3,
        "系统": 3,
        "售后": 2,
        "影像": 2,
        "手感": 3,
        "屏幕": 5
      }
    },
    {
      "model": "一加Ace5",
      "abilities": {
        "游戏": 5,
        "续航": 5,
        "充电": 2,
        "系统": 5,
        "售后": 2,
        "影像": 2,
        "手感": 3,
        "屏幕": 3
      }
    },
    {
      "model": "一加Ace5竞速版",
      "abilities": {
        "游戏": 2,
        "续航": 5,
        "充电": 2,
        "系统": 3,
        "售后": 2,
        "影像": 1,
        "手感": 3,
        "屏幕": 2
      }
    },
    {
      "model": "荣耀GT",
      "abilities": {
        "游戏": 5,
        "续航": 3,
        "充电": 5,
        "系统": 3,
        "售后": 5,
        "影像": 2,
        "手感": 5,
        "屏幕": 3
      }
    },
    {
      "model": "iQOO Z10 Turbo",
      "abilities": {
        "游戏": 3,
        "续航": 5,
        "充电": 2,
        "系统": 3,
        "售后": 2,
        "影像": 2,
        "手感": 2,
        "屏幕": 3
      }
    },
    {
      "model": "真我Neo7",
      "abilities": {
        "游戏": 5,
        "续航": 5,
        "充电": 2,
        "系统": 3,
        "售后": 2,
        "影像": 2,
        "手感": 2,
        "屏幕": 3
      }
    },
    {
      "model": "iQOO Neo10",
      "abilities": {
        "游戏": 5,
        "续航": 3,
        "充电": 5,
        "系统": 3,
        "售后": 2,
        "影像": 3,
        "手感": 2,
        "屏幕": 5
      }
    }
  ]
    };
    // 默认维度标签
    abilityLabels = ['游戏', '续航', '充电', '系统', '售后', '影像', '手感', '屏幕'];
}

// 颜色方案
const colors = [
    { bg: 'rgba(102, 126, 234, 0.2)', border: 'rgb(102, 126, 234)' },
    { bg: 'rgba(237, 100, 166, 0.2)', border: 'rgb(237, 100, 166)' },
    { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgb(255, 159, 64)' },
    { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgb(75, 192, 192)' },
    { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgb(153, 102, 255)' },
    { bg: 'rgba(255, 205, 86, 0.2)', border: 'rgb(255, 205, 86)' },
    { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgb(54, 162, 235)' }
];

// 全局状态
let mainChart = null;
let individualCharts = [];
let activePhones = new Set(phonesData.phones.map((_, i) => i));

// 初始化应用
function init() {
    createLegend();
    createMainChart();
    createIndividualCharts();
}

// 创建图例
function createLegend() {
    const legendContainer = document.getElementById('phoneLegend');
    
    phonesData.phones.forEach((phone, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item active';
        legendItem.style.setProperty('--phone-color', colors[index].border);
        
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = colors[index].border;
        
        const label = document.createElement('span');
        label.className = 'legend-label';
        label.textContent = phone.model;
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        
        legendItem.addEventListener('click', () => togglePhone(index, legendItem));
        
        legendContainer.appendChild(legendItem);
    });
}

// 切换手机显示状态
function togglePhone(index, legendItem) {
    if (activePhones.has(index)) {
        activePhones.delete(index);
        legendItem.classList.remove('active');
        legendItem.classList.add('inactive');
    } else {
        activePhones.add(index);
        legendItem.classList.remove('inactive');
        legendItem.classList.add('active');
    }
    
    updateMainChart();
}

// 创建主雷达图
function createMainChart() {
    const ctx = document.getElementById('mainRadarChart').getContext('2d');
    
    const datasets = phonesData.phones.map((phone, index) => ({
        label: phone.model,
        data: abilityLabels.map(label => phone.abilities[label]),
        backgroundColor: colors[index].bg,
        borderColor: colors[index].border,
        borderWidth: 2,
        pointBackgroundColor: colors[index].border,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: colors[index].border,
        pointRadius: 4,
        pointHoverRadius: 6,
        hidden: false
    }));
    
    mainChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: abilityLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#8899a6',
                        backdropColor: 'transparent',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        circular: true
                    },
                    pointLabels: {
                        color: '#e1e8ed',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.r} 分`;
                        }
                    }
                }
            },
            interaction: {
                mode: 'point',
                intersect: true
            }
        }
    });
}

// 更新主雷达图
function updateMainChart() {
    mainChart.data.datasets.forEach((dataset, index) => {
        dataset.hidden = !activePhones.has(index);
    });
    mainChart.update();
}

// 导出雷达图为图片（不含标题）
function exportChartAsImage(chart, phone, index) {
    // 创建临时canvas用于导出
    const tempCanvas = document.createElement('canvas');
    const size = 620; // 导出图片尺寸
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    
    // 自定义插件：在图表渲染前绘制背景
    const backgroundPlugin = {
        id: 'customCanvasBackgroundColor',
        beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#1a2332';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };
    
    // 创建临时图表配置（更大的字体和更清晰的样式）
    const tempChartConfig = {
        type: 'radar',
        data: {
            labels: abilityLabels,
            datasets: [{
                data: abilityLabels.map(label => phone.abilities[label]),
                backgroundColor: colors[index].bg,
                borderColor: colors[index].border,
                borderWidth: 3,
                pointBackgroundColor: colors[index].border,
                pointBorderColor: '#fff',
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        },
        options: {
            responsive: false,
            animation: false,
            layout: {
                padding: {
                    top: 15,
                    right: 15,
                    bottom: 15,
                    left: 15
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#8899a6',
                        backdropColor: 'transparent',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        circular: true,
                        lineWidth: 1
                    },
                    pointLabels: {
                        color: '#e1e8ed',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: 12
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.15)',
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        },
        plugins: [backgroundPlugin]
    };
    
    // 创建临时图表
    const tempChart = new Chart(tempCtx, tempChartConfig);
    
    // 等待渲染完成后导出
    setTimeout(() => {
        // 下载图片
        const link = document.createElement('a');
        link.download = `${phone.model}-雷达图.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
        
        // 清理临时图表
        tempChart.destroy();
    }, 200);
}

// 创建单个手机雷达图
function createIndividualCharts() {
    const container = document.getElementById('individualCharts');
    
    phonesData.phones.forEach((phone, index) => {
        const chartDiv = document.createElement('div');
        chartDiv.className = 'individual-chart';
        
        const title = document.createElement('h3');
        title.textContent = phone.model;
        
        // 创建导出按钮
        const exportBtn = document.createElement('button');
        exportBtn.className = 'export-btn';
        exportBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            导出
        `;
        exportBtn.title = '导出纯雷达图（不含型号）';
        
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'individual-chart-container';
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${index}`;
        
        canvasContainer.appendChild(canvas);
        chartDiv.appendChild(exportBtn);
        chartDiv.appendChild(title);
        chartDiv.appendChild(canvasContainer);
        container.appendChild(chartDiv);
        
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: abilityLabels,
                datasets: [{
                    label: phone.model,
                    data: abilityLabels.map(label => phone.abilities[label]),
                    backgroundColor: colors[index].bg,
                    borderColor: colors[index].border,
                    borderWidth: 2,
                    pointBackgroundColor: colors[index].border,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors[index].border,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            color: '#8899a6',
                            backdropColor: 'transparent',
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            circular: true
                        },
                        pointLabels: {
                            color: '#e1e8ed',
                            font: {
                                size: 11
                            }
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.r} 分`;
                            }
                        }
                    }
                }
            }
        });
        
        // 绑定导出按钮点击事件
        exportBtn.addEventListener('click', () => {
            exportChartAsImage(chart, phone, index);
        });
        
        individualCharts.push(chart);
    });
}

// 批量导出所有图片
async function batchExportAllCharts() {
    const btn = document.getElementById('batch-export-btn');
    btn.disabled = true;
    btn.textContent = '📦 正在生成...';
    
    try {
        // 检查 JSZip 是否加载
        if (typeof JSZip === 'undefined') {
            alert('JSZip 库未加载，请刷新页面重试');
            return;
        }
        
        const zip = new JSZip();
        const folder = zip.folder('雷达图导出');
        
        // 为每个产品生成图片
        for (let index = 0; index < phonesData.phones.length; index++) {
            const phone = phonesData.phones[index];
            btn.textContent = `📦 正在生成 ${index + 1}/${phonesData.phones.length}...`;
            
            // 生成图片数据
            const imageData = await generateChartImage(phone, index);
            
            // 添加到 ZIP
            const fileName = `${phone.model}-雷达图.png`;
            // 移除 data:image/png;base64, 前缀
            const base64Data = imageData.split(',')[1];
            folder.file(fileName, base64Data, {base64: true});
            
            // 添加延迟，避免浏览器卡顿
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        btn.textContent = '📦 正在打包...';
        
        // 生成 ZIP 文件
        const content = await zip.generateAsync({type: 'blob'});
        
        // 下载 ZIP 文件
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0, 10);
        a.download = `雷达图批量导出-${timestamp}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        
        btn.textContent = '✓ 导出成功！';
        setTimeout(() => {
            btn.textContent = '📦 批量导出所有图片';
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('批量导出失败:', error);
        alert('批量导出失败：' + error.message);
        btn.textContent = '📦 批量导出所有图片';
        btn.disabled = false;
    }
}

// 生成单个图表的图片数据
function generateChartImage(phone, index) {
    return new Promise((resolve) => {
        // 创建临时canvas用于导出
        const tempCanvas = document.createElement('canvas');
        const size = 620;
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 自定义插件：在图表渲染前绘制背景
        const backgroundPlugin = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart) => {
                const ctx = chart.canvas.getContext('2d');
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = '#1a2332';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };
        
        // 创建临时图表配置
        const tempChartConfig = {
            type: 'radar',
            data: {
                labels: abilityLabels,
                datasets: [{
                    data: abilityLabels.map(label => phone.abilities[label]),
                    backgroundColor: colors[index % colors.length].bg,
                    borderColor: colors[index % colors.length].border,
                    borderWidth: 3,
                    pointBackgroundColor: colors[index % colors.length].border,
                    pointBorderColor: '#fff',
                    pointRadius: 0,
                    pointHoverRadius: 0
                }]
            },
            options: {
                responsive: false,
                animation: false,
                layout: {
                    padding: {
                        top: 15,
                        right: 15,
                        bottom: 15,
                        left: 15
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            color: '#8899a6',
                            backdropColor: 'transparent',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            circular: true,
                            lineWidth: 1
                        },
                        pointLabels: {
                            color: '#e1e8ed',
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: 12
                        },
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.15)',
                            lineWidth: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                }
            },
            plugins: [backgroundPlugin]
        };
        
        // 创建临时图表
        const tempChart = new Chart(tempCtx, tempChartConfig);
        
        // 等待渲染完成后获取图片数据
        setTimeout(() => {
            const imageData = tempCanvas.toDataURL('image/png');
            tempChart.destroy();
            resolve(imageData);
        }, 200);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // 如果有编辑器数据，显示清除按钮
    if (localStorage.getItem('radarChartData')) {
        const clearBtn = document.getElementById('clear-editor-data');
        if (clearBtn) {
            clearBtn.style.display = 'inline-block';
            clearBtn.addEventListener('click', () => {
                if (confirm('确定要恢复默认数据吗？\n\n这将清除编辑器中应用的数据。')) {
                    localStorage.removeItem('radarChartData');
                    location.reload();
                }
            });
        }
    }
    
    // 批量导出按钮
    const batchExportBtn = document.getElementById('batch-export-btn');
    if (batchExportBtn) {
        batchExportBtn.addEventListener('click', batchExportAllCharts);
    }
});
