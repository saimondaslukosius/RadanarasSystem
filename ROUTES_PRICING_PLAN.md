# RADANARAS SYSTEM - ROUTES & PRICING MANAGEMENT

## 🎯 FEATURE OVERVIEW

**Complete TMS** - Transport fleet + Routes + Pricing + Carrier marketplace

---

## 🗺️ ROUTE MANAGEMENT

### **Route Structure:**

\\\json
// routes.json
{
  "id": "route_001",
  "name": "Ryga Airport → Vilnius",
  "origin": {
    "city": "Riga",
    "country": "Latvia",
    "location": "Riga Airport",
    "coordinates": {"lat": 56.9496, "lng": 23.9713}
  },
  "destination": {
    "city": "Vilnius",
    "country": "Lithuania", 
    "location": "City center",
    "coordinates": {"lat": 54.6872, "lng": 25.2797}
  },
  "distance": 295, // km
  "estimatedDuration": 240, // minutes
  "popularRoute": true,
  "usageCount": 45, // how many times used
  "createdAt": "2026-01-15T10:00:00Z"
}
\\\

---

## 💰 PRICING STRUCTURE

### **Client Pricing Agreements:**

\\\json
// client-route-pricing.json
{
  "id": "clp_001",
  "clientId": "client_056",
  "routeId": "route_001",
  "pricePerUnit": 122, // EUR per car
  "priceFullLoad": null, // or fixed price for full truck
  "currency": "EUR",
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31",
  "notes": "Sutarta kaina 2026 metams",
  "createdAt": "2026-01-15T10:00:00Z"
}
\\\

### **Carrier Pricing:**

\\\json
// carrier-route-pricing.json
{
  "id": "crp_001",
  "carrierId": "carrier_012",
  "routeId": "route_001",
  "pricePerUnit": 95, // EUR per car
  "priceFullLoad": 850, // EUR for 9 cars
  "currency": "EUR",
  "availableCapacity": [3, 5, 9], // slots available
  "leadTime": 24, // hours notice needed
  "validFrom": "2026-01-01",
  "validTo": "2026-06-30",
  "notes": "Reguliarus vežėjas",
  "createdAt": "2026-01-15T10:00:00Z"
}
\\\

---

## 📊 MARGIN CALCULATION

### **Order Margin:**

\\\javascript
// Example: 9 cars Riga → Vilnius
Client price: 9 × 122 EUR = 1,098 EUR
Carrier price: 9 × 95 EUR = 855 EUR
Margin: 1,098 - 855 = 243 EUR (22.1%)
\\\

---

## 🔍 CARRIER SEARCH ENGINE

### **Search by Route:**

**UI Flow:**
\\\
User: "9 cars Riga Airport → Vilnius"

Search Results:
┌─────────────────────────────────────────────────────────┐
│ Vežėjai - Ryga Airport → Vilnius (9 automobiliai)      │
├─────────────────────────────────────────────────────────┤
│ ┌─┬──────────┬────────┬─────────┬────────┬──────────┐  │
│ │#│ Vežėjas  │ Kaina  │ Marža   │ Reit.  │ Veiksmai │  │
│ ├─┼──────────┼────────┼─────────┼────────┼──────────┤  │
│ │1│ Schenker │ 850€   │ 248€ 🟢 │ ⭐4.8  │ [Rinktis]│  │
│ │2│ DSV      │ 855€   │ 243€ 🟢 │ ⭐4.6  │ [Rinktis]│  │
│ │3│ Girteka  │ 920€   │ 178€ 🟡 │ ⭐4.9  │ [Rinktis]│  │
│ └─┴──────────┴────────┴─────────┴────────┴──────────┘  │
└─────────────────────────────────────────────────────────┘

Klientui sutarta kaina: 1,098€ (9 × 122€)
\\\

---

## ⭐ CARRIER RATING SYSTEM

### **Rating Structure:**

\\\json
// carrier-ratings.json
{
  "carrierId": "carrier_012",
  "ratings": {
    "speed": 4.8, // 1-5 stars
    "communication": 4.9,
    "pricing": 4.2,
    "reliability": 4.7,
    "overall": 4.65 // average
  },
  "totalOrders": 156,
  "completedOnTime": 148,
  "onTimePercentage": 94.9,
  "averageResponseTime": 45, // minutes
  "preferredCarrier": true,
  "notes": "Labai greitas atsakymas, patikimas",
  "lastUpdated": "2026-04-15T10:00:00Z"
}
\\\

