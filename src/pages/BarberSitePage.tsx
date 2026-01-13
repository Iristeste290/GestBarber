import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Phone, 
  MapPin, 
  Clock, 
  Scissors, 
  MessageCircle, 
  Calendar,
  Star,
  Users,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { toast } from "sonner";

interface BarberSite {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  theme: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  site_content: Record<string, unknown>;
  seo_data: Record<string, unknown>;
  published: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
  duration_minutes: number;
}

interface WorkHour {
  weekday: number;
  start_time: string;
  end_time: string;
}

interface Barber {
  id: string;
  name: string;
  slug: string | null;
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// SEO service pages configuration
const SERVICE_PAGES: Record<string, { title: string; description: string; keywords: string[] }> = {
  'corte': {
    title: 'Corte de Cabelo Masculino',
    description: 'Corte de cabelo masculino profissional com estilo e precisão. Degradê, navalhado, máquina ou tesoura.',
    keywords: ['corte masculino', 'corte degradê', 'corte navalhado', 'barbeiro']
  },
  'barba': {
    title: 'Barba e Bigode',
    description: 'Serviço de barba profissional com toalha quente, navalha e produtos premium. Modelagem e hidratação.',
    keywords: ['barba', 'fazer barba', 'barbeiro barba', 'toalha quente']
  },
  'corte-e-barba': {
    title: 'Corte e Barba Completo',
    description: 'Combo completo de corte de cabelo e barba. Visual renovado com atendimento premium.',
    keywords: ['corte e barba', 'combo barbearia', 'corte completo']
  }
};

const BarberSitePage = () => {
  const { slug, service: servicePage } = useParams<{ slug: string; service?: string }>();
  const location = useLocation();
  
  // Lead capture form state
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Fetch site data
  const { data: site, isLoading, error } = useQuery({
    queryKey: ['public-barber-site', slug],
    queryFn: async (): Promise<BarberSite | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('barber_sites')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data as BarberSite | null;
    },
    enabled: !!slug,
  });

  // Fetch services for this barbershop
  const { data: services } = useQuery({
    queryKey: ['barber-site-services', site?.user_id],
    queryFn: async (): Promise<Service[]> => {
      if (!site?.user_id) return [];
      
      const { data } = await supabase
        .from('services')
        .select('id, name, price, description, duration_minutes')
        .eq('user_id', site.user_id)
        .eq('is_active', true)
        .order('price', { ascending: false });
      
      return (data || []) as Service[];
    },
    enabled: !!site?.user_id,
  });

  // Fetch barbers for scheduling link
  const { data: barbers } = useQuery({
    queryKey: ['barber-site-barbers', site?.user_id],
    queryFn: async (): Promise<Barber[]> => {
      if (!site?.user_id) return [];
      
      const { data } = await supabase
        .from('barbers')
        .select('id, name, slug')
        .eq('user_id', site.user_id)
        .eq('is_active', true);
      
      return (data || []) as Barber[];
    },
    enabled: !!site?.user_id,
  });

  // Fetch work hours
  const { data: workHours } = useQuery({
    queryKey: ['barber-site-work-hours', barbers?.[0]?.id],
    queryFn: async (): Promise<WorkHour[]> => {
      if (!barbers?.[0]?.id) return [];
      
      const { data } = await supabase
        .from('barber_work_hours')
        .select('weekday, start_time, end_time')
        .eq('barber_id', barbers[0].id)
        .order('weekday');
      
      return (data || []) as WorkHour[];
    },
    enabled: !!barbers?.[0]?.id,
  });

