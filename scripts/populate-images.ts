import { storage } from "../server/storage";

const COLORS = [
  { name: "Preto", hex: "#000000" },
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Vermelho", hex: "#DC143C" },
  { name: "Azul Marinho", hex: "#1F3C88" },
];

const IMAGE_MAP = {
  "Preto": {
    product: "/attached_assets/generated_images/black_tshirt_product_photo_2330bf67.png",
    lifestyle: "/attached_assets/generated_images/black_tshirt_lifestyle_photo_62971e72.png"
  },
  "Branco": {
    product: "/attached_assets/generated_images/white_tshirt_product_photo_8fd8990e.png",
    lifestyle: "/attached_assets/generated_images/white_tshirt_lifestyle_photo_33503057.png"
  },
  "Vermelho": {
    product: "/attached_assets/generated_images/red_tshirt_product_photo_8c7cd236.png",
    lifestyle: "/attached_assets/generated_images/red_tshirt_lifestyle_photo_c869c162.png"
  },
  "Azul Marinho": {
    product: "/attached_assets/generated_images/navy_blue_tshirt_photo_c1f89890.png",
    lifestyle: "/attached_assets/generated_images/navy_tshirt_lifestyle_photo_5201e8bf.png"
  }
};

const PRESENTATION_IMAGES = [
  "/attached_assets/generated_images/black_tshirt_presentation_b9645a49.png",
  "/attached_assets/generated_images/tshirt_fabric_detail_8bf3ba12.png"
];

async function populateImages() {
  console.log("🚀 Iniciando população de imagens...\n");

  const products = await storage.getProducts();
  const tshirts = products.filter(p => p.productType === "tshirt" && p.isActive);

  console.log(`Encontrados ${tshirts.length} produtos de camiseta ativos\n`);

  for (const product of tshirts.slice(0, 3)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Processando: ${product.name}`);
    console.log(`${"=".repeat(60)}\n`);

    // 1. Deletar imagens antigas
    const existingImages = await storage.getProductImages(product.id);
    for (const img of existingImages) {
      await storage.deleteProductImage(img.id);
    }
    console.log(`✅ Deletadas ${existingImages.length} imagens antigas`);

    // 2. Atualizar cores
    await storage.updateProduct(product.id, {
      colors: JSON.stringify(COLORS)
    });
    console.log(`✅ Cores atualizadas`);

    // 3. Adicionar imagens de presentation
    for (let i = 0; i < PRESENTATION_IMAGES.length; i++) {
      await storage.addProductImage({
        productId: product.id,
        imageUrl: PRESENTATION_IMAGES[i],
        altText: `${product.name} - apresentação ${i + 1}`,
        imageType: "presentation",
        color: null,
        sortOrder: i
      });
    }
    console.log(`✅ Adicionadas ${PRESENTATION_IMAGES.length} imagens de apresentação`);

    // 4. Adicionar imagens de carousel para cada cor
    let colorIndex = 0;
    for (const color of COLORS) {
      const images = IMAGE_MAP[color.name as keyof typeof IMAGE_MAP];
      
      await storage.addProductImage({
        productId: product.id,
        imageUrl: images.product,
        altText: `${product.name} ${color.name} - produto`,
        imageType: "carousel",
        color: color.name,
        sortOrder: colorIndex * 2
      });

      await storage.addProductImage({
        productId: product.id,
        imageUrl: images.lifestyle,
        altText: `${product.name} ${color.name} - lifestyle`,
        imageType: "carousel",
        color: color.name,
        sortOrder: colorIndex * 2 + 1
      });

      colorIndex++;
    }
    console.log(`✅ Adicionadas ${COLORS.length * 2} imagens de carousel (${COLORS.length} cores)`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 População completa!");
  console.log(`${"=".repeat(60)}\n`);
}

populateImages().catch(console.error);
