export interface VirtualBackground {
  id: string;
  name: string;
  type: 'none' | 'blur' | 'preset' | 'custom';
  url?: string;
  cssStyle?: string;
}

export const PRESET_BACKGROUNDS: VirtualBackground[] = [
  { id: 'none', name: 'Sin fondo', type: 'none' },
  { id: 'blur', name: 'Desenfocar', type: 'blur' },
  {
    id: 'modern_office',
    name: 'Oficina Moderna',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'minimal_workspace',
    name: 'Estudio Minimalista',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'google_campus',
    name: 'Campus Tech',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'warm_library',
    name: 'Biblioteca Cálida',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'cosy_living',
    name: 'Sala Acogedora',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'cafe_terrace',
    name: 'Cafetería Europea',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'sunset_skyline',
    name: 'Skyline al Atardecer',
    type: 'preset',
    url: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1280&q=80',
  },
];
