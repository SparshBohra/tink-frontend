import { useEffect, useRef, useState } from 'react';

interface Testimonial {
  quote: string;
  authorInitials: string;
  authorName: string;
  authorTitle: string;
  rooms: number;
  properties: number;
  companyInitials: string;
  color?: 'green' | 'purple' | 'amber' | 'blue';
}

const testimonials: Testimonial[] = [
  {
    quote:
      'Tink transformed our co-living operation from chaos to clarity. We\'ve reduced admin time by 70% and increased our occupancy rate to 98%. The WhatsApp integration alone has been a game-changer for tenant communication.',
    authorInitials: 'SC',
    authorName: 'Sarah Chen',
    authorTitle: 'Owner, Pacific Co-Living',
    rooms: 47,
    properties: 3,
    companyInitials: 'PC',
    color: 'blue',
  },
  {
    quote:
      'Before SquareFt, I was drowning in spreadsheets and WhatsApp group chats. Now everything is automated and organized. Our tenant satisfaction scores improved by 45% and we\'ve reduced vacancy periods to just 3 days on average.',
    authorInitials: 'MR',
    authorName: 'Michael Rodriguez',
    authorTitle: 'Property Manager, Urban Nest',
    rooms: 82,
    properties: 5,
    companyInitials: 'UN',
    color: 'green',
  },
  {
    quote:
      'The financial dashboard gives me real-time insights I never had before. We\'ve increased our profit margins by 35% through better pricing strategies and reduced our maintenance response time to under 2 hours.',
    authorInitials: 'JW',
    authorName: 'Jessica Wang',
    authorTitle: 'Founder, Collective Spaces',
    rooms: 156,
    properties: 12,
    companyInitials: 'CS',
    color: 'purple',
  },
  {
    quote:
      'Scaling from 1 to 8 properties would have been impossible without Tink. The automated rent collection and maintenance workflows have saved us countless hours. We\'ve grown our revenue by 300% in just 18 months.',
    authorInitials: 'DK',
    authorName: 'David Kim',
    authorTitle: 'CEO, Metro Living Group',
    rooms: 203,
    properties: 8,
    companyInitials: 'ML',
    color: 'amber',
  },
];

const AUTO_SCROLL_DELAY = 8000; // 8 seconds

