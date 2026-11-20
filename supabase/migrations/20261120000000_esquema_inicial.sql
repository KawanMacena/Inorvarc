
create type public.status_ocorrencia as enum ('pendente', 'em_analise', 'em_andamento', 'concluido');


create table public.usuario (
    id_usuario uuid primary key references auth.users (id) on delete cascade,
    nome text not null check (char_length(nome) between 2 and 120),
    perfil text not null default 'cidadao' check (perfil in ('cidadao', 'administrador')),
    criado_em timestamptz not null default now()
);

create table public.administrador (
    id_adm uuid primary key references public.usuario (id_usuario) on delete cascade,
    nome text not null check (char_length(nome) between 2 and 120),
    email text not null check (char_length(email) <= 254),
    cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
    instituicao text not null check (char_length(instituicao) between 2 and 150),
    perfil text not null default 'gestor' check (char_length(perfil) between 2 and 50),
    aprovado boolean not null default false,
    criado_em timestamptz not null default now()
);

create table public.categoria (
    id_categoria smallint generated always as identity primary key,
    nome text not null unique check (char_length(nome) between 2 and 60),
    descricao text check (char_length(descricao) <= 300)
);

create table public.ocorrencia (
    id_ocorrencia bigint generated always as identity primary key,
    id_usuario uuid default auth.uid() references public.usuario (id_usuario) on delete set null,
    id_categoria smallint not null references public.categoria (id_categoria),
    descricao text not null check (char_length(btrim(descricao)) between 5 and 2000),
    status_atual public.status_ocorrencia not null default 'pendente',
    data_registro timestamptz not null default now()
);

create table public.localizacao (
    id_localizacao bigint generated always as identity primary key,
    id_ocorrencia bigint not null unique references public.ocorrencia (id_ocorrencia) on delete cascade,
    endereco text check (char_length(endereco) <= 300),
    latitude numeric(9, 6) check (latitude between -90 and 90),
    longitude numeric(9, 6) check (longitude between -180 and 180),
    check (endereco is not null or (latitude is not null and longitude is not null)),
    check ((latitude is null) = (longitude is null))
);

create table public.imagem (
    id_imagem bigint generated always as identity primary key,
    id_ocorrencia bigint not null references public.ocorrencia (id_ocorrencia) on delete cascade,
    url text not null unique check (char_length(url) <= 300),
    criado_em timestamptz not null default now()
);

create table public.historico_status (
    id_historico bigint generated always as identity primary key,
    id_ocorrencia bigint not null references public.ocorrencia (id_ocorrencia) on delete cascade,
    id_adm uuid references public.administrador (id_adm) on delete set null,
    status_anterior public.status_ocorrencia,
    status_novo public.status_ocorrencia not null,
    data_alteracao timestamptz not null default now()
);

create table public.nota_ocorrencia (
    id_nota bigint generated always as identity primary key,
    id_ocorrencia bigint not null references public.ocorrencia (id_ocorrencia) on delete cascade,
    id_adm uuid default auth.uid() references public.administrador (id_adm) on delete set null,
    conteudo text not null check (char_length(btrim(conteudo)) between 1 and 2000),
    data_registro timestamptz not null default now()
);

create index ocorrencia_id_usuario_idx on public.ocorrencia (id_usuario);
create index ocorrencia_id_categoria_idx on public.ocorrencia (id_categoria);
create index ocorrencia_status_data_idx on public.ocorrencia (status_atual, data_registro desc);
create index imagem_id_ocorrencia_idx on public.imagem (id_ocorrencia);
create index historico_status_ocorrencia_idx on public.historico_status (id_ocorrencia, data_alteracao desc);
create index historico_status_id_adm_idx on public.historico_status (id_adm);
create index nota_ocorrencia_ocorrencia_idx on public.nota_ocorrencia (id_ocorrencia, data_registro desc);
create index nota_ocorrencia_id_adm_idx on public.nota_ocorrencia (id_adm);


create function public.eh_administrador()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.administrador a
        where a.id_adm = (select auth.uid())
          and a.aprovado
    );
$$;

revoke execute on function public.eh_administrador() from public, anon;
grant execute on function public.eh_administrador() to authenticated;


create function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    dados jsonb;
    nome_usuario text;
    cadastro_admin boolean;
