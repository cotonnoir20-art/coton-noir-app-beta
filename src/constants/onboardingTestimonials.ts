export type OnboardingTestimonial = {
  quote: string;
  name: string;
  city: string;
  result: string;
};

export const ONBOARDING_TESTIMONIALS: OnboardingTestimonial[] = [
  {
    quote: "En 6 semaines ma casse a pratiquement disparu. Je pensais que mes cheveux étaient juste comme ça.",
    name: 'Aïssatou',
    city: 'Paris',
    result: 'Casse −80 % en 6 semaines',
  },
  {
    quote: "J'avais tout essayé. Le suivi m'a enfin aidée à voir ce qui fonctionnait vraiment pour MOI.",
    name: 'Fatoumata',
    city: 'Lyon',
    result: 'Routine tenue 4 mois',
  },
  {
    quote: "Je ne croyais plus que c'était possible. Mes longueurs ont poussé de 4 cm en 3 mois.",
    name: 'Nadia',
    city: 'Fort-de-France',
    result: '+4 cm en 3 mois',
  },
];
