/* ═══════════════════════════════
AUTH CHECK
═══════════════════════════════ */

let user = null;

document.addEventListener("DOMContentLoaded", function () {

const storedUser = localStorage.getItem("user");
const access = localStorage.getItem("access");

if (!storedUser || !access) {
localStorage.clear();
window.location.href = "/api/users/login-page/";
return;
}

user = JSON.parse(storedUser);

if (user.role !== "customer") {
window.location.href = "/api/users/dashboard-page/";
return;
}

document.getElementById("welcomeMsg").textContent =
`Welcome back, ${user.name.split(" ")[0]} 👋`;

document.getElementById("sidebarName").textContent = user.name;

document.getElementById("sidebarAvatar").textContent =
user.name.charAt(0).toUpperCase();

loadServices();   // ✅ correct
loadBookings();

});

/* ═══════════════════════════════
DEMO SERVICES
═══════════════════════════════ */

const services = [];





async function loadServices(){

  const token = localStorage.getItem("access")

  try{

    const res = await fetch("/api/services/get-services/",{
      headers:{
        "Authorization":"Bearer " + token
      }
    })

    const data = await res.json()

    services.length = 0

    data.forEach(s => {

      services.push({
        id: s.id,
        name: s.name,
        cat: s.category,
        price: s.price,
        image: "http://127.0.0.1:8000" + s.image,
      })

    })

    renderServices()   // ✅ correct

  }
  catch(err){
    console.log(err)
  }

}





async function loadBookings(){

  const token = localStorage.getItem("access")

  try{

    const res = await fetch("/api/bookings/my/",{
      headers:{
        "Authorization":"Bearer " + token
      }
    })

    const data = await res.json()

    console.log("Bookings API:", data); // ✅ yaha lagao

    myBookings = data.map(b => ({
      id: b.id,
      service: b.service_name,
      date: b.booking_date,
      amount: b.total_price,
      status: b.status
    }));

    renderBookings();
    updateKpis();

  }
  catch(err){
    console.log(err)
  }

}
















let myBookings = [];

let activeCat = "all";
let activeFilter = "all";
let bookingService = null;

/* ═══════════════════════════════
RENDER SERVICES
═══════════════════════════════ */

function renderServices(){

const data = activeCat === "all"
? services
: services.filter(s => s.cat === activeCat);

document.getElementById("srvGrid").innerHTML = data.map((s)=>`

 <div class="srv-mini">

  <div class="srv-mini-banner">
  <img src="${s.image}" alt="${s.name}">
</div>

  <div class="srv-mini-body">

   <div class="srv-mini-name">${s.name}</div>

   <div class="srv-mini-price">₹${s.price}</div>

   <button onclick="openBookingModal(${s.id})" class="srv-mini-btn">
    Book Now
   </button>

  </div>

 </div>

`).join("");

}

/* ═══════════════════════════════
RENDER BOOKINGS
═══════════════════════════════ */

function renderBookings(){

const data = activeFilter === "all"
? myBookings
: myBookings.filter(b => b.status === activeFilter);

if(!data.length){

document.getElementById("bookingTable").innerHTML = `

  <tr>
   <td colspan="5" style="text-align:center;padding:50px">
   No bookings found
   </td>
  </tr>
  `;

return;
}

document.getElementById("bookingTable").innerHTML = data.map(b=>`

 <tr>

  <td>${b.service}</td>

  <td>${b.date}</td>

  <td>₹${b.amount}</td>

  <td>${cap(b.status)}</td>

  <td>  

${
b.status==="pending"
? `<button onclick="cancelBooking(${b.id})">Cancel</button>`
: "-"
}

  </td>

 </tr>

`).join("");

}




function updateKpis(){

  const total = myBookings.length;

  const completed = myBookings.filter(
  b => b.status.toLowerCase() === "completed"
).length;

  const pending = myBookings.filter(b => b.status === "pending").length;

  const totalSpent = myBookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + Number(b.amount), 0);

  // animate numbers
  animateValue(document.querySelectorAll(".kpi-val")[0], total);
  animateValue(document.querySelectorAll(".kpi-val")[1], completed);
  animateValue(document.querySelectorAll(".kpi-val")[2], pending);
  animateMoney(document.getElementById("spentKpi"), totalSpent);

  // money (no animation ya alag)
  document.getElementById("spentKpi").innerText =
  "₹" + totalSpent.toLocaleString("en-IN");

}





