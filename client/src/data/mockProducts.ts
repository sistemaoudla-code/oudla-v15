// Produto 1: Camiseta Cruz - 4 cores
import product1White from '@assets/generated_images/white_cross_tshirt_product_20abe436.png';
import product1WhiteAlt from '@assets/generated_images/white_cross_tshirt_lifestyle_0bd10795.png';
import product1Black from '@assets/generated_images/black_cross_tshirt_product_45f7b071.png';
import product1BlackAlt from '@assets/generated_images/black_cross_tshirt_lifestyle_45cae89e.png';
import product1Navy from '@assets/generated_images/navy_cross_tshirt_product_8013ae3c.png';
import product1NavyAlt from '@assets/generated_images/navy_cross_tshirt_lifestyle_f13bd58d.png';
import product1Gray from '@assets/generated_images/gray_cross_tshirt_product_08896eb3.png';
import product1GrayAlt from '@assets/generated_images/gray_cross_tshirt_lifestyle_78bee5b5.png';

// Produto 2: Camiseta Fé - 4 cores
import product2White from '@assets/generated_images/white_faith_tshirt_product_f2f1c616.png';
import product2WhiteAlt from '@assets/generated_images/white_faith_tshirt_lifestyle_f729b011.png';
import product2Black from '@assets/generated_images/black_faith_tshirt_product_8decd0c5.png';
import product2BlackAlt from '@assets/generated_images/black_faith_tshirt_lifestyle_81a679e9.png';
import product2Navy from '@assets/generated_images/navy_faith_tshirt_product_e808e3d2.png';
import product2NavyAlt from '@assets/generated_images/navy_faith_tshirt_lifestyle_5dad04e7.png';
import product2Gray from '@assets/generated_images/gray_faith_tshirt_product_98c9212a.png';
import product2GrayAlt from '@assets/generated_images/gray_faith_tshirt_lifestyle_db820185.png';

// Produto 3: Camiseta Minimalista - 4 cores
import product3White from '@assets/generated_images/white_minimalist_tshirt_product_a5698a09.png';
import product3WhiteAlt from '@assets/generated_images/white_minimalist_tshirt_lifestyle_5314c2ad.png';
import product3Black from '@assets/generated_images/black_minimalist_tshirt_product_df23d670.png';
import product3BlackAlt from '@assets/generated_images/black_minimalist_tshirt_lifestyle_d4d7dd73.png';
import product3Navy from '@assets/generated_images/navy_minimalist_tshirt_product_9d8c701c.png';
import product3NavyAlt from '@assets/generated_images/navy_minimalist_tshirt_lifestyle_8a1fe5f1.png';
import product3Gray from '@assets/generated_images/gray_minimalist_tshirt_product_66f381b9.png';
import product3GrayAlt from '@assets/generated_images/gray_minimalist_tshirt_lifestyle_6d4865bd.png';

// Produto 4: Camiseta Comunidade - 4 cores
import product4White from '@assets/generated_images/white_community_tshirt_product_fd392c04.png';
import product4WhiteAlt from '@assets/generated_images/white_community_tshirt_lifestyle_314d92d4.png';
import product4Black from '@assets/generated_images/black_community_tshirt_product_6a7884e8.png';
import product4BlackAlt from '@assets/generated_images/black_community_tshirt_lifestyle_ced62a8a.png';
import product4Navy from '@assets/generated_images/navy_community_tshirt_product_dd993a4d.png';
import product4NavyAlt from '@assets/generated_images/navy_community_tshirt_lifestyle_fda02c64.png';
import product4Gray from '@assets/generated_images/gray_community_tshirt_product_caed87b4.png';
import product4GrayAlt from '@assets/generated_images/gray_community_tshirt_lifestyle_0c2a7140.png';

// Produto 5: Camiseta Esperança - 4 cores
import product5White from '@assets/generated_images/white_hope_tshirt_product_43244f93.png';
import product5WhiteAlt from '@assets/generated_images/white_hope_tshirt_lifestyle_42d85f64.png';
import product5Black from '@assets/generated_images/black_hope_tshirt_product_00747f94.png';
import product5BlackAlt from '@assets/generated_images/black_hope_tshirt_lifestyle_3a5bf592.png';
import product5Navy from '@assets/generated_images/navy_hope_tshirt_product_e891d352.png';
import product5NavyAlt from '@assets/generated_images/navy_hope_tshirt_lifestyle_a026bed0.png';
import product5Gray from '@assets/generated_images/gray_hope_tshirt_product_c13ed3f2.png';
import product5GrayAlt from '@assets/generated_images/gray_hope_tshirt_lifestyle_3c4ed1a4.png';

