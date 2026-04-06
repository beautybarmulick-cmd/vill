const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const reveals = document.querySelectorAll(".reveal");
const contactForm = document.getElementById("contactForm");
const formNote = document.getElementById("formNote");
const backToTop = document.getElementById("backToTop");
const siteHeader = document.querySelector(".site-header");
const phoneInput = document.getElementById("phoneInput");
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

    if (payload.phone && !/^\+91\s\d{10}$/.test(payload.phone)) {
      formNote.textContent = "Please enter a valid Indian mobile number in the format +91 followed by 10 digits.";
      formNote.classList.add("error");
      return;
    }

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
      resetPhoneField();
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

if (phoneInput) {
  const phonePrefix = "+91 ";

  const normalizePhoneValue = (rawValue) => {
    const digits = rawValue.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
    return `${phonePrefix}${digits}`;
  };

  if (!phoneInput.value.startsWith(phonePrefix)) {
    phoneInput.value = phonePrefix;
  }

  phoneInput.addEventListener("focus", () => {
    if (!phoneInput.value.startsWith(phonePrefix)) {
      phoneInput.value = phonePrefix;
    }
  });

  phoneInput.addEventListener("input", () => {
    phoneInput.value = normalizePhoneValue(phoneInput.value);
  });

  phoneInput.addEventListener("keydown", (event) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End"
    ];

    if (allowedKeys.includes(event.key)) {
      if ((event.key === "Backspace" || event.key === "Delete") && phoneInput.selectionStart <= phonePrefix.length) {
        event.preventDefault();
      }
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  });

  phoneInput.addEventListener("paste", (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData("text") || "";
    phoneInput.value = normalizePhoneValue(pastedText);
  });
}

function resetPhoneField() {
  if (phoneInput) {
    phoneInput.value = "+91 ";
  }
}
