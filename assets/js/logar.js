function logar (){

    var login = document.getElementById("username").value;
    var senha = document.getElementById("password").value;

    if(login == "admin" && senha == "123456"){
     location.href = "servicos.html";
    }
    else{
    alert("usuário ou senha incorretos");
    }

}
