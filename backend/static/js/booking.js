let bookings = []
async function loadBookings() {
  const token = localStorage.getItem("access");

  console.log("🔍 DEBUG: loadBookings() called");

  if (!token) {
    console.error("❌ No token");
    window.location.href = "/api/users/login-page/";
    return;
  }

  try {
    const res = await fetch("/api/bookings/my/", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    console.log("📊 Status:", res.status);

    // ✅ FIRST check response
    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ API Error:", errorText);
      return;
    }

    // ✅ THEN parse JSON
    const apiData = await res.json();
    console.log("✅ API Data:", apiData);

    if (!Array.isArray(apiData)) {
      console.error("❌ Not array");
      return;
    }

    // ✅ Map data
    bookings = apiData.map(b => ({
  id: "#BK" + b.id,
  name: b.customer_name || "Booking",
  city: b.address || "India",
  service: b.service_name || "Unknown",
  icon: "🛠️",
  date: b.booking_date || "N/A",
  amount: parseFloat(b.total_price) || 0,
  status: b.status || "unknown",

  // ✅ EXACT SAME AS VENDOR
  image: b.image 
    ? "http://127.0.0.1:8000" + b.image
    : "/static/images/default.png"
}));

    console.log("✅ Processed bookings:", bookings);

    buildKPIs();
    updateTabCounts();
    renderTable();

  } catch (err) {
    console.error("💥 Error:", err);
  }
}








// async function updateStatus(id,status){

//  const token = localStorage.getItem("access")

//  const bookingId = id.replace("#BK","")

//  await fetch(`/api/bookings/booking/update/${bookingId}/`,{

//   method:"POST",

//   headers:{
//     "Content-Type":"application/json",
//     "Authorization":"Bearer " + token
//   },

//   body:JSON.stringify({
//     status:status
//   })

//  })

//  loadBookings()

