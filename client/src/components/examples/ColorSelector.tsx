import ColorSelector from '../ColorSelector';
import { useState } from 'react';

const mockColors = [
  { name: 'branco', value: 'white', hex: '#ffffff' },
  { name: 'preto', value: 'black', hex: '#000000' },
  { name: 'cinza claro', value: 'light-gray', hex: '#f5f5f5' },
  { name: 'bege', value: 'beige', hex: '#f5f5dc' }
];

export default function ColorSelectorExample() {
  const [selectedColor, setSelectedColor] = useState('white');
  
  return (
    <div className="p-8 max-w-md">
      <ColorSelector
        colors={mockColors}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />
    </div>
  );
}