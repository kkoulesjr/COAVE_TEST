/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Menu, 
  X, 
  ChevronRight,
  ChevronDown, 
  Quote, 
  Linkedin, 
  Instagram, 
  Mail,
  Compass,
  Users,
  Lightbulb,
  Heart
} from "lucide-react";
import { useState, useEffect, useRef, FormEvent } from "react";

// --- Components ---

const scrollToSection = (id: string) => {
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const element = document.getElementById(id);
  if (element) {
    const navbarHeight = 80;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navbarHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Coaches", href: "#coaches" },
    { name: "Programs", href: "#programs" },
    { name: "Philosophy", href: "#philosophy" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? "bg-brand-cream/80 backdrop-blur-md py-4 shadow-sm" : "bg-transparent py-8"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 group cursor-pointer"
          onClick={() => {
            scrollToSection('home');
            setTimeout(() => setIsMenuOpen(false), 100);
          }}
        >
          <div className="flex flex-col items-center leading-none gap-0.5 text-center">
            <span className="text-xl font-serif font-bold tracking-[0.15em] text-brand-navy">COAVE</span>
            <span className="text-[7px] uppercase tracking-[0.4em] font-bold text-brand-gold opacity-80">Coaching Lab</span>
          </div>
        </motion.div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link, idx) => (
            <motion.a
              key={link.name}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.href.replace('#', ''));
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="text-xs uppercase tracking-widest font-medium hover:text-brand-gold transition-colors cursor-pointer"
            >
              {link.name}
            </motion.a>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 border border-brand-navy text-xs uppercase tracking-widest font-semibold hover:bg-brand-navy hover:text-brand-cream transition-all cursor-pointer"
            onClick={() => scrollToSection('contact')}
          >
            Inquiry
          </motion.button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-brand-navy hover:text-brand-gold transition-colors" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

        {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-cream border-b border-brand-navy/10 overflow-hidden"
          >
            <div className="flex flex-col gap-8 p-10 items-center">
              {navLinks.map((link) => (
                <button 
                  key={link.name} 
                  type="button"
                  onClick={() => {
                    scrollToSection(link.href.replace('#', ''));
                    setTimeout(() => setIsMenuOpen(false), 100);
                  }}
                  className="text-sm uppercase tracking-[0.4em] font-bold text-brand-navy hover:text-brand-gold transition-colors cursor-pointer"
                >
                  {link.name}
                </button>
              ))}
              <button 
                type="button"
                onClick={() => {
                  scrollToSection('contact');
                  setTimeout(() => setIsMenuOpen(false), 100);
                }}
                className="w-full py-5 bg-brand-navy text-brand-cream uppercase tracking-widest font-bold text-xs hover:bg-brand-gold transition-colors rounded-sm"
              >
                Inquiry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const WeavingLine = ({ className }: { className?: string }) => {
  return (
    <div className={`relative h-px w-full overflow-hidden ${className}`}>
      <motion.div 
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent"
      />
    </div>
  );
};

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* High-end Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=2070&auto=format&fit=crop" 
          alt="Abstract Silk Texture"
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-cream/10 via-brand-cream/80 to-brand-cream" />
        
        {/* Animated Weaving Lines Layer */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 3, ease: "easeInOut" }}
            d="M0,50 C20,40 40,60 60,50 C80,40 100,60 100,50" 
            stroke="#0B1E33" fill="transparent" strokeWidth="0.05" 
          />
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
            d="M0,30 C30,50 70,10 100,30" 
            stroke="#D4AF37" fill="transparent" strokeWidth="0.05" 
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 z-10 text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {/* Subtle Logo Placement */}
          <div className="mb-12 flex justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="relative flex flex-col items-center"
            >
              <div className="absolute -inset-16 bg-brand-gold/5 blur-3xl rounded-full" />
              <span className="relative z-10 text-6xl md:text-8xl font-serif font-medium tracking-[0.2em] text-brand-navy">
                COAVE
              </span>
              <div className="relative z-10 w-24 md:w-32 h-[1px] bg-brand-gold/30 mt-4 overflow-hidden">
                <motion.div 
                  className="w-full h-full bg-brand-gold"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </div>

          <span className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.5em] font-medium mb-6 text-brand-navy/60">
            Professional Coaching Lab
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-light tracking-tighter leading-[1.1] mb-8">
            Dialogue <br />
            <span className="italic font-normal">as a Weaving Art</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-brand-navy/85 leading-relaxed mb-12 break-keep text-balance">
            당신의 일상이 예술이 되는 순간, <br className="hidden sm:block" />
            코에이브가 함께 대화로 삶의 문양을 엮어갑니다.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.02, backgroundColor: "#D4AF37" }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-brand-navy text-brand-cream text-xs uppercase tracking-[0.3em] font-bold transition-colors"
            >
              Explore Programs
            </motion.button>
            <motion.button 
              whileHover={{ x: 5 }}
              className="group flex items-center gap-3 text-xs uppercase tracking-[0.3em] font-bold"
            >
              Our Story <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-[1px] h-16 bg-gradient-to-b from-brand-navy/40 to-transparent" />
      </motion.div>
    </section>
  );
};

