const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const reveals = document.querySelectorAll(".reveal");
const contactForm = document.getElementById("contactForm");
const formNote = document.getElementById("formNote");
const backToTop = document.getElementById("backToTop");
const siteHeader = document.querySelector(".site-header");
let lastScrollY = window.scrollY;

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (siteNav?.classList.contains("is-open")) {
      siteNav.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

if (backToTop) {
  backToTop.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (siteHeader) {
  window.addEventListener("scroll", () => {
    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY;
    const pastHeader = currentScrollY > 120;
    const scrollDelta = Math.abs(currentScrollY - lastScrollY);

    if (scrollDelta < 8) {
      lastScrollY = currentScrollY;
      return;
    }

    if (scrollingDown && pastHeader) {
      siteHeader.classList.add("is-hidden");
    } else {
      siteHeader.classList.remove("is-hidden");
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    } else {
      entry.target.classList.remove("is-visible");
    }
  });
}, { threshold: 0.18 });

reveals.forEach((item) => revealObserver.observe(item));

if (contactForm && formNote) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    const submitButton = contactForm.querySelector('button[type="submit"]');

    formNote.classList.remove("success", "error");
    formNote.textContent = "Sending your inquiry...";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to submit the form.");
      }

      formNote.textContent = result.message;
      formNote.classList.add("success");
      contactForm.reset();
    } catch (error) {
      const isConnectionIssue = error instanceof TypeError;
      formNote.textContent = isConnectionIssue
        ? "Unable to reach the form service. Start the Node server with 'npm start' and reload the page."
        : error.message || "Something went wrong. Please try again.";
      formNote.classList.add("error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Inquiry";
      }
    }
  });
}
