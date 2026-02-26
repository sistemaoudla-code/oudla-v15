import { storage } from "../server/storage";

const COLORS = [
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Preto", hex: "#000000" },
  { name: "Azul Marinho", hex: "#1a2742" },
  { name: "Cinza", hex: "#9ca3af" },
];

const PRODUCTS_DATA = [
  {
    name: "camiseta essencial cruz",
    description: "Camiseta com design minimalista de cruz. Perfeita para o dia a dia com estilo e significado.",
    price: "129.90",
    originalPrice: "179.90",
    isNew: true,
    images: {
      "Branco": {
        product: "/attached_assets/generated_images/white_cross_tshirt_product_20abe436.png",
        lifestyle: "/attached_assets/generated_images/white_cross_tshirt_lifestyle_0bd10795.png"
      },
      "Preto": {
        product: "/attached_assets/generated_images/black_cross_tshirt_product_45f7b071.png",
        lifestyle: "/attached_assets/generated_images/black_cross_tshirt_lifestyle_45cae89e.png"
      },
      "Azul Marinho": {
        product: "/attached_assets/generated_images/navy_cross_tshirt_product_8013ae3c.png",
        lifestyle: "/attached_assets/generated_images/navy_cross_tshirt_lifestyle_f13bd58d.png"
      },
      "Cinza": {
        product: "/attached_assets/generated_images/gray_cross_tshirt_product_08896eb3.png",
        lifestyle: "/attached_assets/generated_images/gray_cross_tshirt_lifestyle_78bee5b5.png"
      }
    }
  },
  {
    name: "camiseta premium fé",
    description: "Camiseta premium com design elegante de fé. Qualidade superior para quem valoriza o melhor.",
    price: "149.90",
    isNew: false,
    images: {
      "Branco": {
        product: "/attached_assets/generated_images/white_faith_tshirt_product_f2f1c616.png",
        lifestyle: "/attached_assets/generated_images/white_faith_tshirt_lifestyle_f729b011.png"
      },
      "Preto": {
        product: "/attached_assets/generated_images/black_faith_tshirt_product_8decd0c5.png",
        lifestyle: "/attached_assets/generated_images/black_faith_tshirt_lifestyle_81a679e9.png"
      },
      "Azul Marinho": {
        product: "/attached_assets/generated_images/navy_faith_tshirt_product_e808e3d2.png",
        lifestyle: "/attached_assets/generated_images/navy_faith_tshirt_lifestyle_5dad04e7.png"
      },
      "Cinza": {
        product: "/attached_assets/generated_images/gray_faith_tshirt_product_98c9212a.png",
        lifestyle: "/attached_assets/generated_images/gray_faith_tshirt_lifestyle_db820185.png"
      }
    }
  },
  {
    name: "camiseta minimalista",
    description: "Design minimalista e clean. Para quem aprecia a simplicidade com estilo.",
    price: "119.90",
    originalPrice: "159.90",
    isNew: true,
    images: {
      "Branco": {
        product: "/attached_assets/generated_images/white_minimalist_tshirt_product_a5698a09.png",
        lifestyle: "/attached_assets/generated_images/white_minimalist_tshirt_lifestyle_5314c2ad.png"
      },
      "Preto": {
        product: "/attached_assets/generated_images/black_minimalist_tshirt_product_df23d670.png",
        lifestyle: "/attached_assets/generated_images/black_minimalist_tshirt_lifestyle_d4d7dd73.png"
      },
      "Azul Marinho": {
        product: "/attached_assets/generated_images/navy_minimalist_tshirt_product_9d8c701c.png",
        lifestyle: "/attached_assets/generated_images/navy_minimalist_tshirt_lifestyle_8a1fe5f1.png"
      },
      "Cinza": {
        product: "/attached_assets/generated_images/gray_minimalist_tshirt_product_66f381b9.png",
        lifestyle: "/attached_assets/generated_images/gray_minimalist_tshirt_lifestyle_6d4865bd.png"
      }
    }
  },
  {
    name: "camiseta comunidade",
    description: "Camiseta que celebra a união e comunidade. Perfeita para grupos e eventos.",
    price: "139.90",
    isNew: false,
    images: {
      "Branco": {
        product: "/attached_assets/generated_images/white_community_tshirt_product_fd392c04.png",
        lifestyle: "/attached_assets/generated_images/white_community_tshirt_lifestyle_314d92d4.png"
      },
      "Preto": {
        product: "/attached_assets/generated_images/black_community_tshirt_product_6a7884e8.png",
        lifestyle: "/attached_assets/generated_images/black_community_tshirt_lifestyle_ced62a8a.png"
      },
      "Azul Marinho": {
        product: "/attached_assets/generated_images/navy_community_tshirt_product_dd993a4d.png",
        lifestyle: "/attached_assets/generated_images/navy_community_tshirt_lifestyle_fda02c64.png"
      },
      "Cinza": {
        product: "/attached_assets/generated_images/gray_community_tshirt_product_caed87b4.png",
        lifestyle: "/attached_assets/generated_images/gray_community_tshirt_lifestyle_0c2a7140.png"
      }
    }
  },
  {
    name: "camiseta esperança",
    description: "Mensagem inspiradora de esperança. Vista-se com propósito e significado.",
    price: "134.90",
    originalPrice: "169.90",
    isNew: true,
    images: {
      "Branco": {
        product: "/attached_assets/generated_images/white_hope_tshirt_product_43244f93.png",
        lifestyle: "/attached_assets/generated_images/white_hope_tshirt_lifestyle_42d85f64.png"
      },
      "Preto": {
        product: "/attached_assets/generated_images/black_hope_tshirt_product_00747f94.png",
        lifestyle: "/attached_assets/generated_images/black_hope_tshirt_lifestyle_3a5bf592.png"
      },
      "Azul Marinho": {
        product: "/attached_assets/generated_images/navy_hope_tshirt_product_e891d352.png",
        lifestyle: "/attached_assets/generated_images/navy_hope_tshirt_lifestyle_a026bed0.png"
      },
      "Cinza": {
        product: "/attached_assets/generated_images/gray_hope_tshirt_product_c13ed3f2.png",
        lifestyle: "/attached_assets/generated_images/gray_hope_tshirt_lifestyle_3c4ed1a4.png"
      }
    }
  },
  {
    name: "camiseta amor",
    description: "Design elegante com tema de amor. Ideal para casais e momentos especiais.",
    price: "144.90",
    isNew: false,
    images: {
      "Branco": {
        product: "/attached_assets/generated_images/white_love_tshirt_product_1a2d5fe8.png",
        lifestyle: "/attached_assets/generated_images/white_love_tshirt_lifestyle_56364376.png"
      },
      "Preto": {
        product: "/attached_assets/generated_images/black_love_tshirt_product_95693831.png",
        lifestyle: "/attached_assets/generated_images/black_love_tshirt_lifestyle_ce5e8f37.png"
      },
      "Azul Marinho": {
        product: "/attached_assets/generated_images/navy_love_tshirt_product_a753b9dd.png",
        lifestyle: "/attached_assets/generated_images/navy_love_tshirt_lifestyle_06576cb5.png"
      },
      "Cinza": {
        product: "/attached_assets/generated_images/gray_love_tshirt_product_8eb3f1b8.png",
        lifestyle: "/attached_assets/generated_images/gray_love_tshirt_lifestyle_57fbdeb0.png"
      }
    }
  }
];

