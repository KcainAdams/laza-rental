import { useState, useEffect, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════════
const SLOGAN = "Smart Rental Guide";
const VERSION = "2.0";

function ini(name: string) { return name.split(" ").map(w => w[0]).join(""); }
function fmtPrice(n: number) { return "$" + n.toLocaleString(); }

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════
type Role   = "tenant" | "landlord";
type Tab    = "home" | "saved" | "post" | "profile";
type Screen = "auth" | "main" | "detail" | "chat";

interface Bylaw        { icon: string; text: string; }
interface Message      { id: number; from: "user"|"landlord"; text: string; time: string; }
interface Notification { id: number; icon: string; title: string; body: string; time: string; read: boolean; }
interface Application  { id: number; houseId: number; status: "pending"|"approved"|"rejected"; date: string; }

interface House {
  id: number; img: string; title: string; address: string;
  neighborhood: string; bedrooms: number; bathrooms: number;
  price: number; minPrice: number; maxPrice: number;
  deposit: number; sqft: number; rating: number; reviews: number;
  landlord: string; landlordImg: string; landlordScore: number;
  landlordVerified: boolean; badge: string; available: boolean;
  bylaws: Bylaw[]; refundRules: string[]; amenities: string[];
  priceHistory: number[];
  lat?: number; lng?: number;
  // Original repo fields
  plotNumber?: string;
  totalUnits?: number;
  views?: number;
  securityDetails?: string;
}

interface Review {
  id: number; name: string; ini: string; color: string;
  rating: number; date: string; text: string; property: string;
}

interface AuthForm {
  name: string; email: string; password: string;
  confirmPassword: string; phone: string;
  nameErr: string; emailErr: string; passErr: string; confirmErr: string;
}

interface PostForm {
  title: string; address: string; neighborhood: string;
  plotNumber: string; totalUnits: string;
  bedrooms: string; bathrooms: string; sqft: string;
  price: string; deposit: string;
  bylaw1: string; bylaw2: string; bylaw3: string;
  refundRule: string; description: string;
  securityDetails: string;
  titleErr: string; priceErr: string; addressErr: string;
}

// ═══════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════
const HOUSES: House[] = [
  {
    id: 1, img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=75",
    title: "Greenwood Villa", address: "14 Maple Avenue", neighborhood: "Westside",
    bedrooms: 3, bathrooms: 2, price: 1850, minPrice: 1800, maxPrice: 1900,
    deposit: 3700, sqft: 1420, rating: 4.8, reviews: 23,
    landlord: "James Osei", landlordImg: "", landlordScore: 94, landlordVerified: true, badge: "Featured", available: true,
    bylaws: [{icon:"🚬",text:"No smoking on premises."},{icon:"🐾",text:"Pets with written approval."},{icon:"🎵",text:"Quiet hours 10 PM – 7 AM."},{icon:"👥",text:"No subletting permitted."},{icon:"🗑️",text:"Tenant handles weekly waste."}],
    refundRules: ["✅ Full refund within 14 days — no damage.","⚠️ Deductions for damage beyond normal wear.","📄 Itemised statement in 7 days.","❌ Forfeited if lease broken within 3 months."],
    amenities: ["WiFi","Parking","Garden","Washer","Dishwasher","Air Con"],
    priceHistory: [1900, 1880, 1880, 1850, 1850, 1850],
    lat: -1.2921, lng: 36.8219,
    plotNumber: "LR/14/2019", totalUnits: 6, views: 128, securityDetails: "Gated estate, 24hr security guard, CCTV cameras at all entry points.",
  },
  {
    id: 2, img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=75",
    title: "Metro Loft 4B", address: "88 Central Boulevard", neighborhood: "Downtown",
    bedrooms: 1, bathrooms: 1, price: 1100, minPrice: 1000, maxPrice: 1200,
    deposit: 2200, sqft: 640, rating: 4.3, reviews: 41,
    landlord: "Amara Diallo", landlordImg: "", landlordScore: 87, landlordVerified: true, badge: "New", available: true,
    bylaws: [{icon:"🚫",text:"No loud gatherings on weekdays."},{icon:"🧹",text:"Keep common areas clean."},{icon:"🔑",text:"Lost keys at replacement cost."},{icon:"🛠️",text:"Report maintenance within 48 hrs."}],
    refundRules: ["✅ Full refund with 30-day notice.","🗓️ Returned within 21 days.","⚠️ Cleaning fee if applicable."],
    amenities: ["WiFi","Gym","Concierge","Rooftop"],
    priceHistory: [1200, 1150, 1120, 1100, 1100, 1100],
    lat: -1.2864, lng: 36.8172,
    plotNumber: "NBI/88/2021", totalUnits: 24, views: 214, securityDetails: "Concierge at entrance, key-fob access, intercom system.",
  },
  {
    id: 3, img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=75",
    title: "Sunridge Family Home", address: "7 Hilltop Close", neighborhood: "Northgate",
    bedrooms: 4, bathrooms: 3, price: 2600, minPrice: 2400, maxPrice: 2800,
    deposit: 5200, sqft: 2100, rating: 4.9, reviews: 15,
    landlord: "Kofi Mensah", landlordImg: "", landlordScore: 98, landlordVerified: true, badge: "Top Rated", available: true,
    bylaws: [{icon:"🌿",text:"Garden included in rent."},{icon:"🚗",text:"Two parking spots."},{icon:"🎉",text:"Events need 48-hr notice."},{icon:"👷",text:"No structural alterations."}],
    refundRules: ["✅ 100% refund with proper notice.","🏠 Inspection within 3 days of exit.","🕐 Deposit processed within 10 days."],
    amenities: ["WiFi","Double Garage","Garden","Pool","Smart Home","Solar"],
    priceHistory: [2800, 2750, 2700, 2650, 2600, 2600],
    lat: -1.2741, lng: 36.8108,
    plotNumber: "NG/7/2018", totalUnits: 1, views: 89, securityDetails: "Enclosed compound, electric fence, alarm system, dog on premises.",
  },
  {
    id: 4, img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600&q=75",
    title: "Riverside Studio", address: "22 Canal Street", neighborhood: "Eastbank",
    bedrooms: 2, bathrooms: 1, price: 980, minPrice: 900, maxPrice: 1050,
    deposit: 1960, sqft: 520, rating: 4.0, reviews: 8,
    landlord: "Fatima Nkrumah", landlordImg: "", landlordScore: 78, landlordVerified: false, badge: "", available: false,
    bylaws: [{icon:"💧",text:"Utilities billed separately."},{icon:"📵",text:"No commercial activity."}],
    refundRules: ["✅ Refund minus utilities owed.","📋 Final walkthrough required."],
    amenities: ["WiFi","River View","Bike Storage"],
    priceHistory: [1050, 1020, 1000, 980, 980, 980],
    lat: -1.3031, lng: 36.8253,
    plotNumber: "EB/22/2020", totalUnits: 8, views: 43, securityDetails: "Shared compound, basic lockup security.",
  },
];

const INIT_REVIEWS: Review[] = [
  {id:1,name:"Yvonne B.",ini:"YB",color:"#16A34A",rating:5,date:"Mar 2026",text:"Maintenance sorted within 24 hours. Bylaws being upfront saved me so many headaches. This is how renting should work.",property:"Greenwood Villa"},
  {id:2,name:"Tunde A.", ini:"TA",color:"#EA580C",rating:4,date:"Feb 2026",text:"Exactly as described. The deposit refund policy was crystal clear — I got my money back in 10 days.",property:"Metro Loft 4B"},
  {id:3,name:"Grace M.", ini:"GM",color:"#DB2777",rating:5,date:"Feb 2026",text:"No surprises whatsoever. Best rental experience I've ever had. The landlord trust score is genius.",property:"Sunridge Family Home"},
  {id:4,name:"Samuel K.",ini:"SK",color:"#7C3AED",rating:3,date:"Jan 2026",text:"Decent place. Heating took 2 weeks — but the platform's dispute process worked.",property:"Riverside Studio"},
  {id:5,name:"Aisha O.", ini:"AO",color:"#0891B2",rating:5,date:"Jan 2026",text:"LazaRental is genuinely the Smart Rental Guide. Found my home in a week. My family is so happy.",property:"Greenwood Villa"},
];

const INIT_MESSAGES: Message[] = [
  {id:1,from:"landlord",text:"Hello! Thanks for your interest in Greenwood Villa. Happy to answer any questions.",time:"10:02 AM"},
  {id:2,from:"user",    text:"Hi James, is the garden fully enclosed? We have a young child.",time:"10:15 AM"},
  {id:3,from:"landlord",text:"Yes, fully enclosed with a 6ft fence. Very safe for children. We can arrange a viewing this week if you'd like.",time:"10:18 AM"},
];

const INIT_NOTIFS: Notification[] = [
  {id:1,icon:"🏠",title:"New listing in Westside",body:"Greenwood Villa matches your saved search.",time:"2h ago",read:false},
  {id:2,icon:"💬",title:"James Osei replied",body:"\"Yes, fully enclosed with a 6ft fence...\"",time:"4h ago",read:false},
  {id:3,icon:"✅",title:"Application approved",body:"Your application for Metro Loft 4B has been approved!",time:"1d ago",read:true},
  {id:4,icon:"📉",title:"Price drop alert",body:"Sunridge Family Home dropped to $2,600/mo.",time:"2d ago",read:true},
];

// ═══════════════════════════════════════════════════════════════
//  LOGO
// ═══════════════════════════════════════════════════════════════
function HouseIcon({ color = "white" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 11L12 4L21 11V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V11Z" fill={color}/>
      <rect x="10" y="15" width="4" height="6" rx="1" fill={color === "white" ? "#C84B2F" : "white"}/>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SKELETON LOADER  (Performance upgrade)
// ═══════════════════════════════════════════════════════════════
function SkeletonCard() {
  return (
    <div className="prop-card" style={{cursor:"default"}} aria-hidden="true">
      <div className="skeleton" style={{height:210,borderRadius:"20px 20px 0 0"}}/>
      <div style={{padding:16}}>
        <div className="skeleton" style={{height:11,width:"40%",borderRadius:6,marginBottom:8}}/>
        <div className="skeleton" style={{height:22,width:"75%",borderRadius:6,marginBottom:6}}/>
        <div className="skeleton" style={{height:14,width:"55%",borderRadius:6,marginBottom:14}}/>
        <div style={{display:"flex",gap:8}}>
          {[0,1,2].map(i=><div key={i} className="skeleton" style={{height:30,width:70,borderRadius:8}}/>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PRICE HISTORY MINI CHART
// ═══════════════════════════════════════════════════════════════
function PriceChart({ data }: { data: number[] }) {
  const mn = Math.min(...data), mx = Math.max(...data);
  const range = mx - mn || 1;
  const w = 200, h = 48, pad = 4;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - mn) / range) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const down = last < prev;
  return (
    <div style={{marginTop:6}}>
      <div style={{fontSize:11,color:"var(--ink3)",marginBottom:4}}>6-month price trend</div>
      <svg width={w} height={h} aria-label="Price history chart">
        <polyline points={pts} fill="none" stroke={down?"#16A34A":"var(--rust)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {data.map((v,i)=>{
          const x=pad+(i/(data.length-1))*(w-2*pad);
          const y=h-pad-((v-mn)/range)*(h-2*pad);
          return <circle key={i} cx={x} cy={y} r="3" fill={down?"#16A34A":"var(--rust)"}/>;
        })}
      </svg>
      <div style={{fontSize:12,color:down?"#16A34A":"var(--rust)",fontWeight:600,marginTop:2}}>
        {down?"📉 Price dropped":"📈 Price stable"} — current {fmtPrice(last)}/mo
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GOOGLE MAPS VIEW
//  Replace GOOGLE_MAPS_API_KEY with your real key from
//  https://console.cloud.google.com → APIs & Services → Credentials
//  Required APIs: Maps JavaScript API + Places API
// ═══════════════════════════════════════════════════════════════
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY"; // 🔑 replace this

// Singleton loader — loads the script once across re-renders
let gmapsLoaded = false;
let gmapsLoading = false;
const gmapsCallbacks: (()=>void)[] = [];

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (gmapsLoaded) { resolve(); return; }
    gmapsCallbacks.push(resolve);
    if (gmapsLoading) return;
    gmapsLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=beta`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gmapsLoaded = true;
      gmapsLoading = false;
      gmapsCallbacks.forEach(cb => cb());
      gmapsCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

interface MapViewProps { houses: House[]; onSelect: (h: House) => void; }

function MapView({ houses, onSelect }: MapViewProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const gMapRef     = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);
  const [ready, setReady]       = useState(false);
  const [loadErr, setLoadErr]   = useState(false);
  const [mapCenter, setMapCenter] = useState<{lat:number;lng:number}|null>(null);

  // Fallback lat/lng if none provided — Nairobi CBD
  const defaultCenter = { lat: -1.286389, lng: 36.817223 };

  // Compute initial center from houses that have coords
  const housesWithCoords = houses.filter(h => h.lat && h.lng);

  useEffect(() => {
    if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {
      // No real key yet — use stylised fallback
      setReady(false);
      return;
    }
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => setReady(true))
      .catch(() => setLoadErr(true));
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const center = housesWithCoords.length > 0
      ? { lat: housesWithCoords[0].lat!, lng: housesWithCoords[0].lng! }
      : defaultCenter;

    const G = (window as any).google;
    const map = new G.maps.Map(mapRef.current, {
      zoom: 13,
      center,
      mapId: "lazarental_map",
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
    });
    gMapRef.current = map;

    // Clear old markers
    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];

    // Add price-pin markers
    houses.forEach(h => {
      if (!h.lat || !h.lng) return;

      const pin = document.createElement("div");
      pin.style.cssText = [
        `background:${h.available ? "#C84B2F" : "#888888"}`,
        "color:white",
        "border-radius:20px",
        "padding:6px 12px",
        "font-size:13px",
        "font-weight:700",
        "font-family:'DM Sans',sans-serif",
        "cursor:pointer",
        "white-space:nowrap",
        "box-shadow:0 2px 10px rgba(0,0,0,0.25)",
        "border:2px solid white",
        "transition:transform 0.15s,box-shadow 0.15s",
      ].join(";");
      pin.textContent = fmtPrice(h.price);
      if (!h.available) {
        const tag = document.createElement("span");
        tag.style.cssText = "font-size:9px;margin-left:4px;opacity:0.75";
        tag.textContent = "TAKEN";
        pin.appendChild(tag);
      }

      const marker = new G.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: h.lat, lng: h.lng },
        title: h.title,
        content: pin,
      });

      marker.addListener("click", () => {
        // Highlight selected pin
        markersRef.current.forEach(m => {
          (m.content as HTMLElement).style.transform = "scale(1)";
          (m.content as HTMLElement).style.zIndex = "0";
        });
        pin.style.transform = "scale(1.15)";
        pin.style.zIndex = "10";
        // Pan to pin with slight offset so info card doesn't cover it
        map.panTo({ lat: h.lat! + 0.002, lng: h.lng! });
        onSelect(h);
      });

      markersRef.current.push(marker);
    });

    // Track map center for "Search this area"
    map.addListener("center_changed", () => {
      const c = map.getCenter();
      if (c) setMapCenter({ lat: c.lat(), lng: c.lng() });
    });

    return () => {
      markersRef.current.forEach(m => { m.map = null; });
      markersRef.current = [];
      gMapRef.current = null;
    };
  }, [ready, houses]);

  // No API key yet — render elegant placeholder
  if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY" || loadErr) {
    return (
      <div style={{position:"relative",height:320,background:"linear-gradient(135deg,#e8f5e9 0%,#f1f8e9 100%)",borderRadius:16,overflow:"hidden",border:"1px solid var(--border)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10}}>
        {/* Street grid decoration */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.35}} aria-hidden="true">
          <defs>
            <pattern id="streets" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M60 0 L0 0 0 60" fill="none" stroke="#a5d6a7" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#streets)"/>
          <rect x="0" y="90" width="100%" height="14" fill="rgba(165,214,167,0.5)"/>
          <rect x="0" y="195" width="100%" height="14" fill="rgba(165,214,167,0.5)"/>
          <rect x="90" y="0" width="14" height="100%" fill="rgba(165,214,167,0.5)"/>
          <rect x="240" y="0" width="14" height="100%" fill="rgba(165,214,167,0.5)"/>
        </svg>
        {/* Static pins */}
        {([{x:"22%",y:"30%"},{x:"55%",y:"52%"},{x:"70%",y:"22%"},{x:"38%",y:"68%"}] as const).map((pos,i) => {
          const h = houses[i];
          if (!h) return null;
          return (
            <button key={h.id} onClick={()=>onSelect(h)} aria-label={`View ${h.title}`}
              style={{position:"absolute",left:pos.x,top:pos.y,transform:"translate(-50%,-50%)",background:"none",border:"none",cursor:"pointer",zIndex:2}}>
              <div style={{background:h.available?"var(--rust)":"var(--ink3)",color:"white",borderRadius:20,padding:"5px 11px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,0.22)",fontFamily:"var(--ff-sans)",border:"2px solid white"}}>
                {fmtPrice(h.price)}
              </div>
              <div style={{width:8,height:8,background:h.available?"var(--rust)":"var(--ink3)",borderRadius:"50% 50% 50% 0",transform:"rotate(-45deg)",margin:"-3px auto 0",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
            </button>
          );
        })}
        <div style={{zIndex:3,background:"rgba(255,255,255,0.95)",borderRadius:14,padding:"12px 20px",textAlign:"center",backdropFilter:"blur(8px)",boxShadow:"0 2px 16px rgba(0,0,0,0.1)"}}>
          <div style={{fontSize:22,marginBottom:4}}>🗺️</div>
          <div style={{fontSize:13,fontWeight:700,color:"var(--ink)",marginBottom:2}}>Google Maps</div>
          <div style={{fontSize:11,color:"var(--ink3)"}}>
            {loadErr ? "Failed to load — check your API key" : "Add your API key to enable live maps"}
          </div>
        </div>
        <div style={{position:"absolute",bottom:10,right:10,background:"rgba(255,255,255,0.9)",borderRadius:8,padding:"4px 10px",fontSize:10,color:"var(--ink3)"}}>
          📍 {houses.length} listings
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"relative",borderRadius:16,overflow:"hidden",border:"1px solid var(--border)"}}>
      {/* Map container */}
      <div ref={mapRef} style={{height:320,width:"100%"}} role="application" aria-label="Property map"/>

      {/* Loading overlay */}
      {!ready && (
        <div style={{position:"absolute",inset:0,background:"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:13,color:"var(--ink3)"}}>
          <div style={{width:16,height:16,border:"2px solid var(--rust)",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
          Loading map…
        </div>
      )}

      {/* Search this area button */}
      {ready && mapCenter && (
        <div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",zIndex:5}}>
          <button
            onClick={() => {
              // Filter houses within ~5km of current map center
              // In production you'd re-query the DB with these bounds
            }}
            style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:20,padding:"8px 16px",fontSize:12,fontWeight:700,color:"var(--ink)",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.15)",fontFamily:"var(--ff-sans)",display:"flex",alignItems:"center",gap:6}}>
            🔍 Search this area
          </button>
        </div>
      )}

      {/* Listing count badge */}
      <div style={{position:"absolute",bottom:12,right:12,background:"rgba(255,255,255,0.95)",borderRadius:10,padding:"5px 10px",fontSize:11,color:"var(--ink3)",backdropFilter:"blur(8px)",boxShadow:"0 1px 4px rgba(0,0,0,0.1)"}}>
        📍 {houses.filter(h=>h.lat&&h.lng).length} on map
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CHAT SCREEN
// ═══════════════════════════════════════════════════════════════
function ChatScreen({ house, messages, onClose, onSend }: { house: House; messages: Message[]; onClose: ()=>void; onSend: (t:string)=>void; }) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"var(--paper)",fontFamily:"var(--ff-sans)"}}>
      {/* Header */}
      <div style={{padding:"14px 20px",background:"var(--white)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} aria-label="Close chat" style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"var(--ink)"}}>←</button>
        <div style={{width:40,height:40,borderRadius:"50%",background:"var(--rust)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:15}}>{ini(house.landlord)}</div>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:"var(--ink)"}}>{house.landlord}</div>
          <div style={{fontSize:11,color:"var(--ink3)",display:"flex",alignItems:"center",gap:4}}>
            {house.landlordVerified && <span style={{color:"var(--sage)"}}>✓ Verified</span>}
            <span>· Trust score {house.landlordScore}/100</span>
          </div>
        </div>
        <div style={{marginLeft:"auto",background:"var(--cream)",border:"1px solid var(--border)",borderRadius:20,padding:"4px 10px",fontSize:11,color:"var(--ink3)"}}>
          🏠 {house.title}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px",display:"flex",flexDirection:"column",gap:10}}>
        {messages.map(m=>(
          <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.from==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.from==="user"?"var(--rust)":"var(--white)",color:m.from==="user"?"white":"var(--ink)",fontSize:14,lineHeight:1.5,border:m.from==="landlord"?"1px solid var(--border)":"none",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
              {m.text}
            </div>
            <div style={{fontSize:10,color:"var(--ink3)",margin:"3px 4px"}}>{m.time}</div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 16px 28px",background:"var(--white)",borderTop:"1px solid var(--border)",display:"flex",gap:10,alignItems:"flex-end"}}>
        <textarea
          value={draft} onChange={e=>setDraft(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(draft.trim()){onSend(draft.trim());setDraft("");}}}}
          placeholder="Message landlord…"
          aria-label="Type your message"
          rows={1}
          style={{flex:1,padding:"11px 14px",borderRadius:12,border:"1.5px solid var(--border)",background:"var(--cream)",fontFamily:"var(--ff-sans)",fontSize:14,outline:"none",resize:"none",color:"var(--ink)"}}
        />
        <button onClick={()=>{if(draft.trim()){onSend(draft.trim());setDraft("");}}}
          aria-label="Send message"
          style={{width:44,height:44,borderRadius:"50%",background:draft.trim()?"var(--rust)":"var(--border)",color:"white",border:"none",fontSize:18,cursor:draft.trim()?"pointer":"default",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:"center"}}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  DETAIL SCREEN
// ═══════════════════════════════════════════════════════════════
interface DetailProps { house: House; favorites: number[]; applications: Application[]; onBack: ()=>void; onFav: (id:number)=>void; onApply: (id:number)=>void; onChat: ()=>void; }
function DetailScreen({ house:h, favorites, applications, onBack, onFav, onApply, onChat }: DetailProps) {
  const [viewModal, setViewModal] = useState(false);
  const [viewDate, setViewDate] = useState("");
  const [viewMsg, setViewMsg] = useState("");
  const [viewSubmitted, setViewSubmitted] = useState(false);
  const applied = applications.some(a=>a.houseId===h.id);
  const appStatus = applications.find(a=>a.houseId===h.id)?.status;

  return (
    <div style={{background:"var(--paper)",fontFamily:"var(--ff-sans)",paddingBottom:80}}>
      {/* Hero image */}
      <div style={{position:"relative",height:290,overflow:"hidden"}}>
        <img src={h.img} alt={h.title} style={{width:"100%",height:"100%",objectFit:"cover"}} loading="eager"/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 45%,rgba(0,0,0,0.55) 100%)"}}/>
        <button onClick={onBack} aria-label="Go back" className="icon-btn" style={{position:"absolute",top:16,left:16}}>←</button>
        <button onClick={()=>onFav(h.id)} aria-label={favorites.includes(h.id)?"Remove from saved":"Save property"} className="icon-btn" style={{position:"absolute",top:16,right:16}}>
          {favorites.includes(h.id)?"❤️":"🤍"}
        </button>
        <div style={{position:"absolute",bottom:16,left:16}}>
          <div style={{fontFamily:"var(--ff-serif)",fontSize:30,fontWeight:700,color:"white"}}>{fmtPrice(h.price)}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>per month</div>
        </div>
        {!h.available&&<div style={{position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.7)",color:"white",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:600}}>Currently Unavailable</div>}
      </div>

      <div style={{padding:20}}>
        {/* Title block */}
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"var(--rust)",marginBottom:6}}>{h.neighborhood}</div>
        <div style={{fontFamily:"var(--ff-serif)",fontSize:26,fontWeight:700,color:"var(--ink)",marginBottom:4}}>{h.title}</div>
        <div style={{fontSize:14,color:"var(--ink3)",marginBottom:14}}>📍 {h.address}</div>

        {/* Meta row — plot, units, views */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
          {h.plotNumber&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:"var(--sand)",fontSize:12,fontWeight:600,color:"var(--ink2)"}}>📌 Plot {h.plotNumber}</div>}
          {h.totalUnits&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:"var(--sand)",fontSize:12,fontWeight:600,color:"var(--ink2)"}}>🏢 {h.totalUnits} unit{h.totalUnits>1?"s":""}</div>}
          {h.views!=null&&<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:8,background:"var(--sand)",fontSize:12,fontWeight:600,color:"var(--ink2)"}}>👁 {h.views} views</div>}
        </div>

        {/* Chips */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
          {[`🛏 ${h.bedrooms} bed${h.bedrooms>1?"s":""}`,`🚿 ${h.bathrooms} bath${h.bathrooms>1?"s":""}`,`📐 ${h.sqft} sqft`].map(c=>(
            <div key={c} style={{padding:"7px 12px",borderRadius:10,background:"var(--cream)",fontSize:13,fontWeight:500,color:"var(--ink2)"}}>{c}</div>
          ))}
        </div>

        {/* Rating row */}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:14,background:"var(--cream)",borderRadius:14,marginBottom:20}}>
          <span style={{fontSize:18}}>⭐</span>
          <span style={{fontFamily:"var(--ff-serif)",fontSize:20,fontWeight:700,color:"var(--ink)"}}>{h.rating}</span>
          <span style={{fontSize:13,color:"var(--ink3)"}}>({h.reviews} reviews)</span>
          <div style={{marginLeft:"auto",fontSize:12,color:"var(--ink3)"}}>
            Landlord trust: <strong style={{color:"var(--sage)"}}>{h.landlordScore}/100</strong>
            {h.landlordVerified&&<span style={{marginLeft:6,background:"var(--sage)",color:"white",fontSize:10,padding:"2px 7px",borderRadius:10,fontWeight:600}}>✓ Verified</span>}
          </div>
        </div>

        {/* Amenities */}
        <div style={{fontFamily:"var(--ff-serif)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          Amenities<div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
          {h.amenities.map(a=>(
            <div key={a} style={{padding:"5px 12px",borderRadius:20,background:"var(--white)",border:"1px solid var(--border)",fontSize:12,fontWeight:500,color:"var(--ink2)"}}>{a}</div>
          ))}
        </div>

        {/* Price history */}
        <div style={{fontFamily:"var(--ff-serif)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          Price History<div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>
        <div style={{background:"var(--cream)",borderRadius:14,padding:16,marginBottom:20}}>
          <div style={{display:"flex",gap:16,marginBottom:8}}>
            <div><div style={{fontSize:11,color:"var(--ink3)"}}>Range</div><div style={{fontWeight:700,fontSize:14,color:"var(--ink)"}}>{fmtPrice(h.minPrice)} – {fmtPrice(h.maxPrice)}</div></div>
            <div><div style={{fontSize:11,color:"var(--ink3)"}}>Current</div><div style={{fontWeight:700,fontSize:14,color:"var(--rust)"}}>{fmtPrice(h.price)}</div></div>
          </div>
          <PriceChart data={h.priceHistory}/>
        </div>

        {/* Deposit & Refund */}
        <div style={{fontFamily:"var(--ff-serif)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          Deposit & Refund<div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>
        <div style={{background:"var(--cream)",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:20}}>
          <div style={{fontFamily:"var(--ff-serif)",fontSize:26,fontWeight:700,color:"var(--ink)",marginBottom:2}}>{fmtPrice(h.deposit)}</div>
          <div style={{fontSize:12,color:"var(--ink3)",marginBottom:14}}>Security deposit required upfront</div>
          {h.refundRules.map((r,i)=>(
            <div key={i} style={{fontSize:13,color:"var(--ink2)",padding:"7px 0",borderBottom:i<h.refundRules.length-1?"1px dashed var(--border)":"none",display:"flex",gap:8}}>{r}</div>
          ))}
        </div>

        {/* House Rules */}
        <div style={{fontFamily:"var(--ff-serif)",fontSize:18,fontWeight:700,color:"var(--ink)",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
          House Rules<div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>
        {h.bylaws.map((b,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:i<h.bylaws.length-1?"1px solid var(--border)":"none",fontSize:14,color:"var(--ink2)"}}>
            <span aria-hidden="true">{b.icon}</span><span>{b.text}</span>
          </div>
        ))}

        {/* Security Details */}
        {h.securityDetails&&(
          <>
            <div style={{fontFamily:"var(--ff-serif)",fontSize:18,fontWeight:700,color:"var(--ink)",margin:"20px 0 12px",display:"flex",alignItems:"center",gap:10}}>
              🔒 Area Security<div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>
            <div style={{background:"#F0F7F1",border:"1px solid #C8E6C9",borderRadius:14,padding:16,marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:24}}>🛡️</span>
              <div style={{fontSize:13,color:"var(--sage)",lineHeight:1.6,fontWeight:500}}>{h.securityDetails}</div>
            </div>
          </>
        )}

        {/* Landlord */}
        <div style={{fontFamily:"var(--ff-serif)",fontSize:18,fontWeight:700,color:"var(--ink)",margin:"20px 0 12px",display:"flex",alignItems:"center",gap:10}}>
          Landlord<div style={{flex:1,height:1,background:"var(--border)"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:16,background:"var(--cream)",borderRadius:16,border:"1px solid var(--border)",marginBottom:20}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"var(--rust)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"white",flexShrink:0}} role="img" aria-label={`${h.landlord} avatar`}>{ini(h.landlord)}</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"var(--ink)",display:"flex",alignItems:"center",gap:6}}>
              {h.landlord}
              {h.landlordVerified&&<span style={{background:"var(--sage)",color:"white",fontSize:10,padding:"2px 7px",borderRadius:10,fontWeight:600}}>✓ ID Verified</span>}
            </div>
            <div style={{fontSize:12,color:"var(--ink3)",marginTop:3}}>Trust Score: <strong style={{color:"var(--sage)"}}>{h.landlordScore}/100</strong></div>
          </div>
          <button onClick={onChat} aria-label="Message landlord"
            style={{marginLeft:"auto",padding:"10px 16px",background:"var(--rust)",color:"white",border:"none",borderRadius:12,fontFamily:"var(--ff-sans)",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            💬 Message
          </button>
        </div>
      </div>

      {/* Sticky book bar */}
      <div style={{position:"sticky",bottom:0,background:"var(--white)",borderTop:"1px solid var(--border)",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:50}}>
        <div>
          <div style={{fontFamily:"var(--ff-serif)",fontSize:22,fontWeight:700,color:"var(--ink)"}}>{fmtPrice(h.price)}<span style={{fontSize:13,fontWeight:400,color:"var(--ink3)"}}>/mo</span></div>
          <div style={{fontSize:12,color:"var(--ink3)"}}>+ {fmtPrice(h.deposit)} deposit</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setViewModal(true)} aria-label="Request a viewing"
            style={{padding:"12px 16px",background:"var(--cream)",color:"var(--rust)",border:"1.5px solid var(--rust)",borderRadius:12,fontFamily:"var(--ff-sans)",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            📅 View
          </button>
          <button onClick={()=>h.available&&onApply(h.id)}
            aria-label={applied?"Application submitted":"Apply for this property"}
            disabled={!h.available||applied}
            style={{padding:"12px 20px",background:applied?"var(--sage)":!h.available?"var(--ink3)":"var(--rust)",color:"white",border:"none",borderRadius:12,fontFamily:"var(--ff-sans)",fontSize:13,fontWeight:700,cursor:h.available&&!applied?"pointer":"default",boxShadow:h.available&&!applied?"0 4px 16px rgba(200,75,47,0.3)":"none",opacity:!h.available?0.6:1}}>
            {applied ? `✓ ${appStatus==="approved"?"Approved":appStatus==="rejected"?"Rejected":"Pending"}` : "Apply Now"}
          </button>
        </div>
      </div>

      {/* Viewing modal */}
      {viewModal&&(
        <div className="modal-bg" role="dialog" aria-modal="true" aria-label="Request a viewing" onClick={()=>setViewModal(false)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <button className="modal-close" onClick={()=>setViewModal(false)} aria-label="Close">✕</button>
            {!viewSubmitted ? (
              <>
                <div className="modal-title">Book a Viewing</div>
                <div className="f-group"><label className="f-label" htmlFor="vdate">Preferred date</label><input id="vdate" type="date" className="f-input" value={viewDate} onChange={e=>setViewDate(e.target.value)}/></div>
                <div className="f-group"><label className="f-label" htmlFor="vmsg">Message (optional)</label><textarea id="vmsg" className="f-textarea" placeholder="Any questions for the landlord?" value={viewMsg} onChange={e=>setViewMsg(e.target.value)}/></div>
                <button className="f-submit" onClick={()=>{if(!viewDate)return;setViewSubmitted(true);}}>Confirm Viewing Request</button>
              </>
            ) : (
              <div style={{textAlign:"center",padding:"20px 0"}}>
                <div style={{fontSize:52,marginBottom:12}}>📅</div>
                <div style={{fontFamily:"var(--ff-serif)",fontSize:22,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Viewing Requested!</div>
                <div style={{fontSize:14,color:"var(--ink3)",lineHeight:1.6}}>We've notified {h.landlord}.<br/>They'll confirm within 24 hours.</div>
                <button className="f-submit" style={{marginTop:20}} onClick={()=>{setViewModal(false);setViewSubmitted(false);}}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,700;0,900;1,300;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{font-size:16px;}
:root{
  --ff-sans:'DM Sans',sans-serif;
  --ff-serif:'Fraunces',serif;

  /* ── Warm Palette ─────────────────────────────────────
     Inspired by afternoon sunlight through linen curtains.
     Amber, honey, terracotta, warm sage — never cold.
  ──────────────────────────────────────────────────── */
  --ink:    #2C1810;   /* deep warm brown — not harsh black    */
  --ink2:   #6B4423;   /* mid warm brown                       */
  --ink3:   #A07850;   /* muted caramel for secondary text     */
  --paper:  #FDF8F2;   /* warm parchment — main background     */
  --cream:  #FAF0E0;   /* lighter linen                        */
  --sand:   #F5E6C8;   /* warm sand — hover / active states    */
  --amber:  #E8A020;   /* honey amber — accents                */
  --rust:   #C8622F;   /* terracotta — primary CTA             */
  --rust-lt:#E07840;   /* lighter terracotta                   */
  --rust-dk:#A04820;   /* darker terracotta                    */
  --sage:   #4A7C59;   /* warm forest green — trust / verified */
  --gold:   #D4A020;   /* warm gold — ratings / stars          */
  --white:  #FFFCF7;   /* warm white — cards                   */
  --border: #EAD8BE;   /* warm tan border                      */
  --card:   #FFFCF7;   /* card background                      */
  --shadow: rgba(44,24,16,0.08);
  --success:#2E7D50;
  --error:  #C0392B;
}
body{background:var(--paper);}
.app{font-family:var(--ff-sans);color:var(--ink);background:var(--paper);max-width:430px;margin:0 auto;min-height:100vh;position:relative;}
@keyframes slideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* SKELETON — warm shimmer */
.skeleton{background:linear-gradient(90deg,#f5e8d0 25%,#eedfc0 50%,#f5e8d0 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;border-radius:8px;}

/* ACCESSIBILITY */
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--rust);outline-offset:2px;}
.icon-btn{width:40px;height:40px;border-radius:50%;background:rgba(255,250,240,0.95);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;border:none;box-shadow:0 2px 12px rgba(44,24,16,0.15);}
.icon-btn:hover{transform:scale(1.05);}

/* LOGIN */
.login{min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;}
.login-photo{position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=85') center/cover no-repeat;}
.login-overlay{position:absolute;inset:0;background:linear-gradient(
  to bottom,
  rgba(44,24,16,0.05) 0%,
  rgba(44,24,16,0.15) 35%,
  rgba(80,35,10,0.78) 65%,
  rgba(44,20,8,0.96)  100%
);}
.login-content{position:relative;z-index:2;margin-top:auto;padding:0 24px 44px;animation:slideUp 0.7s cubic-bezier(.22,1,.36,1) both;}
.login-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(232,160,32,0.18);border:1px solid rgba(232,160,32,0.35);backdrop-filter:blur(10px);border-radius:30px;padding:6px 14px;margin-bottom:14px;}
.login-badge-dot{width:6px;height:6px;border-radius:50%;background:#E8A020;}
.login-badge-text{font-size:10px;font-weight:600;letter-spacing:2px;color:#FFD580;text-transform:uppercase;}
.login-headline{font-family:var(--ff-serif);font-size:36px;font-weight:900;line-height:1.1;color:#FFF8F0;margin-bottom:8px;text-shadow:0 2px 20px rgba(44,24,16,0.4);}
.login-headline em{color:#FFD580;font-style:normal;}
.login-sub{font-size:14px;color:rgba(255,230,190,0.75);margin-bottom:24px;line-height:1.5;font-weight:300;}
.login-logo-row{display:flex;align-items:center;gap:10px;margin-bottom:28px;}
.login-logo-icon{width:42px;height:42px;background:var(--rust);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(200,98,47,0.55);}
.login-logo-icon svg{width:22px;height:22px;}
.login-logo-name{font-family:var(--ff-serif);font-size:22px;font-weight:700;color:#FFF8F0;}
.login-logo-name em{color:#FFD580;font-style:normal;}
.login-tabs{display:flex;background:rgba(255,230,190,0.12);border-radius:14px;padding:4px;margin-bottom:16px;backdrop-filter:blur(8px);border:1px solid rgba(255,210,140,0.15);}
.login-tab{flex:1;padding:10px;border:none;border-radius:11px;cursor:pointer;font-family:var(--ff-sans);font-size:14px;font-weight:600;transition:all 0.2s;background:transparent;color:rgba(255,220,160,0.65);}
.login-tab.active{background:#FFF8F0;color:var(--ink);box-shadow:0 2px 8px rgba(44,24,16,0.15);}
.role-row{display:flex;gap:8px;margin-bottom:14px;}
.role-chip{flex:1;padding:10px 6px;border-radius:12px;border:1.5px solid rgba(255,210,140,0.2);background:rgba(255,220,160,0.08);color:rgba(255,220,160,0.75);cursor:pointer;font-family:var(--ff-sans);font-size:13px;font-weight:500;display:flex;flex-direction:column;align-items:center;gap:4px;transition:all 0.2s;}
.role-chip.active{background:var(--rust);border-color:var(--rust-lt);color:white;}
.role-chip-icon{font-size:20px;}
.login-field-wrap{position:relative;margin-bottom:8px;}
.login-field{width:100%;padding:14px 44px 14px 16px;border-radius:12px;border:1.5px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.1);color:white;font-family:var(--ff-sans);font-size:15px;outline:none;transition:border 0.2s,background 0.2s;backdrop-filter:blur(8px);}
.login-field::placeholder{color:rgba(255,255,255,0.4);}
.login-field:focus{border-color:rgba(255,255,255,0.6);background:rgba(255,255,255,0.14);}
.login-field.no-icon{padding-right:16px;}
.pass-toggle{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.5);font-size:16px;padding:4px;transition:color 0.2s;line-height:1;}
.pass-toggle:hover{color:rgba(255,255,255,0.9);}
.field-err{font-size:11px;color:#FECDD3;margin-top:-4px;margin-bottom:8px;padding-left:4px;display:flex;align-items:center;gap:4px;}
.login-cta{width:100%;padding:15px;border:none;border-radius:14px;background:var(--rust);color:white;font-family:var(--ff-sans);font-size:16px;font-weight:700;cursor:pointer;margin-top:6px;box-shadow:0 6px 24px rgba(200,75,47,0.45);transition:transform 0.15s,box-shadow 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;}
.login-cta:hover{box-shadow:0 8px 28px rgba(200,75,47,0.6);}
.login-cta:active{transform:scale(0.98);}
.login-cta:disabled{opacity:0.6;cursor:not-allowed;}
.login-divider{display:flex;align-items:center;gap:10px;margin:14px 0;}
.login-divider-line{flex:1;height:1px;background:rgba(255,255,255,0.12);}
.login-divider-text{font-size:11px;color:rgba(255,255,255,0.35);font-weight:500;white-space:nowrap;}
.login-google{width:100%;padding:13px;border:1.5px solid rgba(255,255,255,0.2);border-radius:14px;background:rgba(255,255,255,0.08);color:white;font-family:var(--ff-sans);font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:background 0.2s,border-color 0.2s;backdrop-filter:blur(8px);}
.login-google:hover{background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.35);}
.login-google:active{transform:scale(0.98);}
.login-google-icon{width:20px;height:20px;flex-shrink:0;}
.login-forgot{display:block;text-align:right;font-size:12px;color:rgba(255,255,255,0.45);background:none;border:none;cursor:pointer;font-family:var(--ff-sans);margin-top:-2px;margin-bottom:6px;transition:color 0.2s;}
.login-forgot:hover{color:rgba(255,255,255,0.75);}
.login-switch{text-align:center;margin-top:14px;font-size:13px;color:rgba(255,255,255,0.45);}
.login-switch button{background:none;border:none;color:#FFD580;font-family:var(--ff-sans);font-size:13px;font-weight:600;cursor:pointer;margin-left:4px;transition:opacity 0.2s;}
.login-switch button:hover{opacity:0.8;}
.login-trust{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);}
.login-trust-item{display:flex;align-items:center;gap:5px;font-size:10px;color:rgba(255,255,255,0.35);font-weight:500;}
.login-trust-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.2);}
@keyframes fieldShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.field-shake{animation:fieldShake 0.3s ease;}

/* TOPBAR */
.topbar{background:var(--white);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid var(--border);box-shadow:0 1px 8px rgba(44,24,16,0.06);}
.topbar-left{display:flex;align-items:center;gap:10px;}
.topbar-logo-mark{width:34px;height:34px;background:var(--rust);border-radius:10px;display:flex;align-items:center;justify-content:center;}
.topbar-logo-mark svg{width:18px;height:18px;}
.topbar-name{font-family:var(--ff-serif);font-size:19px;font-weight:700;color:var(--ink);line-height:1;}
.topbar-name em{color:var(--rust);font-style:normal;}
.topbar-slogan{font-size:9px;color:var(--ink3);letter-spacing:1.2px;text-transform:uppercase;margin-top:1px;}
.topbar-right{display:flex;align-items:center;gap:8px;}
.topbar-pill{background:var(--sand);border:1px solid var(--border);color:var(--ink2);font-size:10px;font-weight:600;padding:4px 10px;border-radius:20px;}
.topbar-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--rust),var(--rust-lt));color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(200,98,47,0.3);}
.notif-btn{position:relative;background:none;border:none;font-size:20px;cursor:pointer;padding:4px;}
.notif-dot{position:absolute;top:2px;right:2px;width:8px;height:8px;background:var(--rust);border-radius:50%;border:2px solid var(--white);}

/* BOTTOM NAV */
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;background:var(--white);display:flex;border-top:1px solid var(--border);padding:10px 0 18px;z-index:100;box-shadow:0 -2px 16px rgba(44,24,16,0.07);}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:4px 0;color:var(--ink3);font-size:10px;font-weight:500;transition:color 0.2s;background:none;border:none;font-family:var(--ff-sans);}
.nav-btn.active{color:var(--rust);}
.nav-btn-icon{font-size:21px;}
.nav-indicator{width:20px;height:3px;border-radius:2px;background:var(--rust);margin:0 auto 2px;}

.screen{padding:0 0 88px;}

/* HOME */
.search-hero{background:linear-gradient(180deg,var(--white) 0%,var(--cream) 100%);padding:20px 20px 0;border-bottom:1px solid var(--border);}
.search-greeting{font-size:13px;color:var(--ink3);margin-bottom:4px;}
.search-heading{font-family:var(--ff-serif);font-size:26px;font-weight:700;color:var(--ink);line-height:1.2;margin-bottom:14px;}
.search-heading span{color:var(--rust);}
.search-box{display:flex;align-items:center;gap:10px;background:var(--white);border:1.5px solid var(--border);border-radius:14px;padding:12px 16px;margin-bottom:10px;transition:border 0.2s;box-shadow:0 1px 4px rgba(44,24,16,0.06);}
.search-box:focus-within{border-color:var(--rust);box-shadow:0 2px 8px rgba(200,98,47,0.12);}
.search-box input{flex:1;background:none;border:none;outline:none;font-family:var(--ff-sans);font-size:14px;color:var(--ink);}
.search-box input::placeholder{color:var(--ink3);}
.search-clear{background:none;border:none;font-size:16px;cursor:pointer;color:var(--ink3);padding:0;}
.filter-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:14px;scrollbar-width:none;}
.filter-scroll::-webkit-scrollbar{display:none;}
.filter-pill{white-space:nowrap;padding:8px 16px;border-radius:20px;border:1.5px solid var(--border);background:var(--white);font-family:var(--ff-sans);font-size:13px;font-weight:500;color:var(--ink2);cursor:pointer;transition:all 0.18s;flex-shrink:0;}
.filter-pill.active{background:var(--ink);color:var(--cream);border-color:var(--ink);}
.price-row{display:flex;gap:8px;padding:0 0 14px;}
.price-input-sm{flex:1;padding:9px 12px;border-radius:12px;border:1.5px solid var(--border);background:var(--white);font-family:var(--ff-sans);font-size:13px;color:var(--ink);outline:none;}
.price-input-sm:focus{border-color:var(--rust);}
.section-label{padding:18px 20px 12px;display:flex;align-items:baseline;justify-content:space-between;}
.section-label h2{font-family:var(--ff-serif);font-size:21px;font-weight:700;color:var(--ink);}
.section-label button{font-size:13px;color:var(--rust);font-weight:600;cursor:pointer;background:none;border:none;font-family:var(--ff-sans);}

/* PROPERTY CARD */
.prop-card{margin:0 20px 20px;background:var(--card);border-radius:20px;overflow:hidden;box-shadow:0 2px 0 var(--border),0 6px 20px rgba(44,24,16,0.09);cursor:pointer;transition:transform 0.2s,box-shadow 0.2s;animation:slideUp 0.5s cubic-bezier(.22,1,.36,1) both;}
.prop-card:focus{outline:3px solid var(--rust);outline-offset:2px;}
.prop-card:hover{box-shadow:0 2px 0 var(--border),0 12px 32px rgba(44,24,16,0.14);}
.prop-card:active{transform:scale(0.985);}
.prop-img{position:relative;width:100%;height:210px;overflow:hidden;}
.prop-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.4s ease;}
.prop-card:hover .prop-img img{transform:scale(1.03);}
.prop-badge{position:absolute;top:14px;left:14px;background:rgba(255,248,240,0.95);color:var(--ink);font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;}
.prop-badge.rust{background:var(--rust);color:white;}
.prop-badge.sage{background:var(--sage);color:white;}
.prop-badge.unavail{background:rgba(44,24,16,0.65);color:white;}
.prop-heart{position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;background:rgba(255,248,240,0.92);display:flex;align-items:center;justify-content:center;font-size:17px;cursor:pointer;border:none;box-shadow:0 2px 8px rgba(44,24,16,0.15);transition:transform 0.15s;}
.prop-heart:active{transform:scale(1.2);}
.prop-price-overlay{position:absolute;bottom:14px;left:14px;background:rgba(44,20,8,0.75);backdrop-filter:blur(8px);border-radius:12px;padding:6px 12px;}
.prop-price-big{font-family:var(--ff-serif);font-size:20px;font-weight:700;color:#FFF8F0;}
.prop-price-sub{font-size:10px;color:rgba(255,230,190,0.7);letter-spacing:0.3px;}
.prop-body{padding:16px;}
.prop-neighborhood{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--rust);margin-bottom:4px;}
.prop-title{font-family:var(--ff-serif);font-size:18px;font-weight:700;color:var(--ink);margin-bottom:4px;line-height:1.2;}
.prop-address{font-size:13px;color:var(--ink3);margin-bottom:12px;}
.prop-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
.prop-pill{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:8px;background:var(--cream);font-size:12px;font-weight:500;color:var(--ink2);}
.prop-footer{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);}
.prop-rating{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--ink);}
.prop-deposit{font-size:12px;color:var(--ink3);}
.no-results{padding:40px 20px;text-align:center;color:var(--ink3);font-size:14px;}
.no-results-icon{font-size:40px;margin-bottom:10px;}

/* SAVED */
.saved-header{padding:24px 20px 16px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,var(--cream) 0%,var(--paper) 100%);}
.saved-title{font-family:var(--ff-serif);font-size:26px;font-weight:700;color:var(--ink);}
.saved-sub{font-size:14px;color:var(--ink3);margin-top:4px;}
.empty-state{padding:56px 20px;text-align:center;}
.empty-state-icon{font-size:48px;margin-bottom:12px;}
.empty-state-title{font-family:var(--ff-serif);font-size:21px;font-weight:700;color:var(--ink);margin-bottom:8px;}
.empty-state-sub{font-size:14px;color:var(--ink3);line-height:1.6;}
.stats-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 20px 0;}
.stat-mini{background:var(--white);border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(44,24,16,0.05);}
.stat-mini-icon{font-size:22px;margin-bottom:8px;}
.stat-mini-num{font-family:var(--ff-serif);font-size:26px;font-weight:700;color:var(--ink);margin-bottom:2px;}
.stat-mini-num.rust{color:var(--rust);}
.stat-mini-num.sage{color:var(--sage);}
.stat-mini-label{font-size:12px;color:var(--ink3);}
.review-list{padding:16px 20px 0;}
.review-item{background:var(--white);border:1px solid var(--border);border-radius:16px;padding:16px;margin-bottom:12px;box-shadow:0 2px 6px rgba(44,24,16,0.05);}
.review-top{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.review-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:white;flex-shrink:0;}
.review-name{font-weight:700;font-size:14px;color:var(--ink);}
.review-meta{font-size:11px;color:var(--ink3);}
.review-stars{margin-left:auto;font-size:13px;}
.review-text{font-size:13px;color:var(--ink2);line-height:1.65;}
.write-review-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 40px);margin:14px 20px 0;padding:15px;border-radius:14px;border:2px dashed var(--border);background:var(--cream);color:var(--rust);font-family:var(--ff-sans);font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;}
.write-review-btn:hover{background:var(--sand);}
.rbar{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
.rbar-label{font-size:11px;color:var(--ink3);width:32px;}
.rbar-track{flex:1;height:5px;background:var(--sand);border-radius:3px;overflow:hidden;}
.rbar-fill{height:100%;background:var(--rust);border-radius:3px;}
.rbar-n{font-size:11px;color:var(--ink3);width:18px;text-align:right;}

/* POST */
.post-header{padding:24px 20px 20px;border-bottom:1px solid var(--border);background:linear-gradient(180deg,var(--cream) 0%,var(--paper) 100%);}
.post-title{font-family:var(--ff-serif);font-size:26px;font-weight:700;color:var(--ink);}
.post-sub{font-size:14px;color:var(--ink3);margin-top:4px;}
.post-form{padding:20px;}
.f-label{font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--ink3);margin-bottom:7px;display:block;}
.f-group{margin-bottom:16px;}
.f-input{width:100%;padding:13px 15px;border-radius:12px;border:1.5px solid var(--border);background:var(--white);font-family:var(--ff-sans);font-size:15px;color:var(--ink);outline:none;transition:border 0.2s,box-shadow 0.2s;}
.f-input:focus{border-color:var(--rust);box-shadow:0 2px 8px rgba(200,98,47,0.1);}
.f-input.err{border-color:var(--error);}
.f-textarea{width:100%;padding:13px 15px;border-radius:12px;border:1.5px solid var(--border);background:var(--white);font-family:var(--ff-sans);font-size:14px;color:var(--ink);outline:none;resize:none;min-height:88px;transition:border 0.2s;}
.f-textarea:focus{border-color:var(--rust);box-shadow:0 2px 8px rgba(200,98,47,0.1);}
.f-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.f-divider{font-family:var(--ff-serif);font-size:15px;font-weight:700;color:var(--ink);margin:4px 0 12px;display:flex;align-items:center;gap:10px;}
.f-divider::before,.f-divider::after{content:'';flex:1;height:1px;background:var(--border);}
.f-err{font-size:11px;color:var(--error);margin-top:4px;padding-left:2px;}
.f-upload{border:2px dashed var(--border);border-radius:14px;padding:26px;text-align:center;cursor:pointer;background:var(--cream);color:var(--ink3);font-size:13px;transition:border 0.2s,background 0.2s;}
.f-upload:hover{border-color:var(--rust);background:var(--sand);}
.f-upload-icon{font-size:26px;margin-bottom:6px;}
.img-thumb{border-radius:12px;overflow:hidden;aspect-ratio:1;position:relative;background:var(--sand);}
.img-thumb img{width:100%;height:100%;object-fit:cover;}
.f-submit{width:100%;padding:15px;border-radius:14px;border:none;background:linear-gradient(135deg,var(--rust),var(--rust-lt));color:white;font-family:var(--ff-sans);font-size:15px;font-weight:700;cursor:pointer;margin-top:8px;box-shadow:0 6px 20px rgba(200,98,47,0.35);transition:opacity 0.2s,transform 0.15s;}
.f-submit:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(200,98,47,0.45);}
.f-submit:disabled{opacity:0.5;cursor:not-allowed;transform:none;}

/* PROFILE */
.profile-top{padding:0;background:var(--cream);border-bottom:1px solid var(--border);}
.profile-cover{height:110px;background:url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=75') center/cover;position:relative;}
.profile-cover-overlay{position:absolute;inset:0;background:rgba(44,20,8,0.32);}
.profile-info{padding:0 20px 20px;margin-top:-28px;position:relative;}
.profile-av{width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,var(--rust),var(--rust-lt));color:white;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:700;border:3px solid var(--white);margin-bottom:10px;box-shadow:0 4px 12px rgba(200,98,47,0.3);}
.profile-name{font-family:var(--ff-serif);font-size:21px;font-weight:700;color:var(--ink);}
.profile-email{font-size:13px;color:var(--ink3);margin-top:2px;}
.profile-role-pill{display:inline-flex;align-items:center;gap:5px;background:var(--rust);color:white;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;margin-top:8px;}
.profile-slogan{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-top:6px;}
.profile-section{padding:18px 20px 0;}
.ps-label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ink3);margin-bottom:10px;}
.ps-item{display:flex;align-items:center;gap:12px;padding:13px 16px;background:var(--white);border:1px solid var(--border);border-radius:14px;margin-bottom:8px;cursor:pointer;transition:background 0.15s,box-shadow 0.15s;}
.ps-item:hover{background:var(--cream);box-shadow:0 2px 8px rgba(44,24,16,0.07);}
.ps-item:active{background:var(--sand);}
.ps-icon{width:38px;height:38px;border-radius:11px;background:var(--cream);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.ps-text{flex:1;}
.ps-name{font-size:14px;font-weight:600;color:var(--ink);}
.ps-sub{font-size:12px;color:var(--ink3);margin-top:1px;}
.ps-arrow{color:var(--ink3);font-size:18px;}
.ps-badge{background:var(--rust);color:white;font-size:10px;padding:2px 7px;border-radius:10px;margin-left:auto;}
.logout-btn{display:block;width:calc(100% - 40px);margin:16px 20px 0;padding:14px;border-radius:14px;border:1.5px solid #F5C5B0;background:#FEF0E8;color:#A03018;font-family:var(--ff-sans);font-size:14px;font-weight:600;cursor:pointer;transition:background 0.2s;}
.logout-btn:hover{background:#FDE0D0;}
.footer-brand{text-align:center;padding:20px 20px 0;}
.footer-logo{font-family:var(--ff-serif);font-size:15px;font-weight:700;color:var(--rust);}
.footer-logo em{color:var(--ink);font-style:normal;}
.footer-rule{width:40px;height:2px;background:var(--border);margin:8px auto;}
.footer-slogan{font-size:9px;letter-spacing:2.5px;text-transform:uppercase;color:var(--ink3);}
.footer-copy{font-size:10px;color:var(--border);margin-top:6px;}
.app-badge{display:inline-flex;align-items:center;gap:5px;background:var(--cream);border:1px solid var(--border);border-radius:20px;padding:3px 10px;font-size:10px;color:var(--ink3);}

/* NOTIFICATIONS PANEL */
.notif-panel{position:fixed;top:0;right:0;bottom:0;width:min(320px,100vw);background:var(--paper);z-index:200;box-shadow:-4px 0 24px rgba(44,24,16,0.14);display:flex;flex-direction:column;animation:slideFromRight 0.3s cubic-bezier(.22,1,.36,1);}
@keyframes slideFromRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
.notif-header{padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--cream);}
.notif-title{font-family:var(--ff-serif);font-size:20px;font-weight:700;color:var(--ink);}
.notif-close{background:none;border:none;font-size:18px;cursor:pointer;color:var(--ink3);}
.notif-item{display:flex;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s;}
.notif-item.unread{background:#FEF5EC;}
.notif-item:hover{background:var(--cream);}
.notif-icon{font-size:22px;flex-shrink:0;margin-top:2px;}
.notif-item-title{font-size:13px;font-weight:600;color:var(--ink);}
.notif-item-body{font-size:12px;color:var(--ink3);margin-top:2px;line-height:1.4;}
.notif-item-time{font-size:10px;color:var(--ink3);margin-top:4px;}
.notif-unread-dot{width:7px;height:7px;border-radius:50%;background:var(--rust);margin-top:6px;flex-shrink:0;}

/* APPLICATIONS */
.app-item{display:flex;align-items:center;gap:12px;padding:13px 16px;background:var(--white);border:1px solid var(--border);border-radius:14px;margin-bottom:8px;}
.app-status{font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-left:auto;}
.app-status.pending{background:#FEF3C7;color:#92400E;}
.app-status.approved{background:#D1FAE5;color:#065F46;}
.app-status.rejected{background:#FEE2E2;color:#991B1B;}

/* MODAL */
.modal-bg{position:fixed;inset:0;background:rgba(44,20,8,0.5);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
.modal-sheet{background:var(--paper);border-radius:24px 24px 0 0;padding:20px 20px 40px;width:100%;max-width:430px;max-height:88vh;overflow-y:auto;position:relative;box-shadow:0 -8px 32px rgba(44,24,16,0.15);}
.modal-handle{width:36px;height:4px;background:var(--border);border-radius:4px;margin:0 auto 18px;}
.modal-title{font-family:var(--ff-serif);font-size:22px;font-weight:700;color:var(--ink);margin-bottom:16px;}
.modal-close{position:absolute;top:18px;right:18px;background:var(--cream);border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;color:var(--ink2);}

/* TOAST */
.toast{position:fixed;bottom:96px;left:50%;transform:translateX(-50%);padding:11px 20px;border-radius:30px;font-size:13px;font-weight:600;z-index:300;box-shadow:0 8px 24px rgba(44,24,16,0.2);white-space:nowrap;animation:slideUp 0.3s cubic-bezier(.22,1,.36,1) both;display:flex;align-items:center;gap:8px;}
.toast.success{background:var(--ink);color:#FFF8F0;}
.toast.error{background:#FEE2E2;color:#991B1B;}
`;

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
//  IMAGE UPLOADER COMPONENT
//  - Multi-image selection (up to 6 photos)
//  - Instant preview thumbnails
//  - File type & size validation (max 5MB each)
//  - Drag & drop support
//  - Remove individual images
//  - Upload progress simulation (replace with real Supabase upload)
//  Wire to real backend: import { uploadPropertyImage } from "./lazarental_supabase"
// ═══════════════════════════════════════════════════════════════
interface UploadedImage { id: string; file: File; preview: string; progress: number; done: boolean; error: string|null; }

function ImageUploader() {
  const [images, setImages]       = useState<UploadedImage[]>([]);
  const [dragging, setDragging]   = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const MAX_FILES = 6;
  const MAX_SIZE  = 5 * 1024 * 1024; // 5MB

  const processFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_FILES - images.length;
    if (remaining <= 0) return;
    const valid = arr.slice(0, remaining).filter(f => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > MAX_SIZE) return false;
      return true;
    });
    const newImgs: UploadedImage[] = valid.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      preview: URL.createObjectURL(f),
      progress: 0,
      done: false,
      error: null,
    }));
    setImages(prev => [...prev, ...newImgs]);
    // Simulate upload progress for each
    newImgs.forEach(img => simulateUpload(img.id));
  };

  const simulateUpload = (id: string) => {
    // In production replace this with:
    // const { url, error } = await uploadPropertyImage(file, userId);
    let prog = 0;
    const tick = setInterval(() => {
      prog += Math.random() * 25 + 10;
      if (prog >= 100) { prog = 100; clearInterval(tick); }
      setImages(prev => prev.map(img =>
        img.id === id ? { ...img, progress: Math.min(prog, 100), done: prog >= 100 } : img
      ));
    }, 200);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div style={{marginBottom:18}}>
      <label style={{fontSize:11,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",color:"var(--ink3)",marginBottom:8,display:"block"}}>
        Property Photos <span style={{color:"var(--ink3)",fontWeight:400,textTransform:"none",letterSpacing:0}}>({images.length}/{MAX_FILES})</span>
      </label>

      {/* Drop zone */}
      {images.length < MAX_FILES && (
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={handleDrop}
          onClick={()=>inputRef.current?.click()}
          role="button" tabIndex={0} aria-label="Upload property photos"
          onKeyDown={e=>e.key==="Enter"&&inputRef.current?.click()}
          style={{
            border:`2px dashed ${dragging?"var(--rust)":"var(--border)"}`,
            borderRadius:14,
            padding:"24px 20px",
            textAlign:"center",
            cursor:"pointer",
            background:dragging?"var(--sand)":"var(--cream)",
            transition:"all 0.2s",
            marginBottom:images.length>0?12:0,
          }}>
          <div style={{fontSize:32,marginBottom:8}}>📸</div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--ink2)",marginBottom:4}}>
            {dragging?"Drop photos here":"Tap to add photos"}
          </div>
          <div style={{fontSize:11,color:"var(--ink3)"}}>
            JPG, PNG, WebP · Max 5MB each · Up to {MAX_FILES} photos
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{display:"none"}}
            aria-label="Select property photos"
            onChange={e=>{ if(e.target.files) processFiles(e.target.files); e.target.value=""; }}
          />
        </div>
      )}

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {images.map((img,idx) => (
            <div key={img.id} style={{position:"relative",borderRadius:12,overflow:"hidden",aspectRatio:"1",background:"var(--sand)"}}>
              <img src={img.preview} alt={`Property photo ${idx+1}`}
                style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>

              {/* Upload progress overlay */}
              {!img.done && (
                <div style={{position:"absolute",inset:0,background:"rgba(44,20,8,0.55)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
                  <div style={{width:"60%",height:4,background:"rgba(255,255,255,0.3)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${img.progress}%`,background:"white",borderRadius:2,transition:"width 0.2s"}}/>
                  </div>
                  <div style={{fontSize:11,color:"white",fontWeight:600}}>{Math.round(img.progress)}%</div>
                </div>
              )}

              {/* Done checkmark */}
              {img.done && (
                <div style={{position:"absolute",top:6,left:6,width:20,height:20,background:"var(--sage)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"white",fontWeight:700}}>✓</div>
              )}

              {/* Cover photo badge on first */}
              {idx===0 && img.done && (
                <div style={{position:"absolute",bottom:6,left:6,background:"rgba(44,20,8,0.75)",color:"white",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:8,letterSpacing:"0.5px"}}>COVER</div>
              )}

              {/* Remove button */}
              <button onClick={()=>removeImage(img.id)} aria-label={`Remove photo ${idx+1}`}
                style={{position:"absolute",top:6,right:6,width:22,height:22,border:"none",borderRadius:"50%",background:"rgba(200,98,47,0.9)",color:"white",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
                ✕
              </button>
            </div>
          ))}

          {/* Add more slot */}
          {images.length < MAX_FILES && (
            <div onClick={()=>inputRef.current?.click()} role="button" tabIndex={0}
              style={{borderRadius:12,aspectRatio:"1",background:"var(--cream)",border:"2px dashed var(--border)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:4,transition:"all 0.2s"}}
              onMouseOver={e=>(e.currentTarget.style.borderColor="var(--rust)")}
              onMouseOut={e=>(e.currentTarget.style.borderColor="var(--border)")}>
              <div style={{fontSize:22,color:"var(--ink3)"}}>+</div>
              <div style={{fontSize:10,color:"var(--ink3)",fontWeight:600}}>Add more</div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {images.length > 0 && (
        <div style={{marginTop:8,padding:"8px 12px",background:"#F0F7F1",borderRadius:10,fontSize:11,color:"var(--sage)",display:"flex",alignItems:"center",gap:6}}>
          💡 First photo is your cover image · Drag to reorder coming soon
        </div>
      )}
    </div>
  );
}

export default function LazaRental() {
  // ── State ──
  const [screen, setScreen]           = useState<Screen>("auth");
  const [authMode, setAuthMode]       = useState<"login"|"register">("login");
  const [role, setRole] = useState<Role>(()=>{
    try { return (localStorage.getItem("lr_role") as Role) || "tenant"; } catch { return "tenant"; }
  });
  // Persist role on change
  const switchRole = (r: Role) => { setRole(r); try { localStorage.setItem("lr_role", r); } catch {} };
  const [tab, setTab]                 = useState<Tab>("home");
  const [selected, setSelected]       = useState<House|null>(null);
  const [chatHouse, setChatHouse]     = useState<House|null>(null);
  const [favorites, setFavorites]     = useState<number[]>([1]);
  const [applications, setApplications] = useState<Application[]>([
    {id:1,houseId:2,status:"approved",date:"Feb 2026"}
  ]);
  const [reviews, setReviews]         = useState<Review[]>(INIT_REVIEWS);
  const [messages, setMessages]       = useState<Message[]>(INIT_MESSAGES);
  const [notifications, setNotifications] = useState<Notification[]>(INIT_NOTIFS);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [toast, setToast]             = useState<{msg:string;type:"success"|"error"}|null>(null);

  // Search & filter state
  const [searchQ, setSearchQ]         = useState("");
  const [bedFilter, setBedFilter]     = useState("Any");
  const [minPrice, setMinPrice]       = useState("");
  const [maxPrice, setMaxPrice]       = useState("");
  const [sortBy, setSortBy]           = useState("latest");
  const [showMap, setShowMap]         = useState(false);
  const [loading, setLoading]         = useState(false);

  // Auth form
  const [auth, setAuth] = useState<AuthForm>({name:"",email:"",password:"",confirmPassword:"",phone:"",nameErr:"",emailErr:"",passErr:"",confirmErr:""});

  // Post form
  const [pf, setPf] = useState<PostForm>({title:"",address:"",neighborhood:"",plotNumber:"",totalUnits:"1",bedrooms:"2",bathrooms:"1",sqft:"",price:"",deposit:"",bylaw1:"",bylaw2:"",bylaw3:"",refundRule:"",description:"",securityDetails:"",titleErr:"",priceErr:"",addressErr:""});

  // Review modal
  const [reviewModal, setReviewModal] = useState(false);
  const [newR, setNewR]               = useState({text:"",rating:5,property:""});

  // User
  const user = { name: role==="landlord"?"James Osei":"Alex Owusu", email:"alex@email.com", phone:"+1 555 0192" };

  const unreadCount = notifications.filter(n=>!n.read).length;

  // ── Helpers ──
  const showToast = useCallback((msg:string, type:"success"|"error"="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null), 2800);
  }, []);

  const toggleFav = useCallback((id:number) => {
    const was = favorites.includes(id);
    setFavorites(f => was ? f.filter(x=>x!==id) : [...f,id]);
    showToast(was ? "Removed from saved" : "❤️ Saved!", "success");
  }, [favorites, showToast]);

  const applyToHouse = useCallback((id:number) => {
    if (applications.some(a=>a.houseId===id)) return;
    setApplications(a=>[...a,{id:Date.now(),houseId:id,status:"pending",date:"Apr 2026"}]);
    showToast("✅ Application submitted!", "success");
  }, [applications, showToast]);

  const sendMessage = useCallback((text:string) => {
    setMessages(m=>[...m,{id:Date.now(),from:"user",text,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
    setTimeout(()=>{
      setMessages(m=>[...m,{id:Date.now()+1,from:"landlord",text:"Thanks for your message! I'll get back to you shortly.",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}]);
    }, 1500);
  }, []);

  const markNotifsRead = useCallback(() => {
    setNotifications(n=>n.map(x=>({...x,read:true})));
  }, []);

  // Load persisted listings from localStorage
  const [publishedListings, setPublishedListings] = useState<House[]>(()=>{
    try {
      const saved = localStorage.getItem("lr_listings");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // All houses = seed + published
  const allHouses = [...HOUSES, ...publishedListings];

  // Simulate loading on filter change
  useEffect(()=>{
    setLoading(true);
    const t = setTimeout(()=>setLoading(false), 600);
    return ()=>clearTimeout(t);
  }, [bedFilter, minPrice, maxPrice, searchQ, sortBy]);

  // ── Filter logic ──
  const filtered = allHouses.filter(h => {
    const qOk = !searchQ || h.title.toLowerCase().includes(searchQ.toLowerCase()) || h.neighborhood.toLowerCase().includes(searchQ.toLowerCase()) || h.address.toLowerCase().includes(searchQ.toLowerCase());
    const bOk = bedFilter==="Any" || h.bedrooms===parseInt(bedFilter);
    const mnOk = !minPrice || h.price>=parseInt(minPrice);
    const mxOk = !maxPrice || h.price<=parseInt(maxPrice);
    return qOk && bOk && mnOk && mxOk;
  }).sort((a,b)=>
    sortBy==="price-low"  ? a.price-b.price :
    sortBy==="price-high" ? b.price-a.price :
    sortBy==="rating"     ? b.rating-a.rating : b.id-a.id
  );

  // ── Auth validation ──
  const validateAuth = (): boolean => {
    let ok = true;
    const errs: Partial<AuthForm> = {nameErr:"",emailErr:"",passErr:"",confirmErr:""};
    if (authMode==="register" && !auth.name.trim()) { errs.nameErr="Name is required"; ok=false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(auth.email)) { errs.emailErr="Enter a valid email"; ok=false; }
    if (auth.password.length < 6) { errs.passErr="Min 6 characters"; ok=false; }
    if (authMode==="register" && auth.password !== auth.confirmPassword) { errs.confirmErr="Passwords don't match"; ok=false; }
    setAuth(a=>({...a,...errs}));
    return ok;
  };

  // ── Post validation ──
  const validatePost = (): boolean => {
    let ok = true;
    const errs: Partial<PostForm> = {titleErr:"",priceErr:"",addressErr:""};
    if (!pf.title.trim()) { errs.titleErr="Title required"; ok=false; }
    if (!pf.address.trim()) { errs.addressErr="Address required"; ok=false; }
    if (!pf.price || parseInt(pf.price)<=0) { errs.priceErr="Enter a valid rent"; ok=false; }
    setPf(p=>({...p,...errs}));
    return ok;
  };

  // ── CHAT screen ──
  if (chatHouse) return (
    <div className="app"><style>{styles}</style>
      <ChatScreen house={chatHouse} messages={messages} onClose={()=>setChatHouse(null)} onSend={sendMessage}/>
    </div>
  );

  // ── DETAIL screen ──
  if (selected) return (
    <div className="app"><style>{styles}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      <DetailScreen house={selected} favorites={favorites} applications={applications}
        onBack={()=>setSelected(null)} onFav={toggleFav} onApply={applyToHouse}
        onChat={()=>{ setChatHouse(selected); setSelected(null); }}/>
    </div>
  );

  // ── AUTH screen ──
  if (screen==="auth") {
    const [showPass, setShowPass]        = useState(false);
    const [showConfirm, setShowConfirm]  = useState(false);
    const [forgotSent, setForgotSent]    = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
      if (!validateAuth()) return;
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setScreen("main");
      }, 800);
    };

    const handleForgot = () => {
      if (!auth.email) { showToast("Enter your email first", "error"); return; }
      setForgotSent(true);
      showToast("📧 Reset link sent to " + auth.email, "success");
    };

    return (
      <div className="app"><style>{styles}</style>
        {toast && <div className={`toast ${toast.type}`} role="status">{toast.msg}</div>}
        <div className="login" role="main">
          <div className="login-photo" aria-hidden="true"/>
          <div className="login-overlay" aria-hidden="true"/>
          <div className="login-content">

            {/* Logo */}
            <div className="login-logo-row">
              <div className="login-logo-icon" aria-hidden="true"><HouseIcon/></div>
              <div>
                <div className="login-logo-name">Laza<em>Rental</em></div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.45)",letterSpacing:"1.5px",textTransform:"uppercase",marginTop:2}}>{SLOGAN}</div>
              </div>
            </div>

            {/* Hero copy */}
            <div className="login-badge"><div className="login-badge-dot"/><span className="login-badge-text">{SLOGAN}</span></div>
            <div className="login-headline">Find a home your <em>family</em> deserves.</div>
            <div className="login-sub">Verified landlords · Clear bylaws · Fair deposits.<br/>No more nasty surprises.</div>

            {/* Tab switcher */}
            <div className="login-tabs" role="tablist">
              <button role="tab" aria-selected={authMode==="login"}
                className={`login-tab ${authMode==="login"?"active":""}`}
                onClick={()=>{setAuthMode("login");setAuth(a=>({...a,nameErr:"",emailErr:"",passErr:"",confirmErr:""}));}}>
                Sign In
              </button>
              <button role="tab" aria-selected={authMode==="register"}
                className={`login-tab ${authMode==="register"?"active":""}`}
                onClick={()=>{setAuthMode("register");setAuth(a=>({...a,nameErr:"",emailErr:"",passErr:"",confirmErr:""}));}}>
                Register
              </button>
            </div>

            {/* Google OAuth */}
            <button className="login-google" onClick={()=>showToast("Google sign-in coming soon!", "success")} aria-label="Continue with Google">
              <svg className="login-google-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="login-divider">
              <div className="login-divider-line"/>
              <span className="login-divider-text">or {authMode==="login"?"sign in":"register"} with email</span>
              <div className="login-divider-line"/>
            </div>

            {/* Role selector — register only */}
            {authMode==="register" && (
              <div className="role-row" role="group" aria-label="Select your role">
                <button className={`role-chip ${role==="tenant"?"active":""}`} onClick={()=>switchRole("tenant")} aria-pressed={role==="tenant"}>
                  <span className="role-chip-icon" aria-hidden="true">🧳</span> Tenant
                </button>
                <button className={`role-chip ${role==="landlord"?"active":""}`} onClick={()=>switchRole("landlord")} aria-pressed={role==="landlord"}>
                  <span className="role-chip-icon" aria-hidden="true">🏠</span> Landlord
                </button>
              </div>
            )}

            {/* Full name — register only */}
            {authMode==="register" && (
              <div className="login-field-wrap">
                <input className={`login-field no-icon${auth.nameErr?" field-shake":""}`}
                  placeholder="Full name" aria-label="Full name"
                  autoComplete="name" value={auth.name}
                  onChange={e=>setAuth(a=>({...a,name:e.target.value,nameErr:""}))}/>
                {auth.nameErr && <div className="field-err" role="alert">⚠ {auth.nameErr}</div>}
              </div>
            )}

            {/* Email */}
            <div className="login-field-wrap">
              <input className={`login-field no-icon${auth.emailErr?" field-shake":""}`}
                placeholder="Email address" type="email" aria-label="Email address"
                autoComplete="email" value={auth.email}
                onChange={e=>setAuth(a=>({...a,email:e.target.value,emailErr:""}))}/>
              {auth.emailErr && <div className="field-err" role="alert">⚠ {auth.emailErr}</div>}
            </div>

            {/* Password */}
            <div className="login-field-wrap">
              <input className={`login-field${auth.passErr?" field-shake":""}`}
                placeholder={authMode==="login"?"Password":"Create password (min 6 chars)"}
                type={showPass?"text":"password"} aria-label="Password"
                autoComplete={authMode==="login"?"current-password":"new-password"}
                value={auth.password}
                onChange={e=>setAuth(a=>({...a,password:e.target.value,passErr:""}))}/>
              <button className="pass-toggle" onClick={()=>setShowPass(s=>!s)} aria-label={showPass?"Hide password":"Show password"}>
                {showPass ? "🙈" : "👁"}
              </button>
              {auth.passErr && <div className="field-err" role="alert">⚠ {auth.passErr}</div>}
            </div>

            {/* Forgot password — login only */}
            {authMode==="login" && (
              <button className="login-forgot" onClick={handleForgot} aria-label="Forgot password">
                {forgotSent ? "✅ Reset link sent!" : "Forgot password?"}
              </button>
            )}

            {/* Confirm password + phone — register only */}
            {authMode==="register" && (
              <>
                <div className="login-field-wrap">
                  <input className={`login-field${auth.confirmErr?" field-shake":""}`}
                    placeholder="Confirm password" type={showConfirm?"text":"password"}
                    aria-label="Confirm password"
                    value={auth.confirmPassword}
                    onChange={e=>setAuth(a=>({...a,confirmPassword:e.target.value,confirmErr:""}))}/>
                  <button className="pass-toggle" onClick={()=>setShowConfirm(s=>!s)} aria-label={showConfirm?"Hide":"Show"}>
                    {showConfirm?"🙈":"👁"}
                  </button>
                  {auth.confirmErr && <div className="field-err" role="alert">⚠ {auth.confirmErr}</div>}
                </div>
                <div className="login-field-wrap">
                  <input className="login-field no-icon" placeholder="Phone number (optional)"
                    type="tel" aria-label="Phone number"
                    value={auth.phone}
                    onChange={e=>setAuth(a=>({...a,phone:e.target.value}))}/>
                </div>
              </>
            )}

            {/* CTA */}
            <button className="login-cta" disabled={isSubmitting} onClick={handleSubmit}
              aria-label={authMode==="login"?"Sign in":"Create account"}>
              {isSubmitting
                ? <><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.4)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> Signing in…</>
                : authMode==="login" ? "Welcome back →" : "Create account →"
              }
            </button>

            {/* Switch mode */}
            <div className="login-switch">
              {authMode==="login" ? "Don't have an account?" : "Already a member?"}
              <button onClick={()=>{setAuthMode(authMode==="login"?"register":"login");setAuth({name:"",email:"",password:"",confirmPassword:"",phone:"",nameErr:"",emailErr:"",passErr:"",confirmErr:""});}}>
                {authMode==="login" ? "Register free" : "Sign in"}
              </button>
            </div>

            {/* Trust signals */}
            <div className="login-trust">
              <div className="login-trust-item">🔒 SSL Secure</div>
              <div className="login-trust-dot"/>
              <div className="login-trust-item">✅ Verified Landlords</div>
              <div className="login-trust-dot"/>
              <div className="login-trust-item">🛡 Data Protected</div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── MAIN APP ──
  const avgRating = (reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(1);
  const ratingDist = [5,4,3,2,1].map(n=>({n,count:reviews.filter(r=>r.rating===n).length}));

  return (
    <div className="app"><style>{styles}</style>
      {toast && <div className={`toast ${toast.type}`} role="status" aria-live="polite">{toast.msg}</div>}

      {/* NOTIFICATIONS PANEL */}
      {showNotifs && (
        <div className="notif-panel" role="dialog" aria-label="Notifications" aria-modal="true">
          <div className="notif-header">
            <div className="notif-title">Notifications</div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <button style={{background:"none",border:"none",fontSize:12,color:"var(--rust)",cursor:"pointer",fontFamily:"var(--ff-sans)",fontWeight:600}} onClick={markNotifsRead}>Mark all read</button>
              <button className="notif-close" onClick={()=>setShowNotifs(false)} aria-label="Close notifications">✕</button>
            </div>
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {notifications.map(n=>(
              <div key={n.id} className={`notif-item ${!n.read?"unread":""}`} onClick={()=>setNotifications(prev=>prev.map(x=>x.id===n.id?{...x,read:true}:x))} role="button" tabIndex={0} aria-label={n.title}>
                <span className="notif-icon" aria-hidden="true">{n.icon}</span>
                <div style={{flex:1}}>
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-body">{n.body}</div>
                  <div className="notif-item-time">{n.time}</div>
                </div>
                {!n.read && <div className="notif-unread-dot" aria-hidden="true"/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo-mark" aria-hidden="true"><HouseIcon/></div>
          <div>
            <div className="topbar-name" aria-label="LazaRental">Laza<em>Rental</em></div>
            <div className="topbar-slogan">{SLOGAN}</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="topbar-pill" aria-label={`Signed in as ${role}`}>{role}</span>
          <button className="notif-btn" onClick={()=>{setShowNotifs(!showNotifs);markNotifsRead();}} aria-label={`Notifications — ${unreadCount} unread`}>
            🔔{unreadCount>0&&<span className="notif-dot" aria-hidden="true"/>}
          </button>
          <div className="topbar-avatar" onClick={()=>setTab("profile")} role="button" tabIndex={0} aria-label="Go to profile">{ini(user.name)}</div>
        </div>
      </header>

      {/* ════ HOME ════ */}
      {tab==="home" && (
        <main className="screen" aria-label="Explore listings">
          <div className="search-hero">
            <div className="search-greeting" aria-label={`Greeting for ${user.name.split(" ")[0]}`}>Good day, {user.name.split(" ")[0]} 👋</div>
            <h1 className="search-heading">Find a home<br/>you'll <span>love</span>.</h1>

            {/* Live search */}
            <div className="search-box" role="search">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="City, neighbourhood, street…" aria-label="Search properties" autoComplete="off"/>
              {searchQ && <button className="search-clear" onClick={()=>setSearchQ("")} aria-label="Clear search">✕</button>}
            </div>

            {/* Bed filters */}
            <div className="filter-scroll" role="group" aria-label="Filter by bedrooms">
              {["Any","1","2","3","4+"].map((f,i)=>(
                <button key={f} className={`filter-pill ${(i===0&&bedFilter==="Any")||(i>0&&bedFilter===String(i))?"active":""}`}
                  aria-pressed={(i===0&&bedFilter==="Any")||(i>0&&bedFilter===String(i))}
                  onClick={()=>setBedFilter(i===0?"Any":i<4?String(i):"4")}>
                  {i===0?"Any beds":`${f} bed${parseInt(f)>1?"s":""}`}
                </button>
              ))}
            </div>

            {/* Price range */}
            <div className="price-row">
              <input className="price-input-sm" type="number" placeholder="Min $" aria-label="Minimum price" value={minPrice} onChange={e=>setMinPrice(e.target.value)}/>
              <input className="price-input-sm" type="number" placeholder="Max $" aria-label="Maximum price" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}/>
              <button onClick={()=>{setMinPrice("");setMaxPrice("");}} aria-label="Clear price filter"
                style={{padding:"9px 12px",borderRadius:12,border:"1.5px solid var(--border)",background:"var(--white)",fontSize:12,color:"var(--rust)",fontWeight:600,cursor:"pointer",fontFamily:"var(--ff-sans)",whiteSpace:"nowrap"}}>
                Clear
              </button>
            </div>
          </div>

          {/* Sort + count row */}
          <div style={{padding:"14px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:13,color:"var(--ink3)"}} aria-live="polite" aria-atomic="true">
              <strong style={{color:"var(--ink)"}}>{filtered.length}</strong> home{filtered.length!==1?"s":""} found
            </span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={()=>setShowMap(!showMap)} aria-pressed={showMap}
                style={{padding:"6px 12px",borderRadius:10,border:"1.5px solid var(--border)",background:showMap?"var(--ink)":"var(--white)",color:showMap?"white":"var(--ink2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--ff-sans)"}}>
                {showMap?"📋 List":"🗺 Map"}
              </button>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} aria-label="Sort listings"
                style={{fontSize:12,border:"1.5px solid var(--border)",borderRadius:10,padding:"6px 10px",background:"var(--white)",fontFamily:"var(--ff-sans)",color:"var(--ink)",outline:"none",cursor:"pointer"}}>
                <option value="latest">Newest</option>
                <option value="price-low">Price ↑</option>
                <option value="price-high">Price ↓</option>
                <option value="rating">Top rated</option>
              </select>
            </div>
          </div>

          {/* Map toggle */}
          {showMap && (
            <div style={{padding:"16px 20px 0"}}>
              <MapView houses={allHouses} onSelect={h=>{setSelected(h);setShowMap(false);}}/>
            </div>
          )}

          <div className="section-label">
            <h2>All Listings</h2>
            <button onClick={()=>{ setBedFilter("Any");setMinPrice("");setMaxPrice("");setSearchQ(""); }}>Reset filters</button>
          </div>

          {/* Skeleton or results */}
          {loading ? (
            [0,1,2].map(i=><SkeletonCard key={i}/>)
          ) : filtered.length===0 ? (
            <div className="no-results" role="status">
              <div className="no-results-icon">🔍</div>
              <div>No homes match your search.</div>
              <button onClick={()=>{setBedFilter("Any");setMinPrice("");setMaxPrice("");setSearchQ("");}}
                style={{marginTop:12,padding:"8px 20px",background:"var(--rust)",color:"white",border:"none",borderRadius:12,fontFamily:"var(--ff-sans)",fontWeight:600,cursor:"pointer",fontSize:13}}>
                Clear all filters
              </button>
            </div>
          ) : filtered.map((h,idx)=>(
            <article key={h.id} className="prop-card" role="article" aria-label={`${h.title}, ${h.neighborhood}`}
              tabIndex={0} style={{animationDelay:`${idx*70}ms`}}
              onClick={()=>setSelected(h)} onKeyDown={e=>e.key==="Enter"&&setSelected(h)}>
              <div className="prop-img">
                <img src={h.img} alt={`${h.title} exterior`} loading={idx===0?"eager":"lazy"}/>
                {h.badge && <div className={`prop-badge ${h.badge==="Top Rated"?"sage":h.badge==="Featured"?"rust":""}`}>{h.badge}</div>}
                {!h.available && <div className="prop-badge unavail">Unavailable</div>}
                <button className="prop-heart" onClick={e=>{e.stopPropagation();toggleFav(h.id);}} aria-label={favorites.includes(h.id)?`Remove ${h.title} from saved`:`Save ${h.title}`}>
                  {favorites.includes(h.id)?"❤️":"🤍"}
                </button>
                <div className="prop-price-overlay" aria-hidden="true">
                  <div className="prop-price-big">{fmtPrice(h.price)}</div>
                  <div className="prop-price-sub">PER MONTH</div>
                </div>
              </div>
              <div className="prop-body">
                <div className="prop-neighborhood">{h.neighborhood}</div>
                <h3 className="prop-title">{h.title}</h3>
                <div className="prop-address">📍 {h.address}</div>
                <div className="prop-pills">
                  <div className="prop-pill">🛏 {h.bedrooms} bed{h.bedrooms>1?"s":""}</div>
                  <div className="prop-pill">🚿 {h.bathrooms} bath{h.bathrooms>1?"s":""}</div>
                  <div className="prop-pill">📐 {h.sqft} sqft</div>
                </div>
                <div className="prop-footer">
                  <div className="prop-rating">
                    ⭐ <strong>{h.rating}</strong>
                    <span style={{color:"var(--ink3)",fontWeight:400}}>({h.reviews})</span>
                    {h.landlordVerified&&<span style={{background:"var(--sage)",color:"white",fontSize:9,padding:"1px 6px",borderRadius:8,fontWeight:600,marginLeft:4}}>✓ Verified</span>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                    <div className="prop-deposit">Deposit: <strong>{fmtPrice(h.deposit)}</strong></div>
                    {h.views!=null&&<div style={{fontSize:10,color:"var(--ink3)"}}>👁 {h.views} views</div>}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </main>
      )}

      {/* ════ SAVED ════ */}
      {tab==="saved" && (
        <main className="screen" aria-label="Saved homes and community reviews">
          <div className="saved-header">
            <h1 className="saved-title">Saved & Reviews</h1>
            <div className="saved-sub">{favorites.length} saved · {applications.length} application{applications.length!==1?"s":""}</div>
          </div>

          {/* Stats */}
          <div className="stats-row" aria-label="Platform statistics">
            {[
              {icon:"🏘️",num:allHouses.length, label:"Total listings",  cls:""},
              {icon:"⭐",num:avgRating,         label:"Avg rating",      cls:"rust"},
              {icon:"📝",num:reviews.length,    label:"Reviews",         cls:"sage"},
              {icon:"🔑",num:applications.length,label:"Your applications",cls:""},
            ].map((s,i)=>(
              <div key={i} className="stat-mini">
                <div className="stat-mini-icon" aria-hidden="true">{s.icon}</div>
                <div className={`stat-mini-num ${s.cls}`}>{s.num}</div>
                <div className="stat-mini-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Applications */}
          {applications.length>0 && (
            <div className="profile-section">
              <div className="ps-label">Your Applications</div>
              {applications.map(a=>{
                const h = HOUSES.find(x=>x.id===a.houseId);
                if(!h) return null;
                return (
                  <div key={a.id} className="app-item">
                    <div className="ps-icon" aria-hidden="true">🏠</div>
                    <div className="ps-text"><div className="ps-name">{h.title}</div><div className="ps-sub">{h.neighborhood} · Applied {a.date}</div></div>
                    <span className={`app-status ${a.status}`} role="status">{a.status.charAt(0).toUpperCase()+a.status.slice(1)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Saved listings */}
          <div className="section-label"><h2>Saved Homes</h2></div>
          {favorites.length===0 ? (
            <div className="empty-state" role="status">
              <div className="empty-state-icon" aria-hidden="true">🤍</div>
              <div className="empty-state-title">Nothing saved yet</div>
              <div className="empty-state-sub">Tap the heart on any listing to save it here for easy comparison.</div>
            </div>
          ) : allHouses.filter(h=>favorites.includes(h.id)).map(h=>(
            <article key={h.id} className="prop-card" role="article" aria-label={h.title} tabIndex={0}
              onClick={()=>setSelected(h)} onKeyDown={e=>e.key==="Enter"&&setSelected(h)}>
              <div className="prop-img">
                <img src={h.img} alt={h.title} loading="lazy"/>
                <button className="prop-heart" onClick={e=>{e.stopPropagation();toggleFav(h.id);}} aria-label={`Remove ${h.title} from saved`}>❤️</button>
                <div className="prop-price-overlay" aria-hidden="true">
                  <div className="prop-price-big">{fmtPrice(h.price)}</div>
                  <div className="prop-price-sub">PER MONTH</div>
                </div>
              </div>
              <div className="prop-body">
                <div className="prop-neighborhood">{h.neighborhood}</div>
                <h3 className="prop-title">{h.title}</h3>
                <div className="prop-footer">
                  <div className="prop-rating">⭐ <strong>{h.rating}</strong></div>
                  <div className="prop-deposit">Deposit: <strong>{fmtPrice(h.deposit)}</strong></div>
                </div>
              </div>
            </article>
          ))}

          {/* Reviews */}
          <div className="review-list">
            <div className="section-label" style={{padding:"20px 0 12px"}}><h2>Community Reviews</h2></div>
            <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:16,padding:16,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{fontFamily:"var(--ff-serif)",fontSize:44,fontWeight:700,color:"var(--ink)",lineHeight:1}} aria-label={`Average rating ${avgRating}`}>{avgRating}</div>
                <div><div style={{fontSize:18,color:"var(--gold)"}} aria-hidden="true">⭐⭐⭐⭐⭐</div><div style={{fontSize:12,color:"var(--ink3)",marginTop:3}}>Based on {reviews.length} reviews</div></div>
              </div>
              {ratingDist.map(d=>(
                <div className="rbar" key={d.n}>
                  <span className="rbar-label" aria-label={`${d.n} stars`}>{d.n}★</span>
                  <div className="rbar-track" role="meter" aria-valuenow={d.count} aria-valuemin={0} aria-valuemax={reviews.length}>
                    <div className="rbar-fill" style={{width:`${(d.count/reviews.length)*100}%`}}/>
                  </div>
                  <span className="rbar-n">{d.count}</span>
                </div>
              ))}
            </div>
            {reviews.map(r=>(
              <div key={r.id} className="review-item">
                <div className="review-top">
                  <div className="review-av" style={{background:r.color}} aria-hidden="true">{r.ini}</div>
                  <div><div className="review-name">{r.name}</div><div className="review-meta">{r.date} · {r.property}</div></div>
                  <div className="review-stars" aria-label={`${r.rating} stars`}>{["","⭐","⭐⭐","⭐⭐⭐","⭐⭐⭐⭐","⭐⭐⭐⭐⭐"][r.rating]}</div>
                </div>
                <div className="review-text">"{r.text}"</div>
              </div>
            ))}
            <button className="write-review-btn" onClick={()=>setReviewModal(true)} aria-label="Write a review">
              ✍️ Write a review
            </button>
            <div style={{height:20}}/>
          </div>

          {reviewModal && (
            <div className="modal-bg" role="dialog" aria-modal="true" aria-label="Write a review" onClick={()=>setReviewModal(false)}>
              <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
                <div className="modal-handle"/>
                <button className="modal-close" onClick={()=>setReviewModal(false)} aria-label="Close">✕</button>
                <div className="modal-title">Share your experience</div>
                <div className="f-group">
                  <label className="f-label" htmlFor="rev-prop">Property</label>
                  <select id="rev-prop" className="f-input" value={newR.property} onChange={e=>setNewR(r=>({...r,property:e.target.value}))}>
                    <option value="">Choose a property…</option>
                    {HOUSES.map(h=><option key={h.id} value={h.title}>{h.title}</option>)}
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">Rating</label>
                  <div style={{display:"flex",gap:6}} role="group" aria-label="Star rating">
                    {[1,2,3,4,5].map(n=>(
                      <button key={n} onClick={()=>setNewR(r=>({...r,rating:n}))} aria-label={`${n} star${n>1?"s":""}`} aria-pressed={n<=newR.rating}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:28,opacity:n<=newR.rating?1:0.25,transition:"opacity 0.15s"}}>⭐</button>
                    ))}
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="rev-text">Your review</label>
                  <textarea id="rev-text" className="f-textarea" placeholder="What was your experience like?" value={newR.text} onChange={e=>setNewR(r=>({...r,text:e.target.value}))}/>
                </div>
                <button className="f-submit" disabled={!newR.text||!newR.property} onClick={()=>{
                  setReviews(prev=>[{id:Date.now(),name:user.name,ini:ini(user.name),color:"var(--rust)",rating:newR.rating,date:"Apr 2026",text:newR.text,property:newR.property},...prev]);
                  setReviewModal(false);setNewR({text:"",rating:5,property:""});
                  showToast("✅ Review published!");
                }}>Publish Review</button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ════ POST ════ */}
      {tab==="post" && (
        <main className="screen" aria-label={role==="landlord"?"List a property":"Post tab"}>
          {role==="tenant" ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔒</div>
              <h2 className="empty-state-title">Landlords Only</h2>
              <div className="empty-state-sub">Only landlord accounts can post listings. Go to your Profile tab and switch your account type to Landlord.</div>
              <button onClick={()=>setTab("profile")} style={{marginTop:16,padding:"10px 24px",background:"var(--rust)",color:"white",border:"none",borderRadius:12,fontFamily:"var(--ff-sans)",fontWeight:600,cursor:"pointer",fontSize:14}}>
                Go to Profile →
              </button>
            </div>
          ) : (
            <>
              <div className="post-header">
                <h1 className="post-title">List a Property</h1>
                <div className="post-sub">Be transparent. Earn trust. Find great tenants.</div>
              </div>
              <div className="post-form">
                {/* Basic info */}
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-title">Property title *</label>
                  <input id="pt-title" className={`f-input ${pf.titleErr?"err":""}`} placeholder="e.g. Bright 3-bed in Westside" value={pf.title} onChange={e=>setPf(p=>({...p,title:e.target.value,titleErr:""}))}/>
                  {pf.titleErr&&<div className="f-err" role="alert">{pf.titleErr}</div>}
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-addr">Address *</label>
                  <input id="pt-addr" className={`f-input ${pf.addressErr?"err":""}`} placeholder="Street, City" value={pf.address} onChange={e=>setPf(p=>({...p,address:e.target.value,addressErr:""}))}/>
                  {pf.addressErr&&<div className="f-err" role="alert">{pf.addressErr}</div>}
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-neigh">Neighbourhood</label>
                  <input id="pt-neigh" className="f-input" placeholder="e.g. Westside" value={pf.neighborhood} onChange={e=>setPf(p=>({...p,neighborhood:e.target.value}))}/>
                </div>
                <div className="f-row">
                  <div className="f-group">
                    <label className="f-label" htmlFor="pt-plot">Plot Number</label>
                    <input id="pt-plot" className="f-input" placeholder="e.g. LR/14/2019" value={pf.plotNumber} onChange={e=>setPf(p=>({...p,plotNumber:e.target.value}))}/>
                  </div>
                  <div className="f-group">
                    <label className="f-label" htmlFor="pt-units">Total Units</label>
                    <select id="pt-units" className="f-input" value={pf.totalUnits} onChange={e=>setPf(p=>({...p,totalUnits:e.target.value}))}>
                      {[1,2,4,6,8,10,12,16,20,24].map(n=><option key={n} value={n}>{n} unit{n>1?"s":""}</option>)}
                    </select>
                  </div>
                </div>
                <div className="f-row">
                  <div className="f-group">
                    <label className="f-label" htmlFor="pt-bed">Bedrooms</label>
                    <select id="pt-bed" className="f-input" value={pf.bedrooms} onChange={e=>setPf(p=>({...p,bedrooms:e.target.value}))}>
                      {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} bed{n>1?"s":""}</option>)}
                    </select>
                  </div>
                  <div className="f-group">
                    <label className="f-label" htmlFor="pt-bath">Bathrooms</label>
                    <select id="pt-bath" className="f-input" value={pf.bathrooms} onChange={e=>setPf(p=>({...p,bathrooms:e.target.value}))}>
                      {[1,2,3,4].map(n=><option key={n} value={n}>{n} bath{n>1?"s":""}</option>)}
                    </select>
                  </div>
                </div>
                <div className="f-row">
                  <div className="f-group">
                    <label className="f-label" htmlFor="pt-price">Monthly rent ($) *</label>
                    <input id="pt-price" type="number" className={`f-input ${pf.priceErr?"err":""}`} placeholder="1 500" value={pf.price} onChange={e=>setPf(p=>({...p,price:e.target.value,priceErr:""}))}/>
                    {pf.priceErr&&<div className="f-err" role="alert">{pf.priceErr}</div>}
                  </div>
                  <div className="f-group">
                    <label className="f-label" htmlFor="pt-dep">Deposit ($)</label>
                    <input id="pt-dep" type="number" className="f-input" placeholder="auto: 2× rent" value={pf.deposit} onChange={e=>setPf(p=>({...p,deposit:e.target.value}))}/>
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-sqft">Floor area (sqft)</label>
                  <input id="pt-sqft" type="number" className="f-input" placeholder="e.g. 1200" value={pf.sqft} onChange={e=>setPf(p=>({...p,sqft:e.target.value}))}/>
                </div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-desc">Description</label>
                  <textarea id="pt-desc" className="f-textarea" placeholder="Describe the property, neighbourhood, transport…" value={pf.description} onChange={e=>setPf(p=>({...p,description:e.target.value}))}/>
                </div>

                <div className="f-divider">House Rules</div>
                {([["bylaw1","e.g. No smoking indoors"],["bylaw2","e.g. No subletting"],["bylaw3","e.g. Quiet hours 10 PM – 7 AM"]] as [keyof PostForm,string][]).map(([k,ph],i)=>(
                  <div className="f-group" key={k}>
                    <label className="f-label" htmlFor={`pt-${k}`}>Rule {i+1}</label>
                    <input id={`pt-${k}`} className="f-input" placeholder={ph} value={pf[k] as string} onChange={e=>setPf(p=>({...p,[k]:e.target.value}))}/>
                  </div>
                ))}

                <div className="f-divider">Deposit Refund Terms</div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-refund">When & how deposit is returned</label>
                  <textarea id="pt-refund" className="f-textarea" placeholder="e.g. Full refund within 14 days if no damage…" value={pf.refundRule} onChange={e=>setPf(p=>({...p,refundRule:e.target.value}))}/>
                </div>

                <div className="f-divider">Area Security</div>
                <div className="f-group">
                  <label className="f-label" htmlFor="pt-security">Security details of the area</label>
                  <textarea id="pt-security" className="f-textarea" placeholder="e.g. Gated estate, 24hr security, CCTV at entry points…" value={pf.securityDetails} onChange={e=>setPf(p=>({...p,securityDetails:e.target.value}))}/>
                </div>

                {/* ── IMAGE UPLOAD ─────────────────────────────── */}
                <ImageUploader/>

                <button className="f-submit" disabled={!pf.title||!pf.price} onClick={()=>{
                  if(!validatePost()) return;
                  // Build new listing object
                  const newListing: House = {
                    id: Date.now(),
                    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=75",
                    title: pf.title,
                    address: pf.address,
                    neighborhood: pf.neighborhood || "Unknown",
                    bedrooms: parseInt(pf.bedrooms)||1,
                    bathrooms: parseInt(pf.bathrooms)||1,
                    price: parseInt(pf.price)||0,
                    minPrice: parseInt(pf.price)||0,
                    maxPrice: parseInt(pf.price)||0,
                    deposit: parseInt(pf.deposit)||(parseInt(pf.price)*2)||0,
                    sqft: parseInt(pf.sqft)||0,
                    rating: 0,
                    reviews: 0,
                    landlord: user.name,
                    landlordImg: "",
                    landlordScore: 94,
                    landlordVerified: true,
                    badge: "New",
                    available: true,
                    bylaws: [pf.bylaw1,pf.bylaw2,pf.bylaw3].filter(Boolean).map(t=>({icon:"📋",text:t})),
                    refundRules: pf.refundRule ? [pf.refundRule] : [],
                    amenities: [],
                    priceHistory: [parseInt(pf.price)||0],
                    plotNumber: pf.plotNumber||undefined,
                    totalUnits: parseInt(pf.totalUnits)||1,
                    views: 0,
                    securityDetails: pf.securityDetails||undefined,
                  };
                  const updated = [...publishedListings, newListing];
                  setPublishedListings(updated);
                  // Persist to localStorage
                  try { localStorage.setItem("lr_listings", JSON.stringify(updated)); } catch {}
                  showToast("🏠 Listing published! Check Explore tab.");
                  setPf({title:"",address:"",neighborhood:"",plotNumber:"",totalUnits:"1",bedrooms:"2",bathrooms:"1",sqft:"",price:"",deposit:"",bylaw1:"",bylaw2:"",bylaw3:"",refundRule:"",description:"",securityDetails:"",titleErr:"",priceErr:"",addressErr:""});
                  setTab("home");
                }}>Publish listing →</button>
              </div>
            </>
          )}
        </main>
      )}

      {/* ════ PROFILE ════ */}
      {tab==="profile" && (
        <main className="screen" aria-label="Your profile">
          <div className="profile-top">
            <div className="profile-cover" role="img" aria-label="Cover photo"><div className="profile-cover-overlay" aria-hidden="true"/></div>
            <div className="profile-info">
              <div className="profile-av" role="img" aria-label={`${user.name} profile picture`}>{ini(user.name)}</div>
              <div className="profile-name">{user.name}</div>
              <div className="profile-email">{user.email}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
                <div className="profile-role-pill">{role==="tenant"?"🧳 Tenant":"🏠 Landlord"}</div>
                {role==="landlord"&&<span style={{background:"var(--sage)",color:"white",fontSize:10,padding:"4px 10px",borderRadius:20,fontWeight:600}}>✓ ID Verified</span>}
                <div className="app-badge">v{VERSION}</div>
              </div>
              <div className="profile-slogan" aria-label={SLOGAN}>✦ {SLOGAN} ✦</div>
            </div>
          </div>

          {/* ── ROLE SWITCHER (demo mode) ───────────────────── */}
          <div className="profile-section">
            <div className="ps-label">Account Type</div>
            <div style={{display:"flex",gap:8,marginBottom:8}}>
              <button
                onClick={()=>{switchRole("tenant");showToast("Switched to Tenant mode ✅");}}
                aria-pressed={role==="tenant"}
                style={{flex:1,padding:"12px 8px",borderRadius:12,border:`1.5px solid ${role==="tenant"?"var(--rust)":"var(--border)"}`,background:role==="tenant"?"var(--cream)":"var(--white)",color:role==="tenant"?"var(--rust)":"var(--ink2)",fontFamily:"var(--ff-sans)",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                <span style={{fontSize:20}}>🧳</span> Tenant
              </button>
              <button
                onClick={()=>{switchRole("landlord");showToast("Landlord mode unlocked — tap List tab ✅");}}
                aria-pressed={role==="landlord"}
                style={{flex:1,padding:"12px 8px",borderRadius:12,border:`1.5px solid ${role==="landlord"?"var(--rust)":"var(--border)"}`,background:role==="landlord"?"var(--cream)":"var(--white)",color:role==="landlord"?"var(--rust)":"var(--ink2)",fontFamily:"var(--ff-sans)",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.2s"}}>
                <span style={{fontSize:20}}>🏠</span> Landlord
              </button>
            </div>
            <div style={{fontSize:11,color:"var(--ink3)",lineHeight:1.5,padding:"0 2px"}}>
              💡 Switch to <strong>Landlord</strong> to unlock the <strong>List</strong> tab and post properties with photo uploads.
            </div>
          </div>

          <div className="profile-section">
            <div className="ps-label">Account</div>
            {[
              {icon:"👤",label:"Personal details",sub:user.email},
              {icon:"📱",label:"Phone number",sub:user.phone},
              {icon:"❤️",label:"Saved homes",sub:`${favorites.length} saved`,badge:favorites.length>0?String(favorites.length):undefined},
              {icon:"📋",label:"My applications",sub:`${applications.length} total`,badge:applications.filter(a=>a.status==="approved").length>0?`${applications.filter(a=>a.status==="approved").length} approved`:undefined},
              {icon:"🔔",label:"Notifications",sub:`${unreadCount} unread`,badge:unreadCount>0?String(unreadCount):undefined},
            ].map((it,i)=>(
              <div key={i} className="ps-item" role="button" tabIndex={0} aria-label={it.label} onClick={()=>it.icon==="🔔"&&setShowNotifs(true)}>
                <div className="ps-icon" aria-hidden="true">{it.icon}</div>
                <div className="ps-text"><div className="ps-name">{it.label}</div><div className="ps-sub">{it.sub}</div></div>
                {it.badge && <span className="ps-badge" aria-label={it.badge}>{it.badge}</span>}
                <span className="ps-arrow" aria-hidden="true">›</span>
              </div>
            ))}
          </div>

          {role==="landlord" && (
            <div className="profile-section">
              <div className="ps-label">Landlord tools</div>
              {[
                {icon:"📊",label:"My listings",sub:`${allHouses.filter(h=>h.landlord===user.name).length} active`},
                {icon:"💰",label:"Deposit tracker",sub:"All deposits"},
                {icon:"📝",label:"Tenant applications",sub:`${applications.length} received`},
                {icon:"📈",label:"Analytics",sub:"Views, enquiries, conversion"},
              ].map((it,i)=>(
                <div key={i} className="ps-item" role="button" tabIndex={0} aria-label={it.label}>
                  <div className="ps-icon" aria-hidden="true">{it.icon}</div>
                  <div className="ps-text"><div className="ps-name">{it.label}</div><div className="ps-sub">{it.sub}</div></div>
                  <span className="ps-arrow" aria-hidden="true">›</span>
                </div>
              ))}
            </div>
          )}

          <div className="profile-section">
            <div className="ps-label">Help & Legal</div>
            {[
              {icon:"❓",label:"Help centre",sub:"FAQs & guides"},
              {icon:"⚖️",label:"Tenant rights",sub:"Know your rights"},
              {icon:"🔒",label:"Privacy & security",sub:"Data management"},
              {icon:"📄",label:"Terms of service",sub:"Last updated Jan 2026"},
            ].map((it,i)=>(
              <div key={i} className="ps-item" role="button" tabIndex={0} aria-label={it.label}>
                <div className="ps-icon" aria-hidden="true">{it.icon}</div>
                <div className="ps-text"><div className="ps-name">{it.label}</div><div className="ps-sub">{it.sub}</div></div>
                <span className="ps-arrow" aria-hidden="true">›</span>
              </div>
            ))}
          </div>

          <button className="logout-btn" onClick={()=>{setScreen("auth");setAuth({name:"",email:"",password:"",confirmPassword:"",phone:"",nameErr:"",emailErr:"",passErr:"",confirmErr:""});}} aria-label="Sign out of LazaRental">
            Sign out
          </button>
          <div className="footer-brand">
            <div className="footer-logo">Laza<em>Rental</em></div>
            <div className="footer-rule" aria-hidden="true"/>
            <div className="footer-slogan">{SLOGAN}</div>
            <div className="footer-copy">© 2025 LazaRental · v{VERSION} · All rights reserved</div>
          </div>
          <div style={{height:30}} aria-hidden="true"/>
        </main>
      )}

      {/* BOTTOM NAV */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {([
          {id:"home",   icon:"🏠", label:"Explore"},
          {id:"saved",  icon:"❤️", label:"Saved"},
          {id:"post",   icon:"➕", label:"List"},
          {id:"profile",icon:"👤", label:"Profile"},
        ] as {id:Tab;icon:string;label:string}[]).map(n=>(
          <button key={n.id} className={`nav-btn ${tab===n.id?"active":""}`}
            onClick={()=>setTab(n.id)}
            aria-label={n.label}
            aria-current={tab===n.id?"page":undefined}>
            <span className="nav-btn-icon" aria-hidden="true">{n.icon}</span>
            {tab===n.id && <div className="nav-indicator" aria-hidden="true"/>}
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
