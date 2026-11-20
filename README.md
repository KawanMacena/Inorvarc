# Inovarc (Teste)

Sistema de gestão de problemas urbanos. O cidadão registra uma ocorrência. O administrador acompanha e atualiza o status no painel.

O site está em HTML, CSS e JavaScript, sem servidor próprio. O banco de dados e o login ficam no Supabase. O esquema do banco está em `supabase/migrations/` e segue o modelo entidade-relacionamento da equipe.

## GitHub

A branch `main` é a versão organizada do projeto, com as telas, os arquivos separados e o banco.

A branch `kawan` tem a tela de acesso refeita em um único conjunto de arquivos: `index.html`, `style2.css`, `script.js` e `logo-inovarc.png`. Nessa branch entraram duas telas que a `main` ainda não tinha: cadastro do cidadão e cadastro administrativo. Essas telas foram trazidas para a `main` e encaixadas na pasta do projeto.

A branch `ewerton` tem outra versão do front-end, com histórico separado da `main`. O que ela trouxe de novo foi a tela de gerenciamento de uma ocorrência (foto, localização, detalhes, notas internas, status e ações rápidas). Essa tela entrou na `main` em `paginas/gerenciar/index.html`, e o "Ver detalhes" do painel abre ela. As outras telas da `ewerton` (login, cadastro e painel) repetem o que a `main` já tem. Os arquivos `adminMock.js` e `usermock.js` não vieram, porque guardavam senha em texto puro no navegador. O login agora é feito pelo Supabase.

No vídeo, vale abrir o seletor de branches e mostrar essa diferença antes de entrar nas pastas.

## Como o repositório está organizado

```
index.html                      abre a tela de acesso
paginas/
  acesso/index.html             escolha, login, cadastros, Google e nova senha
  painel/index.html             painel de ocorrências (só administrador)
  gerenciar/index.html          detalhes de uma ocorrência (só administrador), vindo da ewerton
  home/index.html               tela inicial em desenvolvimento
  portal/index.html             outra versão da escolha, em desenvolvimento
  login/index.html              login separado, em desenvolvimento
  login/servicos.html           destino provisório desse login
assets/
  css/acesso.css                visual da tela de acesso, vindo da kawan
  css/painel.css                visual do painel
  css/gerenciamento.css         visual da tela de gerenciamento, vindo da ewerton
  img/                          logos e imagens
  js/supabase-config.js         URL do projeto e chave publicável do Supabase
  js/cliente-supabase.js        cria a conexão com o Supabase
  js/protecao-admin.js          tira da página quem não é administrador aprovado
  js/acesso.js                  navegação, login, cadastro e recuperação de senha
  js/gerenciar.js               ações da tela de gerenciamento
  js/login.js                   script antigo da tela de acesso
  js/logar.js                   script do login separado
supabase/migrations/            script do banco (tabelas, permissões, RLS e storage)
docs/modelo-er.png              modelo entidade-relacionamento
```

## Telas

A tela de acesso reúne cinco formulários:

- Login do cidadão, com e-mail e senha ou com Google.
- Login do administrador, com e-mail institucional e senha ou com Google.
- Cadastro do cidadão, com nome, e-mail e senha.
- Cadastro administrativo, com instituição, CNPJ, responsável, e-mail institucional e senha.
- Nova senha, que aparece quando a pessoa abre o link de recuperação enviado por e-mail.

O login do administrador era por CNPJ e passou a ser por e-mail. O CNPJ é um dado público e seria igual para todos os servidores de uma mesma prefeitura, então não serve para identificar quem está entrando. O CNPJ continua no cadastro administrativo e é conferido pelos dígitos verificadores.

O cadastro do cidadão não pede mais CPF e telefone. O modelo do banco não tem esses campos, e guardar CPF sem necessidade aumenta o risco em caso de vazamento (LGPD).

Depois do login, o administrador aprovado vai para o painel. O cidadão recebe o aviso de que o acompanhamento é pelo aplicativo. Quem fez o cadastro administrativo e ainda não foi aprovado recebe o aviso de que o cadastro aguarda aprovação.

O painel e a tela de gerenciamento só abrem para administrador aprovado. O "Sair" do painel encerra a sessão. Os totais, a tabela do painel e os dados da tela de gerenciamento ainda estão fixos no HTML. As notas internas ainda ficam no navegador. Esse é o próximo passo: ler e gravar esses dados no banco.

As telas `home`, `portal` e `login` ficaram guardadas porque ainda estão em desenvolvimento. O login separado em `paginas/login` entra com usuário `admin` e senha `123456`, que ficam visíveis no JavaScript. Ele não dá acesso a nenhum dado, mas deve ser apagado antes de o site ir ao ar.

## Banco de dados

O script `supabase/migrations/20261120000000_esquema_inicial.sql` cria o banco a partir do modelo entidade-relacionamento.

| Tabela | Campos principais |
|---|---|
| `usuario` | `id_usuario`, `nome`, `perfil` |
| `administrador` | `id_adm`, `nome`, `email`, `cnpj`, `instituicao`, `perfil`, `aprovado` |
| `categoria` | `id_categoria`, `nome`, `descricao` |
| `ocorrencia` | `id_ocorrencia`, `id_usuario`, `id_categoria`, `descricao`, `status_atual`, `data_registro` |
| `localizacao` | `id_localizacao`, `id_ocorrencia`, `endereco`, `latitude`, `longitude` |
| `imagem` | `id_imagem`, `id_ocorrencia`, `url` |
| `historico_status` | `id_historico`, `id_ocorrencia`, `id_adm`, `status_anterior`, `status_novo`, `data_alteracao` |
| `nota_ocorrencia` | `id_nota`, `id_ocorrencia`, `id_adm`, `conteudo`, `data_registro` |

