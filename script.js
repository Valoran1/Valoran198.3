document.addEventListener("DOMContentLoaded", () => {
  addBubble("assistant", "I’m Valoran. Stop lying to yourself. What’s the real problem holding you back?");
});
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-box");
  const typingEl = document.getElementById("typing-indicator");
  const ctaForge = document.getElementById("cta-forge");
  const scrollBtn = document.getElementById("scroll-to-bottom");

  // Modal
  const emailModal = document.getElementById("email-modal");
  const emailBackdrop = document.getElementById("email-modal-backdrop");
  const emailForm = document.getElementById("email-form");
  const emailInput = document.getElementById("email-input");
  const modalClose = document.getElementById("modal-close");

  let conversation = [];
  let userMsgCount = 0;

  /* ============ Helpers ============ */
  const show = (el) => el && el.classList.remove("hidden");
  const hide = (el) => el && el.classList.add("hidden");

  function showTyping() { show(typingEl); }
  function hideTyping() { hide(typingEl); }

  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function autoresize() {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  }
  function storeEmail(email) {
    try { localStorage.setItem("valoran_email", email); } catch {}
  }
  function hasEmail() {
    try { return !!localStorage.getItem("valoran_email"); } catch { return false; }
  }

  function addBubble(role, text = "") {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    const p = document.createElement("div");
    p.className = "bubble";
    p.textContent = text;
    wrap.appendChild(p);
    chatLog.appendChild(wrap);
    scrollToBottom();
    return p; // for streaming
  }

  // Typing effect (word-by-word)
  function typeByWord(el, text, speed = 22) {
    const words = text.split(/(\s+)/);
    let i = 0;
    (function tick() {
      if (i < words.length) {
        el.textContent += words[i++];
        scrollToBottom();
        setTimeout(tick, speed);
      } else {
        hideTyping();
      }
    })();
  }

  /* ============ Intro message (ostrejši) ============ */
  if (!sessionStorage.getItem("welcomed")) {
    const b = addBubble("assistant");
    b.classList.add("typing");
    showTyping();
    typeByWord(
      b,
      "Jaz sem Valoran. Brez izgovorov. Izberi: telo, glava ali finance. Povej, kje padaš – dobiš nalogo za danes.",
      14
    );
    sessionStorage.setItem("welcomed", "1");
  }

  /* ============ Forge CTA ============ */
  function openModal() { show(emailModal); show(emailBackdrop); emailInput?.focus(); }
  function closeModal() { hide(emailModal); hide(emailBackdrop); }

  ctaForge?.addEventListener("click", () => {
    openModal();
  });
  modalClose?.addEventListener("click", closeModal);
  emailBackdrop?.addEventListener("click", closeModal);

  emailForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const em = emailInput?.value.trim();
    if (!em) return;
    storeEmail(em);
    emailInput.value = "";
    closeModal();

    // Avto-prilagojen prvi prompt po vpisu emaila:
    input.value = "Želim osebni 30-dnevni Forge Yourself plan.";
    autoresize();
    input.focus();

    // V pogovor dodaj info mehurček
    const info = addBubble("system", "Email shranjen. Začnimo s Forge Yourself.");
    info.classList.add("info");
  });

  /* ============ Enter / Shift+Enter ============ */
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  input.addEventListener("input", autoresize);

  /* ============ Submit chat ============ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // user bubble
    addBubble("user", text);
    conversation.push({ role: "user", content: text });
    input.value = "";
    autoresize();
    userMsgCount++;

    // če ni emaila po 3 user msg → odpri modal (gate)
    if (!hasEmail() && userMsgCount >= 3) {
      openModal();
      return;
    }

    // placeholder assistant bubble
    const botBubble = addBubble("assistant", "");
    botBubble.classList.add("typing");
    showTyping();

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation })
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        // preberi morebitno telo z napako
        let errText = "";
        try { errText = await response.text(); } catch {}
        hideTyping();
        botBubble.classList.remove("typing");
        botBubble.textContent = `Napaka pri povezavi (HTTP ${response.status}). ${errText || "Preveri funkcijo / netlify logs."}`;
        return;
      }

      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { reply: await response.text() };
      }

      const botMsg = data.reply || "OK.";
      botBubble.classList.remove("typing");
      typeByWord(botBubble, botMsg, 18);
      conversation.push({ role: "assistant", content: botMsg });
    } catch (err) {
      console.error(err);
      hideTyping();
      botBubble.classList.remove("typing");
      botBubble.textContent = "Prišlo je do napake v mreži. Si online? Preveri konzolo/Netlify logs.";
    }
  });

  /* ============ Scroll button ============ */
  chatLog.addEventListener("scroll", () => {
    const nearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 20;
    scrollBtn.style.display = nearBottom ? "none" : "block";
  });
  scrollBtn.addEventListener("click", () => { scrollToBottom(); });
});




async function typeOut(el, text, delay=15) {
  el.textContent = "";
  for (let i=0; i<text.length; i++) {
    el.textContent += text[i];
    await new Promise(r => setTimeout(r, delay));
  }
}