const ACCESSORIES_DATA = [
  {
    name: "caneca faith",
    description: "Caneca de cerâmica premium com design minimalista. Perfeita para momentos de reflexão.",
    price: "45.00",
    category: "caneca",
    images: [
      "/attached_assets/generated_images/luxury_faith_mug_product_bb4e381c.png",
      "/attached_assets/generated_images/luxury_faith_mug_lifestyle_ea3a4712.png"
    ]
  },
  {
    name: "ecobag essentials",
    description: "Ecobag sustentável com design elegante. Estilo e consciência ambiental.",
    price: "35.00",
    category: "ecobag",
    images: [
      "/attached_assets/generated_images/luxury_ecobag_product_1bcc5814.png",
      "/attached_assets/generated_images/luxury_ecobag_lifestyle_46b98401.png"
    ]
  },
  {
    name: "gorro comfort",
    description: "Gorro de tricô premium com bordado discreto. Elegância e conforto para o inverno.",
    price: "55.00",
    category: "gorro",
    images: [
      "/attached_assets/generated_images/luxury_beanie_product_69838035.png",
      "/attached_assets/generated_images/luxury_beanie_lifestyle_31d6ed5f.png"
    ]
  },
  {
    name: "boné classic",
    description: "Boné premium com bordado minimalista. Proteção e estilo urbano.",
    price: "65.00",
    category: "boné",
    images: [
      "/attached_assets/generated_images/luxury_cap_product_5af45e6d.png",
      "/attached_assets/generated_images/luxury_cap_lifestyle_a93afc16.png"
    ]
  }
];

