import Head from 'next/head';
import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { Phone, ArrowRight } from 'lucide-react';
import MapboxAddressAutocomplete from '../components/MapboxAddressAutocomplete';

const propertyListings = [
  {
    type: 'For Rent',
    price: '$3,200/mo',
    beds: 4,
    baths: 3,
    sqft: '2,400',
    photos: [
      '/landingPage/house1/house1a.webp',
      '/landingPage/house1/house1b.webp',
      '/landingPage/house1/house1c.webp',
      '/landingPage/house1/house1d.webp',
    ],
  },
  {
    type: 'For Rent',
    price: '$2,850/mo',
    beds: 2,
    baths: 2,
    sqft: '1,200',
    photos: [
      '/landingPage/house2/house2a.webp',
      '/landingPage/house2/house2b.webp',
      '/landingPage/house2/house2c.webp',
    ],
  },
  {
    type: 'For Rent',
    price: '$4,500/mo',
    beds: 3,
    baths: 2.5,
    sqft: '1,850',
    photos: [
      '/landingPage/house3/house3a.webp',
      '/landingPage/house3/house3b.webp',
      '/landingPage/house3/house3c.webp',
    ],
  },
  {
    type: 'For Rent',
    price: '$2,200/mo',
    beds: 1,
    baths: 1,
    sqft: '750',
    photos: [
      '/landingPage/house4/house4a.webp',
      '/landingPage/house4/house4b.webp',
      '/landingPage/house4/house4c.webp',
      '/landingPage/house4/house4d.webp',
    ],
  },
];

const aiTabsConfig = [
  { key: 'leasing', label: 'Leasing Inquiries', icon: 'clipboard' },
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
  { key: 'tenant', label: 'Tenant Questions', icon: 'question' },
  { key: 'moveinout', label: 'Move In/Out', icon: 'truck' },
  { key: 'amenities', label: 'Amenities', icon: 'home' },
  { key: 'logistics', label: 'Logistics', icon: 'calendar' },
];

const useCases = [
  { title: 'Answer calls 24/7', desc: 'Never miss a tour request or FAQ from prospects.' },
  { title: 'Book showings instantly', desc: 'Share times, confirm on the spot, and send reminders.' },
  { title: 'Triage maintenance', desc: 'Capture details, route vendors, and keep tenants updated.' },
  { title: 'Spin up listings', desc: 'AI-staged photos and copy you can post or text immediately.' },
];

const steps = [
  { title: 'Turn on the AI line', desc: 'We pick up calls/texts for your listings instantly.' },
  { title: 'Book tours & screen leads', desc: 'Prospects choose times; you get confirmed calendar events.' },
  { title: 'Dispatch maintenance', desc: 'We collect details, notify tenants, and loop in vendors.' },
];

const faqs = [
  { q: 'Is SquareFt really free?', a: 'Creating listings is free during closed beta. You get AI descriptions and virtual staging at no cost.' },
  { q: 'Can I publish to Zillow or Apartments.com?', a: 'Integrations are coming soon. Today you can share links or copy listing details easily.' },
  { q: 'Can it handle maintenance?', a: 'Yes. The AI triages issues, gathers details, and keeps tenants updated while dispatching vendors.' },
  { q: 'What if the AI gets stuck?', a: 'It escalates to you via text/email/transfer based on your preferences.' },
  { q: 'How many properties can I manage?', a: 'No limits during closed beta—built for single units up to large portfolios.' },
  { q: 'Is my data secure?', a: 'We use bank-level encryption, do not sell data, and restrict access to recordings.' },
  { q: 'What’s included in closed beta?', a: 'AI listings (virtual staging + copy), AI voice operations, and priority input on the roadmap.' },
];

type AddressComponents = {
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
};

