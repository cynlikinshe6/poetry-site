// 防止重复声明：如果已经存在，就不再创建
if (!window.mySupabase) {
    const SUPABASE_URL = 'https://xkkilbqgjifclowjjqkk.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_CuLtfA-erraBD9z4LkdM2g_gc0wiYni';

    // 创建客户端并挂载到 window 对象上
    window.mySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 客户端已初始化');
}

// 直接使用 window.mySupabase，不再用 const 重复声明变量
const poemsContainer = document.getElementById('poems-container');

async function loadPoems() {
    if (!poemsContainer) {
        console.error('❌ 找不到 poems-container 元素');
        return;
    }
    poemsContainer.innerHTML = '<div class="loading">✨ 加载霓虹碎片中 ✨</div>';

    const { data, error } = await window.mySupabase
        .from('poems')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ 加载失败:', error);
        poemsContainer.innerHTML = '<div class="empty">⚠️ 加载失败，请刷新重试</div>';
        return;
    }

    if (!data || data.length === 0) {
        poemsContainer.innerHTML = '<div class="empty">🌟 还没有作品，快去创作第一首赛博诗吧～</div>';
        return;
    }

    poemsContainer.innerHTML = '';
    data.forEach(poem => {
        const card = document.createElement('div');
        card.className = 'poem-card';
        card.innerHTML = `
            <img src="${escapeHtml(poem.image_url)}" alt="赛博拼贴诗海报" loading="lazy" onerror="this.src='https://placehold.co/400x300?text=加载失败'">
            <div class="card-content">
                <div class="poem-text">${escapeHtml(poem.content).replace(/\n/g, '<br>')}</div>
                <div class="poem-meta">
                    <span>✍️ ${escapeHtml(poem.author || '匿名诗人')}</span>
                    <button class="like-btn" data-id="${poem.id}">❤️ ${poem.likes || 0}</button>
                </div>
            </div>
        `;
        poemsContainer.appendChild(card);
    });

    // 绑定点赞事件
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const currentLikes = parseInt(btn.innerText.match(/\d+/)?.[0] || 0);
            const newLikes = currentLikes + 1;
            const { error } = await window.mySupabase
                .from('poems')
                .update({ likes: newLikes })
                .eq('id', id);
            if (!error) {
                btn.innerText = `❤️ ${newLikes}`;
            } else {
                alert('点赞失败，请重试');
            }
        });
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// 页面加载完成后执行
loadPoems();

const downloadBtn = document.getElementById('downloadPlugin');
if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('插件下载链接即将开放，敬请期待！');
    });
}
// ========== 主题切换功能 ==========
function setTheme(themeName) {
    // 移除所有主题class
    document.body.classList.remove('theme-cyber', 'theme-elegant', 'theme-fun');
    // 添加选中的主题
    document.body.classList.add(`theme-${themeName}`);
    // 保存到localStorage
    localStorage.setItem('preferred-theme', themeName);
    console.log(`🎨 主题已切换为: ${themeName}`);
}

// 初始化主题（读取保存的偏好或默认使用cyber）
function initTheme() {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme && ['cyber', 'elegant', 'fun'].includes(savedTheme)) {
        setTheme(savedTheme);
    } else {
        setTheme('cyber'); // 默认赛博霓虹
    }
}

// 绑定主题切换按钮事件
function bindThemeButtons() {
    const themeBtns = document.querySelectorAll('.theme-btn');
    themeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const theme = btn.getAttribute('data-theme');
            if (theme) {
                setTheme(theme);
            }
        });
    });
}

// 页面加载完成后初始化主题
// 注意：如果你已经有 window.onload 或 DOMContentLoaded，可以合并进去
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        bindThemeButtons();
    });
} else {
    initTheme();
    bindThemeButtons();
}
// ========== 图片点击放大功能（支持左右切换） ==========
let currentImageIndex = 0;
let currentPoemsList = [];

