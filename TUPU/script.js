// 全局变量
let network;
let allNodes = [];
let allEdges = [];
let nodesDataset;
let edgesDataset;

const colorMap = {
    '美学风格': '#FFDAFC',
    '文化运动': '#CDF0CC', 
    '音乐风格': '#A9E6FD',
    '社会潮流': '#F1248E',
    '社会现象': '#FFF2B3',
    '人物': '#b7abd1ff',
    '文化理念': '#62C9C2',
    '娱乐文化': '#F7DC6F',
    '文化复兴': '#BB8FCE',
    '数字美学': '#85C1E9',
    '代际文化': '#F8C471',
    '技术': '#AAB7B8',
    '人群': '#CCD1D1',
    '虚拟社群文化': '#AED6F1',
    '网络文化': '#F9E79F',
    '消费文化': '#D7BDE2',
    '文化融合现象': '#82E0AA',
    '青年反叛文化': '#E74C3C',
    '动漫御宅文化': '#9B59B6',
    '网络社交文化': '#3498DB',
    '粉丝社群文化': '#1ABC9C',
    '街头潮流文化': '#F39C12'
};

// 获取父级容器id，从而把item插入进去
const legendContainer = document.getElementById('legendContainer');
const categories = Object.keys(colorMap);

const legendHTML = categories.map(category => `
    <div class="legend-item">
        <div class="legend-color" style="background-color: ${colorMap[category]};"></div>
        <span class="category">${category}</span>
    </div>
`).join('');

legendContainer.innerHTML = legendHTML;

// 显示错误信息
function showError(message) {
    const errorElement = document.getElementById('error-info');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    console.error(message);
}

// 隐藏错误信息
function hideError() {
    const errorElement = document.getElementById('error-info');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// 安全地隐藏加载元素
function hideLoading() {
    const loadingElement = document.getElementById('loading-element');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 更新统计信息
function updateStats() {
    document.getElementById('total-nodes').textContent = allNodes.length;
    document.getElementById('total-edges').textContent = allEdges.length;
    document.getElementById('decade-stats').classList.add('active');
}

// 初始化函数
async function init() {
    try {
        hideError();
        
        // 检查 vis 库是否已加载
        if (typeof vis === 'undefined') {
            throw new Error('vis 网络库未正确加载，请检查网络连接或 CDN 链接');
        }
        
        console.log("开始加载数据...");
        
        let data;
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }
            data = await response.json();
            console.log("成功从外部文件加载数据");
        } catch (error) {
            console.log("data.JSON数据有误，请再次确认", error);
            showError(`数据加载失败: ${error.message}`);
            hideLoading();
            return;
        }
        
        // 验证数据结构
        if (!data.nodes || !data.edges) {
            throw new Error('数据格式错误: 缺少nodes或edges字段');
        }
        
        allNodes = data.nodes;
        allEdges = data.edges;
        
        console.log(`加载了 ${allNodes.length} 个节点和 ${allEdges.length} 条边`);
        
        updateStats();
        
        // 创建数据集 - 使用正确的 vis 对象
        const { DataSet, Network } = vis;
        
        nodesDataset = new DataSet(
            allNodes.map(node => ({
                ...node,
                color: {
                    background: colorMap[node.subculture_type] || '#666666',
                    border: '#ffffff',
                    highlight: {
                        background: colorMap[node.subculture_type] || '#666666',
                        border: '#ffffff'
                    }
                },
                font: {
                    color: node.subculture_type === '美学风格' ? '#000000' : '#000000',
                    size: 14,
                    face: 'Segoe UI'
                },
                borderWidth: 1,
                shape: 'circle'
            }))
        );
        
        edgesDataset = new DataSet(
            allEdges.map(edge => ({
                ...edge,
                color: {
                    color: '#3f12e0c5',
                    highlight: '#fbd721ff'
                },
                width: 1,
                font: {
                    color: '#ffffffff',
                    size: 10,
                    strokeWidth: 1,
                    strokeColor: '#000000'
                },
                smooth: {
                    enabled: true,
                    type: 'continuous'
                }
            }))
        );
        
        // 创建网络
        const container = document.getElementById('network');
        if (!container) {
            throw new Error('找不到网络容器元素');
        }
        
        const networkData = {
            nodes: nodesDataset,
            edges: edgesDataset
        };
        
        const options = {
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 100
                },
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -50,
                    centralGravity: 0.01,
                    springLength: 100,
                    springConstant: 0.08,
                    damping: 0.4
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 100,
                selectConnectedEdges: true,
                hoverConnectedEdges: true
            },
            nodes: {
                shape: 'circle',
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 10,
                    x: 5,
                    y: 5
                }
            },
            edges: {
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.5
                    }
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.2)',
                    size: 5,
                    x: 3,
                    y: 3
                }
            },
            layout: {
                improvedLayout: true
            }
        };
        
        network = new Network(container, networkData, options);
        
        // 移除加载提示
        hideLoading();
        
        // 添加事件监听器
        network.on('click', handleNodeClick);
        network.on('hoverNode', handleNodeHover);
        network.on('blurNode', handleNodeBlur);
        network.on('doubleClick', handleDoubleClick);
        
        console.log('知识图谱初始化成功');
        
    } catch (error) {
        console.error('初始化失败:', error);
        showError(`初始化失败: ${error.message}`);
        
        // 确保加载提示被隐藏
        hideLoading();
    }
}

