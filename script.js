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
