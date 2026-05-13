import React, { useState, useEffect, useRef } from "react";
import {
  Wallet, Utensils, MapPin, Calendar, Camera, Plus, X, ChevronRight,
  Receipt, Map as MapIcon, Clock, Settings, Loader2, ExternalLink,
  Trash2, ShoppingBag, Ticket, Bus, MoreHorizontal, Check, Sparkles,
  Image as ImageIcon, Pencil, ArrowLeft, Star, MessageSquare, ChevronDown, Search, Send
} from "lucide-react";

// localStorage shim — laat window.storage werken via gewone browser-storage
// (in Claude artifact context bestaat window.storage al, dan slaan we deze over)
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: async (key) => {
      try {
        const v = localStorage.getItem(key);
        return v !== null ? { value: v } : null;
      } catch { return null; }
    },
    set: async (key, value) => {
      try { localStorage.setItem(key, value); } catch {}
    }
  };
}

// API endpoint — gebruikt /api/messages serverless proxy buiten Claude,
// of direct api.anthropic.com binnen Claude artifact
const API_ENDPOINT = typeof window !== "undefined" && window.location.hostname.includes("claude")
  ? "https://api.anthropic.com/v1/messages"
  : "/api/messages";


const STORAGE = {
  BUDGET: "vakantie:budget", EXPENSES: "vakantie:expenses",
  EVENTS: "vakantie:events", TRIP: "vakantie:trip",
  CUSTOM_REST: "vakantie:customRestaurants", CUSTOM_ACT: "vakantie:customActivities",
  AI_MESSAGES: "vakantie:aiMessages"
};

const CATEGORIES = {
  restaurant: { label: "Restaurants", short: "Resto", color: "#C2613F", bg: "#F7E8DF", icon: Utensils },
  boodschappen: { label: "Boodschappen", short: "Bood.", color: "#5C5D3F", bg: "#ECEDD9", icon: ShoppingBag },
  activiteit: { label: "Activiteiten", short: "Activ.", color: "#3D6B7C", bg: "#DCE8EE", icon: Ticket },
  transport: { label: "Transport", short: "Trans.", color: "#8B6F47", bg: "#EDE3D2", icon: Bus },
  overig: { label: "Overig", short: "Overig", color: "#7A6F62", bg: "#E8E3DC", icon: MoreHorizontal }
};

