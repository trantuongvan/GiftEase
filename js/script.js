const DATA_URL = './data/data.json';
let allProducts = [];

const questions = [
    { id: 1, key: 'context', question: "Giai đoạn tình cảm hiện tại?", options: [ { text: "Mới quen / Cưa cẩm", value: "new" }, { text: "Đang yêu nồng cháy", value: "love" }, { text: "Kỷ niệm / Cầu hôn", value: "marry" }, { text: "Làm hòa / Xin lỗi", value: "sorry" } ] },
    { id: 2, key: 'style', question: "Phong cách (Style) của cô ấy?", options: [ { text: "Nàng thơ / Dịu dàng", value: "soft" }, { text: "Cá tính / Hiện đại", value: "cool" }, { text: "Sang chảnh / Quý phái", value: "luxury" }, { text: "Dễ thương / Nhí nhảnh", value: "cute" } ] },
    { id: 3, key: 'category', question: "Cô ấy đang quan tâm nhóm nào nhất?", options: [ { text: "Làm đẹp (Makeup/Skincare)", value: "makeup" }, { text: "Thời trang & Phụ kiện", value: "fashion" }, { text: "Decor & Thư giãn", value: "decor" }, { text: "Đồ ăn & Trải nghiệm", value: "food" } ] },
    { id: 4, key: 'price_range', question: "Ngân sách dự kiến?", options: [ { text: "Dưới 200k", value: "low" }, { text: "200k - 500k", value: "medium" }, { text: "500k - 1 triệu", value: "high" }, { text: "Trên 1 triệu", value: "vip" } ] }
];

/* --- LOGIC 1: TRANG QUIZ --- */
const quizContainer = document.getElementById('quiz-container');
if (quizContainer) {
    let currentStep = 0;
    let userAnswers = {};

    function renderQuestion() {
        const q = questions[currentStep];
        
        const html = `
            <div class="step-indicator">Câu hỏi ${currentStep + 1}/${questions.length}</div>
            <h2 class="section-title" style="margin-bottom: 3rem;">${q.question}</h2>
            <div class="options-grid-quiz">
                ${q.options.map(opt => `<button class="option-card" onclick="chooseAnswer('${q.key}', '${opt.value}')">${opt.text}</button>`).join('')}
            </div>
            ${currentStep > 0 ? `<button class="btn-text" style="margin-top: 2rem;" onclick="prevQuestion()">← Quay lại</button>` : ''}
        `;
        quizContainer.innerHTML = html;
    }

    window.chooseAnswer = function(key, value) {
        userAnswers[key] = value;
        const oldAnswers = JSON.parse(localStorage.getItem('giftEase_answers')) || {};
        localStorage.setItem('giftEase_answers', JSON.stringify({ ...oldAnswers, ...userAnswers }));

        if (currentStep < questions.length - 1) {
            currentStep++;
            renderQuestion();
        } else {
            window.location.href = 'result.html';
        }
    };

    window.prevQuestion = function() {
        if (currentStep > 0) {
            currentStep--;
            renderQuestion();
        }
    };

    renderQuestion();
}

/* --- LOGIC 2: TRANG KẾT QUẢ --- */
const resultContainer = document.getElementById('result-container');
if (resultContainer) {
    async function initResult() {
        const savedAnswers = localStorage.getItem('giftEase_answers');
        if (!savedAnswers) {
            alert("Bạn chưa trả lời câu hỏi!");
            window.location.href = 'quiz.html';
            return;
        }
        const userAnswers = JSON.parse(savedAnswers);

        try {
            const res = await fetch(DATA_URL);
            allProducts = await res.json();
            const results = filterProducts(userAnswers);
            renderResultList(results, userAnswers);
        } catch (err) {
            console.error(err);
            alert('Lỗi tải dữ liệu, vui lòng tải lại trang.');
        }
    }

    function filterProducts(answers) {
        // Lọc khắt khe
        const strict = allProducts.filter(p => p.tags.price_range === answers.price_range && p.tags.category.includes(answers.category) && p.tags.style.includes(answers.style) && p.tags.context.includes(answers.context));
        if (strict.length > 0) return { type: 'strict', data: strict };

        // Fallback: Cùng nhóm
        const cat = allProducts.filter(p => p.tags.category.includes(answers.category));
        if (cat.length > 0) return { type: 'category', data: cat };

        // Fallback: Trending
        return { type: 'trending', data: allProducts.filter(p => p.is_trending) };
    }

    function renderResultList(res, answers) {
        let title = '';
        if (res.type === 'strict') title = 'Dưới đây là các món quà phù hợp nhất theo tiêu chí của bạn:';
        else if (res.type === 'category') title = `Rất tiếc chưa có món khớp 100%. Đây là các gợi ý tương tự:`;
        else title = 'Hiện chưa có sản phẩm phù hợp. Mời bạn tham khảo các gợi ý nổi bật:';

        resultContainer.innerHTML = `
            <div class="section-header">
                <h2 class="section-title" style="font-size: 2.4rem;">${title}</h2>
                <a href="quiz.html" class="btn btn-primary">Tìm lại từ đầu</a>
            </div>
            <div class="gift-grid">
                ${res.data.slice(0, 8).map(p => createProductCard(p)).join('')}
            </div>
        `;
    }

    function createProductCard(p) {
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
        return `<div class="gift-card" onclick="openModal(${p.id})">
            <div class="gift-img-box"><img src="${p.image}" class="gift-img"></div>
            <div class="gift-info">
                <h3 class="gift-name">${p.name}</h3>
                <p class="gift-price">${price}</p>
                <p class="gift-desc-short">${p.desc_short}</p>
                <button class="btn-text">Xem chi tiết &rarr;</button>
            </div>
        </div>`;
    }

    function getCategoryName(key) { return { 'makeup': 'Làm đẹp', 'fashion': 'Thời trang', 'decor': 'Decor', 'food': 'Ẩm thực' }[key] || 'này'; }

    initResult();
}

/* --- LOGIC 3: MODAL (Dùng chung) --- */
const modal = document.getElementById('product-modal');
if (modal) {
    window.openModal = function(id) {
        const p = allProducts.find(x => x.id === id); if (!p) return;
        const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price);
        document.querySelector('.modal-body').innerHTML = `
            <div class="modal-grid">
                <div class="modal-img-col"><img src="${p.image}"></div>
                <div class="modal-info-col">
                    <h2 class="modal-title">${p.name}</h2>
                    <p class="modal-price">${price}</p>
                    <div class="modal-section"><h4>Mô tả:</h4><p>${p.desc_long}</p></div>
                    <div class="modal-section reason-box-modal"><h4>Tại sao nên mua?</h4><p>${p.reason_to_buy}</p></div>
                    <a href="${p.link}" target="_blank" class="btn btn-primary full-width">Xem nơi bán</a>
                </div>
            </div>`;
        modal.classList.remove('hidden');
    };
    document.querySelector('.close-btn').addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
}