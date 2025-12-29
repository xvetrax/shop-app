# E-Shop Funkcionalumo Įgyvendinimo Planas

## 📋 Bendra Apžvalga

Projektas: Next.js 14 (App Router) + TypeScript + Tailwind
Funkcionalumas: Krepšelis (frontend) + Checkout puslapis + Opay integracija

---

## 🗂️ 1. KREPŠELIO BŪSENOS VALDYMAS

### 1.1. Context Provider
**Failas:** `src/contexts/CartContext.tsx`
- **"use client"** viršuje (būtinai!)
- React Context su TypeScript tipais
- Funkcijos: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- Automatinis localStorage sinchronizavimas
- **Error handling localStorage:**
  - try/catch parse'inant JSON
  - Fallback į tuščią masyvą, jei parse failina
  - Silent error handling (nepalaužia app, jei localStorage nepasiekiamas)

### 1.2. Krepšelio Tipai
**Failas:** `src/lib/types/cart.ts`
- **Atskirti tipus:**
  - `Product` - importuojamas iš `lib/products.ts` (nepakeisti)
  - `CartItem` - atskiras tipas su:
    - `product: Product` (arba `productSlug: string` + reference)
    - `quantity: number`
    - `selectedColor?: string` (būsimiems patobulinimams)
    - `note?: string` (būsimiems patobulinimams)
- `CartState` tipas
- Helper funkcijos: `calculateTotal`, `calculateItemTotal`

### 1.3. Layout atnaujinimas
**Failas:** `src/app/layout.tsx`
- Apgaubti su `CartProvider`
- Client component wrapper (nes Context reikalauja "use client")

---

## 🛒 2. UI KOMPONENTAI

### 2.1. Krepšelio ikona su skaitliuku
**Failas:** `src/components/cart/CartIcon.tsx`
- Client component
- Rodo prekių kiekį krepšelyje
- Link į `/cart` puslapį
- Responsive dizainas

### 2.2. Krepšelio elemento komponentas
**Failas:** `src/components/cart/CartItem.tsx`
- Rodo prekę su nuotrauka, pavadinimu, kiekiu, kaina
- Kiekio keitimo mygtukai (+/-)
- Pašalinimo mygtukas
- Responsive dizainas

### 2.3. Krepšelio santrauka (Summary)
**Failas:** `src/components/cart/CartSummary.tsx`
- **Aiški struktūra:**
  - `subtotal` - prekių suma be pristatymo
  - `shipping` - pristatymo kaina (pradžioje gali būti 0 arba placeholder)
  - `total` - galutinė suma (subtotal + shipping)
- Naudojamas ir `/cart`, ir `/checkout` puslapiuose
- Responsive dizainas

### 2.4. "Add to Cart" mygtukas
**Failas:** `src/components/products/AddToCartButton.tsx`
- Client component
- **"Kvailas" komponentas:**
  - Priima `product: Product` ir `quantity?: number` (default 1)
  - Kviečia `useCart().addItem(product, quantity)`
  - **Logika CartContext'e, ne pačiame mygtuke**
- Integruojamas į `ProductCard` ir produkto detalės puslapį
- Optimistic UI (momentinis atnaujinimas)
- Toast pranešimas (optional)

---

## 📄 3. PUSLAPIAI

### 3.1. Krepšelio puslapis
**Failas:** `src/app/cart/page.tsx`
- Server component (jei galima) arba Client component
- Rodo visus krepšelio elementus (`CartItem` komponentai)
- `CartSummary` komponentas
- "Tęsti į apmokėjimą" mygtukas → `/checkout`
- "Tęsti apsipirkimą" link → `/products`
- Tuščio krepšelio būsena su pranešimu

### 3.2. Checkout puslapis
**Failas:** `src/app/checkout/page.tsx`
- Client component (formos valdymas)
- **Tuščio krepšelio apsauga:**
  - Jei krepšelis tuščias → redirect į `/products` arba
  - Rodyk pranešimą "Krepšelis tuščias" su mygtuku "Grįžti į produktus"
- **Guest checkout:**
  - Nereikia user account'ų
  - Tiesiog forma + mokėjimas
  - Visi duomenys perduodami per API
- Dviejų stulpelių layout:
  - Kairė: Užsakymo santrauka (`CartSummary` + prekių sąrašas)
  - Dešinė: Pirkėjo forma
- Formos laukai:
  - Vardas (required)
  - El. paštas (required, validation)
  - Telefono numeris (required, LT formatas)
  - Adresas (required)
  - Miestas (required)
  - Pašto kodas (required)
  - Pristatymo būdas (radio: "Omniva", "LP Express", "Paštomatai")
- "Apmokėti" mygtukas → API call į `/api/checkout`

