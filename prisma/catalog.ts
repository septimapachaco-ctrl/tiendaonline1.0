// Catálogo inicial de ejemplo de "Mi Pequeño Pony". Las fotos son marcadores de posición
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
    name: "Body Unicornio de Algodón",
    category: "Ropa",
    price: 15900,
    featured: true,
    color: "FFC2D9",
    description: "Suave como una nube y con un pequeño cuerno bordado. Algodón peinado, broches a presión para cambiar pañales sin apuro.",
    sizes: ["0-3 m", "3-6 m", "6-12 m"],
    colors: ["Rosa Nube", "Lila"],
  },
  {
    name: "Enterito Polar Arcoíris",
    category: "Ropa",
    price: 27900,
    compare: 31900,
    featured: true,
    color: "BDE0FE",
    description: "Un abrazo calentito para las mañanas frescas. Polar antipilling con capucha de orejitas y un arcoíris en la espalda.",
    sizes: ["3-6 m", "6-12 m", "12-18 m"],
    colors: ["Cielo Bebé", "Crema"],
  },
  {
    name: "Pijama Estrellas Fugaces",
    category: "Ropa",
    price: 22500,
    color: "FFE9A8",
    description: "Para los primeros sueños: algodón liviano con estrellas de cuatro puntas y puños suaves que no aprietan.",
    sizes: ["2", "4", "6"],
    colors: ["Amarillo", "Lila"],
  },
  {
    name: "Pony de Peluche Crin de Colores",
    category: "Juguetes",
    price: 24900,
    featured: true,
    color: "B79CED",
    description: "Un compañero de aventuras con crin de hilos suaves en los colores del arcoíris. Ojos bordados, seguro desde el nacimiento.",
    sizes: [],
    colors: ["Lila", "Rosa"],
  },
  {
    name: "Sonajero de Madera Nube",
    category: "Juguetes",
    price: 9800,
    color: "A8E6CF",
    description: "Madera natural con pintura atóxica al agua. Un sonido suave para descubrir el mundo con las manos.",
    sizes: [],
    colors: [],
  },
  {
    name: "Arcoíris Apilable de Madera",
    category: "Juguetes",
    price: 18900,
    color: "FFE9A8",
    description: "Siete arcos para apilar, ordenar e inventar. Juego libre que crece con cada etapa.",
    sizes: [],
    colors: [],
  },
  {
    name: "Manta Abrazo de Nube",
    category: "Decoración",
    price: 32900,
    featured: true,
    color: "FFC2D9",
    description: "Un abrazo hecho manta. Tejido de punto doble, suave de los dos lados, ideal para el cochecito o la cuna.",
    sizes: [],
    colors: ["Rosa Nube", "Menta", "Cielo"],
  },
  {
    name: "Lámpara Luna y Estrellas",
    category: "Decoración",
    price: 35500,
    color: "BDE0FE",
    description: "Luz cálida y tenue para acompañar las noches. Recargable por USB, con apagado automático.",
    sizes: [],
    colors: [],
  },
  {
    name: "Guirnalda de Nubes y Estrellas",
    category: "Decoración",
    price: 12400,
    color: "FFF9F4",
    description: "Fieltro cosido a mano para darle un toque de cuento a cualquier rincón. 1,5 metros.",
    sizes: [],
    colors: [],
  },
  {
    name: "Mochila Mini Unicornio",
    category: "Accesorios",
    price: 21900,
    color: "B79CED",
    description: "Para guardar tesoros en el jardín o en los paseos. Liviana, con cierre suave y cuerno dorado.",
    sizes: [],
    colors: ["Lila", "Rosa"],
  },
  {
    name: "Babero Impermeable Estrella",
    category: "Accesorios",
    price: 6900,
    color: "A8E6CF",
    description: "Frente de algodón estampado y reverso impermeable. Se lava fácil y sigue como nuevo.",
    sizes: [],
    colors: ["Menta", "Amarillo"],
  },
  {
    name: "Kit de Baño Burbujas Mágicas",
    category: "Cuidado",
    price: 16800,
    color: "BDE0FE",
    description: "Toalla con capucha de unicornio y esponja natural. Para que el baño sea un momento de juego.",
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
  const label = encodeURIComponent(n === 0 ? name : "✦");
  return `https://placehold.co/800x1000/${bg}/4A4458/png?text=${label}&font=raleway`;
}