begin
    dados := coalesce(new.raw_user_meta_data, '{}'::jsonb);
    cadastro_admin := coalesce(dados ->> 'tipo', '') = 'administrador';

    nome_usuario := left(btrim(coalesce(dados ->> 'nome', dados ->> 'full_name', dados ->> 'name', '')), 120);
    if char_length(nome_usuario) < 2 then
        nome_usuario := left(split_part(coalesce(new.email, ''), '@', 1), 120);
    end if;
    if char_length(nome_usuario) < 2 then
        nome_usuario := 'Cidadão';
    end if;

    insert into public.usuario (id_usuario, nome, perfil)
    values (new.id, nome_usuario, case when cadastro_admin then 'administrador' else 'cidadao' end);

    if cadastro_admin then
        insert into public.administrador (id_adm, nome, email, cnpj, instituicao)
        values (
            new.id,
            nome_usuario,
            new.email,
            regexp_replace(coalesce(dados ->> 'cnpj', ''), '\D', '', 'g'),
            left(btrim(coalesce(dados ->> 'instituicao', '')), 150)
        );
    end if;

    return new;
end;
$$;

revoke execute on function public.criar_perfil_usuario() from public, anon, authenticated;

create trigger ao_criar_usuario_auth
after insert on auth.users
for each row execute function public.criar_perfil_usuario();


create function public.registrar_historico_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    anterior public.status_ocorrencia;
begin
    if tg_op = 'UPDATE' then
        anterior := old.status_atual;
    end if;

    insert into public.historico_status (id_ocorrencia, id_adm, status_anterior, status_novo)
    values (
        new.id_ocorrencia,
        (select a.id_adm from public.administrador a where a.id_adm = (select auth.uid())),
        anterior,
        new.status_atual
    );

    return null;
end;
$$;

revoke execute on function public.registrar_historico_status() from public, anon, authenticated;

create trigger ao_criar_ocorrencia
after insert on public.ocorrencia
for each row execute function public.registrar_historico_status();

create trigger ao_mudar_status
after update of status_atual on public.ocorrencia
for each row
when (old.status_atual is distinct from new.status_atual)
execute function public.registrar_historico_status();


create function public.limitar_imagens_por_ocorrencia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform pg_advisory_xact_lock(new.id_ocorrencia);

    if (select count(*) from public.imagem i where i.id_ocorrencia = new.id_ocorrencia) >= 5 then
        raise exception 'Limite de 5 fotos por ocorrência.' using errcode = 'check_violation';
    end if;

    return new;
end;
$$;

revoke execute on function public.limitar_imagens_por_ocorrencia() from public, anon, authenticated;

create trigger antes_de_registrar_imagem
before insert on public.imagem
for each row execute function public.limitar_imagens_por_ocorrencia();


