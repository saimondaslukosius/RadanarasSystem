# RADANARAS SYSTEM - CLAUDE.AI PROJECT SETUP GUIDE

## 🎯 TIKSLAS
Sukurti galingą Claude.ai projektą "RadanarasSystem", kad kiekvienas naujas pokalbis AUTOMATIŠKAI žinotų:
- Kas yra šis projektas
- Kur baigėme paskutinį kartą
- Kaip tęsti darbą toliau

---

## 📚 **3 PAGRINDINĖS FUNKCIJOS:**

### 1️⃣ **FILES (Failai)**
- Failai, kuriuos Claude gali skaityti kiekviename pokalbyje
- **Naudojimas:** Dokumentacija, config'ai, schema
- **Limitas:** Iki 10 MB per failą

### 2️⃣ **INSTRUCTIONS (Instrukcijos)**
- **SVARBIAUSIAS!** - Tai "system prompt" projektui
- Claude VISADA mato šias instrukcijas pradėdamas pokalbį
- **Naudojimas:** Kaip elgtis, kokiu stiliumi rašyti, ko vengti
- **Limitas:** Iki 8000 characters

### 3️⃣ **MEMORY (Atmintis)**
- Claude AUTOMATIŠKAI išsaugo svarbią info
- **Naudojimas:** User info, projekto statusas, preferences
- **Galima valdyti:** Add/Edit/Delete rankiniu

---

## 🚀 **KAIP SETUP'INTI PROJEKTĄ:**

### **ŽINGSNIS 1: Eiti į Claude.ai Projects**

1. Atidaryk https://claude.ai
2. Kairėje pusėje spausk **"Projects"**
3. Spausk **"+ New Project"** arba **"Create project"**
4. Pavadinimas: **"RadanarasSystem"** ✅
5. Description (optional): "Logistics management system for Radanaras MB"

---

### **ŽINGSNIS 2: Pridėti INSTRUCTIONS**

1. Projekto viduje spausk **"Project settings"** (gear icon ⚙️)
2. Arba spausk **"Custom instructions"**
3. **Copy-paste visą INSTRUCTIONS.md failą į langą:**
   - Atidaryk `INSTRUCTIONS.md` failą
   - Select All (`Ctrl+A`)
   - Copy (`Ctrl+C`)
   - Paste į Claude.ai Instructions field
4. Spausk **"Save"** ✅

**SVARBU:** Tai yra "system prompt" - Claude VISADA jas mato!

---

### **ŽINGSNIS 3: Pridėti FILES**

1. Projekto viduje spausk **"Add content"** arba **"Upload files"**
2. **Upload PROJECT_OVERVIEW.md:**
   - Spausk "Choose files"
   - Pasirink `PROJECT_OVERVIEW.md`
   - Spausk "Upload"
3. Failas dabar rodomas Project Knowledge sekcijoje ✅

**Kas bus faile:**
- Visa projekto info
- Tech stack
- Deployment info
- Fixes implemented
- Common commands
- File paths

---

### **ŽINGSNIS 4: Patikrinti MEMORY (Optional)**

1. Settings → **Memory**
2. Turėtų būti automatiškai išsaugota:
   - "User's name: Saimondas Lukosius"
   - "Role: Logistics Manager"
   - "Project: RadanarasSystem"
   - "Language: Lithuanian + English for tech"
   - "Server: http://76.13.76.9"

3. Jei nėra - **Pridėk rankiniu:**
   - Spausk **"Add memory"**
   - Įrašyk: "User Saimondas works on RadanarasSystem logistics app"

---

### **ŽINGSNIS 5: Test naujo pokalbio**

1. **Start new chat** projekte
2. Parašyk: "Hi, kur mes baigėme?"
3. Claude TURĖTŲ žinoti:
   ✅ Kas esi (Saimondas)
   ✅ Projektas (RadanarasSystem)
   ✅ Tech stack (React + Node.js)
   ✅ Server (76.13.76.9)
   ✅ Recent work (deployment, fixes)

---

## 📋 **IDEALUS PROJECT SETUP:**

```
RadanarasSystem Project
│
├── 📄 Custom Instructions (INSTRUCTIONS.md content)
│   └── Role, communication style, technical context
│
├── 📁 Project Knowledge
│   └── PROJECT_OVERVIEW.md (uploaded file)
│       └── Complete project documentation
│
└── 🧠 Memory (automatic + manual)
    ├── User: Saimondas Lukosius
    ├── Project: RadanarasSystem
    ├── Server: http://76.13.76.9
    └── Language: Lithuanian + English
```