export default function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, AUTO_SCROLL_DELAY);
    return () => {
      resetTimeout();
    };
  }, [index]);

  const goTo = (i: number) => {
    setIndex(i);
  };

  const prev = () => {
    setIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const next = () => {
    setIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <div className="testimonials-wrapper">
      <div className="carousel-container">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {testimonials.map((t, i) => (
            <div className="testimonial-card" key={i}>
              {/* Quote & Rating */}
              <div className="testimonial-header">
                <div className="testimonial-quote-icon">
                  {/* stylised opening quote icon */}
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                    <rect width="48" height="48" rx="24" fill="var(--primary-blue)" fillOpacity="0.1" />
                    <path
                      d="M16 20c-4 0-8 3.2-8 8s3.2 8 8 8c1.2 0 2.3-0.3 3.3-0.7L24 40V28c0-4.4-3.6-8-8-8zm16 0c-4 0-8 3.2-8 8s3.2 8 8 8c1.2 0 2.3-0.3 3.3-0.7L40 40V28c0-4.4-3.6-8-8-8z"
                      fill="var(--primary-blue)"
                    />
                  </svg>
                </div>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, s) => (
                    <span className="star" key={s}>★</span>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <blockquote className="testimonial-text">“{t.quote}”</blockquote>

              {/* Author */}
              <div className="testimonial-author">
                <div className={`avatar-placeholder ${t.color ?? 'blue'}`}>
                  <span className="avatar-initials">{t.authorInitials}</span>
                </div>
                <div className="author-info">
                  <cite className="author-name">{t.authorName}</cite>
                  <p className="author-title">{t.authorTitle}</p>
                  <div className="property-stats">
                    <span className="stat-number">{t.rooms}</span>
                    <span className="stat-label">Rooms</span>
                    <span className="stat-divider">•</span>
                    <span className="stat-number">{t.properties}</span>
                    <span className="stat-label">Properties</span>
                  </div>
                </div>
                <div className={`company-logo ${t.color ?? 'blue'}`}>
                  <span className="logo-text">{t.companyInitials}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="testimonials-navigation">
        <button className="nav-button prev" onClick={prev} aria-label="Previous testimonial">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === index ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
            ></button>
          ))}
        </div>
        <button className="nav-button next" onClick={next} aria-label="Next testimonial">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .testimonials-wrapper {
          position: relative;
          z-index: 2;
        }
        
        .carousel-container {
          overflow: hidden;
          border-radius: 20px;
          margin-bottom: 2rem;
        }
        
        .carousel-track {
          display: flex;
          transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
          animation: none !important;
        }
        
        .testimonial-card {
          min-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box;
          background: white;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 20px 40px -12px rgba(37, 99, 235, 0.15);
          border: 1px solid rgba(37, 99, 235, 0.1);
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .testimonial-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--primary-blue) 0%, var(--info-purple) 100%);
        }
        
        .testimonial-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .testimonial-quote-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .testimonial-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .star {
          color: #fbbf24;
          font-size: 1.25rem;
        }
        
        .testimonial-text {
          font-size: 1.375rem;
          line-height: 1.7;
          color: var(--gray-800);
          font-weight: 400;
          margin: 0 0 2.5rem 0;
          font-style: normal;
          position: relative;
        }
        
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-top: 2rem;
          border-top: 1px solid var(--gray-200);
        }
        
        .avatar-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid;
          flex-shrink: 0;
        }
        
        .avatar-placeholder.blue {
          background: var(--primary-blue);
          border-color: var(--primary-blue);
        }
        
        .avatar-placeholder.green {
          background: var(--success-green);
          border-color: var(--success-green);
        }
        
        .avatar-placeholder.purple {
          background: var(--info-purple);
          border-color: var(--info-purple);
        }
        
        .avatar-placeholder.amber {
          background: var(--warning-amber);
          border-color: var(--warning-amber);
        }
        
        .avatar-initials {
          font-weight: 700;
          color: white;
          font-size: 1.125rem;
        }
        
        .author-info {
          flex: 1;
        }
        
        .author-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 0.25rem;
          display: block;
          font-style: normal;
        }
        
        .author-title {
          font-size: 0.975rem;
          color: var(--gray-600);
          margin: 0 0 0.75rem 0;
          font-weight: 500;
        }
        
        .property-stats {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--gray-500);
        }
        
        .stat-number {
          font-weight: 700;
          color: var(--primary-blue);
        }
        
        .stat-label {
          font-weight: 500;
        }
        
        .stat-divider {
          color: var(--gray-400);
        }
        
        .company-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .company-logo.blue {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
        }
        
        .company-logo.green {
          background: linear-gradient(135deg, var(--success-green) 0%, #059669 100%);
        }
        
        .company-logo.purple {
          background: linear-gradient(135deg, var(--info-purple) 0%, #7c3aed 100%);
        }
        
        .company-logo.amber {
          background: linear-gradient(135deg, var(--warning-amber) 0%, #d97706 100%);
        }
        
        .logo-text {
          font-weight: 700;
          color: white;
          font-size: 1rem;
        }
        
        /* Navigation Styles */
        .testimonials-navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .nav-button {
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--info-purple) 100%);
          color: #fff;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.35);
          transition: transform 0.3s ease, opacity 0.3s ease;
          cursor: pointer;
        }
        
        .nav-button:hover {
          transform: translateY(-2px) scale(1.05);
          opacity: 0.9;
        }
        
        .nav-button:active {
          transform: translateY(0) scale(0.95);
        }
        
        .testimonial-dots {
          display: flex;
          gap: 0.75rem;
        }
        
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--gray-300);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .dot.active {
          background: var(--primary-blue);
          transform: scale(1.3);
        }
        
        .dot:hover:not(.active) {
          background: var(--primary-blue);
          opacity: 0.7;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .testimonial-card {
            padding: 2rem;
          }
          
          .testimonial-text {
            font-size: 1.125rem;
          }
          
          .testimonial-author {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .author-info {
            text-align: left;
          }
          
          .company-logo {
            align-self: flex-start;
          }
          
          .testimonials-navigation {
            gap: 1.5rem;
          }
          
          .nav-button {
            width: 44px;
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
} 