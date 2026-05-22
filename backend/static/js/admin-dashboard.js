function loadDashboardStats() {
  fetch("/api/users/stats/", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    const cards = document.querySelectorAll('.card-value');

    cards[0].dataset.val = data.bookings;
    cards[1].dataset.val = data.services;
    cards[2].dataset.val = data.revenue;

    animateCards(); // animation run

  })
  .catch(err => console.error(err));
}





  /* ── Counter animation ── */



function animateCards() {
  document.querySelectorAll('.card-value').forEach(el => {
    const target = +el.dataset.val;
    const isRev  = el.id === 'rev';

    let cur = 0;
    const step = Math.ceil(target / 60);

    const t = setInterval(() => {
      cur = Math.min(cur + step, target);

      el.textContent = isRev
        ? '₹' + cur.toLocaleString('en-IN')
        : cur;

      if (cur >= target) clearInterval(t);
    }, 20);
  });
}






document.addEventListener("DOMContentLoaded", function () {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "/api/users/login-page/";
        return;
    }

    document.getElementById("userName").innerText = user.name;

    const avatar = document.querySelector(".avatar");
    if (avatar) {
        avatar.innerText = user.name.charAt(0).toUpperCase();
    }

    document.getElementById("welcomeText").innerText =
        `Good morning, ${user.name} 👋`;

    // ✅ ADD THIS LINE
    loadDashboardStats();
    loadChart();
    loadServiceBreakdown();
    loadRecentBookings();

});






function openServiceForm(){
  document.getElementById('srvOverlay').classList.add('open');
  document.querySelector(".srv-modal-title").innerText = "New Service";
}

function closeServiceForm() {
  document.getElementById('srvOverlay').classList.remove('open');
}

function selectSrvCat(el, cat) {
  document.querySelectorAll('.srv-cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('srvCategory').value = cat.toLowerCase();
}

function previewSrvImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('srvImgPreview');
    preview.style.backgroundImage = `url(${e.target.result})`;
    preview.classList.add('show');
    document.getElementById('srvUploadPlaceholder').style.display = 'none';
    document.getElementById('srvUploadText').style.display = 'none';
    document.getElementById('srvUploadHint').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeSrvImage(e) {
  e.stopPropagation();
  const preview = document.getElementById('srvImgPreview');
  preview.style.backgroundImage = '';
  preview.classList.remove('show');
  document.getElementById('srvImage').value = '';
  document.getElementById('srvUploadPlaceholder').style.display = 'flex';
  document.getElementById('srvUploadText').style.display = 'block';
  document.getElementById('srvUploadHint').style.display = 'block';
}

function createService(){
  const formData = new FormData();
  formData.append("name", document.getElementById("srvName").value);
  formData.append("category", document.getElementById("srvCategory").value.toLowerCase());
  formData.append("price", document.getElementById("srvPrice").value);
  formData.append("time", document.getElementById("srvTime").value);
  formData.append("description", document.getElementById("srvDesc").value);
  const image = document.getElementById("srvImage").files[0];
  if (image) formData.append("image", image);

  fetch("/api/services/create/", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    },
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);
    showToast("✅ Service Created");
    closeServiceForm();
    // Reset form
    document.getElementById("srvName").value = "";
    document.getElementById("srvCategory").value = "";
    document.getElementById("srvPrice").value = "";
    document.getElementById("srvTime").value = "";
    document.getElementById("srvDesc").value = "";
    document.getElementById("srvImage").value = "";
    removeSrvImage({stopPropagation: () => {}});
    // Reload stats
    loadDashboardStats();
  })
  .catch(err => {
    console.error(err);
    showToast("❌ Error creating service", "error");
  });
}

function showToast(msg, type = "success") {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

document.addEventListener('keydown', e => { if(e.key === 'Escape') closeServiceForm(); });
 
  /* ── Chart ── */
 function loadChart() {

  fetch("/api/bookings/weekly-earnings/", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    const labels = data.map(item => item.d);
    const revenueData = data.map(item => item.v);

    // 👉 optional (fake bookings from revenue)
    const bookingsData = revenueData.map(v => Math.round(v / 100));

    const ctx = document.getElementById('bookingChart').getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, 'rgba(91,110,248,.35)');
    grad.addColorStop(1, 'rgba(91,110,248,0)');

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Bookings',
            data: bookingsData,
            borderColor: '#5b6ef8',
            backgroundColor: grad,
            borderWidth: 2.5,
            pointBackgroundColor: '#5b6ef8',
            pointBorderColor: '#0f1623',
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: .45,
            fill: true,
          },
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: '#f857a6',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointBackgroundColor: '#f857a6',
            pointBorderColor: '#0f1623',
            pointBorderWidth: 2,
            pointRadius: 4,
            tension: .45,
            borderDash: [5, 4],
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: {
              color: '#6b7a99',
              font: { family: 'DM Sans', size: 12 },
              usePointStyle: true,
              pointStyleWidth: 8,
            }
          },
          tooltip: {
            backgroundColor: '#151d2e',
            borderColor: 'rgba(255,255,255,.1)',
            borderWidth: 1,
            titleColor: '#e8ecf4',
            bodyColor: '#6b7a99',
            padding: 12,
            cornerRadius: 10,
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,.04)' },
            ticks: { color: '#6b7a99', font: { family: 'DM Sans', size: 12 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,.04)' },
            ticks: { color: '#6b7a99', font: { family: 'DM Sans', size: 12 } },
            beginAtZero: true,
          }
        }
      }
    });

  })
  .catch(err => console.error("Chart error:", err));
}







