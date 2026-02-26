#!/bin/bash

# Script de Deploy OUDLA
# Este script puxa a versão mais recente do GitHub e atualiza o servidor.

PROJECT_DIR="/home/rafael/oudla"
REPO_URL="https://github.com/sistemaoudla-code/oudla-v14.git"

echo "🚀 Iniciando atualização do OUDLA..."

# Garante que a pasta existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 Criando pasta do projeto..."
    mkdir -p "$PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR" || exit

# Puxa as novidades do GitHub (sobrescrevendo mudanças locais se houver)
echo "📥 Puxando novidades do GitHub..."
git fetch origin main
git reset --hard origin/main

# Mantém o .env seguro
if [ ! -f ".env" ]; then
    echo "⚠️ Arquivo .env não encontrado! Certifique-se de criá-lo em $PROJECT_DIR/.env"
fi

# Instala e Builda
echo "📦 Instalando dependências..."
npm install

echo "🛠️ Gerando build de produção..."
npm run build

# Reinicia no PM2
echo "🔄 Reiniciando processo no PM2..."
pm2 restart oudla --update-env || pm2 start dist/index.js --name "oudla"

pm2 save

echo "✅ Atualização concluída com sucesso!"
pm2 status oudla
