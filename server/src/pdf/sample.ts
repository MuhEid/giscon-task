import type { CvData } from "./types.js";

// Filled-in CV used to check that an edited template renders before it is saved,
// and as the editor preview when no staff member is picked.
export const SAMPLE_CV: CvData = {
  name: "Jane Doe",
  jobTitle: "Senior GIS Developer",
  yearsOfExperience: 8,
  summary: "GIS developer with experience building web mapping platforms and spatial data pipelines for government clients.",
  email: "jane.doe@example.com",
  phone: "+20 100 000 0000",
  skills: ["TypeScript", "React", "PostGIS", "Node.js", "Team leadership"],
  projects: [
    {
      name: "National Land Registry Portal",
      client: "Ministry of Housing",
      location: "Cairo",
      sector: "Government",
      description: "Web portal for searching and maintaining land parcel records.",
      startDate: "2023-03-01",
      technologies: ["React", "PostGIS", "GeoServer"],
      role: "Tech Lead",
      responsibilities: "- Designed the spatial data model\n- Led a team of four developers",
    },
    {
      name: "Water Network Asset Tracker",
      client: "Regional Water Utility",
      location: "Alexandria",
      sector: "Utilities",
      description: "Mobile-first app for field crews to inspect and update network assets.",
      startDate: "2020-06-01",
      endDate: "2022-12-31",
      technologies: ["React Native", "Node.js"],
      role: "Full-stack Developer",
    },
  ],
};
