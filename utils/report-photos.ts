export const PHOTO_CATEGORIES = [
  { id: 'box', title: 'FOTO DE LA ETIQUETA DE LA CAJA', short: 'Etiqueta de caja' },
  { id: 'mattress', title: 'FOTO DE LA ETIQUETA DEL COLCHÓN', short: 'Etiqueta de colchón' },
  { id: 'appearance', title: 'OVERALL APPEARANCE', short: 'Overall appearance' },
  { id: 'measures', title: 'MEASURES', short: 'Measures' },
] as const;
export type PhotoCategory = typeof PHOTO_CATEGORIES[number]['id'];
export type ReportPhoto = { id: string; uri: string; number: number; category: PhotoCategory; base64?: string | null };
export function categoryForNumber(number: number): PhotoCategory {
  return number === 1 ? 'box' : number === 2 ? 'mattress' : number <= 5 ? 'appearance' : 'measures';
}
export function movePhoto(photos: ReportPhoto[], id: string, category: PhotoCategory) {
  return photos.map(photo => photo.id === id ? { ...photo, category } : photo);
}
export function categoryTitle(category: PhotoCategory) {
  return PHOTO_CATEGORIES.find(item => item.id === category)!.title;
}