// Type tags: vibe filters. Keuken tags: cuisine filters. Beide kunnen samen voorkomen.
const RESTAURANTS = [
  // Fuengirola Chic / Sterrenkeuken
  { id: "r-sollo", name: "Sollo", city: "Fuengirola", area: "Reserva del Higuerón",
    address: "Calle Hilario Lopez 1, Fuengirola", priceLevel: "€€€€", priceHint: "Tasting €180", rating: 4.7,
    types: ["Sterrenkeuken", "Chic", "Met uitzicht"], keuken: ["Spaans", "Vis & schaaldieren"],
    cuisine: "Riviervis · Tasting", michelin: 1, greenStar: true,
    description: "1★ + Groene Ster. Chef Diego Gallegos staat bekend als 'caviar chef'. Tasting menu Caminho €180 zonder wijn. Reserveren weken vooruit.",
    gradient: "linear-gradient(135deg, #1B3B2C 0%, #4A6B5C 100%)" },
  { id: "r-charolais", name: "Charolais", city: "Fuengirola", area: "Centro · Calle Larga",
    address: "Calle Larga 14, Fuengirola", priceLevel: "€€€", priceHint: "Hoofd €25-40", rating: 4.3,
    types: ["Chic"], keuken: ["Spaans", "Vlees"], cuisine: "Bask-Andalusisch · Wijnbar",
    description: "Bodega met 150+ wijnen. Prime cuts (entrecôte, oxtail), gourmet-tapas. Aparte ingangen voor bar en restaurant.",
    gradient: "linear-gradient(135deg, #6B3410 0%, #C2613F 100%)" },
  { id: "r-higueron", name: "El Higuerón Restaurante", city: "Fuengirola", area: "Reserva del Higuerón",
    address: "Av. del Higuerón 48, Fuengirola", priceLevel: "€€€€", priceHint: "Hoofd €30-50", rating: 4.4,
    types: ["Chic", "Met uitzicht"], keuken: ["Spaans"], cuisine: "Mediterraans · 5★ resort",
    description: "Op de heuvels boven Fuengirola, spectaculair uitzicht. Groot buitenterras, glaspartij binnen. Hoort bij 5★ Higuerón resort.",
    gradient: "linear-gradient(135deg, #2A4858 0%, #6B8BA3 100%)" },
  { id: "r-arara", name: "Arara Bistro Bar", city: "Fuengirola", area: "Reserva del Higuerón",
    address: "Av. del Higuerón 48, Fuengirola", priceLevel: "€€€", priceHint: "Sollo-bites vanaf €9", rating: 4.5,
    types: ["Chic", "Met uitzicht"], keuken: ["Spaans"], cuisine: "Bistro · Door Sollo-chef",
    description: "Casual zus van Sollo, menu door Diego Gallegos. 'Sollo samples' vanaf €9. Sterrenkeuken proeven zonder het prijskaartje.",
    gradient: "linear-gradient(135deg, #3D5B4A 0%, #7A9B82 100%)" },
  { id: "r-casa-colon", name: "Casa Colón", city: "Fuengirola", area: "Plaza de los Chinorros",
    address: "Plaza de los Chinorros, Fuengirola", priceLevel: "€€€", priceHint: "Tapas €5-15", rating: 4.6,
    types: ["Romantisch", "Lokaal favoriet"], keuken: ["Spaans", "Tapas"], cuisine: "Creatieve tapas · Andalusisch",
    description: "Stijlvolle inrichting, creatieve tapas, mooie wijnen en een patio voor lange diners. Lokale favoriet. Geen reserveringen, kom vroeg.",
    gradient: "linear-gradient(135deg, #7A2818 0%, #C2613F 100%)" },
  { id: "r-picoteo", name: "Picoteo", city: "Fuengirola", area: "Plaza de los Chinorros",
    address: "Plaza de los Chinorros, Fuengirola", priceLevel: "€€€", priceHint: "Hoofd €20-30", rating: 4.5,
    types: ["Romantisch", "Chic"], keuken: ["Spaans"], cuisine: "Intiem · Andalusisch",
    description: "Klein en romantisch interieur, vlakbij Casa Colón. Uitstekend eten, recent prijzig. Reserveren essentieel.",
    gradient: "linear-gradient(135deg, #4A2E1E 0%, #8B6F47 100%)" },
  { id: "r-los-marinos-jose", name: "Los Marinos José", city: "Fuengirola", area: "Paseo Marítimo",
    address: "Paseo Marítimo Rey de España 161, Fuengirola", priceLevel: "€€€€", priceHint: "Vis op gewicht", rating: 4.6,
    types: ["Chic", "Iconisch"], keuken: ["Vis & schaaldieren", "Spaans"], cuisine: "Zeevruchten · Aan zee",
    description: "Cult-status voor verse zeevruchten direct aan zee. Mes-schelpen, witte garnalen, gebakken zeebaars. Puur, prijzig.",
    gradient: "linear-gradient(135deg, #1B3B5C 0%, #3D6B7C 100%)" },
  { id: "r-bodegon-pepe", name: "El Bodegón de Pepe", city: "Fuengirola", area: "Bij de vissershaven",
    address: "Fuengirola haven", priceLevel: "€€€", priceHint: "Dorada €30+", rating: 4.5,
    types: ["Chic", "Lokaal favoriet"], keuken: ["Vis & schaaldieren", "Spaans"], cuisine: "Traditioneel · Zoutkorst-vis",
    description: "Decennia oude favoriet. Dorada a la sal (zeebrasem in zoutkorst) wordt tableside opengebroken. Sterke Andalusische wijnkaart.",
    gradient: "linear-gradient(135deg, #2B4156 0%, #5A7A95 100%)" },

  // Fuengirola Lokaal & betaalbaar
  { id: "r-palangreros", name: "Restaurante Palangreros", city: "Fuengirola", area: "Centro",
    address: "Calle Palangreros 22, Fuengirola", priceLevel: "€€€", priceHint: "Hoofd €18-28", rating: 4.6,
    types: ["Lokaal favoriet"], keuken: ["Spaans", "Tapas", "Vis & schaaldieren"], cuisine: "Andalusisch · 30+ jaar",
    description: "30+ jaar in de centro. Pil-pil garnalen, croquetten, Angus rib-eye. Focus op pure Andalusische smaken.",
    gradient: "linear-gradient(135deg, #5C5D3F 0%, #8B8B5F 100%)" },
  { id: "r-langosta", name: "La Langosta", city: "Fuengirola", area: "Los Boliches",
    address: "Calle Francisco Cano 1, Los Boliches", priceLevel: "€€€", priceHint: "Hoofd €25-40", rating: 4.4,
    types: ["Iconisch"], keuken: ["Vis & schaaldieren", "Spaans"], cuisine: "Zeevruchten · Sinds 1960",
    description: "Sinds 1960, een van de bekendste van de Costa del Sol. Zalm, kreeft, klassieke zeevruchten. Alleen diner ma-za.",
    gradient: "linear-gradient(135deg, #8B2818 0%, #D4624A 100%)" },
  { id: "r-enebros", name: "Los Enebros", city: "Fuengirola", area: "Los Boliches",
    address: "Paseo Marítimo Rey de España 26, Los Boliches", priceLevel: "€€", priceHint: "3-gangen €36", rating: 4.5,
    types: ["Lokaal favoriet"], keuken: ["Spaans", "Tapas"], cuisine: "Spaans · Tapas",
    description: "Elegant interieur, sinds 2004. Goede 3-gangen menu. Tapas en Andalusische specialiteiten.",
    gradient: "linear-gradient(135deg, #4A5C3F 0%, #7A8B5F 100%)" },
  { id: "r-plankstek", name: "Plankstek", city: "Fuengirola", area: "Bij Ilunion Hotel & Puerto",
    address: "Fuengirola centro & Puerto Deportivo", priceLevel: "€€", priceHint: "Plank €18-25", rating: 4.5,
    types: ["Lokaal favoriet"], keuken: ["Vlees", "Vis & schaaldieren"], cuisine: "Vlees & vis op plank",
    description: "Signature: vlees of vis op houten plank. Goede porties, redelijke prijzen, populair bij locals en expats.",
    gradient: "linear-gradient(135deg, #6B4A1E 0%, #A87A48 100%)" },
  { id: "r-mamounia", name: "La Mamounia", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Hoofd €15-22", rating: 4.8,
    types: ["Romantisch", "Lokaal favoriet"], keuken: [], cuisine: "Marokkaans-mediterraan",
    description: "Top op TheFork (9.6). Sfeervol Marokkaans-mediterraan, populair voor romantisch diner. Open op zondag.",
    gradient: "linear-gradient(135deg, #8B5A2B 0%, #C49060 100%)" },
  { id: "r-tapa-tai", name: "Tapa y Tai", city: "Fuengirola", area: "Naast Angela Hotel",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Hoofd €15-22", rating: 4.6,
    types: ["Romantisch"], keuken: ["Aziatisch"], cuisine: "Thais · Sfeervol",
    description: "Mooie inrichting, kwaliteit-Thais. Door locals geprezen voor romantisch diner voor twee.",
    gradient: "linear-gradient(135deg, #4A1F4A 0%, #7A4A7A 100%)" },
  { id: "r-carisma", name: "El Carisma", city: "Fuengirola", area: "Bij Sohail Castle",
    address: "Paseo Marítimo bij Sohail, Fuengirola", priceLevel: "€€€", priceHint: "Tapas-tower €25", rating: 4.7,
    types: ["Romantisch"], keuken: ["Italiaans", "Spaans", "Tapas"], cuisine: "Italiaans-Spaans · Fusion",
    description: "Nieuwe aanwinst aan de boulevard bij het kasteel. Italiaanse producten met Spaanse twist. 'Tapas-towers' zijn signature.",
    gradient: "linear-gradient(135deg, #5C3F5C 0%, #8B5F8B 100%)" },

  // Italiaans
  { id: "r-mamma-mia", name: "O Mamma Mia", city: "Fuengirola", area: "Centro",
    address: "Av. Nuestro Padre Jesús Cautivo, Fuengirola", priceLevel: "€€", priceHint: "Pizza €10-14", rating: 4.6,
    types: ["Lokaal favoriet", "Iconisch"], keuken: ["Italiaans"], cuisine: "Italiaans · Sinds 1972",
    description: "Iconisch sinds 1972. Houtoven-pizza met zuurdesem geperfectioneerd sinds 1976. Verse pasta, risotto, vleesgerechten. Reserveren voor groepen.",
    gradient: "linear-gradient(135deg, #1F5C2B 0%, #6B9B5C 100%)" },
  { id: "r-mezza-notte", name: "Mezza Notte", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Pizza €10-15", rating: 4.5,
    types: ["Romantisch"], keuken: ["Italiaans"], cuisine: "Italiaans · Pizza & pasta",
    description: "Handgemaakte pasta, houtoven pizza's, Italiaanse wijnen. Tiramisu is onvergetelijk. Romantisch.",
    gradient: "linear-gradient(135deg, #6B1818 0%, #C24A4A 100%)" },
  { id: "r-tutto-bene", name: "Tutto Bene Trattoria", city: "Fuengirola", area: "2 min van strand",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Pinsa €12-16", rating: 4.6,
    types: ["Lokaal favoriet"], keuken: ["Italiaans"], cuisine: "Italiaans · Pinsa-specialist",
    description: "Familie Ramazzoto, 130+ jaar Italiaanse keuken. Pinsa (ovale pizza-variant met luchtig korstje). Vegan, glutenvrij en lactosevrij opties.",
    gradient: "linear-gradient(135deg, #2B5C1F 0%, #6B9B4A 100%)" },
  { id: "r-pergola", name: "La Pérgola Pizzeria", city: "Fuengirola", area: "Bij Plaza de la Constitución",
    address: "Centro, Fuengirola", priceLevel: "€€", priceHint: "Pizza €8-12", rating: 4.5,
    types: ["Lokaal favoriet"], keuken: ["Italiaans"], cuisine: "Italiaans · Pizzeria",
    description: "Cosy buurt-pizzeria in hartje centro, dichtbij Plaza de la Constitución. Lokale favoriet, onverslaanbare prijs-kwaliteit. Verse pasta ook.",
    gradient: "linear-gradient(135deg, #6B2B1F 0%, #C24A2B 100%)" },
  { id: "r-casa-mavi", name: "Casa Mavi", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Pizza €11-15", rating: 4.6,
    types: ["Lokaal favoriet", "Romantisch"], keuken: ["Italiaans"], cuisine: "Italiaans · Authentiek Siciliaans",
    description: "Klein en charmant. Authentieke Siciliaanse pizza met dunne bodem en dikke korst. Cannoli is een must.",
    gradient: "linear-gradient(135deg, #3D6B1F 0%, #6B9B4A 100%)" },
  { id: "r-arte-cocina", name: "Arte y Cocina", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€€", priceHint: "Hoofd €18-28", rating: 4.7,
    types: ["Chic", "Romantisch"], keuken: ["Italiaans", "Aziatisch"], cuisine: "Italiaans-Med · Asian touch",
    description: "Italiaans-geïnspireerd met mediterrane en Aziatische accenten. Verse pasta met inktvis, pappardelle met os-en-lamragu. Alleen avond.",
    gradient: "linear-gradient(135deg, #1F4A4A 0%, #5C8B8B 100%)" },

  // Japans / Sushi
  { id: "r-edo", name: "Edo Sushi", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€€", priceHint: "Per stuk €4-8", rating: 4.7,
    types: ["Chic", "Lokaal favoriet"], keuken: ["Japans"], cuisine: "Japans · Sushi · Nieuw 2025",
    description: "Geopend mei 2025, snel als #1 Japans van Fuengirola bestempeld. Verse vis, mooie presentatie, vriendelijke crew. TheFork 9.5.",
    gradient: "linear-gradient(135deg, #1A1A2A 0%, #3A3A5A 100%)" },
  { id: "r-kamura", name: "Kamura Sushi", city: "Fuengirola", area: "Los Boliches",
    address: "Av. de los Boliches 108, Fuengirola", priceLevel: "€€€", priceHint: "Set €25-40", rating: 4.7,
    types: ["Intiem", "Lokaal favoriet"], keuken: ["Japans"], cuisine: "Japans · Hidden gem",
    description: "Intieme zaak met ~10 plekken. Chef Nakamura. Toewijding en kunst in elke roll. Reserveren essentieel.",
    gradient: "linear-gradient(135deg, #2B1F3D 0%, #5C4A7A 100%)" },
  { id: "r-yin-yang", name: "Yin Yang Sushi", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€€", priceHint: "Set €25-35", rating: 4.7,
    types: ["Intiem", "Lokaal favoriet"], keuken: ["Japans"], cuisine: "Japans · Hidden gem",
    description: "Kleine exclusieve plek met mooie decor. Verse tempura's en sushi van hoge kwaliteit. Hidden gem voor sushi-liefhebbers.",
    gradient: "linear-gradient(135deg, #1F2B3D 0%, #4A5C7A 100%)" },
  { id: "r-kazuki", name: "Teppanyaki Kazuki", city: "Fuengirola", area: "Bij Fuengirola Fairgrounds",
    address: "Av. Nuestro Padre Jesús Cautivo 5, Fuengirola", priceLevel: "€€€", priceHint: "Teppanyaki €25-40", rating: 4.5,
    types: ["Romantisch"], keuken: ["Japans"], cuisine: "Japans · Teppanyaki & sushi",
    description: "Teppanyaki-tafels met live show. Lam, scallops, tonijn, eend. Ook sushi en maki. Reserveren niet altijd nodig maar populair.",
    gradient: "linear-gradient(135deg, #3D1F1F 0%, #7A4A4A 100%)" },
  { id: "r-sushi-bar", name: "The Sushi Bar", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€€", priceHint: "Per stuk €5-10", rating: 4.5,
    types: ["Romantisch", "Chic"], keuken: ["Japans"], cuisine: "Japans · Sushi · Elegant",
    description: "Elegante decor, gesofisticeerde sfeer. Verse ingrediënten, oog voor detail. Filialen ook in Marbella en Puerto Banús.",
    gradient: "linear-gradient(135deg, #0F1F3D 0%, #3D5C8B 100%)" },
  { id: "r-en-sushi", name: "En Sushi", city: "Fuengirola", area: "Centro · Terras",
    address: "Fuengirola centro", priceLevel: "€€€", priceHint: "Set €20-35", rating: 4.8,
    types: ["Lokaal favoriet"], keuken: ["Japans"], cuisine: "Japans · Terras",
    description: "Top-rated op TheFork (10/10). Veggie opties. Lekker terras voor zomeravond. Reserveren aanbevolen.",
    gradient: "linear-gradient(135deg, #2B3D1F 0%, #5C7A4A 100%)" },

  // Chiringuitos
  { id: "r-oasis", name: "Chiringuito Oasis", city: "Fuengirola", area: "Torreblanca · Carvajal",
    address: "Paseo Marítimo Rey de España, Carvajal", priceLevel: "€€", priceHint: "Vis €12-18", rating: 4.6,
    types: ["Chiringuito", "Lokaal favoriet"], keuken: ["Spaans", "Vis & schaaldieren"], cuisine: "Strandtent · Repsol Guide",
    description: "Vermeld in Repsol Guide (Spaanse Michelin-equivalent). Recent gerenoveerd, witte tafelkleden, geen plastic. Familie sinds 1980.",
    gradient: "linear-gradient(135deg, #1F4A5C 0%, #5C8AA0 100%)" },
  { id: "r-marinos-paco", name: "Chiringuito Los Marinos Paco", city: "Fuengirola", area: "Carvajal",
    address: "Paseo Marítimo Rey de España (einde), Carvajal", priceLevel: "€€", priceHint: "Frituur €8-15", rating: 4.5,
    types: ["Chiringuito", "Lokaal favoriet"], keuken: ["Spaans", "Vis & schaaldieren"], cuisine: "Strandtent · Pescaíto frito",
    description: "Cult-status onder locals. Familietraditie generaties lang. Glazen lounge plus terras op strand. Iconische frituur.",
    gradient: "linear-gradient(135deg, #2B5F2B 0%, #5C8B5C 100%)" },
  { id: "r-cepa-playa", name: "La Cepa Playa", city: "Fuengirola", area: "Paseo Marítimo",
    address: "Paseo Marítimo, Fuengirola", priceLevel: "€€", priceHint: "Espeto €6,50", rating: 4.4,
    types: ["Chiringuito", "Iconisch"], keuken: ["Spaans"], cuisine: "Strandtent · Sinds 1959",
    description: "Sinds 1959, levende geschiedenis. Espetos de sardinas, paella, pescaíto frito. Klassiek aan zee.",
    gradient: "linear-gradient(135deg, #5C2818 0%, #8B4828 100%)" },
  { id: "r-gali-gali", name: "Gali Gali", city: "Fuengirola", area: "Paseo Marítimo · Hotel Occidental",
    address: "Paseo Marítimo, Fuengirola", priceLevel: "€€", priceHint: "Espeto €7", rating: 4.5,
    types: ["Chiringuito"], keuken: ["Spaans"], cuisine: "Strandtent · Familie",
    description: "Familie-chiringuito op de boulevard. Espetos op houtskool, paella, chanquetes met ei. Open 12:00-18:00.",
    gradient: "linear-gradient(135deg, #3D5F3D 0%, #6B8B6B 100%)" },
  { id: "r-capitan", name: "El Capitán de la Playa", city: "Fuengirola", area: "Los Boliches",
    address: "Playa de los Boliches, Fuengirola", priceLevel: "€€", priceHint: "Espeto €6,50", rating: 4.4,
    types: ["Chiringuito", "Iconisch"], keuken: ["Spaans"], cuisine: "Strandtent · Traditioneel",
    description: "Espetos de sardinas op de klassieke manier: bamboe-stokken in vuurplaats in het zand. UNESCO-erfgoed waardig.",
    gradient: "linear-gradient(135deg, #7A4A1E 0%, #C2884A 100%)" },
  { id: "r-cubana", name: "Chiringuito La Cubana", city: "Carvajal", area: "Einde Carvajal",
    address: "Playa de Carvajal", priceLevel: "€€€", priceHint: "Hoofd €18-28", rating: 4.3,
    types: ["Chiringuito", "Romantisch"], keuken: [], cuisine: "Boho-chiringuito · Trendy",
    description: "Kleurrijke boho-vibe, populair voor brunch, lunch en cocktails. Prijzen recent stevig gestegen. Reserveren essentieel.",
    gradient: "linear-gradient(135deg, #C24A8B 0%, #E88AB8 100%)" },

  // Beach Clubs
  { id: "r-max-beach", name: "Max Beach Pool Club", city: "Mijas Costa", area: "La Riviera (8km van Fuengirola)",
    address: "Calle de la Cala, La Cala de Mijas", priceLevel: "€€€", priceHint: "Cocktail €12, hoofd €18-28", rating: 4.4,
    types: ["Beach Club", "Met uitzicht"], keuken: ["Japans", "Aziatisch"], cuisine: "Beach Club · Pool & Aziatisch",
    description: "Leisure-complex met fitness, zwembad en restaurant. Glazen eetzaal alsof je boven zee zweeft. Japanse octopus, Beluga roll, Nikkei tiradito.",
    gradient: "linear-gradient(135deg, #0F4A6B 0%, #5C8AA0 100%)" },
  { id: "r-florida-beach", name: "Florida Beach", city: "Mijas Costa", area: "Cala de Mijas",
    address: "Cala de Mijas", priceLevel: "€€€€", priceHint: "Hoofd €25-45", rating: 4.5,
    types: ["Beach Club", "Chic"], keuken: [], cuisine: "Beach Club · East Coast glamour",
    description: "Exclusieve club met East Coast glamour. Hangmatten met VIP-service. Overdag chill, 's avonds 'Florida Nights' parties.",
    gradient: "linear-gradient(135deg, #C2613F 0%, #E8A87C 100%)" },
  { id: "r-tropicana", name: "Villa Tropicana", city: "Fuengirola", area: "Aan zee",
    address: "Playa de Fuengirola", priceLevel: "€€", priceHint: "Drankje €5, hoofd €15", rating: 4.2,
    types: ["Beach Club", "Chiringuito"], keuken: [], cuisine: "Beach-bar hybride",
    description: "Tussen chiringuito en beach club in. Hangmatten op strand, internationaal menu, vaak live chillout DJ's. Familievriendelijk.",
    gradient: "linear-gradient(135deg, #E88A4A 0%, #F4C898 100%)" },
  { id: "r-horno-beach", name: "Horno Beach Club", city: "Torremolinos", area: "La Carihuela",
    address: "Calle de la Playa 46, Torremolinos", priceLevel: "€€€", priceHint: "Hoofd €22-35", rating: 4.6,
    types: ["Beach Club", "Chic", "Romantisch"], keuken: ["Vis & schaaldieren"], cuisine: "Beach Club · Quiet luxury",
    description: "Geen velvet rope, geen branding. Stille luxe. Handgestikte linnen ligbedden, zachte muziek, top tuna tataki en gegrilde octopus.",
    gradient: "linear-gradient(135deg, #2A2520 0%, #6B5C4A 100%)" },
  { id: "r-ms-tropicana", name: "MS Tropicana Beach Club", city: "Torremolinos", area: "La Carihuela",
    address: "Paseo Marítimo Carihuela, Torremolinos", priceLevel: "€€€", priceHint: "Cocktail €10", rating: 4.4,
    types: ["Beach Club", "Romantisch"], keuken: ["Spaans"], cuisine: "Beach Club · Sixties charme",
    description: "Vintage-vibe sinds de zestiger jaren toen Costa del Sol op de kaart kwam. Lokale gerechten, cocktails met vers fruit, hangmat-service.",
    gradient: "linear-gradient(135deg, #1F6B5C 0%, #5C9B8A 100%)" },
  { id: "r-palapa", name: "La Palapa Beach Jazba", city: "Torremolinos", area: "Paseo Marítimo",
    address: "Paseo Marítimo Torremolinos 22R", priceLevel: "€€", priceHint: "Cocktail €9", rating: 4.4,
    types: ["Beach Club"], keuken: ["Aziatisch"], cuisine: "Beach Club · Balinese stijl",
    description: "Balinese ligbedden, schommels, palmen. Salades, stir-fry, poke. Cocktails (piña colada) zijn de moeite waard.",
    gradient: "linear-gradient(135deg, #3D5C3F 0%, #7A9B7A 100%)" },

  // Málaga
  { id: "r-palodu", name: "Palodú", city: "Málaga", area: "Centro histórico",
    address: "Calle Carretería 64, Málaga", priceLevel: "€€€€", priceHint: "Tasting €70-110", rating: 4.6,
    types: ["Sterrenkeuken", "Chic"], keuken: ["Spaans"], cuisine: "Sterrenkeuken · Nieuw 2026",
    michelin: 1,
    description: "Nieuwe Michelinster 2026. Naast Atarazanas Markt, twee chefs in 'dual kitchen'-concept. Heldere ingrediënten, sterke prijs-kwaliteit.",
    gradient: "linear-gradient(135deg, #2A2520 0%, #5C5D3F 100%)" },
  { id: "r-jcg", name: "José Carlos García", city: "Málaga", area: "Muelle Uno",
    address: "Plaza de la Capilla 1, Muelle Uno, Málaga", priceLevel: "€€€€", priceHint: "Tasting €139,50", rating: 4.6,
    types: ["Sterrenkeuken", "Chic", "Met uitzicht"], keuken: ["Spaans", "Vis & schaaldieren"], cuisine: "Sterrenkeuken · Andalusisch modern",
    michelin: 1,
    description: "Aan Muelle Uno, dichtbij Mercado de Atarazanas voor verse ingrediënten. Focus op lokale vis. Tasting €139,50.",
    gradient: "linear-gradient(135deg, #0F2F4F 0%, #3D6B7C 100%)" },
  { id: "r-kaleja", name: "Kaleja", city: "Málaga", area: "Oude Joodse wijk",
    address: "Calle Marquesa de Moya 9, Málaga", priceLevel: "€€€€", priceHint: "Menu €90-120", rating: 4.7,
    types: ["Sterrenkeuken", "Chic", "Romantisch"], keuken: ["Spaans"], cuisine: "Sterrenkeuken · Stoofgerechten",
    michelin: 1,
    description: "Chef Dani Carnero, stoof-keuken met seizoensproducten. Menu Memoria €90, uitgebreid €120. Klein en intiem.",
    gradient: "linear-gradient(135deg, #3A2418 0%, #7A4818 100%)" },
  { id: "r-pimpi", name: "El Pimpi", city: "Málaga", area: "Calle Granada",
    address: "Calle Granada 62, Málaga", priceLevel: "€€", priceHint: "Tapa €4-8", rating: 4.4,
    types: ["Iconisch", "Lokaal favoriet"], keuken: ["Spaans", "Tapas"], cuisine: "Tapas · Bodega sinds 1971",
    description: "Beroemde bodega in hartje Málaga, foto's van iedereen aan de muur (Banderas, Sabina, etc). Een must voor de sfeer.",
    gradient: "linear-gradient(135deg, #7A2818 0%, #C2613F 100%)" },
  { id: "r-kaleido", name: "Kaleido", city: "Málaga", area: "Muelle Uno",
    address: "Muelle Uno, local 25, Málaga", priceLevel: "€€€", priceHint: "Hoofd €20-32", rating: 4.4,
    types: ["Met uitzicht", "Romantisch"], keuken: ["Spaans"], cuisine: "Mediterraans · Rooftop",
    description: "Stijlvolle rooftop aan de haven. Perfect bij zonsondergang met cocktail. Mediterrane menu met twist.",
    gradient: "linear-gradient(135deg, #C2613F 0%, #E8A87C 100%)" },
  { id: "r-blossom", name: "Blossom", city: "Málaga", area: "Centro",
    address: "Málaga centro", priceLevel: "€€€", priceHint: "Tasting €60-90", rating: 4.5,
    types: ["Chic"], keuken: ["Aziatisch"], cuisine: "Latin-Aziatisch fusion",
    description: "Argentijnse chef Emi Schobert. Fusion van Peru, Mexico, Argentinië. Ceviche met gele paprika saus, hertenvlees met mole.",
    gradient: "linear-gradient(135deg, #C24A1E 0%, #E88A5C 100%)" },

  // Marbella
  { id: "r-skina", name: "Skina", city: "Marbella", area: "Casco Antiguo",
    address: "Calle Aduar 12, Marbella", priceLevel: "€€€€", priceHint: "Tasting €200+", rating: 4.8,
    types: ["Sterrenkeuken", "Chic", "Romantisch"], keuken: ["Spaans"], cuisine: "Sterrenkeuken · 2★",
    michelin: 2,
    description: "Twee Michelinsterren. Slechts 4 tafels, intieme ervaring. Chef Mario Cachinero, twee tasting menu's en wijnkelder met 1000+ wijnen.",
    gradient: "linear-gradient(135deg, #2A2520 0%, #7A2818 100%)" },
  { id: "r-nintai", name: "Nintai", city: "Marbella", area: "Centro",
    address: "Calle Ramón Gómez de la Serna 18b, Marbella", priceLevel: "€€€€", priceHint: "Omakase €145, menu €189", rating: 4.8,
    types: ["Sterrenkeuken", "Chic", "Romantisch"], keuken: ["Japans"], cuisine: "Sterrenkeuken · Omakase",
    michelin: 1,
    description: "1★ Japanse omakase. 12 stoelen aan houten bar. Omakase €145, Nintai menu €189. Chef Pablo Olivares.",
    gradient: "linear-gradient(135deg, #1A1A1A 0%, #3A3A3A 100%)" },
  { id: "r-back", name: "Back", city: "Marbella", area: "Centro · Parque de la Constitución",
    address: "Calle Pablo Casals 8, Marbella", priceLevel: "€€€€", priceHint: "Tasting €120 (+ wijn €80)", rating: 4.7,
    types: ["Sterrenkeuken", "Chic"], keuken: ["Spaans"], cuisine: "Sterrenkeuken · Modern bistro",
    michelin: 1,
    description: "1★ sinds 2023. Casual bistro-stijl, niet stijf. Chef David Olivas mengt Andalusische traditie met moderne creativiteit.",
    gradient: "linear-gradient(135deg, #2C4A3A 0%, #5C8B6F 100%)" },
  { id: "r-lena", name: "Leña", city: "Marbella", area: "Puente Romano",
    address: "Bulevar Príncipe Alfonso, Marbella", priceLevel: "€€€€", priceHint: "Steak €40-65", rating: 4.6,
    types: ["Chic", "Iconisch"], keuken: ["Vlees"], cuisine: "Steakhouse · Open vuur · Dani García",
    description: "Van Dani García. Elegante steakhouse op open vuur. Yakipinchos, charred groenten. Sluit af met Apple Tart of Torta di Rosa.",
    gradient: "linear-gradient(135deg, #3A1A0A 0%, #8B3A1A 100%)" },
  { id: "r-nobu", name: "Nobu Marbella", city: "Marbella", area: "Puente Romano",
    address: "Hotel Puente Romano, Marbella", priceLevel: "€€€€", priceHint: "Sushi €15-30", rating: 4.5,
    types: ["Chic", "Iconisch"], keuken: ["Japans"], cuisine: "Japans-Peruaans · Glamour",
    description: "Glamoureuze setting in Puente Romano. Black cod miso is legendarisch. Reserveren weken vooruit.",
    gradient: "linear-gradient(135deg, #0A0A0A 0%, #4A4A4A 100%)" },
  { id: "r-lobito", name: "Lobito de Mar", city: "Marbella", area: "Golden Mile",
    address: "Carretera Cádiz Km 178, Marbella", priceLevel: "€€€", priceHint: "Hoofd €20-35", rating: 4.5,
    types: ["Iconisch"], keuken: ["Vis & schaaldieren", "Spaans"], cuisine: "Vis · Dani García",
    description: "Van Dani García. Stoere vis-en-schaaldieren-zaak. Verse vis, gefrituurde visjes, signature rijst. Casual maar verfijnd.",
    gradient: "linear-gradient(135deg, #1B3B5C 0%, #6B8BA3 100%)" },
  { id: "r-milla", name: "La Milla", city: "Marbella", area: "Playa Padre",
    address: "Playa Padre, Marbella", priceLevel: "€€€", priceHint: "Hoofd €22-32", rating: 4.4,
    types: ["Beach Club", "Romantisch"], keuken: ["Spaans"], cuisine: "Beach Club · Lange lunch",
    description: "Voeten in het zand. Perfect voor lange lunch met cava. Niet de chicste, maar dolce vita-niveau gezellig.",
    gradient: "linear-gradient(135deg, #E8A87C 0%, #F4D6BC 100%)" },
  { id: "r-trocadero", name: "Trocadero Arena", city: "Marbella", area: "Marbella centro",
    address: "Playa Las Cañas, Marbella", priceLevel: "€€€€", priceHint: "Hoofd €30-55", rating: 4.5,
    types: ["Beach Club", "Chic"], keuken: ["Aziatisch", "Japans"], cuisine: "Beach Club · Med-Aziatisch",
    description: "Bohemian decor meets Mediterraans-Aziatische fusion. Alles - van borden tot verlichting - is bewust. Instagram gold.",
    gradient: "linear-gradient(135deg, #5C3F5C 0%, #9B6F9B 100%)" },
  { id: "r-ocean-club", name: "Ocean Club Marbella", city: "Marbella", area: "Puerto Banús",
    address: "Av. Lola Flores, Puerto Banús", priceLevel: "€€€€", priceHint: "Bottle service €€€€", rating: 4.2,
    types: ["Beach Club", "Iconisch"], keuken: [], cuisine: "Beach Club · Ostentatief",
    description: "Een van de meest ostentatieve beach clubs van Europa. Champagne sprays, DJ's, VIP-bedden. Voor de show.",
    gradient: "linear-gradient(135deg, #C2A648 0%, #F0D880 100%)" },

  // Extra hidden gems
  { id: "r-coriander", name: "La Coriander", city: "Fuengirola", area: "Centro · Calle Larga",
    address: "Calle Larga 5, Fuengirola", priceLevel: "€€", priceHint: "Hoofd €14-22", rating: 4.6,
    types: ["Romantisch", "Lokaal favoriet"], keuken: ["Italiaans", "Aziatisch"], cuisine: "Italiaans-Indiaas · Verse pasta",
    description: "TheFork 9.2. Verse pasta ter plekke gemaakt, cannelloni is een topper. Italiaans met Indiase invloed. Reserveren handig.",
    gradient: "linear-gradient(135deg, #4A2B5C 0%, #7A5C8B 100%)" },
  { id: "r-limoncello", name: "Limoncello", city: "Fuengirola", area: "Centro",
    address: "Calle Moncayo 35, Fuengirola", priceLevel: "€€", priceHint: "Pizza/pasta €11-16", rating: 4.4,
    types: ["Romantisch", "Lokaal favoriet"], keuken: ["Italiaans"], cuisine: "Italiaans · Sfeervol",
    description: "TheFork 8.9. Klassiek Italiaans, mooie inrichting, gnocchi met gorgonzola en verse pasta met inktvis-ragu staan aan.",
    gradient: "linear-gradient(135deg, #C29B1F 0%, #E8C25C 100%)" },
  { id: "r-primavera", name: "La Primavera", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Hoofd €12-20", rating: 4.5,
    types: ["Lokaal favoriet"], keuken: ["Italiaans"], cuisine: "Italiaans · Klassieker",
    description: "Reizigers komen meerdere keren tijdens een verblijf terug. Authentieke smaken, vriendelijk personeel, eerlijke prijzen.",
    gradient: "linear-gradient(135deg, #5C8B1F 0%, #8BC25C 100%)" },
  { id: "r-blackberry", name: "Blackberry Café", city: "Fuengirola", area: "Centro",
    address: "Calle España 5, Fuengirola", priceLevel: "€€", priceHint: "Brunch €10-15", rating: 4.5,
    types: ["Lokaal favoriet"], keuken: [], cuisine: "Brunch & cocktails · Hipster",
    description: "Top brunch-spot van Fuengirola. Hipster decor, kleurrijke Instagram-worthy cocktails, smoothies, milkshakes. Geen terras maar lekker binnen.",
    gradient: "linear-gradient(135deg, #2B1F4A 0%, #5C4A8B 100%)" },
  { id: "r-unicorn", name: "Restaurante Unicorn", city: "Fuengirola", area: "Centro",
    address: "Fuengirola centro", priceLevel: "€€", priceHint: "Hoofd €12-18", rating: 4.6,
    types: ["Lokaal favoriet"], keuken: ["Aziatisch", "Japans"], cuisine: "Aziatisch · Sushi · Vegan opties",
    description: "Diverse Aziatische kaart: voorgerechten, rijst, noedels, sushi. Vegan en glutenvrije opties. Goede prijs-kwaliteit en chef die alles vers maakt.",
    gradient: "linear-gradient(135deg, #1F4A5C 0%, #5C8AA0 100%)" },
  { id: "r-toyo", name: "Toyo", city: "Fuengirola", area: "Centro · Terras",
    address: "Fuengirola centro", priceLevel: "€€€", priceHint: "Set €20-35", rating: 4.5,
    types: ["Romantisch"], keuken: ["Japans"], cuisine: "Japans · Terras",
    description: "TheFork 9.1. Goede sushi, ramen, tempura. Lekker terras. Vegan opties beschikbaar.",
    gradient: "linear-gradient(135deg, #2B1F1F 0%, #5C4A4A 100%)" }
];

