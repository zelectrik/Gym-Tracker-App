import "dotenv/config";
import { MuscleGroup } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const muscleTags = [
  "pectoraux",
  "haut_pectoraux",
  "dos",
  "grand_dorsal",
  "trapezes",
  "epaules",
  "avant_epaules",
  "arriere_epaules",
  "biceps",
  "triceps",
  "avant_bras",
  "abdominaux",
  "obliques",
  "lombaires",
  "quadriceps",
  "ischios",
  "fessiers",
  "mollets",
  "adducteurs",
  "abducteurs",
  "cardio",
  "core",
  "full_body",
] as const;

type MuscleTag = (typeof muscleTags)[number];

type SeedExercise = {
  name: string;
  type: "machine" | "dumbbell" | "barbell" | "cable" | "bodyweight" | "cardio";
  muscles: MuscleTag[];
};

const exercises: SeedExercise[] = [
  {
    name: "Presse à pectoraux",
    type: "machine",
    muscles: ["pectoraux", "triceps", "epaules"],
  },
  {
    name: "Presse inclinée à pectoraux",
    type: "machine",
    muscles: ["haut_pectoraux", "triceps", "epaules"],
  },
  {
    name: "Écarté pectoraux à la machine",
    type: "machine",
    muscles: ["pectoraux"],
  },
  {
    name: "Presse à épaules",
    type: "machine",
    muscles: ["epaules", "triceps"],
  },
  {
    name: "Élévations latérales à la machine",
    type: "machine",
    muscles: ["epaules"],
  },
  {
    name: "Tirage vertical",
    type: "machine",
    muscles: ["dos", "grand_dorsal", "biceps"],
  },
  { name: "Rowing assis", type: "machine", muscles: ["dos", "biceps"] },
  {
    name: "Rowing haut",
    type: "machine",
    muscles: ["dos", "trapezes", "biceps"],
  },
  { name: "Tractions assistées", type: "machine", muscles: ["dos", "biceps"] },
  { name: "Dips assistés", type: "machine", muscles: ["triceps", "pectoraux"] },
  { name: "Curl biceps à la machine", type: "machine", muscles: ["biceps"] },
  {
    name: "Extension triceps à la machine",
    type: "machine",
    muscles: ["triceps"],
  },
  {
    name: "Crunch abdominal à la machine",
    type: "machine",
    muscles: ["abdominaux"],
  },
  {
    name: "Rotation du buste",
    type: "machine",
    muscles: ["obliques", "abdominaux"],
  },
  {
    name: "Extension lombaires à la machine",
    type: "machine",
    muscles: ["lombaires"],
  },
  {
    name: "Presse à cuisses",
    type: "machine",
    muscles: ["quadriceps", "fessiers", "ischios"],
  },
  { name: "Hack squat", type: "machine", muscles: ["quadriceps", "fessiers"] },
  {
    name: "Pendulum squat",
    type: "machine",
    muscles: ["quadriceps", "fessiers"],
  },
  { name: "Extension des jambes", type: "machine", muscles: ["quadriceps"] },
  { name: "Curl ischios assis", type: "machine", muscles: ["ischios"] },
  { name: "Curl ischios couché", type: "machine", muscles: ["ischios"] },
  {
    name: "Hip thrust à la machine",
    type: "machine",
    muscles: ["fessiers", "ischios"],
  },
  { name: "Machine à fessiers", type: "machine", muscles: ["fessiers"] },
  { name: "Adducteurs à la machine", type: "machine", muscles: ["adducteurs"] },
  {
    name: "Abducteurs à la machine",
    type: "machine",
    muscles: ["abducteurs", "fessiers"],
  },
  { name: "Mollets debout", type: "machine", muscles: ["mollets"] },
  { name: "Mollets assis", type: "machine", muscles: ["mollets"] },
  { name: "Smith machine", type: "machine", muscles: ["full_body"] },
  {
    name: "Écarté poulie vis-à-vis",
    type: "machine",
    muscles: ["pectoraux", "epaules"],
  },
  { name: "Poulie multifonction", type: "machine", muscles: ["full_body"] },

  {
    name: "Développé couché haltères",
    type: "dumbbell",
    muscles: ["pectoraux", "triceps"],
  },
  {
    name: "Développé incliné haltères",
    type: "dumbbell",
    muscles: ["haut_pectoraux", "epaules"],
  },
  {
    name: "Développé militaire haltères",
    type: "dumbbell",
    muscles: ["epaules", "triceps"],
  },
  { name: "Élévations latérales", type: "dumbbell", muscles: ["epaules"] },
  { name: "Oiseau haltères", type: "dumbbell", muscles: ["arriere_epaules"] },
  { name: "Curl biceps haltères", type: "dumbbell", muscles: ["biceps"] },
  { name: "Curl marteau", type: "dumbbell", muscles: ["biceps", "avant_bras"] },
  { name: "Extension triceps haltère", type: "dumbbell", muscles: ["triceps"] },
  { name: "Rowing haltère", type: "dumbbell", muscles: ["dos", "biceps"] },
  {
    name: "Soulevé de terre",
    type: "barbell",
    muscles: ["dos", "fessiers", "ischios"],
  },
  {
    name: "Soulevé de terre roumain",
    type: "barbell",
    muscles: ["ischios", "fessiers"],
  },
  {
    name: "Goblet squat",
    type: "dumbbell",
    muscles: ["quadriceps", "fessiers"],
  },
  {
    name: "Fentes marchées",
    type: "dumbbell",
    muscles: ["quadriceps", "fessiers"],
  },
  {
    name: "Bulgarian split squat",
    type: "dumbbell",
    muscles: ["quadriceps", "fessiers"],
  },
  { name: "Hip thrust barre", type: "barbell", muscles: ["fessiers"] },
  { name: "Shrugs haltères", type: "dumbbell", muscles: ["trapezes"] },
  {
    name: "Marche du fermier",
    type: "dumbbell",
    muscles: ["avant_bras", "core"],
  },

  {
    name: "Extension triceps à la poulie",
    type: "cable",
    muscles: ["triceps"],
  },
  { name: "Extension triceps corde", type: "cable", muscles: ["triceps"] },
  {
    name: "Face pull",
    type: "cable",
    muscles: ["arriere_epaules", "trapezes"],
  },
  { name: "Curl biceps à la poulie", type: "cable", muscles: ["biceps"] },
  {
    name: "Écarté pectoraux à la poulie",
    type: "cable",
    muscles: ["pectoraux"],
  },
  { name: "Rowing à la poulie", type: "cable", muscles: ["dos"] },
  {
    name: "Pull-over bras tendus à la poulie",
    type: "cable",
    muscles: ["grand_dorsal"],
  },
  {
    name: "Rotation obliques à la poulie",
    type: "cable",
    muscles: ["obliques"],
  },
  {
    name: "Élévation latérale à la poulie",
    type: "cable",
    muscles: ["epaules"],
  },
  { name: "Pallof press", type: "cable", muscles: ["core", "abdominaux"] },

  { name: "Pompes", type: "bodyweight", muscles: ["pectoraux", "triceps"] },
  { name: "Tractions", type: "bodyweight", muscles: ["dos", "biceps"] },
  { name: "Dips", type: "bodyweight", muscles: ["triceps", "pectoraux"] },
  { name: "Crunch", type: "bodyweight", muscles: ["abdominaux"] },
  { name: "Gainage", type: "bodyweight", muscles: ["core", "abdominaux"] },
  { name: "Burpees", type: "bodyweight", muscles: ["full_body", "cardio"] },

  { name: "Tapis de course", type: "cardio", muscles: ["cardio"] },
  { name: "Vélo", type: "cardio", muscles: ["cardio", "quadriceps"] },
  { name: "Elliptique", type: "cardio", muscles: ["cardio", "full_body"] },
  { name: "Stairmaster", type: "cardio", muscles: ["cardio", "fessiers"] },
  { name: "Rameur", type: "cardio", muscles: ["cardio", "dos", "full_body"] },
  { name: "Air Bike", type: "cardio", muscles: ["cardio", "full_body"] },
];

