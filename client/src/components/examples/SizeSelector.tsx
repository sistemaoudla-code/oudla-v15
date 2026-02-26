import SizeSelector from '../SizeSelector';
import { useState } from 'react';

const mockSizes = [
  { value: 'P', label: 'P', available: true, measurements: { chest: '92cm', length: '66cm' } },
  { value: 'M', label: 'M', available: true, measurements: { chest: '98cm', length: '68cm' } },
  { value: 'G', label: 'G', available: true, measurements: { chest: '104cm', length: '70cm' } },
  { value: 'GG', label: 'GG', available: false, measurements: { chest: '110cm', length: '72cm' } },
  { value: 'XG', label: 'XG', available: true, measurements: { chest: '116cm', length: '74cm' } }
];

export default function SizeSelectorExample() {
  const [selectedSize, setSelectedSize] = useState('M');
  
  return (
    <div className="p-8 max-w-md">
      <SizeSelector
        sizes={mockSizes}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
        onSizeGuide={() => console.log('guia de medidas clicado')}
      />
    </div>
  );
}