// ---------- ACTIVITIES ----------
const ACTIVITIES = [
  { id: "a-paseo", name: "Paseo Marítimo wandelen", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Wandeling", "Strand"],
    description: "8 km boulevard van Sohail Castle tot Carvajal. Vroege ochtend voor rust, avond voor sfeer. Espetos onderweg." },
  { id: "a-murales", name: "Paseo de los Murales", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Cultuur", "Wandeling"],
    description: "20 grote muurschilderingen in El Boquetillo wijk. Open-air museum, 10 min van het station. Twee waren genomineerd als beste ter wereld." },
  { id: "a-plaza-const", name: "Plaza de la Constitución", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Cultuur"],
    description: "Charmant plein in de oude stad met de Iglesia Virgen del Rosario. Bankjes, schaduw, locals." },
  { id: "a-pueblo-lopez", name: "Pueblo López ontdekken", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Wandeling", "Cultuur"],
    description: "Oude wijk met smalle straatjes, lokale bars, authentieke sfeer ver van de toeristenboulevard." },
  { id: "a-rio-brug", name: "Río Fuengirola voetgangersbrug", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Wandeling"],
    description: "90m schuine kabelbrug uit 2006. Verbindt boulevard met Sohail Castle. Mooi bij zonsondergang." },
  { id: "a-parque-fluvial", name: "Parque Fluvial wandelen", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Wandeling", "Natuur"],
    description: "Park langs de rivier met fiets/wandelpaden, picknickplekken, pingpongtafels (eigen ballen mee). Zip-line over de rivier." },
  { id: "a-markt-di", name: "Mercadillo dinsdag", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Markt", "Lokaal"],
    description: "Wekelijkse markt op Recinto Ferial, 09:00-14:00. Kleding, fruit, snuisterijen. Live muziek aan de poort. Pickpocket-alert." },
  { id: "a-markt-za", name: "Vlooienmarkt zaterdag", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Markt", "Lokaal"],
    description: "300+ kraampjes met tweedehands boeken, fietsen, meubels, keuken. Recinto Ferial 09:00-14:00." },
  { id: "a-sohail-buiten", name: "Sohail Castle wandeling buitenom", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Cultuur", "Wandeling"],
    description: "Moors fort uit AD 956. Buitenom is gratis. Panoramisch uitzicht. Mei-sept beperkt door Marenostrum festival." },
  { id: "a-espigon", name: "Espigón pier verkennen", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Strand", "Natuur"],
    description: "Rotspier bij Torreblanca beach. Bij eb krabben en zee-egels spotten. Zonsondergang hier is magisch." },
  { id: "a-carvajal", name: "Stranddag Carvajal", city: "Fuengirola/Benalmádena", costPerPerson: 0,
    types: ["Gratis", "Strand"],
    description: "Mooi strand met chiringuitos. 'Wilder' karakter, schelpen zoeken. Espeto sardine eten is verplicht." },
  { id: "a-boliches", name: "Stranddag Los Boliches", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Strand"],
    description: "Familievriendelijk strand met espetos op open vuur. Schaduw op de boulevard, makkelijk parkeren." },
  { id: "a-mijas-pueblo", name: "Mijas Pueblo wandelen", city: "Mijas", costPerPerson: 0,
    types: ["Gratis", "Dagtrip", "Cultuur"],
    description: "Witgekalkt bergdorp met smalle straatjes en uitzichtpunten. Plaza de los Pueblos, mini-stierengevechtarena. Parkeren €2." },
  { id: "a-letrero", name: "Fuengirola letrero foto", city: "Fuengirola", costPerPerson: 0,
    types: ["Gratis", "Strand"],
    description: "Grote 'FUENGIROLA' metalen letters op de boulevard, geflankeerd door palmbomen. Golden hour aanrader." },
  { id: "a-sohail-binnen", name: "Sohail Castle interieur", city: "Fuengirola", costPerPerson: 3,
    types: ["Cultuur"],
    description: "Binnenkant van het fort, kleine vergoeding. Gratis op bepaalde dagen." },
  { id: "a-finca-secretario", name: "Romeinse ruïnes Finca del Secretario", city: "Fuengirola", costPerPerson: 3,
    types: ["Cultuur"],
    description: "Romeinse zoutfabriek, pottenbakkerij en bad ontdekt in 1987. Halve hectare aan ruïnes." },
  { id: "a-alcazaba", name: "Alcazaba & Romeins Theater", city: "Málaga", costPerPerson: 5,
    types: ["Cultuur", "Dagtrip"],
    description: "Moors fort plus Romeinse ruïnes in één bezoek. Combinatieticket. Goed te lopen vanaf het centrum." },
  { id: "a-picasso", name: "Museo Picasso", city: "Málaga", costPerPerson: 12,
    types: ["Cultuur", "Dagtrip"],
    description: "Geboorteplek van Picasso. Compacte maar goede collectie. Audio-tour aanrader." },
  { id: "a-pompidou", name: "Centre Pompidou", city: "Málaga", costPerPerson: 9,
    types: ["Cultuur", "Dagtrip"],
    description: "Moderne kunst in de iconische glazen kubus bij Muelle Uno. Combineer met haven-wandeling." },
  { id: "a-caminito", name: "Caminito del Rey", city: "Álora", costPerPerson: 10,
    types: ["Avontuur", "Dagtrip", "Natuur"],
    description: "Spectaculaire kloofwandeling. Tickets reserveren (vaak weken vooruit uitverkocht). ~3 uur wandelen." },
  { id: "a-catamaran", name: "Catamaran zonsondergang", city: "Fuengirola", costPerPerson: 45,
    types: ["Avontuur", "Strand"],
    description: "Boottocht uit de haven met drankje, ~2 uur. Romantisch, vooral met zonsondergang over de Middellandse Zee." },
  { id: "a-dolfijnen", name: "Dolfijnen kijken", city: "Fuengirola", costPerPerson: 27,
    types: ["Avontuur", "Natuur"],
    description: "Vanuit de jachthaven. Wilde dolfijnen, geen show. ~2 uur. Hoge kans op spotten in zomer." },
  { id: "a-parasailing", name: "Parasailing", city: "Fuengirola", costPerPerson: 60,
    types: ["Avontuur"],
    description: "Pirate Parasailing uit de haven. Adrenaline + uitzicht op kust tot Benalmádena. ~15 min in de lucht." },
  { id: "a-paddleboard", name: "Paddleboard verhuur", city: "Fuengirola", costPerPerson: 18,
    types: ["Avontuur", "Strand"],
    description: "Per uur op het strand. Rustige zee in de ochtend, perfect voor beginners." },
  { id: "a-ebike-mijas", name: "E-bike tour Mijas mountains", city: "Mijas", costPerPerson: 40,
    types: ["Avontuur", "Natuur"],
    description: "Geleide e-bike tour door de bergen achter Mijas. Olijfgaarden, panoramische uitzichten. 3-4 uur." },
  { id: "a-fietsen-paseo", name: "Fiets huren langs Paseo", city: "Fuengirola", costPerPerson: 12,
    types: ["Strand", "Avontuur"],
    description: "Fietsverhuur op de boulevard, ~€12 halve dag. Plat traject, ideaal van Fuengirola naar Carvajal en terug." },
  { id: "a-hammam", name: "Hammam Al Ándalus", city: "Málaga", costPerPerson: 45,
    types: ["Wellness", "Romantisch", "Dagtrip"],
    description: "Arabische baden. Koppels-pakket met massage mogelijk (~€80 pp). Reserveer vooraf, populair." },
  { id: "a-bioparc", name: "Bioparc Fuengirola", city: "Fuengirola", costPerPerson: 25,
    types: ["Familie", "Natuur"],
    description: "Dierentuin met thematische biotopen. Klein maar goed gedaan. Halve dag." },
  { id: "a-aquamijas", name: "Aquamijas waterpark", city: "Mijas", costPerPerson: 27,
    types: ["Familie", "Avontuur"],
    description: "Open ~10 juni - 15 sept. Kamikaze, wild river, crazy loop. Hele dag." },
  { id: "a-aqualand", name: "Aqualand Torremolinos", city: "Torremolinos", costPerPerson: 30,
    types: ["Familie", "Avontuur"],
    description: "Groter dan Aquamijas. Een van de beste waterparken van Spanje." },
  { id: "a-ronda", name: "Dagtrip Ronda", city: "Ronda", costPerPerson: 0,
    types: ["Dagtrip", "Cultuur", "Gratis"],
    description: "Beroemde Puente Nuevo en historisch centrum. Gratis te wandelen. Combineer met Bardal (2★). Parkeren ~€10." },
  { id: "a-wijn-ronda", name: "Wijnproeverij Ronda", city: "Ronda", costPerPerson: 35,
    types: ["Dagtrip", "Eten & drinken"],
    description: "Lokale wijngaarden in de Serranía. ~2-3 uur incl. proeverij. Reserveren via bodega of Rural Roots." },
  { id: "a-nerja", name: "Cuevas de Nerja", city: "Nerja", costPerPerson: 15,
    types: ["Dagtrip", "Natuur"],
    description: "Druipsteengrotten, een van de grootste in Spanje. Combineer met Balcón de Europa en lunch in dorp." },
  { id: "a-gibraltar", name: "Dagtrip Gibraltar", city: "Gibraltar", costPerPerson: 80,
    types: ["Dagtrip", "Cultuur"],
    description: "Tour met bus en gids. Berbermakaken, St. Michael's Cave, duty-free shoppen. Paspoort meenemen." },
  { id: "a-granada", name: "Granada & Alhambra", city: "Granada", costPerPerson: 100,
    types: ["Dagtrip", "Cultuur"],
    description: "Tour vanuit Fuengirola: Alhambra (€18 entree) + Generalife tuinen. Lange dag (~12 uur). Vooraf reserveren essentieel." },
  { id: "a-tanger", name: "Dagtrip Tánger Marokko", city: "Tánger", costPerPerson: 110,
    types: ["Dagtrip", "Cultuur"],
    description: "Veerboot + tour incl. lunch. Medina, markten, Noord-Afrikaanse cultuur. Paspoort verplicht." },
  { id: "a-jardin", name: "Jardín La Concepción", city: "Málaga", costPerPerson: 5.20,
    types: ["Natuur", "Dagtrip"],
    description: "Botanische tuin uit 19e eeuw. Rustig, mooi, halve dag. Bus 2 vanuit centro." }
];