// 节点点击事件处理
function handleNodeClick(params) {
    console.log('节点点击事件:', params);
    
    if (params.nodes.length > 0) {
        // 简单延迟处理，确保不是拖动结束的点击
        setTimeout(() => {
            const nodeId = params.nodes[0];
            const node = nodesDataset.get(nodeId);
            showNodeInfo(node);
        }, 50);
    } else {
        // 点击空白处显示默认信息
        const defaultInfo = document.getElementById('default-info');
        const nodeInfo = document.getElementById('node-info');
        
        if (defaultInfo) defaultInfo.style.display = 'block';
        if (nodeInfo) nodeInfo.classList.remove('active');
    }
}

// 节点悬停事件处理
function handleNodeHover(params) {
    if (network && network.canvas && network.canvas.body && network.canvas.body.container) {
        network.canvas.body.container.style.cursor = 'pointer';
    }
}

// 节点离开事件处理
function handleNodeBlur(params) {
    if (network && network.canvas && network.canvas.body && network.canvas.body.container) {
        network.canvas.body.container.style.cursor = 'default';
    }
}

// 双击事件处理
function handleDoubleClick(params) {
    if (params.nodes.length > 0) {
        network.fit({ nodes: [params.nodes[0]], animation: true });
    }
}

// 显示节点信息
function showNodeInfo(node) {
    const nodeInfo = document.getElementById('node-info');
    const defaultInfo = document.getElementById('default-info');
    
    if (!node || !nodeInfo) {
        console.error('节点数据为空或找不到节点信息元素');
        return;
    }
    
    if (defaultInfo) defaultInfo.style.display = 'none';
    nodeInfo.innerHTML = '';
    nodeInfo.classList.add('active');
    
    let html = `
        <div class="node-type">${node.subculture_type} <span class="decade-indicator">${node.active_period}</span></div>
        <h2>${node.label}</h2>
        <p class="node-description">${node.characteristics}</p>
    `;
    
    // 显示详细信息 - 根据节点类型决定显示哪些信息
    const showDetails = categories.includes(node.subculture_type);
    
    if (showDetails) {
        if (node.origin_center) {
            html += `<h3>起源地</h3><p>${node.origin_center}</p>`;
        }else{
            html += `<h3>起源地</h3><p>未知</p>`;
        }

        if (node.social_context) {
            html += `<h3>社会背景</h3><p>${node.social_context}</p>`;
        }
        
        if (node.cultural_context) {
            html += `<h3>文化背景</h3><p>${node.cultural_context}</p>`;
        }

        if (node.aesthetic_style && node.aesthetic_style.length > 0) {
            html += `<h3>美学风格</h3><div class="tags-container">`;
            node.aesthetic_style.split(/[,，]/).forEach(style => {
                html += `<span class="tag">${style}</span>`;
            });
            html += `</div>`;
        }
        
        
        if (node.audience_and_practice) {
            html += `<h3>受众与实践</h3><div class="tags-container">`;
            node.audience_and_practice.split(/[,，]/).forEach(f => {
                html += `<span class="tag">${f}</span>`;
            });
            html += `</div>`;
        }
        
        
        if (node.representatives && node.representatives.length > 0) {
            html += `<h3>代表性人物或事件</h3><div class="tags-container">`;
            node.representatives.split(/[,，]/).forEach(rep => {
                html += `<span class="tag">${rep}</span>`;
            });
            html += `</div>`;
        }
        
        if (node.dissemination_and_carrier && node.dissemination_and_carrier.length > 0) {
            html += `<h3>传播与载体</h3><div class="tags-container">`;
            node.dissemination_and_carrier.split(/[,，]/).forEach(dac => {
                html += `<span class="tag">${dac}</span>`;
            });
            html += `</div>`;
        }
        
        if (node.evolution_and_dissolution) {
            html += `<h3>演变与消解</h3><p>${node.evolution_and_dissolution}</p>`;
        }

        if (node.images) {
            html += `<h3>代表图片</h3><div class="image-container"><img src="${node.images}" alt="${node.label}" class="node-image"></div>`;
        }
    }
    
    // 显示相关关系
    const connectedEdges = network.getConnectedEdges(node.id);
    if (connectedEdges.length > 0) {
        html += `<h3>相关关系</h3><div class="relationships-container">`;
        connectedEdges.forEach(edgeId => {
            const edge = edgesDataset.get(edgeId);
            const otherNodeId = edge.from === node.id ? edge.to : edge.from;
            const otherNode = nodesDataset.get(otherNodeId);
            
            if (otherNode) {
                html += `
                <div class="relationship">
                    <span class="relationship-label">${edge.label}</span>
                    <span class="relationship-arrow">→</span>
                    <span class="relationship-node">${otherNode.label}</span>
                    <span class="decade-indicator">${otherNode.active_period}</span>
                </div>
                `;
            }
        });
        html += `</div>`;
    }
    
    nodeInfo.innerHTML = html;
    console.log('节点信息已更新');
}

