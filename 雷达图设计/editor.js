// 全局状态
let currentData = {
    title: "手机能力雷达图",
    subtitle: "黑夜总隐藏凶险，每款电脑 0.5 ~ 5分每个维度比",
    dimensions: ["游戏", "续航", "充电", "系统", "售后", "影像", "手感", "屏幕"],
    products: [
        {
            model: "红米K80",
            abilities: {
                "游戏": 3, "续航": 5, "充电": 3, "系统": 3,
                "售后": 2, "影像": 2, "手感": 3, "屏幕": 5
            }
        }
    ]
};

let previewChart = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTableEditor();
    initJsonEditor();
    loadData(currentData);
    updatePreview();
});

// 标签页切换
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`${tabName}-editor`).classList.add('active');
            
            if (tabName === 'json') {
                syncToJson();
            }
        });
    });
}

// 初始化表格编辑器
function initTableEditor() {
    // 标题输入
    document.getElementById('chart-title').addEventListener('input', (e) => {
        currentData.title = e.target.value;
        updatePreview();
    });
    
    document.getElementById('chart-subtitle').addEventListener('input', (e) => {
        currentData.subtitle = e.target.value;
        updatePreview();
    });
    
    // 添加维度
    document.getElementById('add-dimension').addEventListener('click', () => {
        const newDim = prompt('输入新维度名称：');
        if (newDim && newDim.trim()) {
            currentData.dimensions.push(newDim.trim());
            // 为所有产品添加这个维度
            currentData.products.forEach(p => {
                p.abilities[newDim.trim()] = 0;
            });
            renderDimensions();
            renderProducts();
            updatePreview();
        }
    });
    
    // 添加产品
    document.getElementById('add-product').addEventListener('click', () => {
        const newProduct = {
            model: `新产品 ${currentData.products.length + 1}`,
            abilities: {}
        };
        currentData.dimensions.forEach(dim => {
            newProduct.abilities[dim] = 0;
        });
        currentData.products.push(newProduct);
        renderProducts();
        updatePreview();
    });
    
    // 预览按钮
    document.getElementById('preview-btn').addEventListener('click', () => {
        updatePreview();
    });
    
    // 应用到主页面
    document.getElementById('apply-to-main-btn').addEventListener('click', () => {
        applyToMainPage();
    });
    
    // 导出配置
    document.getElementById('export-config-btn').addEventListener('click', () => {
        exportConfig();
    });
    
    // 加载示例
    document.getElementById('load-sample-btn').addEventListener('click', () => {
        loadSample();
    });
}

// 初始化 JSON 编辑器
function initJsonEditor() {
    document.getElementById('format-json-btn').addEventListener('click', () => {
        try {
            const json = JSON.parse(document.getElementById('json-input').value);
            document.getElementById('json-input').value = JSON.stringify(json, null, 2);
            hideError();
        } catch (e) {
            showError('JSON 格式错误：' + e.message);
        }
    });
    
    document.getElementById('validate-json-btn').addEventListener('click', () => {
        try {
            const json = JSON.parse(document.getElementById('json-input').value);
            if (validateData(json)) {
                showError('✓ JSON 格式正确！', 'success');
            }
        } catch (e) {
            showError('JSON 格式错误：' + e.message);
        }
    });
    
    document.getElementById('apply-json-btn').addEventListener('click', () => {
        applyJson();
    });
}

// 加载数据到表格
function loadData(data) {
    document.getElementById('chart-title').value = data.title;
    document.getElementById('chart-subtitle').value = data.subtitle;
    currentData = JSON.parse(JSON.stringify(data));
    renderDimensions();
    renderProducts();
    updateStats();
}

// 渲染维度列表
function renderDimensions() {
    const container = document.getElementById('dimensions-list');
    container.innerHTML = '';
    
    currentData.dimensions.forEach((dim, index) => {
        const item = document.createElement('div');
        item.className = 'dimension-item';
        item.innerHTML = `
            <input type="text" value="${dim}" data-index="${index}">
            <button onclick="removeDimension(${index})">×</button>
        `;
        
        item.querySelector('input').addEventListener('input', (e) => {
            const oldDim = currentData.dimensions[index];
            const newDim = e.target.value;
            currentData.dimensions[index] = newDim;
            
            // 更新所有产品的维度名称
            currentData.products.forEach(p => {
                if (p.abilities[oldDim] !== undefined) {
                    p.abilities[newDim] = p.abilities[oldDim];
                    delete p.abilities[oldDim];
                }
            });
            
            renderProducts();
            updatePreview();
        });
        
        container.appendChild(item);
    });
}

