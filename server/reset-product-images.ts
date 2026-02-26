import { storage } from "./storage";
import { generate } from "openai/core";

interface ProductColor {
  name: string;
  hex: string;
}

const CORE_COLORS: ProductColor[] = [
  { name: "Preto", hex: "#000000" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Vermelho", hex: "#DC143C" },
  { name: "Azul Marinho", hex: "#1F3C88" },
];

async function resetProductImages() {
  console.log("🚀 Iniciando reset de imagens dos produtos...\n");

  // 1. Buscar todos os produtos ativos
  const products = await storage.getProducts();
  const activeProducts = products.filter(p => p.isActive);
  
  console.log(`✅ Encontrados ${activeProducts.length} produtos ativos\n`);

  for (const product of activeProducts) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Produto: ${product.name} (${product.id})`);
    console.log(`${"=".repeat(60)}\n`);

    // 2. Deletar todas as imagens existentes do produto
    const existingImages = await storage.getProductImages(product.id);
    console.log(`🗑️  Deletando ${existingImages.length} imagens antigas...`);
    
    for (const image of existingImages) {
      await storage.deleteProductImage(image.id);
    }
    console.log(`✅ Imagens antigas deletadas`);

    // 3. Atualizar cores do produto
    console.log(`\n🎨 Atualizando cores do produto...`);
    await storage.updateProduct(product.id, {
      colors: JSON.stringify(CORE_COLORS)
    });
    console.log(`✅ Cores atualizadas: ${CORE_COLORS.map(c => c.name).join(", ")}`);

    console.log(`\n📸 Geração de imagens concluída para ${product.name}\n`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 Reset completo! Todas as imagens foram resetadas.");
  console.log(`${"=".repeat(60)}\n`);
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  resetProductImages()
    .then(() => {
      console.log("✅ Script concluído com sucesso!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erro ao executar script:", error);
      process.exit(1);
    });
}

export { resetProductImages };