// Produto 6: Camiseta Amor - 4 cores
import product6White from '@assets/generated_images/white_love_tshirt_product_1a2d5fe8.png';
import product6WhiteAlt from '@assets/generated_images/white_love_tshirt_lifestyle_56364376.png';
import product6Black from '@assets/generated_images/black_love_tshirt_product_95693831.png';
import product6BlackAlt from '@assets/generated_images/black_love_tshirt_lifestyle_ce5e8f37.png';
import product6Navy from '@assets/generated_images/navy_love_tshirt_product_a753b9dd.png';
import product6NavyAlt from '@assets/generated_images/navy_love_tshirt_lifestyle_06576cb5.png';
import product6Gray from '@assets/generated_images/gray_love_tshirt_product_8eb3f1b8.png';
import product6GrayAlt from '@assets/generated_images/gray_love_tshirt_lifestyle_57fbdeb0.png';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  colors: string[];
  sizes: string[];
  isNew: boolean;
  category?: string;
  colorImages?: {
    [colorHex: string]: string[];
  };
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "camiseta essencial cruz",
    price: 129.90,
    originalPrice: 179.90,
    images: [product1White, product1WhiteAlt],
    colors: ["#ffffff", "#000000", "#1a2742", "#9ca3af"],
    sizes: ["P", "M", "G", "GG"],
    isNew: true,
    category: "camisetas",
    colorImages: {
      "#ffffff": [product1White, product1WhiteAlt],
      "#000000": [product1Black, product1BlackAlt],
      "#1a2742": [product1Navy, product1NavyAlt],
      "#9ca3af": [product1Gray, product1GrayAlt]
    }
  },
  {
    id: "2", 
    name: "camiseta premium fé",
    price: 149.90,
    images: [product2White, product2WhiteAlt],
    colors: ["#ffffff", "#000000", "#1a2742", "#9ca3af"],
    sizes: ["P", "M", "G", "GG", "XG"],
    isNew: false,
    category: "camisetas",
    colorImages: {
      "#ffffff": [product2White, product2WhiteAlt],
      "#000000": [product2Black, product2BlackAlt],
      "#1a2742": [product2Navy, product2NavyAlt],
      "#9ca3af": [product2Gray, product2GrayAlt]
    }
  },
  {
    id: "3",
    name: "camiseta minimalista",
    price: 119.90,
    originalPrice: 159.90,
    images: [product3White, product3WhiteAlt],
    colors: ["#ffffff", "#000000", "#1a2742", "#9ca3af"],
    sizes: ["P", "M", "G"],
    isNew: true,
    category: "camisetas",
    colorImages: {
      "#ffffff": [product3White, product3WhiteAlt],
      "#000000": [product3Black, product3BlackAlt],
      "#1a2742": [product3Navy, product3NavyAlt],
      "#9ca3af": [product3Gray, product3GrayAlt]
    }
  },
  {
    id: "4",
    name: "camiseta comunidade",
    price: 139.90,
    images: [product4White, product4WhiteAlt],
    colors: ["#ffffff", "#000000", "#1a2742", "#9ca3af"],
    sizes: ["M", "G", "GG", "XG"],
    isNew: false,
    category: "camisetas",
    colorImages: {
      "#ffffff": [product4White, product4WhiteAlt],
      "#000000": [product4Black, product4BlackAlt],
      "#1a2742": [product4Navy, product4NavyAlt],
      "#9ca3af": [product4Gray, product4GrayAlt]
    }
  },
  {
    id: "5",
    name: "camiseta esperança",
    price: 134.90,
    originalPrice: 169.90,
    images: [product5White, product5WhiteAlt],
    colors: ["#ffffff", "#000000", "#1a2742", "#9ca3af"],
    sizes: ["P", "M", "G", "GG"],
    isNew: true,
    category: "camisetas",
    colorImages: {
      "#ffffff": [product5White, product5WhiteAlt],
      "#000000": [product5Black, product5BlackAlt],
      "#1a2742": [product5Navy, product5NavyAlt],
      "#9ca3af": [product5Gray, product5GrayAlt]
    }
  },
  {
    id: "6",
    name: "camiseta amor",
    price: 144.90,
    images: [product6White, product6WhiteAlt],
    colors: ["#ffffff", "#000000", "#1a2742", "#9ca3af"],
    sizes: ["P", "M", "G", "GG", "XG"],
    isNew: false,
    category: "camisetas",
    colorImages: {
      "#ffffff": [product6White, product6WhiteAlt],
      "#000000": [product6Black, product6BlackAlt],
      "#1a2742": [product6Navy, product6NavyAlt],
      "#9ca3af": [product6Gray, product6GrayAlt]
    }
  }
];