// 删除维度
function removeDimension(index) {
    if (currentData.dimensions.length <= 3) {
        alert('至少需要保留 3 个维度！');
        return;
    }
    
    if (confirm(`确定删除维度"${currentData.dimensions[index]}"吗？`)) {
        const dimToRemove = currentData.dimensions[index];
        currentData.dimensions.splice(index, 1);
        
        // 从所有产品中删除这个维度
        currentData.products.forEach(p => {
            delete p.abilities[dimToRemove];
        });
        
        renderDimensions();
        renderProducts();
        updatePreview();
    }
}

// 渲染产品列表
function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    currentData.products.forEach((product, pIndex) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const header = document.createElement('div');
        header.className = 'product-header';
        header.innerHTML = `
            <input type="text" value="${product.model}" placeholder="产品名称">
            <button class="btn-danger" onclick="removeProduct(${pIndex})">删除</button>
        `;
        
        header.querySelector('input').addEventListener('input', (e) => {
            currentData.products[pIndex].model = e.target.value;
            updatePreview();
        });
        
        const abilities = document.createElement('div');
        abilities.className = 'product-abilities';
        
        currentData.dimensions.forEach(dim => {
            const abilityDiv = document.createElement('div');
            abilityDiv.className = 'ability-input';
            abilityDiv.innerHTML = `
                <label>${dim}</label>
                <input type="number" min="0" max="5" step="0.5" value="${product.abilities[dim] || 0}">
            `;
            
            abilityDiv.querySelector('input').addEventListener('input', (e) => {
                let value = parseFloat(e.target.value);
                if (value < 0) value = 0;
                if (value > 5) value = 5;
                currentData.products[pIndex].abilities[dim] = value;
                e.target.value = value;
                updatePreview();
            });
            
            abilities.appendChild(abilityDiv);
        });
        
        card.appendChild(header);
        card.appendChild(abilities);
        container.appendChild(card);
    });
}

// 删除产品
function removeProduct(index) {
    if (currentData.products.length <= 1) {
        alert('至少需要保留 1 个产品！');
        return;
    }
    
    if (confirm(`确定删除产品"${currentData.products[index].model}"吗？`)) {
        currentData.products.splice(index, 1);
        renderProducts();
        updatePreview();
    }
}

// 更新统计信息
function updateStats() {
    document.getElementById('product-count').textContent = currentData.products.length;
    document.getElementById('dimension-count').textContent = currentData.dimensions.length;
}

// 更新预览
function updatePreview() {
    updateStats();
    
    const canvas = document.getElementById('preview-chart');
    const ctx = canvas.getContext('2d');
    
    if (previewChart) {
        previewChart.destroy();
    }
    
    const colors = [
        { bg: 'rgba(102, 126, 234, 0.2)', border: 'rgb(102, 126, 234)' },
        { bg: 'rgba(237, 100, 166, 0.2)', border: 'rgb(237, 100, 166)' },
        { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgb(255, 159, 64)' },
        { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgb(75, 192, 192)' },
        { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgb(153, 102, 255)' }
    ];
    
    const datasets = currentData.products.map((product, index) => ({
        label: product.model,
        data: currentData.dimensions.map(dim => product.abilities[dim] || 0),
        backgroundColor: colors[index % colors.length].bg,
        borderColor: colors[index % colors.length].border,
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length].border,
        pointBorderColor: '#fff',
        pointRadius: 3
    }));
    
    previewChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: currentData.dimensions,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    min: 0,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#8899a6',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#e1e8ed',
                        font: { size: 11 }
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#e1e8ed',
                        padding: 10,
                        font: { size: 10 }
                    }
                }
            }
        }
    });
}

// 同步到 JSON
function syncToJson() {
    const jsonStr = JSON.stringify(currentData, null, 2);
    document.getElementById('json-input').value = jsonStr;
}

// 应用 JSON
function applyJson() {
    try {
        const json = JSON.parse(document.getElementById('json-input').value);
        
        if (validateData(json)) {
            loadData(json);
            updatePreview();
            hideError();
            alert('✓ 数据已应用！');
            
            // 切换回表格视图
            document.querySelector('[data-tab="table"]').click();
        }
    } catch (e) {
        showError('JSON 格式错误：' + e.message);
    }
}

// 验证数据
function validateData(data) {
    if (!data.title || !data.dimensions || !data.products) {
        showError('缺少必要字段：title, dimensions, products');
        return false;
    }
    
    if (!Array.isArray(data.dimensions) || data.dimensions.length < 3) {
        showError('dimensions 必须是数组且至少包含 3 个维度');
        return false;
    }
    
    if (!Array.isArray(data.products) || data.products.length < 1) {
        showError('products 必须是数组且至少包含 1 个产品');
        return false;
    }
    
    for (let product of data.products) {
        if (!product.model || !product.abilities) {
            showError(`产品缺少 model 或 abilities 字段`);
            return false;
        }
        
        for (let dim of data.dimensions) {
            if (!(dim in product.abilities)) {
                showError(`产品"${product.model}"缺少维度"${dim}"`);
                return false;
            }
        }
    }
    
    return true;
}

