# RADANARAS SYSTEM - TEAM ONBOARDING GUIDE
**Kaip prijungti antrą developerį prie RadanarasSystem projekto**

---

## 🎯 TIKSLAS

Šis guide'as skirtas prijungti antrą developerį prie projekto, kad abu galėtumėte:
- ✅ Dirbti tuo pačiu kodu
- ✅ Matyti vienas kito pakeitimus
- ✅ Testruoti lokaliai savo kompiuteriuose
- ✅ Deploy'inti į production kartu

---

## 📋 Prerequisites (Kas turi būti įdiegta)

### 1. **Node.js** (JavaScript runtime)
**Download:** https://nodejs.org/
**Versija:** 20.x arba naujesnė
**Installiacija:**
- Download LTS versiją
- Run installer
- Verify: \
ode --version\ (turėtų rodyti v20.x.x)
- Verify: \
pm --version\ (turėtų rodyti 10.x.x)

### 2. **Git** (Version control)
**Download:** https://git-scm.com/
**Installiacija:**
- Download Windows versija
- Run installer (use defaults)
- Verify: \git --version\ (turėtų rodyti git version 2.x.x)

### 3. **Code Editor** (Recommended: VS Code)
**Download:** https://code.visualstudio.com/
**Extensions (optional but recommended):**
- ESLint
- Prettier
- GitLens

### 4. **GitHub Account**
**Sukurti:** https://github.com/signup
**Reikalinga:** Email, username, password

---

## 🔐 GITHUB SETUP (Administrator daro)

### **Step 1: Invite Collaborator**

**📍 ADMIN (Saimondas) daro:**