// ---------- Helpers ----------
const eur = (n) => `€ ${Number(n || 0).toFixed(2).replace(".", ",")}`;
const todayISO = () => new Date().toISOString().split("T")[0];
const safeStorage = {
  async get(k) { try { const r = await window.storage.get(k); return r?.value ? JSON.parse(r.value) : null; } catch { return null; } },
  async set(k, v) { try { await window.storage.set(k, JSON.stringify(v)); } catch {} }
};
const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
const menuUrl = (name, city) => `https://www.google.com/search?q=${encodeURIComponent(`${name} ${city} menu carta`)}`;
const reviewsUrl = (name, city) => `https://www.google.com/search?q=${encodeURIComponent(`${name} ${city} restaurant reviews`)}`;

const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const MONTHS_FULL = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const WEEKDAYS = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

// Filter options - getrimd en uitgebreid met keuken
const REST_VIBES = ["Alles", "Sterrenkeuken", "Chic", "Beach Club", "Chiringuito", "Lokaal favoriet", "Romantisch"];
const REST_KEUKEN = ["Alles", "Spaans", "Italiaans", "Japans", "Vis & schaaldieren", "Vlees", "Tapas", "Aziatisch"];
const REST_CITIES = ["Alle", "Fuengirola", "Málaga", "Marbella", "Torremolinos", "Mijas Costa"];
const REST_PRICES = ["Alle", "€", "€€", "€€€", "€€€€"];

const ACT_TYPES = ["Alles", "Gratis", "Cultuur", "Avontuur", "Strand", "Wellness", "Familie", "Dagtrip", "Natuur", "Wandeling", "Markt"];