function initImageZoom() {
    // 创建遮罩层
    const modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(10px);
        font-family: 'Courier New', monospace;
    `;
    
    // 创建主容器
    const container = document.createElement('div');
    container.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // 创建图片容器
    const imgContainer = document.createElement('div');
    imgContainer.style.cssText = `
        position: relative;
        max-width: 85%;
        max-height: 85%;
        animation: zoomIn 0.3s ease;
    `;
    
    // 创建图片元素
    const modalImg = document.createElement('img');
    modalImg.style.cssText = `
        max-width: 100%;
        max-height: 85vh;
        object-fit: contain;
        border-radius: 16px;
        box-shadow: 0 0 40px rgba(0,255,255,0.5);
        border: 2px solid #0ff;
        cursor: pointer;
    `;
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: -50px;
        right: -50px;
        background: rgba(0,255,255,0.3);
        border: 2px solid #0ff;
        color: #0ff;
        font-size: 28px;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-weight: bold;
        z-index: 10;
    `;
    
    closeBtn.onmouseover = () => {
        closeBtn.style.background = '#0ff';
        closeBtn.style.color = '#000';
        closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.background = 'rgba(0,255,255,0.3)';
        closeBtn.style.color = '#0ff';
        closeBtn.style.transform = 'scale(1)';
    };
    
    // 创建左箭头按钮
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '‹';
    prevBtn.style.cssText = `
        position: absolute;
        left: 30px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0,255,255,0.3);
        border: 2px solid #0ff;
        color: #0ff;
        font-size: 60px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-weight: bold;
        z-index: 10;
        backdrop-filter: blur(5px);
    `;
    
    // 创建右箭头按钮
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '›';
    nextBtn.style.cssText = `
        position: absolute;
        right: 30px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0,255,255,0.3);
        border: 2px solid #0ff;
        color: #0ff;
        font-size: 60px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        font-weight: bold;
        z-index: 10;
        backdrop-filter: blur(5px);
    `;
    
    // 按钮悬停效果
    [prevBtn, nextBtn].forEach(btn => {
        btn.onmouseover = () => {
            btn.style.background = '#0ff';
            btn.style.color = '#000';
            btn.style.transform = 'translateY(-50%) scale(1.1)';
        };
        btn.onmouseout = () => {
            btn.style.background = 'rgba(0,255,255,0.3)';
            btn.style.color = '#0ff';
            btn.style.transform = 'translateY(-50%) scale(1)';
        };
    });
    
    // 创建图片信息容器
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        position: absolute;
        bottom: -80px;
        left: 0;
        right: 0;
        text-align: center;
        color: #0ff;
        font-size: 14px;
        padding: 15px;
        background: rgba(0,0,0,0.7);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border-top: 1px solid #0ff;
        border-bottom: 1px solid #0ff;
        max-width: 100%;
        overflow: hidden;
    `;
    
    // 创建计数器
    const counterDiv = document.createElement('div');
    counterDiv.style.cssText = `
        position: absolute;
        top: -50px;
        left: 0;
        background: rgba(0,255,255,0.3);
        border: 1px solid #0ff;
        border-radius: 20px;
        padding: 5px 15px;
        font-size: 14px;
        color: #0ff;
        backdrop-filter: blur(5px);
    `;
    
    imgContainer.appendChild(modalImg);
    imgContainer.appendChild(closeBtn);
    imgContainer.appendChild(infoDiv);
    imgContainer.appendChild(counterDiv);
    container.appendChild(prevBtn);
    container.appendChild(nextBtn);
    container.appendChild(imgContainer);
    modal.appendChild(container);
    document.body.appendChild(modal);
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes zoomIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        @keyframes zoomOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.8);
            }
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // 更新显示当前图片
    function updateDisplay() {
        const poem = currentPoemsList[currentImageIndex];
        if (!poem) return;
        
        // 淡出效果
        imgContainer.style.animation = 'none';
        setTimeout(() => {
            modalImg.src = poem.image_url;
            modalImg.alt = '赛博拼贴诗海报';
            
            // 显示详细信息
            const contentPreview = poem.content.length > 80 ? poem.content.substring(0, 80) + '...' : poem.content;
            infoDiv.innerHTML = `
                <div style="margin-bottom:8px; font-size:16px; font-weight:bold;">✍️ ${escapeHtml(poem.author || '匿名诗人')}</div>
                <div style="font-size:13px; opacity:0.9; line-height:1.5;">${escapeHtml(contentPreview).replace(/\n/g, ' · ')}</div>
                <div style="margin-top:8px; font-size:11px; color:#6ee7ff;">❤️ ${poem.likes || 0} 人点赞</div>
            `;
            
            // 更新计数器
            counterDiv.innerHTML = `${currentImageIndex + 1} / ${currentPoemsList.length}`;
            
            // 添加滑动动画
            imgContainer.style.animation = 'slideIn 0.3s ease';
            
            // 更新按钮状态（首尾禁用效果）
            prevBtn.style.opacity = currentImageIndex === 0 ? '0.3' : '1';
            prevBtn.style.cursor = currentImageIndex === 0 ? 'not-allowed' : 'pointer';
            nextBtn.style.opacity = currentImageIndex === currentPoemsList.length - 1 ? '0.3' : '1';
            nextBtn.style.cursor = currentImageIndex === currentPoemsList.length - 1 ? 'not-allowed' : 'pointer';
        }, 50);
    }
    
    // 上一张
    function prevImage() {
        if (currentImageIndex > 0) {
            currentImageIndex--;
            updateDisplay();
        }
    }
    
    // 下一张
    function nextImage() {
        if (currentImageIndex < currentPoemsList.length - 1) {
            currentImageIndex++;
            updateDisplay();
        }
    }
    
    // 关闭模态框
    function closeModal() {
        imgContainer.style.animation = 'zoomOut 0.2s ease';
        setTimeout(() => {
            modal.style.display = 'none';
            modalImg.src = '';
            infoDiv.innerHTML = '';
        }, 200);
    }
    
    // 绑定事件
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target === container) {
            closeModal();
        }
    });
    
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevImage();
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextImage();
    });
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
    });
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') {
                prevImage();
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                nextImage();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                closeModal();
                e.preventDefault();
            }
        }
    });
    
    // 返回打开模态框的函数
    return function showImageGallery(poemsList, startIndex) {
        currentPoemsList = poemsList;
        currentImageIndex = startIndex;
        updateDisplay();
        modal.style.display = 'flex';
    };
}

// 修改 loadPoems 函数
async function loadPoems() {
    if (!poemsContainer) {
        console.error('❌ 找不到 poems-container 元素');
        return;
    }
    poemsContainer.innerHTML = '<div class="loading">✨ 加载霓虹碎片中 ✨</div>';

    const { data, error } = await window.mySupabase
        .from('poems')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ 加载失败:', error);
        poemsContainer.innerHTML = '<div class="empty">⚠️ 加载失败，请刷新重试</div>';
        return;
    }

    if (!data || data.length === 0) {
        poemsContainer.innerHTML = '<div class="empty">🌟 还没有作品，快去创作第一首赛博诗吧～</div>';
        return;
    }

    poemsContainer.innerHTML = '';
    
    // 保存所有诗作数据
    window.allPoems = data;
    
    // 初始化图片放大功能（只初始化一次）
    if (!window.showImageGallery) {
        window.showImageGallery = initImageZoom();
    }
    
    data.forEach((poem, index) => {
        const card = document.createElement('div');
        card.className = 'poem-card';
        
        // 创建图片元素
        const img = document.createElement('img');
        img.src = poem.image_url;
        img.alt = '赛博拼贴诗海报';
        img.loading = 'lazy';
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // 图片点击放大 - 打开画廊模式
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            window.showImageGallery(data, index);
        });
        
        // 图片加载失败时的占位图
        img.onerror = () => {
            img.src = 'https://placehold.co/400x300/0a0f1e/0ff?text=霓虹碎片加载失败';
        };
        
        // 图片悬停效果
        img.onmouseenter = () => {
            img.style.transform = 'scale(1.02)';
            img.style.boxShadow = '0 4px 15px rgba(0, 255, 255, 0.3)';
        };
        img.onmouseleave = () => {
            img.style.transform = 'scale(1)';
            img.style.boxShadow = 'none';
        };
        
        card.appendChild(img);
        
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        cardContent.innerHTML = `
            <div class="poem-text">${escapeHtml(poem.content).replace(/\n/g, '<br>')}</div>
            <div class="poem-meta">
                <span>✍️ ${escapeHtml(poem.author || '匿名诗人')}</span>
                <button class="like-btn" data-id="${poem.id}">❤️ ${poem.likes || 0}</button>
            </div>
        `;
        card.appendChild(cardContent);
        poemsContainer.appendChild(card);
    });

    // 绑定点赞事件
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const currentLikes = parseInt(btn.innerText.match(/\d+/)?.[0] || 0);
            const newLikes = currentLikes + 1;
            const { error } = await window.mySupabase
                .from('poems')
                .update({ likes: newLikes })
                .eq('id', id);
            if (!error) {
                btn.innerText = `❤️ ${newLikes}`;
                
                // 同时更新全局数据中的点赞数
                if (window.allPoems) {
                    const poemIndex = window.allPoems.findIndex(p => p.id === id);
                    if (poemIndex !== -1) {
                        window.allPoems[poemIndex].likes = newLikes;
                    }
                }
            } else {
                alert('点赞失败，请重试');
            }
        });
    });
}
