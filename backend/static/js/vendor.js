
let services = []
let bookings = [] // abhi static rehne de ya baad me API se laa sakte







function loadVendorServices(){

  fetch("/api/services/get-services/",{
    headers:{
      "Authorization":"Bearer " + localStorage.getItem("access")
    }
  })
  .then(res => res.json())
  .then(data => {

    console.log("Vendor Services:", data)

    services = data.map(s => ({
      id: s.id,
      name: s.name,
      cat: s.category,
      price: s.price,
      duration: s.time + " min",
      desc: s.description,
      bookings: s.total_bookings || 0,
      status: s.status || "active",
      image: "http://127.0.0.1:8000" + s.image,
      gradient: "rgba(91,110,248,.18)"
    }))

    renderServices(services)
    renderHealth()

  })
}





async function loadStats(){

  const token = localStorage.getItem("access")

  try{

    const res = await fetch("/api/users/stats/", {
      headers:{
        "Authorization":"Bearer " + token
      }
    })

    const data = await res.json()

    console.log("Stats:", data)

    // ✅ set values
    document.getElementById("totalBookings").innerText = data.bookings;

    // optional aur bhi
    document.getElementById("pendingBadge").innerText = data.pending
    document.getElementById("pendingCount").innerText = data.pending

  }
  catch(err){
    console.log(err)
  }

}



function animateValue(el, value){
  let start = 0

  const step = Math.ceil(value / 30)  // smooth animation

  const interval = setInterval(() => {
    start += step

    if(start >= value){
      el.innerText = value
      clearInterval(interval)
    } else {
      el.innerText = start
    }

  }, 20)
}





function renderHealth(){
  document.getElementById('healthList').innerHTML = services.slice(0,3).map(s => `
    
    <div class="health-item">

      <!-- ✅ Image Banner -->
      <div class="srv-banner" 
     style="background:var(--accent); width:10px; height:10px; border-radius:50%;">
</div>

      <div class="health-top">
        <span class="health-name">${s.name}</span>
        <span class="health-val">${s.bookings}</span>
      </div>

      <div class="health-bar-wrap">
        <div class="health-bar" style="width:${Math.min(100, s.bookings)}%;"></div>
      </div>

    </div>

  `).join('');
}


  const avatarColors = [
    ['rgba(91,110,248,.2)','var(--accent)'],
    ['rgba(0,229,180,.15)','var(--accent3)'],
    ['rgba(248,87,166,.15)','var(--accent2)'],
    ['rgba(251,191,36,.15)','#fbbf24'],
    ['rgba(167,139,250,.15)','#a78bfa'],
  ];

  let currentTab = 'services';
  let editServiceId = null;

  /* ── Counter animation ── */
  // document.querySelectorAll('.kpi-val[data-val]').forEach(el => {
  //   const t = +el.dataset.val;
  //   let c = 0;
  //   const iv = setInterval(() => { c = Math.min(c+1,t); el.textContent = c; if(c>=t) clearInterval(iv); }, 20);
  // });

  // earnings counter
  // const earnEl = document.getElementById('earnKpi');
  // let earnCur = 0; const earnTarget = 18000;
  // const earnIv = setInterval(() => {
  //   earnCur = Math.min(earnCur+400, earnTarget);
  //   earnEl.textContent = '₹' + earnCur.toLocaleString('en-IN');
  //   if (earnCur >= earnTarget) clearInterval(earnIv);
  // }, 20);

  /* ── Bar chart ── */
  async function loadWeeklyChart(){

  const token = localStorage.getItem("access")

  try{
    const res = await fetch("/api/bookings/weekly-earnings/", {
      headers:{
        "Authorization":"Bearer " + token
      }
    })

    const weekData = await res.json()

    console.log("Weekly Data:", weekData)

    renderChart(weekData)

  } catch(err){
    console.log(err)
  }
}


