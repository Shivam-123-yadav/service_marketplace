  function toggleEye() {
    const pw = document.getElementById('password');
    const eye = document.getElementById('eyeToggle');
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    eye.className = `eye-toggle fa fa-eye${show ? '-slash' : ''}`;
  }

  function showToast(msg, type = 'error') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  // Check login permission
  function checkAuth(){

    const token = localStorage.getItem("access");
    const user  = JSON.parse(localStorage.getItem("user"));

    if(!token || !user){
      window.location.href="/api/users/login-page/";
      return false;
    }

    return user;
  }

  // Role redirect
  function redirectByRole(role){

    if(role === "admin"){
      window.location.href = "/api/users/admin-page/";
    }

    else if(role === "vendor"){
      window.location.href = "/api/users/vendor-page/";
    }

    else if(role === "customer"){
      window.location.href = "/api/users/customers-page/";
    }

    else{
      window.location.href = "/api/users/dashboard-page/";
    }

  }

  document.getElementById('loginBtn').addEventListener('click', async (e) => {

    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showToast('⚠️ Please fill in all fields');
      return;
    }

    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Signing in…';
    btn.disabled = true;

    try {

      const res  = await fetch('http://127.0.0.1:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {

        showToast('✅ Login successful! Redirecting…', 'success');

        // Save JWT tokens
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);

        // Save user info
        localStorage.setItem("user", JSON.stringify(data.user));

        const role = data.user.role;

        setTimeout(() => redirectByRole(role), 1200);

      } else {

        showToast(data.error || '❌ Invalid credentials');
        btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Login';
        btn.disabled = false;

      }

    } catch {

      showToast('❌ Server error. Please try again.');
      btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Login';
      btn.disabled = false;

    }

  });

  // Enter key
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      document.getElementById('loginBtn').click();
    }
  });


  function logout(){

  fetch("/api/users/logout/",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer " + localStorage.getItem("access")
    },
    body:JSON.stringify({
      refresh: localStorage.getItem("refresh")
    })
  })

  .then(res => res.json())
  .then(data => {

    console.log(data)

    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    localStorage.removeItem("user")

    window.location.href="/api/users/login-page/"
  })

}



/* Register */


  /* role selection (right panel) */
  function selectRole(r) {
    document.getElementById('role').value = r;
    document.getElementById('tabCustomer').className = 'role-tab' + (r === 'customer' ? ' active' : '');
    document.getElementById('tabVendor').className   = 'role-tab' + (r === 'vendor'   ? ' active' : '');
    selectLeftRole(r);
  }

  /* role cards (left panel) */
  function selectLeftRole(r) {
    document.getElementById('leftCustomer').className = 'role-option' + (r === 'customer' ? ' active' : '');
    document.getElementById('leftVendor').className   = 'role-option' + (r === 'vendor'   ? ' active' : '');
    document.getElementById('role').value = r;
    document.getElementById('tabCustomer').className = 'role-tab' + (r === 'customer' ? ' active' : '');
    document.getElementById('tabVendor').className   = 'role-tab' + (r === 'vendor'   ? ' active' : '');
  }

  /* password strength */
  function checkStrength() {
    const pw = document.getElementById('password').value;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const colors = ['#ff6b6b', '#fbbf24', '#5b6ef8', '#00e5b4'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    for (let i = 1; i <= 4; i++) {
      document.getElementById('b' + i).style.background = i <= score ? colors[score - 1] : 'rgba(255,255,255,.08)';
    }
    document.getElementById('strengthLabel').textContent = pw ? labels[score - 1] || 'Too short' : 'Password strength';
  }

  /* progress steps */
  function updateProgress() {
    const n = document.getElementById('name').value.trim();
    const e = document.getElementById('email').value.trim();
    const p = document.getElementById('password').value;

    const s1 = document.getElementById('s1');
    const s2 = document.getElementById('s2');
    const s3 = document.getElementById('s3');
    const l1 = document.getElementById('line1');
    const l2 = document.getElementById('line2');

    if (n) { s1.className = 'step-dot done'; s1.innerHTML = '<i class="fa fa-check" style="font-size:10px"></i>'; }
    else   { s1.className = 'step-dot active'; s1.textContent = '1'; }

    if (e && n) { l1.style.width = '100%'; s2.className = 'step-dot done'; s2.innerHTML = '<i class="fa fa-check" style="font-size:10px"></i>'; }
    else        { l1.style.width = '0%'; s2.className = 'step-dot' + (n ? ' active' : ''); s2.textContent = '2'; }

    if (p && e && n) { l2.style.width = '100%'; s3.className = 'step-dot done'; s3.innerHTML = '<i class="fa fa-check" style="font-size:10px"></i>'; }
    else             { l2.style.width = '0%'; s3.className = 'step-dot' + (e && n ? ' active' : ''); s3.textContent = '3'; }
  }

  /* eye toggle */
  function toggleEye() {
    const pw  = document.getElementById('password');
    const eye = document.getElementById('eyeToggle');
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    eye.className = `eye-toggle fa fa-eye${show ? '-slash' : ''}`;
  }

  /* toast */
  function showToast(msg, type = 'error') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* submit */
  document.getElementById('registerBtn').addEventListener('click', async () => {
    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role     = document.getElementById('role').value;

    if (!name || !email || !password) { showToast('⚠️ Please fill in all fields'); return; }
    if (password.length < 6)          { showToast('⚠️ Password must be at least 6 characters'); return; }

    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Creating account…';
    btn.disabled = true;

    try {
      const res  = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();

      if (res.ok) {
        showToast('✅ Account created! Redirecting to login…', 'success');
        setTimeout(() => window.location.href = '/api/users/login-page/', 1400);
      } else {
        showToast(JSON.stringify(data));
        btn.innerHTML = '<i class="fa fa-user-plus"></i> Create Account';
        btn.disabled = false;
      }
    } catch {
      showToast('❌ Server error. Please try again.');
      btn.innerHTML = '<i class="fa fa-user-plus"></i> Create Account';
      btn.disabled = false;
    }
  });
// login success ke baad