// }







  const avatarColors = [
    ['rgba(91,110,248,.2)','var(--accent)'],
    ['rgba(0,229,180,.15)','var(--accent3)'],
    ['rgba(248,87,166,.15)','var(--accent2)'],
    ['rgba(251,191,36,.15)','#fbbf24'],
    ['rgba(167,139,250,.15)','#a78bfa'],
  ];

  let activeFilter = 'all';

  /* ── KPI ── */
  function buildKPIs() {
    const total     = bookings.length;
    const pending   = bookings.filter(b => b.status === 'pending').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const revenue   = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.amount, 0);

    const kpis = [
      { icon:'fa-calendar-check', bg:'rgba(91,110,248,.15)',  fg:'var(--accent)',  val: total,     lbl:'Total Bookings' },
      { icon:'fa-clock',          bg:'rgba(251,191,36,.12)',  fg:'#fbbf24',        val: pending,   lbl:'Pending' },
      { icon:'fa-circle-check',   bg:'rgba(0,229,180,.12)',   fg:'var(--accent3)', val: completed, lbl:'Completed' },
      { icon:'fa-indian-rupee-sign',bg:'rgba(248,87,166,.12)',fg:'var(--accent2)', val:'₹'+revenue.toLocaleString('en-IN'), lbl:'Revenue' },
    ];

    const kpiElement = document.getElementById('kpiStrip');
    if (kpiElement) {
      kpiElement.innerHTML = kpis.map(k => `
        <div class="kpi">
          <div class="kpi-icon" style="background:${k.bg};color:${k.fg};"><i class="fa ${k.icon}"></i></div>
          <div><div class="kpi-val">${k.val}</div><div class="kpi-lbl">${k.lbl}</div></div>
        </div>`).join('');
    } else {
      console.error("❌ kpiStrip element not found!");
    }
  }

  /* ── Tab counts ── */
  function updateTabCounts() {
    const tabs = document.querySelectorAll('.ftab');
    console.log("📊 updateTabCounts: Found", tabs.length, "tabs");
    
    if (tabs.length === 0) {
      console.error("❌ No .ftab elements found!");
      return;
    }
    
    tabs.forEach(tab => {
      const st = tab.dataset.status;
      const cntEl = tab.querySelector('.cnt');
      if (cntEl) {
        const cnt = st === 'all' ? bookings.length : bookings.filter(b => b.status === st).length;
        cntEl.textContent = cnt;
      }
    });
  }

  /* ── Filter tabs ── */
  function initializeFilterTabs() {
    const tabs = document.querySelectorAll('.ftab');
    console.log("🎯 Found filter tabs:", tabs.length);
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        console.log("Clicked tab:", tab.dataset.status);
        document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.status;
        renderTable();
      });
    });
  }

  /* ── Render ── */
  function renderTable() {
    const searchEl = document.getElementById('searchInput');
    const tableEl = document.getElementById('bookingTable');
    
    if (!tableEl) {
      console.error("❌ bookingTable element not found!");
      return;
    }

    const q = searchEl ? searchEl.value.toLowerCase() : '';

    const data = bookings.filter(b => {
      const matchStatus = activeFilter === 'all' || b.status === activeFilter;
      const matchQ = b.name.toLowerCase().includes(q) || b.service.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
      return matchStatus && matchQ;
    });

    console.log("🎨 renderTable: Rendering", data.length, "bookings");

    if (!data.length) {
      tableEl.innerHTML = `
        <tr class="empty-row"><td colspan="7">
          <i class="fa fa-calendar-xmark"></i>
          <p>${bookings.length === 0 ? 'No bookings yet. Book a service to get started!' : 'No bookings match your filter.'}</p>
        </td></tr>`;
      return;
    }

    tableEl.innerHTML = data.map((b, i) => {
      const [bg, fg] = avatarColors[i % avatarColors.length];
      const isPending = b.status === 'pending';
      return `
      <tr onclick="openModal(${JSON.stringify(b).replace(/"/g,"'")})">
        <td><span class="booking-id">${b.id}</span></td>
        <td>
          <div class="customer-cell">
            <div class="c-avatar" style="background:${bg};color:${fg};">${b.name[0]}</div>
            <div><div class="c-name">${b.name}</div><div class="c-city">${b.city}</div></div>
          </div>
        </td>
        <td>
  <div class="service-cell">
    <img src="${b.image}" class="service-img"/>
    <span>${b.service}</span>
  </div>
</td>
        <td class="date-cell">${b.date}</td>
        <td class="amount-cell">₹${typeof b.amount === 'number' ? b.amount.toLocaleString('en-IN') : b.amount}</td>
        <td><span class="badge ${b.status}">${cap(b.status)}</span></td>
        <td onclick="event.stopPropagation()">
          <div class="actions">
            ${isPending ? `
              <button class="act act-accept" onclick="updateStatus('${b.id}','confirmed')"><i class="fa fa-check"></i> Accept</button>
              <button class="act act-reject" onclick="updateStatus('${b.id}','cancelled')"><i class="fa fa-xmark"></i> Reject</button>
            ` : `<span class="act-icon" title="View"><i class="fa fa-eye"></i></span>`}
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  /* ── Update status ── */
  async function updateStatus(id, status) {
    const token = localStorage.getItem("access");
    const bookingId = id.replace("#BK", "");

    console.log(`🔄 Updating booking ${bookingId} to ${status}`);

    try {
      const res = await fetch(`/api/bookings/booking/update/${bookingId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("✅ Update response:", responseData);
        
        // Update local data
        bookings = bookings.map(b => b.id === id ? { ...b, status } : b);
        
        // Refresh UI
        buildKPIs();
        updateTabCounts();
        renderTable();
        closeModal();
        showToast(`Booking ${status}!`, 'success');
      } else {
        console.error("❌ Update failed:", res.status);
        showToast(`Error updating booking: ${res.status}`, 'error');
      }
    } catch (err) {
      console.error("💥 Error updating booking:", err);
      showToast('Error updating booking: ' + err.message, 'error');
    }
  }

  /* ── Modal ── */
  function openModal(b) {
    document.getElementById('modalBody').innerHTML = `
      <div class="modal-row"><span class="lbl">Booking ID</span><span class="val">${b.id}</span></div>
      <div class="modal-row"><span class="lbl">Customer</span><span class="val">${b.name} · ${b.city}</span></div>
      <div class="modal-row"><span class="lbl">Service</span><span class="val">${b.icon} ${b.service}</span></div>
      <div class="modal-row"><span class="lbl">Date</span><span class="val">${b.date}</span></div>
      <div class="modal-row"><span class="lbl">Amount</span><span class="val" style="color:var(--accent3);font-weight:700;">₹${b.amount.toLocaleString('en-IN')}</span></div>
      <div class="modal-row"><span class="lbl">Status</span><span class="val"><span class="badge ${b.status}">${cap(b.status)}</span></span></div>`;

    const actions = document.getElementById('modalActions');
    if (b.status === 'pending') {
      actions.innerHTML = `
        <button class="modal-btn primary" onclick="updateStatus('${b.id}','confirmed')"><i class="fa fa-check"></i> Accept Booking</button>
        <button class="modal-btn ghost" onclick="updateStatus('${b.id}','cancelled')"><i class="fa fa-xmark"></i> Reject</button>`;
    } else {
      actions.innerHTML = `<button class="modal-btn ghost" onclick="closeModal()" style="flex:1;">Close</button>`;
    }

    document.getElementById('modalOverlay').classList.add('open');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }

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
    document.querySelector(".avatar").innerText =
      user.name ? user.name.charAt(0).toUpperCase() : "U";

  } else {
    // not logged in
    window.location.href = "/api/users/login-page/";
  }

  // Initialize filter tabs
  initializeFilterTabs();
  
  // Load bookings after DOM is ready
  loadBookings();

});