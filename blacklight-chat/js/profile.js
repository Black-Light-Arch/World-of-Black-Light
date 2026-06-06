// ============================================
//  WORLD OF BLACKLIGHT — PROFILE PAGE
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // Redirect if not logged in
    if (!Auth.isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    const session = Auth.getSession();

    // Populate info
    document.getElementById("profileName").textContent  = `${session.firstName} ${session.lastName || ""}`.trim();
    document.getElementById("profileEmail").textContent = session.email;
    document.getElementById("avatarDisplay").textContent = session.emoji || "👁️";

    // Mark current emoji as selected
    const grid    = document.getElementById("profileEmojiGrid");
    const options = grid.querySelectorAll(".emoji-option");
    let currentEmoji = session.emoji || "👁️";

    options.forEach(btn => {
        if (btn.dataset.emoji === currentEmoji) btn.classList.add("selected");
        btn.addEventListener("click", () => {
            options.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            currentEmoji = btn.dataset.emoji;
            // Live preview
            document.getElementById("avatarDisplay").textContent = currentEmoji;
        });
    });

    // Save button
    document.getElementById("saveEmojiBtn").addEventListener("click", () => {
        Auth.updateEmoji(currentEmoji);
        const confirm = document.getElementById("saveConfirm");
        confirm.textContent = "✓ Icon updated";
        confirm.style.color = "#50c878";
        setTimeout(() => { confirm.textContent = ""; }, 2500);
        // Refresh nav
        if (typeof buildNav === "function") buildNav();
    });

    // Logout
    document.getElementById("profileLogout").addEventListener("click", () => {
        Auth.logout();
        window.location.href = "index.html";
    });

});
