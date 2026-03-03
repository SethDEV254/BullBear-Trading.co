document.addEventListener('DOMContentLoaded', function () {
    console.log('Fix clickable products script loaded');

    // Handle cards with data-product-url
    const productCards = document.querySelectorAll('.card[data-product-url]');
    console.log('Found ' + productCards.length + ' cards with data-product-url');

    productCards.forEach(card => {
        card.style.cursor = 'pointer';
        // Card click navigation is handled by initializeProductCards() in index.html
    });

    // Provide definition for showSignupForChecklist if it's missing
    // This handles the "Crypto Quickstart Checklist" card
    if (typeof window.showSignupForChecklist !== 'function') {
        window.showSignupForChecklist = function () {
            console.log('showSignupForChecklist called');
            // Redirect to the dedicated checklist signup page
            window.location.href = 'checklist-signup.html';
        };
    }

    // Helper to close modals
    const closeBtns = document.querySelectorAll('.auth-modal-close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.auth-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        const modal = document.querySelector('.auth-modal');
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Define generic auth modals if missing (used in header)
    if (typeof window.showSignupModal !== 'function') {
        window.showSignupModal = function () {
            const modal = document.querySelector('.auth-modal');
            if (modal) {
                modal.style.display = 'block';
                // You might want to switch to signup tab if applicable
            } else {
                console.log("Redirecting to signup");
                window.location.href = 'checklist-signup.html';
            }
        };
    }

    if (typeof window.showLoginModal !== 'function') {
        window.showLoginModal = function () {
            const modal = document.querySelector('.auth-modal');
            if (modal) {
                modal.style.display = 'block';
            }
        };
    }
});
