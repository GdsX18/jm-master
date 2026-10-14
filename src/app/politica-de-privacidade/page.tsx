import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CNPJ, CONTACT_EMAIL, LEGAL_NAME, SITE_NAME, WHATSAPP_DISPLAY } from "@/lib/site";

// Modelo base de política de privacidade (LGPD) — revisar juridicamente antes de considerar definitivo.

const LAST_UPDATED = "14 de outubro de 2026";

export const metadata: Metadata = {
  title: "Política de Privacidade | JM MASTER GROUP",
  description:
    "Saiba como a JM MASTER GROUP coleta, usa e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).",
  alternates: { canonical: "/politica-de-privacidade" },
};

const controller = LEGAL_NAME || SITE_NAME;

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="min-h-screen relative z-10 bg-white">
      <Navbar />
      <article className="w-full px-4 sm:px-6 md:px-12 max-w-[820px] mx-auto pt-28 sm:pt-36 pb-20 text-slate-700 leading-relaxed text-sm sm:text-base [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-black [&_h2]:text-[#082B61] [&_h2]:mt-10 [&_h2]:mb-3 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1.5">
        <h1 className="text-3xl sm:text-5xl font-black text-[#082B61] tracking-tight">Política de Privacidade</h1>
        <p className="text-xs text-slate-500 mt-3">Última atualização: {LAST_UPDATED}</p>

        <p>
          Esta Política de Privacidade explica como {controller}
          {CNPJ ? `, inscrita no CNPJ sob o nº ${CNPJ},` : ""} (“nós”) coleta, utiliza, compartilha e protege os
          dados pessoais de quem visita este site ou entra em contato conosco, em conformidade com a Lei nº
          13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
        </p>

        <h2>1. Quais dados coletamos</h2>
        <ul>
          <li>
            <strong>Dados fornecidos por você:</strong> nome, e-mail, telefone/WhatsApp, empresa e o conteúdo da
            mensagem enviados pelo formulário de contato ou pelo WhatsApp.
          </li>
          <li>
            <strong>Dados de navegação:</strong> endereço IP, tipo de navegador e dispositivo, páginas acessadas e
            interações, coletados por cookies e tecnologias semelhantes, somente com o seu consentimento quando
            não forem essenciais.
          </li>
        </ul>

        <h2>2. Para que usamos os dados</h2>
        <ul>
          <li>Responder às suas solicitações e enviar propostas comerciais (execução de procedimentos preliminares a contrato);</li>
          <li>Prestar os serviços contratados e manter o relacionamento com clientes (execução de contrato);</li>
          <li>Medir o desempenho do site e de campanhas e exibir anúncios relevantes (consentimento);</li>
          <li>Cumprir obrigações legais e regulatórias e exercer direitos em processos (obrigação legal e exercício regular de direitos);</li>
          <li>Prevenir fraudes e garantir a segurança do site (legítimo interesse).</li>
        </ul>

        <h2>3. Cookies</h2>
        <p>
          Utilizamos cookies essenciais para o funcionamento do site e, mediante o seu consentimento, cookies de
          análise e marketing de terceiros, como Google (Tag Manager e Analytics), Meta (Facebook/Instagram) e
          TikTok. Você pode aceitar ou recusar esses cookies no aviso exibido no primeiro acesso e alterar a sua
          escolha a qualquer momento pelo link “Preferências de cookies”, no rodapé do site.
        </p>

        <h2>4. Compartilhamento</h2>
        <p>Os dados podem ser compartilhados apenas com:</p>
        <ul>
          <li>Fornecedores que nos ajudam a operar o site e os serviços (hospedagem, banco de dados, ferramentas de mensageria e CRM);</li>
          <li>Plataformas de análise e publicidade listadas acima, quando houver consentimento;</li>
          <li>Autoridades públicas, quando exigido por lei ou ordem judicial.</li>
        </ul>
        <p>Não vendemos dados pessoais. Alguns fornecedores podem armazenar dados fora do Brasil, sempre com salvaguardas adequadas, nos termos da LGPD.</p>

        <h2>5. Por quanto tempo guardamos</h2>
        <p>
          Mantemos os dados pelo tempo necessário para cumprir as finalidades descritas, ou pelo prazo exigido
          por lei. Dados de contatos que não se tornaram clientes são eliminados quando deixam de ser necessários
          ou mediante solicitação.
        </p>

        <h2>6. Seus direitos</h2>
        <p>Nos termos do art. 18 da LGPD, você pode solicitar a qualquer momento:</p>
        <ul>
          <li>Confirmação da existência de tratamento e acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
          <li>Portabilidade dos dados;</li>
          <li>Eliminação dos dados tratados com base no consentimento e revogação do consentimento;</li>
          <li>Informação sobre com quem os dados foram compartilhados.</li>
        </ul>

        <h2>7. Segurança</h2>
        <p>
          Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados,
          perda ou alteração, como conexão criptografada (HTTPS), controle de acesso e senhas armazenadas de
          forma protegida.
        </p>

        <h2>8. Contato</h2>
        <p>
          Para exercer seus direitos ou tirar dúvidas sobre esta política, fale com o nosso encarregado pelo
          tratamento de dados pelo e-mail{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline text-[#082B61] font-semibold">
            {CONTACT_EMAIL}
          </a>{" "}
          ou pelo telefone {WHATSAPP_DISPLAY}.
        </p>

        <h2>9. Alterações</h2>
        <p>
          Esta política pode ser atualizada periodicamente. A data da última atualização está indicada no topo
          desta página.
        </p>
      </article>
      <Footer />
    </main>
  );
}