function loadServiceBreakdown() {
  fetch("/api/users/service-breakdown/", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    const container = document.querySelector(".stat-list");
    container.innerHTML = "";

    const colors = [
      "var(--accent)",
      "var(--accent3)",
      "var(--accent2)",
      "#fbbf24",
      "#a78bfa"
    ];

    const max = Math.max(...data.map(i => i.total));

    data.forEach((item, i) => {

      const percent = (item.total / max) * 100;
      const color = colors[i % colors.length];

      container.innerHTML += `
        <div class="stat-item">
          <div class="stat-dot" style="background:${color};"></div>
          <div class="stat-info">
            <div class="stat-name">${item.name}</div>
            <div class="stat-bar-wrap">
              <div class="stat-bar" style="width:${percent}%;background:${color};"></div>
            </div>
          </div>
          <div class="stat-num">${item.total}</div>
        </div>
      `;
    });

  })
  .catch(err => console.error(err));
}






function loadRecentBookings() {
  fetch("/api/users/recent-bookings/", {
    headers: {
      "Authorization": "Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    const tbody = document.querySelector(".table-wrap tbody");
    tbody.innerHTML = "";

    const colors = [
      ['rgba(91,110,248,.2)', 'var(--accent)'],
      ['rgba(0,229,180,.15)', 'var(--accent3)'],
      ['rgba(248,87,166,.15)', 'var(--accent2)'],
      ['rgba(251,191,36,.15)', '#fbbf24'],
      ['rgba(167,139,250,.15)', '#a78bfa'],
    ];

    data.forEach((b, i) => {
      const [bg, fg] = colors[i % colors.length];

      tbody.innerHTML += `
        <tr>
          <td>
            <div class="customer-cell">
              <div class="c-avatar" style="background:${bg};color:${fg};">
                ${b.customer.charAt(0)}
              </div>
              <div>
                <div style="font-weight:500;">${b.customer}</div>
                <div style="font-size:11px;color:var(--muted);">${b.city}</div>
              </div>
            </div>
          </td>

          <td>
            <div class="service-badge">
              ${b.service}
            </div>
          </td>

          <td class="date-cell">${b.date}</td>

          <td style="font-weight:600;">₹${b.amount}</td>

          <td>
            <span class="badge ${b.status}">
              ${capitalize(b.status)}
            </span>
          </td>

          <td>
            <span class="action-btn">
              <i class="fa fa-ellipsis-h"></i>
            </span>
          </td>
        </tr>
      `;
    });

  })
  .catch(err => console.error(err));
}





function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}




  /* ── Data ── */
  const users = [
    { id:1, name:'Shivam Kumar', email:'shivam@example.com', role:'admin',    joined:'01 Jan 2025' },
    { id:2, name:'Rahul Sharma', email:'rahul@example.com',  role:'customer', joined:'15 Feb 2025' },
    { id:3, name:'Amit Verma',   email:'amit@example.com',   role:'vendor',   joined:'20 Mar 2025' },
  ];

  const services = [
    { id:1, name:'AC Repair',  vendor:'Amit Verma', category:'Appliance', price:'₹1,200', status:'pending'  },
    { id:2, name:'Cleaning',   vendor:'Priya Patel', category:'Home',     price:'₹800',   status:'approved' },
    { id:3, name:'Plumbing',   vendor:'Karan Mehta', category:'Home',     price:'₹650',   status:'rejected' },
  ];

  const bookings = [
    { id:1, customer:'Rahul Sharma', service:'AC Repair',  date:'12 Mar 2025', amount:'₹1,200', status:'pending'   },
    { id:2, customer:'Neha Singh',   service:'Cleaning',   date:'11 Mar 2025', amount:'₹800',   status:'completed' },
    { id:3, customer:'Priya Patel',  service:'Plumbing',   date:'10 Mar 2025', amount:'₹650',   status:'completed' },
  ];

  let currentTab = 'users';
  let currentData = [...users];

  /* ── Avatar color map ── */
  const colors = [
    ['rgba(91,110,248,.2)', 'var(--accent)'],
    ['rgba(0,229,180,.15)', 'var(--accent3)'],
    ['rgba(248,87,166,.15)', 'var(--accent2)'],
    ['rgba(251,191,36,.15)', '#fbbf24'],
    ['rgba(167,139,250,.15)', '#a78bfa'],
  ];

  function avatarColors(i) { return colors[i % colors.length]; }

  /* ── Counter animation ── */
  document.querySelectorAll('.stat-info .val').forEach(el => {
    const t = +el.dataset.val;
    let c = 0;
    const iv = setInterval(() => {
      c = Math.min(c + 1, t);
      el.textContent = c;
      if (c >= t) clearInterval(iv);
    }, 60);
  });

  /* ── Tab switch ── */
  function showTab(tab, btn) {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = tab;
    document.getElementById('searchInput').value = '';
    if (tab === 'users')     renderUsers(users);
    if (tab === 'services')  renderServices(services);
    if (tab === 'bookings')  renderBookings(bookings);
  }

  /* ── Search ── */
  function handleSearch() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    if (currentTab === 'users')
      renderUsers(users.filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)));
    if (currentTab === 'services')
      renderServices(services.filter(s => s.name.toLowerCase().includes(q) || s.status.toLowerCase().includes(q)));
    if (currentTab === 'bookings')
      renderBookings(bookings.filter(b => b.customer.toLowerCase().includes(q) || b.service.toLowerCase().includes(q)));
  }

  /* ── Render Users ── */
  function renderUsers(data = users) {
    document.getElementById('tableHead').innerHTML = `
      <th>User</th><th>Role</th><th>Joined</th><th>Actions</th>`;

    if (!data.length) { emptyState(); return; }

    document.getElementById('tableBody').innerHTML = data.map((u, i) => {
      const [bg, fg] = avatarColors(i);
      return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="u-avatar" style="background:${bg};color:${fg};">${u.name[0]}</div>
            <div><div class="u-name">${u.name}</div><div class="u-email">${u.email}</div></div>
          </div>
        </td>
        <td><span class="role-badge ${u.role}"><i class="fa fa-${u.role==='admin'?'shield-halved':u.role==='vendor'?'store':'user'}"></i> ${cap(u.role)}</span></td>
        <td style="color:var(--muted);font-size:13px;">${u.joined}</td>
        <td>
          <div class="actions">
            <button class="act-btn act-view"><i class="fa fa-eye"></i> View</button>
            <button class="act-btn act-delete"><i class="fa fa-trash"></i> Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }



  /* ── Render Services ── */
  function renderServices(data = services) {
    document.getElementById('tableHead').innerHTML = `
      <th>Service</th><th>Vendor</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th>`;

    if (!data.length) { emptyState(); return; }

    document.getElementById('tableBody').innerHTML = data.map(s => `
      <tr>
        <td style="font-weight:500;">${s.name}</td>
        <td style="color:var(--muted);">${s.vendor}</td>
        <td><span style="font-size:12px;background:rgba(255,255,255,.06);padding:4px 10px;border-radius:6px;">${s.category}</span></td>
        <td style="font-weight:600;">${s.price}</td>
        <td><span class="status-badge ${s.status}">${cap(s.status)}</span></td>
        <td>
          <div class="actions">
            <button class="act-btn act-approve"><i class="fa fa-check"></i> Approve</button>
            <button class="act-btn act-reject"><i class="fa fa-xmark"></i> Reject</button>
          </div>
        </td>
      </tr>`).join('');
  }

  /* ── Render Bookings ── */
  function renderBookings(data = bookings) {
    document.getElementById('tableHead').innerHTML = `
      <th>Customer</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th>`;

    if (!data.length) { emptyState(); return; }

    document.getElementById('tableBody').innerHTML = data.map((b, i) => {
      const [bg, fg] = avatarColors(i);
      return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="u-avatar" style="background:${bg};color:${fg};">${b.customer[0]}</div>
            <div class="u-name">${b.customer}</div>
          </div>
        </td>
        <td style="color:var(--muted);">${b.service}</td>
        <td style="color:var(--muted);font-size:13px;">${b.date}</td>
        <td style="font-weight:600;">${b.amount}</td>
        <td><span class="status-badge ${b.status}">${cap(b.status)}</span></td>
        <td>
          <div class="actions">
            <button class="act-btn act-view"><i class="fa fa-eye"></i> View</button>
            <button class="act-btn act-delete"><i class="fa fa-trash"></i> Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  function emptyState() {
    document.getElementById('tableBody').innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="fa fa-box-open"></i>
          <p>No records found</p>
        </div>
      </td></tr>`;
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ── Default load ── */
  renderUsers();


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

    const user = JSON.parse(localStorage.getItem("user"));

    console.log("User:", user);

    // ❌ Agar user nahi hai → redirect
    if (!user) {
        window.location.href = "/api/users/login-page/";
        return;
    }

    // ✅ Agar user hai → data show karo
    document.getElementById("userName").innerText = user.name;

    document.querySelector(".avatar").innerText =
        user.name.charAt(0).toUpperCase();

    document.getElementById("welcomeText").innerText =
        `Good morning, ${user.name} 👋`;

});


// function renderUsers(data = users) {

//   const head = document.getElementById('tableHead');
//   const body = document.getElementById('tableBody');

//   if (!head || !body) {
//     console.log("Table elements not found");
//     return;
//   }

//   head.innerHTML = `
//     <th>User</th><th>Role</th><th>Joined</th><th>Actions</th>`;

//   body.innerHTML = data.map(u => `
//     <tr>
//       <td>${u.name}</td>
//       <td>${u.role}</td>
//       <td>${u.joined}</td>
//       <td>...</td>
//     </tr>
//   `).join('');
// }