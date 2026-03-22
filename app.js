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
                <span class="emoji">${ing.emoji}</span>
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
            const name = ing ? `${ing.emoji} ${ing.name}` : `🏷️ ${id}`;
            tags.push(`
                <span class="selected-tag" data-id="${id}">
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

        // マッチ数でソート（同スコアなら一致率順）
        scored.sort((a, b) => {
            if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
            return b.matchRate - a.matchRate;
        });

        // 1つ以上マッチするもの
        const results = scored.filter(r => r.matchCount >= 1);
        return results;
    }

    // ========== 検索実行 ==========
    searchBtn.addEventListener('click', () => {
        const results = searchRecipes();
        renderResults(results);

        // スクロール
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // ========== 結果描画 ==========
    function renderResults(results) {
        resultsSection.style.display = 'block';

        if (results.length === 0) {
            resultsInfo.innerHTML = '';
            recipeCards.innerHTML = `
                <div class="no-results">
                    <div class="emoji">😢</div>
                    <h3>レシピが見つかりませんでした</h3>
                    <p>他の食材を追加してみてください</p>
                </div>
            `;
            return;
        }

        resultsInfo.innerHTML = `✨ <strong>${results.length}件</strong>のレシピが見つかりました！食材の一致度順に表示しています。`;

        recipeCards.innerHTML = results.map(recipe => {
            const matchPercent = Math.round(recipe.matchRate * 100);
            const matchedIngredients = recipe.ingredients.filter(i => state.selectedIngredients.has(i));
            const missingIngredients = recipe.ingredients.filter(i => !state.selectedIngredients.has(i));

            return `
                <div class="recipe-card" data-id="${recipe.id}">
                    <div class="recipe-card-image-placeholder">${recipe.emoji}</div>
                    <div class="recipe-card-body">
                        <div class="recipe-card-header">
                            <h3 class="recipe-card-title">${recipe.name}</h3>
                            <span class="recipe-card-time">⏱ ${recipe.time}分</span>
                        </div>
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
                            <span class="match-rate">食材一致度 ${matchPercent}%</span>
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
                ${recipe.emoji}
                <div class="modal-hero-overlay">
                    <h2>${recipe.name}</h2>
                </div>
            </div>
            <div class="modal-body">
                <div class="modal-meta">
                    <span class="meta-item"><span class="meta-icon">⏱</span> ${recipe.time}分</span>
                    <span class="meta-item"><span class="meta-icon">📊</span> ${recipe.difficulty}</span>
                    <span class="meta-item"><span class="meta-icon">🍽️</span> ${recipe.servings}</span>
                </div>

                <p style="font-size:14px; color:#636E72; margin-bottom:20px; line-height:1.6;">${recipe.description}</p>

                <!-- 材料 -->
                <div class="modal-section">
                    <h3 class="modal-section-title">🥗 材料</h3>
                    <div class="ingredients-list">
                        ${recipe.ingredientDetails.map(item => {
                            const isHave = state.selectedIngredients.has(
                                INGREDIENTS.find(i => i.name === item.name)?.id || ''
                            );
                            return `
                                <div class="ingredient-item ${isHave ? 'have' : 'need'}">
                                    <span class="item-icon">${item.icon}</span>
                                    <span>${item.name}</span>
                                    <span style="margin-left:auto; color:#636E72; font-size:12px;">${item.amount}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- 手順 -->
                <div class="modal-section">
                    <h3 class="modal-section-title">👨‍🍳 作り方</h3>
                    <div class="steps-list">
                        ${recipe.steps.map((step, idx) => `
                            <div class="step-card">
                                <div class="step-number">${idx + 1}</div>
                                <div class="step-content">
                                    <div class="step-text">${step.text}</div>
                                    <div class="step-image-placeholder">${step.emoji}</div>
                                    ${step.tip ? `<div class="step-tip">${step.tip}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ポイント -->
                <div class="modal-section">
                    <h3 class="modal-section-title">💡 アレンジ＆ポイント</h3>
                    <div class="tips-box">
                        ${recipe.tips.map(tip => `
                            <div class="tip-item">
                                <span>•</span>
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