function renderChart(weekData){

  const maxV = Math.max(...weekData.map(w => w.v), 1)

  // 🔥 total calculate
  const total = weekData.reduce((sum, w) => sum + w.v, 0)

  document.getElementById('barChart').innerHTML = weekData.map(w => `
    <div class="bar-wrap">
      <div class="bar" 
        title="₹${w.v}"
        style="height:${Math.round((w.v/maxV)*120)}px;">
      </div>
      <div class="bar-lbl">${w.d}</div>
    </div>
  `).join('');

  // 🔥 update total
  document.getElementById("weeklyTotal").innerText =
    "₹" + total.toLocaleString("en-IN");
}





  /* ── Service health ── */
  // document.getElementById('healthList').innerHTML = services.slice(0,3).map(s => `
  //   <div class="health-item">
  //     <div class="health-top">
  //       <span class="health-name">${s.emoji} ${s.name}</span>
  //       <span class="health-val">${s.bookings}</span>
  //     </div>
  //     <div class="health-bar-wrap">
  //       <div class="health-bar" style="width:${Math.round((s.bookings/38)*100)}%;"></div>
  //     </div>
  //   </div>`).join('');

  /* ── Tab switch ── */
  function showTab(tab, btn) {

  document.querySelectorAll('.tab-btn')
    .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');
  currentTab = tab;

  document.getElementById('tabSearch').value = '';

  if(tab === 'services'){
    renderServices(services);
  } else {
    renderBookings(bookings);   // ✅ now bookings has real data
  }

}

  function switchToTab(tab, link) {
    document.querySelector('.tab-btn[id="tab' + cap(tab) + '"]')?.click();
    document.querySelector('.tabs-panel').scrollIntoView({ behavior: 'smooth' });
  }

  function handleSearch() {
    const q = document.getElementById('tabSearch').value.toLowerCase();
    if (currentTab === 'services') renderServices(services.filter(s => s.name.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q)));
    else renderBookings(bookings.filter(b => b.customer.toLowerCase().includes(q) || b.service.toLowerCase().includes(q)));
  }

  /* ── Render Services ── */
  function renderServices(data = services) {

  document.getElementById('tHead').innerHTML = `
    <th>Service</th><th>Category</th><th>Price</th><th>Duration</th><th>Bookings</th><th>Status</th><th>Actions</th>`;

  if (!data.length) { emptyState(7); return; }

  document.getElementById('tBody').innerHTML = data.map(s => `
    <tr>
      <td>
        <div class="service-cell">
          <div class="srv-icon">
  <img src="${s.image}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">
</div>
          <div>
            <div class="srv-name">${s.name}</div>
            <div class="srv-cat">${(s.desc || "").substring(0,30)}…</div>
          </div>
        </div>
      </td>
      <td style="color:var(--muted);">${s.cat}</td>
      <td style="font-weight:700;color:var(--accent3);">₹${s.price}</td>
      <td style="color:var(--muted);">${s.duration}</td>
      <td style="font-weight:600;">${s.bookings}</td>
      <td><span class="badge ${s.status}-s">${cap(s.status)}</span></td>
      <td>
        <button class="act act-edit" onclick="editService(${s.id})">
          <i class="fa fa-pen"></i>
        </button>
        <button class="act act-del" onclick="deleteService(${s.id})">
          <i class="fa fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

  /* ── Render Bookings ── */
  function renderBookings(data = bookings) {
    document.getElementById('tHead').innerHTML = `
      <th>Customer</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th>`;

    if (!data.length) { emptyState(6); return; }

    document.getElementById('tBody').innerHTML = data.map((b, i) => {
      const [bg, fg] = avatarColors[i % avatarColors.length];
      return `
      <tr>
        <td>
          <div class="cust-cell">
            <div class="c-av" style="background:${bg};color:${fg};">${b.customer[0]}</div>
            <div>
              <div style="font-weight:500;font-size:13.5px;">${b.customer}</div>
              <div style="font-size:11px;color:var(--muted);">${b.city}</div>
            </div>
          </div>
        </td>
        <td style="color:var(--muted);">${b.service}</td>
        <td style="color:var(--muted);font-size:13px;">${b.date}</td>
        <td style="font-family:'Syne',sans-serif;font-weight:700;">₹${b.amount}</td>
        <td><span class="badge ${b.status}">${cap(b.status)}</span></td>
        <td onclick="event.stopPropagation()">
          ${b.status === 'pending' ? `
            <button class="act act-accept" onclick="updateBooking(${b.id},'confirmed')"><i class="fa fa-check"></i> Accept</button>
            <button class="act act-reject" onclick="updateBooking(${b.id},'cancelled')"><i class="fa fa-xmark"></i> Reject</button>
          ` : `<span style="font-size:12px;color:var(--muted);">—</span>`}
        </td>
      </tr>`;
    }).join('');

    // update pending badge
    const pending = bookings.filter(b => b.status === 'pending').length;
    document.getElementById('pendingBadge').textContent = pending;
    document.getElementById('pendingCount').textContent  = pending;
  }

  async function updateBooking(id, status) {
    const token = localStorage.getItem("access");

    try {
      const res = await fetch(`/api/bookings/booking/update/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        bookings = bookings.map(b => b.id === id ? { ...b, status } : b);
        renderBookings(bookings);
        showToast(status === 'confirmed' ? '✅ Booking accepted!' : '❌ Booking rejected.', status === 'confirmed' ? 'success' : 'error');
      }
    } catch (err) {
      console.log("Error updating booking:", err);
      showToast('Error updating booking', 'error');
    }
  }






  function deleteService(id){

  if(!confirm("Delete this service?")) return

  fetch("/api/services/delete/" + id + "/",{
    method:"DELETE",
    headers:{
      "Authorization":"Bearer " + localStorage.getItem("access")
    }
  })
  .then(res=>res.json())
  .then(data=>{

    showToast("🗑️ Service deleted", "error")
    loadVendorServices()

  })
}


  /* ── Service Form Functions ── */
  function openServiceForm(){
    editServiceId = null;
    document.querySelector(".srv-modal-title").innerText = "New Service"
    document.getElementById('srvName').value = '';
    document.getElementById('srvCategory').value = '';
    document.getElementById('srvPrice').value = '';
    document.getElementById('srvTime').value = '';
    document.getElementById('srvDesc').value = '';
    document.getElementById('srvImage').value = '';
    document.getElementById('srvImgPreview').style.backgroundImage = '';
    document.getElementById('srvImgPreview').classList.remove('show');
    document.getElementById('srvUploadPlaceholder').style.display = 'flex';
    document.getElementById('srvUploadText').style.display = 'block';
    document.getElementById('srvUploadHint').style.display = 'block';
    document.querySelectorAll('.srv-cat-pill').forEach(p => p.classList.remove('active'));
    document.getElementById('srvOverlay').classList.add('open');
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

  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeServiceForm(); });





  /* ── Modal ── */
  function openServiceForm(){
    editServiceId = null;
    document.querySelector(".srv-modal-title").innerText = "New Service"
    document.getElementById('srvName').value = '';
    document.getElementById('srvCategory').value = '';
    document.getElementById('srvPrice').value = '';
    document.getElementById('srvTime').value = '';
    document.getElementById('srvDesc').value = '';
    document.getElementById('srvImage').value = '';
    document.getElementById('srvImgPreview').style.backgroundImage = '';
    document.getElementById('srvImgPreview').classList.remove('show');
    document.getElementById('srvUploadPlaceholder').style.display = 'flex';
    document.getElementById('srvUploadText').style.display = 'block';
    document.getElementById('srvUploadHint').style.display = 'block';
    document.querySelectorAll('.srv-cat-pill').forEach(p => p.classList.remove('active'));
    document.getElementById('srvOverlay').classList.add('open');
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

  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeServiceForm(); });








  function createService(){

    const formData = new FormData()

    formData.append("name", document.getElementById("srvName").value)
    formData.append("category", document.getElementById("srvCategory").value.toLowerCase())
    formData.append("price", document.getElementById("srvPrice").value)
    formData.append("time", document.getElementById("srvTime").value)
    formData.append("description", document.getElementById("srvDesc").value)

    const imageFile = document.getElementById("srvImage").files[0]

    if(imageFile){
      formData.append("image", imageFile)
    }

    let url = "/api/services/create/"
    let method = "POST"

    if(editServiceId){
      url = "/api/services/update/" + editServiceId + "/"
      method = "PUT"
    }

    fetch(url,{
      method: method,
      headers:{
        "Authorization":"Bearer " + localStorage.getItem("access")
      },
      body: formData
    })
    .then(res=>res.json())
    .then(data=>{

      console.log(data)

      showToast(editServiceId ? "✅ Service Updated" : "✅ Service Created", "success")

      editServiceId = null

      loadVendorServices()

      closeServiceForm()

    })
    .catch(err => {
      console.log(err)
      showToast("Error saving service", "error")
    })
  }