### **Rating After Order:**

\\\
┌─────────────────────────────────────────────────────┐
│ Įvertinti vežėją - Schenker                         │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Greitis (delivery speed):        ⭐⭐⭐⭐⭐          │
│ Komunikacija (communication):    ⭐⭐⭐⭐⭐          │
│ Kaina (pricing):                  ⭐⭐⭐⭐☆          │
│ Patikimumas (reliability):       ⭐⭐⭐⭐⭐          │
│                                                      │
│ Komentaras:                                          │
│ [                                                  ] │
│                                                      │
│ [Išsaugoti įvertinimą]                              │
└─────────────────────────────────────────────────────┘
\\\

---

## 📱 UI/UX DESIGN

### **NEW BLOCK: Kainynas (Price List)**

\\\
Main Navigation:
[Dashboard] [Klientai] [Vežėjai] [Užsakymai] [Nustatymai] [📋 Kainynas]
                                                            ↑ NEW!
\\\

**Kainynas Page:**

\\\
┌─────────────────────────────────────────────────────────┐
│ Kainynas ir maršrutai                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Maršrutai] [Klientų kainos] [Vežėjų kainos] [Paieška] │
│                                                          │
│ 🔍 Populiariausi maršrutai:                             │
│                                                          │
│ ┌─┬──────────────────────┬───────┬────────┬─────────┐  │
│ │#│ Maršrutas            │ Naud. │ Vid.   │ Veiksmai│  │
│ ├─┼──────────────────────┼───────┼────────┼─────────┤  │
│ │1│ Ryga → Vilnius       │ 45×   │ 122€/v │ [Peržiū]│  │
│ │2│ Klaipėda → Hamburg   │ 38×   │ 145€/v │ [Peržiū]│  │
│ │3│ Vilnius → Warszawa   │ 29×   │ 98€/v  │ [Peržiū]│  │
│ └─┴──────────────────────┴───────┴────────┴─────────┘  │
│                                                          │
│ [+ Pridėti maršrutą]                                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
\\\

**Route Details:**

\\\
┌─────────────────────────────────────────────────────────┐
│ Maršrutas: Ryga Airport → Vilnius                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📍 Maršruto informacija                                 │
│ Iš: Ryga, Latvia (Riga Airport)                        │
│ Į: Vilnius, Lithuania                                   │
│ Atstumas: 295 km                                        │
│ Trukmė: ~4 val.                                         │
│ Naudota: 45 kartus                                      │
│                                                          │
│ 💰 KLIENTŲ KAINOS (sutarta su klientais)               │
│ ┌────────────────┬──────────┬────────────┬─────────┐   │
│ │ Klientas       │ Kaina/v  │ Galioja iki│ Edit    │   │
│ ├────────────────┼──────────┼────────────┼─────────┤   │
│ │ Test klientas  │ 122€     │ 2026-12-31 │ [✏]     │   │
│ │ Veho Lietuva   │ 130€     │ 2026-06-30 │ [✏]     │   │
│ └────────────────┴──────────┴────────────┴─────────┘   │
│                                                          │
│ 🚛 VEŽĖJŲ KAINOS (ką siūlo vežėjai)                    │
│ ┌────────────┬────────┬─────────┬────────┬─────────┐   │
│ │ Vežėjas    │ Kaina  │ Marža   │ Reit.  │ Edit    │   │
│ ├────────────┼────────┼─────────┼────────┼─────────┤   │
│ │ Schenker   │ 850€/9v│ 248€ 🟢 │ ⭐4.8  │ [✏]     │   │
│ │ DSV        │ 855€/9v│ 243€ 🟢 │ ⭐4.6  │ [✏]     │   │
│ │ Girteka    │ 920€/9v│ 178€ 🟡 │ ⭐4.9  │ [✏]     │   │
│ └────────────┴────────┴─────────┴────────┴─────────┘   │
│                                                          │
│ [+ Pridėti klientą] [+ Pridėti vežėją]                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
\\\

---

## 🎯 SMART SEARCH WORKFLOW

**User Story:**
1. Gaunu užklausą: "9 automobiliai Ryga → Vilnius"
2. Einu į Kainynas → Paieška
3. Įvedu: Origin, Destination, Quantity
4. Sistema rodo:
   - Sutarta kaina su klientu (jei yra)
   - Visi vežėjai kurie veža šį maršrutą
   - Sorted by margin (highest first)
   - Rating visible
5. Click [Rinktis] → Creates draft order with pre-filled data

---