const primaryMuscleGroupByTag: Record<MuscleTag, MuscleGroup> = {
  pectoraux: "CHEST",
  haut_pectoraux: "UPPER_CHEST",
  dos: "BACK",
  grand_dorsal: "LATS",
  trapezes: "TRAPS",
  epaules: "SHOULDERS",
  avant_epaules: "FRONT_SHOULDERS",
  arriere_epaules: "REAR_SHOULDERS",
  biceps: "BICEPS",
  triceps: "TRICEPS",
  avant_bras: "FOREARMS",
  abdominaux: "ABS",
  obliques: "OBLIQUES",
  lombaires: "LOWER_BACK",
  quadriceps: "QUADS",
  ischios: "HAMSTRINGS",
  fessiers: "GLUTES",
  mollets: "CALVES",
  adducteurs: "ADDUCTORS",
  abducteurs: "ABDUCTORS",
  cardio: "CARDIO",
  core: "CORE",
  full_body: "FULL_BODY",
};

const getPrimaryMuscleGroup = (exercise: SeedExercise): MuscleGroup => {
  if (exercise.type === "cardio") return "CARDIO";
  return primaryMuscleGroupByTag[exercise.muscles[0]] ?? "FULL_BODY";
};

const normalizeName = (name: string) => name.trim().toLowerCase();

async function main() {
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: normalizeName(exercise.name) },
      update: {
        type: exercise.type,
        muscles: exercise.muscles,
        muscleGroup: getPrimaryMuscleGroup(exercise),
      },
      create: {
        name: normalizeName(exercise.name),
        type: exercise.type,
        muscles: exercise.muscles,
        muscleGroup: getPrimaryMuscleGroup(exercise),
      },
    });
  }

  console.log(`Seeded ${exercises.length} exercises.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
