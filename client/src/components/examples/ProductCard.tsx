import ProductCard from '../ProductCard';
import tshirtImage1 from '@assets/generated_images/camiseta_cristã_luxuosa_modelo_jovem_b1688629.png';
import tshirtImage2 from '@assets/generated_images/camiseta_preta_luxo_cruz_dourada_4ac95e78.png';

export default function ProductCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ProductCard
        id="1"
        name="camiseta essencial cruz"
        price={129.90}
        originalPrice={179.90}
        images={[tshirtImage1, tshirtImage2]}
        colors={["#ffffff", "#000000", "#f5f5f5"]}
        sizes={["P", "M", "G", "GG"]}
        isNew={true}
        isFavorite={false}
        onFavoriteToggle={(id) => console.log('favorite toggled:', id)}
        onQuickAdd={(id) => console.log('quick add:', id)}
      />
    </div>
  );
}