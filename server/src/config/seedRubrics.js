import Rubric from "../models/Rubric.js";

export const seedRubrics = async () => {
  // ── Clear existing collection & indexes ──────────────────────────────
  try {
    await Rubric.collection.drop();
    console.log("🧹 Old rubrics collection and indexes cleared.");
  } catch (e) {
    // Collection might not exist, ignore
    await Rubric.deleteMany({});
  }

  const seeds = [
    {
      category: "teaching",
      title: "Teaching Personnel Rubric (Teacher I)",
      description: "Official DepEd DO 007, s. 2023 weights for Teacher I (Elementary, Secondary, Senior High).",
      criteria: [
        { key: "educationPoints", label: "Education", maxPoints: 10, isPotential: false },
        { key: "trainingPoints", label: "Training", maxPoints: 10, isPotential: false },
        { key: "experiencePoints", label: "Experience", maxPoints: 10, isPotential: false },
        { key: "boardRating", label: "LET/PBET Rating", maxPoints: 15, isPotential: true },
        { key: "coiPoints", label: "PPST COIs (Classroom Observation)", maxPoints: 35, isPotential: true },
        { key: "ncoiPoints", label: "PPST NCOIs (Teacher Portfolio)", maxPoints: 20, isPotential: true }
      ],
      totalPoints: 100
    },
    {
      category: "non_teaching",
      title: "Non-Teaching Personnel Rubric",
      description: "Official DepEd DO 007, s. 2023 weights for Non-Teaching (General) positions.",
      criteria: [
        { key: "educationPoints", label: "Education", maxPoints: 5, isPotential: false },
        { key: "trainingPoints", label: "Training", maxPoints: 5, isPotential: false },
        { key: "experiencePoints", label: "Experience", maxPoints: 20, isPotential: false },
        { key: "performancePoints", label: "Performance", maxPoints: 20, isPotential: false },
        { key: "outstanding_accomplishments", label: "Outstanding Accomplishments", maxPoints: 10, isPotential: false },
        { key: "app_education", label: "Application of Education", maxPoints: 10, isPotential: false },
        { key: "app_learning", label: "Application of L&D", maxPoints: 10, isPotential: false },
        { key: "boardRating", label: "Potential (BEI)", maxPoints: 20, isPotential: true }
      ],
      totalPoints: 100
    },
    {
      category: "teaching_related",
      title: "Related-Teaching Rubric",
      description: "Official DepEd DO 007, s. 2023 weights for Related-Teaching positions.",
      criteria: [
        { key: "educationPoints", label: "Education", maxPoints: 10, isPotential: false },
        { key: "trainingPoints", label: "Training", maxPoints: 10, isPotential: false },
        { key: "experiencePoints", label: "Experience", maxPoints: 10, isPotential: false },
        { key: "performancePoints", label: "Performance", maxPoints: 20, isPotential: false },
        { key: "outstanding_accomplishments", label: "Outstanding Accomplishments", maxPoints: 10, isPotential: false },
        { key: "app_education", label: "Application of Education", maxPoints: 10, isPotential: false },
        { key: "app_learning", label: "Application of L&D", maxPoints: 10, isPotential: false },
        { key: "boardRating", label: "Potential (BEI)", maxPoints: 20, isPotential: true }
      ],
      totalPoints: 100
    }
  ];

  await Rubric.insertMany(seeds);
  console.log("✅ Official DepEd DO 007, s. 2023 Rubrics Seeded");
};
