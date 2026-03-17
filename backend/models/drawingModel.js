import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  fileId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString(),
    index: true,
  },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  remark: { type: String, default: "" },
  uploadedAt: { type: Date, default: Date.now },
});
const drawingSchema = new mongoose.Schema(
  {
    folderName: { type: String, required: true, trim: true },
    folderSlug: { type: String, required: true, lowercase: true, index: true },
    shortcut: { type: String, required: true, uppercase: true },
    drawingNo: { type: String, required: true },
    revisionNo: { type: String, default: "R0" },
    description: { type: String, default: "" },
    files: { type: Map, of: [fileSchema], default: undefined },
    fullDrawingNo: { type: String, required: true, index: true },
    active: { type: Boolean, default: true, index: true },
    lastActivityAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("Drawing", drawingSchema);
