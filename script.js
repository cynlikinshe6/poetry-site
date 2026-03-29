// 请替换为你的 Supabase URL 和 anon key
const SUPABASE_URL = 'https://xkkilbqgjifclowjjqkk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CuLtfA-erraBD9z4LkdM2g_gc0wiYni';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const poemsContainer = document.getElementById('poems-container');

async function loadPoems() {
    poemsContainer.innerHTML = '<div class="loading">✨ 加载霓虹碎片中 ✨</div>';

    const { data, error } = await supabase
        .from('poems')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('加载失败:', error);
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

    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const currentLikes = parseInt(btn.innerText.match(/\d+/)?.[0] || 0);
            const newLikes = currentLikes + 1;
            const { error } = await supabase
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

loadPoems();

const downloadBtn = document.getElementById('downloadPlugin');
if (downloadBtn) {
    downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert('插件下载链接即将开放，敬请期待！');
    });
}
