/* ───────── API CONFIG ───────── */

const API_BASE = "/api/users";


function getToken(){
  return localStorage.getItem("access");
}

async function apiRequest(url){
  try{
    const res = await fetch(API_BASE + url,{
      headers:{
        "Authorization":"Bearer " + getToken(),
        "Content-Type":"application/json"
      }
    });

    if(!res.ok){
      console.error("API ERROR:", res.status);
      return {};
    }

    return await res.json();

  }catch(err){
    console.error("Fetch Error:", err);
    return {};
  }
}


/* ───────── TAB STATE ───────── */

let currentTab = "users";




/* ───────── TAB SWITCH ───────── */

function showTab(tab, btn){

  document.querySelectorAll('.tabs button')
  .forEach(b => b.classList.remove('active'));

  btn.classList.add('active');

  currentTab = tab;

  document.getElementById("searchInput").value="";

  if(tab==="users") loadUsers();
  if(tab==="services") loadServices();
  if(tab==="bookings") loadBookings();

}


/* ───────── SEARCH ───────── */

function handleSearch(){

  const q = document.getElementById("searchInput")
  .value.toLowerCase();

  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach(row=>{
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(q) ? "" : "none";
  });

}


/* ───────── USERS API ───────── */

async function loadUsers(){

  const data = await apiRequest("/users/");

  document.getElementById("tableHead").innerHTML = `
  <th>User</th>
  <th>Role</th>
  <th>Joined</th>
  <th>Actions</th>
  `;

  if(!data.length){
    emptyState();
    return;
  }

  document.getElementById("tableBody").innerHTML = data.map((u,i)=>`

  <tr>

  <td>
    <div class="user-cell">

      <div class="u-avatar">
      ${u.name.charAt(0).toUpperCase()}
      </div>

      <div>
      <div class="u-name">${u.name}</div>
      <div class="u-email">${u.email}</div>
      </div>

    </div>
  </td>

  <td>
  <span class="role-badge ${u.role}">
  ${cap(u.role)}
  </span>
  </td>

  <td>${formatDate(u.created_at)}</td>

  <td>
    <div class="actions">

      <button class="act-btn act-view" onclick='viewUser(${JSON.stringify(u).replace(/'/g, "&apos;")})'>
      <i class="fa fa-eye"></i> View
      </button>

      <button class="act-btn act-delete"
      onclick="deleteUser(${u.id})">
      <i class="fa fa-trash"></i> Delete
      </button>

    </div>
  </td>

  </tr>

  `).join("");

}