const SectionHeading = ({ title, subtitle, align = "center" }: { title: string; subtitle: string; align?: "center" | "left" }) => {
  return (
    <div className={`mb-16 ${align === "center" ? "text-center" : "text-left"}`}>
      <motion.span 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="text-[10px] uppercase tracking-[0.4em] text-brand-gold font-bold mb-4 block"
      >
        {subtitle}
      </motion.span>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="text-4xl md:text-6xl font-serif italic"
      >
        {title}
      </motion.h2>
    </div>
  );
};

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-brand-cream relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           whileInView={{ opacity: 1, x: 0 }}
           whileHover={{ y: -5 }}
           transition={{ duration: 1.8, ease: "easeOut" }}
           viewport={{ amount: 0.2 }}
           className="relative aspect-[4/5] max-h-[700px] overflow-hidden rounded-[2rem] shadow-2xl group"
        >
          <motion.img 
            src="/images/about.png" 
            alt="Professional Coaching Session" 
            className="w-full h-full object-cover object-top transition-transform duration-1000"
            whileHover={{ scale: 1.05 }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-navy/5 group-hover:bg-transparent transition-colors duration-500" />
          <motion.div 
            className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-gold/10 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 30 }}
           whileInView={{ opacity: 1, x: 0 }}
           transition={{ duration: 1.8, delay: 0.4, ease: "easeOut" }}
           viewport={{ amount: 0.2 }}
           className="space-y-8"
        >
          <SectionHeading 
            subtitle="The Concept" 
            title="Coaching + Weave" 
            align="left"
          />
          <div className="space-y-6 text-brand-navy/90 leading-relaxed font-light break-keep">
            <p>
              <strong>코에이브(COAVE)</strong>는 
              코칭(Coaching)과 엮다(Weave)의 합성어로, 코치와 코치이가 대화를 통해 흩어진 생각의 실타래를 정교하게 엮어 
              새로운 삶의 무늬를 만들어가는 과정을 상징합니다.
            </p>
            <p>
              우리는 단순히 답을 주는 것을 넘어, 당신이 이미 가지고 있는 지혜의 실들을 
              발견하고 그것이 아름다운 직물이 될 수 있도록 섬세하게 돕는 
              '라이프 위버(Life Weaver)'들의 안식처입니다.
            </p>
          </div>
          <div className="pt-4">
            <button className="text-xs uppercase tracking-[0.3em] font-bold border-b border-brand-navy/30 pb-2 hover:border-brand-navy transition-colors">
              Our Vision
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const CoachesSection = () => {
  const coaches = [
    {
      name: "김정향",
      role: "CEO / 대표코치",
      tags: ["PCC (ICF)", "KPC (한국코치협회)"],
      description: "심리학 기반의 정교한 코칭으로 개인과 조직의 잠재력을 깨우는 리더십 전문가입니다.",
      exp: [
        "성균관대 경영대학원 Global AMCP 수료",
        "코칭 리더십 및 코칭 역량 개발 전문",
        "아빈저 경영연구소 파트너 코치",
        "前 메가스터디 상담 코칭 전문가 활동",
        "前 웅진 씽크빅 팀장 / 최연소 지국장"
      ],
      image: "/images/kim.png"
    },
    {
      name: "이인주",
      role: "CEO / 대표코치",
      tags: ["KPC (한국코치협회)", "임상심리사"],
      description: "사람의 마음을 읽는 상담 심리 전문성을 바탕으로 조직의 본질적 변화를 이끕니다.",
      exp: [
        "성균관대 경영대학원 Global AMCP 수료",
        "상담 및 임상심리학 석사 / 교육공학 학사",
        "조직 문화 및 리더십 소통 전문가",
        "前 KT ACE강사 센터장",
        "前 고운소아청소년과 학습발달심리센터 실장"
      ],
      image: "/images/lee.png",
      position: "object-top"
    },
    {
      name: "이정은",
      role: "수석강사 / 전문코치",
      tags: ["공공기관 기업 컨설턴트", "KAC (한국코치협회)"],
      description: "현장의 풍부한 대화 경험을 통해 고객 가치를 창조하는 서비스 디자인 전문가입니다.",
      exp: [
        "이화여대 경영전문대학원 석사",
        "공공기관·기업 조직 문화 교육 전문가",
        "SOO컨설팅 전임강사",
        "前 (주)텐마인즈 조직문화 팀장",
        "前 스카이 서비스 아카데미 부원장"
      ],
      image: "/images/lee_je.jpg",
      position: "object-top"
    }
  ];

  return (
    <section id="coaches" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading 
          subtitle="Life Weavers" 
          title="Meet Our Experts" 
        />
        
        <div className="grid md:grid-cols-3 gap-12">
          {coaches.map((coach, i) => (
            <motion.div
              key={coach.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
              viewport={{ amount: 0.1 }}
              className="group"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] mb-8 bg-brand-cream">
                <img 
                  src={coach.image} 
                  alt={coach.name} 
                  className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${(coach as any).position || "object-center"}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-serif">{coach.name}</span>
                  <span className="text-xs uppercase tracking-widest font-bold text-brand-gold">{coach.role}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {coach.tags.map(tag => (
                    <span key={tag} className="text-[11px] px-2.5 py-1 bg-brand-cream/80 text-brand-navy/80 font-bold uppercase tracking-widest rounded-full border border-brand-navy/5">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <p className="text-[15px] text-brand-navy/90 font-light leading-relaxed break-keep">
                  {coach.description}
                </p>
                
                <ul className="pt-4 border-t border-brand-navy/5 space-y-2.5 break-keep">
                  {coach.exp.map((item, idx) => (
                    <li key={idx} className="text-[13px] text-brand-navy/90 flex items-start gap-2 leading-snug">
                      <span className="text-brand-gold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProgramCard = ({ title, description, icon: Icon }: { title: string; description: string; icon: any }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-10 bg-white border border-brand-navy/5 group hover:border-brand-gold/30 transition-all rounded-[1.5rem]"
    >
      <div className="w-12 h-12 rounded-full border border-brand-navy/10 flex items-center justify-center mb-10 group-hover:bg-brand-navy group-hover:text-brand-cream transition-all">
        <Icon size={20} />
      </div>
      <h3 className="text-2xl font-serif mb-4 group-hover:text-brand-gold transition-colors">{title}</h3>
      <p className="text-sm text-brand-navy/85 font-light leading-relaxed mb-8 break-keep">
        {description}
      </p>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-0 group-hover:opacity-100 transition-all">
        View Details <ChevronRight size={12} />
      </div>
    </motion.div>
  );
};

const ProgramsSection = () => {
  const programs = [
    {
      title: "Individual Growth",
      description: "개인의 잠재력을 깨우고 더 나은 삶의 방향을 설계하는 일대일 맞춤형 코칭 서비스입니다. 내면의 소리에 집중하는 시간을 마련합니다.",
      icon: Heart
    },
    {
      title: "Executive Excellence",
      description: "리더십의 본질을 탐구하고 조직의 성장을 견인할 수 있는 탁월한 인사이트를 구축하는 최고경영자 및 핵심 인재 코칭입니다.",
      icon: Compass
    },
    {
      title: "Creative Workshops",
      description: "함께 대화하고 공유하며 서로에게 영감을 주는 그룹 세션 및 주제별 워크숍을 통해 집단 지성의 힘을 경험합니다.",
      icon: Lightbulb
    }
  ];

  return (
    <section id="programs" className="py-24 bg-[#F8F6F2]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <SectionHeading 
          subtitle="Our Lab" 
          title="Curated Programs" 
        />
        <div className="grid md:grid-cols-3 gap-8">
          {programs.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
              viewport={{ amount: 0.1 }}
            >
              <ProgramCard {...p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PhilosophySection = () => {
  return (
    <section id="philosophy" className="py-32 relative overflow-hidden bg-brand-navy text-brand-cream">
      <div className="absolute top-0 left-0 w-full opacity-10">
        <WeavingLine />
      </div>
      <div className="absolute bottom-0 left-0 w-full opacity-10">
        <WeavingLine />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 2, ease: "easeOut" }}
           viewport={{ amount: 0.3, margin: "-50px" }}
           className="max-w-4xl mx-auto"
        >
          <Quote className="mx-auto mb-10 text-brand-rose opacity-60" size={40} />
          <h2 className="text-4xl md:text-6xl font-serif italic mb-12 leading-tight">
            "The beauty of coaching lies in <br />
            <span className="text-brand-gold">the invisible threads</span> that connect us."
          </h2>
          <div className="w-16 h-px bg-brand-rose/30 mx-auto mb-12" />
          <div className="space-y-3">
            <p className="text-xl md:text-2xl font-light italic text-brand-cream/90 font-serif break-keep">
              코칭은 단순한 대화가 아닙니다.
            </p>
            <p className="text-lg md:text-xl font-light italic text-brand-cream/70 font-serif break-keep">
              그것은 서로의 영혼이 만나 함께 성장이라는 거대한 문양을 수놓는 숭고한 예술 행위입니다.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading 
              subtitle="Voices" 
              title="Shared Moments" 
              align="left"
            />
            <div className="space-y-12">
              <motion.div 
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 className="relative pl-12"
              >
                <div className="absolute left-0 top-0 text-brand-rose font-serif text-6xl">“</div>
                <p className="text-xl font-serif mb-4 leading-relaxed italic break-keep">
                  처음 방문했을 때의 불안함은 상담이 진행될수록 저만의 확신으로 바뀌었습니다. 코치님과 함께 제 삶의 실타래를 정리한 기분이에요.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-brand-navy/20" />
                  <span className="text-xs uppercase tracking-widest font-bold text-brand-navy/60">Creative Director, B. Kim</span>
                </div>
              </motion.div>
              
              <motion.div 
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 transition={{ delay: 0.3 }}
                 className="relative pl-12"
              >
                <div className="absolute left-0 top-0 text-brand-rose font-serif text-6xl">“</div>
                <p className="text-xl font-serif mb-4 leading-relaxed italic break-keep">
                  리더로서의 무게감이 버거울 때 코에이브는 유일한 탈출구이자 충전소였습니다. 훨씬 더 유연하고 단단한 소통 방식을 배웠습니다.
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-px bg-brand-navy/20" />
                  <span className="text-xs uppercase tracking-widest font-bold text-brand-navy/60">CEO of Tech Startup, L. Min</span>
                </div>
              </motion.div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-4 pt-12">
                <div className="h-64 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/seed/calm/400/600" alt="Calm" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="h-48 rounded-full border border-brand-navy/10 flex items-center justify-center p-8 text-center text-[10px] uppercase tracking-widest font-bold">
                  200+ <br /> Lives woven
                </div>
             </div>
             <div className="space-y-4">
                <div className="h-48 rounded-full bg-brand-navy flex items-center justify-center text-brand-cream text-3xl font-serif italic">
                  98%
                </div>
                <div className="h-96 rounded-full overflow-hidden">
                  <img src="https://picsum.photos/seed/serene/400/800" alt="Serene" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactSection = () => {
  const [state, setState] = useState<{ status: "idle" | "submitting" | "success" | "error" }>({ status: "idle" });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ status: "submitting" });
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch("https://formspree.io/f/mlgzqakz", {
        method: "POST",
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setState({ status: "success" });
        (e.target as HTMLFormElement).reset();
      } else {
        setState({ status: "error" });
      }
    } catch (error) {
      setState({ status: "error" });
    }
  };

  return (
    <section id="contact" className="py-24 bg-brand-navy text-brand-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ amount: 0.2 }}
          >
            <SectionHeading 
              subtitle="Connect" 
              title="Start Your Journey" 
              align="left"
            />
            <p className="text-brand-cream/85 font-light mb-12 max-w-md break-keep">
              당신의 성장을 위한 첫 번째 대화를 시작하세요. <br />
              코에이브의 문은 정기적인 코칭 상담을 원하는 분들에게 <br />
              언제나 열려있습니다.
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <span className="text-sm tracking-wider">coaveadmin@gmail.com</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center">
                  <Instagram size={16} />
                </div>
                <span className="text-sm tracking-wider">@coave_coaching</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full border border-brand-cream/20 flex items-center justify-center">
                  <Linkedin size={16} />
                </div>
                <span className="text-sm tracking-wider">Coave Coaching Lab</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            viewport={{ amount: 0.2 }}
            className="bg-white/5 backdrop-blur-sm p-10 rounded-[2rem] border border-white/10"
          >
            {state.status === "success" ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="text-brand-gold" />
                </div>
                <h3 className="text-2xl font-serif mb-4">감사합니다.</h3>
                <p className="text-brand-cream/60 font-light text-sm">
                  메시지가 성공적으로 전달되었습니다.<br />
                  빠른 시일 내에 연락드리겠습니다.
                </p>
                <button 
                  onClick={() => setState({ status: "idle" })}
                  className="mt-8 text-[10px] uppercase tracking-widest font-bold border-b border-brand-cream/20 pb-1"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <label htmlFor="full-name" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Full Name</label>
                  <input 
                    id="full-name"
                    name="name" 
                    type="text" 
                    required
                    className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all" 
                  />
                </div>
                <div className="space-y-4">
                  <label htmlFor="email-address" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Email Address</label>
                  <input 
                    id="email-address"
                    name="email" 
                    type="email" 
                    required
                    className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all" 
                  />
                </div>
                <div className="space-y-4">
                  <label htmlFor="service-type" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Type of Service</label>
                  <div className="relative">
                    <select 
                      id="service-type"
                      name="service"
                      required
                      defaultValue=""
                      className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-brand-navy">문의 유형을 선택해주세요</option>
                      <option className="bg-brand-navy">코치 더 코치</option>
                      <option className="bg-brand-navy">코칭 강의</option>
                      <option className="bg-brand-navy">기타</option>
                    </select>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <label htmlFor="message" className="text-[10px] uppercase tracking-widest font-bold block opacity-60">Message</label>
                  <textarea 
                    id="message"
                    name="message" 
                    rows={4} 
                    required
                    className="w-full bg-transparent border-b border-brand-cream/20 py-2 focus:ring-0 focus:border-brand-gold outline-none transition-all resize-none" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={state.status === "submitting"}
                  className="w-full py-4 bg-brand-cream text-brand-navy text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold hover:text-brand-cream transition-all disabled:opacity-50"
                >
                  {state.status === "submitting" ? "Sending..." : "Send Message"}
                </button>
                {state.status === "error" && (
                  <p className="text-brand-rose text-[10px] text-center mt-2">
                    오류가 발생했습니다. 잠시 후 다시 시도해주세요.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 bg-brand-cream border-t border-brand-navy/5">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="mb-6">
          <span className="text-2xl font-serif font-bold tracking-[0.2em] text-brand-navy">COAVE</span>
          <div className="w-8 h-px bg-brand-gold/40 mx-auto mt-2" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] font-medium text-brand-navy/40 mb-8">
          &copy; {new Date().getFullYear()} Coave Coaching Lab. Designed with elegance.
        </p>
        <div className="flex justify-center gap-6 opacity-40">
           <a href="#" className="hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest">Privacy</a>
           <a href="#" className="hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest">Terms</a>
           <a href="#" className="hover:text-brand-gold transition-colors text-[10px] uppercase tracking-widest">Sitemap</a>
        </div>
      </div>
    </footer>
  );
};

// --- Main App ---

export default function App() {
  return (
    <div className="selection:bg-brand-gold selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <AboutSection />
        <CoachesSection />
        <ProgramsSection />
        <PhilosophySection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
