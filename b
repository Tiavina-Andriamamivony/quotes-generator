# Supprimer tous les fichiers générés
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force src -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue

# Réinstaller @prisma/client
npm uninstall @prisma/client
npm install @prisma/client --legacy-peer-deps

# Générer Prisma
npx prisma generate

# Vérifier que le dossier a été créé
Test-Path node_modules\.prisma\client