// ---------- Main component ----------
export default function VakantieDashboard() {
  const [tab, setTab] = useState("budget");
  const [budget, setBudget] = useState(2000);
  const [expenses, setExpenses] = useState([]);
  const [events, setEvents] = useState([]);
  const [trip, setTrip] = useState({ start: "", end: "", destination: "Fuengirola" });
  const [customRest, setCustomRest] = useState([]);
  const [customAct, setCustomAct] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [addExpense, setAddExpense] = useState(false);
  const [editBudget, setEditBudget] = useState(false);
  const [selectedRest, setSelectedRest] = useState(null);
  const [selectedAct, setSelectedAct] = useState(null);
  const [planFor, setPlanFor] = useState(null);
  const [editTrip, setEditTrip] = useState(false);
  const [addCustomRest, setAddCustomRest] = useState(false);
  const [addCustomAct, setAddCustomAct] = useState(false);

  const [restVibe, setRestVibe] = useState("Alles");
  const [restKeuken, setRestKeuken] = useState("Alles");
  const [restCity, setRestCity] = useState("Alle");
  const [restPrice, setRestPrice] = useState("Alle");
  const [restSearch, setRestSearch] = useState("");
  const [actType, setActType] = useState("Alles");
  const [actSearch, setActSearch] = useState("");
  const [aiMessages, setAiMessages] = useState([]);

  const [collapsedDays, setCollapsedDays] = useState(new Set());

  useEffect(() => {
    (async () => {
      const [b, e, ev, t, cr, ca, am] = await Promise.all([
        safeStorage.get(STORAGE.BUDGET), safeStorage.get(STORAGE.EXPENSES),
        safeStorage.get(STORAGE.EVENTS), safeStorage.get(STORAGE.TRIP),
        safeStorage.get(STORAGE.CUSTOM_REST), safeStorage.get(STORAGE.CUSTOM_ACT),
        safeStorage.get(STORAGE.AI_MESSAGES)
      ]);
      if (b !== null) setBudget(b);
      if (Array.isArray(e)) setExpenses(e);
      if (Array.isArray(ev)) setEvents(ev);
      if (t) setTrip(t);
      if (Array.isArray(cr)) setCustomRest(cr);
      if (Array.isArray(ca)) setCustomAct(ca);
      if (Array.isArray(am)) setAiMessages(am);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) safeStorage.set(STORAGE.BUDGET, budget); }, [budget, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORAGE.EXPENSES, expenses); }, [expenses, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORAGE.EVENTS, events); }, [events, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORAGE.TRIP, trip); }, [trip, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORAGE.CUSTOM_REST, customRest); }, [customRest, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORAGE.CUSTOM_ACT, customAct); }, [customAct, loaded]);
  useEffect(() => { if (loaded) safeStorage.set(STORAGE.AI_MESSAGES, aiMessages.slice(-50)); }, [aiMessages, loaded]);

  const spent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const byCategory = Object.keys(CATEGORIES).reduce((acc, k) => {
    acc[k] = expenses.filter(e => e.category === k).reduce((s, e) => s + Number(e.amount || 0), 0);
    return acc;
  }, {});

  const allRestaurants = [...customRest, ...RESTAURANTS];
  const allActivities = [...customAct, ...ACTIVITIES];

  const toggleDay = (iso) => {
    setCollapsedDays(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  };
  const collapseAll = (allIsos) => setCollapsedDays(new Set(allIsos));
  const expandAll = () => setCollapsedDays(new Set());

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>
      <Header trip={trip} onEditTrip={() => setEditTrip(true)} />

      <main>
        {tab === "budget" && (
          <BudgetView
            budget={budget} spent={spent} remaining={remaining} pct={pct}
            byCategory={byCategory} expenses={expenses}
            onAdd={() => setAddExpense(true)}
            onEditBudget={() => setEditBudget(true)}
            onRemove={(id) => setExpenses(prev => prev.filter(e => e.id !== id))}
          />
        )}
        {tab === "restaurants" && (
          <RestaurantsView
            restaurants={allRestaurants}
            vibe={restVibe} setVibe={setRestVibe}
            keuken={restKeuken} setKeuken={setRestKeuken}
            city={restCity} setCity={setRestCity}
            price={restPrice} setPrice={setRestPrice}
            search={restSearch} setSearch={setRestSearch}
            onSelect={setSelectedRest}
            onAdd={() => setAddCustomRest(true)}
            onRemove={(id) => setCustomRest(prev => prev.filter(r => r.id !== id))}
          />
        )}
        {tab === "activiteiten" && (
          <ActivitiesView
            activities={allActivities}
            type={actType} setType={setActType}
            search={actSearch} setSearch={setActSearch}
            onSelect={setSelectedAct}
            onAdd={() => setAddCustomAct(true)}
            onRemove={(id) => setCustomAct(prev => prev.filter(a => a.id !== id))}
          />
        )}
        {tab === "kalender" && (
          <CalendarView
            trip={trip} events={events}
            collapsedDays={collapsedDays} onToggleDay={toggleDay}
            onCollapseAll={collapseAll} onExpandAll={expandAll}
            onRemove={(id) => setEvents(prev => prev.filter(e => e.id !== id))}
          />
        )}
        {tab === "ai" && (
          <AIView
            trip={trip}
            messages={aiMessages}
            setMessages={setAiMessages}
            onPlan={(s) => setPlanFor({
              type: s.type === "restaurant" ? "restaurant" : "activiteit",
              item: { name: s.title, city: s.city || trip.destination || "Fuengirola" }
            })}
          />
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} />

      {addExpense && <ExpenseModal onClose={() => setAddExpense(false)} onSave={(exp) => {
        setExpenses(prev => [{ ...exp, id: Date.now().toString() }, ...prev]); setAddExpense(false);
      }} />}
      {editBudget && <BudgetEditModal current={budget} onClose={() => setEditBudget(false)}
        onSave={(b) => { setBudget(b); setEditBudget(false); }} />}
      {editTrip && <TripEditModal trip={trip} onClose={() => setEditTrip(false)}
        onSave={(t) => { setTrip(t); setEditTrip(false); }} />}
      {selectedRest && <RestaurantDetail restaurant={selectedRest}
        onClose={() => setSelectedRest(null)}
        onPlan={() => { setPlanFor({ type: "restaurant", item: selectedRest }); setSelectedRest(null); }} />}
      {selectedAct && <ActivityDetail activity={selectedAct}
        onClose={() => setSelectedAct(null)}
        onPlan={() => { setPlanFor({ type: "activiteit", item: selectedAct }); setSelectedAct(null); }} />}
      {planFor && <PlanModal planFor={planFor} trip={trip}
        onClose={() => setPlanFor(null)}
        onSave={(evt) => {
          setEvents(prev => [...prev, { ...evt, id: Date.now().toString() }]
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
          setPlanFor(null); setTab("kalender");
        }} />}
      {addCustomRest && <CustomRestaurantModal onClose={() => setAddCustomRest(false)}
        onSave={(r) => { setCustomRest(prev => [{ ...r, id: `cr-${Date.now()}`, custom: true }, ...prev]); setAddCustomRest(false); }} />}
      {addCustomAct && <CustomActivityModal onClose={() => setAddCustomAct(false)}
        onSave={(a) => { setCustomAct(prev => [{ ...a, id: `ca-${Date.now()}`, custom: true }, ...prev]); setAddCustomAct(false); }} />}
    </div>
  );
}

function Header({ trip, onEditTrip }) {
  return (
    <header style={styles.header}>
      <div>
        <div style={styles.headerEyebrow}>VAKANTIE</div>
        <h1 style={styles.headerTitle}>{trip.destination || "Fuengirola"}</h1>
        {trip.start && trip.end && <div style={styles.headerDates}>{fmtRange(trip.start, trip.end)}</div>}
      </div>
      <button onClick={onEditTrip} style={styles.iconBtn} aria-label="Instellingen">
        <Settings size={18} strokeWidth={1.5} />
      </button>
    </header>
  );
}

function BudgetView({ budget, spent, remaining, pct, byCategory, expenses, onAdd, onEditBudget, onRemove }) {
  return (
    <div style={styles.viewWrap}>
      <section style={styles.heroCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={styles.smallLabel}>Resterend budget</div>
            <div style={styles.heroAmount}>{eur(remaining)}</div>
            <div style={styles.heroSub}>van {eur(budget)} totaal</div>
          </div>
          <button onClick={onEditBudget} style={styles.ghostBtn}>
            <Pencil size={14} /> Budget
          </button>
        </div>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${pct}%`, background: pct > 90 ? "#A53030" : "#2A2520" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7A6F62" }}>
          <span>Uitgegeven: {eur(spent)}</span><span>{pct.toFixed(0)}%</span>
        </div>
      </section>

      <h2 style={styles.sectionH}>Per categorie</h2>
      <div style={styles.catGrid}>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const Icon = cat.icon;
          return (
            <div key={key} style={{ ...styles.catCard, background: cat.bg }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon size={16} color={cat.color} strokeWidth={1.75} />
                <span style={{ fontSize: 13, color: cat.color, fontWeight: 600 }}>{cat.label}</span>
              </div>
              <div style={{ ...styles.catAmount, color: cat.color }}>{eur(byCategory[key] || 0)}</div>
            </div>
          );
        })}
      </div>

      <button onClick={onAdd} style={styles.primaryBtn}><Plus size={18} /> Uitgave toevoegen</button>

      <h2 style={{ ...styles.sectionH, marginTop: 28 }}>Recente uitgaves</h2>
      {expenses.length === 0 ? (
        <div style={styles.empty}>Nog niks uitgegeven. Voeg een bonnetje of handmatige uitgave toe.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {expenses.map(e => {
            const cat = CATEGORIES[e.category] || CATEGORIES.overig;
            const Icon = cat.icon;
            return (
              <div key={e.id} style={styles.expRow}>
                <div style={{ ...styles.expIcon, background: cat.bg }}>
                  <Icon size={16} color={cat.color} strokeWidth={1.75} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.expDesc}>{e.description || e.merchant || cat.label}</div>
                  <div style={{ fontSize: 11, color: "#7A6F62" }}>
                    {e.date} · {cat.label}{e.source === "receipt" ? " · 📷 bon" : ""}
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{eur(e.amount)}</div>
                <button onClick={() => onRemove(e.id)} style={styles.deleteBtn}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={styles.searchWrap}>
      <Search size={16} color="#7A6F62" strokeWidth={1.5} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.searchInput}
      />
      {value && (
        <button onClick={() => onChange("")} style={styles.searchClear} aria-label="Wissen">
          <X size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function FilterRow({ label, options, value, onChange }) {
  return (
    <div style={styles.filterRowWrap}>
      <div style={styles.filterLabel}>{label}</div>
      <div style={styles.filterChips}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            style={{ ...styles.chip, ...(value === opt ? styles.chipActive : {}) }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function DualFilterRow({ labelA, optionsA, valueA, onChangeA, labelB, optionsB, valueB, onChangeB }) {
  return (
    <div style={styles.filterRowWrap}>
      <div style={styles.filterLabel}>{labelA} · {labelB}</div>
      <div style={styles.filterChips}>
        {optionsA.map(opt => (
          <button key={"a-" + opt} onClick={() => onChangeA(opt)}
            style={{ ...styles.chip, ...(valueA === opt ? styles.chipActive : {}) }}>
            {opt}
          </button>
        ))}
        <div style={styles.chipDivider} />
        {optionsB.map(opt => (
          <button key={"b-" + opt} onClick={() => onChangeB(opt)}
            style={{ ...styles.chip, ...(valueB === opt ? styles.chipActive : {}) }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function RestaurantsView({ restaurants, vibe, setVibe, keuken, setKeuken, city, setCity, price, setPrice, search, setSearch, onSelect, onAdd, onRemove }) {
  const q = search.trim().toLowerCase();
  const filtered = restaurants.filter(r => {
    if (q) {
      const hay = [r.name, r.city, r.area, r.cuisine, r.description, ...(r.types || []), ...(r.keuken || [])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (vibe !== "Alles" && !(r.types || []).includes(vibe)) return false;
    if (keuken !== "Alles" && !(r.keuken || []).includes(keuken)) return false;
    if (city !== "Alle" && r.city !== city) return false;
    if (price !== "Alle" && r.priceLevel !== price) return false;
    return true;
  });

  const activeCount = (vibe !== "Alles" ? 1 : 0) + (keuken !== "Alles" ? 1 : 0) + (city !== "Alle" ? 1 : 0) + (price !== "Alle" ? 1 : 0);
  const resetFilters = () => { setVibe("Alles"); setKeuken("Alles"); setCity("Alle"); setPrice("Alle"); setSearch(""); };

  return (
    <div style={styles.viewWrap}>
      <SearchBar value={search} onChange={setSearch} placeholder="Zoek op naam, wijk of keuken…" />

      <div style={styles.filterBlock}>
        <FilterRow label="Keuken" options={REST_KEUKEN} value={keuken} onChange={setKeuken} />
        <FilterRow label="Sfeer" options={REST_VIBES} value={vibe} onChange={setVibe} />
        <DualFilterRow
          labelA="Stad" optionsA={REST_CITIES} valueA={city} onChangeA={setCity}
          labelB="Prijs" optionsB={REST_PRICES} valueB={price} onChangeB={setPrice}
        />
      </div>

      <div style={styles.resultRow}>
        <div style={{ fontSize: 12, color: "#7A6F62" }}>
          {filtered.length} resultaten{activeCount > 0 || q ? ` · ${activeCount + (q ? 1 : 0)} filter${activeCount + (q ? 1 : 0) > 1 ? "s" : ""} actief` : ""}
        </div>
        {(activeCount > 0 || q) && <button onClick={resetFilters} style={styles.linkBtn}>Reset</button>}
      </div>

      <button onClick={onAdd} style={styles.secondaryBtn}>
        <Plus size={16} /> Eigen restaurant toevoegen
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>Geen restaurants gevonden. Reset of voeg er zelf een toe.</div>
        ) : (
          filtered.map(r => <RestaurantCard key={r.id} r={r} onSelect={onSelect} onRemove={onRemove} />)
        )}
      </div>
    </div>
  );
}

function RestaurantCard({ r, onSelect, onRemove }) {
  return (
    <div style={styles.restCard}>
      <button onClick={() => onSelect(r)} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
        <div style={{ ...styles.restImg, background: r.gradient || "linear-gradient(135deg, #5C5D3F 0%, #8B8B5F 100%)" }}>
          <div style={styles.restImgGradient} />
          <div style={styles.restBadges}>
            {r.michelin && <MichelinBadge stars={r.michelin} />}
            {r.greenStar && <GreenStarBadge />}
            {r.custom && <span style={{ ...styles.customBadge, position: "static" }}>Eigen</span>}
            <div style={styles.priceRatingStack}>
              <span style={styles.restPriceBadge}>{r.priceLevel}</span>
              {r.rating != null && (
                <span style={styles.ratingBadge}>
                  <Star size={9} fill="#C2613F" color="#C2613F" strokeWidth={0} />
                  {Number(r.rating).toFixed(1)}
                </span>
              )}
            </div>
          </div>
          <div style={styles.restImgContent}>
            <div style={styles.restName}>{r.name}</div>
            <div style={styles.restType}>{r.cuisine}</div>
          </div>
        </div>

        <div style={styles.restBody}>
          <div style={styles.restMetaRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
              <MapPin size={13} color="#7A6F62" strokeWidth={1.5} />
              <span style={{ fontSize: 12, color: "#7A6F62", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.area}, {r.city}
              </span>
            </div>
            {r.priceHint && <span style={styles.priceHint}>{r.priceHint}</span>}
          </div>
          {(r.types?.length > 0 || r.keuken?.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {[...(r.types || []).slice(0, 2), ...(r.keuken || []).slice(0, 2)].slice(0, 3).map(t => (
                <span key={t} style={styles.tagPill}>{t}</span>
              ))}
            </div>
          )}
        </div>
      </button>
      {r.custom && (
        <button onClick={() => onRemove(r.id)} style={styles.cardDelete} aria-label="Verwijder">
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

function MichelinBadge({ stars }) {
  return (
    <span style={styles.michelinBadge}>
      {Array.from({ length: stars }).map((_, i) => (
        <Star key={i} size={10} fill="#fff" color="#fff" strokeWidth={0} />
      ))}
      <span style={{ marginLeft: 3 }}>Michelin</span>
    </span>
  );
}
function GreenStarBadge() {
  return <span style={styles.greenStarBadge}><Star size={10} fill="#fff" color="#fff" strokeWidth={0} /> Groen</span>;
}

function RestaurantDetail({ restaurant, onClose, onPlan }) {
  const r = restaurant;
  const allTags = [...(r.types || []), ...(r.keuken || [])];
  return (
    <Sheet onClose={onClose}>
      <div style={{ ...styles.detailHero, background: r.gradient || "linear-gradient(135deg, #5C5D3F, #8B8B5F)" }}>
        <div style={styles.detailHeroOverlay} />
        <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {r.michelin && <MichelinBadge stars={r.michelin} />}
          {r.greenStar && <GreenStarBadge />}
        </div>
        <div style={styles.detailHeroContent}>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>{r.cuisine}</div>
          <h2 style={styles.detailTitle}>{r.name}</h2>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{r.area} · {r.city} · {r.priceLevel}</span>
            {r.rating != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.18)", padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                <Star size={10} fill="#fff" color="#fff" strokeWidth={0} />
                {r.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {allTags.map(t => <span key={t} style={styles.tagPill}>{t}</span>)}
          </div>
        )}

        {r.priceHint && (
          <div style={styles.priceHintBig}>
            <Receipt size={14} color="#C2613F" />
            <span>{r.priceHint}</span>
          </div>
        )}

        <p style={styles.detailText}>{r.description}</p>

        {r.address && (
          <div style={styles.addressBox}>
            <MapPin size={14} color="#7A6F62" />
            <span style={{ fontSize: 13, color: "#5C5D3F" }}>{r.address}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <a href={mapsUrl(`${r.name} ${r.address || r.city}`)} target="_blank" rel="noopener noreferrer" style={styles.linkRow}>
            <MapIcon size={16} color="#3D6B7C" />
            <span>Adres openen in Maps</span>
            <ExternalLink size={14} color="#7A6F62" style={{ marginLeft: "auto" }} />
          </a>
          <a href={menuUrl(r.name, r.city)} target="_blank" rel="noopener noreferrer" style={styles.linkRow}>
            <Receipt size={16} color="#C2613F" />
            <span>Menu / carta bekijken</span>
            <ExternalLink size={14} color="#7A6F62" style={{ marginLeft: "auto" }} />
          </a>
          <a href={reviewsUrl(r.name, r.city)} target="_blank" rel="noopener noreferrer" style={styles.linkRow}>
            <MessageSquare size={16} color="#5C5D3F" />
            <span>Reviews lezen</span>
            <ExternalLink size={14} color="#7A6F62" style={{ marginLeft: "auto" }} />
          </a>
        </div>

        <button onClick={onPlan} style={styles.primaryBtn}>
          <Calendar size={18} /> Reservering plannen
        </button>
      </div>
    </Sheet>
  );
}

function ActivitiesView({ activities, type, setType, search, setSearch, onSelect, onAdd, onRemove }) {
  const q = search.trim().toLowerCase();
  const filtered = activities.filter(a => {
    if (q) {
      const hay = [a.name, a.city, a.description, ...(a.types || [])].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (type !== "Alles" && !(a.types || []).includes(type)) return false;
    return true;
  });

  const hasFilters = type !== "Alles" || q;
  const reset = () => { setType("Alles"); setSearch(""); };

  return (
    <div style={styles.viewWrap}>
      <SearchBar value={search} onChange={setSearch} placeholder="Zoek op naam, plaats of categorie…" />

      <div style={styles.filterBlock}>
        <FilterRow label="Categorie" options={ACT_TYPES} value={type} onChange={setType} />
      </div>

      <div style={styles.resultRow}>
        <div style={{ fontSize: 12, color: "#7A6F62" }}>
          {filtered.length} activiteit{filtered.length !== 1 ? "en" : ""}
        </div>
        {hasFilters && <button onClick={reset} style={styles.linkBtn}>Reset</button>}
      </div>

      <div style={styles.infoBanner}>
        <Sparkles size={14} color="#C2613F" />
        <span>Prijzen per persoon. Voor 2 personen automatisch berekend.</span>
      </div>

      <button onClick={onAdd} style={styles.secondaryBtn}>
        <Plus size={16} /> Eigen activiteit toevoegen
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>Geen activiteiten gevonden.</div>
        ) : (
          filtered.map(a => (
            <ActivityCard key={a.id} a={a} onSelect={onSelect} onRemove={onRemove} />
          ))
        )}
      </div>
    </div>
  );
}

function ActivityCard({ a, onSelect, onRemove }) {
  return (
    <div style={styles.actCardWrap}>
      <button onClick={() => onSelect(a)} style={styles.actCard}>
        <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: "#2A2520", fontWeight: 500 }}>{a.name}</span>
            {a.custom && <span style={{ ...styles.customBadge, position: "static" }}>Eigen</span>}
          </div>
          <div style={{ fontSize: 12, color: "#7A6F62" }}>{a.city}</div>
          <div style={{ fontSize: 13, color: "#5C5D3F", marginTop: 6, lineHeight: 1.4 }}>{a.description}</div>
          {a.types && a.types.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {a.types.slice(0, 3).map(t => <span key={t} style={styles.tagPillSmall}>{t}</span>)}
            </div>
          )}
        </div>
        <div style={styles.actPrice}>
          {a.costPerPerson === 0 ? (
            <div style={styles.actFree}>GRATIS</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#7A6F62" }}>2 pers.</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: "#C2613F", fontWeight: 600 }}>
                {eur(a.costPerPerson * 2)}
              </div>
            </>
          )}
        </div>
      </button>
      {a.custom && (
        <button onClick={() => onRemove(a.id)} style={styles.cardDeleteInline}>
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

function ActivityDetail({ activity, onClose, onPlan }) {
  const a = activity;
  return (
    <Sheet onClose={onClose}>
      <div style={{ ...styles.detailHero, background: "linear-gradient(135deg, #3D6B7C 0%, #5C8FA3 100%)" }}>
        <div style={styles.detailHeroOverlay} />
        <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
        <div style={styles.detailHeroContent}>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>Activiteit</div>
          <h2 style={styles.detailTitle}>{a.name}</h2>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>{a.city}</div>
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        {a.types && a.types.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {a.types.map(t => <span key={t} style={styles.tagPill}>{t}</span>)}
          </div>
        )}
        <p style={styles.detailText}>{a.description}</p>
        <div style={styles.costBox}>
          <div>
            <div style={styles.costLabel}>Per persoon</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#2A2520" }}>
              {a.costPerPerson === 0 ? "Gratis" : eur(a.costPerPerson)}
            </div>
          </div>
          <div style={{ width: 1, background: "#E8E3DC" }} />
          <div>
            <div style={styles.costLabel}>Voor 2</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, color: "#C2613F" }}>
              {a.costPerPerson === 0 ? "Gratis" : eur(a.costPerPerson * 2)}
            </div>
          </div>
        </div>
        <a href={mapsUrl(`${a.name} ${a.city}`)} target="_blank" rel="noopener noreferrer" style={{ ...styles.linkRow, marginBottom: 12 }}>
          <MapIcon size={16} color="#3D6B7C" />
          <span>Openen in Google Maps</span>
          <ExternalLink size={14} color="#7A6F62" style={{ marginLeft: "auto" }} />
        </a>
        <button onClick={onPlan} style={styles.primaryBtn}>
          <Calendar size={18} /> Inplannen in kalender
        </button>
      </div>
    </Sheet>
  );
}

function CalendarView({ trip, events, collapsedDays, onToggleDay, onCollapseAll, onExpandAll, onRemove }) {
  const days = generateTripDays(trip.start, trip.end);
  const today = todayISO();
  const eventsByDate = events.reduce((acc, e) => { (acc[e.date] ||= []).push(e); return acc; }, {});
  const allCollapsed = days.length > 0 && days.every(d => collapsedDays.has(d.iso));

  return (
    <div style={styles.viewWrap}>
      {(!trip.start || !trip.end) && (
        <div style={styles.warning}>Stel je reisdata in via het tandwiel rechtsboven om je dagen te zien.</div>
      )}

      {days.length > 0 && (
        <div style={styles.calToolbar}>
          <div style={{ fontSize: 12, color: "#7A6F62" }}>
            {days.length} dagen · {events.length} event{events.length !== 1 ? "s" : ""}
          </div>
          <button onClick={() => allCollapsed ? onExpandAll() : onCollapseAll(days.map(d => d.iso))}
            style={styles.linkBtn}>
            {allCollapsed ? "Alles uitklappen" : "Alles inklappen"}
          </button>
        </div>
      )}

      {days.length === 0 && events.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map(e => (
            <div key={e.id} style={styles.evtSimple}>
              <div style={styles.evtTime}><Clock size={12} /> {e.date} · {e.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{e.title}</div>
                {e.note && <div style={{ fontSize: 12, color: "#7A6F62" }}>{e.note}</div>}
              </div>
              <button onClick={() => onRemove(e.id)} style={styles.deleteBtn}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {days.map((d, i) => (
          <DayCard
            key={d.iso}
            day={d}
            events={(eventsByDate[d.iso] || []).sort((a, b) => a.time.localeCompare(b.time))}
            onRemove={onRemove}
            isToday={d.iso === today}
            isFirst={i === 0}
            isLast={i === days.length - 1}
            isCollapsed={collapsedDays.has(d.iso)}
            onToggle={() => onToggleDay(d.iso)}
          />
        ))}
      </div>
    </div>
  );
}

function DayCard({ day, events, onRemove, isToday, isFirst, isLast, isCollapsed, onToggle }) {
  const hasEvents = events.length > 0;
  return (
    <div style={{ ...styles.dayCard, ...(isToday ? styles.dayCardToday : {}) }}>
      {(isFirst || isLast) && (
        <div style={{ ...styles.dayTag, background: isFirst ? "#3D6B7C" : "#C2613F" }}>
          {isFirst ? "AANKOMST" : "VERTREK"}
        </div>
      )}
      {isToday && !isFirst && !isLast && (
        <div style={{ ...styles.dayTag, background: "#5C5D3F" }}>VANDAAG</div>
      )}

      <button onClick={onToggle} style={styles.dayCardHead}>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ ...styles.dayWeekday, color: isToday ? "#C2613F" : "#2A2520" }}>{day.weekday}</div>
          <div style={styles.dayFullDate}>
            {day.dayNum} {day.monthFull}
            {hasEvents && isCollapsed && <span style={styles.dayEventCount}> · {events.length} gepland</span>}
          </div>
        </div>
        <div style={styles.calBadge}>
          <div style={styles.calBadgeTop}>{day.monthShort.toUpperCase()}</div>
          <div style={styles.calBadgeNum}>{day.dayNum}</div>
        </div>
        <div style={{ ...styles.chevronWrap, transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
          <ChevronDown size={20} color="#7A6F62" strokeWidth={2} />
        </div>
      </button>

      {!isCollapsed && (
        <div style={styles.dayCardBody}>
          {!hasEvents ? (
            <div style={styles.dayEmpty}>Niks gepland</div>
          ) : (
            <div style={styles.timeline}>
              {events.map((e, i) => (
                <TimelineEvent key={e.id} event={e} isLast={i === events.length - 1} onRemove={onRemove} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineEvent({ event, isLast, onRemove }) {
  const isRest = event.type === "restaurant";
  const dotColor = isRest ? "#C2613F" : "#3D6B7C";
  return (
    <div style={styles.tlRow}>
      <div style={styles.tlLeft}>
        <div style={{ ...styles.tlDot, background: dotColor }} />
        {!isLast && <div style={styles.tlLine} />}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14, minWidth: 0 }}>
        <div style={styles.tlTime}>{event.time}</div>
        <div style={styles.tlTitleRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.tlTitle}>{event.title}</div>
            <div style={styles.tlMeta}>
              {isRest ? <Utensils size={11} /> : <Ticket size={11} />}
              <span>{isRest ? "Restaurant" : "Activiteit"}{event.city ? ` · ${event.city}` : ""}</span>
            </div>
            {event.note && <div style={styles.tlNote}>{event.note}</div>}
          </div>
          <button onClick={() => onRemove(event.id)} style={styles.deleteBtn}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function Sheet({ children, onClose }) {
  return (
    <div style={styles.sheetOverlay} onClick={onClose}>
      <div style={styles.sheet} onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ExpenseModal({ onClose, onSave }) {
  const [mode, setMode] = useState("choose");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setMode("scanning"); setError("");
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = () => rej(new Error("read"));
        r.readAsDataURL(file);
      });
      const mediaType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

      const resp = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: `Lees dit bonnetje. Geef ALLEEN JSON (geen markdown):
{"amount": <eindtotaal in euro als getal>, "merchant": "<naam>", "date": "<YYYY-MM-DD of null>", "category": "<restaurant|boodschappen|activiteit|transport|overig>", "description": "<korte beschrijving max 5 woorden>"}
Regels: restaurant=café/bar/restaurant, boodschappen=supermarkt/winkel, activiteit=tickets/attracties, transport=taxi/parking/benzine/ov.` }
            ]
          }]
        })
      });
      const data = await resp.json();
      const text = data.content.map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      setAmount(String(parsed.amount || ""));
      setCategory(CATEGORIES[parsed.category] ? parsed.category : "overig");
      setDescription(parsed.description || parsed.merchant || "");
      if (parsed.date) setDate(parsed.date);
      setMode("review");
    } catch {
      setError("Bonnetje niet gelukt. Vul handmatig in.");
      setMode("manual");
    }
  }

  function save() {
    const a = parseFloat(String(amount).replace(",", "."));
    if (!a || a <= 0) { setError("Vul een geldig bedrag in."); return; }
    onSave({
      amount: a, category, description: description.trim() || CATEGORIES[category].label,
      date, source: mode === "review" ? "receipt" : "manual"
    });
  }

  return (
    <Sheet onClose={onClose}>
      <div style={styles.sheetHead}>
        {mode !== "choose" && mode !== "scanning" &&
          <button onClick={() => setMode("choose")} style={styles.iconBtnLight}><ArrowLeft size={18} /></button>}
        <h3 style={styles.sheetTitle}>
          {mode === "choose" ? "Uitgave toevoegen" :
           mode === "scanning" ? "Bon scannen…" :
           mode === "review" ? "Controleer en opslaan" : "Uitgave invullen"}
        </h3>
        <button onClick={onClose} style={styles.iconBtnLight}><X size={18} /></button>
      </div>

      {mode === "choose" && (
        <div style={{ padding: "8px 20px 24px" }}>
          <button onClick={() => cameraRef.current?.click()} style={styles.bigOption}>
            <div style={{ ...styles.bigOptionIcon, background: "#F7E8DF" }}>
              <Camera size={22} color="#C2613F" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={styles.bigOptionTitle}>Foto maken van bonnetje</div>
              <div style={styles.bigOptionSub}>Camera, AI leest 'm automatisch uit</div>
            </div>
            <ChevronRight size={18} color="#7A6F62" />
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files?.[0])} />

          <button onClick={() => galleryRef.current?.click()} style={styles.bigOption}>
            <div style={{ ...styles.bigOptionIcon, background: "#DCE8EE" }}>
              <ImageIcon size={22} color="#3D6B7C" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={styles.bigOptionTitle}>Kies foto uit galerij</div>
              <div style={styles.bigOptionSub}>Eerder gemaakte foto van je telefoon</div>
            </div>
            <ChevronRight size={18} color="#7A6F62" />
          </button>
          <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handleFile(e.target.files?.[0])} />

          <button onClick={() => setMode("manual")} style={styles.bigOption}>
            <div style={{ ...styles.bigOptionIcon, background: "#ECEDD9" }}>
              <Pencil size={22} color="#5C5D3F" strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={styles.bigOptionTitle}>Handmatig invullen</div>
              <div style={styles.bigOptionSub}>Zelf bedrag en categorie kiezen</div>
            </div>
            <ChevronRight size={18} color="#7A6F62" />
          </button>
        </div>
      )}

      {mode === "scanning" && (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <Loader2 size={32} className="spin" color="#C2613F" />
          <div style={{ marginTop: 16, fontSize: 14, color: "#5C5D3F" }}>AI leest je bonnetje uit…</div>
        </div>
      )}

      {(mode === "manual" || mode === "review") && (
        <div style={{ padding: "8px 20px 24px" }}>
          {mode === "review" && (
            <div style={styles.reviewBanner}>
              <Sparkles size={14} color="#3D6B7C" />
              <span>Klopt het? Pas aan indien nodig en sla op.</span>
            </div>
          )}
          {error && <div style={styles.errorBox}>{error}</div>}

          <label style={styles.lbl}>Bedrag</label>
          <div style={{ position: "relative" }}>
            <span style={styles.inputPrefix}>€</span>
            <input type="number" inputMode="decimal" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00"
              style={{ ...styles.input, paddingLeft: 32, fontSize: 20, fontFamily: "'Fraunces', serif" }}
              autoFocus={mode === "manual"} />
          </div>

          <label style={styles.lbl}>Categorie</label>
          <div style={styles.catPickerRow}>
            {Object.entries(CATEGORIES).map(([k, c]) => {
              const Icon = c.icon;
              const active = category === k;
              return (
                <button key={k} onClick={() => setCategory(k)}
                  style={{ ...styles.catPick, ...(active ? { background: c.color, color: "white", borderColor: c.color } : {}) }}>
                  <Icon size={14} strokeWidth={1.75} />
                  <span style={{ fontSize: 12 }}>{c.short}</span>
                </button>
              );
            })}
          </div>

          <label style={styles.lbl}>Omschrijving</label>
          <input type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="bv. lunch El Pimpi" style={styles.input} />

          <label style={styles.lbl}>Datum</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} />

          <button onClick={save} style={{ ...styles.primaryBtn, marginTop: 20 }}>
            <Check size={18} /> Opslaan
          </button>
        </div>
      )}
    </Sheet>
  );
}

function BudgetEditModal({ current, onClose, onSave }) {
  const [val, setVal] = useState(String(current));
  return (
    <Sheet onClose={onClose}>
      <div style={styles.sheetHead}>
        <h3 style={styles.sheetTitle}>Budget instellen</h3>
        <button onClick={onClose} style={styles.iconBtnLight}><X size={18} /></button>
      </div>
      <div style={{ padding: "8px 20px 24px" }}>
        <label style={styles.lbl}>Totaal vakantiebudget</label>
        <div style={{ position: "relative" }}>
          <span style={styles.inputPrefix}>€</span>
          <input type="number" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)}
            style={{ ...styles.input, paddingLeft: 32, fontSize: 20, fontFamily: "'Fraunces', serif" }} autoFocus />
        </div>
        <button onClick={() => onSave(parseFloat(val) || 0)} style={{ ...styles.primaryBtn, marginTop: 20 }}>
          <Check size={18} /> Opslaan
        </button>
      </div>
    </Sheet>
  );
}

function TripEditModal({ trip, onClose, onSave }) {
  const [dest, setDest] = useState(trip.destination || "Fuengirola");
  const [start, setStart] = useState(trip.start || "");
  const [end, setEnd] = useState(trip.end || "");
  return (
    <Sheet onClose={onClose}>
      <div style={styles.sheetHead}>
        <h3 style={styles.sheetTitle}>Reisgegevens</h3>
        <button onClick={onClose} style={styles.iconBtnLight}><X size={18} /></button>
      </div>
      <div style={{ padding: "8px 20px 24px" }}>
        <label style={styles.lbl}>Bestemming</label>
        <input type="text" value={dest} onChange={e => setDest(e.target.value)} style={styles.input} />
        <label style={styles.lbl}>Aankomst</label>
        <input type="date" value={start} onChange={e => setStart(e.target.value)} style={styles.input} />
        <label style={styles.lbl}>Vertrek</label>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={styles.input} />
        <button onClick={() => onSave({ destination: dest, start, end })} style={{ ...styles.primaryBtn, marginTop: 20 }}>
          <Check size={18} /> Opslaan
        </button>
      </div>
    </Sheet>
  );
}

function PlanModal({ planFor, trip, onClose, onSave }) {
  const item = planFor.item;
  const isRest = planFor.type === "restaurant";
  const days = generateTripDays(trip.start, trip.end);
  const defaultDate = days[0]?.iso || todayISO();
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(isRest ? "20:00" : "11:00");
  const [note, setNote] = useState("");

  return (
    <Sheet onClose={onClose}>
      <div style={styles.sheetHead}>
        <h3 style={styles.sheetTitle}>{isRest ? "Reservering plannen" : "Activiteit plannen"}</h3>
        <button onClick={onClose} style={styles.iconBtnLight}><X size={18} /></button>
      </div>
      <div style={{ padding: "8px 20px 24px" }}>
        <div style={styles.planSummary}>
          <div style={{ fontSize: 11, color: "#7A6F62", textTransform: "uppercase", letterSpacing: 0.5 }}>{isRest ? "Restaurant" : "Activiteit"}</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2A2520", marginTop: 2 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: "#7A6F62" }}>{item.city}</div>
        </div>

        {days.length > 0 ? (
          <>
            <label style={styles.lbl}>Dag</label>
            <div style={styles.dayPickerRow}>
              {days.map(d => (
                <button key={d.iso} onClick={() => setDate(d.iso)}
                  style={{ ...styles.dayPick, ...(date === d.iso ? styles.dayPickActive : {}) }}>
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{d.weekday.slice(0, 2).toUpperCase()}</div>
                  <div style={{ fontSize: 16, fontFamily: "'Fraunces', serif" }}>{d.dayNum}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <label style={styles.lbl}>Datum</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={styles.input} />
          </>
        )}

        <label style={styles.lbl}>Tijd</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} style={styles.input} />

        <label style={styles.lbl}>Notitie (optioneel)</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="bv. reservering bevestigd" style={styles.input} />

        <button onClick={() => onSave({
          title: item.name, type: planFor.type, date, time, note, city: item.city
        })} style={{ ...styles.primaryBtn, marginTop: 20 }}>
          <Check size={18} /> Toevoegen aan kalender
        </button>
      </div>
    </Sheet>
  );
}

function CustomRestaurantModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("Fuengirola");
  const [customCity, setCustomCity] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [priceLevel, setPriceLevel] = useState("€€€");
  const [priceHint, setPriceHint] = useState("");
  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedKeukens, setSelectedKeukens] = useState([]);
  const [error, setError] = useState("");

  const vibeOpts = ["Chic", "Lokaal favoriet", "Romantisch", "Beach Club", "Chiringuito", "Met uitzicht"];
  const keukenOpts = ["Spaans", "Italiaans", "Japans", "Vis & schaaldieren", "Vlees", "Tapas", "Aziatisch"];
  const toggleVibe = (t) => setSelectedVibes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleKeuken = (t) => setSelectedKeukens(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  function save() {
    if (!name.trim()) { setError("Naam is verplicht."); return; }
    const finalCity = city === "Anders" ? (customCity.trim() || "Onbekend") : city;
    onSave({
      name: name.trim(), city: finalCity, cuisine: cuisine.trim() || "Restaurant",
      area: area.trim() || finalCity, address: address.trim(),
      description: description.trim() || "Eigen toevoeging.",
      priceLevel, priceHint: priceHint.trim() || null,
      types: selectedVibes.length > 0 ? selectedVibes : ["Lokaal favoriet"],
      keuken: selectedKeukens,
      gradient: "linear-gradient(135deg, #5C5D3F 0%, #8B8B5F 100%)"
    });
  }

  return (
    <Sheet onClose={onClose}>
      <div style={styles.sheetHead}>
        <h3 style={styles.sheetTitle}>Eigen restaurant</h3>
        <button onClick={onClose} style={styles.iconBtnLight}><X size={18} /></button>
      </div>
      <div style={{ padding: "8px 20px 24px" }}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.lbl}>Naam *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="bv. Chiringuito Aldo" style={styles.input} autoFocus />

        <label style={styles.lbl}>Stad</label>
        <div style={styles.cityPicker}>
          {["Fuengirola", "Málaga", "Marbella", "Torremolinos", "Anders"].map(c => (
            <button key={c} onClick={() => setCity(c)}
              style={{ ...styles.cityPick, ...(city === c ? styles.cityPickActive : {}) }}>{c}</button>
          ))}
        </div>
        {city === "Anders" && (
          <input value={customCity} onChange={e => setCustomCity(e.target.value)}
            placeholder="Plaatsnaam" style={{ ...styles.input, marginTop: 8 }} />
        )}

        <label style={styles.lbl}>Type keuken (beschrijving)</label>
        <input value={cuisine} onChange={e => setCuisine(e.target.value)} placeholder="bv. Italiaans · Pizza" style={styles.input} />

        <label style={styles.lbl}>Sfeer-tags</label>
        <div style={styles.tagPicker}>
          {vibeOpts.map(t => (
            <button key={t} onClick={() => toggleVibe(t)}
              style={{ ...styles.tagPickBtn, ...(selectedVibes.includes(t) ? styles.tagPickActive : {}) }}>
              {t}
            </button>
          ))}
        </div>

        <label style={styles.lbl}>Keuken-tags</label>
        <div style={styles.tagPicker}>
          {keukenOpts.map(t => (
            <button key={t} onClick={() => toggleKeuken(t)}
              style={{ ...styles.tagPickBtn, ...(selectedKeukens.includes(t) ? styles.tagPickActive : {}) }}>
              {t}
            </button>
          ))}
        </div>

        <label style={styles.lbl}>Prijsniveau</label>
        <div style={styles.cityPicker}>
          {["€", "€€", "€€€", "€€€€"].map(p => (
            <button key={p} onClick={() => setPriceLevel(p)}
              style={{ ...styles.cityPick, ...(priceLevel === p ? styles.cityPickActive : {}) }}>{p}</button>
          ))}
        </div>

        <label style={styles.lbl}>Prijs-indicatie (optioneel)</label>
        <input value={priceHint} onChange={e => setPriceHint(e.target.value)} placeholder="bv. Pizza €10-15" style={styles.input} />

        <label style={styles.lbl}>Wijk / Locatie</label>
        <input value={area} onChange={e => setArea(e.target.value)} placeholder="bv. Paseo Marítimo" style={styles.input} />

        <label style={styles.lbl}>Adres (optioneel)</label>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="bv. Calle X 12" style={styles.input} />

        <label style={styles.lbl}>Beschrijving</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Korte omschrijving van de zaak" style={{ ...styles.input, minHeight: 80, fontFamily: "'Manrope', sans-serif", resize: "vertical" }} />

        <button onClick={save} style={{ ...styles.primaryBtn, marginTop: 20 }}>
          <Check size={18} /> Toevoegen
        </button>
      </div>
    </Sheet>
  );
}

function CustomActivityModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [costPerPerson, setCostPerPerson] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [error, setError] = useState("");

  const availableTypes = ["Gratis", "Cultuur", "Avontuur", "Strand", "Wellness", "Familie", "Dagtrip", "Natuur", "Wandeling", "Eten & drinken"];
  const toggleType = (t) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  function save() {
    if (!name.trim()) { setError("Naam is verplicht."); return; }
    const cost = parseFloat(String(costPerPerson).replace(",", ".")) || 0;
    const types = selectedTypes.length > 0 ? [...selectedTypes] : (cost === 0 ? ["Gratis"] : ["Cultuur"]);
    if (cost === 0 && !types.includes("Gratis")) types.unshift("Gratis");
    onSave({
      name: name.trim(), city: city.trim() || "Fuengirola",
      costPerPerson: cost, description: description.trim() || "Eigen toevoeging.",
      types
    });
  }

  return (
    <Sheet onClose={onClose}>
      <div style={styles.sheetHead}>
        <h3 style={styles.sheetTitle}>Eigen activiteit</h3>
        <button onClick={onClose} style={styles.iconBtnLight}><X size={18} /></button>
      </div>
      <div style={{ padding: "8px 20px 24px" }}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <label style={styles.lbl}>Naam *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="bv. Sunset cruise" style={styles.input} autoFocus />

        <label style={styles.lbl}>Plaats</label>
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="bv. Fuengirola" style={styles.input} />

        <label style={styles.lbl}>Kosten per persoon</label>
        <div style={{ position: "relative" }}>
          <span style={styles.inputPrefix}>€</span>
          <input type="number" inputMode="decimal" step="0.01"
            value={costPerPerson} onChange={e => setCostPerPerson(e.target.value)}
            placeholder="0,00 (leeg = gratis)"
            style={{ ...styles.input, paddingLeft: 32 }} />
        </div>

        <label style={styles.lbl}>Categorie tags</label>
        <div style={styles.tagPicker}>
          {availableTypes.map(t => (
            <button key={t} onClick={() => toggleType(t)}
              style={{ ...styles.tagPickBtn, ...(selectedTypes.includes(t) ? styles.tagPickActive : {}) }}>
              {t}
            </button>
          ))}
        </div>

        <label style={styles.lbl}>Beschrijving</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Korte omschrijving" style={{ ...styles.input, minHeight: 80, fontFamily: "'Manrope', sans-serif", resize: "vertical" }} />

        <button onClick={save} style={{ ...styles.primaryBtn, marginTop: 20 }}>
          <Check size={18} /> Toevoegen
        </button>
      </div>
    </Sheet>
  );
}

function AIView({ trip, messages, setMessages, onPlan }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const examplePrompts = [
    "Wat is er leuk te doen in Málaga?",
    "Waar kunnen we lekker shoppen?",
    "Mooie plek voor zonsondergang vanavond?",
    "Beste tapas-spot in de buurt?",
    "Wat doen we als het regent?",
    "Romantisch diner voor onze laatste avond?"
  ];

  async function send(question) {
    const q = (typeof question === "string" ? question : input).trim();
    if (!q || loading) return;
    setInput("");
    const userMsg = { role: "user", content: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const tripContext = trip.destination
        ? `${trip.destination}${trip.start && trip.end ? `, van ${trip.start} t/m ${trip.end}` : ""}`
        : "Fuengirola, Costa del Sol";

      const instructions = `Je bent een AI-reisgids voor een Nederlands stel in ${tripContext}. Antwoord beknopt en praktisch in het Nederlands met concrete tips. Noem echte plekken bij naam met buurt/context.

GEEF ALLEEN DEZE JSON terug (geen markdown, geen ` + "```" + ` fences, geen tekst eromheen):
{"reply":"je tekst-antwoord","suggestions":[{"title":"naam plek","city":"plaats","type":"activiteit","description":"korte reden"}]}

- suggestions: max 4 concrete plekken om in te plannen
- type: "restaurant" voor eten/drinken, anders "activiteit"
- Bij algemene vragen zonder concrete plekken: suggestions = []`;

      // Bouw messages array - prepend instructies aan LAATSTE user message
      // (op dezelfde manier als de receipt-scan API call die werkt)
      const recent = newMessages.slice(-10).map(m => ({ role: m.role, content: String(m.content || "") }));
      // Find laatste user message en prepend instructies
      for (let i = recent.length - 1; i >= 0; i--) {
        if (recent[i].role === "user") {
          recent[i] = { ...recent[i], content: instructions + "\n\n---\n\nVRAAG: " + recent[i].content };
          break;
        }
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: recent
        })
      });

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const errBody = await response.text();
          console.error("AI API error:", response.status, errBody);
          const errJson = JSON.parse(errBody);
          if (errJson?.error?.message) errMsg = errJson.error.message;
        } catch (e) { console.error("Parse error body failed:", e); }
        throw new Error(errMsg);
      }

      const data = await response.json();
      console.log("AI response:", data);

      if (!data.content || !Array.isArray(data.content)) {
        throw new Error("Onverwacht API-antwoord (geen content array)");
      }

      const rawText = data.content
        .filter(c => c.type === "text")
        .map(c => c.text || "")
        .join("")
        .trim();

      if (!rawText) throw new Error("Leeg antwoord van AI");

      // Robuuste JSON-extractie
      let parsed = null;
      const cleaned = rawText.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const m = cleaned.match(/\{[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch {} }
      }

      let aiMsg;
      if (parsed && (typeof parsed.reply === "string" || Array.isArray(parsed.suggestions))) {
        aiMsg = {
          role: "assistant",
          content: parsed.reply || "(geen tekst-antwoord)",
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.filter(s => s && s.title) : []
        };
      } else {
        // Fallback: gebruik plain text als JSON parsing faalt
        aiMsg = { role: "assistant", content: rawText, suggestions: [] };
      }

      setMessages([...newMessages, aiMsg]);
    } catch (e) {
      console.error("AI send failed:", e);
      const detail = e?.message ? ` (${e.message})` : "";
      setMessages([...newMessages, {
        role: "assistant",
        content: `Sorry, kon nu geen antwoord ophalen${detail}. Probeer het zo nog eens.`,
        suggestions: [], error: true
      }]);
    }
    setLoading(false);
  }

  return (
    <div style={styles.aiView}>
      <div ref={scrollRef} style={styles.aiScroll}>
        {messages.length === 0 ? (
          <div style={styles.aiWelcome}>
            <div style={styles.aiWelcomeIcon}>
              <Sparkles size={28} color="#C2613F" strokeWidth={1.5} />
            </div>
            <h2 style={styles.aiWelcomeTitle}>Vraag je reisgids</h2>
            <p style={styles.aiWelcomeText}>
              Stel een vraag, of probeer een van deze:
            </p>
            <div style={styles.aiPromptList}>
              {examplePrompts.map(q => (
                <button key={q} onClick={() => send(q)} style={styles.aiPrompt}>
                  <span style={{ flex: 1, textAlign: "left" }}>{q}</span>
                  <ChevronRight size={16} color="#C2613F" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.length > 0 && (
              <div style={{ textAlign: "right", marginBottom: 8 }}>
                <button onClick={() => setMessages([])} style={styles.aiClearBtn}>
                  <Trash2 size={11} /> Wis gesprek
                </button>
              </div>
            )}
            {messages.map((m, i) => (
              <ChatMessage key={i} msg={m} trip={trip} onPlan={onPlan} />
            ))}
            {loading && <LoadingBubble />}
          </>
        )}
      </div>

      <div style={styles.aiInputBar}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Stel een vraag…"
          style={styles.aiInput}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{ ...styles.aiSendBtn, opacity: (loading || !input.trim()) ? 0.4 : 1 }}
          aria-label="Versturen">
          {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}

function ChatMessage({ msg, trip, onPlan }) {
  if (msg.role === "user") {
    return (
      <div style={styles.userMsgWrap}>
        <div style={styles.userBubble}>{msg.content}</div>
      </div>
    );
  }
  return (
    <div style={styles.aiMsgWrap}>
      <div style={{ ...styles.aiBubble, ...(msg.error ? { background: "#FCE8E8", color: "#A53030" } : {}) }}>
        {msg.content.split(/\n+/).filter(Boolean).map((line, i) => (
          <p key={i} style={{ margin: i > 0 ? "8px 0 0" : 0, lineHeight: 1.5 }}>{line}</p>
        ))}
      </div>
      {msg.suggestions && msg.suggestions.length > 0 && (
        <div style={styles.suggestionList}>
          {msg.suggestions.map((s, i) => (
            <div key={i} style={styles.suggestionCard}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.suggestionTitle}>{s.title}</div>
                <div style={styles.suggestionMeta}>
                  {s.type === "restaurant" ? <Utensils size={11} /> : <Ticket size={11} />}
                  <span>
                    {s.city || trip.destination || "Fuengirola"} · {s.type === "restaurant" ? "Restaurant" : "Activiteit"}
                  </span>
                </div>
                {s.description && <div style={styles.suggestionDesc}>{s.description}</div>}
              </div>
              <button onClick={() => onPlan(s)} style={styles.suggestionPlan} aria-label="Inplannen">
                <Calendar size={14} /> Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingBubble() {
  return (
    <div style={styles.aiMsgWrap}>
      <div style={{ ...styles.aiBubble, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Loader2 size={14} className="spin" color="#7A6F62" />
        <span style={{ fontSize: 13, color: "#7A6F62" }}>Aan het nadenken…</span>
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "restaurants", label: "Resto's", icon: Utensils },
    { id: "activiteiten", label: "Doen", icon: Ticket },
    { id: "kalender", label: "Agenda", icon: Calendar },
    { id: "ai", label: "AI", icon: Sparkles }
  ];
  return (
    <nav style={styles.nav}>
      {items.map(it => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => setTab(it.id)}
            style={{ ...styles.navBtn, color: active ? "#C2613F" : "#7A6F62" }}>
            <Icon size={20} strokeWidth={active ? 2 : 1.5} />
            <span style={{ fontSize: 10, marginTop: 4, fontWeight: active ? 600 : 400 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function generateTripDays(start, end) {
  if (!start || !end) return [];
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s) || isNaN(e) || s > e) return [];
  const days = [];
  const d = new Date(s);
  while (d <= e) {
    days.push({
      iso: d.toISOString().split("T")[0],
      weekday: WEEKDAYS[d.getDay()],
      dayNum: d.getDate(),
      monthShort: MONTHS[d.getMonth()],
      monthFull: MONTHS_FULL[d.getMonth()],
      year: d.getFullYear()
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function fmtRange(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (isNaN(s) || isNaN(e)) return "";
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@300;400;500;600;700&display=swap');
* { box-sizing: border-box; }
body, html { margin: 0; padding: 0; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
button { font-family: 'Manrope', sans-serif; cursor: pointer; }
input, textarea { font-family: 'Manrope', sans-serif; }
input:focus, textarea:focus { outline: none; border-color: #C2613F !important; }
`;

const styles = {
  app: { minHeight: "100vh", background: "#FAF6F0", fontFamily: "'Manrope', sans-serif", color: "#2A2520", paddingBottom: 80, maxWidth: 480, margin: "0 auto", position: "relative" },
  header: { padding: "32px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerEyebrow: { fontSize: 10, letterSpacing: 2, color: "#7A6F62", fontWeight: 600, marginBottom: 4 },
  headerTitle: { margin: 0, fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: "#2A2520", letterSpacing: -0.5, lineHeight: 1 },
  headerDates: { marginTop: 6, fontSize: 13, color: "#7A6F62" },
  iconBtn: { border: "1px solid #E8E3DC", background: "white", borderRadius: 999, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", color: "#5C5D3F" },
  iconBtnLight: { border: "none", background: "transparent", padding: 4, color: "#7A6F62" },
  viewWrap: { padding: "0 20px 24px" },
  heroCard: { background: "#FFFFFF", borderRadius: 20, padding: 24, boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -8px rgba(120, 90, 60, 0.12)", marginBottom: 24 },
  smallLabel: { fontSize: 11, color: "#7A6F62", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 },
  heroAmount: { fontFamily: "'Fraunces', serif", fontSize: 40, fontWeight: 500, color: "#2A2520", letterSpacing: -1, marginTop: 4 },
  heroSub: { fontSize: 12, color: "#7A6F62", marginTop: 2 },
  ghostBtn: { border: "1px solid #E8E3DC", background: "white", borderRadius: 999, padding: "6px 12px", fontSize: 12, color: "#5C5D3F", display: "flex", gap: 6, alignItems: "center" },
  progressTrack: { height: 6, background: "#F0EAE0", borderRadius: 999, marginTop: 20, marginBottom: 8, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999, transition: "width 0.5s ease" },
  sectionH: { fontFamily: "'Fraunces', serif", fontSize: 20, color: "#2A2520", fontWeight: 500, margin: "8px 0 12px", letterSpacing: -0.2 },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 },
  catCard: { borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 8 },
  catAmount: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, letterSpacing: -0.3 },
  primaryBtn: { background: "#2A2520", color: "white", border: "none", borderRadius: 14, padding: "16px 20px", width: "100%", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryBtn: { background: "white", color: "#5C5D3F", border: "1px dashed #C5B8A8", borderRadius: 12, padding: "12px 16px", width: "100%", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
  expRow: { display: "flex", alignItems: "center", gap: 12, background: "white", borderRadius: 12, padding: "12px 14px" },
  expIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  expDesc: { fontWeight: 500, fontSize: 14, color: "#2A2520", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  deleteBtn: { border: "none", background: "transparent", padding: 4, color: "#C5B8A8", marginLeft: 4 },
  empty: { padding: 24, textAlign: "center", color: "#7A6F62", fontSize: 13, background: "white", borderRadius: 14, border: "1px dashed #E0D9CC", lineHeight: 1.5 },
  filterBlock: { background: "white", borderRadius: 16, padding: "10px 0 2px", marginBottom: 8, boxShadow: "0 1px 0 rgba(0,0,0,0.03)" },
  searchWrap: { position: "relative", marginBottom: 10 },
  searchInput: { width: "100%", padding: "12px 40px 12px 40px", border: "1px solid #E0D9CC", borderRadius: 14, fontSize: 14, color: "#2A2520", background: "white", transition: "border-color 0.2s" },
  searchClear: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "#F0EAE0", width: 22, height: 22, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6F62", cursor: "pointer" },
  priceRatingStack: { marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  ratingBadge: { display: "inline-flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.95)", borderRadius: 999, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#2A2520", letterSpacing: 0.2 },
  filterRowWrap: { paddingBottom: 8, borderBottom: "1px solid #F5EEE2", marginBottom: 6 },
  filterLabel: { fontSize: 10, color: "#7A6F62", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, padding: "0 16px 6px" },
  filterChips: { display: "flex", gap: 5, overflowX: "auto", padding: "0 16px 4px", scrollbarWidth: "none" },
  chip: { border: "1px solid #E0D9CC", background: "white", padding: "6px 12px", borderRadius: 999, fontSize: 12, color: "#5C5D3F", whiteSpace: "nowrap", flexShrink: 0, fontWeight: 500 },
  chipActive: { background: "#2A2520", color: "white", borderColor: "#2A2520", fontWeight: 600 },
  chipDivider: { width: 1, height: 18, background: "#E0D9CC", flexShrink: 0, alignSelf: "center", margin: "0 4px" },
  resultRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 12px" },
  linkBtn: { border: "none", background: "transparent", color: "#C2613F", fontSize: 12, fontWeight: 600, textDecoration: "underline", padding: 0 },
  restCard: { background: "white", borderRadius: 18, overflow: "hidden", position: "relative", boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 4px 16px -8px rgba(120, 90, 60, 0.18)" },
  restImg: { height: 180, position: "relative", padding: 20, display: "flex", alignItems: "flex-end", overflow: "hidden" },
  restImgGradient: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" },
  restImgContent: { position: "relative", color: "white", textShadow: "0 1px 8px rgba(0,0,0,0.4)" },
  restBadges: { position: "absolute", top: 14, left: 14, right: 14, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start", zIndex: 1 },
  restName: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.05 },
  restType: { fontSize: 12, marginTop: 6, opacity: 0.9, letterSpacing: 0.5, textTransform: "uppercase" },
  restPriceBadge: { background: "rgba(255,255,255,0.95)", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: "#2A2520" },
  restBody: { padding: "14px 16px" },
  restMetaRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  priceHint: { fontSize: 11, color: "#C2613F", fontWeight: 600, background: "#F7E8DF", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap", flexShrink: 0 },
  priceHintBig: { display: "inline-flex", alignItems: "center", gap: 6, background: "#F7E8DF", color: "#C2613F", padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 14 },
  michelinBadge: { display: "inline-flex", alignItems: "center", gap: 1, background: "#A53030", color: "white", padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.3 },
  greenStarBadge: { display: "inline-flex", alignItems: "center", gap: 3, background: "#4A6B3F", color: "white", padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 },
  customBadge: { display: "inline-flex", alignItems: "center", background: "#3D6B7C", color: "white", padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700 },
  tagPill: { background: "#F0EAE0", color: "#5C5D3F", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500 },
  tagPillSmall: { background: "#F5EFE5", color: "#7A6F62", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 500 },
  cardDelete: { position: "absolute", bottom: 12, right: 12, border: "none", background: "rgba(255,255,255,0.95)", borderRadius: 999, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#7A6F62", zIndex: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  cardDeleteInline: { border: "none", background: "transparent", padding: 8, color: "#C5B8A8", position: "absolute", top: 8, right: 8 },
  sheetOverlay: { position: "fixed", inset: 0, background: "rgba(20, 16, 12, 0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" },
  sheet: { background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", animation: "slideUp 0.3s ease" },
  sheetHead: { padding: "20px 20px 12px", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", borderBottom: "1px solid #F0EAE0", position: "sticky", top: 0, background: "white", zIndex: 1 },
  sheetTitle: { margin: 0, fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 500, color: "#2A2520", flex: 1 },
  detailHero: { height: 240, position: "relative", display: "flex", alignItems: "flex-end" },
  detailHeroOverlay: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" },
  detailHeroContent: { padding: 24, color: "white", position: "relative", zIndex: 1 },
  detailTitle: { margin: "4px 0", fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 500, color: "white", letterSpacing: -0.5, lineHeight: 1.1 },
  detailText: { fontSize: 15, lineHeight: 1.6, color: "#2A2520", marginBottom: 16, marginTop: 0 },
  closeBtn: { position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 999, background: "rgba(255,255,255,0.2)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", zIndex: 2 },
  addressBox: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#FAF6F0", borderRadius: 10, marginBottom: 12 },
  linkRow: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "#FAF6F0", borderRadius: 12, textDecoration: "none", color: "#2A2520", fontSize: 14 },
  costBox: { display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 16, padding: 16, background: "#FAF6F0", borderRadius: 14, marginBottom: 16 },
  costLabel: { fontSize: 11, color: "#7A6F62", textTransform: "uppercase", letterSpacing: 0.5 },
  infoBanner: { background: "#FDF6F0", border: "1px solid #F0E0D0", borderRadius: 12, padding: 12, fontSize: 12, color: "#5C5D3F", margin: "0 0 12px", display: "flex", gap: 8, alignItems: "center" },
  actCardWrap: { position: "relative" },
  actCard: { background: "white", border: "none", borderRadius: 14, padding: 16, width: "100%", display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 2px 8px -4px rgba(120, 90, 60, 0.08)" },
  actPrice: { textAlign: "right", flexShrink: 0, minWidth: 70 },
  actFree: { fontFamily: "'Fraunces', serif", fontSize: 14, color: "#4A6B3F", fontWeight: 700, letterSpacing: 0.5, background: "#E8F0E1", padding: "6px 10px", borderRadius: 8 },
  lbl: { display: "block", fontSize: 11, color: "#7A6F62", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginTop: 16, marginBottom: 6 },
  input: { width: "100%", padding: "14px 14px", border: "1px solid #E0D9CC", borderRadius: 12, fontSize: 15, color: "#2A2520", background: "white", transition: "border-color 0.2s" },
  inputPrefix: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#7A6F62", fontSize: 18 },
  errorBox: { background: "#FCE8E8", color: "#A53030", padding: 12, borderRadius: 10, fontSize: 13, marginTop: 12 },
  reviewBanner: { background: "#DCE8EE", color: "#1F4A5A", padding: 12, borderRadius: 10, fontSize: 13, display: "flex", gap: 8, alignItems: "center" },
  catPickerRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 },
  catPick: { padding: "10px 4px", border: "1px solid #E0D9CC", background: "white", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: "#5C5D3F" },
  cityPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
  cityPick: { padding: "10px 14px", border: "1px solid #E0D9CC", background: "white", borderRadius: 10, color: "#5C5D3F", fontSize: 13, flex: 1, minWidth: 60 },
  cityPickActive: { background: "#2A2520", color: "white", borderColor: "#2A2520" },
  tagPicker: { display: "flex", gap: 6, flexWrap: "wrap" },
  tagPickBtn: { padding: "8px 12px", border: "1px solid #E0D9CC", background: "white", borderRadius: 999, color: "#5C5D3F", fontSize: 12 },
  tagPickActive: { background: "#C2613F", color: "white", borderColor: "#C2613F", fontWeight: 600 },
  bigOption: { width: "100%", border: "1px solid #F0EAE0", background: "white", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 14, marginBottom: 10 },
  bigOptionIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bigOptionTitle: { fontWeight: 600, fontSize: 15, color: "#2A2520" },
  bigOptionSub: { fontSize: 12, color: "#7A6F62", marginTop: 2 },
  planSummary: { background: "#FAF6F0", borderRadius: 12, padding: 14, marginTop: 8 },
  dayPickerRow: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 },
  dayPick: { minWidth: 52, padding: "10px 6px", borderRadius: 12, border: "1px solid #E0D9CC", background: "white", color: "#5C5D3F", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 },
  dayPickActive: { background: "#2A2520", color: "white", borderColor: "#2A2520" },
  warning: { background: "#FDF6F0", border: "1px solid #F0E0D0", borderRadius: 12, padding: 14, fontSize: 13, color: "#5C5D3F", marginBottom: 16 },
  calToolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 12px" },
  evtSimple: { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "white", borderRadius: 10 },
  evtTime: { fontSize: 11, color: "#7A6F62", display: "flex", alignItems: "center", gap: 4 },
  dayCard: { background: "white", borderRadius: 18, padding: "16px 20px", position: "relative", boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 4px 12px -6px rgba(120, 90, 60, 0.1)" },
  dayCardToday: { boxShadow: "0 0 0 2px #C2613F, 0 4px 16px -4px rgba(194, 97, 63, 0.3)" },
  dayTag: { position: "absolute", top: -8, left: 20, color: "white", fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "4px 10px", borderRadius: 999, textTransform: "uppercase" },
  dayCardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, border: "none", background: "transparent", width: "100%", padding: "4px 0", cursor: "pointer" },
  dayWeekday: { fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1 },
  dayFullDate: { fontSize: 12, color: "#7A6F62", marginTop: 4, fontWeight: 500 },
  dayEventCount: { color: "#C2613F", fontWeight: 600 },
  calBadge: { width: 52, height: 56, borderRadius: 10, overflow: "hidden", border: "1px solid #E0D9CC", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "0 2px 6px -2px rgba(0,0,0,0.08)" },
  calBadgeTop: { background: "#C2613F", color: "white", fontSize: 9, fontWeight: 700, letterSpacing: 1, textAlign: "center", padding: "3px 0" },
  calBadgeNum: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 22, color: "#2A2520", fontWeight: 600, background: "white" },
  chevronWrap: { transition: "transform 0.25s ease", flexShrink: 0 },
  dayCardBody: { paddingTop: 14, marginTop: 14, borderTop: "1px solid #F0EAE0" },
  dayEmpty: { fontSize: 13, color: "#A89D8E", fontStyle: "italic", textAlign: "center", padding: "8px 0" },
  timeline: { paddingLeft: 4 },
  tlRow: { display: "flex", gap: 12 },
  tlLeft: { display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 },
  tlDot: { width: 10, height: 10, borderRadius: 999, flexShrink: 0, boxShadow: "0 0 0 3px white, 0 0 0 4px #F0EAE0" },
  tlLine: { flex: 1, width: 2, background: "#F0EAE0", marginTop: 4 },
  tlTime: { fontSize: 12, color: "#C2613F", fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 },
  tlTitleRow: { display: "flex", alignItems: "flex-start", gap: 8 },
  tlTitle: { fontFamily: "'Fraunces', serif", fontSize: 17, color: "#2A2520", fontWeight: 500, lineHeight: 1.2 },
  tlMeta: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7A6F62", marginTop: 4 },
  tlNote: { fontSize: 12, color: "#5C5D3F", marginTop: 4, fontStyle: "italic" },
  nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid #F0EAE0", display: "flex", justifyContent: "space-around", padding: "10px 0 22px", maxWidth: 480, margin: "0 auto", zIndex: 50 },
  navBtn: { border: "none", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 8px", minWidth: 48 },
  // AI view
  aiView: { display: "flex", flexDirection: "column", minHeight: "calc(100vh - 100px)", padding: "0 20px" },
  aiScroll: { flex: 1, paddingBottom: 90 },
  aiWelcome: { textAlign: "center", padding: "20px 0 40px" },
  aiWelcomeIcon: { width: 64, height: 64, borderRadius: 999, background: "#F7E8DF", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" },
  aiWelcomeTitle: { fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 500, color: "#2A2520", margin: "0 0 8px", letterSpacing: -0.3 },
  aiWelcomeText: { fontSize: 13, color: "#7A6F62", margin: "0 0 20px" },
  aiPromptList: { display: "flex", flexDirection: "column", gap: 8 },
  aiPrompt: { background: "white", border: "1px solid #E8E3DC", borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "#2A2520", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "background 0.15s" },
  userMsgWrap: { display: "flex", justifyContent: "flex-end", marginBottom: 12 },
  aiMsgWrap: { display: "flex", flexDirection: "column", marginBottom: 16 },
  userBubble: { background: "#2A2520", color: "white", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", maxWidth: "85%", fontSize: 14, lineHeight: 1.4 },
  aiBubble: { background: "white", color: "#2A2520", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", maxWidth: "92%", fontSize: 14, lineHeight: 1.5, boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 2px 8px -4px rgba(120, 90, 60, 0.1)" },
  suggestionList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 },
  suggestionCard: { background: "white", border: "1px solid #F0EAE0", borderRadius: 14, padding: 14, display: "flex", gap: 10, alignItems: "flex-start", boxShadow: "0 1px 0 rgba(0,0,0,0.04)" },
  suggestionTitle: { fontFamily: "'Fraunces', serif", fontSize: 16, color: "#2A2520", fontWeight: 500, lineHeight: 1.2 },
  suggestionMeta: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7A6F62", marginTop: 4 },
  suggestionDesc: { fontSize: 12, color: "#5C5D3F", marginTop: 6, lineHeight: 1.4 },
  suggestionPlan: { border: "none", background: "#C2613F", color: "white", borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0, alignSelf: "center" },
  aiInputBar: { position: "fixed", bottom: 78, left: 0, right: 0, maxWidth: 480, margin: "0 auto", padding: "10px 20px 12px", background: "rgba(250,246,240,0.95)", backdropFilter: "blur(12px)", display: "flex", gap: 8, zIndex: 49, borderTop: "1px solid #F0EAE0" },
  aiInput: { flex: 1, padding: "12px 16px", border: "1px solid #E0D9CC", borderRadius: 999, fontSize: 14, color: "#2A2520", background: "white", outline: "none" },
  aiSendBtn: { border: "none", background: "#C2613F", color: "white", width: 42, height: 42, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "opacity 0.15s" },
  aiClearBtn: { border: "none", background: "transparent", color: "#7A6F62", fontSize: 11, padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }
};