async function loadVendorBookings(){

  const token = localStorage.getItem("access")

  try{

    const res = await fetch("/api/bookings/vendor/", {   // 👈 vendor endpoint
      headers:{
        "Authorization":"Bearer " + token
      }
    })

    const data = await res.json()

    console.log("Vendor Bookings:", data)

    bookings = data.map(b => ({
      id: b.id,
      customer: b.customer_name,   // 👈 backend field check kar lena
      service: b.service_name,
      date: b.booking_date,
      amount: b.total_price,
      status: b.status,
      city: b.address || "—"
    }))

    renderBookings(bookings)   // ✅ yahi main fix hai

  }
  catch(err){
    console.log(err)
  }

}






  document.getElementById('srvOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeServiceForm();
  });

  function emptyState(cols) {
    document.getElementById('tBody').innerHTML = `
      <tr class="empty-row"><td colspan="${cols}">
        <i class="fa fa-box-open"></i>
        <p style="font-size:14px;">Nothing here yet.</p>
      </td></tr>`;
  }

  function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ── Init ── */
loadVendorServices();
loadVendorBookings(); 
loadStats();   // 🔥 ADD THIS
loadWeeklyChart(); 

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

  const user   = JSON.parse(localStorage.getItem("user"));
  const access = localStorage.getItem("access");

  console.log("Vendor User:", user);

  // ❌ Not logged in
  if (!user || !access) {
    localStorage.clear();
    window.location.href = "/api/users/login-page/";
    return;
  }

  // ❌ Wrong role (only vendor allowed)
  if (user.role !== "vendor") {
    window.location.href = "/api/users/dashboard-page/";
    return;
  }

  // ✅ Set Name
  document.getElementById("vendorName").innerText = user.name;
  document.getElementById("vendorRole").innerText = user.role;

  // ✅ Avatar
  document.getElementById("vendorAvatar").innerText =
    user.name.charAt(0).toUpperCase();

  // ✅ Welcome text
  document.getElementById("vendorWelcome").innerText =
    `Welcome back, ${user.name.split(" ")[0]} 👋`;

});