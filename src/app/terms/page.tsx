import { NavHeader } from '@/components/layout/nav-header';
import Link from 'next/link';

export const metadata = { title: 'Termos de Utilização — Artivist' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] mb-4">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Termos de Utilização</h1>
          <p className="text-sm text-muted-foreground">Última atualização: junho de 2025</p>
        </div>

        <Section title="1. Sobre o Artivist">
          <p>
            O Artivist é uma plataforma de marketplace de arte com impacto social, operada por{' '}
            <strong>Caroline Bampa</strong> em nome individual, com sede em Portugal
            (doravante "Artivist", "nós" ou "plataforma"). A plataforma permite a artistas venderem
            obras de arte e destinarem automaticamente uma percentagem do valor de cada venda a
            organizações sem fins lucrativos (ONGs) parceiras.
          </p>
          <p>
            Ao criar uma conta ou utilizar o Artivist, aceita integralmente estes Termos de Utilização.
            Se não concordar, não deverá utilizar a plataforma.
          </p>
        </Section>

        <Section title="2. Elegibilidade">
          <p>Para utilizar o Artivist deve:</p>
          <ul>
            <li>Ter pelo menos 18 anos de idade.</li>
            <li>Ter capacidade legal para celebrar contratos vinculativos.</li>
            <li>Não estar sujeito a sanções internacionais nem ter sido previamente banido da plataforma.</li>
          </ul>
        </Section>

        <Section title="3. Tipos de Conta">
          <p>Existem três tipos de conta:</p>
          <ul>
            <li><strong>Artista</strong> — pode publicar e vender obras, definir a percentagem destinada a ONGs e receber pagamentos.</li>
            <li><strong>ONG</strong> — pode registar a organização como beneficiária e ser associada a artistas.</li>
            <li><strong>Comprador</strong> — pode adquirir obras no marketplace.</li>
          </ul>
          <p>
            É da responsabilidade de cada utilizador manter as credenciais de acesso em segurança.
            Qualquer atividade realizada com a sua conta é da sua responsabilidade.
          </p>
        </Section>

        <Section title="4. Regras para Artistas">
          <p>Ao publicar uma obra no Artivist, o artista declara e garante que:</p>
          <ul>
            <li>É o criador original da obra ou detém todos os direitos necessários para a vender.</li>
            <li>A obra não infringe direitos de terceiros (direitos de autor, marca, privacidade).</li>
            <li>As descrições e imagens da obra são verdadeiras e não induzem em erro.</li>
            <li>Para obras físicas, é responsável pela embalagem e envio ao comprador no prazo indicado.</li>
            <li>A percentagem destinada à ONG parceira será cumprida conforme configurada na listagem.</li>
          </ul>
          <p>
            O Artivist reserva-se o direito de remover qualquer obra que viole estas regras ou que
            considere inadequada, sem aviso prévio.
          </p>
        </Section>

        <Section title="5. Distribuição de Receitas e Comissões">
          <p>Em cada venda, o valor é distribuído automaticamente da seguinte forma:</p>
          <ul>
            <li><strong>Artista:</strong> percentagem definida pelo artista (por defeito 80%).</li>
            <li><strong>ONG parceira:</strong> percentagem definida pelo artista (por defeito 10%).</li>
            <li><strong>Plataforma Artivist:</strong> 10% fixos a título de comissão de serviço.</li>
          </ul>
          <p>
            Os pagamentos ao artista são processados via Stripe Connect. O artista é responsável por
            criar e manter a sua conta Stripe e por cumprir as obrigações fiscais aplicáveis às receitas recebidas.
          </p>
          <p>
            As distribuições para ONGs e artistas são executadas via blockchain Solana em USDC.
            O Artivist não é responsável por atrasos ou falhas imputáveis à rede blockchain ou
            a serviços de terceiros.
          </p>
        </Section>

        <Section title="6. Regras para Compradores">
          <p>Ao adquirir uma obra, o comprador:</p>
          <ul>
            <li>Compromete-se a efetuar o pagamento no ato da compra.</li>
            <li>Para obras físicas, fornece uma morada de entrega válida e completa.</li>
            <li>Reconhece que as obras digitais são entregues electronicamente e que os certificados blockchain são imutáveis.</li>
            <li>Pode abrir uma disputa em caso de não-entrega ou discrepância grave em relação à descrição, no prazo de 14 dias após a confirmação de envio.</li>
          </ul>
        </Section>

        <Section title="7. Resolução de Disputas">
          <p>
            Em caso de litígio entre comprador e artista, o Artivist atua como mediador. O pagamento
            permanece retido até resolução. O Artivist decidirá com base nas evidências fornecidas
            por ambas as partes e a sua decisão é vinculativa no âmbito da plataforma.
          </p>
          <p>
            Para litígios não resolvidos através da plataforma, os consumidores residentes em Portugal
            podem recorrer ao{' '}
            <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground">
              CNIACC
            </a>{' '}
            ou a outros centros de arbitragem de conflitos de consumo reconhecidos em Portugal.
            Consulte também{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground">
              ec.europa.eu/consumers/odr
            </a>{' '}
            (plataforma europeia de resolução de litígios em linha).
          </p>
        </Section>

        <Section title="8. Direito de Arrependimento">
          <p>
            Nos termos da legislação europeia de defesa do consumidor (Diretiva 2011/83/UE, transposta
            pelo Decreto-Lei n.º 24/2014):
          </p>
          <ul>
            <li>
              <strong>Obras digitais:</strong> ao concluir a compra, o utilizador autoriza expressamente
              o início imediato da entrega do conteúdo digital e reconhece que perde o direito de
              arrependimento após a entrega.
            </li>
            <li>
              <strong>Obras físicas:</strong> o comprador tem 14 dias após a receção do bem para
              exercer o direito de arrependimento, devendo devolver a obra em perfeito estado. Os
              custos de devolução são suportados pelo comprador, salvo defeito ou erro imputável ao artista.
            </li>
          </ul>
        </Section>

        <Section title="9. Propriedade Intelectual">
          <p>
            A compra de uma obra confere ao comprador o direito de uso pessoal e não comercial
            da obra, salvo acordo expresso em contrário descrito na listagem. O artista mantém
            todos os direitos de autor sobre a obra.
          </p>
          <p>
            O nome, logótipo e conteúdos do Artivist são propriedade de Caroline Bampa e não podem
            ser utilizados sem autorização prévia por escrito.
          </p>
        </Section>

        <Section title="10. Limitação de Responsabilidade">
          <p>
            O Artivist é uma plataforma intermediária. Não somos parte nos contratos celebrados entre
            artistas e compradores e não assumimos responsabilidade pela qualidade, segurança ou
            legalidade das obras publicadas.
          </p>
          <p>
            Na máxima extensão permitida por lei, a nossa responsabilidade total perante qualquer
            utilizador por quaisquer danos emergentes do uso da plataforma fica limitada ao valor
            pago na transação em causa.
          </p>
          <p>
            Não somos responsáveis por interrupções do serviço, perdas de dados ou danos indiretos,
            exceto nos casos em que a lei não permita tal exclusão.
          </p>
        </Section>

        <Section title="11. Suspensão e Encerramento de Conta">
          <p>
            Podemos suspender ou encerrar contas que violem estes termos, sejam utilizadas de forma
            fraudulenta ou abusiva, ou que estejam inativas há mais de 2 anos. Notificaremos o
            utilizador por email salvo em casos de fraude grave.
          </p>
        </Section>

        <Section title="12. Alterações aos Termos">
          <p>
            Podemos rever estes Termos periodicamente. Notificaremos os utilizadores registados por
            email com pelo menos 30 dias de antecedência em caso de alterações materiais. A continuação
            do uso da plataforma após essa data implica a aceitação dos novos termos.
          </p>
        </Section>

        <Section title="13. Lei Aplicável e Foro">
          <p>
            Estes Termos são regidos pela lei portuguesa e pelo direito da União Europeia aplicável.
            Para litígios não sujeitos a arbitragem de consumo, é competente o tribunal da comarca
            de Lisboa, sem prejuízo de foro imperativo aplicável ao consumidor.
          </p>
        </Section>

        <Section title="14. Contacto">
          <p>
            Para questões relacionadas com estes Termos, contacte-nos em{' '}
            <a href="mailto:artivist.dapp@gmail.com" className="underline underline-offset-2 hover:text-muted-foreground">
              artivist.dapp@gmail.com
            </a>
            .
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
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
