import mongoose from "mongoose";

const calSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    rankings: [
      {
        application: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Application",
        },
        applicantName: String,
        totalPoints: Number,
        
        // Tie-breaker points (DO 007, s. 2023)
        residencyPriority: { type: Boolean, default: false },
        boardRating: { type: Number, default: 0 },
        educationPoints: { type: Number, default: 0 },
        experiencePoints: { type: Number, default: 0 },
        trainingPoints: { type: Number, default: 0 },
        coiPoints: { type: Number, default: 0 }, // Classroom Observation
        
        rank: Number,
        isTie: { type: Boolean, default: false },
        tieBreakerNote: String,
      },
    ],

    disqualifiedApplicants: [
      {
        application: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Application",
        },
        applicantName: String,
        reason: String,
      },
    ],

    hiringTrack: {
      type: String,
      enum: ["teaching", "teaching_related", "non_teaching"],
    },

    status: {
      type: String,
      enum: ["draft", "published", "finalized"],
      default: "draft",
    },

    finalizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    finalizedAt: Date,
  },
  { timestamps: true },
);

/**
 * 🔹 ADVANCED SORTING & TIE-BREAKING LOGIC (DO 007, s. 2023)
 */
calSchema.pre("save", async function () {
  if (this.rankings && this.rankings.length > 0) {
    this.rankings.sort((a, b) => {
      // 1. Primary: Total Points
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      
      // 2. Secondary: Localization Law (Residency)
      if (b.residencyPriority !== a.residencyPriority) return b.residencyPriority ? 1 : -1;
      
      // 3. Board Rating
      if (b.boardRating !== a.boardRating) return b.boardRating - a.boardRating;
      
      // 4. Education Points
      if (b.educationPoints !== a.educationPoints) return b.educationPoints - a.educationPoints;
      
      // 5. Experience Points
      if (b.experiencePoints !== a.experiencePoints) return b.experiencePoints - a.experiencePoints;
      
      // 6. Training Points
      if (b.trainingPoints !== a.trainingPoints) return b.trainingPoints - a.trainingPoints;
      
      // 7. Classroom Observation (COI)
      return b.coiPoints - a.coiPoints;
    });

    // Assign Ranks and Flag Remaining Ties
    this.rankings.forEach((item, index) => {
      item.rank = index + 1;
      const prev = this.rankings[index - 1];
      
      if (prev && 
          prev.totalPoints === item.totalPoints && 
          prev.residencyPriority === item.residencyPriority &&
          prev.boardRating === item.boardRating &&
          prev.educationPoints === item.educationPoints &&
          prev.experiencePoints === item.experiencePoints &&
          prev.trainingPoints === item.trainingPoints &&
          prev.coiPoints === item.coiPoints) {
        item.isTie = true;
        item.tieBreakerNote = "Persistent tie - requires draw lots";
      } else {
        item.isTie = false;
      }
    });
  }
});

export default mongoose.model("CAL", calSchema);
