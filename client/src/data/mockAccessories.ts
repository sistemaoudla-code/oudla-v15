import canecaImg from "@assets/generated_images/luxury_faith_mug_product_bb4e381c.png";
import canecaImgAlt from "@assets/generated_images/luxury_faith_mug_lifestyle_ea3a4712.png";
import ecobagImg from "@assets/generated_images/luxury_ecobag_product_1bcc5814.png";
import ecobagImgAlt from "@assets/generated_images/luxury_ecobag_lifestyle_46b98401.png";
import gorroImg from "@assets/generated_images/luxury_beanie_product_69838035.png";
import gorroImgAlt from "@assets/generated_images/luxury_beanie_lifestyle_31d6ed5f.png";
import boneImg from "@assets/generated_images/luxury_cap_product_5af45e6d.png";
import boneImgAlt from "@assets/generated_images/luxury_cap_lifestyle_a93afc16.png";

export interface Accessory {
  id: string;
  name: string;
  price: number;
  images: string[];
  description: string;
  category: string;
}

export const mockAccessories: Accessory[] = [
  {
    id: "mug",
    name: "caneca faith",
    price: 45.00,
    images: [canecaImg, canecaImgAlt],
    description: "caneca de cerâmica com design minimalista cristão. perfeita para o seu café da manhã ou momento de reflexão.",
    category: "acessórios"
  },
  {
    id: "ecobag",
    name: "ecobag essentials",
    price: 35.00,
    images: [ecobagImg, ecobagImgAlt],
    description: "ecobag sustentável com estampa sutil de fé. ideal para carregar seus pertences com estilo e propósito.",
    category: "acessórios"
  },
  {
    id: "beanie",
    name: "gorro comfort",
    price: 55.00,
    images: [gorroImg, gorroImgAlt],
    description: "gorro de tricô com bordado discreto. mantém você aquecido enquanto expressa sua fé com elegância.",
    category: "acessórios"
  },
  {
    id: "cap",
    name: "boné classic",
    price: 65.00,
    images: [boneImg, boneImgAlt],
    description: "boné com bordado minimalista cristão. proteção e estilo para o dia a dia urbano.",
    category: "acessórios"
  },
];