create function public.registrar_ocorrencia(
    p_id_categoria integer,
    p_descricao text,
    p_endereco text default null,
    p_latitude numeric default null,
    p_longitude numeric default null
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
    nova_ocorrencia bigint;
begin
    insert into public.ocorrencia (id_categoria, descricao)
    values (p_id_categoria, btrim(p_descricao))
    returning id_ocorrencia into nova_ocorrencia;

    if nullif(btrim(p_endereco), '') is not null or p_latitude is not null or p_longitude is not null then
        insert into public.localizacao (id_ocorrencia, endereco, latitude, longitude)
        values (nova_ocorrencia, nullif(btrim(p_endereco), ''), p_latitude, p_longitude);
    end if;

    return nova_ocorrencia;
end;
$$;

revoke execute on function public.registrar_ocorrencia(integer, text, text, numeric, numeric) from public, anon;
grant execute on function public.registrar_ocorrencia(integer, text, text, numeric, numeric) to authenticated;


revoke all on
    public.usuario, public.administrador, public.categoria, public.ocorrencia,
    public.localizacao, public.imagem, public.historico_status, public.nota_ocorrencia
from anon, authenticated;

grant select on public.categoria to anon, authenticated;
grant insert (nome, descricao), update (nome, descricao), delete on public.categoria to authenticated;

grant select on
    public.usuario, public.administrador, public.ocorrencia, public.localizacao,
    public.imagem, public.historico_status, public.nota_ocorrencia
to authenticated;

grant update (nome) on public.usuario to authenticated;
grant insert (id_categoria, descricao), update (status_atual) on public.ocorrencia to authenticated;
grant insert (id_ocorrencia, endereco, latitude, longitude) on public.localizacao to authenticated;
grant insert (id_ocorrencia, url) on public.imagem to authenticated;
grant insert (id_ocorrencia, conteudo) on public.nota_ocorrencia to authenticated;


alter table public.usuario enable row level security;
alter table public.administrador enable row level security;
alter table public.categoria enable row level security;
alter table public.ocorrencia enable row level security;
alter table public.localizacao enable row level security;
alter table public.imagem enable row level security;
alter table public.historico_status enable row level security;
alter table public.nota_ocorrencia enable row level security;

create policy "usuario: ver o proprio perfil ou admin ver todos"
on public.usuario for select to authenticated
using (id_usuario = (select auth.uid()) or (select public.eh_administrador()));

create policy "usuario: editar o proprio nome"
on public.usuario for update to authenticated
using (id_usuario = (select auth.uid()))
with check (id_usuario = (select auth.uid()));

create policy "administrador: ver o proprio cadastro ou admin ver todos"
on public.administrador for select to authenticated
using (id_adm = (select auth.uid()) or (select public.eh_administrador()));

create policy "categoria: leitura publica"
on public.categoria for select to anon, authenticated
using (true);

create policy "categoria: admin cria"
on public.categoria for insert to authenticated
with check ((select public.eh_administrador()));

create policy "categoria: admin altera"
on public.categoria for update to authenticated
using ((select public.eh_administrador()))
with check ((select public.eh_administrador()));

create policy "categoria: admin remove"
on public.categoria for delete to authenticated
using ((select public.eh_administrador()));

create policy "ocorrencia: dono ou admin le"
on public.ocorrencia for select to authenticated
using (id_usuario = (select auth.uid()) or (select public.eh_administrador()));

create policy "ocorrencia: cidadao registra em seu nome"
on public.ocorrencia for insert to authenticated
with check (id_usuario = (select auth.uid()));

create policy "ocorrencia: admin atualiza status"
on public.ocorrencia for update to authenticated
using ((select public.eh_administrador()))
with check ((select public.eh_administrador()));

create policy "localizacao: dono da ocorrencia ou admin le"
on public.localizacao for select to authenticated
using (
    (select public.eh_administrador())
    or exists (
        select 1 from public.ocorrencia o
        where o.id_ocorrencia = localizacao.id_ocorrencia
          and o.id_usuario = (select auth.uid())
    )
);

create policy "localizacao: dono da ocorrencia registra"
on public.localizacao for insert to authenticated
with check (
    exists (
        select 1 from public.ocorrencia o
        where o.id_ocorrencia = localizacao.id_ocorrencia
          and o.id_usuario = (select auth.uid())
    )
);

create policy "imagem: dono da ocorrencia ou admin le"
on public.imagem for select to authenticated
using (
    (select public.eh_administrador())
    or exists (
        select 1 from public.ocorrencia o
        where o.id_ocorrencia = imagem.id_ocorrencia
          and o.id_usuario = (select auth.uid())
    )
);

create policy "imagem: dono da ocorrencia registra foto enviada"
on public.imagem for insert to authenticated
with check (
    exists (
        select 1 from public.ocorrencia o
        where o.id_ocorrencia = imagem.id_ocorrencia
          and o.id_usuario = (select auth.uid())
    )
    and url like (select auth.uid())::text || '/' || id_ocorrencia::text || '/%'
    and exists (
        select 1 from storage.objects s
        where s.bucket_id = 'ocorrencias'
          and s.name = imagem.url
    )
);

create policy "historico_status: dono da ocorrencia ou admin le"
on public.historico_status for select to authenticated
using (
    (select public.eh_administrador())
    or exists (
        select 1 from public.ocorrencia o
        where o.id_ocorrencia = historico_status.id_ocorrencia
          and o.id_usuario = (select auth.uid())
    )
);

create policy "nota_ocorrencia: admin le"
on public.nota_ocorrencia for select to authenticated
using ((select public.eh_administrador()));

create policy "nota_ocorrencia: admin escreve em seu nome"
on public.nota_ocorrencia for insert to authenticated
with check ((select public.eh_administrador()) and id_adm = (select auth.uid()));


insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ocorrencias', 'ocorrencias', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "ocorrencias: cidadao envia foto da propria ocorrencia"
on storage.objects for insert to authenticated
with check (
    bucket_id = 'ocorrencias'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
        select 1 from public.ocorrencia o
        where o.id_ocorrencia::text = (storage.foldername(name))[2]
          and o.id_usuario = (select auth.uid())
    )
);

create policy "ocorrencias: dono ou admin ve a foto"
on storage.objects for select to authenticated
using (
    bucket_id = 'ocorrencias'
    and (
        (storage.foldername(name))[1] = (select auth.uid())::text
        or (select public.eh_administrador())
    )
);


insert into public.categoria (nome, descricao) values
    ('Buraco / Asfalto', 'Buracos, rachaduras e desníveis na pista.'),
    ('Iluminação', 'Postes apagados, piscando ou danificados.'),
    ('Lixo / Entulho', 'Lixo acumulado, entulho e descarte irregular.'),
    ('Calçada', 'Calçadas quebradas, obstruídas ou sem acessibilidade.'),
    ('Sinalização', 'Placas, semáforos e faixas danificados ou ausentes.'),
    ('Árvores / Poda', 'Árvores caídas, galhos com risco e poda necessária.'),
    ('Água / Esgoto', 'Vazamentos, bueiros entupidos e esgoto a céu aberto.'),
    ('Outros', 'Problemas que não se encaixam nas demais categorias.');
