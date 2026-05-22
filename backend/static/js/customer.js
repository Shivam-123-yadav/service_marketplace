
  /* ── Data ── */
  let customers = [];

function loadCustomers() {
  fetch("/api/users/customers/", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {
    customers = data;

    updateKPIs(customers);
    renderGrid(customers);
  })
  .catch(err => console.log(err));
}





document.addEventListener("DOMContentLoaded", function () {

  const userData = localStorage.getItem("user");

  if (!userData) {
    window.location.href = "/api/users/login-page/";
    return;
  }

  const user = JSON.parse(userData);

  document.getElementById("userName").innerText = user.name;
  document.getElementById("userRole").innerText = user.role;

  // 🔥 NEW
  loadCustomers();

});




function openAddCustomerModal() {
  document.getElementById("modal").innerHTML = `
    <div class="modal-banner" style="background: linear-gradient(135deg, rgba(91,110,248,.35), rgba(248,87,166,.2));">
      <div class="modal-avatar"><i class="fa fa-user-plus"></i></div>
      <button class="modal-close" onclick="closeModal()"><i class="fa fa-xmark"></i></button>
    </div>

    <div class="modal-body">
      <div class="modal-name">Add Customer</div>
      <div class="modal-sub">Fill in details to create a new customer account.</div>

      <div class="field">
        <label for="cName">Name</label>
        <input id="cName" type="text" placeholder="John Doe" />
      </div>

      <div class="field">
        <label for="cEmail">Email</label>
        <input id="cEmail" type="email" placeholder="john@example.com" />
      </div>

      <div class="field">
        <label for="cPassword">Password</label>
        <input id="cPassword" type="password" placeholder="••••••••" />
      </div>

      <div class="modal-actions" style="margin-top:18px;">
        <button class="modal-btn primary" onclick="addCustomer()">Save Customer</button>
        <button class="modal-btn ghost" onclick="closeModal()">Cancel</button>
      </div>
    </div>
  `;

  document.getElementById("modalOverlay").classList.add("open");
}



