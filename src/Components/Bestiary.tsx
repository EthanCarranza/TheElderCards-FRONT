import { useState } from "react";
import PageLayout from "./PageLayout";

interface BestiaryEntry {
  _id: string;
  name: string;
  description: string;
  type: string;
  img?: string;
  discipline?: string;
  element?: string;
  species?: string;
  creatureCategory?: string;
  territory?: string;
  defense?: number;
  cost?: number;
  health?: number;
  magic?: number;
  stamina?: number;
  hunger?: number;
}

const mockEntries: BestiaryEntry[] = [
  {
    _id: "1",
    name: "Ave de Tormenta",
    description: "Ave mística en la alta que pruela mensajeras los dioaas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400",
    discipline: "ave mayor",
    element: "ave",
    species: "ave",
    creatureCategory: "mitológico",
    territory: "templos altas",
    defense: 7,
    cost: 5,
    health: 0,
    magic: 80,
    stamina: 110,
    hunger: 60,
  },
  {
    _id: "2",
    name: "Ave Salvaje",
    description:
      "Ave habitala en las con luz pruela. mensajeras de los diosas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400",
    discipline: "ave mayor",
    element: "ave",
    species: "ave",
    creatureCategory: "mitológico",
    territory: "templos",
    defense: 8,
    cost: 4,
    health: 5,
    magic: 80,
    stamina: 100,
    hunger: 60,
  },
  {
    _id: "3",
    name: "Basilisco",
    description:
      "Reptil monstruoso cuya mirada puede petrificar a sus enemigos. Habita cuevas oscuras y humedas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1531174153718-134011f73837?w=400",
    discipline: "basiliscos",
    element: "híbrido",
    species: "híbrido",
    creatureCategory: "mitológico",
    territory: "cuevas",
    defense: 7,
    cost: 5,
    health: 6,
    magic: 90,
    stamina: 40,
    hunger: 60,
  },
  {
    _id: "4",
    name: "Basilisco Marino",
    description: "Reptil acuático cuya mirada paraliza a sus presas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    discipline: "basiliscos",
    element: "híbrido",
    species: "híbrido",
    creatureCategory: "mitológico",
    territory: "océanos, arrecifes",
    defense: 7,
    cost: 5,
    health: 6,
    magic: 90,
    stamina: 30,
    hunger: 60,
  },
  {
    _id: "5",
    name: "Centauro",
    description:
      "Guerrero mitad humano, mitad caballo, experto en combate y exploración de bosques.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1553481187-be93c21490a9?w=400",
    discipline: "centauros",
    element: "humanoides",
    species: "natural",
    creatureCategory: "tierra",
    territory: "bosques, praderas, montañas",
    defense: 4,
    cost: 6,
    health: 5,
    magic: 40,
    stamina: 40,
    hunger: 95,
  },
  {
    _id: "6",
    name: "Centauro Guerrero",
    description:
      "Centauro entrenado en tácticas de guerra. lidera partullas en llanuras y montañas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    discipline: "centauros",
    element: "humanoides",
    species: "natural",
    creatureCategory: "tierra",
    territory: "bosques, praderas, montañas",
    defense: 6,
    cost: 8,
    health: 6,
    magic: 50,
    stamina: 50,
    hunger: 105,
  },
  {
    _id: "7",
    name: "Ciervo Fantasma",
    description: "Aparece en noches de niebla, guía a los viajeros perdidos.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1551244072-5d12893278ab?w=400",
    discipline: "cérvidos",
    element: "mamífero",
    species: "fantasmal",
    creatureCategory: "sombra",
    territory: "bosques, praderas",
    defense: 2,
    cost: 2,
    health: 2,
    magic: 30,
    stamina: 100,
    hunger: 40,
  },
  {
    _id: "8",
    name: "Conejo Asesino",
    description: "Pequeño y ágil, pero con una dimensiones durante eclipses.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400",
    discipline: "lagomorfos",
    element: "mamífero",
    species: "natural",
    territory: "bosques, praderas",
    defense: 2,
    cost: 2,
    health: 2,
    magic: 30,
    stamina: 60,
    hunger: 100,
  },
  {
    _id: "9",
    name: "Cuervo Mensajero",
    description: "Lleva secretos entre reinos, experto en espionaje.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400",
    discipline: "aves menores",
    element: "ave",
    species: "común",
    creatureCategory: "aire",
    territory: "ciudades",
    defense: 4,
    cost: 3,
    health: 4,
    magic: 60,
    stamina: 40,
    hunger: 90,
  },
  {
    _id: "10",
    name: "Dragón Azul",
    description:
      "Dragón veloz que controla el rayo y el viento. suele vivir en montañas elevadas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1589802829985-817e51171b92?w=400",
    discipline: "dragones",
    element: "dragón",
    species: "ancestral",
    creatureCategory: "aire",
    territory: "montañas, cumbres",
    defense: 8,
    cost: 7,
    health: 8,
    magic: 120,
    stamina: 70,
    hunger: 90,
  },
  {
    _id: "11",
    name: "Dragón de Cristal",
    description:
      "Dragón brillante. su cuerpo refleja la luz y es símbolo de esperanza. Habita cavernas de cristal.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400",
    discipline: "dragones",
    element: "dragón",
    species: "ancestral",
    creatureCategory: "cristal",
    territory: "cuevas",
    defense: 9,
    cost: 9,
    health: 9,
    magic: 140,
    stamina: 100,
    hunger: 80,
  },
  {
    _id: "12",
    name: "Dragón de Fuego",
    description:
      "Feroz y temible, escupe llamas y arrasa aldeas. Vive en volcanes activos.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1578836537282-3171d77f8632?w=400",
    discipline: "dragones",
    element: "dragón",
    species: "ancestral",
    creatureCategory: "fuego",
    territory: "volcanes",
    defense: 9,
    cost: 8,
    health: 9,
    magic: 120,
    stamina: 60,
    hunger: 70,
  },
  {
    _id: "13",
    name: "Elemental de Agua",
    description:
      "Forma física del agua. puede cambiar de estado y controlar corrientes y mareas.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
    discipline: "elementales",
    element: "elemental",
    species: "artificial",
    creatureCategory: "agua",
    territory: "ríos, lagos",
    defense: 7,
    cost: 7,
    health: 7,
    magic: 110,
    stamina: 85,
    hunger: 75,
  },
  {
    _id: "14",
    name: "Elemental de Fuego",
    description:
      "Manifestación viva del fuego. cuerpo arde constantemente y puede incinerar todo a su paso.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1525338078858-f30ee4b86d22?w=400",
    discipline: "elementales",
    element: "elemental",
    species: "artificial",
    creatureCategory: "fuego",
    territory: "volcanes",
    defense: 8,
    cost: 6,
    health: 7,
    magic: 100,
    stamina: 90,
    hunger: 80,
  },
  {
    _id: "15",
    name: "Escorpión de Lava",
    description:
      "Su veneno de magma quema y paraliza. vive en los corazón de los volcanes.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1591608971362-f08b2a75731a?w=400",
    discipline: "escorpiónidos",
    element: "insecto",
    species: "natural",
    creatureCategory: "magma",
    territory: "volcanes",
    defense: 6,
    cost: 6,
    health: 6,
    magic: 80,
    stamina: 30,
    hunger: 70,
  },
  {
    _id: "16",
    name: "Fénix",
    description:
      "Renace de sus cenizas, símbolo de inmortalidad. Habita volcanes.",
    type: "criatura",
    img: "https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=400",
    discipline: "aves mayores",
    element: "ave",
    species: "mitológico",
    creatureCategory: "fuego",
    territory: "volcanes",
    defense: 6,
    cost: 7,
    health: 8,
    magic: 110,
    stamina: 90,
    hunger: 80,
  },
  {
    _id: "17",
    name: "Invocar Lobo",
    description: "Invoca un lobo para proteger al invocador.",
    type: "invocación",
    img: "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400",
    discipline: "invocación",
    element: "natural",
    species: "tierra",
    creatureCategory: "sólidos",
    defense: 3,
    cost: 3,
  },
  {
    _id: "18",
    name: "Invocar Golem de Piedra",
    description: "Crea un gólem de piedra que bloquea infantería o caminos.",
    type: "invocación",
    img: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    discipline: "aleumanurgia",
    element: "elemental",
    species: "tierra",
    creatureCategory: "gólems",
    defense: 4,
    cost: 4,
  },
  {
    _id: "19",
    name: "Rayo Azul",
    description: "Descarga eléctrica veloz que ataca a múltiples enemigos.",
    type: "hechizo",
    img: "https://images.unsplash.com/photo-1621524213985-b9f5e8d19b82?w=400",
    discipline: "destrucción",
    element: "ancestral",
    species: "rayo",
    cost: 5,
  },
  {
    _id: "20",
    name: "Llama Pura",
    description:
      "Aliento de fuego blanco puro que purifica y daña a los enemigos.",
    type: "hechizo",
    img: "https://images.unsplash.com/photo-1516934024742-b461fba47600?w=400",
    discipline: "destrucción",
    element: "ancestral",
    species: "fuego",
    cost: 5,
  },
];