function filterByDecade(decade) {
    console.log(`筛选年代: ${decade}`);
    
    // 更新按钮状态
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (decade === 'all') {
        // 显示所有节点和关系
        nodesDataset.clear();
        nodesDataset.add(
            allNodes.map(node => ({
                ...node,
                color: {
                    background: colorMap[node.subculture_type] || '#666666',
                    border: '#ffffff',
                    highlight: {
                        background: colorMap[node.subculture_type] || '#666666',
                        border: '#fbd721ff'
                    }
                },
                font: {
                    color: node.subculture_type === '美学风格' ? '#000000' : '#ffffff',
                    size: 14,
                    face: 'Segoe UI'
                },
                borderWidth: 1,
                shape: 'circle'
            }))
        );
        
        edgesDataset.clear();
        edgesDataset.add(
            allEdges.map(edge => ({
                ...edge,
                color: {
                    color: '#3f12e0c5',
                    highlight: '#fbd721ff'
                },
                width: 2,
                font: {
                    color: '#cccccc',
                    size: 12,
                    strokeWidth: 3,
                    strokeColor: '#1a1a1a'
                },
                smooth: {
                    enabled: true,
                    type: 'continuous'
                },
                dashes: false
            }))
        );
    } else {
        // 筛选节点：当前年代节点 + 有连接的其他年代节点
        const currentDecadeNodes = allNodes.filter(node => node.active_period === decade);
        console.log(`当前年代节点数量: ${currentDecadeNodes.length}`, currentDecadeNodes);
        
        const currentDecadeNodeIds = currentDecadeNodes.map(node => node.id);
        
        // 找出与当前年代节点有连接的其他年代节点
        const connectedEdges = allEdges.filter(edge => 
            currentDecadeNodeIds.includes(edge.from) || currentDecadeNodeIds.includes(edge.to)
        );
        console.log(`连接边数量: ${connectedEdges.length}`);
        
        const connectedNodeIds = new Set();
        connectedEdges.forEach(edge => {
            connectedNodeIds.add(edge.from);
            connectedNodeIds.add(edge.to);
        });
        
        // 确保当前年代的所有节点都被包含
        currentDecadeNodeIds.forEach(id => connectedNodeIds.add(id));
        
        console.log(`总共显示节点数量: ${connectedNodeIds.size}`);
        
        // 筛选出要显示的节点
        const visibleNodes = allNodes.filter(node => connectedNodeIds.has(node.id));
        
        // 筛选出要显示的边（只显示连接可见节点的边）
        const visibleEdges = allEdges.filter(edge => 
            connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to)
        );
        
        // 更新网络（点击了年代，就直接清除网络，重新生成）
        nodesDataset.clear();
        nodesDataset.add(
            visibleNodes.map(node => {
                const isCurrentDecade = node.active_period === decade;
                console.log(`节点 ${node.label} (${node.active_period}) - 当前年代: ${isCurrentDecade}`);
                
                return {
                    ...node,
                    color: {
                        background: isCurrentDecade ? (colorMap[node.subculture_type] || '#666666') : adjustOpacity(colorMap[node.subculture_type] || '#666666', 0.3),
                        border:'#ffffff',
                        highlight: {
                            background: colorMap[node.subculture_type] || '#666666',
                            border: '#fbd721ff'
                        }
                    },
                    font: {
                        color: isCurrentDecade ? 
                            (node.subculture_type === '美学风格' ? '#000000' : '#000000') : 
                            adjustOpacity(node.subculture_type === '美学风格' ? '#000000' : '#ffffff', 0.6),
                        size: isCurrentDecade ? 14 : 12,
                        face: 'Segoe UI'
                    },
                    borderWidth: isCurrentDecade ? 2 : 1,
                    shape: 'circle'
                };
            })
        );
        
        edgesDataset.clear();
        edgesDataset.add(
            visibleEdges.map(edge => {
                const fromNode = allNodes.find(n => n.id === edge.from);
                const toNode = allNodes.find(n => n.id === edge.to);
                
                // 如果边连接的两个节点都属于当前年代，用实线；否则用虚线
                const isSameDecade = fromNode.active_period === decade && toNode.active_period === decade;
                
                return {
                    ...edge,
                    color: {
                        color: isSameDecade ? '#888888' : adjustOpacity('#666666', 0.4),
                        highlight: '#fbd721ff'
                    },
                    width: isSameDecade ? 2 : 1,
                    font: {
                        color: adjustOpacity('#ffffff', 1),
                        size: 10,
                        strokeWidth: 1,
                        strokeColor: '#1a1a1a'
                    },
                    smooth: {
                        enabled: true,
                        type: 'continuous'
                    },
                    dashes: !isSameDecade,
                    shadow: {
                        enabled: isSameDecade,
                        color: 'rgba(0,0,0,0.3)',
                        size: 5,
                        x: 3,
                        y: 3
                    }
                };
            })
        );
    }
    
    const defaultInfo = document.getElementById('default-info');
    const nodeInfo = document.getElementById('node-info');
    
    if (defaultInfo) defaultInfo.style.display = 'block';
    if (nodeInfo) nodeInfo.classList.remove('active');
    
    network.fit({ animation: true });
}

// 调整颜色透明度的辅助函数(主要面对不在本年代的关系显示内容)
function adjustOpacity(color, opacity) {
    if (color.startsWith('rgba')) {
        return color.replace(/[\d.]+\)$/g, opacity + ')');
    }
    
    // 如果是rgb颜色，转换为rgba
    if (color.startsWith('rgb')) {
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    
    // 如果是十六进制颜色，转换为rgba
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
}

// 重置视图
function resetView() {
    network.fit({ animation: true });
    
    const defaultInfo = document.getElementById('default-info');
    const nodeInfo = document.getElementById('node-info');
    
    if (defaultInfo) defaultInfo.style.display = 'block';
    if (nodeInfo) nodeInfo.classList.remove('active');
}

// 初始化应用
document.addEventListener('DOMContentLoaded', init);