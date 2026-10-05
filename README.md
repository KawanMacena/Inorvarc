# Inovarc (Teste)

Sistema de gestão de problemas urbanos. O cidadão registra uma ocorrência. O administrador acompanha e atualiza o status no painel.

O site está em HTML, CSS e JavaScript. Ainda não há servidor nem banco. O modelo conceitual do banco já está desenhado e fica em `docs/modelo-er.png`.

## O que mostrar no GitHub

A branch `main` é a versão organizada do projeto, com as telas, os arquivos separados e o modelo do banco.

A branch `kawan` tem a tela de acesso refeita em um único conjunto de arquivos: `index.html`, `style2.css`, `script.js` e `logo-inovarc.png`. Nessa branch entraram duas telas que a `main` ainda não tinha: cadastro do cidadão e cadastro administrativo.

Essas telas da `kawan` foram trazidas para a `main` e encaixadas na pasta do projeto. O painel, as telas em desenvolvimento e o modelo do banco continuam na `main`.

No vídeo, vale abrir o seletor de branches e mostrar essa diferença antes de entrar nas pastas.

## Como o repositório está organizado

```
index.html                      abre a tela de acesso
paginas/
  acesso/index.html             escolha, login e cadastros
  painel/index.html             painel de ocorrências
  home/index.html               tela inicial em desenvolvimento
  portal/index.html             outra versão da escolha, em desenvolvimento
  login/index.html              login separado, em desenvolvimento
  login/servicos.html           destino provisório desse login
assets/
  css/acesso.css                visual da tela de acesso, vindo da kawan
  css/painel.css                visual do painel
  img/logo-inovarc.png          logo usado na tela de acesso
  js/acesso.js                  navegação e validação da tela de acesso
  js/login.js                   script antigo da tela de acesso
  js/logar.js                   script do login separado
docs/modelo-er.png              modelo entidade-relacionamento
```

Abra `index.html` no navegador. Ele leva para `paginas/acesso/index.html`.

## Telas que entraram da branch kawan

A tela de acesso deixou de ser só dois cards com login. Agora o mesmo arquivo reúne quatro formulários:

- Login do cidadão, com e-mail e senha.
- Login do administrador, com CNPJ e senha.
- Cadastro do cidadão, com nome, e-mail, CPF, telefone e senha.
- Cadastro administrativo, com instituição, CNPJ, responsável, e-mail institucional e senha.

O botão Cadastre-se abre o formulário correspondente. Voltar, no cadastro, retorna ao login. Voltar, no login, retorna aos cards. A recuperação de senha avisa que ainda depende de servidor.

A adaptação feita na `main`: o login do administrador, com os campos preenchidos, abre `paginas/painel/index.html`. O login do cidadão avisa que o acompanhamento é pelo aplicativo, porque essa página web ainda não existe. No cadastro, as senhas são conferidas. Se forem diferentes, a conta não segue. Se forem iguais, a tela avisa que a conta só será criada quando houver servidor.

A home em desenvolvimento aponta para essa tela de acesso. Antes os cards dela iam para `cadastro.html`, um arquivo que não existia.

## O que já existia na main

- O painel administrativo, com totais por status e a tabela de ocorrências. Busca, filtro e linhas ainda estão fixos no HTML. Ver detalhes ainda não abre outra página. Voltar retorna à tela de acesso.
- As telas `home`, `portal` e `login`, guardadas porque ainda estão em desenvolvimento.
- O login separado em `paginas/login`, que entra com usuário `admin` e senha `123456` e abre `servicos.html`. Essa senha está no JavaScript só para testar a navegação.
- O modelo do banco em `docs/modelo-er.png`.

`assets/js/login.js` ficou no repositório como o script anterior da tela de acesso. A página de acesso agora usa `assets/js/acesso.js`.

## Banco de dados que será implementado

O desenho está em `docs/modelo-er.png`. A cardinalidade ao lado de cada entidade diz quantas vezes ela participa do relacionamento.

Entidades:

- **USUARIO**: `id_usuario`, `Nome`, `CPF`, `senha` e `perfil`. Se especializa em pessoa física e pessoa jurídica.
- **OCORRENCIA**: `id_ocorrencia`, `descricao`, `localizacao`, `data_registro` e `Foto`. O status é um atributo composto, com `id_status`, `descrição` e `nome`.
- **CATEGORIA**: `id_categoria`, `nome` e `descricao`.
- **IMAGEM**: `id_imagem` e `url`.
- **GERENCIADOR DE OCORRENCIAS**: o sistema, com `id_gerenciador`, `nome do sistema` e `versao`.
- **ADMINISTRADOR**: `id_adm`, `email`, `senha` e `cargo`.

Relacionamentos do desenho:

- `registra`: usuário (1,1) e ocorrência (1,n). Também tem o atributo `problemas urbanos diversos`.
- `classifica`: ocorrência (1,1) e categoria (1,1).
- `possui`: ocorrência (1,n) e imagem (1,1).
- `gerencia`: ocorrência (1,1) e gerenciador (1,n).
- `opera`: gerenciador (1,1) e administrador (1,n).

Na implementação, cada entidade vira tabela. `status` vira tabela própria, porque tem identificador e se repete em várias ocorrências. A foto fica em `imagem`, para não guardar o mesmo arquivo também dentro da ocorrência.

Ligação com as telas:

| Tela | Dado do modelo |
|---|---|
| Cadastro e login do cidadão | `usuario` |
| Cadastro e login do administrador | `administrador` |
| Cards e tabela do painel | `ocorrencia`, `categoria` e `status` |
| Foto do relato | `imagem` |

Antes de escrever o script do banco, confirmar duas cardinalidades do desenho. No uso do sistema, um cidadão registra várias ocorrências e uma categoria serve para várias ocorrências. No desenho, `registra` e `classifica` estão mais restritos do que isso. A tela pede CNPJ no cadastro administrativo, e o modelo do administrador tem e-mail, senha e cargo. O CNPJ ainda não está na entidade.

## Roteiro curto para o vídeo

1. Mostrar o repositório e as branches `main` e `kawan`.
2. Explicar que a `kawan` trouxe a tela de acesso refeita e os dois cadastros, e que isso foi encaixado na `main`.
3. Abrir as pastas `paginas`, `assets` e `docs`.
4. No navegador, mostrar a escolha, o login, o cadastro e a entrada no painel pelo administrador.
5. Abrir `docs/modelo-er.png` e nomear as entidades e o que cada tela vai gravar quando o banco existir.
