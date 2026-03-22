// ========== アプリケーション ==========
document.addEventListener('DOMContentLoaded', () => {
    const state = {
        selectedIngredients: new Set(),
        activeCategory: 'all',
    };

    // DOM要素
    const ingredientsGrid = document.getElementById('ingredientsGrid');
    const selectedSection = document.getElementById('selectedSection');
    const selectedTags = document.getElementById('selectedTags');
    const searchBtn = document.getElementById('searchBtn');
    const resultsSection = document.getElementById('resultsSection');
    const resultsInfo = document.getElementById('resultsInfo');
    const recipeCards = document.getElementById('recipeCards');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    const modalClose = document.getElementById('modalClose');
    const customIngredient = document.getElementById('customIngredient');
    const addCustomBtn = document.getElementById('addCustomBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const categoryTabs = document.querySelectorAll('.tab');

    // ========== 食材グリッド描画 ==========
    function renderIngredients() {
        const filtered = state.activeCategory === 'all'
            ? INGREDIENTS
            : INGREDIENTS.filter(i => i.category === state.activeCategory);

        ingredientsGrid.innerHTML = filtered.map(ing => `
            <button class="ingredient-btn ${state.selectedIngredients.has(ing.id) ? 'selected' : ''}"
                    data-id="${ing.id}">
                <span class="check">✓</span>
                <img class="photo" src="${ing.photo}" alt="${ing.name}" loading="lazy" onerror="this.style.background='var(--bg)'; this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22><rect fill=%22%23f0ece4%22 width=%2248%22 height=%2248%22 rx=%2224%22/><text x=%2224%22 y=%2230%22 text-anchor=%22middle%22 font-size=%2220%22>🍴</text></svg>'">
                <span class="name">${ing.name}</span>
            </button>
        `).join('');

        // クリックイベント
        ingredientsGrid.querySelectorAll('.ingredient-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (state.selectedIngredients.has(id)) {
                    state.selectedIngredients.delete(id);
                } else {
                    state.selectedIngredients.add(id);
                }
                renderIngredients();
                renderSelectedTags();
                updateSearchBtn();
            });
        });
    }

    // ========== カテゴリタブ ==========
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeCategory = tab.dataset.category;
            renderIngredients();
        });
    });

    // ========== 選択中の食材タグ ==========
    function renderSelectedTags() {
        if (state.selectedIngredients.size === 0) {
            selectedSection.style.display = 'none';
            return;
        }
        selectedSection.style.display = 'block';

        const tags = [];
        state.selectedIngredients.forEach(id => {
            const ing = INGREDIENTS.find(i => i.id === id);
            const name = ing ? ing.name : id;
            const photo = ing ? ing.photo : '';
            tags.push(`
                <span class="selected-tag" data-id="${id}">
                    ${photo ? `<img class="tag-photo" src="${photo}" alt="${name}" loading="lazy">` : ''}
                    ${name}
                    <span class="remove">&times;</span>
                </span>
            `);
        });
        selectedTags.innerHTML = tags.join('');

        // 削除イベント
        selectedTags.querySelectorAll('.remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.selected-tag').dataset.id;
                state.selectedIngredients.delete(id);
                renderIngredients();
                renderSelectedTags();
                updateSearchBtn();
            });
        });
    }

    // ========== 全解除 ==========
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            state.selectedIngredients.clear();
            renderIngredients();
            renderSelectedTags();
            updateSearchBtn();
        });
    }

    // ========== カスタム食材追加 ==========
    function addCustomIngredient() {
        const value = customIngredient.value.trim();
        if (value) {
            state.selectedIngredients.add(value);
            customIngredient.value = '';
            renderSelectedTags();
            updateSearchBtn();
        }
    }

    addCustomBtn.addEventListener('click', addCustomIngredient);
    customIngredient.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCustomIngredient();
    });

    // ========== 検索ボタン状態 ==========
    function updateSearchBtn() {
        searchBtn.disabled = state.selectedIngredients.size === 0;
    }

    // ========== レシピ検索 ==========
    function searchRecipes() {
        const selected = state.selectedIngredients;
        const scored = RECIPES.map(recipe => {
            const matchCount = recipe.ingredients.filter(i => selected.has(i)).length;
            const matchRate = matchCount / recipe.ingredients.length;
            return { ...recipe, matchCount, matchRate };
        });

        scored.sort((a, b) => {
            if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
            return b.matchRate - a.matchRate;
        });

        const results = scored.filter(r => r.matchCount >= 1);
        return results;
    }

    // ========== 検索実行 ==========
    searchBtn.addEventListener('click', () => {
        const results = searchRecipes();
        renderResults(results);
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ========== 結果描画 ==========
    function renderResults(results) {
        resultsSection.style.display = 'block';

        if (results.length === 0) {
            resultsInfo.innerHTML = '';
            recipeCards.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </div>
                    <h3>レシピが見つかりませんでした</h3>
                    <p>他の食材を追加してみてください</p>
                </div>
            `;
            return;
        }

        resultsInfo.innerHTML = `<strong>${results.length}件</strong>のレシピが見つかりました`;

        recipeCards.innerHTML = results.map(recipe => {
            const matchPercent = Math.round(recipe.matchRate * 100);
            const matchedIngredients = recipe.ingredients.filter(i => state.selectedIngredients.has(i));
            const missingIngredients = recipe.ingredients.filter(i => !state.selectedIngredients.has(i));

            return `
                <div class="recipe-card" data-id="${recipe.id}">
                    <div class="recipe-card-image-placeholder">
                        <img src="${recipe.cardImage}" alt="${recipe.name}" loading="lazy" onerror="this.parentElement.style.background='linear-gradient(145deg, #f0ece4, #e8e4dc)'">
                        <span class="time-badge">${recipe.time} min</span>
                        <span class="difficulty-badge">${recipe.difficulty}</span>
                    </div>
                    <div class="recipe-card-body">
                        <h3 class="recipe-card-title">${recipe.name}</h3>
                        <p class="recipe-card-desc">${recipe.description}</p>
                        <div class="recipe-card-tags">
                            ${matchedIngredients.map(id => {
                                const ing = INGREDIENTS.find(i => i.id === id);
                                return ing ? `<span class="recipe-tag match">✓ ${ing.name}</span>` : '';
                            }).join('')}
                            ${missingIngredients.map(id => {
                                const ing = INGREDIENTS.find(i => i.id === id);
                                return ing ? `<span class="recipe-tag">${ing.name}</span>` : '';
                            }).join('')}
                        </div>
                        <div class="recipe-card-footer">
                            <span class="match-rate">
                                一致度 ${matchPercent}%
                                <span class="match-rate-bar"><span class="match-rate-fill" style="width:${matchPercent}%"></span></span>
                            </span>
                            <span class="view-recipe">詳しく見る →</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // カードクリック
        recipeCards.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                const recipe = RECIPES.find(r => r.id === id);
                if (recipe) openModal(recipe);
            });
        });
    }

    // ========== モーダル ==========
    function openModal(recipe) {
        modalContent.innerHTML = `
            <div class="modal-hero">
                <img src="${recipe.heroImage}" alt="${recipe.name}" onerror="this.style.background='linear-gradient(145deg, #f0ece4, #e8e4dc)'">
                <div class="modal-hero-gradient"></div>
                <div class="modal-hero-overlay">
                    <h2>${recipe.name}</h2>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-meta">
                    <span class="meta-item">
                        <span class="meta-icon-circle">⏱</span>
                        <span>${recipe.time}分</span>
                    </span>
                    <span class="meta-item">
                        <span class="meta-icon-circle">📊</span>
                        <span>${recipe.difficulty}</span>
                    </span>
                    <span class="meta-item">
                        <span class="meta-icon-circle">🍽</span>
                        <span>${recipe.servings}</span>
                    </span>
                </div>

                <p style="font-size:14px; color:var(--text-secondary); margin-bottom:24px; line-height:1.7;">${recipe.description}</p>

                <!-- 材料 -->
                <div class="modal-section">
                    <h3 class="modal-section-title">
                        材料
                        <span class="title-line"></span>
                    </h3>
                    <div class="ingredients-list">
                        ${recipe.ingredientDetails.map(item => {
                            const isHave = state.selectedIngredients.has(
                                INGREDIENTS.find(i => i.name === item.name)?.id || ''
                            );
                            return `
                                <div class="ingredient-item ${isHave ? 'have' : 'need'}">
                                    <img class="item-photo" src="${item.photo}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">
                                    <span class="item-name">${item.name}</span>
                                    <span class="item-amount">${item.amount}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 手順 -->
                <div class="modal-section">
                    <h3 class="modal-section-title">
                        作り方
                        <span class="title-line"></span>
                    </h3>
                    <div class="steps-list">
                        ${recipe.steps.map((step, idx) => `
                            <div class="step-card">
                                <div class="step-left">
                                    <div class="step-number">${idx + 1}</div>
                                    ${idx < recipe.steps.length - 1 ? '<div class="step-line"></div>' : ''}
                                </div>
                                <div class="step-content">
                                    <div class="step-text">${step.text}</div>
                                    ${step.image ? `
                                        <div class="step-image-container">
                                            <img src="${step.image}" alt="ステップ${idx + 1}" loading="lazy" onerror="this.parentElement.style.display='none'">
                                        </div>
                                    ` : ''}
                                    ${step.tip ? `<div class="step-tip">💡 ${step.tip}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ポイント -->
                <div class="modal-section">
                    <h3 class="modal-section-title">
                        アレンジ＆ポイント
                        <span class="title-line"></span>
                    </h3>
                    <div class="tips-box">
                        ${recipe.tips.map(tip => `
                            <div class="tip-item">
                                <span class="tip-bullet"></span>
                                <span>${tip}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ========== 初期化 ==========
    renderIngredients();
});
