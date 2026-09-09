/* =================================================================
   HIFERA PORTAL · Configuração de acesso
   -----------------------------------------------------------------
   Ponto único onde o portal aprende a falar com o Supabase. As duas
   chaves abaixo são públicas por natureza: a anon key é feita para
   viver no navegador, e sozinha ela não abre nada — quem decide o que
   cada pessoa enxerga é a política de RLS no banco. A chave de
   serviço (service_role) NUNCA entra aqui.

   Enquanto url e anonKey estiverem vazias:
     · em localhost, o portal cai no modo protótipo (lista de contas
       fictícias), para continuar dando para trabalhar offline;
     · em qualquer outro endereço, o portal se recusa a entrar. É de
       propósito — publicar sem configurar não pode virar porta aberta.

   Para ligar:
     1. Supabase → Project Settings → API
     2. copie "Project URL" para url e "anon public" para anonKey
     3. Authentication → URL Configuration → Redirect URLs:
        adicione https://clientes.hifera.com.br/
     4. rode portal/supabase/schema.sql no SQL Editor
     5. cadastre os e-mails autorizados em portal_acessos
   ================================================================= */
window.HIFERA_PORTAL_CONFIG = {
  supabase: {
    url: '',
    anonKey: ''
  },

  /* Para onde o link do e-mail devolve a pessoa. Vazio = a própria
     página de entrada, que é o que se quer em quase todo caso. */
  redirectTo: ''
};