  // Fetch total appointments count (social proof)
  const { data: appointmentsCount } = useQuery({
    queryKey: ['barber-site-appointments-count', site?.user_id],
    queryFn: async (): Promise<number> => {
      if (!site?.user_id) return 0;
      
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!site?.user_id,
  });

  // Lead submission mutation
  const submitLead = useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      if (!site) throw new Error('Site não encontrado');
      
      const { error } = await supabase
        .from('barbershop_leads')
        .insert({
          user_id: site.user_id,
          site_id: site.id,
          name,
          phone,
          source: servicePage ? `website-${servicePage}` : 'website',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setLeadSubmitted(true);
      toast.success('Recebemos seu contato! Vamos te chamar no WhatsApp.');
    },
    onError: () => {
      toast.error('Erro ao enviar. Tente novamente.');
    },
  });

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    submitLead.mutate({ name: leadName, phone: leadPhone });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-16 w-64 mx-auto mb-8 bg-zinc-800" />
          <Skeleton className="h-8 w-96 mx-auto mb-4 bg-zinc-800" />
          <Skeleton className="h-64 w-full max-w-4xl mx-auto bg-zinc-800" />
        </div>
      </div>
    );
  }

  // Site not found
  if (error || !site) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold mb-4 text-white">Site não encontrado</h1>
          <p className="text-zinc-400 mb-6">
            Este site não existe ou não está mais disponível.
          </p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!site.published) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🚧</div>
          <h1 className="text-3xl font-bold mb-4 text-white">Site não publicado</h1>
          <p className="text-zinc-400 mb-6">
            Este site ainda não foi publicado pelo proprietário.
          </p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    );
  }

  const formatWhatsAppLink = (phone: string, message?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${phoneWithCountry}${encodedMessage}`;
  };

  const firstBarberSlug = barbers?.find(b => b.slug)?.slug || barbers?.[0]?.id;
  const scheduleUrl = firstBarberSlug ? `/agenda/${firstBarberSlug}` : null;
  
  // Extract neighborhood and city from address
  const getLocationInfo = () => {
    let neighborhood = '';
    let city = site.city || '';
    
    if (site.address) {
      const parts = site.address.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        neighborhood = parts[1];
      }
      if (parts.length >= 3 && !city) {
        city = parts[2];
      }
    }
    
    return { neighborhood: neighborhood || city || 'sua região', city: city || 'sua cidade' };
  };

  const { neighborhood, city } = getLocationInfo();
  
  const formattedCount = appointmentsCount && appointmentsCount > 0 
    ? appointmentsCount >= 1000 
      ? `${Math.floor(appointmentsCount / 1000)}k+`
      : `${Math.floor(appointmentsCount / 10) * 10}+`
    : null;

  // SEO data for service pages
  const currentServicePage = servicePage && SERVICE_PAGES[servicePage];
  const pageUrl = `${window.location.origin}/b/${slug}${servicePage ? `/${servicePage}` : ''}`;
  
  // Dynamic SEO content
  const seoTitle = currentServicePage 
    ? `${currentServicePage.title} em ${neighborhood} | ${site.title}`
    : `Corte de cabelo em ${neighborhood} | ${site.title}`;
  
  const seoDescription = currentServicePage
    ? `${currentServicePage.description} ${site.title} em ${neighborhood}, ${city}. Agende online agora!`
    : `Barbearia em ${neighborhood}, ${city}. Corte, barba e agendamento online. Atendimento rápido.`;

  const seoH1 = currentServicePage 
    ? `${currentServicePage.title} em ${neighborhood}`
    : `Corte de cabelo em ${neighborhood}`;

  // Schema.org LocalBusiness JSON-LD
  const schemaOrgData = {
    "@context": "https://schema.org",
    "@type": "Barbershop",
    "name": site.title,
    "description": seoDescription,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": site.address || '',
      "addressLocality": city,
      "addressRegion": city,
      "addressCountry": "BR"
    },
    "areaServed": neighborhood,
    "telephone": site.phone || '',
    "url": pageUrl,
    "priceRange": services && services.length > 0 
      ? `R$${Math.min(...services.map(s => s.price))}-R$${Math.max(...services.map(s => s.price))}`
      : '$$',
    "openingHours": workHours?.map(wh => 
      `${WEEKDAYS[wh.weekday].slice(0, 2)} ${wh.start_time.slice(0, 5)}-${wh.end_time.slice(0, 5)}`
    ) || [],
    "image": [], // Could be populated with logo/photos
    "sameAs": site.phone ? [`https://wa.me/55${site.phone.replace(/\D/g, '')}`] : []
  };

  // Google Maps embed URL
  const getMapEmbedUrl = () => {
    if (!site.address) return null;
    const query = encodeURIComponent(`${site.address}, ${city}, Brasil`);
    return `https://www.google.com/maps?q=${query}&output=embed`;
  };

  const mapEmbedUrl = getMapEmbedUrl();

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={`barbearia ${neighborhood}, corte cabelo ${city}, barbeiro ${neighborhood}, ${currentServicePage?.keywords?.join(', ') || 'corte, barba, barbearia'}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="business.business" />
        <meta property="og:locale" content="pt_BR" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* Geo tags */}
        <meta name="geo.region" content="BR" />
        <meta name="geo.placename" content={city} />
        
        {/* Canonical */}
        <link rel="canonical" href={pageUrl} />
        
        <meta name="theme-color" content="#000000" />
        
        {/* Schema.org JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        {/* Hero Section with SEO structure */}
        <section className="relative min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-4 py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
          
          <div className="relative z-10 container mx-auto text-center max-w-3xl">
            {/* Logo/Name */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 mb-4">
                <Scissors className="w-10 h-10 text-black" />
              </div>
            </div>
            
            {/* SEO Heading Structure */}
            <h1 className="text-3xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              {seoH1}
            </h1>
            <h2 className="text-xl md:text-2xl text-zinc-400 mb-2">
              Barbearia em {city}
            </h2>
            <h3 className="text-2xl md:text-4xl font-bold text-white mb-6">
              {site.title}
            </h3>
            
            <p className="text-lg text-zinc-300 mb-8">
              {currentServicePage?.description || 'Corte e barba profissional — agende online agora'}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {scheduleUrl && (
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-500/25"
                  asChild
                >
                  <Link to={scheduleUrl}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Agendar Agora
                  </Link>
                </Button>
              )}
              {site.phone && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 text-lg px-8 py-6 rounded-xl"
                  asChild
                >
                  <a 
                    href={formatWhatsAppLink(site.phone, `Olá, encontrei a ${site.title} no Google e quero agendar`)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Falar no WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        {formattedCount && (
          <section className="py-8 bg-zinc-900/50 border-y border-zinc-800">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-2 border-zinc-900 flex items-center justify-center"
                    >
                      <Users className="w-5 h-5 text-zinc-400" />
                    </div>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold text-white">
                    Mais de <span className="text-amber-400">{formattedCount}</span> atendimentos realizados
                  </p>
                  <div className="flex items-center gap-1 justify-center sm:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-zinc-400 text-sm ml-1">Clientes satisfeitos</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Lead Capture Form */}
        <section className="py-12 px-4 bg-gradient-to-b from-amber-900/20 to-black">
          <div className="container mx-auto max-w-md">
            <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl shadow-amber-500/5">
              <h4 className="text-xl font-bold text-center mb-2 text-white">
                Quero agendar meu horário
              </h4>
              <p className="text-zinc-400 text-center text-sm mb-6">
                Deixe seu contato e te chamamos no WhatsApp
              </p>
              
              {leadSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <p className="text-white font-semibold mb-4">Contato recebido!</p>
                  {scheduleUrl && (
                    <Button 
                      className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold"
                      asChild
                    >
                      <Link to={scheduleUrl}>
                        <Calendar className="mr-2 h-5 w-5" />
                        Agendar agora mesmo
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <Input
                    placeholder="Seu nome"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <Input
                    placeholder="Seu WhatsApp"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    type="tel"
                  />
                  <Button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold py-6"
                    disabled={submitLead.isPending}
                  >
                    {submitLead.isPending ? 'Enviando...' : 'Quero agendar'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Services Section */}
        {services && services.length > 0 && (
          <section className="py-16 md:py-20 px-4 bg-black">
            <div className="container mx-auto max-w-4xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                <span className="text-amber-400">Nossos</span> Serviços
              </h2>
              
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 hover:border-amber-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 rounded-xl bg-amber-500/10 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                          <Scissors className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg text-white truncate">{service.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.duration_minutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-amber-400 whitespace-nowrap">
                          R$ {service.price.toFixed(0)}
                        </span>
                        {scheduleUrl && (
                          <Button 
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold hidden sm:flex"
                            asChild
                          >
                            <Link to={scheduleUrl}>
                              Agendar
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile button */}
                    {scheduleUrl && (
                      <Button 
                        size="sm"
                        className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold sm:hidden"
                        asChild
                      >
                        <Link to={scheduleUrl}>
                          Agendar este serviço
                        </Link>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* SEO Internal Links */}
              {!servicePage && (
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(SERVICE_PAGES).map(([key, page]) => (
                    <Link
                      key={key}
                      to={`/b/${slug}/${key}`}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-amber-500/50 transition-all text-center"
                    >
                      <h4 className="font-semibold text-amber-400">{page.title}</h4>
                      <p className="text-sm text-zinc-400 mt-1">em {neighborhood}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Work Hours Section */}
        {workHours && workHours.length > 0 && (
          <section className="py-16 px-4 bg-zinc-900/50">
            <div className="container mx-auto max-w-md">
              <h2 className="text-2xl font-bold text-center mb-8">
                <span className="text-amber-400">Horário</span> de Funcionamento
              </h2>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
                {workHours.map((wh) => (
                  <div 
                    key={wh.weekday}
                    className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0"
                  >
                    <span className="text-zinc-300">{WEEKDAYS[wh.weekday]}</span>
                    <span className="text-amber-400 font-medium">
                      {wh.start_time.slice(0, 5)} - {wh.end_time.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Location Section with Google Maps */}
        {site.address && (
          <section className="py-16 px-4 bg-black">
            <div className="container mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold text-center mb-8">
                <span className="text-amber-400">Nossa</span> Localização
              </h2>
              
              {/* Google Maps Embed */}
              {mapEmbedUrl && (
                <div className="rounded-2xl overflow-hidden mb-6 border border-zinc-800">
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa da ${site.title}`}
                  />
                </div>
              )}
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-lg text-white mb-2">{site.address}</p>
                {city && (
                  <p className="text-zinc-400">{city}</p>
                )}
                
                {/* Google Maps Link */}
                <Button
                  variant="outline"
                  className="mt-6 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  asChild
                >
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(site.address + ', ' + city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Abrir no Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-zinc-900 to-black">
          <div className="container mx-auto max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-8">
              <span className="text-amber-400">Pronto</span> para agendar?
            </h2>
            
            <div className="flex flex-col gap-4">
              {scheduleUrl && (
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold text-lg py-6 rounded-xl"
                  asChild
                >
                  <Link to={scheduleUrl}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Agendar Agora
                  </Link>
                </Button>
              )}
              
              {site.phone && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800 text-lg py-6 rounded-xl"
                  asChild
                >
                  <a 
                    href={formatWhatsAppLink(site.phone, `Olá, encontrei a ${site.title} no Google e quero agendar`)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    {site.phone}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 bg-black border-t border-zinc-800 text-center">
          {/* Internal SEO links in footer */}
          {!servicePage && (
            <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
              {Object.entries(SERVICE_PAGES).map(([key, page]) => (
                <Link
                  key={key}
                  to={`/b/${slug}/${key}`}
                  className="text-zinc-400 hover:text-amber-400 transition-colors"
                >
                  {page.title} em {neighborhood}
                </Link>
              ))}
            </div>
          )}
          
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} {site.title}. Todos os direitos reservados.
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            Desenvolvido com ❤️ pelo GestBarber
          </p>
        </footer>

        {/* Fixed Mobile Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50 sm:hidden">
          <div className="flex gap-3 max-w-lg mx-auto">
            {site.phone && (
              <Button 
                size="lg"
                variant="outline"
                className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10 rounded-xl py-6"
                asChild
              >
                <a 
                  href={formatWhatsAppLink(site.phone, `Olá, encontrei a ${site.title} no Google e quero agendar`)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </a>
              </Button>
            )}
            {scheduleUrl && (
              <Button 
                size="lg"
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl py-6"
                asChild
              >
                <Link to={scheduleUrl}>
                  <Calendar className="mr-2 h-5 w-5" />
                  Agendar
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Spacer for fixed buttons on mobile */}
        <div className="h-24 sm:hidden" />
      </div>
    </>
  );
};

export default BarberSitePage;