### 3.3. Success puslapis
**Failas:** `src/app/order/success/page.tsx`
- Rodo sėkmingo užsakymo pranešimą
- Order ID (jei turimas)
- "Grįžti į produktus" mygtukas
- Naudojamas kaip Opay return URL po sėkmingo mokėjimo

### 3.4. Failure puslapis
**Failas:** `src/app/order/failure/page.tsx`
- Rodo mokėjimo klaidos pranešimą
- Paaiškinimas, kodėl mokėjimas nepavyko
- "Bandyti dar kartą" mygtukas → `/checkout`
- "Grįžti į produktus" mygtukas
- Naudojamas kaip Opay return URL po nepavykusio mokėjimo

---

## 🔌 4. API ROUTES

### 4.1. Checkout API
**Failas:** `src/app/api/checkout/route.ts`
- POST metodas
- Validuoja užsakymo duomenis
- Sukuria Opay payment session (naudojant `lib/opay.ts`)
- Grąžina Opay redirect URL
- Error handling su aiškiais error messages

**Request body:**
```typescript
{
  items: CartItem[],
  customer: {
    name: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    postalCode: string,
    deliveryMethod: string
  }
}
```

**Response:**
```typescript
{
  success: boolean,
  paymentUrl?: string,
  orderId?: string,
  error?: string
}
```

**Pastaba:** Visi Opay parametrai (merchant ID, API key, endpoint, callback/return URL) tik iš `.env.local`, niekur hardcode'inti!

### 4.2. Opay Callback API
**Failas:** `src/app/api/opay-callback/route.ts`
- POST metodas (Opay webhook)
- **Struktūra signature validacijai:**
  - `verifyCallback(payload, signature)` funkcija iš `lib/opay.ts`
  - Net jei pirmam MVP tik `console.log`, struktūra turi būti paruošta
  - Vėliau bus tikras hash validation
- Atnaujina užsakymo būseną (jei turime DB, dabar gali būti tik logging)
- Siunčia patvirtinimo el. laišką (jei reikia, būsimas patobulinimas)
- Grąžina 200 OK Opay sistemai (svarbu!)

**Request (nuo Opay):**
- Payment status
- Order ID
- Signature (security)
- Kiti Opay specifiniai laukai

---

## 📚 5. LIB FUNKCIJOS

### 5.1. Opay integracija
**Failas:** `src/lib/opay.ts`
- **Funkcijos:**
  - `createPaymentSession(order: Order): Promise<{ redirectUrl: string }>`
    - Sukuria mokėjimo sesiją Opay API
    - Konvertuoja total į Opay formatą (centai / string su kableliu - pagal Opay spec)
    - Grąžina redirect URL
  - `verifyCallback(payload, signature): boolean`
    - Validuoja webhook signature
    - Pirmam MVP gali grąžinti `true`, bet struktūra paruošta
    - Vėliau tikras hash validation
  - `getPaymentStatus(orderId: string): Promise<PaymentStatus>` (optional)
    - Tikrina mokėjimo būseną
- **Konversijos funkcija:**
  - `formatAmountForOpay(amount: number): string` arba panašiai
  - Vienoje vietoje, kad nebūtų "magijos" API route'e
- **Konfigūracija:**
  - Visi parametrai iš `.env.local` (OPAY_MERCHANT_ID, OPAY_API_KEY, OPAY_API_URL)
  - Nėra hardcode'intų reikšmių

### 5.2. Užsakymų tipai
**Failas:** `src/lib/types/order.ts`
- `Order` tipas
- `Customer` tipas
- `DeliveryMethod` enum
- `PaymentStatus` enum

### 5.3. Formos validacija
**Failas:** `src/lib/validation.ts`
- Email validacija
- Telefono numerio validacija (LT formatas)
- Pašto kodo validacija
- Reusable validation funkcijos

---

## 🎨 6. UI ATNAUJINIMAI

### 6.1. Navbar atnaujinimas
**Failas:** `src/components/layout/Navbar.tsx`
- Pridėti `CartIcon` komponentą
- Responsive dizainas (mobile menu su krepšeliu)

### 6.2. ProductCard atnaujinimas
**Failas:** `src/components/products/ProductCard.tsx`
- Pridėti "Add to Cart" funkcionalumą (jei reikia)

### 6.3. Produkto detalės puslapis atnaujinimas
**Failas:** `src/app/products/[slug]/page.tsx`
- Pakeisti statinį "Add to cart" mygtuką į `AddToCartButton` komponentą
- Pridėti kiekio pasirinkimą (jei reikia)

---

## 🔐 7. KONFIGŪRACIJA

### 7.1. Environment variables
**Failas:** `.env.local` (nepridedamas į git, pridėti į `.gitignore`)