/* ═══════════════════════════════
CATEGORY FILTER CLICK
═══════════════════════════════ */

document.querySelectorAll(".cat-pill").forEach(pill => {

  pill.addEventListener("click", function(){

    // remove active class from all
    document.querySelectorAll(".cat-pill")
      .forEach(p => p.classList.remove("active"));

    // add active class to clicked
    this.classList.add("active");

    // set active category
    activeCat = this.getAttribute("data-cat");

    // re-render services
    renderServices();

  });

});



/* ═══════════════════════════════
BOOKING FILTER SWITCH
═══════════════════════════════ */

function switchFilter(status, el = null){

  // set filter
  activeFilter = status;

  // update UI (buttons highlight)
  document.querySelectorAll(".ftab")
    .forEach(btn => btn.classList.remove("active"));

  // agar element mila (table buttons se)
  if(el){
    el.classList.add("active");
  }
  else{
    // Quick Action se call hua → correct button auto find karo
    const btn = document.querySelector(`.ftab[data-status="${status}"]`);
    if(btn) btn.classList.add("active");
  }

  // render bookings
  renderBookings();

  // optional: scroll to bookings section
  document.querySelector(".table-wrap")
    ?.scrollIntoView({ behavior: "smooth" });
}





function scrollToServices(){
  document.getElementById("servicesSection")
    ?.scrollIntoView({ behavior: "smooth" });
}





function animateValue(el, end){

  let start = 0;
  const duration = 800;
  const stepTime = Math.abs(Math.floor(duration / (end || 1)));

  const timer = setInterval(() => {
    start++;
    el.innerText = start;

    if(start >= end){
      clearInterval(timer);
      el.innerText = end;
    }

  }, stepTime);

}



function animateMoney(el, end){
  let start = 0;

  const timer = setInterval(()=>{
    start += Math.ceil(end / 20);
    if(start >= end){
      start = end;
      clearInterval(timer);
    }
    el.innerText = "₹" + start.toLocaleString("en-IN");
  }, 40);
}




/* ═══════════════════════════════
BOOK SERVICE
═══════════════════════════════ */

function openBookingModal(id){

bookingService = services.find(s => s.id === id);

document.getElementById("modalOverlay").classList.add("open");

}

async function confirmBooking(){

  const date = document.getElementById("bookDate").value;
  const time = document.getElementById("bookTime").value;   // ✅ ADD
  const address = document.getElementById("bookAddress").value; // ✅ ADD

  const token = localStorage.getItem("access")

  try{

    const res = await fetch("/api/bookings/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        service: bookingService.id,
        booking_date: date,
        booking_time: time,
        address: address
      })
    })

    const data = await res.json()

    if (!res.ok) {
      console.error("Booking create failed:", data)
      showToast(data.error || 'Booking failed. Please check your inputs.', 'error')
      return
    }

    loadBookings()
    closeModal()

    showToast("Booking confirmed","success")

  }
  catch(err){
    console.log(err)
    showToast('Server error while booking. Please try again.', 'error')
  }

}




async function cancelBooking(id){

const token = localStorage.getItem("access")

await fetch(`/api/bookings/cancel/${id}/`,{

method:"POST",

headers:{
"Authorization":"Bearer " + token
}

})

loadBookings()

showToast("Booking cancelled","error")

}



function closeModal(){

document.getElementById("modalOverlay")
.classList.remove("open");

}

/* ═══════════════════════════════
LOGOUT
═══════════════════════════════ */

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

.then(()=>{

localStorage.clear();

window.location.href="/api/users/login-page/";

});

}

/* ═══════════════════════════════
TOAST
═══════════════════════════════ */

function showToast(msg,type="info"){

const t = document.getElementById("toast");

t.textContent = msg;

t.className = `toast ${type} show`;

setTimeout(()=>t.classList.remove("show"),3000);

}

function cap(s){
return s.charAt(0).toUpperCase() + s.slice(1);
}
