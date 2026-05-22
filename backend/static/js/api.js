const API_URL = "http://127.0.0.1:8000/api";

function getToken(){
    return localStorage.getItem("token");
}

async function apiRequest(endpoint, method="GET", data=null){

    const res = await fetch(API_URL + endpoint,{
        method: method,
        headers:{
            "Content-Type":"application/json",
            "Authorization":"Bearer " + getToken()
        },
        body: data ? JSON.stringify(data) : null
    });

    return res.json();
}