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

        potentialPoints: Number,
        rank: Number,
        isTieBroken: { type: Boolean, default: false },
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
 * 🔹 ADVANCED SORTING & TIE-BREAKING LOGIC
 */
calSchema.pre("save", function (next) {
  if (this.rankings && this.rankings.length > 0) {
    this.rankings.sort((a, b) => {
      // 1. Primary Sort: Total Points (Descending)
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      // 2. Secondary Sort: Potential Points (Tie-Breaker)
      return b.potentialPoints - a.potentialPoints;
    });

    // Assign Ranks and Flag Ties
    this.rankings.forEach((item, index) => {
      item.rank = index + 1;

      // Check if the person above has the same total points
      if (
        index > 0 &&
        this.rankings[index - 1].totalPoints === item.totalPoints
      ) {
        item.isTieBroken = true;
        item.tieBreakerNote = "Tie broken via Potential Points";
      }
    });
  }
  next();
});

export default mongoose.model("CAL", calSchema);
