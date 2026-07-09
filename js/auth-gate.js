// 직원 페이지(주문현황·주문내역) 로그인 잠금.
// window.REQUIRE_LOGIN 이 true 면 로그인 화면을 먼저 띄우고,
// 로그인에 성공해야 페이지의 window.PAGE_START() 를 실행한다.
// REQUIRE_LOGIN 이 false 면 잠금 없이 바로 실행한다 (기존 동작).

(function () {
  let started = false;
  function runPage() {
    if (started) return;
    started = true;
    (window.PAGE_START || function () {})();
  }

  function buildOverlay() {
    if (document.getElementById("login-overlay")) return;
    const ov = document.createElement("div");
    ov.id = "login-overlay";
    ov.innerHTML = `
      <form id="login-box" autocomplete="on">
        <div class="login-emoji">🔒</div>
        <h2>직원 로그인</h2>
        <p class="login-sub">오로라 주스 가게 관리 화면</p>
        <input id="login-email" type="email" placeholder="이메일" autocomplete="username" required>
        <input id="login-pw" type="password" placeholder="비밀번호" autocomplete="current-password" required>
        <button type="submit" id="login-btn">로그인</button>
        <p class="login-err" id="login-err"></p>
      </form>`;
    document.body.appendChild(ov);

    ov.querySelector("#login-box").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = ov.querySelector("#login-email").value.trim();
      const pw = ov.querySelector("#login-pw").value;
      const btn = ov.querySelector("#login-btn");
      const err = ov.querySelector("#login-err");
      err.textContent = "";
      btn.disabled = true; btn.textContent = "확인 중…";
      try {
        await window.signIn(email, pw);   // 성공하면 watchAuth 콜백이 화면을 엶
      } catch (ex) {
        err.textContent = "이메일 또는 비밀번호를 확인해 주세요.";
        btn.disabled = false; btn.textContent = "로그인";
      }
    });
  }

  function setOverlay(show) {
    const ov = document.getElementById("login-overlay");
    if (ov) ov.style.display = show ? "flex" : "none";
  }

  function addLogout() {
    if (document.getElementById("logout-btn")) return;
    const b = document.createElement("button");
    b.id = "logout-btn";
    b.textContent = "로그아웃";
    b.onclick = async () => { await window.signOutUser(); location.reload(); };
    document.body.appendChild(b);
  }

  function begin() {
    // 잠금이 꺼져 있거나 인증을 못 쓰면 그냥 실행
    if (!window.REQUIRE_LOGIN || !window.ORDERS_ENABLED || !window.watchAuth) {
      runPage();
      return;
    }
    buildOverlay();
    setOverlay(true);
    window.watchAuth(function (user) {
      if (user) { setOverlay(false); addLogout(); runPage(); }
      else { setOverlay(true); }
    });
  }

  if (window.ORDERS_READY) begin();
  else window.addEventListener("orders-ready", begin, { once: true });
})();
