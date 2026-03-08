import Rubric from "../models/Rubric.js";

export const seedRubrics = async () => {
  const counts = await Rubric.countDocuments();
  if (counts > 0) return;

  const seeds = [
    {
      track: "non_teaching",
      title: "DO 007, s. 2023 (Non-Teaching)",
      criteria: [
        { key: "education", label: "Education", maxPoints: 20 },
        { key: "training", label: "Training", maxPoints: 10 },
        { key: "experience", label: "Experience", maxPoints: 15 },
        { key: "performance", label: "Performance", maxPoints: 20 },
        { key: "outstanding", label: "Outstanding Accomplishments", maxPoints: 5 },
        { key: "application_education", label: "Application of Education", maxPoints: 10 },
        { key: "application_learning", label: "Application of L&D", maxPoints: 10 },
        { key: "potential", label: "Potential (BEI/Written)", maxPoints: 10 }
      ]
    },
    {
      track: "teaching",
      title: "DO 007, s. 2023 (Teaching)",
      criteria: [
        { key: "education", label: "Education", maxPoints: 20 },
        { key: "training", label: "Training", maxPoints: 10 },
        { key: "experience", label: "Experience", maxPoints: 15 },
        { key: "let_rating", label: "PBET/LET Rating", maxPoints: 10 },
        { key: "demo_teaching", label: "Classroom Observation (Demo)", maxPoints: 35 },
        { key: "interview", label: "Interview", maxPoints: 10 }
      ]
    }
  ];

  await Rubric.insertMany(seeds);
  console.log("✅ Rubrics Seeded");
};
