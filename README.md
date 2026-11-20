# Inovarc

Sistema de gestão de problemas urbanos. O cidadão registra uma ocorrência e o administrador acompanha e atualiza o status no painel.

O site é feito em HTML, CSS e JavaScript. O banco de dados e o login ficam no Supabase.

## Branches

- `main`: versão organizada do projeto. As telas antigas `home`, `portal` e `login` (que tinha a senha `admin` / `123456` no JavaScript) foram removidas, porque nenhuma outra tela abria elas.
- `kawan`: tela de acesso refeita, com os cadastros de cidadão e de administrador. Já foi trazida para a `main`.
- `ewerton`: outra versão do front-end, com histórico separado. A novidade dela era a tela de gerenciamento de uma ocorrência, que entrou na `main` em `paginas/gerenciar`. As telas de login e cadastro dela repetiam as que já tínhamos, e os arquivos `adminMock.js` e `usermock.js` não vieram porque guardavam senha em texto puro.

## Estrutura

```
index.html                  abre a tela de acesso
paginas/
  acesso/                   login, cadastros, Google e nova senha
  painel/                   painel de ocorrências (só administrador)
  gerenciar/                detalhes de uma ocorrência (só administrador)
assets/
  css/                      estilos de cada tela
  img/                      logos e imagens
  js/                       scripts de cada tela e a conexão com o Supabase
supabase/migrations/        script que cria o banco
docs/modelo-er.png          modelo entidade-relacionamento
```

## Como rodar

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, cole o conteúdo de `supabase/migrations/20261120000000_esquema_inicial.sql` e execute.
3. Em Project Settings > API, copie a URL e a chave publicável para `assets/js/supabase-config.js`. Não use a chave `service_role` nem `sb_secret_...`: ela ignora todas as regras de segurança.
4. Em Authentication > Providers > Email, deixe a confirmação de e-mail ligada.
5. Em Authentication > URL Configuration, coloque o endereço da tela de acesso em Site URL e em Redirect URLs (por exemplo `http://127.0.0.1:5500/paginas/acesso/index.html`), sem usar `*`.
6. Abra o site por um servidor local, e não clicando no arquivo. Por exemplo, na pasta do projeto: `npx http-server -p 5500`.
7. Faça o cadastro administrativo na tela, confirme o e-mail e aprove o administrador no SQL Editor:

```sql
update public.administrador set aprovado = true where email = 'pessoa@prefeitura.gov.br';
```

### Login com Google

1. No [Google Cloud Console](https://console.cloud.google.com), crie um projeto e configure a tela de consentimento OAuth.
2. Em Credenciais, crie um ID de cliente OAuth do tipo "Aplicativo da Web".
3. Em origens JavaScript autorizadas, coloque o endereço do site (por exemplo `http://127.0.0.1:5500`).
4. Em URIs de redirecionamento autorizados, coloque `https://SEU-PROJETO.supabase.co/auth/v1/callback`.
5. No Supabase, em Authentication > Providers > Google, ative e cole o Client ID e o Client Secret. O Client Secret fica só no Supabase, nunca no código.

## Banco de dados

O script cria uma tabela para cada entidade do modelo entidade-relacionamento.

| Tabela | O que guarda |
|---|---|
| `usuario` | nome e perfil de quem tem conta |
| `administrador` | e-mail, CNPJ, instituição e se o cadastro foi aprovado |
| `categoria` | tipos de problema (buraco, iluminação, lixo...) |
| `ocorrencia` | descrição, categoria, status e data de cada relato |
| `localizacao` | endereço, latitude e longitude da ocorrência |
| `imagem` | caminho das fotos (até 5 por ocorrência) |
| `historico_status` | cada mudança de status e quem fez |
| `nota_ocorrencia` | notas internas dos administradores |

Diferenças em relação ao desenho:

- A senha não fica nas nossas tabelas. O Supabase Auth guarda ela já criptografada, junto com o e-mail do cidadão.
- O administrador é um usuário com um cadastro a mais. Os dois usam o mesmo id.
- `administrador` ganhou `instituicao`, `cnpj` e `aprovado`. `localizacao` ganhou `endereco`, `latitude` e `longitude`.
- Os status são `pendente`, `em_analise`, `em_andamento` e `concluido`.

Para o aplicativo registrar um relato, use a função `registrar_ocorrencia`, que grava a ocorrência e a localização juntas.

## Segurança

O que o banco garante, mesmo que alguém mexa no JavaScript do navegador:

- Todas as tabelas têm RLS. O cidadão só vê as próprias ocorrências, fotos e histórico, e nunca as notas internas.
- O cidadão só envia categoria e descrição. Status, data e dono da ocorrência são definidos pelo banco.
- Só administrador aprovado vê todas as ocorrências e muda o status.
- Ninguém vira administrador pelo site. A aprovação é feita por nós, no SQL Editor.
- O histórico de status é gravado automaticamente e não pode ser alterado nem apagado pelo site.
- As fotos ficam em um bucket privado. Só aceita JPEG, PNG e WebP de até 5 MB, e cada pessoa só envia para a própria pasta.

O que o site faz:

- A biblioteca do Supabase é carregada com versão fixa e hash de integridade. Se o arquivo mudar, o navegador não executa.
- As páginas têm Content-Security-Policy, que bloqueia scripts de outras origens.
- As mensagens de erro do login não dizem se um e-mail tem conta.
- O código recusa a chave secreta se ela for colada em `supabase-config.js` por engano.

Antes de publicar:

- Rodar o Security Advisor do Supabase (Advisors > Security).
- Ligar o CAPTCHA no login e no cadastro (Authentication > Attack Protection).
- Ligar a proteção contra senhas vazadas e exigir MFA dos administradores.
- Toda tabela nova precisa de RLS ligado e de políticas.
- Ao mostrar dados do banco na tela, usar `textContent` e não `innerHTML`.

## O que falta

- Ligar o painel e a tela de gerenciamento ao banco. Hoje os totais, a tabela e os detalhes ainda são texto fixo no HTML, e as notas internas ficam no navegador.
- Trocar `docs/modelo-er.png` pelo DER novo.
