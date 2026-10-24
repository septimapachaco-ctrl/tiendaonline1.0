// Catálogo inicial de ejemplo de "Mi Pequeña Delfina". Las fotos son marcadores de posición
// con los colores de la marca: reemplazarlas desde el panel por las fotos reales.

export const categories = ["Ropa", "Juguetes", "Decoración", "Accesorios", "Cuidado"];

type SeedProduct = {
  name: string;
  category: string;
  price: number;
  compare?: number;
  featured?: boolean;
  color: string; // color de fondo del marcador de foto
  description: string;
  sizes: string[];
  colors: string[];
};

export const products: SeedProduct[] = [
  {
    name: "Body Delfina de Algodón",
    category: "Ropa",
    price: 15900,
    featured: true,
    color: "A8DADC",
    description: "Suave como la espuma y con Delfina bordada en el pecho. Algodón peinado y broches a presión para cambiar pañales sin apuro.",
    sizes: ["0-3 m", "3-6 m", "6-12 m"],
    colors: ["Aqua", "Arena"],
  },
  {
    name: "Enterito Polar Olas",
    category: "Ropa",
    price: 27900,
    compare: 31900,
    featured: true,
    color: "8ECAE6",
    description: "Un abrazo calentito para las mañanas frescas. Polar antipilling con capucha de aletas y olas suaves en la espalda.",
    sizes: ["3-6 m", "6-12 m", "12-18 m"],
    colors: ["Azul Marea", "Arena"],
  },
  {
    name: "Pijama Burbujas de Mar",
    category: "Ropa",
    price: 22500,
    color: "F5E6D3",
    description: "Para los primeros sueños: algodón liviano estampado con burbujas y puños suaves que no aprietan.",
    sizes: ["2", "4", "6"],
    colors: ["Arena", "Aqua"],
  },
  {
    name: "Delfina de Peluche",
    category: "Juguetes",
    price: 24900,
    featured: true,
    color: "8ECAE6",
    description: "Una compañera de aventuras suave y redondita, con una burbuja bordada en la aleta. Ojos bordados, segura desde el nacimiento.",
    sizes: [],
    colors: ["Azul Marea", "Rosa Concha"],
  },
  {
    name: "Sonajero de Madera Concha",
    category: "Juguetes",
    price: 9800,
    color: "F5E6D3",
    description: "Madera natural con pintura atóxica al agua. Un sonido suave, como el mar en una concha, para descubrir el mundo con las manos.",
    sizes: [],
    colors: [],
  },
  {
    name: "Olas Apilables de Madera",
    category: "Juguetes",
    price: 18900,
    color: "A8DADC",
    description: "Siete olas para apilar, ordenar e inventar mares. Juego libre que crece con cada etapa.",
    sizes: [],
    colors: [],
  },
  {
    name: "Manta Abrazo de Mar",
    category: "Decoración",
    price: 32900,
    featured: true,
    color: "A8DADC",
    description: "Un abrazo hecho manta. Tejido de punto doble, suave de los dos lados, ideal para el cochecito o la cuna.",
    sizes: [],
    colors: ["Aqua", "Arena", "Azul Marea"],
  },
  {
    name: "Lámpara Luz Bajo el Agua",
    category: "Decoración",
    price: 35500,
    color: "8ECAE6",
    description: "Luz cálida y tenue, como el sol filtrado desde la superficie. Recargable por USB, con apagado automático.",
    sizes: [],
    colors: [],
  },
  {
    name: "Guirnalda de Burbujas y Conchas",
    category: "Decoración",
    price: 12400,
    color: "FDFCFB",
    description: "Fieltro cosido a mano para darle calma de mar a cualquier rincón. 1,5 metros.",
    sizes: [],
    colors: [],
  },
  {
    name: "Mochila Mini Delfina",
    category: "Accesorios",
    price: 21900,
    color: "8ECAE6",
    description: "Para guardar tesoros en el jardín o en los paseos por la playa. Liviana, con cierre suave y aletas de tela.",
    sizes: [],
    colors: ["Azul Marea", "Aqua"],
  },
  {
    name: "Babero Impermeable Estrella de Mar",
    category: "Accesorios",
    price: 6900,
    color: "F5E6D3",
    description: "Frente de algodón estampado y reverso impermeable. Se lava fácil y sigue como nuevo.",
    sizes: [],
    colors: ["Arena", "Aqua"],
  },
  {
    name: "Kit de Baño Primeros Chapuzones",
    category: "Cuidado",
    price: 16800,
    color: "A8DADC",
    description: "Toalla con capucha de delfín y esponja natural. Para que el baño sea un momento de calma y juego.",
    sizes: [],
    colors: [],
  },
];

export function slugOf(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function placeholderImage(name: string, bg: string, n: number) {
  const label = encodeURIComponent(n === 0 ? name : "~ ~ ~");
  return `https://placehold.co/800x1000/${bg}/2B3A55/png?text=${label}&font=raleway`;
}
