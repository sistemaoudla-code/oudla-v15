import ShippingCalculator from '../ShippingCalculator';

export default function ShippingCalculatorExample() {
  return (
    <div className="p-8 max-w-md">
      <ShippingCalculator
        onShippingSelect={(option) => console.log('opção selecionada:', option)}
      />
    </div>
  );
}