---

## 💡 **KAIP NAUDOTI KIEKVIENAME POKALBYJE:**

### **Pradedant naują pokalbį:**

**Pokalbis 1:**
```
User: "Reikia fix'inti backend error"
Claude: [Automatically knows:
  - Project structure
  - Server location
  - How to debug
  - Commands to use]
```

**Pokalbis 2:**
```
User: "Kur mes baigėme paskutinį kartą?"
Claude: "Paskutinį kartą padarėme:
  1. Backend Linux fix (pdf-poppler)
  2. Frontend environment URLs
  3. Nginx proxy fix
  Sistema dabar veikia 100%! ✅
  Ką toliau darome?"
```

**Pokalbis 3:**
```
User: "Deploy naujas features"
Claude: [Automatically knows deployment workflow:
  - Git push local
  - SSH to server
  - Git pull
  - npm run build
  - PM2 restart
  - Test on 76.13.76.9]
```

---

## 🔄 **UPDATING PROJECT INFO:**

### **Kai projektas keičiasi:**

1. **Update INSTRUCTIONS.md:**
   - Edit lokalų failą
   - Project Settings → Custom Instructions
   - Paste naują turinį
   - Save

2. **Update PROJECT_OVERVIEW.md:**
   - Edit lokalų failą
   - Project Knowledge → Remove old file
   - Upload naują versiją

3. **Update Memory (automatic):**
   - Paprasčiausias: Claude pats update'ina kiekvieną pokalbį
   - Rankiniu: Settings → Memory → Edit

---

## ✅ **CHECKLIST - AR VISKAS DONE:**

### **Project Setup Complete When:**
- ✅ Project name: "RadanarasSystem"
- ✅ Custom Instructions: INSTRUCTIONS.md content pasted
- ✅ Project Knowledge: PROJECT_OVERVIEW.md uploaded
- ✅ Memory: Contains user & project info
- ✅ Test chat: Claude knows everything!

### **Test Questions:**
1. "Kas aš esu?" → Should know: Saimondas, Logistics Manager
2. "Koks projektas?" → Should know: RadanarasSystem logistics app
3. "Kur serveris?" → Should know: http://76.13.76.9
4. "Tech stack?" → Should know: React + Node.js + JSON
5. "Kaip deploy'inti?" → Should know: Git workflow + PM2

---

## 🎓 **BEST PRACTICES:**

### **DO's:**
- ✅ Update Instructions kai workflow'ai keičiasi
- ✅ Update PROJECT_OVERVIEW.md kai deploy'ini major changes
- ✅ Start new chat projektui per "New chat in project"
- ✅ Review Memory kartais - ištrink outdated info

### **DON'Ts:**
- ❌ Don't paste passwords į Instructions/Files (use env vars)
- ❌ Don't upload large files (>10MB won't work)
- ❌ Don't forget to test after setup
- ❌ Don't use generic project names ("My Project")

---

## 🚀 **REZULTATAS:**

### **Prieš Project Setup:**
```
New Chat:
User: "Fix backend"
Claude: "Koks backend? Kokia problema? Koks projektas?"
```

### **Po Project Setup:**
```
New Chat:
User: "Fix backend"
Claude: "Tikrinu RadanarasSystem backend (76.13.76.9)...
PM2 logs rodo: [checks logs]
Problema: [identifies issue]
Sprendimas: [provides fix]
Commands:
ssh root@76.13.76.9
pm2 restart radanaras-backend
✅ Done!"
```

---

## 💾 **BACKUP & VERSIONING:**

### **Keeping Track:**
1. **Local copies:** Keep INSTRUCTIONS.md + PROJECT_OVERVIEW.md in Git
2. **Version control:** Update version in file when major changes
3. **Changelog:** Add section in PROJECT_OVERVIEW.md for changes
4. **Regular review:** Monthly check if info is still accurate

---

## 🎯 **NEXT LEVEL (Optional):**

### **Future Enhancements:**
1. **Multiple projects:** Create separate projects for different systems
2. **Shared knowledge:** Upload common files (e.g., company standards)
3. **Team collaboration:** Share project with team members
4. **API integration:** Use Claude API with project context

---

**🎉 DONE! Dabar turi SUPER PROJECT SETUP!** 🚀

Every new conversation will be:
- ✅ Context-aware
- ✅ Continuous
- ✅ Efficient
- ✅ Professional

No more "kas čia yra?" - Claude ALWAYS knows! 💪
