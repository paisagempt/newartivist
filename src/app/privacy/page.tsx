import { NavHeader } from '@/components/layout/nav-header';
import Link from 'next/link';

export const metadata = { title: 'Política de Privacidade — Artivist' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: junho de 2025</p>
        </div>

        <Section title="1. Responsável pelo Tratamento">
          <p>
            O responsável pelo tratamento dos seus dados pessoais é <strong>Caroline Bampa</strong>, a exercer
            atividade em nome individual sob o nome fantasia <strong>Artivist</strong>, com sede em Portugal.
          </p>
          <p>
            Contacto para questões de privacidade:{' '}
            <a href="mailto:artivist.dapp@gmail.com" className="underline underline-offset-2 hover:text-muted-foreground">
              artivist.dapp@gmail.com
            </a>
          </p>
        </Section>

        <Section title="2. Dados Recolhidos">
          <p>Recolhemos os seguintes dados pessoais:</p>
          <ul>
            <li><strong>Dados de conta:</strong> endereço de email e palavra-passe (encriptada).</li>
            <li><strong>Dados de perfil:</strong> nome artístico, biografia, fotografia de perfil, URL de portfólio (artistas); nome e missão da organização (ONGs).</li>
            <li><strong>Dados de transação:</strong> morada de entrega (obras físicas), histórico de compras e vendas, montantes envolvidos.</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de browser, preferência de idioma, registos de acesso.</li>
            <li><strong>Dados de blockchain:</strong> endereço de carteira Solana associado à sua conta Crossmint (público por natureza).</li>
          </ul>
        </Section>

        <Section title="3. Finalidade e Base Legal">
          <table>
            <thead>
              <tr>
                <th>Finalidade</th>
                <th>Base legal (RGPD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Criação e gestão de conta</td>
                <td>Execução de contrato (art. 6.º, n.º 1, al. b))</td>
              </tr>
              <tr>
                <td>Processamento de pagamentos</td>
                <td>Execução de contrato (art. 6.º, n.º 1, al. b))</td>
              </tr>
              <tr>
                <td>Emissão de certificados blockchain</td>
                <td>Execução de contrato (art. 6.º, n.º 1, al. b))</td>
              </tr>
              <tr>
                <td>Envio de emails transacionais</td>
                <td>Execução de contrato (art. 6.º, n.º 1, al. b))</td>
              </tr>
              <tr>
                <td>Cumprimento de obrigações legais</td>
                <td>Obrigação legal (art. 6.º, n.º 1, al. c))</td>
              </tr>
              <tr>
                <td>Segurança e prevenção de fraude</td>
                <td>Interesse legítimo (art. 6.º, n.º 1, al. f))</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="4. Subcontratantes e Terceiros">
          <p>Para prestar o serviço recorremos a terceiros que tratam dados em nosso nome:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> (EUA) — base de dados, autenticação e armazenamento de ficheiros. Coberto por Cláusulas Contratuais Padrão (CCP).</li>
            <li><strong>Stripe Inc.</strong> (EUA) — processamento de pagamentos com cartão. Coberto por CCP. Consulte a <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground">política de privacidade da Stripe</a>.</li>
            <li><strong>Crossmint Inc.</strong> (EUA) — emissão de NFTs e gestão de carteiras digitais. Coberto por CCP.</li>
            <li><strong>Resend Inc.</strong> (EUA) — envio de emails transacionais. Coberto por CCP.</li>
            <li><strong>Blockchain Solana</strong> — registo público imutável. Os endereços de carteira e transações são públicos e não podem ser apagados.</li>
          </ul>
          <p>Não vendemos nem partilhamos os seus dados com terceiros para fins de marketing.</p>
        </Section>

        <Section title="5. Conservação dos Dados">
          <p>
            Os seus dados são conservados enquanto a sua conta estiver ativa. Após encerramento da conta,
            os dados são eliminados no prazo de 30 dias, excepto os dados que tenhamos obrigação legal de
            conservar (ex.: registos fiscais, conservados 10 anos nos termos da lei portuguesa).
          </p>
          <p>
            Os dados registados na blockchain Solana são públicos e imutáveis — não é possível apagá-los
            após a emissão do certificado.
          </p>
        </Section>

        <Section title="6. Os Seus Direitos">
          <p>Ao abrigo do RGPD, tem os seguintes direitos:</p>
          <ul>
            <li><strong>Acesso</strong> — saber que dados temos sobre si.</li>
            <li><strong>Retificação</strong> — corrigir dados inexatos.</li>
            <li><strong>Apagamento</strong> — solicitar a eliminação dos seus dados ("direito a ser esquecido"), salvo obrigações legais.</li>
            <li><strong>Portabilidade</strong> — receber os seus dados num formato estruturado.</li>
            <li><strong>Oposição</strong> — opor-se ao tratamento baseado em interesse legítimo.</li>
            <li><strong>Limitação</strong> — solicitar a suspensão do tratamento em determinadas circunstâncias.</li>
          </ul>
          <p>
            Para exercer qualquer destes direitos, contacte-nos em{' '}
            <a href="mailto:artivist.dapp@gmail.com" className="underline underline-offset-2 hover:text-muted-foreground">
              artivist.dapp@gmail.com
            </a>
            . Responderemos no prazo de 30 dias.
          </p>
          <p>
            Tem ainda o direito de apresentar reclamação à autoridade de controlo portuguesa:{' '}
            <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground">
              Comissão Nacional de Proteção de Dados (CNPD)
            </a>
            .
          </p>
        </Section>

        <Section title="7. Cookies">
          <p>O Artivist utiliza apenas cookies estritamente necessários:</p>
          <ul>
            <li><strong>Sessão de autenticação</strong> — necessário para manter a sua sessão ativa. Sem este cookie não pode aceder à sua conta.</li>
            <li><strong>Preferência de idioma</strong> — guarda o idioma escolhido (PT/EN/ES) por 1 ano.</li>
          </ul>
          <p>
            Não utilizamos cookies de rastreio, análise ou publicidade. O Stripe pode definir cookies
            nas páginas de checkout para prevenção de fraude — estes são cobertos pela política da Stripe.
          </p>
        </Section>

        <Section title="8. Segurança">
          <p>
            Aplicamos medidas técnicas e organizativas adequadas para proteger os seus dados, incluindo
            encriptação em trânsito (HTTPS/TLS) e em repouso, controlos de acesso por funções e
            monitorização de acessos. Em caso de violação de dados que afete os seus direitos,
            notificaremos a CNPD e os utilizadores afetados nos prazos legais.
          </p>
        </Section>

        <Section title="9. Alterações a Esta Política">
          <p>
            Podemos atualizar esta política periodicamente. Em caso de alterações materiais, notificamo-lo
            por email. A data de última atualização está indicada no topo desta página.
          </p>
        </Section>

        <div className="border-t border-border pt-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider [&_th]:pb-2 [&_th]:border-b [&_th]:border-border [&_td]:py-2 [&_td]:border-b [&_td]:border-border [&_td]:text-sm [&_td:first-child]:font-medium [&_td:first-child]:text-foreground [&_td]:pr-4">
        {children}
      </div>
    </section>
  );
}
