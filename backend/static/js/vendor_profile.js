// ───────── LOGIN ─────────
function login(email, password){

fetch("/api/users/login/", {
  method:"POST",
  headers:{
    "Content-Type":"application/json"
  },
  body:JSON.stringify({
    email: email,
    password: password
  })
})
.then(res => res.json())
.then(data => {

  if(data.access){
    localStorage.setItem("access", data.access)
    localStorage.setItem("refresh", data.refresh)

    window.location.href="/api/users/vendor-page/"
  }else{
    alert("Invalid login")
  }

})
.catch(err => console.log(err))

}


// ───────── LOAD PROFILE ─────────
function loadProfile() {

  const token = localStorage.getItem("access")

  if(!token){
    window.location.href="/api/users/login-page/"
    return
  }

  fetch("/api/users/vendor-profiles/", {
    headers: {
      "Authorization": "Bearer " + token
    }
  })

  .then(res => {

    if(res.status === 401){
      localStorage.clear()
      window.location.href="/api/users/login-page/"
      return
    }

    return res.json()
  })

  .then(data => {

    if(!data) return






    // HERO
    document.getElementById("heroName").innerText = data.name || ""
    document.getElementById("heroCat").innerText = data.category || ""
    document.getElementById("heroCity").innerText = data.city || ""
    document.getElementById("heroAvatar").innerText =
      data.name ? data.name.charAt(0).toUpperCase() : "U"

    // SIDEBAR
    document.querySelector(".s-avatar").innerText =
      data.name ? data.name.charAt(0).toUpperCase() : "U"

    document.querySelector(".user-info .name").innerText = data.name || ""

    // INFO
    document.getElementById("infoName").innerText = data.name || ""
    document.getElementById("infoEmail").innerText = data.email || ""
    document.getElementById("infoPhone").innerText = data.phone || ""
    document.getElementById("infoCity").innerText = data.city || ""
    document.getElementById("infoExp").innerText = data.experience || ""
    document.getElementById("infoAbout").innerText = data.about || ""

    // EDIT MODAL
    document.getElementById("editName").value = data.name || ""
    document.getElementById("editPhone").value = data.phone || ""
    document.getElementById("editEmail").value = data.email || ""
    document.getElementById("editCity").value = data.city || ""
    document.getElementById("editExp").value = data.experience || ""
    document.getElementById("editCat").value = data.category || ""
    document.getElementById("editAbout").value = data.about || ""

  })

  .catch(err => {
    console.log(err)
    showToast("Failed to load profile","error")
  })
}


// ───────── SAVE PROFILE ─────────
function saveProfile(){

  const data = {
    name: document.getElementById("editName").value.trim(),
    phone: document.getElementById("editPhone").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    city: document.getElementById("editCity").value.trim(),
    experience: document.getElementById("editExp").value.trim(),
    category: document.getElementById("editCat").value.trim(),
    about: document.getElementById("editAbout").value.trim()
  }

  if(!data.name){
    showToast("Name required","error")
    return
  }

  fetch("/api/users/update-vendor-profile/", {
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer " + localStorage.getItem("access")
    },
    body:JSON.stringify(data)
  })

  .then(res => res.json())

  .then(response => {

      showToast("Profile updated successfully")

      loadProfile()

      closeEditModal()

  })

  .catch(err => {
      console.log(err)
      showToast("Update failed","error")
  })
}


// ───────── PAGE LOAD ─────────
window.addEventListener("DOMContentLoaded", function(){
    loadProfile()
    loadStats()
})


// ───────── RING ANIMATION ─────────
window.addEventListener('load', () => {

  const ring = document.getElementById('ringFg')

  if(!ring) return

  setTimeout(() => {

    const pct = 0.88
    const circumference = 2 * Math.PI * 54
    const offset = circumference * (1 - pct)

    ring.style.strokeDashoffset = offset

  }, 400)

})


// ───────── TOAST ─────────
function showToast(msg, type='success') {

  const t = document.getElementById('toast')

  if(!t) return

  t.textContent = '✓ ' + msg
  t.className = `toast ${type} show`

  setTimeout(() => {
    t.classList.remove('show')
  }, 3000)

}


// ───────── EDIT MODAL ─────────
function openEditModal() {
  document.getElementById('editOverlay').classList.add('open')
}

function closeEditModal() {
  document.getElementById('editOverlay').classList.remove('open')
}


// CLOSE MODAL CLICK OUTSIDE
const overlay = document.getElementById('editOverlay')

if(overlay){
overlay.addEventListener('click', function(e) {
  if (e.target === this) closeEditModal()
})
}


// ESC CLOSE
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeEditModal()
})


// ───────── LOGOUT ─────────
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

    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    localStorage.removeItem("user")

    window.location.href="/api/users/login-page/"

  })

  .catch(err => console.log(err))

}




function loadStats(){

fetch("/api/users/vendor-stats/",{
  headers:{
    "Authorization":"Bearer " + localStorage.getItem("access")
  }
})

.then(res=>res.json())

.then(data=>{

  document.getElementById("sTotalBook").innerText = data.total_bookings

  document.getElementById("sCompleted").innerText = data.completed

  document.getElementById("sEarnings").innerText =
      "₹" + data.earnings.toLocaleString()

  document.getElementById("sRating").innerText = data.rating

})

.catch(err=>console.log(err))

}