async function deleteUser(id){

  if(!confirm("Delete user?")) return;

  await fetch(API_BASE + "/users/"+id+"/",{
    method:"DELETE",
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  loadUsers();
}



function viewUser(user){

  const modal = document.getElementById("addModal");
  const fields = document.getElementById("formFields");

  modal.style.display = "flex";

  document.getElementById("modalTitle").innerText = "User Details";

  fields.innerHTML = `
    <div class="view-box">
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${cap(user.role)}</p>
      <p><strong>Joined:</strong> ${formatDate(user.created_at)}</p>
    </div>
  `;

}

/* ───────── SERVICES API ───────── */

async function loadServices(){

  try{

    const res = await fetch("/api/services/get-services/",{
      headers:{
        "Authorization":"Bearer " + getToken()
      }
    });

    const data = await res.json();

    document.getElementById("tableHead").innerHTML = `
    <th>Service</th>
    <th>Vendor</th>
    <th>Category</th>
    <th>Price</th>
    <th>Status</th>
    <th>Actions</th>
    `;

    if(!data.length){
      emptyState();
      return;
    }

    document.getElementById("tableBody").innerHTML = data.map(s=>`

    <tr>

      <td>${s.name}</td>

      <td>${s.vendor_name || "-"}</td>

      <td>${s.category}</td>

      <td>₹${s.price}</td>

      <td>
      <span class="status-badge ${s.status || "pending"}">
      ${cap(s.status || "pending")}
      </span>
      </td>

      <td>

      <div class="actions">

      <button class="act-btn act-approve"
      onclick="approveService(${s.id})">
      <i class="fa fa-check"></i> Approve
      </button>

      <button class="act-btn act-reject"
      onclick="rejectService(${s.id})">
      <i class="fa fa-xmark"></i> Reject
      </button>

      </div>

      </td>

    </tr>

    `).join("");

  }catch(err){
    console.error("Services Load Error:", err);
    emptyState();
  }

}


async function approveService(id){

  await fetch("/api/services/"+id+"/approve/",{
    method:"PATCH",
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  loadServices();
}


async function rejectService(id){

  await fetch("/api/services/"+id+"/reject/",{
    method:"PATCH",
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  loadServices();
}

/* ───────── BOOKINGS API ───────── */

async function loadBookings(){

  const data = await apiRequest("/bookings/");
  bookings = data;

  document.getElementById("tableHead").innerHTML = `
  <th>Customer</th>
  <th>Service</th>
  <th>Date</th>
  <th>Amount</th>
  <th>Status</th>
  <th>Actions</th>
  `;

  if(!data.length){
    emptyState();
    return;
  }

  document.getElementById("tableBody").innerHTML = data.map(b=>`

  <tr>

  <td>${b.customer_name}</td>

  <td>${b.service_name}</td>

  <td>${formatDate(b.booking_date)}</td>

  <td>₹${b.total_price}</td>

  <td>
  <span class="status-badge ${b.status}">
  ${cap(b.status)}
  </span>
  </td>

  <td>

  <div class="actions">

  <button class="act-btn act-view"
  onclick="viewBooking(${b.id})">
  <i class="fa fa-eye"></i> View
</button>

  <button class="act-btn act-delete"
  onclick="deleteBooking(${b.id})">
  <i class="fa fa-trash"></i> Delete
  </button>

  </div>

  </td>

  </tr>

  `).join("");

}


function viewBooking(id) {
  console.log("View booking:", id);

  const booking = bookings.find(b => b.id == id);

  if (!booking) {
    alert("Booking not found");
    return;
  }

  const modal = document.getElementById("addModal");
  const fields = document.getElementById("formFields");

  modal.style.display = "flex";
  document.getElementById("modalTitle").innerText = "Booking Details";

  fields.innerHTML = `
    <div class="view-box">
      <p><strong>Booking ID:</strong> ${booking.id}</p>
      <p><strong>Customer:</strong> ${booking.customer_name || booking.customer}</p>
      <p><strong>Service:</strong> ${booking.service_name || booking.service}</p>
      <p><strong>Date:</strong> ${formatDate(booking.booking_date || booking.date)}</p>
      <p><strong>Amount:</strong> ₹${booking.total_price || booking.amount}</p>
      <p><strong>Status:</strong> ${cap(booking.status)}</p>
    </div>
  `;
}











async function deleteBooking(id){

  if(!confirm("Delete booking?")) return;

  await fetch(API_BASE + "/bookings/"+id+"/",{
    method:"DELETE",
    headers:{
      "Authorization":"Bearer " + getToken()
    }
  });

  loadBookings();
}


/* ───────── HELPERS ───────── */

function emptyState(){

  document.getElementById("tableBody").innerHTML=`

  <tr>

  <td colspan="6">

  <div class="empty-state">

  <i class="fa fa-box-open"></i>
  <p>No records found</p>

  </div>

  </td>

  </tr>

  `;

}


function cap(s){
  return s.charAt(0).toUpperCase() + s.slice(1);
}


function formatDate(d){
  return new Date(d).toLocaleDateString();
}


/* ───────── AUTH CHECK ───────── */

document.addEventListener("DOMContentLoaded",function(){

  const userData = localStorage.getItem("user");

  if(userData){

    const user = JSON.parse(userData);

    document.getElementById("userName").innerText =
    user.name || "User";

    document.getElementById("userRole").innerText =
    user.role || "User";

    document.querySelector(".avatar").innerText =
    user.name ? user.name.charAt(0).toUpperCase() : "U";

  }else{

    window.location.href="/api/users/login-page/";

  }

  loadUsers();
  loadStats(); // 🔥 IMPORTANT

});


/* ───────── LOGOUT ───────── */

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

  .then(res=>res.json())
  .then(data=>{

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");

    window.location.href="/api/users/login-page/";

  });

}


function openAddModal() {
  const modal = document.getElementById("addModal");
  modal.style.display = "flex";

  if (currentTab === "users") {
    document.getElementById("modalTitle").innerText = "Add User";

    document.getElementById("formFields").innerHTML = `
      <div class="add-field">
        <label class="add-label"><i class="fa fa-user"></i> Full Name</label>
        <input type="text" id="name" placeholder="e.g. Rahul Sharma" required>
      </div>

      <div class="add-field">
        <label class="add-label"><i class="fa fa-envelope"></i> Email</label>
        <input type="email" id="email" placeholder="rahul@example.com" required>
      </div>

      <div class="add-field">
        <label class="add-label"><i class="fa fa-shield-halved"></i> Role</label>
        <select id="role">
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="add-field">
        <label class="add-label"><i class="fa fa-lock"></i> Password</label>
        <div class="add-pwd-wrap">
          <input type="password" id="password" placeholder="Min. 8 characters" required>
          <button type="button" class="add-pwd-toggle" onclick="togglePwd()">
            <i class="fa fa-eye" id="pwdIcon"></i>
          </button>
        </div>
      </div>

      <div class="add-divider"></div>
    `;
    // openAddModal() ke andar, innerHTML set hone ke baad
document.querySelectorAll('#formFields input').forEach(inp => {
  inp.addEventListener('input', () => inp.classList.remove('error'));
});

  }
}

function closeAddModal() {
  document.getElementById('addModal').style.display = 'none';
}
function togglePwd() {
  const inp = document.getElementById('password');
  const icon = document.getElementById('pwdIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.className = 'fa fa-eye-slash';
  } else {
    inp.type = 'password';
    icon.className = 'fa fa-eye';
  }
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeAddModal(); });


// ✅ Yeh DAALO
async function submitAddForm() {
  const btn = document.querySelector('.add-btn-submit');
  btn.classList.add('loading');

  if (currentTab === "users") {
    const name     = document.getElementById("name")?.value?.trim();
    const email    = document.getElementById("email")?.value?.trim();
    const role     = document.getElementById("role")?.value;
    const password = document.getElementById("password")?.value;

    // Basic validation
    if (!name || !email || !password) {
      ['name','email','password'].forEach(id => {
        const el = document.getElementById(id);
        if (el && !el.value.trim()) el.classList.add('error');
      });
      btn.classList.remove('loading');
      return;
    }

    const res = await fetch("/api/users/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, password })
    });

    btn.classList.remove('loading');

    if (res.ok) {
      closeAddModal();
      loadUsers();
    } else {
      const err = await res.json();
      console.error("Register Error:", err);
      alert(JSON.stringify(err));
    }
  }
}


// Count Dashboard Number


async function loadStats(){

  try{
    const data = await apiRequest("/stats/");

    console.log("STATS DATA 👉", data);

    // 🔥 Safe values (NaN fix)
    animateValue("totalUsers", Number(data?.users) || 0);
    animateValue("totalServices", Number(data?.services) || 0);
    animateValue("totalBookings", Number(data?.bookings) || 0);
    animateValue("totalPending", Number(data?.pending) || 0);

  }catch(err){
    console.error("Stats Load Error:", err);

    // fallback (sab 0 dikhe)
    animateValue("totalUsers", 0);
    animateValue("totalServices", 0);
    animateValue("totalBookings", 0);
    animateValue("totalPending", 0);
  }

}


function animateValue(id, target){

  const el = document.getElementById(id);

  // 🔥 extra safety
  target = Number(target) || 0;

  let count = 0;

  // minimum step 1 (important)
  const step = Math.max(1, Math.ceil(target / 20));

  const interval = setInterval(() => {

    count += step;

    if(count >= target){
      el.innerText = target;
      clearInterval(interval);
    } else {
      el.innerText = count;
    }

  }, 40);

}