Relacionamentos do modelo:

- `registra`: um usuário registra várias ocorrências.
- `classifica`: uma categoria classifica várias ocorrências.
- `possui` (imagem): uma ocorrência tem até 5 fotos.
- `registra` (localização): cada ocorrência tem uma localização.
- `gerencia`: uma ocorrência tem vários registros no histórico de status.
- `opera`: um administrador faz vários registros no histórico de status.
- `possui` (nota) e `faz`: uma ocorrência tem várias notas internas, e cada nota é de um administrador.

Diferenças em relação ao desenho:

- A senha não fica em `usuario` nem em `administrador`. Quem guarda a senha, já criptografada, é o Supabase Auth, na tabela `auth.users`. O e-mail do cidadão também fica lá.
- O administrador é um usuário com cadastro extra. `administrador.id_adm` é o mesmo id de `usuario`.
- `administrador` ganhou `instituicao`, que o formulário pede, e `aprovado`, que libera o acesso ao painel.
- `localizacao` ganhou `endereco`, `latitude` e `longitude`, que a tela de gerenciamento mostra.
- `imagem.url` guarda o caminho do arquivo no storage, no formato `{id_usuario}/{id_ocorrencia}/{arquivo}`. O bucket é privado, e a tela gera um link temporário para exibir a foto.
- Os status possíveis são `pendente`, `em_analise`, `em_andamento` e `concluido`.

A função `registrar_ocorrencia` grava a ocorrência e a localização de uma vez. É o caminho que o aplicativo do cidadão deve usar.

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Abra o SQL Editor, cole o conteúdo de `supabase/migrations/20261120000000_esquema_inicial.sql` e execute uma vez.
3. Em Project Settings > API, copie a Project URL e a chave publicável (`anon` ou `sb_publishable_...`) para `assets/js/supabase-config.js`. Nunca use a chave `service_role` ou `sb_secret_...` no site, porque ela ignora todas as regras de segurança.
4. Em Authentication > Sign In / Providers > Email, deixe Confirm email ligado. Em senha, coloque mínimo de 8 caracteres com letras e números.
5. Em Authentication > URL Configuration, coloque em Site URL o endereço onde o site roda (por exemplo `http://127.0.0.1:5500/paginas/acesso/index.html`). Em Redirect URLs, coloque só os endereços exatos da tela de acesso, sem `*`.
6. Rode o site por um servidor local, não abrindo o arquivo direto. Por exemplo: `npx http-server -p 5500` na pasta do projeto, ou a extensão Live Server.
7. Crie a conta do primeiro administrador pelo cadastro administrativo, confirme o e-mail e aprove no SQL Editor:

```sql
update public.administrador set aprovado = true where email = 'pessoa@prefeitura.gov.br';
```

### Login com Google

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto e configure a tela de consentimento OAuth (tipo externo, com nome do app e e-mail de suporte).
2. Em Credenciais, crie um ID do cliente OAuth do tipo Aplicativo da Web.
3. Em Origens JavaScript autorizadas, coloque o endereço do site (por exemplo `http://127.0.0.1:5500`).
4. Em URIs de redirecionamento autorizados, coloque `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
5. No Supabase, em Authentication > Sign In / Providers > Google, ative e cole o Client ID e o Client Secret. O Client Secret fica só no Supabase, nunca no código.

Quem entra com Google pela primeira vez vira cidadão. Um administrador aprovado pode usar o Google com o mesmo e-mail do cadastro, e o Supabase liga as duas formas de entrar à mesma conta.

## Segurança

O que o banco garante, mesmo que alguém altere o JavaScript no navegador:

- Todas as tabelas têm RLS. O cidadão só vê as próprias ocorrências, fotos, localização e histórico. Ele não vê notas internas.
- O cidadão não escolhe o status, a data nem o dono da ocorrência. Ele só envia categoria e descrição.
- Só administrador aprovado vê todas as ocorrências e muda status. Mesmo ele só altera o status, não a descrição do cidadão.
- Ninguém se torna administrador pelo site. O cadastro administrativo sempre nasce sem aprovação, e a aprovação é feita no SQL Editor.
- O histórico de status é gravado por trigger, com o administrador que fez a mudança. Ninguém insere, altera ou apaga histórico pelo site.
- As fotos ficam em bucket privado, só JPEG, PNG ou WebP, até 5 MB. Cada usuário só envia na própria pasta e para a própria ocorrência. Fotos não podem ser substituídas nem apagadas.
- Textos têm limite de tamanho, para evitar abuso.

O que o site faz:

- A biblioteca do Supabase vem do CDN com versão fixa e hash de integridade (SRI). Se o arquivo for alterado, o navegador não executa.
- As páginas têm Content-Security-Policy, que bloqueia scripts de outras origens.
- O login usa o fluxo PKCE.
- As mensagens de erro não dizem se um e-mail tem conta.
- O cliente recusa a chave secreta se ela for colada por engano em `supabase-config.js`.

Para revisar antes de publicar:

- Rodar o Security Advisor do Supabase (Advisors > Security) depois do script.
- Ativar CAPTCHA (Cloudflare Turnstile ou hCaptcha) no cadastro e no login, em Authentication > Attack Protection.
- Ativar a proteção contra senhas vazadas, se o plano permitir.
- Ativar MFA para os administradores.
- Toda tabela nova precisa de RLS ligado e de políticas próprias.
- Ao mostrar dados do banco nas telas, usar `textContent`, nunca `innerHTML`, para não abrir brecha de XSS.
- Apagar `paginas/login`, que tem senha fixa no JavaScript.
