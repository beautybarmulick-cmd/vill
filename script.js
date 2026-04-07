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

function closeMobileNav() {
  siteNav?.classList.remove("is-open");
  navToggle?.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("nav-open", isOpen);
    siteHeader?.classList.remove("is-hidden");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (siteNav?.classList.contains("is-open")) {
      closeMobileNav();
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

    if (scrollingDown && pastHeader && !document.body.classList.contains("nav-open")) {
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
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    formNote.classList.remove("success", "error");
    
    if (phone && !/^\+91\s\d{10}$/.test(phone)) {
      formNote.textContent = "Please enter a valid Indian mobile number in the format +91 followed by 10 digits.";
      formNote.classList.add("error");
      return;
    }

    formNote.textContent = name
      ? `Thank you, ${name}. Your inquiry has been noted. Our team will reach out shortly.`
      : "Thank you. Your inquiry has been noted. Our team will reach out shortly.";
    formNote.classList.add("success");
    contactForm.reset();
    resetPhoneField();
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
