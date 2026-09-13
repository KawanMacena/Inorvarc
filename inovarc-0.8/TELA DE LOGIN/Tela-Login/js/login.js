// // Usuário fictício
// const usuario = {
//     username: "admin",
//     senha: "123456",
//     nome: "Administrador"
// };

// document.getElementById("btnLogin").addEventListener("click", () => {
//     const usernameDigitado = document.getElementById("username").value;
//     const senhaDigitada = document.getElementById("password").value;

//     if (
//         usernameDigitado === usuario.username &&
//         senhaDigitada === usuario.senha
//     ) {
//         localStorage.setItem(
//             "usuarioLogado",
//             JSON.stringify(usuario)
//         );

//         window.location.href = "servicos.html";
//     } else {
//         alert("Usuário ou senha inválidos");
//     }
// });

function logar (){

    var login = document.getElementById("username").value;
    var senha = document.getElementById("password").value;

    if(login == "admin" && senha == "123456"){
    //  alert("sucesso");
     location.href = "servicos.html";
    }
    else{
    alert("usuário ou senha incorretos");
    }

    }