const Bestiary = () => {
  const [selectedEntry, setSelectedEntry] = useState<BestiaryEntry | null>(
    mockEntries[0]
  );

  return (
    <PageLayout contentClassName="max-h-[83dvh] flex font-serif bg-gray-900">
      <div className="flex flex-col lg:flex-row max-w-[2800px] mx-auto h-full w-full">
        <div className="lg:w-1/3 xl:w-1/4 h-full border-b lg:border-b-0 lg:border-r border-gray-700 bg-gray-900 flex flex-col rounded-tl-lg rounded-bl-lg shadow-lg shadow-black/30">
          <div className="p-4 lg:p-6 border-b border-gray-700 bg-gray-800 rounded-tl-lg">
            <h2 className="text-2xl lg:text-3xl font-bold text-white text-center tracking-wide drop-shadow-lg mb-2 font-serif relative">
              <span className="inline-block border-b-4 border-green-700 pb-1 px-2">
                BESTIARIO
              </span>
            </h2>
            <p className="text-sm text-gray-300 text-center mt-2 italic">
              {mockEntries.length} entradas descubiertas
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2 bg-gray-900">
            {mockEntries.map((entry) => (
              <button
                key={entry._id}
                onClick={() => setSelectedEntry(entry)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 border-2 font-serif shadow-sm ${
                  selectedEntry?._id === entry._id
                    ? "bg-green-700/30 border-green-500 shadow-lg shadow-green-700/10"
                    : "bg-gray-800 border-gray-700 hover:bg-green-900/20 hover:border-green-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {entry.img && (
                    <img
                      src={entry.img}
                      alt={entry.name}
                      className="w-12 h-12 rounded object-cover border-2 border-gray-700 flex-shrink-0 shadow-sm"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold text-base lg:text-lg truncate font-serif ${
                        selectedEntry?._id === entry._id
                          ? "text-green-300 drop-shadow"
                          : "text-white"
                      }`}
                    >
                      {entry.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate capitalize italic">
                      {entry.type}
                      {entry.species && ` • ${entry.species}`}
                    </p>
                  </div>
                  {selectedEntry?._id === entry._id && (
                    <div className="text-green-400 text-lg flex-shrink-0">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="inline-block"
                      >
                        <path d="M6 4l8 6-8 6V4z" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 h-full p-4 lg:p-8 bg-gray-900 flex items-center justify-center overflow-hidden rounded-tr-lg rounded-br-lg shadow-lg shadow-black/30">
          {selectedEntry ? (
            <div className="max-w-4xl mx-auto w-full h-full max-h-full overflow-hidden flex flex-col font-serif">
              {selectedEntry.img && (
                <div className="mb-4 lg:mb-6 flex-shrink-0">
                  <img
                    src={selectedEntry.img}
                    alt={selectedEntry.name}
                    className="w-full max-w-xl mx-auto h-48 lg:h-64 object-cover rounded-lg border-4 border-gray-700 shadow-2xl shadow-black/50"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="mb-4 lg:mb-6 flex-shrink-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2 truncate font-serif drop-shadow-lg">
                      {selectedEntry.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-gray-700 text-white text-sm rounded-full border-2 border-green-700 capitalize font-serif">
                        {selectedEntry.type}
                      </span>
                      {selectedEntry.discipline && (
                        <span className="px-3 py-1 bg-gray-700 text-green-300 text-sm rounded-full border-2 border-green-700 capitalize font-serif">
                          {selectedEntry.discipline}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-4 shadow-sm">
                  <p className="text-gray-300 text-base lg:text-lg leading-relaxed font-serif italic">
                    {selectedEntry.description}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-3 border-b-2 border-green-700 pb-2 font-serif">
                    Clasificación
                  </h3>
                  <div className="space-y-2">
                    {selectedEntry.element && (
                      <InfoRow label="Elemento" value={selectedEntry.element} />
                    )}
                    {selectedEntry.species && (
                      <InfoRow label="Especie" value={selectedEntry.species} />
                    )}
                    {selectedEntry.creatureCategory && (
                      <InfoRow
                        label="Categoría"
                        value={selectedEntry.creatureCategory}
                      />
                    )}
                    {selectedEntry.territory && (
                      <InfoRow
                        label="Territorio"
                        value={selectedEntry.territory}
                      />
                    )}
                  </div>
                </div>
                {(selectedEntry.cost !== undefined ||
                  selectedEntry.defense !== undefined ||
                  selectedEntry.health !== undefined ||
                  selectedEntry.magic !== undefined ||
                  selectedEntry.stamina !== undefined ||
                  selectedEntry.hunger !== undefined) && (
                  <div className="bg-gray-800 border-2 border-gray-700 rounded-lg p-4 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-3 border-b-2 border-green-700 pb-2 font-serif">
                      Estadísticas
                    </h3>
                    <div className="space-y-2">
                      {selectedEntry.cost !== undefined && (
                        <StatBar
                          label="Coste"
                          value={selectedEntry.cost}
                          max={10}
                          color="green"
                        />
                      )}
                      {selectedEntry.defense !== undefined && (
                        <StatBar
                          label="Defensa"
                          value={selectedEntry.defense}
                          max={10}
                          color="green"
                        />
                      )}
                      {selectedEntry.health !== undefined && (
                        <StatBar
                          label="Salud"
                          value={selectedEntry.health}
                          max={10}
                          color="green"
                        />
                      )}
                      {selectedEntry.magic !== undefined && (
                        <StatBar
                          label="Magia"
                          value={selectedEntry.magic}
                          max={150}
                          color="green"
                        />
                      )}
                      {selectedEntry.stamina !== undefined && (
                        <StatBar
                          label="Vigor"
                          value={selectedEntry.stamina}
                          max={150}
                          color="green"
                        />
                      )}
                      {selectedEntry.hunger !== undefined && (
                        <StatBar
                          label="Hambre"
                          value={selectedEntry.hunger}
                          max={150}
                          color="green"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-gray-900 border-2 border-gray-700 rounded-lg flex-shrink-0 shadow-sm">
                <p className="text-xs lg:text-sm text-gray-300 text-center truncate italic font-serif">
                  Esta es una vista previa con datos de ejemplo. Las entradas
                  reales se cargarán desde el backend.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-xl italic font-serif">
                Selecciona una entrada del índice
              </p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-400 text-sm font-medium">{label}:</span>
    <span className="text-white text-sm capitalize">{value}</span>
  </div>
);

const StatBar = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: "amber" | "blue" | "red" | "purple" | "green" | "orange";
}) => {
  const percentage = (value / max) * 100;
  const colorClasses = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <span className="text-white text-sm font-bold">{value}</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300 rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default Bestiary;