function addCustomer() {

  const name = document.getElementById("cName").value;
  const email = document.getElementById("cEmail").value;
  const password = document.getElementById("cPassword").value;

  fetch("/api/users/add-customer/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access")
    },
    body: JSON.stringify({
      name: name,
      email: email,
      password: password
    })
  })
  .then(res => res.json())
  .then(data => {

    if (data.message) {
      toastr.success("Customer added successfully");

      closeModal();

      // reload customers
      loadCustomers();
    } else {
      toastr.error("Error adding customer");
      console.log(data);
    }

  })
  .catch(err => console.log(err));
}




  const avatarColors = [
    ['rgba(91,110,248,.2)','var(--accent)'],
    ['rgba(0,229,180,.15)','var(--accent3)'],
    ['rgba(248,87,166,.15)','var(--accent2)'],
    ['rgba(251,191,36,.15)','#fbbf24'],
    ['rgba(167,139,250,.15)','#a78bfa'],
  ];

  let currentView = 'grid';

  /* ── KPIs ── */
  function updateKPIs(data) {
    animateCount('kTotalUsers', data.length);
    animateCount('kCustomers',  data.filter(c => c.role==='customer').length);
    animateCount('kVendors',    data.filter(c => c.role==='vendor').length);
    animateCount('kActive',     data.filter(c => c.status==='active').length);
  }

  function animateCount(id, target) {
    const el = document.getElementById(id);
    let cur = 0;
    const iv = setInterval(() => {
      cur = Math.min(cur + 1, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(iv);
    }, 40);
  }

  /* ── Filters ── */
  function applyFilters() {
    const q      = document.getElementById('searchInput').value.toLowerCase();
    const role   = document.getElementById('roleFilter').value;
    const status = document.getElementById('statusFilter').value;

    const data = customers.filter(c => {
      const mRole   = role   === 'all' || c.role   === role;
      const mStatus = status === 'all' || c.status === status;
      const mQ      = c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
      return mRole && mStatus && mQ;
    });

    updateKPIs(data);
    if (currentView === 'grid') renderGrid(data);
    else renderList(data);
  }

  /* ── View toggle ── */
  function setView(v) {
    currentView = v;
    document.getElementById('gridBtn').className = 'vtab' + (v==='grid'?' active':'');
    document.getElementById('listBtn').className = 'vtab' + (v==='list'?' active':'');
    document.getElementById('gridView').style.display = v==='grid' ? 'grid' : 'none';
    document.getElementById('listView').style.display = v==='list' ? 'block' : 'none';
    applyFilters();
  }

  /* ── Grid ── */
  function renderGrid(data) {
    if (!data.length) {
      document.getElementById('gridView').innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--muted);">
          <i class="fa fa-users" style="font-size:44px;display:block;margin-bottom:14px;opacity:.3;"></i>
          <p style="font-size:14px;">No customers found.</p>
        </div>`;
      return;
    }

    document.getElementById('gridView').innerHTML = data.map((c, i) => {
      const [bg, fg] = avatarColors[i % avatarColors.length];
      return `
      <div class="cust-card" onclick="openModal(${c.id})" style="animation-delay:${i*.05}s;">
        <div class="cust-card-top">
          <div class="cust-card-banner" style="background:${c.gradient};"></div>
          <div class="cust-card-avatar" style="background:${bg};color:${fg};">${c.name[0]}</div>
        </div>
        <div class="cust-card-body">
          <div class="cust-card-name">${c.name}</div>
          <div class="cust-card-email"><i class="fa fa-envelope" style="font-size:10px;margin-right:5px;"></i>${c.email}</div>
          <div class="cust-card-tags">
            <span class="tag ${c.role}"><i class="fa fa-${c.role==='vendor'?'store':'user'}" style="font-size:10px;"></i> ${cap(c.role)}</span>
            <span class="tag ${c.status}-tag">${cap(c.status)}</span>
            <span class="tag" style="background:rgba(255,255,255,.06);color:var(--muted);"><i class="fa fa-location-dot" style="font-size:10px;"></i> ${c.city}</span>
          </div>
          <div class="cust-card-stats">
            <div class="cstat"><div class="cstat-val">${c.bookings}</div><div class="cstat-lbl">Bookings</div></div>
            <div class="cstat"><div class="cstat-val">₹${(c.spent/1000).toFixed(1)}K</div><div class="cstat-lbl">Spent</div></div>
            <div class="cstat"><div class="cstat-val">${c.joined}</div><div class="cstat-lbl">Joined</div></div>
          </div>
          <div class="cust-card-footer">
            <button class="cf-btn primary" onclick="event.stopPropagation();openModal(${c.id})"><i class="fa fa-eye"></i> View</button>
            <button class="cf-btn ghost" onclick="event.stopPropagation();toggleBlock(${c.id})">
              <i class="fa fa-${c.status==='active'?'ban':'unlock'}"></i> ${c.status==='active'?'Block':'Unblock'}
            </button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  /* ── List ── */
  function renderList(data) {
    if (!data.length) {
      document.getElementById('listBody').innerHTML = `
        <tr class="empty-row"><td colspan="8">
          <i class="fa fa-users"></i>
          <p>No customers found.</p>
        </td></tr>`;
      return;
    }

    document.getElementById('listBody').innerHTML = data.map((c, i) => {
      const [bg, fg] = avatarColors[i % avatarColors.length];
      return `
      <tr onclick="openModal(${c.id})">
        <td>
          <div class="user-cell">
            <div class="u-avatar" style="background:${bg};color:${fg};">${c.name[0]}</div>
            <div><div class="u-name">${c.name}</div><div class="u-email">${c.email}</div></div>
          </div>
        </td>
        <td><span class="badge ${c.role}">${cap(c.role)}</span></td>
        <td style="color:var(--muted);">${c.city}</td>
        <td style="font-weight:600;">${c.bookings}</td>
        <td style="font-family:'Syne',sans-serif;font-weight:700;">₹${c.spent.toLocaleString('en-IN')}</td>
        <td style="color:var(--muted);font-size:13px;">${c.joined}</td>
        <td><span class="badge ${c.status}-s">${cap(c.status)}</span></td>
        <td onclick="event.stopPropagation()">
          <div class="actions">
            <button class="act act-view" onclick="openModal(${c.id})"><i class="fa fa-eye"></i> View</button>
            <button class="act ${c.status==='active'?'act-block':'act-unblock'}" onclick="toggleBlock(${c.id})">
              <i class="fa fa-${c.status==='active'?'ban':'unlock'}"></i> ${c.status==='active'?'Block':'Unblock'}
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Toggle block ── */
  function toggleBlock(id) {

  fetch(`/api/users/toggle-user/${id}/`, {
    method: "PATCH",
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    // local update
    customers = customers.map(c =>
      c.id === id ? { ...c, status: data.status ? "active" : "inactive" } : c
    );

    const c = customers.find(c => c.id === id);

    // toast message
    showToast(
      c.status === "inactive"
        ? `🚫 ${c.name} blocked.`
        : `✅ ${c.name} unblocked.`,
      c.status === "inactive" ? "error" : "success"
    );

    applyFilters();

  })
  .catch(err => console.log(err));

}



function addCustomer() {

  const name = document.getElementById("cName").value;
  const email = document.getElementById("cEmail").value;
  const password = document.getElementById("cPassword").value;

  if (!name || !email || !password) {
    showToast("⚠️ All fields required", "error");
    return;
  }

  fetch("/api/users/add-customer/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("access")
    },
    body: JSON.stringify({ name, email, password })
  })
  .then(res => res.json())
  .then(data => {

    if (data.error) {
      showToast(data.error, "error");
      return;
    }

    showToast("✅ Customer added");

    loadCustomers(); // 🔥 reload data
    closeModal();

  });
}



function loadCustomers() {
  fetch("/api/users/customers/", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    customers = data;

    updateKPIs(customers);
    renderGrid(customers);

  });
}



  /* ── Modal ── */
  function openModal(id) {
    const c = customers.find(x => x.id === id);
    const [bg, fg] = avatarColors[(id - 1) % avatarColors.length];

    document.getElementById('modal').innerHTML = `
      <div class="modal-banner" style="background:${c.gradient};">
        <div class="modal-avatar" style="background:${bg};color:${fg};">${c.name[0]}</div>
        <button class="modal-close" onclick="closeModal()"><i class="fa fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <div class="modal-name">${c.name}</div>
        <div class="modal-sub">${c.email} · ${c.city}</div>
        <div class="modal-tags">
          <span class="tag ${c.role}"><i class="fa fa-${c.role==='vendor'?'store':'user'}" style="font-size:10px;"></i> ${cap(c.role)}</span>
          <span class="tag ${c.status}-tag">${cap(c.status)}</span>
        </div>
        <div class="modal-stats">
          <div class="mstat"><div class="mstat-val">${c.bookings}</div><div class="mstat-lbl">Bookings</div></div>
          <div class="mstat"><div class="mstat-val">₹${(c.spent/1000).toFixed(1)}K</div><div class="mstat-lbl">Spent</div></div>
          <div class="mstat"><div class="mstat-val">${c.joined}</div><div class="mstat-lbl">Joined</div></div>
        </div>
        <div class="modal-rows">
          <div class="modal-row"><i class="fa fa-envelope"></i><span class="lbl">Email</span><span class="val">${c.email}</span></div>
          <div class="modal-row"><i class="fa fa-location-dot"></i><span class="lbl">City</span><span class="val">${c.city}</span></div>
          <div class="modal-row"><i class="fa fa-calendar"></i><span class="lbl">Joined</span><span class="val">${c.joined}</span></div>
          <div class="modal-row"><i class="fa fa-indian-rupee-sign"></i><span class="lbl">Total Spent</span><span class="val" style="color:var(--accent3);font-weight:700;">₹${c.spent.toLocaleString('en-IN')}</span></div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn primary"><i class="fa fa-message"></i> Message</button>
          <button class="modal-btn ${c.status==='active'?'danger':'ghost'}" onclick="toggleBlock(${c.id});closeModal()">
            <i class="fa fa-${c.status==='active'?'ban':'unlock'}"></i> ${c.status==='active'?'Block User':'Unblock'}
          </button>
          <button class="modal-btn ghost" onclick="closeModal()">Close</button>
        </div>
      </div>`;

    document.getElementById('modalOverlay').classList.add('open');
  }

  function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  /* ── Toast ── */
  function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ── Init ── */
  updateKPIs(customers);
  renderGrid(customers);


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

document.addEventListener("DOMContentLoaded", function () {

  const userData = localStorage.getItem("user");

  console.log("User Data:", userData); // debug

  if (userData) {
    const user = JSON.parse(userData);

    // name + role show
    document.getElementById("userName").innerText = user.name || "User";
    document.getElementById("userRole").innerText = user.role || "User";

    // avatar first letter
    document.querySelector(".s-avatar").innerText =
    user.name.charAt(0).toUpperCase();

  } else {
    // not logged in
    window.location.href = "/api/users/login-page/";
  }

});