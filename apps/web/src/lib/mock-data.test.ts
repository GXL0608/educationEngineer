import { describe, expect, it } from "vitest";
import { courses, getCourse, stages } from "./mock-data";

describe("mock curriculum data", () => {
  it("covers four learning stages", () => {
    expect(stages.map((stage) => stage.id)).toEqual(["K12", "undergraduate", "master", "doctor"]);
  });

  it("returns a fallback course when id is missing", () => {
    expect(getCourse("missing-course-id")).toEqual(courses[0]);
  });
});