export default function MobileLanding() {
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [activeAiTab, setActiveAiTab] = useState('leasing');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentListingIndex((prev) => (prev + 1) % propertyListings.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const propertyCard = propertyListings[currentListingIndex];
  const handleAddressSelect = (addressComponents: AddressComponents) => {
    setAddressInput(addressComponents.address_line1);
  };

  return (
    <>
      <Head>
        <title>SquareFt | Mobile Landing</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Mobile-first version of the SquareFt landing page with the same sections, images, and boxes as the primary experience."
        />
        <link href="https://assets.calendly.com/assets/external/widget.css" rel="stylesheet" />
      </Head>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />

      <main className="page">
        {/* Top Navigation */}
        <header className="topbar">
          <div className="brand">
            <img src="/logo1.png" alt="SquareFt" className="logo" />
          </div>
          <button
            className="menu-button"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>
          {menuOpen && (
            <div className="menu-drawer" role="menu">
              <Link href="/login" className="menu-item" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="tel:+18573178479" className="menu-item accent" onClick={() => setMenuOpen(false)}>Try AI Property Manager</Link>
              <Link href="#faq" className="menu-item" onClick={() => setMenuOpen(false)}>Frequently Asked Questions</Link>
            </div>
          )}
        </header>

        {/* Voice AI Hero */}
        <section className="hero" id="top">
          <div className="hero-content">
          <h1>
            <span className="text-highlight">Your 24/7</span>{' '}
            <span className="text-main">AI Property Manager</span>
          </h1>
            <p className="subhead">
              An intelligent voice assistant that handles tenant calls, schedules viewings, and resolves maintenance issues
              around the clock so you never miss an opportunity.
            </p>
            <div className="schedule-demo-text">
              <button
                className="schedule-link"
                onClick={() => window?.Calendly?.initPopupWidget?.({ url: 'https://calendly.com/dakshhsaraf/30min' })}
              >
                Schedule Demo <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </div>
            <div className="button-wrapper">
              <a href="tel:+18573178479" className="green-call-button">
                <Phone size={18} />
                Try AI Property Manager
              </a>
            </div>
            <div className="avatars-row">
              <div className="avatars">
                <img src="https://i.pravatar.cc/150?img=12" alt="Manager" />
                <img src="https://i.pravatar.cc/150?img=33" alt="Manager" />
                <img src="https://i.pravatar.cc/150?img=47" alt="Manager" />
                <img src="https://i.pravatar.cc/150?img=68" alt="Manager" />
                <img src="https://i.pravatar.cc/150?img=5" alt="Manager" />
              </div>
              <div className="proof">
                <div className="proof-item">
                  <span className="proof-dot">•</span>
                  <span>Join closed beta with other property managers</span>
                </div>
                <div className="proof-item">
                  <span className="proof-dot">•</span>
                  <span>100+ daily calls handled</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-phone">
            <img src="/iphone2.png" alt="AI Property Manager Call" className="phone-img" />
          </div>
        </section>

        {/* Listing Section */}
        <section className="section listing" id="listing-section">
          <div className="section-header">
            <h2>Stage your property and create a free listing</h2>
            <p className="subhead">Enter your address to get started</p>
          </div>
          <form className="address-form" onSubmit={(e) => e.preventDefault()}>
            <div className="input-wrap mapbox">
              <span className="input-icon">📍</span>
              <MapboxAddressAutocomplete
                id="address"
                name="address"
                value={addressInput}
                onChange={setAddressInput}
                onAddressSelect={handleAddressSelect}
                placeholder="Eg: 2401 Saint St, #5A, San Francisco, CA"
                usePlaceName
                className="mobile-address-input"
              />
            </div>
            <div className="button-wrapper">
              <button className="btn primary submit-btn" type="submit">Submit</button>
            </div>
          </form>
          <div className="platforms">
            <p className="platform-note">Integration with leading listing platforms coming soon</p>
            <div className="platform-logos">
              <img src="/media/zillow.png" alt="Zillow" />
              <img src="/media/Apartments.webp" alt="Apartments.com" />
              <img src="/media/Realtor.com_logo.png" alt="Realtor.com" />
              <img src="/media/trulia-png.webp" alt="Trulia" />
            </div>
            <div className="fb-marketplace-row">
              <div className="fb-marketplace">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Marketplace</span>
              </div>
            </div>
          </div>

          <article className="property-card">
            <div className="photo-grid">
              {propertyCard.photos.slice(0, 3).map((src, i) => (
                <img key={src} src={src} alt={`Listing photo ${i + 1}`} />
              ))}
            </div>
            <div className="badges-row">
              <span className="property-pill">{propertyCard.type}</span>
              <span className="property-price">{propertyCard.price}</span>
            </div>
            <div className="details-row">
              <span>{propertyCard.beds} beds</span>
              <span>{propertyCard.baths} baths</span>
              <span>{propertyCard.sqft} sqft</span>
            </div>
          </article>
        </section>

        {/* AI Handles Everything */}
        <section className="ai-demo-section" id="ai">
          <div className="ai-demo-container">
            <div className="ai-demo-header">
              <h2 className="ai-demo-title">AI Handles Everything</h2>
              <p className="ai-demo-subtitle">Natural conversations. Instant actions. Zero missed opportunities.</p>
            </div>

            <div className="ai-demo-interface">
              <div className="ai-demo-tabs">
                {aiTabsConfig.map((tab) => (
                  <button 
                    key={tab.key}
                    className={`ai-tab ${activeAiTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveAiTab(tab.key)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="ai-demo-content">
                {/* Leasing Inquiries Tab */}
                {activeAiTab === 'leasing' && (
                  <>
                    <div className="ai-conversation-panel">
                      <div className="caller-info">
                        <div className="caller-avatar">
                          <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Leslie" />
                        </div>
                        <div className="caller-details">
                          <span className="caller-name">Leslie</span>
                          <span className="caller-divider">|</span>
                          <span className="caller-property">412 Market Street</span>
                        </div>
                        <span className="call-time">3:28 PM <span className="timezone">EST</span></span>
                      </div>

                      <div className="user-message">
                        <p>Hello, This apartment seems perfect and I am interested in setting up a showing!</p>
                      </div>

                      <div className="ai-response-container">
                        <div className="ai-operator-info">
                          <div className="audio-wave-icon">
                            <span></span><span></span><span></span><span></span>
                          </div>
                          <span className="operator-name">Lisa</span>
                          <span className="operator-divider">|</span>
                          <span className="audio-duration">Audio 01:05</span>
                        </div>

                        <div className="ai-message">
                          <p>Hi Leslie, I'd be happy to help with that! We currently have a 1-bedroom on the 3rd floor available at 412 Market Street. It features hardwood floors, in-unit laundry, and a balcony with a city view.</p>
                          <p>Our next available tour slots are tomorrow at 11 AM, or Friday at 2 PM. Which one works better for you? I'll also email you a brochure and a virtual walk-through video in case you'd like to preview before your visit.</p>
                        </div>
                      </div>
                      
                      <div className="powered-by">POWERED BY SQUAREFT</div>
                    </div>

                    <div className="ai-status-panel">
                      <div className="audio-player">
                        <button className="play-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="audio-progress">
                          <div className="audio-bar"></div>
                        </div>
                      </div>

                      <div className="status-badges">
                        <div className="status-badge blue">Status: In-Progress</div>
                        <div className="status-badge purple">Priority: Routine</div>
                        <div className="status-badge green">Sentiment: Positive</div>
                      </div>

                      <div className="action-badges">
                        <div className="action-badge">✓ Tour Scheduled</div>
                        <div className="action-badge">✓ Brochure Sent</div>
                      </div>

                      <div className="doc-badges">
                        <div className="doc-badge">Docs: Leasing_Inquiry</div>
                        <div className="doc-badge">Tour_Scheduling</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Maintenance Tab */}
                {activeAiTab === 'maintenance' && (
                  <>
                    <div className="ai-conversation-panel">
                      <div className="caller-info">
                        <div className="caller-avatar">
                          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Marcus" />
                        </div>
                        <div className="caller-details">
                          <span className="caller-name">Marcus</span>
                          <span className="caller-divider">|</span>
                          <span className="caller-property">Unit 4B, Parkview Apartments</span>
                        </div>
                        <span className="call-time">11:42 PM <span className="timezone">EST</span></span>
                      </div>

                      <div className="user-message">
                        <p>My heater stopped working and it's freezing in here. Can someone come look at it?</p>
                      </div>

                      <div className="ai-response-container">
                        <div className="ai-operator-info">
                          <div className="audio-wave-icon">
                            <span></span><span></span><span></span><span></span>
                          </div>
                          <span className="operator-name">Robbie</span>
                          <span className="operator-divider">|</span>
                          <span className="audio-duration">Audio 00:48</span>
                        </div>

                        <div className="ai-message">
                          <p>I'm really sorry to hear that, Marcus. I understand how uncomfortable that must be, especially at this hour.</p>
                          <p>I've flagged this as an urgent maintenance request and our on-call technician Mike will be there within 2 hours. In the meantime, I've sent you a text with portable heater pickup locations nearby if needed.</p>
                        </div>
                      </div>
                      
                      <div className="powered-by">POWERED BY SQUAREFT</div>
                    </div>

                    <div className="ai-status-panel">
                      <div className="audio-player">
                        <button className="play-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="audio-progress">
                          <div className="audio-bar" style={{width: '45%'}}></div>
                        </div>
                      </div>

                      <div className="status-badges">
                        <div className="status-badge orange">Status: Urgent</div>
                        <div className="status-badge red">Priority: High</div>
                        <div className="status-badge yellow">Sentiment: Concerned</div>
                      </div>

                      <div className="action-badges">
                        <div className="action-badge">✓ Technician Dispatched</div>
                        <div className="action-badge">✓ SMS Sent</div>
                      </div>

                      <div className="doc-badges">
                        <div className="doc-badge">Docs: Maintenance_Request</div>
                        <div className="doc-badge">Emergency_Protocol</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Tenant Questions Tab */}
                {activeAiTab === 'tenant' && (
                  <>
                    <div className="ai-conversation-panel">
                      <div className="caller-info">
                        <div className="caller-avatar">
                          <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="Erin" />
                        </div>
                        <div className="caller-details">
                          <span className="caller-name">Erin</span>
                          <span className="caller-divider">|</span>
                          <span className="caller-property">Canyon Ridge, Unit 302</span>
                        </div>
                        <span className="call-time">2:15 PM <span className="timezone">EST</span></span>
                      </div>

                      <div className="user-message">
                        <p>Hi, I need to add my partner to the lease. What's the process for that?</p>
                      </div>

                      <div className="ai-response-container">
                        <div className="ai-operator-info">
                          <div className="audio-wave-icon">
                            <span></span><span></span><span></span><span></span>
                          </div>
                          <span className="operator-name">Frank</span>
                          <span className="operator-divider">|</span>
                          <span className="audio-duration">Audio 01:22</span>
                        </div>

                        <div className="ai-message">
                          <p>Hi Erin! Great question. Adding a partner to your lease is straightforward. They'll need to complete a standard background check and provide proof of income.</p>
                          <p>I've just emailed you the "Add Occupant" form. Once your partner fills it out, we typically process these within 3-5 business days. Would you like me to schedule a call with our leasing team to answer any other questions?</p>
                        </div>
                      </div>
                      
                      <div className="powered-by">POWERED BY SQUAREFT</div>
                    </div>

                    <div className="ai-status-panel">
                      <div className="audio-player">
                        <button className="play-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="audio-progress">
                          <div className="audio-bar" style={{width: '60%'}}></div>
                        </div>
                      </div>

                      <div className="status-badges">
                        <div className="status-badge green">Status: Resolved</div>
                        <div className="status-badge purple">Priority: Routine</div>
                        <div className="status-badge green">Sentiment: Neutral</div>
                      </div>

                      <div className="action-badges">
                        <div className="action-badge">✓ Form Sent</div>
                        <div className="action-badge">✓ Follow-up Scheduled</div>
                      </div>

                      <div className="doc-badges">
                        <div className="doc-badge">Docs: Lease_Amendment</div>
                        <div className="doc-badge">Add_Occupant_Form</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Move In/Out Tab */}
                {activeAiTab === 'moveinout' && (
                  <>
                    <div className="ai-conversation-panel">
                      <div className="caller-info">
                        <div className="caller-avatar">
                          <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Jason" />
                        </div>
                        <div className="caller-details">
                          <span className="caller-name">Jason</span>
                          <span className="caller-divider">|</span>
                          <span className="caller-property">555 Oak Street, Apt 12</span>
                        </div>
                        <span className="call-time">10:30 AM <span className="timezone">EST</span></span>
                      </div>

                      <div className="user-message">
                        <p>I'm moving out next month. What do I need to do to get my security deposit back?</p>
                      </div>

                      <div className="ai-response-container">
                        <div className="ai-operator-info">
                          <div className="audio-wave-icon">
                            <span></span><span></span><span></span><span></span>
                          </div>
                          <span className="operator-name">Lisa</span>
                          <span className="operator-divider">|</span>
                          <span className="audio-duration">Audio 01:45</span>
                        </div>

                        <div className="ai-message">
                          <p>Hi Jason, thanks for letting us know! To ensure a smooth move-out and full deposit return, here's what you'll need:</p>
                          <p>1) Schedule your move-out inspection (I can book that now), 2) Return all keys and parking passes, 3) Leave the unit in clean, broom-swept condition. I've just texted you our move-out checklist. Would you like to schedule your inspection for the last day of your lease?</p>
                        </div>
                      </div>
                      
                      <div className="powered-by">POWERED BY SQUAREFT</div>
                    </div>

                    <div className="ai-status-panel">
                      <div className="audio-player">
                        <button className="play-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="audio-progress">
                          <div className="audio-bar" style={{width: '25%'}}></div>
                        </div>
                      </div>

                      <div className="status-badges">
                        <div className="status-badge blue">Status: In-Progress</div>
                        <div className="status-badge purple">Priority: Routine</div>
                        <div className="status-badge green">Sentiment: Positive</div>
                      </div>

                      <div className="action-badges">
                        <div className="action-badge">✓ Checklist Sent</div>
                        <div className="action-badge">✓ Notice Logged</div>
                      </div>

                      <div className="doc-badges">
                        <div className="doc-badge">Docs: Move_Out_Notice</div>
                        <div className="doc-badge">Inspection_Schedule</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Amenities Tab */}
                {activeAiTab === 'amenities' && (
                  <>
                    <div className="ai-conversation-panel">
                      <div className="caller-info">
                        <div className="caller-avatar">
                          <img src="https://randomuser.me/api/portraits/women/22.jpg" alt="Sarah" />
                        </div>
                        <div className="caller-details">
                          <span className="caller-name">Sarah</span>
                          <span className="caller-divider">|</span>
                          <span className="caller-property">The Heights, Unit 1804</span>
                        </div>
                        <span className="call-time">5:40 PM <span className="timezone">EST</span></span>
                      </div>

                      <div className="user-message">
                        <p>Do we have a gym and where is the package room located?</p>
                      </div>

                      <div className="ai-response-container">
                        <div className="ai-operator-info">
                          <div className="audio-wave-icon">
                            <span></span><span></span><span></span><span></span>
                          </div>
                          <span className="operator-name">Frank</span>
                          <span className="operator-divider">|</span>
                          <span className="audio-duration">Audio 01:12</span>
                        </div>

                        <div className="ai-message">
                          <p>Hi Sarah! Yes, we have a fully equipped fitness center located in Building C, ground floor near the east side entrance. It's open 24/7 and your key fob gives you access.</p>
                          <p>The package room is right next to the main lobby on the first floor—you'll get an automated text whenever a package arrives. Would you like me to send you a property map showing all amenity locations?</p>
                        </div>
                      </div>
                      
                      <div className="powered-by">POWERED BY SQUAREFT</div>
                    </div>

                    <div className="ai-status-panel">
                      <div className="audio-player">
                        <button className="play-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="audio-progress">
                          <div className="audio-bar" style={{width: '80%'}}></div>
                        </div>
                      </div>

                      <div className="status-badges">
                        <div className="status-badge green">Status: Resolved</div>
                        <div className="status-badge purple">Priority: Low</div>
                        <div className="status-badge green">Sentiment: Neutral</div>
                      </div>

                      <div className="action-badges">
                        <div className="action-badge">✓ Map Offered</div>
                      </div>

                      <div className="doc-badges">
                        <div className="doc-badge">Docs: Amenity_FAQ</div>
                        <div className="doc-badge">Property_Map</div>
                      </div>
                    </div>
                  </>
                )}

                {/* Logistics Tab */}
                {activeAiTab === 'logistics' && (
                  <>
                    <div className="ai-conversation-panel">
                      <div className="caller-info">
                        <div className="caller-avatar">
                          <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="David" />
                        </div>
                        <div className="caller-details">
                          <span className="caller-name">David</span>
                          <span className="caller-divider">|</span>
                          <span className="caller-property">888 Oak Avenue</span>
                        </div>
                        <span className="call-time">9:15 AM <span className="timezone">EST</span></span>
                      </div>

                      <div className="user-message">
                        <p>I'm moving in next week. Where do I pick up my keys and parking pass?</p>
                      </div>

                      <div className="ai-response-container">
                        <div className="ai-operator-info">
                          <div className="audio-wave-icon">
                            <span></span><span></span><span></span><span></span>
                          </div>
                          <span className="operator-name">Lisa</span>
                          <span className="operator-divider">|</span>
                          <span className="audio-duration">Audio 01:08</span>
                        </div>

                        <div className="ai-message">
                          <p>Welcome, David! You can pick up your keys and parking pass from our leasing office at 888 Oak Avenue, Suite 100. Office hours are Monday-Friday 9AM-6PM and Saturday 10AM-4PM.</p>
                          <p>I've scheduled a key pickup appointment for you on your move-in date at 10 AM. I'll also text you the elevator reservation form for your moving day. Is there anything else you need?</p>
                        </div>
                      </div>
                      
                      <div className="powered-by">POWERED BY SQUAREFT</div>
                    </div>

                    <div className="ai-status-panel">
                      <div className="audio-player">
                        <button className="play-button">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </button>
                        <div className="audio-progress">
                          <div className="audio-bar" style={{width: '55%'}}></div>
                        </div>
                      </div>

                      <div className="status-badges">
                        <div className="status-badge green">Status: Resolved</div>
                        <div className="status-badge purple">Priority: Routine</div>
                        <div className="status-badge green">Sentiment: Excited</div>
                      </div>

                      <div className="action-badges">
                        <div className="action-badge">✓ Appointment Scheduled</div>
                        <div className="action-badge">✓ Forms Sent</div>
                      </div>

                      <div className="doc-badges">
                        <div className="doc-badge">Docs: Move_In_Guide</div>
                        <div className="doc-badge">Elevator_Reservation</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>


        {/* Listing Creation */}
        <section className="section listing-creation" id="listing-creation">
          <div className="solution-block">
            <div className="solution-label">
              <span className="label-dot"></span>
              Listing Creation
            </div>
            <h2 className="solution-headline">
              From address to<br/>
              <span className="headline-accent">market-ready listing</span><br/>
              in under a minute
            </h2>
            <p className="solution-description">
              Enter any property address. Our AI pulls photos, generates stunning virtual staging, 
              writes compelling descriptions, and creates a complete listing—ready to attract renters.
            </p>
            
            <div className="process-steps">
              <div className="process-step">
                <span className="step-num">01</span>
                <div className="step-info">
                  <h4>Enter Address</h4>
                  <p>Type your property address</p>
                </div>
              </div>
              <div className="process-step">
                <span className="step-num">02</span>
                <div className="step-info">
                  <h4>AI Stages & Writes</h4>
                  <p>Virtual staging + pro copy</p>
                </div>
              </div>
              <div className="process-step">
                <span className="step-num">03</span>
                <div className="step-info">
                  <h4>Publish Free</h4>
                  <p>Share your listing instantly</p>
                </div>
              </div>
              <div className="process-step coming-soon-step">
                <span className="step-num">04</span>
                <div className="step-info">
                  <h4>Platform Integrations <span className="coming-soon-badge">Coming Soon</span></h4>
                  <p>Zillow, Apartments.com & more</p>
                </div>
              </div>
            </div>

            <button className="solution-cta" onClick={() => document.getElementById('listing-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Try it free - Enter your address
            </button>
          </div>
        </section>

        {/* Property Operations */}
        <section className="section operations" id="operations">
          <div className="solution-block">
            <div className="solution-label operations-label">
              <span className="label-dot operations-dot"></span>
              Property Operations
            </div>
            <h2 className="solution-headline">
              Never miss a call.<br/>
              <span className="headline-accent-green">Never lose a lead.</span>
            </h2>
            <p className="solution-description">
              Your AI team handles phone calls around the clock. Leasing inquiries get tours scheduled. 
              Maintenance issues get triaged and dispatched. You get updates—not interruptions.
            </p>
            
            <div className="process-steps">
              <div className="process-step">
                <span className="step-num ops-num">01</span>
                <div className="step-info">
                  <h4>Leasing Inquiries</h4>
                  <p>Schedule tours, send applications</p>
                </div>
              </div>
              <div className="process-step">
                <span className="step-num ops-num">02</span>
                <div className="step-info">
                  <h4>Maintenance Dispatch</h4>
                  <p>Triage issues, dispatch techs</p>
                </div>
              </div>
              <div className="process-step">
                <span className="step-num ops-num">03</span>
                <div className="step-info">
                  <h4>Tenant Support</h4>
                  <p>Answer questions instantly</p>
                </div>
              </div>
              <div className="process-step">
                <span className="step-num ops-num">04</span>
                <div className="step-info">
                  <h4>Smart Escalation</h4>
                  <p>Knows when to involve you</p>
                </div>
              </div>
            </div>

            <a href="tel:+18573178479" className="solution-cta operations-cta-btn">
              <Phone size={18} />
              Try a demo call
            </a>
          </div>
        </section>

        {/* How It Works */}
        <section className="section how" id="how">
          <h2 className="how-title">How it works?</h2>
          <ol className="steps">
            {steps.map((step, idx) => (
              <li key={step.title}>
                <span className="step-number">{idx + 1}</span>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="section faq" id="faq" aria-label="Frequently asked questions">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          {faqs.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span className="faq-arrow">›</span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <img src="/logo1.png" alt="SquareFt" className="footer-logo" />
            <h3 className="footer-heading">Your AI property assistant</h3>
            <p className="footer-tagline">Built for landlords and managers who need mobile speed.</p>
          </div>
          
          <div className="footer-actions">
            <Link href="tel:+18573178479" className="btn primary">Try AI Property Manager</Link>
            <Link href="/login" className="btn ghost">Log in</Link>
          </div>
          
          <div className="footer-links">
            <Link href="#faq">Frequently Asked Questions</Link>
            <Link href="mailto:hello@squareft.io">Contact</Link>
          </div>
          
          <div className="footer-social">
            <Link href="https://instagram.com/squareft" target="_blank">Instagram</Link>
            <Link href="https://linkedin.com/company/squareft" target="_blank">LinkedIn</Link>
          </div>
          
          <div className="footer-meta">
            <p>© 2025 SquareFt</p>
            <p className="footer-love">Built with ❤️ in San Francisco</p>
          </div>
        </footer>
      </main>

      <style jsx>{`
        :global(html),
        :global(body) {
          background: linear-gradient(180deg, #f3f7ff 0%, #f8fafc 50%, #eef4ff 100%);
          color: #0f172a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
          line-height: 1.65;
          max-width: 100vw;
        }

        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 0 22px;
          max-width: 100vw;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-left: -22px;
          margin-right: -22px;
          padding: 16px 22px;
          background: transparent;
          min-height: 64px;
        }

        .brand {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .logo {
          height: 40px;
          width: auto;
          object-fit: contain;
        }

        .brand-name {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: -0.01em;
        }

        .brand-tagline {
          font-size: 12px;
          color: #475569;
        }

        .menu-button {
          background: rgba(226, 232, 240, 0.5);
          border: none;
          border-radius: 12px;
          padding: 10px 12px;
          min-height: 44px;
          min-width: 44px;
          font-size: 22px;
          font-weight: 800;
          cursor: pointer;
        }

        .menu-drawer {
          position: absolute;
          right: 0;
          top: 72px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 180px;
        }

        .menu-item {
          padding: 12px;
          border-radius: 10px;
          font-weight: 700;
          color: #0f172a;
          background: #f8fafc;
          min-height: 44px;
        }

        .menu-item.accent {
          background: #e0ecff;
          color: #1d4ed8;
        }

        .hero {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 12px 0 20px;
        }

        .hero-content h1 {
          font-size: 32px;
          line-height: 1.2;
          margin: 12px 0 20px;
          letter-spacing: -0.02em;
          word-break: keep-all;
          text-align: center;
          font-weight: 800;
        }

        .hero-content .subhead {
          margin-bottom: 18px;
          font-size: 16px;
          line-height: 1.7;
          text-align: center;
        }

        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 12px;
          color: #2563eb;
          font-weight: 700;
          margin: 0;
        }

        .text-highlight {
          color: #1877F2;
        }

        .text-main {
          color: #0f172a;
        }

        .hero-content h1 span {
          display: inline-block;
        }

        .cta-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin: 14px 0 12px;
        }

        .btn {
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          padding: 16px 18px;
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          cursor: pointer;
        }

        .btn.primary {
          background: #2563eb;
          color: white;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
        }

        .btn.ghost {
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .btn.full {
          width: 100%;
        }

        .submit-btn {
          padding: 16px 48px;
          min-width: 180px;
        }

        .btn:active {
          transform: translateY(1px);
        }

        .schedule-demo-text {
          text-align: center;
          margin-bottom: 16px;
        }

        .schedule-link {
          background: none;
          border: none;
          color: #475569;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }

        .schedule-link:hover {
          color: #0f172a;
        }

        .button-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .green-call-button {
          background: #059669 !important;
          color: white !important;
          border: none;
          font-weight: 600;
          font-size: 14px;
          padding: 11px 24px;
          min-height: 44px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
          text-decoration: none;
          cursor: pointer;
        }

        .green-call-button:hover {
          background: #047857 !important;
          box-shadow: 0 8px 24px rgba(5, 150, 105, 0.35);
          transform: translateY(-2px);
        }

        .green-call-button:active {
          transform: translateY(0);
        }

        .avatars-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 24px;
          align-items: center;
        }

        .avatars {
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .avatars img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }

        .proof {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: #475569;
          text-align: left;
        }

        .proof-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .proof-dot {
          color: #059669;
          font-size: 16px;
          font-weight: bold;
        }

        .hero-phone {
          display: flex;
          justify-content: center;
        }

        .phone-img {
          width: 360px;
          max-width: 100%;
          height: auto;
        }

        .section {
          padding: 44px 0;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .section.listing {
          padding-top: 48px;
          gap: 0;
        }

        .section-header h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
        }

        .section.listing .section-header h2 {
          font-size: 22px;
          margin-bottom: 14px;
          text-align: center;
        }

        .subhead {
          font-size: 16px;
          line-height: 1.7;
          color: #475569;
          margin: 0 0 12px;
        }

        .use-cases-header,
        .ai-header {
          text-align: center;
        }

        .use-cases-header h2,
        .use-cases-header .subhead,
        .ai-header h2,
        .ai-header .subhead {
          text-align: center !important;
        }

        .section.listing .subhead {
          font-size: 15px;
          margin-bottom: 28px;
          text-align: center;
        }

        .address-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 0;
        }

        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px;
          background: white;
          padding: 14px 14px 14px 42px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-wrap:focus-within {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .input-wrap.mapbox {
          padding: 11px 14px 11px 40px;
        }

        .input-wrap input {
          border: none !important;
          outline: none !important;
          width: 100%;
          font-size: 16px;
          color: #0f172a;
          background: transparent;
        }

        .input-wrap input:invalid {
          box-shadow: none !important;
          border: none !important;
        }

        .mapbox-address-container {
          width: 100%;
        }

        .mapbox-address-container .mapbox-input-wrapper {
          width: 100%;
        }

        .mapbox-address-container .form-input.mobile-address-input,
        .mapbox-address-container .form-input.mobile-address-input:invalid,
        .mapbox-address-container .form-input.mobile-address-input:required,
        .mapbox-address-container .form-input.mobile-address-input:required:invalid,
        .mapbox-address-container .form-input.mobile-address-input:focus,
        .mapbox-address-container .form-input.mobile-address-input:focus:invalid {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          width: 100%;
          font-size: 15px;
          color: #0f172a;
          background: transparent;
          line-height: 1.6;
          padding: 4px 0 4px 2px;
        }

        .input-wrap .form-input:invalid,
        .input-wrap .form-input:required,
        .input-wrap .form-input:required:invalid,
        .input-wrap .form-input:focus:invalid {
          border: none !important;
          border-color: transparent !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .input-wrap:has(.form-input:invalid),
        .input-wrap:has(.form-input:required),
        .input-wrap:has(.form-input:required:invalid) {
          border-color: #e2e8f0 !important;
        }

        .mapbox-address-container .mapbox-loading {
          margin-left: 8px;
        }

        .mapbox-address-container .mapbox-spinner {
          width: 18px;
          height: 18px;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          font-size: 15px;
          opacity: 0.7;
        }

        .address-form .btn.primary {
          padding: 14px 20px;
          min-height: 50px;
          font-size: 15px;
          font-weight: 600;
        }

        .platforms {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 38px;
          padding-bottom: 28px;
        }

        .platform-note {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 8px;
          font-weight: 500;
        }

        .platform-logos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          align-items: center;
          justify-items: center;
        }

        .platform-logos img {
          height: 20px;
          max-width: 100%;
          object-fit: contain;
        }

        .fb-marketplace-row {
          display: flex;
          justify-content: center;
          margin-top: 10px;
        }

        .fb-marketplace {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 10px;
          background: #eaf1ff;
          color: #1877f2;
          font-weight: 700;
          font-size: 12px;
        }

        .property-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
          overflow: hidden;
          margin-top: 36px;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .photo-grid img {
          width: 100%;
          height: 95px;
          object-fit: cover;
          border-radius: 12px;
        }

        .badges-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
        }

        .property-pill {
          background: #dbeafe;
          color: #1e40af;
          padding: 9px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .property-price {
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .details-row {
          display: flex;
          gap: 14px;
          font-size: 14px;
          color: #475569;
          flex-wrap: wrap;
          font-weight: 500;
        }

        /* AI Handles Everything Section */
        .ai-demo-section {
          background: transparent;
          padding: 60px 0;
          position: relative;
          overflow: hidden;
        }

        .ai-demo-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(24, 119, 242, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(24, 119, 242, 0.03) 0%, transparent 40%);
          pointer-events: none;
        }

        .ai-demo-container {
          max-width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .ai-demo-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .ai-demo-title {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 12px;
          letter-spacing: -0.5px;
        }

        .ai-demo-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
          font-weight: 400;
        }

        .ai-demo-interface {
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.08);
        }

        .ai-demo-tabs {
          display: flex;
          gap: 6px;
          padding: 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .ai-demo-tabs::-webkit-scrollbar {
          display: none;
        }

        .ai-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          min-height: 38px;
        }

        .ai-tab:hover {
          color: #1e293b;
          background: #e2e8f0;
        }

        .ai-tab.active {
          background: #1877F2;
          color: white;
        }

        .ai-demo-content {
          display: flex;
          flex-direction: column;
        }

        .ai-conversation-panel {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: white;
        }

        .caller-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .caller-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #e2e8f0;
          flex-shrink: 0;
        }

        .caller-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .caller-details {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .caller-name {
          color: #0f172a;
          font-weight: 700;
          font-size: 14px;
        }

        .caller-divider {
          color: #cbd5e1;
        }

        .caller-property {
          color: #64748b;
          font-size: 13px;
        }

        .call-time {
          margin-left: auto;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .timezone {
          color: #94a3b8;
          font-weight: 400;
        }

        .user-message {
          background: #f1f5f9;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
        }

        .user-message p {
          color: #334155;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .ai-response-container {
          flex: 1;
        }

        .ai-operator-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .audio-wave-icon {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 18px;
        }

        .audio-wave-icon span {
          width: 3px;
          height: 100%;
          background: #1877F2;
          border-radius: 2px;
          animation: audioWave 1s ease-in-out infinite;
        }

        .audio-wave-icon span:nth-child(1) { animation-delay: 0s; height: 40%; }
        .audio-wave-icon span:nth-child(2) { animation-delay: 0.2s; height: 80%; }
        .audio-wave-icon span:nth-child(3) { animation-delay: 0.4s; height: 60%; }
        .audio-wave-icon span:nth-child(4) { animation-delay: 0.6s; height: 100%; }

        @keyframes audioWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.5); }
        }

        .operator-name {
          color: #0f172a;
          font-weight: 700;
          font-size: 13px;
        }

        .operator-divider {
          color: #cbd5e1;
        }

        .audio-duration {
          color: #64748b;
          font-size: 12px;
        }

        .ai-message {
          background: linear-gradient(135deg, #1877F2 0%, #0056D2 100%);
          border-radius: 14px;
          padding: 16px;
        }

        .ai-message p {
          color: white;
          font-size: 14px;
          line-height: 1.65;
          margin: 0 0 12px;
        }

        .ai-message p:last-child {
          margin-bottom: 0;
        }

        .powered-by {
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: auto;
          text-align: center;
        }

        .ai-status-panel {
          background: #f8fafc;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-top: 1px solid #e2e8f0;
        }

        .audio-player {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .play-button {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #1877F2;
          border: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .play-button:hover {
          background: #166FE5;
          transform: scale(1.05);
        }

        .audio-progress {
          flex: 1;
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .audio-bar {
          width: 30%;
          height: 100%;
          background: #1877F2;
          border-radius: 2px;
        }

        .status-badges, .action-badges, .doc-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .status-badge, .action-badge, .doc-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f1f5f9;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .status-badge.blue {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .status-badge.purple {
          background: #f5f3ff;
          color: #7c3aed;
          border-color: #ddd6fe;
        }

        .status-badge.green {
          background: #ecfdf5;
          color: #059669;
          border-color: #a7f3d0;
        }

        .status-badge.orange {
          background: #fff7ed;
          color: #ea580c;
          border-color: #fed7aa;
        }

        .status-badge.red {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .status-badge.yellow {
          background: #fefce8;
          color: #ca8a04;
          border-color: #fef08a;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 14px;
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
        }

        .card h3 {
          margin: 0 0 6px;
          font-size: 18px;
        }

        .card p {
          margin: 0;
          color: #475569;
          line-height: 1.5;
          font-size: 15px;
        }

        .how-title {
          text-align: center;
        }

        .steps {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .steps li {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: start;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
        }

        .step-number {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #2563eb;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
        }

        .steps h4 {
          margin: 0 0 4px;
          font-size: 16px;
        }

        .steps p {
          margin: 0;
          color: #475569;
          font-size: 15px;
          line-height: 1.4;
        }

        /* Operations Section */
        .solution-block {
          max-width: 600px;
          margin: 0 auto;
        }

        .solution-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 700;
          color: #1877F2;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
        }

        .label-dot {
          width: 8px;
          height: 8px;
          background: #1877F2;
          border-radius: 50%;
        }

        .operations-label {
          color: #059669;
        }

        .operations-dot {
          background: #059669;
        }

        .solution-headline {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.15;
          margin: 0 0 20px;
          letter-spacing: -1px;
        }

        .headline-accent {
          color: #1877F2;
        }

        .headline-accent-green {
          color: #059669;
        }

        .solution-description {
          font-size: 16px;
          color: #475569;
          line-height: 1.7;
          margin: 0 0 32px;
        }

        .process-steps {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 32px;
        }

        .process-step {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .step-num {
          font-size: 11px;
          font-weight: 800;
          color: #1877F2;
          letter-spacing: 1px;
          min-width: 24px;
          padding-top: 2px;
        }

        .ops-num {
          color: #059669;
        }

        .step-info h4 {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px;
        }

        .step-info p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .coming-soon-step {
          opacity: 0.7;
        }

        .coming-soon-badge {
          font-size: 9px;
          font-weight: 700;
          background: linear-gradient(135deg, #1877F2, #0056D2);
          color: white;
          padding: 3px 8px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .solution-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 24px;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .solution-cta:hover {
          background: #1e293b;
          transform: translateY(-2px);
        }

        .operations-cta-btn {
          background: #059669;
        }

        .operations-cta-btn:hover {
          background: #047857;
        }

        .faq-title {
          text-align: center;
        }

        .faq details {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          background: white;
        }

        .faq summary {
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          list-style: none;
        }

        .faq summary::-webkit-details-marker {
          display: none;
        }

        .faq-arrow {
          font-size: 18px;
          transition: transform 0.3s ease;
          transform: rotate(90deg);
          flex-shrink: 0;
          margin-left: 12px;
          color: #64748b;
          font-weight: 700;
        }

        details[open] .faq-arrow {
          transform: rotate(-90deg);
        }

        .faq p {
          margin: 8px 0 4px;
          color: #475569;
          line-height: 1.5;
        }

        .footer {
          margin-top: auto;
          margin-left: -22px;
          margin-right: -22px;
          padding: 40px 22px;
          background: #0f172a;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          width: calc(100% + 44px);
          text-align: center;
        }

        .footer-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .footer-logo {
          height: 40px;
          width: auto;
          object-fit: contain;
        }

        .footer-heading {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .footer-tagline {
          margin: 0;
          font-size: 15px;
          color: #cbd5e1;
          line-height: 1.5;
        }

        .footer-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-links {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
          font-size: 15px;
        }

        .footer-social {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: center;
          font-size: 15px;
        }

        .footer a {
          color: #cbd5e1;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer a:hover {
          color: white;
        }

        .footer-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          align-items: center;
          color: #94a3b8;
          font-size: 14px;
        }

        .footer-meta p {
          margin: 0;
        }

        .footer-love {
          font-size: 13px;
        }

        .footer-phone {
          color: #cbd5e1;
          font-weight: 500;
        }

        @media (min-width: 768px) {
          .hero {
            flex-direction: row;
            align-items: center;
          }

          .hero-phone {
            justify-content: flex-end;
          }

          .cards-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ai-demo-content {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
          }

          .ai-status-panel {
            border-top: none;
            border-left: 1px solid #e2e8f0;
          }

          .ai-demo-title {
            font-size: 36px;
          }

          .ai-demo-subtitle {
            font-size: 18px;
          }

          .ai-conversation-panel {
            padding: 28px;
          }

          .ai-status-panel {
            padding: 28px;
          }

          .caller-avatar {
            width: 40px;
            height: 40px;
          }

          .ai-message {
            padding: 20px;
          }

          .ai-message p {
            font-size: 15px;
          }

          .status-badge, .action-badge, .doc-badge {
            font-size: 12px;
            padding: 10px 14px;
          }
        }
      `}</style>
    </>
  );
}

