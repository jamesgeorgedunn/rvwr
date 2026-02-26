document.addEventListener("DOMContentLoaded", function () {

    if (!window.REVIEW_MODE) return;

    const mode = window.REVIEW_MODE;
    const currentUrl = window.location.pathname.replace(/\/$/, '');

    let comments = [];
    let activeFilter = "all";

    loadComments();

    // =========================
    // LOAD
    // =========================

    function loadComments() {
        fetch("rvwr/save-comment.php")
            .then(res => res.json())
            .then(data => {

                if (!Array.isArray(data)) {
                    comments = [];
                    return;
                }

                comments = data.filter(c =>
                    (c.url || "").replace(/\/$/, '') === currentUrl
                );

                buildToolbar();
                renderPins();
            });
    }

    // =========================
    // ADD MODE
    // =========================

    if (mode === "review") {

        document.body.style.cursor = "crosshair";

        document.addEventListener("click", function (e) {

            if (e.target.closest(".review-toolbar")) return;
            if (e.target.classList.contains("review-pin")) return;

            const comment = prompt("Enter your comment:");
            if (!comment) return;

            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;

            const toolbar = document.querySelector("header");
            const toolbarHeight = toolbar ? toolbar.offsetHeight : 0;

            const x = e.clientX + scrollLeft;
            const y = e.clientY + scrollTop - toolbarHeight;

            const newComment = {
                url: currentUrl,
                x: x,
                y: y,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                comment: comment
            };

            fetch("rvwr/save-comment.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newComment)
            })
            .then(res => res.json())
            .then(saved => {
                comments.push(saved);
                buildToolbar();
                renderPins();
            });

        });
    }

    // =========================
    // TOOLBAR
    // =========================

    function buildToolbar() {

        document.querySelectorAll(".review-toolbar").forEach(t => t.remove());

        const toolbar = document.createElement("div");
        toolbar.className = "review-toolbar";

        toolbar.innerHTML = "Show comments from: ";

        const allBtn = document.createElement("button");
        allBtn.textContent = "All";
        if (activeFilter === "all") allBtn.classList.add("active");

        allBtn.onclick = () => {
            activeFilter = "all";
            renderPins();
            buildToolbar();
        };

        toolbar.appendChild(allBtn);

        const viewports = [...new Set(comments.map(c => c.viewport_width))];

        viewports.forEach(vp => {

            const btn = document.createElement("button");
            btn.textContent = vp + "px";

            if (activeFilter === vp) btn.classList.add("active");

            btn.onclick = () => {
                activeFilter = vp;
                renderPins();
                buildToolbar();
            };

            toolbar.appendChild(btn);
        });

        document.body.prepend(toolbar);
    }

    // =========================
    // RENDER
    // =========================

    function renderPins() {

        document.querySelectorAll(".review-pin").forEach(p => p.remove());

        let filtered = comments;

        if (activeFilter !== "all") {
            filtered = comments.filter(c => c.viewport_width == activeFilter);
        }

        filtered.forEach((c, index) => {

            const pin = document.createElement("div");
            pin.className = "review-pin";
            pin.textContent = index + 1;

            pin.style.position = "absolute";
            pin.style.left = c.x + "px";
            pin.style.top = c.y + "px";

            pin.addEventListener("click", function (e) {
                e.stopPropagation();
                showPopup(c);
            });

            document.body.appendChild(pin);
        });
    }

    // =========================
    // POPUP
    // =========================

    function showPopup(commentObj) {

        document.querySelectorAll(".review-popup").forEach(p => p.remove());

        const popup = document.createElement("div");
        popup.className = "review-popup";

        popup.style.position = "absolute";
        popup.style.left = (commentObj.x + 30) + "px";
        popup.style.top = commentObj.y + "px";

        popup.innerHTML = `
            <strong>Comment</strong>
            <div style="margin:8px 0;">${commentObj.comment}</div>
            <small>Viewport: ${commentObj.viewport_width}px</small><br>
            <small>${commentObj.created_at ?? ''}</small>
            ${mode === "review" ? '<button class="delete-comment">Delete</button>' : ''}
        `;

        document.body.appendChild(popup);

        if (mode === "review") {

            popup.querySelector(".delete-comment").onclick = function () {

                if (!confirm("Delete this comment?")) return;

                fetch("rvwr/save-comment.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "delete",
                        id: commentObj.id
                    })
                })
                .then(() => {
                    comments = comments.filter(c => c.id !== commentObj.id);
                    renderPins();
                    buildToolbar();
                    popup.remove();
                });
            };
        }

        document.addEventListener("click", function close() {
            popup.remove();
            document.removeEventListener("click", close);
        }, { once: true });
    }

});