// 显示错误
function showError(message, type = 'error') {
    const errorDiv = document.getElementById('json-error');
    errorDiv.textContent = message;
    errorDiv.className = 'error-message show';
    if (type === 'success') {
        errorDiv.style.color = '#38ef7d';
        errorDiv.style.background = 'rgba(56, 239, 125, 0.1)';
        errorDiv.style.borderColor = 'rgba(56, 239, 125, 0.3)';
    } else {
        errorDiv.style.color = '#ff3b30';
        errorDiv.style.background = 'rgba(255, 59, 48, 0.1)';
        errorDiv.style.borderColor = 'rgba(255, 59, 48, 0.3)';
    }
    
    setTimeout(() => {
        if (type === 'success') hideError();
    }, 3000);
}

// 隐藏错误
function hideError() {
    document.getElementById('json-error').classList.remove('show');
}

// 应用到主页面
function applyToMainPage() {
    try {
        // 保存数据到 localStorage
        localStorage.setItem('radarChartData', JSON.stringify(currentData));
        
        // 显示成功提示
        const successMsg = document.getElementById('success-message');
        successMsg.classList.add('show');
        
        // 3秒后自动隐藏
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 5000);
        
        console.log('✓ 数据已保存到 localStorage');
    } catch (e) {
        alert('保存失败：' + e.message);
    }
}

// 导出配置
function exportConfig() {
    const configContent = `// 雷达图配置文件
// 生成时间: ${new Date().toLocaleString()}

const CONFIG = ${JSON.stringify(currentData, null, 2)};`;
    
    const blob = new Blob([configContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✓ 配置文件已导出！\n\n将 config.js 替换到项目目录即可使用。');
}

// 加载示例
function loadSample() {
    const samples = {
        '手机评测': {
            title: "手机能力雷达图",
            subtitle: "综合评分 0-5 分",
            dimensions: ["游戏", "续航", "充电", "系统", "售后", "影像", "手感", "屏幕"],
            products: [
                {
                    model: "红米K80",
                    abilities: { "游戏": 3, "续航": 5, "充电": 3, "系统": 3, "售后": 2, "影像": 2, "手感": 3, "屏幕": 5 }
                },
                {
                    model: "一加Ace5",
                    abilities: { "游戏": 5, "续航": 5, "充电": 2, "系统": 5, "售后": 2, "影像": 2, "手感": 3, "屏幕": 3 }
                }
            ]
        },
        '笔记本电脑': {
            title: "笔记本电脑性能对比",
            subtitle: "综合评分 0-5 分",
            dimensions: ["性能", "便携性", "续航", "屏幕", "散热", "性价比"],
            products: [
                {
                    model: "MacBook Pro 14",
                    abilities: { "性能": 5, "便携性": 4, "续航": 5, "屏幕": 5, "散热": 4, "性价比": 3 }
                },
                {
                    model: "ThinkPad X1",
                    abilities: { "性能": 4, "便携性": 5, "续航": 4, "屏幕": 4, "散热": 4, "性价比": 4 }
                }
            ]
        },
        '汽车对比': {
            title: "SUV 车型对比",
            subtitle: "综合评分 0-5 分",
            dimensions: ["动力", "油耗", "空间", "舒适性", "配置", "安全", "外观", "性价比"],
            products: [
                {
                    model: "比亚迪唐",
                    abilities: { "动力": 5, "油耗": 5, "空间": 5, "舒适性": 4, "配置": 5, "安全": 5, "外观": 4, "性价比": 5 }
                },
                {
                    model: "理想L7",
                    abilities: { "动力": 4, "油耗": 4, "空间": 5, "舒适性": 5, "配置": 5, "安全": 5, "外观": 4, "性价比": 4 }
                }
            ]
        }
    };
    
    const choice = prompt('选择示例：\n1 - 手机评测\n2 - 笔记本电脑\n3 - 汽车对比\n\n输入数字：');
    
    const sampleMap = {
        '1': '手机评测',
        '2': '笔记本电脑',
        '3': '汽车对比'
    };
    
    if (sampleMap[choice]) {
        loadData(samples[sampleMap[choice]]);
        updatePreview();
        alert(`✓ 已加载"${sampleMap[choice]}"示例！`);
    }
}