**Būtini env kintamieji (konvencija):**
```bash
# Opay konfigūracija
OPAY_MERCHANT_ID=your_merchant_id
OPAY_API_KEY=your_api_key
OPAY_API_URL=https://api.opay.lt  # arba sandbox URL testavimui
OPAY_CALLBACK_URL=http://localhost:3000/api/opay-callback  # production: https://yourdomain.com/api/opay-callback

# Aplikacijos URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # production: https://yourdomain.com

# Opay return URLs (po mokėjimo)
OPAY_SUCCESS_URL=http://localhost:3000/order/success
OPAY_FAILURE_URL=http://localhost:3000/order/failure
```

**Pastaba:** 
- Visi Opay susiję kintamieji prasideda su `OPAY_`
- `NEXT_PUBLIC_` naudojamas tik jei reikia frontend'e
- Production URL'us keisti pagal savo domeną

### 7.2. TypeScript tipai
- Visi tipai `src/lib/types/` kataloge
- Eksportuojami ir naudojami visur

---

## 📦 8. PRIKLausomybės

**Naujos priklausomybės (jei reikia):**
- `zod` - formos validacijai (optional, bet rekomenduojama)
- `react-hot-toast` - toast pranešimams (optional)

**Esamos priklausomybės pakanka:**
- Next.js 14 (App Router)
- React 18
- TypeScript

---

## 🔄 9. ĮGYVENDINIMO EILĖS TVARKA

### Faza 1: Krepšelio pagrindas
1. Sukurti `CartContext` su localStorage
2. Sukurti `CartIcon` komponentą
3. Atnaujinti `layout.tsx` su Provider
4. Atnaujinti `Navbar` su krepšelio ikona
5. Sukurti `AddToCartButton` komponentą
6. Integruoti į produkto puslapius

### Faza 2: Krepšelio puslapis
1. Sukurti `/cart` puslapį
2. Sukurti `CartItem` komponentą
3. Sukurti `CartSummary` komponentą
4. Implementuoti kiekio keitimą ir pašalinimą

### Faza 3: Checkout puslapis
1. Sukurti `/checkout` puslapį
2. Sukurti pirkėjo formą su validacija
3. Integruoti `CartSummary`
4. Stilizuoti su Tailwind

### Faza 4: Opay integracija
1. Sukurti `src/lib/opay.ts` su API funkcijomis
   - `createPaymentSession()` su amount konversija
   - `verifyCallback()` struktūra (net jei pirmam tik placeholder)
2. Sukurti `/api/checkout` route
   - Naudoja `lib/opay.ts` funkcijas
   - Visi env kintamieji iš `.env.local`
3. Sukurti `/api/opay-callback` route
   - Signature validation struktūra
   - 200 OK response Opay sistemai
4. Sukurti `/order/success` ir `/order/failure` puslapius
5. Testuoti integraciją (sandbox mode)

### Faza 5: Poliravimas
1. Error handling visur (localStorage, API calls, formos)
2. Loading states (formos submit, API calls)
3. Success/error pranešimai
4. Responsive dizainas
5. Accessibility patobulinimai
6. Tuščio krepšelio apsauga checkout puslapyje

---

## 📝 10. PASTABOS

- **localStorage**: 
  - Krepšelis laikomas tik frontende, nėra backend duomenų bazės
  - **Būtinai try/catch parse'inant JSON**
  - Fallback į tuščią masyvą, jei klaida
- **Tipai**: 
  - `Product` ir `CartItem` atskirti (CartItem gali turėti papildomus laukus)
  - Visi tipai `src/lib/types/` kataloge
- **Opay**: 
  - Reikės Opay sandbox/test credentials ir production credentials
  - **Visi parametrai tik iš `.env.local`, niekur hardcode'inti**
  - Signature validation struktūra paruošta nuo pradžių
- **Guest checkout**: 
  - Nereikia user account'ų, tiesiog forma + mokėjimas
- **Formos validacija**: 
  - Galima naudoti HTML5 validation arba Zod
- **Error handling**: 
  - Visur turėtų būti try/catch ir user-friendly error messages
  - localStorage errors neturėtų palaužti aplikacijos
- **TypeScript**: 
  - Visi komponentai ir funkcijos turėtų būti tipizuoti
- **Responsive**: 
  - Visi puslapiai turėtų veikti mobile ir desktop
- **Success/Failure puslapiai**: 
  - Būtini Opay return URL'ams
  - Aiškūs pranešimai vartotojui

---

## 🎯 REZULTATAS

Po įgyvendinimo turėsite:
- ✅ Veikiantį krepšelį su localStorage (su error handling)
- ✅ `/cart` puslapį su visomis funkcijomis
- ✅ `/checkout` puslapį su pirkėjo forma (guest checkout)
- ✅ `/order/success` ir `/order/failure` puslapius
- ✅ Opay integraciją su mokėjimo procesu
- ✅ Webhook callback sistemą su signature validation struktūra
- ✅ Aiškų env kintamųjų konvenciją
- ✅ Atskirtus tipus (Product vs CartItem)
- ✅ "Kvailą" AddToCartButton su logika Context'e

