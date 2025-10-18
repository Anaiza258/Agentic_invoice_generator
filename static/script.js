// *********** intro section animation **********
document.addEventListener("DOMContentLoaded", function () {
  const lines = [
    "Create invoices with just your voice",
    "Fast, smart, and professional",
  ];

  const speed = 60;
  let lineIndex = 0;
  let charIndex = 0;

  function typeWriter() {
    if (lineIndex < lines.length) {
      const currentLine = lines[lineIndex];
      if (charIndex < currentLine.length) {
        document.getElementById("line" + (lineIndex + 1)).textContent +=
          currentLine.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, speed);
      } else {
        document
          .getElementById("line" + (lineIndex + 1))
          .classList.add("finished");
        lineIndex++;
        charIndex = 0;
        setTimeout(typeWriter, 600);
      }
    }
  }

  typeWriter();
});

// ******* Typographic cluster small parallax handler ********
(function () {
  const cluster = document.getElementById("typoCluster");
  if (!cluster) return;
  const words = cluster.querySelectorAll(".word");
  const maxOffset = 18;

  const reset = () =>
    words.forEach((w) => {
      w.style.setProperty("--tx", "0px");
      w.style.setProperty("--ty", "0px");
    });

  cluster.addEventListener("mousemove", (e) => {
    const rect = cluster.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (e.clientX - cx) / (rect.width / 2);
    const ny = (e.clientY - cy) / (rect.height / 2);

    words.forEach((w, i) => {
      const depth = (i % 2 === 0 ? 1 : -1) * (6 + i * 4);
      const tx = (nx * depth * maxOffset / 20).toFixed(2) + "px";
      const ty = (ny * depth * maxOffset / 20).toFixed(2) + "px";
      w.style.setProperty("--tx", tx);
      w.style.setProperty("--ty", ty);
    });
  });

  cluster.addEventListener("mouseleave", () => {
    words.forEach((w) => {
      w.style.transition = "transform .6s cubic-bezier(.2,.9,.2,1)";
    });
    reset();
    setTimeout(() => words.forEach((w) => (w.style.transition = "")), 650);
  });
})();

// **** clerk authentication ********
window.addEventListener("load", async () => {
  await Clerk.load();

  const authButtons = document.getElementById("auth-buttons");

  if (Clerk.user) {
    authButtons.innerHTML = `
      <div class="dropdown">
        <a class="btn btn-outline-light dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
          <img src="${Clerk.user.imageUrl}" class="rounded-circle me-2" width="28" height="28"> 
          ${Clerk.user.firstName || "Profile"}
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#" onclick="Clerk.openUserProfile()">Profile Settings</a></li>
          <li><a class="dropdown-item" href="#" onclick="Clerk.signOut()">Sign Out</a></li>
        </ul>
      </div>
    `;
  } else {
    authButtons.innerHTML = `
      <a class="btn btn-outline-secondary" onclick="Clerk.openSignIn({ afterSignInUrl: '/' })">Sign In</a>
      <a class="btn btn-success ms-1" onclick="Clerk.openSignUp({ afterSignUpUrl: '/' })">Sign Up</a>
    `;
  }
});

// ****** call Flask protected route with session token *******
async function callProtected() {
  if (!Clerk.session) {
    alert("You must be logged in!");
    return;
  }

  const token = await Clerk.session.getToken({ template: "default" });
  const res = await fetch("/protected", {
    headers: {
      Authorization: "Bearer " + token,
    },
  });

  const data = await res.json();
  console.log(data);
}

// make the nav item active
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".nav-link, .get-started-btn");

  function setActive(link) {
    navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
  }

  const currentPath = window.location.pathname;
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    if (href && href !== "javascript:void(0)" && href === currentPath) {
      setActive(link);
    }

    if (
      currentPath === "/invoice_tool" &&
      link.textContent.trim() === "Generate Invoice"
    ) {
      setActive(link);
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href") === "javascript:void(0)") {
        e.preventDefault();
      }
      setActive(this);
    });
  });
});