async function populateNewProducts() {
  console.log("🚀 Iniciando população de produtos com novas imagens...\n");

  const existingProducts = await storage.getProducts();
  console.log(`Encontrados ${existingProducts.length} produtos existentes\n`);

  // Delete all existing products
  for (const product of existingProducts) {
    console.log(`🗑️  Deletando produto antigo: ${product.name}`);
    const images = await storage.getProductImages(product.id);
    for (const img of images) {
      await storage.deleteProductImage(img.id);
    }
    // Note: Product will be cascade deleted when images are removed
  }

  console.log("\n📦 Criando novos produtos...\n");

  // Create T-shirt products
  for (let i = 0; i < PRODUCTS_DATA.length; i++) {
    const productData = PRODUCTS_DATA[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Criando: ${productData.name}`);
    console.log(`${"=".repeat(60)}\n`);

    const product = await storage.createProduct({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      originalPrice: productData.originalPrice,
      productType: "tshirt",
      colors: JSON.stringify(COLORS),
      sizes: ["P", "M", "G", "GG"],
      isNew: productData.isNew,
      isActive: true,
      displayOrder: i,
      customizableFront: false,
      customizableBack: false,
      fabricTech: ["não encolhe", "seca rápido"],
      fabricDescription: "Tecido premium com alta durabilidade",
      careInstructions: "Lavar à máquina em água fria. Não usar alvejante.",
      rating: "4.5",
      reviewsCount: 0
    });

    console.log(`✅ Produto criado: ${product.id}`);

    // Add presentation images (first color - Branco)
    const presentationImages = productData.images["Branco"];
    await storage.addProductImage({
      productId: product.id,
      imageUrl: presentationImages.product,
      altText: `${product.name} - apresentação 1`,
      imageType: "presentation",
      color: null,
      sortOrder: 0
    });

    await storage.addProductImage({
      productId: product.id,
      imageUrl: presentationImages.lifestyle,
      altText: `${product.name} - apresentação 2`,
      imageType: "presentation",
      color: null,
      sortOrder: 1
    });

    console.log(`✅ Adicionadas 2 imagens de apresentação`);

    // Add carousel images for each color
    let colorIndex = 0;
    for (const color of COLORS) {
      const images = productData.images[color.name];
      
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

  // Create accessory products
  console.log("\n🎒 Criando acessórios...\n");

  for (let i = 0; i < ACCESSORIES_DATA.length; i++) {
    const accessoryData = ACCESSORIES_DATA[i];
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🎒 Criando: ${accessoryData.name}`);
    console.log(`${"=".repeat(60)}\n`);

    const product = await storage.createProduct({
      name: accessoryData.name,
      description: accessoryData.description,
      price: accessoryData.price,
      productType: "accessory",
      category: accessoryData.category,
      isNew: false,
      isActive: true,
      displayOrder: 100 + i,
      rating: "4.5",
      reviewsCount: 0
    });

    console.log(`✅ Acessório criado: ${product.id}`);

    // Add presentation images
    for (let j = 0; j < accessoryData.images.length; j++) {
      await storage.addProductImage({
        productId: product.id,
        imageUrl: accessoryData.images[j],
        altText: `${product.name} - imagem ${j + 1}`,
        imageType: "presentation",
        color: null,
        sortOrder: j
      });
    }

    console.log(`✅ Adicionadas ${accessoryData.images.length} imagens`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 População completa!");
  console.log(`   - ${PRODUCTS_DATA.length} camisetas criadas`);
  console.log(`   - ${ACCESSORIES_DATA.length} acessórios criados`);
  console.log(`${"=".repeat(60)}\n`);
}

populateNewProducts().catch(console.error).finally(() => process.exit());
