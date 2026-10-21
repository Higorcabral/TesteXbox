/* =====================================================================
   Hifera — i18n (PT · EN · DE)
   ---------------------------------------------------------------------
   O português é a fonte: ele NÃO fica no dicionário. Ao carregar, o
   script captura o texto PT direto do HTML (orig[]) e guarda. Só EN e DE
   ficam aqui. Trocar para "pt" devolve o original capturado.

   Cada elemento com data-i18n é traduzido preservando filhos (ex.: o
   <svg> de uma seta): troca-se só o nó de texto. data-i18n-ph cuida de
   placeholders. A escolha fica salva em localStorage.
   ===================================================================== */
(function () {
  'use strict';

  var DICT = {
    en: {
      'nav.tagline': 'Systems & automation',
      'nav.metodo': 'Method',
      'nav.servicos': 'Services',
      'nav.diferenciais': 'Why us',
      'nav.quem': 'About',
      'nav.blog': 'Insights',
      'nav.cta': "Let's talk",

      'hero.h1a': 'We turn challenges',
      'hero.h1b': 'into digital solutions.',
      'hero.taglineA': 'We build',
      'hero.taglineB': 'applications',
      'hero.sub': "We understand your company's pain and deliver the right solution — from a website to a complete system, for any size and any industry.",
      'hero.ctaPrimary': 'See solutions',
      'hero.ctaGhost': 'Talk to Hifera',
      'hero.badge1t': 'Integration in sync',
      'hero.badge1s': 'ERP orders → inventory',
      'hero.badge2t': 'Automation live',
      'hero.badge2s': 'Daily reconciliation · ran at 06:00',

      'parceiros.titulo': 'Built and run with trusted technologies',
      'tese.fecho': "That's where Hifera comes in: from site to system, we solve it.",

      'tese.eyebrow': 'The starting point',
      'tese.h2a': 'The future of your business',
      'tese.h2b': 'starts with the right technology.',
      'tese.lead': 'The signs that technology stopped helping and became a burden on operations.',
      'tese.s1t': 'Everything by hand',
      'tese.s1p': 'Spreadsheets, copy-paste and manual checking. Hours a week on what the system would do by itself.',
      'tese.s2t': "Systems that don't talk",
      'tese.s2p': 'Each area with a different tool and none of them talking to each other.',
      'tese.s3t': "Digital that doesn't sell",
      'tese.s3p': 'Outdated site, no app and the customer with no digital channel to buy.',
      'tese.s4t': 'Decisions in the dark',
      'tese.s4p': "Reports that take days and numbers no one trusts when it's time to decide.",

      'jornada.eyebrow': 'Method',
      'jornada.h2a': 'Where others see problems,',
      'jornada.h2b': 'we create solutions.',
      'jornada.lead': 'Four stages. Any challenge.',
      'jornada.e1t': 'Diagnosis',
      'jornada.e1a': 'We understand the real pain;',
      'jornada.e1b': 'We map the process;',
      'jornada.e1c': 'We define the solution.',
      'jornada.e2t': 'Development',
      'jornada.e2a': 'App, site, system or BI;',
      'jornada.e2b': 'Delivery in pieces;',
      'jornada.e2c': "You use it before it's done.",
      'jornada.e3t': 'Integration',
      'jornada.e3a': 'Connects to what you use;',
      'jornada.e3b': 'Data migrated;',
      'jornada.e3c': 'Team trained.',
      'jornada.e4t': 'Evolution',
      'jornada.e4a': 'Direct support;',
      'jornada.e4b': 'Continuous improvement;',
      'jornada.e4c': 'Roadmap on your side.',
      'jornada.fecho': 'Conversation before code.',
      'jornada.cta': 'I want to solve my problem',

      'dif.eyebrow': 'Why us',
      'dif.h2a': 'Smart technology. Custom solutions.',
      'dif.h2b': 'Real results.',
      'dif.lead': "Why we're the right choice to solve your company's technology?",
      'dif.p1t': 'Manual hours dropping with every delivery.',
      'dif.chip1t': 'Step automated',
      'dif.chip1s': 'Invoice posting',
      'dif.p2t': 'Everything running in your operation, visible in one place.',
      'dif.f1tag': 'Automation',
      'dif.f1p': 'Bank reconciliation run without intervention',
      'dif.f2tag': 'Integration',
      'dif.f2p': 'ERP orders synced with inventory',
      'dif.f3tag': 'Data',
      'dif.f3p': 'Power BI dashboard updated with the closing',
      'dif.f4tag': 'Security',
      'dif.f4p': "Former employee's access revoked across all systems",
      'dif.p3t': 'Market-grade stack, no hacks.',
      'dif.p3s': 'Microsoft, real cloud and real databases, with security and access control from day one.',
      'dif.p1leg': 'Manual work hours per week · illustrative example',
      'dif.p4t': 'You follow every delivery, without having to ask.',
      'dif.p4rot': 'My project · delivery',
      'dif.prog1': 'Process diagnosis',
      'dif.prog2': 'Automated records',
      'dif.prog3': 'ERP integration',
      'dif.prog4': 'Power BI dashboard',
      'dif.statOk': 'Done',
      'dif.statRun': 'In progress',
      'dif.statNext': 'Planned',

      'serv.eyebrow': 'Services',
      'serv.h2a': 'From a website to a complete system.',
      'serv.h2b': 'We do it all.',
      'serv.lead': 'One partner to take your company off manual work: development, automation and data, from the first prototype to continuous support.',
      'serv.cta': 'Tell us what you need',
      'serv.s1t': 'Custom systems',
      'serv.s1p': 'ERPs, CRMs, management systems and portals built for your process, not the other way around.',
      'serv.s1a': 'Management', 'serv.s1b': 'ERP / CRM', 'serv.s1c': 'Portals',
      'serv.s2t': 'Software & SaaS',
      'serv.s2p': 'Complete digital products, from validated prototype to launch and continuous evolution.',
      'serv.s2a': 'MVP', 'serv.s2b': 'SaaS', 'serv.s2c': 'Multi-user',
      'serv.s3t': 'Applications',
      'serv.s3p': 'Web and mobile apps for your field team and your customers.',
      'serv.s3a': 'Android / iOS', 'serv.s3b': 'Web app', 'serv.s3c': 'PWA',
      'serv.s4t': 'Sites & landing pages',
      'serv.s4p': 'Fast, well-ranked sites with forms wired straight to your sales team.',
      'serv.s4a': 'Corporate', 'serv.s4b': 'Landing page', 'serv.s4c': 'SEO',
      'serv.s5t': 'Process automation',
      'serv.s5p': 'Repetitive tasks running on their own and systems talking to each other, no copy-paste.',
      'serv.s5a': 'Power Automate', 'serv.s5b': 'Integrations', 'serv.s5c': 'Bots',
      'serv.s6t': 'Dashboards & BI',
      'serv.s6p': 'Power BI dashboards with reliable data, updated on their own, to decide with the right number.',
      'serv.s6a': 'Power BI', 'serv.s6b': 'KPIs', 'serv.s6c': 'Reports',

      'produtos.eyebrow': 'Product',
      'produtos.h2a': 'Some things',
      'produtos.h2b': 'are already live.',
      'produtos.lead': "These aren't mockups. They're navigable systems we built to test ideas and solve real problems.",
      'produtos.prodTitulo': 'Financial Control',
      'produtos.prodDesc': 'Where money comes in, goes out and gets stuck — in a single panel.',
      'produtos.f1': 'Cash flow',
      'produtos.f2': 'Payables and receivables',
      'produtos.f3': 'Categories',
      'produtos.f4': 'Installments',
      'produtos.f5': 'Excel import',
      'produtos.experimentar': 'Try it',
      'produtos.preco': 'From R$ 397/mo',
      'produtos.vercaso': 'View case',
      'produtos.crmMeta': 'Sales',
      'produtos.crmDesc': 'Pipeline, follow-up and sales reports.',
      'produtos.maniMeta': 'Scheduling',
      'produtos.maniDesc': 'Online booking and automatic reminders.',
      'produtos.mecanMeta': 'Workshop',
      'produtos.mecanDesc': 'Digital work orders and quotes.',
      'produtos.stoqMeta': 'Inventory',
      'produtos.stoqDesc': 'Barcodes, min levels and ABC analysis.',
      'produtos.nota': 'The four projects above are navigable demos with fictional data.',

      'quem.eyebrow': 'About us',
      'quem.h2a': 'Two engineers. One obsession:',
      'quem.h2b': 'to solve.',
      'quem.higorPapel': 'Co-founder · Computer Engineering',
      'quem.higorBio': 'Corporate IT, automation, integrations and systems. He connects what already exists in the company to what needs to start running on its own.',
      'quem.fePapel': 'Co-founder · Computer Engineering',
      'quem.feBio': 'Data, risk, controls, security and operations. She looks at the system to find where it fails before the client does.',

      'prim.eyebrow': 'Commitments',
      'prim.fotoA': "We don't sell tools.",
      'prim.fotoB': 'We solve problems.',
      'prim.c1t': 'Transparent pricing',
      'prim.c1p': "You know what you'll pay before signing. The terms are the agreed scope, with no hidden fees.",
      'prim.c2t': 'Roadmap on your side',
      'prim.c2p': 'What you ask for joins the queue alongside the product roadmap, ordered by real impact on your operation.',
      'prim.c3t': 'Support straight from who builds it',
      'prim.c3p': 'No support layer. You talk to whoever wrote the system and get a reply within 24 business hours.',
      'prim.c4t': 'Your data, always yours',
      'prim.c4p': "We export everything that's yours in an open format, any time. No lock-in.",
      'prim.segP': 'We spell out how data is stored, who accesses what and what happens in case of discontinuity.',
      'prim.segBtn': 'Read about security',

      'blog.eyebrow': 'Insights',
      'blog.h2a': 'Ideas that become',
      'blog.h2b': 'solutions.',
      'blog.todosTop': 'See all articles',
      'blog.fTag': 'Opinion',
      'blog.fT': "A pretty site doesn't sell by itself: what makes a site bring customers",
      'blog.fX': 'Speed, clarity and a short path to contact matter more than animation.',
      'blog.sTag': 'Data',
      'blog.sT': 'Power BI without reliable data is just a pretty chart',
      'blog.s1tag': 'Opinion',
      'blog.s1t': "Why 'one more tool' almost never fixes it",
      'blog.c1tag': 'Automation',
      'blog.c1t': 'Automate one step first: the smallest-step method',
      'blog.c1x': 'Start small, see it work and only then decide the rest.',
      'blog.c2tag': 'Apps',
      'blog.c2t': 'App or web system? How to decide what your company needs',
      'blog.c2x': 'Not every problem needs an app in the store. A practical guide to choose right.',
      'blog.c3tag': 'Operations',
      'blog.c3t': "The spreadsheet isn't the villain — becoming the system is",
      'blog.c3x': "When the spreadsheet becomes the company's system, every tweak becomes a risk.",
      'blog.c4tag': 'Security',
      'blog.c4t': 'Basic security every small company should have',
      'blog.c4x': 'Access, passwords, backups and an audit trail: the minimum that prevents big losses.',
      'blog.ler': 'Read article',
      'blog.verTodos': 'See all articles',
      'blog.nota': 'Demo content for this preview — full articles coming soon.',

      'faq.eyebrow': 'FAQ',
      'faq.h2a': 'Before you',
      'faq.h2b': 'ask.',
      'faq.sub': 'The questions that come up most in the first conversation.',
      'faq.q0': 'Do you work with any kind of company?',
      'faq.a0': 'Yes. From freelancers and small businesses to structured companies — what changes is the scope, not the care in delivery.',
      'faq.q1': 'How long does it take to be ready?',
      'faq.a1': 'Ready-made solution: 3 to 7 business days. Custom: 3 to 8 weeks, split into deliveries you use before the end.',
      'faq.q2': 'Do I need to understand technology?',
      'faq.a2': 'No. If you can use a spreadsheet, you can use it. Training is part of the rollout.',
      'faq.q3': 'Can I start small?',
      'faq.a3': "You can, and it's what we usually suggest: automate one step, see it work, then decide the rest.",
      'faq.q4': 'What if I need something specific?',
      'faq.a4': "Then it's custom. If you already use a ready-made solution, your data comes along: no starting from scratch.",
      'faq.q5': 'How does payment work?',
      'faq.a5': 'Fixed monthly fee, with cycle and termination terms set in the contract. Ready-made solutions start at R$ 197/mo; Financial Control, the broadest product, at R$ 397/mo. Custom work has setup + a monthly support fee.',

      'fim.h2a': 'Your idea deserves more than code.',
      'fim.h2b': 'It deserves a solution.',
      'fim.p': 'Tell us the problem, not the solution. The first conversation is free.',
      'fim.labelNome': 'Name',
      'fim.labelRetorno': 'Email or WhatsApp',
      'fim.labelRecado': "What's stuck today",
      'fim.placeholder': 'E.g.: we track orders in a spreadsheet and lose time updating it.',
      'fim.enviar': "Let's talk",
      'fim.lgpd': 'Your data will be used only to reply to you.',
      'fim.okT': 'We got your message.',
      'fim.okP': "We'll read it carefully and reply within 24 business hours.",
      'fim.voltar': 'Back to the site',

      'footer.tagline': 'Technology built by people who live real operations.',
      'footer.navTit': 'Navigation',
      'footer.metodo': 'Method',
      'footer.servicos': 'Services',
      'footer.diferenciais': 'Why us',
      'footer.quem': 'About us',
      'footer.blog': 'Insights',
      'footer.servTit': 'Services',
      'footer.empTit': 'Company',
      'footer.seg': 'Security',
      'footer.portal': 'Client portal',
      'footer.ledger': 'Ledger',
      'footer.contato': 'Contact',
      'footer.direitos': 'All rights reserved.'
    },

    de: {
      'nav.tagline': 'Systeme & Automatisierung',
      'nav.metodo': 'Methode',
      'nav.servicos': 'Leistungen',
      'nav.diferenciais': 'Vorteile',
      'nav.quem': 'Über uns',
      'nav.blog': 'Inhalte',
      'nav.cta': 'Sprechen wir',

      'hero.h1a': 'Wir verwandeln Herausforderungen',
      'hero.h1b': 'in digitale Lösungen.',
      'hero.taglineA': 'Wir entwickeln',
      'hero.taglineB': 'Anwendungen',
      'hero.sub': 'Wir verstehen die Herausforderungen Ihres Unternehmens und liefern die richtige Lösung — von der Website bis zum kompletten System, für jede Größe und jede Branche.',
      'hero.ctaPrimary': 'Lösungen ansehen',
      'hero.ctaGhost': 'Mit Hifera sprechen',
      'hero.badge1t': 'Integration synchron',
      'hero.badge1s': 'ERP-Bestellungen → Lager',
      'hero.badge2t': 'Automatisierung aktiv',
      'hero.badge2s': 'Tägliche Abstimmung · lief um 06:00',

      'parceiros.titulo': 'Gebaut und betrieben mit vertrauenswürdigen Technologien',
      'tese.fecho': 'Genau hier kommt Hifera ins Spiel: von der Website bis zum System, wir lösen es.',

      'tese.eyebrow': 'Der Ausgangspunkt',
      'tese.h2a': 'Die Zukunft Ihres Unternehmens',
      'tese.h2b': 'beginnt mit der richtigen Technologie.',
      'tese.lead': 'Die Anzeichen, dass die Technik nicht mehr hilft, sondern den Betrieb belastet.',
      'tese.s1t': 'Alles manuell',
      'tese.s1p': 'Tabellen, Copy-Paste und Prüfung von Hand. Stunden pro Woche für das, was das System selbst erledigen würde.',
      'tese.s2t': 'Systeme, die nicht miteinander reden',
      'tese.s2p': 'Jeder Bereich mit einem anderen Tool und keines spricht mit dem anderen.',
      'tese.s3t': 'Digital, das nicht verkauft',
      'tese.s3p': 'Veraltete Website, keine App und der Kunde ohne digitalen Kanal zum Kaufen.',
      'tese.s4t': 'Entscheidungen im Dunkeln',
      'tese.s4p': 'Berichte, die Tage brauchen, und Zahlen, denen beim Entscheiden niemand traut.',

      'jornada.eyebrow': 'Methode',
      'jornada.h2a': 'Wo andere Probleme sehen,',
      'jornada.h2b': 'schaffen wir Lösungen.',
      'jornada.lead': 'Vier Phasen. Jede Herausforderung.',
      'jornada.e1t': 'Diagnose',
      'jornada.e1a': 'Wir verstehen den echten Schmerzpunkt;',
      'jornada.e1b': 'Wir bilden den Prozess ab;',
      'jornada.e1c': 'Wir definieren die Lösung.',
      'jornada.e2t': 'Entwicklung',
      'jornada.e2a': 'App, Website, System oder BI;',
      'jornada.e2b': 'Lieferung in Teilen;',
      'jornada.e2c': 'Sie nutzen es vor dem Abschluss.',
      'jornada.e3t': 'Integration',
      'jornada.e3a': 'Verbindet sich mit dem, was Sie nutzen;',
      'jornada.e3b': 'Daten migriert;',
      'jornada.e3c': 'Team geschult.',
      'jornada.e4t': 'Weiterentwicklung',
      'jornada.e4a': 'Direkter Support;',
      'jornada.e4b': 'Kontinuierliche Verbesserung;',
      'jornada.e4c': 'Roadmap auf Ihrer Seite.',
      'jornada.fecho': 'Gespräch vor Code.',
      'jornada.cta': 'Ich will mein Problem lösen',

      'dif.eyebrow': 'Vorteile',
      'dif.h2a': 'Intelligente Technologie. Maßgeschneiderte Lösungen.',
      'dif.h2b': 'Echte Ergebnisse.',
      'dif.lead': 'Warum wir die richtige Wahl für die Technik Ihres Unternehmens sind?',
      'dif.p1t': 'Manuelle Stunden sinken mit jeder Lieferung.',
      'dif.chip1t': 'Schritt automatisiert',
      'dif.chip1s': 'Rechnungserfassung',
      'dif.p2t': 'Alles, was in Ihrem Betrieb läuft, an einem Ort sichtbar.',
      'dif.f1tag': 'Automatisierung',
      'dif.f1p': 'Bankabstimmung ohne Eingriff ausgeführt',
      'dif.f2tag': 'Integration',
      'dif.f2p': 'ERP-Bestellungen mit dem Lager synchronisiert',
      'dif.f3tag': 'Daten',
      'dif.f3p': 'Power-BI-Dashboard mit dem Abschluss aktualisiert',
      'dif.f4tag': 'Sicherheit',
      'dif.f4p': 'Zugang eines Ex-Mitarbeiters in allen Systemen entzogen',
      'dif.p3t': 'Markttauglicher Stack, keine Bastellösung.',
      'dif.p3s': 'Microsoft, echte Cloud und echte Datenbanken, mit Sicherheit und Zugriffskontrolle ab dem ersten Tag.',
      'dif.p1leg': 'Manuelle Arbeitsstunden pro Woche · Beispiel',
      'dif.p4t': 'Sie verfolgen jede Lieferung, ohne nachfragen zu müssen.',
      'dif.p4rot': 'Mein Projekt · Lieferung',
      'dif.prog1': 'Prozessdiagnose',
      'dif.prog2': 'Automatisierte Stammdaten',
      'dif.prog3': 'ERP-Integration',
      'dif.prog4': 'Power-BI-Dashboard',
      'dif.statOk': 'Fertig',
      'dif.statRun': 'Läuft',
      'dif.statNext': 'Geplant',

      'serv.eyebrow': 'Leistungen',
      'serv.h2a': 'Von der Website bis zum kompletten System.',
      'serv.h2b': 'Wir machen alles.',
      'serv.lead': 'Ein Partner, der Ihr Unternehmen von Handarbeit befreit: Entwicklung, Automatisierung und Daten, vom ersten Prototyp bis zum laufenden Support.',
      'serv.cta': 'Sagen Sie uns, was Sie brauchen',
      'serv.s1t': 'Maßgeschneiderte Systeme',
      'serv.s1p': 'ERPs, CRMs, Management-Systeme und Portale, die zu Ihrem Prozess passen — nicht umgekehrt.',
      'serv.s1a': 'Management', 'serv.s1b': 'ERP / CRM', 'serv.s1c': 'Portale',
      'serv.s2t': 'Software & SaaS',
      'serv.s2p': 'Komplette digitale Produkte, vom validierten Prototyp bis zum Launch und zur laufenden Weiterentwicklung.',
      'serv.s2a': 'MVP', 'serv.s2b': 'SaaS', 'serv.s2c': 'Mehrbenutzer',
      'serv.s3t': 'Anwendungen',
      'serv.s3p': 'Web- und Mobile-Apps für Ihr Team im Feld und Ihre Kunden.',
      'serv.s3a': 'Android / iOS', 'serv.s3b': 'Web-App', 'serv.s3c': 'PWA',
      'serv.s4t': 'Websites & Landingpages',
      'serv.s4p': 'Schnelle, gut platzierte Websites mit Formularen direkt an Ihren Vertrieb.',
      'serv.s4a': 'Unternehmen', 'serv.s4b': 'Landingpage', 'serv.s4c': 'SEO',
      'serv.s5t': 'Prozessautomatisierung',
      'serv.s5p': 'Wiederkehrende Aufgaben laufen von allein und Systeme reden miteinander — kein Copy-Paste.',
      'serv.s5a': 'Power Automate', 'serv.s5b': 'Integrationen', 'serv.s5c': 'Bots',
      'serv.s6t': 'Dashboards & BI',
      'serv.s6p': 'Power-BI-Dashboards mit verlässlichen Daten, die sich selbst aktualisieren — für Entscheidungen mit der richtigen Zahl.',
      'serv.s6a': 'Power BI', 'serv.s6b': 'KPIs', 'serv.s6c': 'Berichte',

      'produtos.eyebrow': 'Produkt',
      'produtos.h2a': 'Einiges',
      'produtos.h2b': 'läuft bereits.',
      'produtos.lead': 'Das sind keine Mockups. Es sind navigierbare Systeme, die wir gebaut haben, um Ideen zu testen und echte Probleme zu lösen.',
      'produtos.prodTitulo': 'Finanzkontrolle',
      'produtos.prodDesc': 'Wo Geld reinkommt, rausgeht und hängen bleibt — in einem einzigen Dashboard.',
      'produtos.f1': 'Cashflow',
      'produtos.f2': 'Verbindlichkeiten und Forderungen',
      'produtos.f3': 'Kategorien',
      'produtos.f4': 'Ratenzahlungen',
      'produtos.f5': 'Excel-Import',
      'produtos.experimentar': 'Ausprobieren',
      'produtos.preco': 'Ab R$ 397/Monat',
      'produtos.vercaso': 'Fall ansehen',
      'produtos.crmMeta': 'Vertrieb',
      'produtos.crmDesc': 'Pipeline, Follow-up und Vertriebsberichte.',
      'produtos.maniMeta': 'Terminplanung',
      'produtos.maniDesc': 'Online-Buchung und automatische Erinnerungen.',
      'produtos.mecanMeta': 'Werkstatt',
      'produtos.mecanDesc': 'Digitale Arbeitsaufträge und Angebote.',
      'produtos.stoqMeta': 'Lager',
      'produtos.stoqDesc': 'Barcodes, Mindestbestand und ABC-Analyse.',
      'produtos.nota': 'Die vier Projekte oben sind navigierbare Demos mit fiktiven Daten.',

      'quem.eyebrow': 'Über uns',
      'quem.h2a': 'Zwei Ingenieure. Eine Obsession:',
      'quem.h2b': 'lösen.',
      'quem.higorPapel': 'Mitgründer · Technische Informatik',
      'quem.higorBio': 'Unternehmens-IT, Automatisierung, Integrationen und Systeme. Er verbindet das Bestehende im Unternehmen mit dem, was von allein laufen soll.',
      'quem.fePapel': 'Mitgründerin · Technische Informatik',
      'quem.feBio': 'Daten, Risiken, Kontrollen, Sicherheit und Betrieb. Sie prüft das System auf Schwachstellen, bevor der Kunde sie findet.',

      'prim.eyebrow': 'Zusagen',
      'prim.fotoA': 'Wir verkaufen keine Tools.',
      'prim.fotoB': 'Wir lösen Probleme.',
      'prim.c1t': 'Transparente Preise',
      'prim.c1p': 'Sie wissen vor der Unterschrift, was Sie zahlen. Die Konditionen sind der vereinbarte Umfang, ohne versteckte Gebühren.',
      'prim.c2t': 'Roadmap auf Ihrer Seite',
      'prim.c2p': 'Ihre Anfrage reiht sich neben der Produkt-Roadmap ein, geordnet nach realer Wirkung auf Ihren Betrieb.',
      'prim.c3t': 'Support direkt von den Entwicklern',
      'prim.c3p': 'Keine Support-Ebene. Sie sprechen mit den Entwicklern und erhalten innerhalb von 24 Arbeitsstunden Antwort.',
      'prim.c4t': 'Ihre Daten, immer Ihre',
      'prim.c4p': 'Wir exportieren jederzeit alles, was Ihnen gehört, in einem offenen Format. Kein Lock-in.',
      'prim.segP': 'Wir legen dar, wie Daten gespeichert werden, wer worauf zugreift und was bei einer Einstellung passiert.',
      'prim.segBtn': 'Mehr zur Sicherheit',

      'blog.eyebrow': 'Inhalte',
      'blog.h2a': 'Ideen, die zu',
      'blog.h2b': 'Lösungen werden.',
      'blog.todosTop': 'Alle Artikel',
      'blog.fTag': 'Meinung',
      'blog.fT': 'Eine schöne Website verkauft nicht von allein: was eine Website zum Kundenmagnet macht',
      'blog.fX': 'Geschwindigkeit, Klarheit und ein kurzer Weg zum Kontakt zählen mehr als Animation.',
      'blog.sTag': 'Daten',
      'blog.sT': 'Power BI ohne verlässliche Daten ist nur ein schönes Diagramm',
      'blog.s1tag': 'Meinung',
      'blog.s1t': "Warum 'noch ein Tool' fast nie hilft",
      'blog.c1tag': 'Automatisierung',
      'blog.c1t': 'Erst einen Schritt automatisieren: die Methode des kleinsten Schritts',
      'blog.c1x': 'Klein anfangen, es laufen sehen und erst dann über den Rest entscheiden.',
      'blog.c2tag': 'Apps',
      'blog.c2t': 'App oder Web-System? Wie Sie entscheiden, was Ihr Unternehmen braucht',
      'blog.c2x': 'Nicht jedes Problem braucht eine App im Store. Ein praktischer Leitfaden für die richtige Wahl.',
      'blog.c3tag': 'Betrieb',
      'blog.c3t': 'Die Tabelle ist nicht der Bösewicht — zum System zu werden schon',
      'blog.c3x': 'Wenn die Tabelle zum System des Unternehmens wird, wird jede Änderung zum Risiko.',
      'blog.c4tag': 'Sicherheit',
      'blog.c4t': 'Grundlegende Sicherheit, die jedes kleine Unternehmen haben sollte',
      'blog.c4x': 'Zugänge, Passwörter, Backups und ein Audit-Trail: das Minimum, das große Schäden verhindert.',
      'blog.ler': 'Artikel lesen',
      'blog.verTodos': 'Alle Artikel ansehen',
      'blog.nota': 'Demo-Inhalte für diese Vorschau — vollständige Artikel folgen bald.',

      'faq.eyebrow': 'Fragen',
      'faq.h2a': 'Bevor Sie',
      'faq.h2b': 'fragen.',
      'faq.sub': 'Die Fragen, die im ersten Gespräch am häufigsten kommen.',
      'faq.q0': 'Arbeiten Sie mit jeder Art von Unternehmen?',
      'faq.a0': 'Ja. Vom Freiberufler und Kleinbetrieb bis zum strukturierten Unternehmen — es ändert sich der Umfang, nicht die Sorgfalt bei der Lieferung.',
      'faq.q1': 'Wie lange dauert es bis zur Fertigstellung?',
      'faq.a1': 'Fertige Lösung: 3 bis 7 Arbeitstage. Maßgeschneidert: 3 bis 8 Wochen, aufgeteilt in Lieferungen, die Sie schon vor dem Ende nutzen.',
      'faq.q2': 'Muss ich mich mit Technik auskennen?',
      'faq.a2': 'Nein. Wenn Sie eine Tabelle bedienen können, kommen Sie zurecht. Schulung gehört zur Einführung.',
      'faq.q3': 'Kann ich klein anfangen?',
      'faq.a3': 'Ja, und das empfehlen wir meist: einen Schritt automatisieren, es laufen sehen, dann über den Rest entscheiden.',
      'faq.q4': 'Und wenn ich etwas Spezielles brauche?',
      'faq.a4': 'Dann wird es maßgeschneidert. Wenn Sie bereits eine fertige Lösung nutzen, kommen Ihre Daten mit: kein Neuanfang bei null.',
      'faq.q5': 'Wie funktioniert die Bezahlung?',
      'faq.a5': 'Feste monatliche Gebühr, mit vertraglich festgelegtem Zyklus und Kündigungsbedingungen. Fertige Lösungen ab R$ 197/Monat; die Finanzkontrolle, das umfangreichste Produkt, ab R$ 397/Monat. Maßgeschneidertes mit Einrichtung + monatlicher Support-Gebühr.',

      'fim.h2a': 'Ihre Idee verdient mehr als Code.',
      'fim.h2b': 'Sie verdient eine Lösung.',
      'fim.p': 'Erzählen Sie uns das Problem, nicht die Lösung. Das erste Gespräch ist kostenlos.',
      'fim.labelNome': 'Name',
      'fim.labelRetorno': 'E-Mail oder WhatsApp',
      'fim.labelRecado': 'Was heute hakt',
      'fim.placeholder': 'Z. B.: Wir verwalten Bestellungen in einer Tabelle und verlieren Zeit mit dem Aktualisieren.',
      'fim.enviar': 'Sprechen wir',
      'fim.lgpd': 'Ihre Daten werden nur verwendet, um Ihnen zu antworten.',
      'fim.okT': 'Wir haben Ihre Nachricht erhalten.',
      'fim.okP': 'Wir lesen sie in Ruhe und antworten innerhalb von 24 Arbeitsstunden.',
      'fim.voltar': 'Zurück zur Website',

      'footer.tagline': 'Technologie von Menschen, die echten Betrieb leben.',
      'footer.navTit': 'Navigation',
      'footer.metodo': 'Methode',
      'footer.servicos': 'Leistungen',
      'footer.diferenciais': 'Vorteile',
      'footer.quem': 'Über uns',
      'footer.blog': 'Inhalte',
      'footer.servTit': 'Leistungen',
      'footer.empTit': 'Unternehmen',
      'footer.seg': 'Sicherheit',
      'footer.portal': 'Kundenportal',
      'footer.ledger': 'Ledger',
      'footer.contato': 'Kontakt',
      'footer.direitos': 'Alle Rechte vorbehalten.'
    }
  };

  var LANGMAP = { pt: 'pt-BR', en: 'en', de: 'de' };
  var KEY = 'hifera_lang';
  var orig = {}, origPh = {};

  function hasElementChild(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 1) return true;
    }
    return false;
  }
  function firstTextNode(el) {
    var i, n;
    for (i = 0; i < el.childNodes.length; i++) {
      n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) return n;
    }
    for (i = 0; i < el.childNodes.length; i++) {
      n = el.childNodes[i];
      if (n.nodeType === 3) return n;
    }
    return null;
  }
  function readText(el) {
    if (!hasElementChild(el)) return el.textContent.trim();
    var tn = firstTextNode(el);
    return tn ? tn.nodeValue.trim() : '';
  }
  function writeText(el, val) {
    if (!hasElementChild(el)) { el.textContent = val; return; }
    var tn = firstTextNode(el);
    if (tn) { tn.nodeValue = val + ' '; }
    else { el.insertBefore(document.createTextNode(val + ' '), el.firstChild); }
  }

  function capture() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-i18n');
      if (!(k in orig)) orig[k] = readText(els[i]);
    }
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      var kp = phs[j].getAttribute('data-i18n-ph');
      if (!(kp in origPh)) origPh[kp] = phs[j].getAttribute('placeholder') || '';
    }
  }

  function apply(lang) {
    var d = lang === 'pt' ? null : (DICT[lang] || {});
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-i18n');
      var val = (lang === 'pt') ? orig[k] : (d[k] != null ? d[k] : orig[k]);
      if (val != null) writeText(els[i], val);
    }
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      var kp = phs[j].getAttribute('data-i18n-ph');
      var vp = (lang === 'pt') ? origPh[kp] : (d[kp] != null ? d[kp] : origPh[kp]);
      if (vp != null) phs[j].setAttribute('placeholder', vp);
    }
    document.documentElement.setAttribute('lang', LANGMAP[lang] || lang);

    var opt = document.querySelector('.lang-opt[data-lang="' + lang + '"]');
    if (opt) {
      var flag = document.getElementById('langFlag');
      var code = document.getElementById('langCode');
      var optFlag = opt.querySelector('.lang-bandeira');
      if (flag && optFlag) flag.innerHTML = optFlag.innerHTML;
      if (code) code.textContent = opt.getAttribute('data-code');
      var opts = document.querySelectorAll('.lang-opt');
      for (var o = 0; o < opts.length; o++) opts[o].classList.toggle('is-ativo', opts[o] === opt);
    }
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  function init() {
    capture();

    var saved = 'pt';
    try { saved = localStorage.getItem(KEY) || 'pt'; } catch (e) {}
    if (!/^(pt|en|de)$/.test(saved)) saved = 'pt';
    apply(saved);

    var wrap = document.getElementById('lang');
    var btn = document.getElementById('langBtn'); // existe só no modo dropdown

    function close() { if (wrap) wrap.classList.remove('is-open'); if (btn) btn.setAttribute('aria-expanded', 'false'); }

    // Clique em cada opção troca o idioma — vale tanto no seletor
    // segmentado (3 bandeiras) quanto no dropdown.
    var opts = document.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].addEventListener('click', function () {
        apply(this.getAttribute('data-lang'));
        close();
      });
    }

    // Comportamento de dropdown só quando o botão existe.
    if (btn && wrap) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = wrap.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
