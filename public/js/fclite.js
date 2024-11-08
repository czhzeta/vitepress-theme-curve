function initialize_fc_lite() {
    // 用户配置
    UserConfig = {
        private_api_url: UserConfig?.private_api_url || "", 
        page_turning_number: UserConfig?.page_turning_number || 20, // 默认20篇
        error_img: UserConfig?.error_img || "https://fastly.jsdelivr.net/gh/willow-god/Friend-Circle-Lite@latest/static/favicon.ico" // 默认头像
    };

    const root = document.getElementById('friend-circle-lite-root');
    
    if (!root) return; // 确保根元素存在

    // 清除之前的内容
    root.innerHTML = '';

    const randomArticleContainer = document.createElement('div');
    randomArticleContainer.id = 'random-article';
    root.appendChild(randomArticleContainer);

    const container = document.createElement('div');
    container.className = 'articles-container';
    container.id = 'articles-container';
    root.appendChild(container);
    
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'load-more-btn';
    loadMoreBtn.innerText = '再来亿点';
    root.appendChild(loadMoreBtn);

    // 创建统计信息容器
    const statsContainer = document.createElement('div');
    statsContainer.id = 'stats-container';
    root.appendChild(statsContainer);

    let start = 0; // 记录加载起始位置
    let allArticles = []; // 存储所有文章

    function loadMoreArticles() {
        const cacheKey = 'friend-circle-lite-cache';
        const cacheTimeKey = 'friend-circle-lite-cache-time';
        const cacheTime = localStorage.getItem(cacheTimeKey);
        const now = new Date().getTime();

        if (cacheTime && (now - cacheTime < 10 * 60 * 1000)) { // 缓存时间小于10分钟
            const cachedData = JSON.parse(localStorage.getItem(cacheKey));
            if (cachedData) {
                processArticles(cachedData);
                return;
            }
        }

        fetch(`${UserConfig.private_api_url}all.json`)
            .then(response => response.json())
            .then(data => {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(cacheTimeKey, now.toString());
                processArticles(data);
            })
            .finally(() => {
                loadMoreBtn.innerText = '再来亿点'; // 恢复按钮文本
            });
    }

    function processArticles(data) {
        allArticles = data.article_data;
        // 处理统计数据
        const stats = data.statistical_data;
        statsContainer.innerHTML = `
            <div>Powered by: <a href="https://github.com/willow-god/Friend-Circle-Lite" target="_blank">FriendCircleLite</a><br></div>
            <div>Designed By: <a href="https://www.liushen.fun/" target="_blank">LiuShen</a><br></div>
            <div>订阅:${stats.friends_num}   活跃:${stats.active_num}   总文章数:${stats.article_num}<br></div>
            <div>更新时间:${stats.last_updated_time}</div>
        `;

        displayRandomArticle(); // 显示随机友链卡片

        const articles = allArticles.slice(start, start + UserConfig.page_turning_number);

        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'card';

            const title = document.createElement('div');
            title.className = 'card-title';
            title.innerText = article.title;
            card.appendChild(title);
            title.onclick = () => window.open(article.link, '_blank');

            const author = document.createElement('div');
            author.className = 'card-author';
            const authorImg = document.createElement('img');
            authorImg.className = 'no-lightbox';
            authorImg.src = article.avatar || UserConfig.error_img; // 使用默认头像
            authorImg.onerror = () => authorImg.src = UserConfig.error_img; // 头像加载失败时使用默认头像
            author.appendChild(authorImg);
            author.appendChild(document.createTextNode(article.author));
            card.appendChild(author);

            author.onclick = () => {
                showAuthorArticles(article.author, article.avatar, article.link);
            };

            const date = document.createElement('div');
            date.className = 'card-date';
            date.innerText = "🗓️" + article.created.substring(0, 10);
            card.appendChild(date);

            const bgImg = document.createElement('img');
            bgImg.className = 'card-bg no-lightbox';
            bgImg.src = article.avatar || UserConfig.error_img;
            bgImg.onerror = () => bgImg.src = UserConfig.error_img; // 头像加载失败时使用默认头像
            card.appendChild(bgImg);

            container.appendChild(card);
        });

        start += UserConfig.page_turning_number;

        if (start >= allArticles.length) {
            loadMoreBtn.style.display = 'none'; // 隐藏按钮
        }
    }

    // 显示随机文章的逻辑
    function displayRandomArticle() {
        const randomArticle = allArticles[Math.floor(Math.random() * allArticles.length)];
        randomArticleContainer.innerHTML = `
            <div class="random-container">
                <div class="random-container-title">随机钓鱼</div>
                <div class="random-title">${randomArticle.title}</div>
                <div class="random-author">作者: ${randomArticle.author}</div>
            </div>
            <div class="random-button-container">
                <a href="#" id="refresh-random-article">刷新</a>
                <button class="random-link-button" onclick="window.open('${randomArticle.link}', '_blank')">过去转转</button>
            </div>
        `;

        // 为刷新按钮添加事件监听器
        const refreshBtn = document.getElementById('refresh-random-article');
        refreshBtn.addEventListener('click', function (event) {
            event.preventDefault(); // 阻止默认的跳转行为
            displayRandomArticle(); // 调用显示随机文章的逻辑
        });
    }

    function showAuthorArticles(author, avatar, link) {
        // 如果不存在，则创建模态框结构
        if (!document.getElementById('fclite-modal')) {
            const modal = document.createElement('div');
            modal.id = 'modal';
            modal.className = 'modal';
            modal.innerHTML = `
            <div class="modal-content">
                <img id="modal-author-avatar" src="" alt="">
                <a id="modal-author-name-link"></a>
                <div id="modal-articles-container"></div>
                <img id="modal-bg" src="" alt="">
            </div>
            `;
            root.appendChild(modal);
        }

        const modal = document.getElementById('modal');
        const modalArticlesContainer = document.getElementById('modal-articles-container');
        const modalAuthorAvatar = document.getElementById('modal-author-avatar');
        const modalAuthorNameLink = document.getElementById('modal-author-name-link');
        const modalBg = document.getElementById('modal-bg');

        modalArticlesContainer.innerHTML = ''; // 清空之前的内容
        modalAuthorAvatar.src = avatar  || UserConfig.error_img; // 使用默认头像
        modalAuthorAvatar.onerror = () => modalAuthorAvatar.src = UserConfig.error_img; // 头像加载失败时使用默认头像
        modalBg.src = avatar || UserConfig.error_img; // 使用默认头像
        modalBg.onerror = () => modalBg.src = UserConfig.error_img; // 头像加载失败时使用默认头像
        modalAuthorNameLink.innerText = author;
        modalAuthorNameLink.href = new URL(link).origin;

        const authorArticles = allArticles.filter(article => article.author === author);
        // 仅仅取前五个，防止文章过多导致模态框过长，如果不够五个则全部取出
        authorArticles.slice(0, 4).forEach(article => {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'modal-article';
            articleDiv.innerText = article.title;
            articleDiv.onclick = () => window.open(article.link, '_blank');
            modalArticlesContainer.appendChild(articleDiv);
        });

        modal.style.display = 'block';

        // 关闭模态框的事件监听
        modal.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    loadMoreBtn.addEventListener('click', loadMoreArticles);
    loadMoreArticles();
}

function whenDOMReady() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize_fc_lite);
    } else {
        initialize_fc_lite();
    }
}

// 首次初始化时执行
whenDOMReady();

// 在pjax加载完成后再初始化
document.addEventListener('pjax:complete', initialize_fc_lite);