## 📊 DASHBOARD ENHANCEMENTS

### **New Dashboard Widgets:**

\\\
┌─────────────────────────────────────────────────────────┐
│ Dashboard                                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [Financial Cards - jau turime]                          │
│                                                          │
│ 🗺️ TOP 5 POPULIARIAUSI MARŠRUTAI                       │
│ ┌──────────────────────────┬─────────┬──────────────┐   │
│ │ Maršrutas                │ Užsak.  │ Vid. marža   │   │
│ ├──────────────────────────┼─────────┼──────────────┤   │
│ │ Ryga → Vilnius           │ 45      │ 243€ (22%)   │   │
│ │ Klaipėda → Hamburg       │ 38      │ 312€ (28%)   │   │
│ │ Vilnius → Warszawa       │ 29      │ 156€ (19%)   │   │
│ └──────────────────────────┴─────────┴──────────────┘   │
│                                                          │
│ ⭐ TOP 5 VEŽĖJAI (pagal reitingą)                       │
│ ┌──────────────┬──────────┬────────┬────────────────┐   │
│ │ Vežėjas      │ Reitingas│ Užsak. │ On-time %      │   │
│ ├──────────────┼──────────┼────────┼────────────────┤   │
│ │ Girteka      │ ⭐4.9    │ 89     │ 96.6%          │   │
│ │ Schenker     │ ⭐4.8    │ 156    │ 94.9%          │   │
│ │ DSV          │ ⭐4.6    │ 78     │ 92.3%          │   │
│ └──────────────┴──────────┴────────┴────────────────┘   │
│                                                          │
│ 💰 GERIAUSIOS MARŽOS ŠĮ MĖNESĮ                          │
│ ┌──────────────────────┬──────────┬────────────────┐    │
│ │ Užsakymas            │ Marža    │ Marža %        │    │
│ ├──────────────────────┼──────────┼────────────────┤    │
│ │ #ORD-045 Hamburg     │ 487€     │ 35.2%          │    │
│ │ #ORD-038 Warszawa    │ 423€     │ 31.8%          │    │
│ │ #ORD-041 Ryga        │ 312€     │ 26.4%          │    │
│ └──────────────────────┴──────────┴────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
\\\

---

## 🛠️ IMPLEMENTATION PHASES

### **PHASE 1: Transport Management (2 weeks)**
- Drivers, trucks, trailers CRUD
- Documents upload
- Assignments
→ Already planned in TRANSPORT_MANAGEMENT_PLAN.md

### **PHASE 2: Routes & Basic Pricing (1 week)**
- Routes database
- Client-route pricing
- Carrier-route pricing
- Basic UI in Kainynas

### **PHASE 3: Search & Comparison (1 week)**
- Smart search by route
- Margin calculation
- Carrier comparison table
- "Rinktis" integration with orders

### **PHASE 4: Ratings System (1 week)**
- Rating structure
- Post-order rating UI
- Rating display in search
- TOP carriers widget

### **PHASE 5: Dashboard Analytics (1 week)**
- Popular routes widget
- TOP carriers widget
- Best margins widget
- Charts & trends

### **PHASE 6: Advanced Features (Future)**
- Route optimization
- Automatic carrier suggestions
- Price trend analysis
- Predictive pricing

---

## 📚 MY ENHANCEMENTS

**Beyond your requirements:**

1. **Geolocation integration:**
   - Map view of routes
   - Distance calculation
   - Route visualization

2. **Price history:**
   - Track pricing changes over time
   - Identify pricing trends
   - Alert on price increases

3. **Automatic margin alerts:**
   - Low margin warnings (<15%)
   - Excellent margin highlights (>30%)

4. **Carrier performance tracking:**
   - On-time delivery %
   - Average response time
   - Issue history

5. **Quick quote generator:**
   - Input: route + quantity
   - Output: instant quote with best carriers

6. **Favorite routes:**
   - Pin frequently used routes
   - Quick access shortcuts

---

## 🎯 SUCCESS METRICS

**After full implementation:**

- ⏱️ Order creation time: 5 min → 2 min (60% faster)
- 📊 Margin visibility: 100% of orders
- 📞 Carrier search time: 15 min → 30 sec (97% faster)
- ⭐ Carrier quality: Data-driven decisions
- 💰 Average margin increase: +5% (from better carrier selection)

---

**Last updated:** 2026-04-15  
**Feature:** Routes & Pricing Management  
**Estimated timeline:** 6 weeks full implementation  
**Status:** Planning Phase