1. Eik į: https://github.com/saimondaslukosius/RadanarasSystem
2. Click **Settings** (repo settings, ne account settings)
3. Left sidebar → **Collaborators and teams**
4. Click **Add people**
5. Įvesk draugo GitHub username arba email
6. Click **Add [username] to this repository**
7. Pasirink **Write** role (kad galėtų push'inti)
8. Click **Add [username] to RadanarasSystem**

**Draugas gaus email su invitation link!**

### **Step 2: Accept Invitation**

**📍 DRAUGAS daro:**

1. Patikrini email (GitHub invitation)
2. Click **View invitation**
3. Click **Accept invitation**
4. ✅ Dabar turi write access į repo!

---

## 💻 LOCAL SETUP (Draugas daro savo kompiuteryje)

### **Step 1: Git Configuration**

**📍 WINDOWS POWERSHELL:**

\\\powershell
# Configure git with your name and email
git config --global user.name "Tavo Vardas"
git config --global user.email "tavo.email@example.com"

# Verify
git config --global user.name
git config --global user.email
\\\

**IMPORTANT:** Email turi būti tas pats kaip GitHub account!

### **Step 2: Clone Repository**

**📍 WINDOWS POWERSHELL:**

\\\powershell
# Navigate to desired location
cd C:\Users\[TavoVardas]

# Clone repository
git clone https://github.com/saimondaslukosius/RadanarasSystem.git

# Enter project folder
cd RadanarasSystem
\\\

**Git paklaus username/password:**
- **Username:** Tavo GitHub username
- **Password:** GitHub Personal Access Token (ne įprastas password!)

### **Step 3: Create GitHub Personal Access Token**

**Jei Git prašo password, reikia sukurti token:**

1. Eik į: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Name: "RadanarasSystem Dev"
4. Expiration: 90 days (arba No expiration)
5. Select scopes: ✅ **repo** (viskas po repo)
6. Click **Generate token**
7. **COPY TOKEN** (matosi tik kartą!)
8. Paste kaip password kai git klausia

**Arba naudok GitHub CLI (easier):**
\\\powershell
# Install GitHub CLI
winget install GitHub.cli

# Login
gh auth login
# Pasirink: GitHub.com → HTTPS → Yes → Login with browser
\\\

### **Step 4: Install Dependencies**

**📍 WINDOWS POWERSHELL:**

\\\powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to root
cd ..
\\\

**Tai įdiegs visus packages iš \package.json\**

### **Step 5: Environment Setup**

**📍 Backend Environment:**

\\\powershell
# Backend .env file (jau turėtų būti iš repo)
cat backend/.env
\\\

**Should contain:**
\\\
PORT=3001
NODE_ENV=development
DATA_PATH=./data
UPLOAD_PATH=./uploads
PDF_TEMP_PATH=./temp
\\\

**📍 Frontend Environment:**

\\\powershell
# Frontend .env file for development
cat frontend/.env
\\\

**Should contain:**
\\\
VITE_API_BASE_URL=http://localhost:3001
\\\

**Jei failų nėra - sukurti rankiniu būdu!**

---

## 🚀 RUNNING LOCAL DEVELOPMENT

### **Option A: Manual (2 terminals)**

**📍 TERMINAL 1 - Backend:**
\\\powershell
cd C:\Users\[TavoVardas]\RadanarasSystem\backend
node index.js
\\\

**Should see:** \Server started on http://localhost:3001\

**📍 TERMINAL 2 - Frontend:**
\\\powershell
cd C:\Users\[TavoVardas]\RadanarasSystem\frontend
npm run dev
\\\

**Should see:** \Local: http://localhost:5173\

**Open browser:** http://localhost:5173

### **Option B: Use Startup Script**

**📍 Run existing batch script:**
\\\powershell
cd C:\Users\[TavoVardas]\RadanarasSystem
.\start-radanaras.bat
\\\

**Note:** Reikės edit'inti script paths jei tavo username skiriasi!

---

## 🤝 COLLABORATION WORKFLOW

### **Daily Workflow (Abu developeriai):**

**📍 1. MORNING - Gauti naujausius pakeitimus:**

\\\powershell
cd C:\Users\[TavoVardas]\RadanarasSystem

# Get latest changes
git pull origin main

# Install any new dependencies
cd backend && npm install
cd ../frontend && npm install
\\\

**📍 2. DIRBTI - Daryti pakeitimus:**

\\\powershell
# Edit code in VS Code
# Test locally (run backend + frontend)
# Verify changes work
\\\

**📍 3. COMMIT - Išsaugoti savo darbus:**

\\\powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add feature X" # arba "Fix bug Y" arba "Update Z"

# Push to GitHub
git push origin main
\\\

**IMPORTANT:** Commit message turi būti DESCRIPTIVE:
- ✅ "Add client search functionality"
- ✅ "Fix carrier dropdown bug"
- ✅ "Update dashboard styling"
- ❌ "changes"
- ❌ "fix"
- ❌ "update"

**📍 4. EVENING - Patikrinti ar yra naujų pakeitimų:**

\\\powershell
# Get latest changes from other developer
git pull origin main
\\\

---

## ⚠️ MERGE CONFLICTS (Kaip išspręsti)

**Kas yra merge conflict?**
- Abu edit'inote TĄ PATĮ failą TĄ PAČIĄ eilutę
- Git nežino kurią versiją palikti

**Kaip atrodo:**
\\\javascript
<<<<<<< HEAD
const port = 3001; // Tavo versija
=======
const port = 3000; // Kito versija
>>>>>>> main
\\\

**Kaip išspręsti:**

1. **Open failą VS Code** - parodys conflict markers
2. **Pasirink vieną:**
   - **Accept Current Change** (tavo versija)
   - **Accept Incoming Change** (kito versija)
   - **Accept Both Changes** (abi)
   - **Manual edit** (combine manually)
3. **Remove conflict markers** (\<<<<\, \====\, \>>>>\)
4. **Save file**
5. **Git add ir commit:**

\\\powershell
git add [conflict-file]
git commit -m "Resolve merge conflict in [file]"
git push origin main
\\\

---

## 🔄 COMMON SCENARIOS

### **Scenario 1: Draugas pakeitė kodą**

**Tu matai:**
\\\powershell
PS C:\Users\TavoVardas\RadanarasSystem> git pull origin main
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
From https://github.com/saimondaslukosius/RadanarasSystem
   1234abc..5678def  main -> origin/main
Updating 1234abc..5678def
Fast-forward
 frontend/src/App.jsx | 10 +++++++---
 1 file changed, 7 insertions(+), 3 deletions(-)
\\\

**Kas nutiko:** Draugas pakeitė \App.jsx\, tu gavai jo pakeitimus!

### **Scenario 2: Tu ir draugas edit'inote skirtingus failus**

\\\powershell
# Tu edit'inai clients.json
# Draugas edit'ino carriers.json

# Tu commit'ini
git add .
git commit -m "Update clients"
git push

# Draugas commit'ina
git pull  # Gauna tavo pakeitimus
git add .
git commit -m "Update carriers"
git push  # Įkelia savo
\\\

**Result:** ✅ Automatic merge! Nėra conflict!

### **Scenario 3: Abu edit'inote TĄ PATĮ failą (bet skirtingas vietas)**

\\\powershell
# App.jsx line 10: Tu pridėjai
# App.jsx line 50: Draugas pridėjo

# Git automatically merges! ✅
\\\

**Result:** ✅ Automatic merge! Nėra conflict!

### **Scenario 4: Abu edit'inote TĄ PAČIĄ vietą**

\\\powershell
# App.jsx line 10: Tu pakeitei į A
# App.jsx line 10: Draugas pakeitė į B

# Git cannot decide! ❌
# MERGE CONFLICT!
\\\

**Result:** ❌ Manual resolution needed (see above)

---

## 🎯 BEST PRACTICES

### **DO ✅**

1. **Pull before starting work:**
   \\\powershell
   git pull origin main
   \\\

2. **Commit often with clear messages:**
   \\\powershell
   git commit -m "Add dashboard statistics card"
   \\\

3. **Test locally before pushing:**
   - Run backend
   - Run frontend
   - Check in browser
   - No errors? → Push!

4. **Communicate:**
   - "I'm working on clients page"
   - "Don't touch App.jsx for 2 hours"
   - "Pushed big changes, test before continuing"

5. **Push at end of day:**
   \\\powershell
   git push origin main
   \\\

### **DON'T ❌**

1. **Don't work on same files simultaneously**
   - Coordinate who works on what
   - Avoid conflicts

2. **Don't commit broken code:**
   - Always test before commit
   - Backend should run
   - Frontend should build

3. **Don't commit sensitive data:**
   - No passwords in code
   - No API keys
   - Use .env files (already gitignored)

4. **Don't edit production server files directly:**
   - Always work locally
   - Push to GitHub
   - Deploy from GitHub

5. **Don't use \git add .\ blindly:**
   - Check \git status\ first
   - Know what you're committing

---

## 📚 USEFUL GIT COMMANDS

\\\powershell
# Check status
git status

# See what changed
git diff

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes (CAREFUL!)
git reset --hard HEAD

# Restore single file
git checkout HEAD -- path/to/file

# Create branch (for big features)
git checkout -b feature-name

# Switch back to main
git checkout main

# Merge branch into main
git merge feature-name

# Delete branch
git branch -d feature-name
\\\

---

## 🐛 TROUBLESHOOTING

### **Problem: \git push\ fails - "Updates were rejected"**

**Solution:**
\\\powershell
# Someone pushed before you
git pull origin main
# Resolve any conflicts
git push origin main
\\\

### **Problem: \
pm install\ fails**

**Solution:**
\\\powershell
# Delete node_modules and reinstall
rm -r node_modules
npm install

# Or use clean install
npm ci
\\\

### **Problem: Backend won't start - "Port 3001 in use"**

**Solution:**
\\\powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (replace PID with actual number)
taskkill /PID [number] /F

# Or change port in backend/.env
PORT=3002
\\\

### **Problem: Frontend shows old version after pull**

**Solution:**
\\\powershell
# Hard refresh browser
Ctrl + Shift + R

# Or restart dev server
# Stop (Ctrl+C) and restart: npm run dev
\\\

### **Problem: Git asks for password every time**

**Solution:**
\\\powershell
# Use credential manager
git config --global credential.helper manager

# Or use GitHub CLI
gh auth login
\\\

---

## 📞 WHEN TO ASK FOR HELP

### **Ask Saimondas when:**
- ❓ Git merge conflict nežinai kaip išspręsti
- ❓ Production deployment questions
- ❓ Database/data structure changes
- ❓ Major architectural decisions

### **Ask Claude (AI) when:**
- ❓ Code examples needed
- ❓ Bug fixing help
- ❓ Git command questions
- ❓ JavaScript/React questions

### **Google when:**
- ❓ General programming questions
- ❓ npm package documentation
- ❓ Error messages

---

## 🎓 LEARNING RESOURCES

### **Git:**
- https://git-scm.com/book/en/v2
- https://learngitbranching.js.org/

### **React:**
- https://react.dev/
- https://react.dev/learn

### **Node.js:**
- https://nodejs.org/en/docs/

### **GitHub:**
- https://docs.github.com/en

---

## ✅ CHECKLIST (Draugas naudoja)

**Prieš pradedant dirbti:**
- [ ] Node.js installed
- [ ] Git installed
- [ ] GitHub account created
- [ ] Added as collaborator (by Saimondas)
- [ ] Repository cloned
- [ ] Dependencies installed (npm install)
- [ ] Backend runs locally
- [ ] Frontend runs locally
- [ ] Can see app in browser (localhost:5173)

**Kasdieninis workflow:**
- [ ] Morning: \git pull origin main\
- [ ] Work: Edit code
- [ ] Test: Run backend + frontend
- [ ] Commit: \git add . && git commit -m "message"\
- [ ] Push: \git push origin main\
- [ ] Evening: \git pull origin main\

**Jei problemos:**
- [ ] Check git status
- [ ] Read error messages
- [ ] Try Google
- [ ] Ask teammate
- [ ] Ask Claude

---

## 🚀 READY TO START!

**Tu dabar turi:**
- ✅ Dev environment setup
- ✅ Access to repository
- ✅ Local development running
- ✅ Knowledge of git workflow
- ✅ Troubleshooting guide

**Happy coding! 🎉**

---

**Last updated:** 2026-04-15  
**Maintainer:** Saimondas Lukosius  
**Project:** RadanarasSystem