// *********** go to tool page ********
window.Clerk.load().then(() => {
  console.log("Clerk loaded");
});

async function goToTool() {
  const user = window.Clerk.user;
  if (user) {
    window.location.href = "/invoice_tool";
  } else {
    window.Clerk.openSignUp();
  }
}

// ✅ FIRESTORE INTEGRATION: Save invoices after generation
// ===================== SAVE INVOICE HANDLER =====================
const saveBtn = document.getElementById("saveInvoiceBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async function (event) {
    event.preventDefault();
    showLoader("Saving invoice...");

    const form = document.getElementById("invoiceForm");
    const formData = new FormData(form);

    try {
      const response = await fetch("/save_invoice", { method: "POST", body: formData });
      const result = await response.json();
      hideLoader();

      console.log("Invoice Save Result:", result);

      if (result.success && result.pdf_url) {
        try {
          // --- Firestore import & init ---
          const { getFirestore, collection, addDoc } = await import(
            "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
          );
          const db = window.firebaseDB || getFirestore();

          // --- Save invoice to Firestore ---
          await addDoc(collection(db, "invoices"), {
            pdfUrl: result.pdf_url,
            filename: result.pdf_url.split("/").pop(),
            timestamp: new Date().toISOString(),
          });

          console.log("✅ Invoice saved successfully in Firestore!");
        } catch (err) {
          console.error("❌ Firestore save failed:", err);
        }

        // Redirect to preview
        const redirectUrl = `/invoice_preview?pdf_url=${encodeURIComponent(result.pdf_url)}`;
        window.location.href = redirectUrl;
      } else {
        alert("Error generating invoice: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      hideLoader();
      console.error("Save Invoice failed:", err);
      alert("Network or server error while saving invoice.");
    }
  });
}

// Contact page
document.addEventListener("DOMContentLoaded", function () {
  const contactFormContainer = document.querySelector(".contact-form");
  const originalContactFormHTML = contactFormContainer
    ? contactFormContainer.innerHTML
    : "";

  function attachContactFormHandler() {
    const contactForm = document.querySelector(".contact-form form");
    if (contactForm) {
      contactForm.addEventListener(
        "submit",
        function (e) {
          e.preventDefault();

          const submitButton = contactForm.querySelector(
            "button[type='submit']"
          );
          if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML =
              '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
          }

          const formData = new FormData(contactForm);
          const dataObj = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            message: formData.get("message"),
          };

          fetch("/submit-contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataObj),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.error) throw new Error(data.error);
              const feedback =
                data.message ||
                "Thank you for your message! We will respond shortly.";
              contactFormContainer.innerHTML = `
                <div class="form-submitted">
                  <span class="material-symbols-rounded success-icon">check_circle</span>
                  <h3>Message Sent!</h3>
                  <p>${feedback}</p>
                  <button type="button" class="send-another-btn">Send Another Message</button>
                </div>`;
              document
                .querySelector(".send-another-btn")
                .addEventListener("click", () => {
                  contactFormContainer.innerHTML = originalContactFormHTML;
                  attachContactFormHandler();
                });
            })
            .catch((error) => {
              console.error("Error submitting contact form:", error);
              contactFormContainer.innerHTML = `
                <div class="form-submitted">
                  <span class="material-symbols-rounded error-icon">error</span>
                  <h3>Error</h3>
                  <p>${
                    error.message ||
                    "There was an error sending your message. Please try again later."
                  }</p>
                  <button type="button" class="send-another-btn">Try Again</button>
                </div>`;
              document
                .querySelector(".send-another-btn")
                .addEventListener("click", () => {
                  contactFormContainer.innerHTML = originalContactFormHTML;
                  attachContactFormHandler();
                });
            });
        },
        { once: true }
      );
    }
  }

  if (contactFormContainer) {
    attachContactFormHandler();
  }
});
