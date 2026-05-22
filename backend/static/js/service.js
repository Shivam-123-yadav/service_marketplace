// Show Services------------------------------------------------------------------------
  let services = [];
  let editServiceId = null; // ✅ ADD THIS LINE
  function loadServices(){

  fetch("/api/services/get-services/",{
    headers:{
      "Authorization":"Bearer " + localStorage.getItem("access")
    }
  })

  .then(res => res.json())
  .then(data => {

    console.log("Services:", data)

    services = data.map(s => ({
    id: s.id,
    name: s.name,
    cat: s.category,
    price: s.price,
    desc: s.description,
    image: "http://127.0.0.1:8000" + s.image,
    gradient: "linear-gradient(135deg,rgba(91,110,248,.3),rgba(0,229,180,.2))",
    rating: s.rating,
    reviews: s.reviews,
    time: s.time + " min",
    badge: s.badge
  }))

    renderGrid(services)

  })

}




function openServiceForm(){

  document.getElementById('srvOverlay').classList.add('open')

  document.querySelector(".srv-modal-title").innerText =
  editServiceId ? "Edit Service" : "New Service"

}
function closeServiceForm() {
  document.getElementById('srvOverlay').classList.remove('open');
}
function selectSrvCat(el, cat) {
  document.querySelectorAll('.srv-cat-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');

  document.getElementById('srvCategory').value = cat.toLowerCase();
}
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeServiceForm(); });



function previewSrvImage(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('srvImgPreview');
    preview.style.backgroundImage = `url(${e.target.result})`;
    preview.classList.add('show');

    // placeholder hide karo
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

  // placeholder wapas dikhao
  document.getElementById('srvUploadPlaceholder').style.display = 'flex';
  document.getElementById('srvUploadText').style.display = 'block';
  document.getElementById('srvUploadHint').style.display = 'block';
}

// Create Services-------------------------------------------------

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

    showToast(editServiceId ? "✅ Service Updated" : "✅ Service Created")

    editServiceId = null

    loadServices()

    closeServiceForm()

  })

}



//   Edit Services-----------------------------------------

function editService(id){

  const s = services.find(x => x.id === id)

  editServiceId = id

  document.getElementById("srvName").value = s.name
  document.getElementById("srvCategory").value = s.cat
  document.getElementById("srvPrice").value = s.price
  document.getElementById("srvTime").value = s.time.replace(" min","")
  document.getElementById("srvDesc").value = s.desc

  openServiceForm()

}


// Delet Services-----------------------


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

    console.log(data)

    showToast("🗑 Service Deleted")

    loadServices()

  })

}



  let activeCat = 'all';
  const wishlist = new Set();

  /* ── Category pills ── */
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCat = pill.dataset.cat;
      filterServices();
    });
  });

  /* ── Filter + sort ── */
  function filterServices() {
    const q    = document.getElementById('searchInput').value.toLowerCase();
    const sort = document.getElementById('sortSelect').value;

    let data = services.filter(s => {
      const matchCat  = activeCat === 'all' || s.cat === activeCat;
      const matchText = s.name.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q);
      return matchCat && matchText;
    });

    if (sort === 'price-asc')  data.sort((a,b) => a.price - b.price);
    if (sort === 'price-desc') data.sort((a,b) => b.price - a.price);
    if (sort === 'rating')     data.sort((a,b) => b.rating - a.rating);

    renderGrid(data);
  }

  /* ── Render ── */
  function renderGrid(data) {
    document.getElementById('resultsCount').innerHTML =
      `<span>${data.length}</span> service${data.length !== 1 ? 's' : ''} found`;

    if (!data.length) {
      document.getElementById('servicesGrid').innerHTML = `
        <div class="empty">
          <i class="fa fa-box-open"></i>
          <p>No services found. Try a different search.</p>
        </div>`;
      return;
    }

    document.getElementById('servicesGrid').innerHTML = data.map((s, i) => `
      <div class="srv-card" style="animation-delay:${i * 0.05}s;">

        <div class="wish-btn ${wishlist.has(s.id) ? 'active' : ''}"
          onclick="toggleWish(${s.id}, this)" title="Save">
          <i class="fa${wishlist.has(s.id) ? 's' : 'r'} fa-heart"></i>
        </div>

        <div class="srv-banner">
  <img src="${s.image}" style="width:100%;height:100%;object-fit:cover;">
</div>

        <div class="srv-body">
          <div class="srv-cat"><i class="fa fa-tag" style="font-size:10px;"></i> ${capitalize(s.cat)}</div>
          <h4>${s.name}</h4>
          <p>${s.desc}</p>

          <div class="srv-meta">
            <span class="stars">${'★'.repeat(Math.floor(s.rating))}${s.rating % 1 ? '½' : ''}</span>
            <span style="color:var(--text);font-weight:600;">${s.rating}</span>
            <span>(${s.reviews} reviews)</span>
            <span><i class="fa fa-clock"></i> ${s.time}</span>
          </div>

          <div class="srv-footer">

          <div class="srv-price">₹${s.price}</div>

          <button class="book-btn" onclick="editService(${s.id})">
            <i class="fa fa-pen"></i>
          </button>

          <button class="book-btn" onclick="deleteService(${s.id})">
            <i class="fa fa-trash"></i>
          </button>

        </div>
        </div>
      </div>`).join('');
  }

  function toggleWish(id, el) {
    if (wishlist.has(id)) {
      wishlist.delete(id); el.classList.remove('active');
      el.querySelector('i').className = 'far fa-heart';
    } else {
      wishlist.add(id); el.classList.add('active');
      el.querySelector('i').className = 'fas fa-heart';
      showToast('❤️ Saved to wishlist');
    }
  }

  function bookService(name) {
    showToast(`✅ "${name}" — booking started!`);
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast success show';
    setTimeout(() => t.classList.remove('show'), 2800);
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // Initial render
  renderGrid(services);



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

  if (userData) {

    const user = JSON.parse(userData);

    document.getElementById("userName").innerText = user.name || "User";
    document.getElementById("userRole").innerText = user.role || "User";

    document.querySelector(".avatar").innerText =
      user.name ? user.name.charAt(0).toUpperCase() : "U";

    // ⭐ services load
    loadServices()

  } else {

    window.location.href = "/api/users/login-page/";

  }

});