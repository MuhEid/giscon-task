// Fictional demo data: people, clients and projects are invented for illustration.

export const DEMO_PROJECTS = {
  landRegistry: {
    name: "National Land Registry Portal",
    description:
      "Public web portal for searching land parcels and ownership records, with an internal workflow for surveyors to submit and approve parcel changes.",
    client: "Land Registration Authority",
    location: "Cairo, Egypt",
    sector: "Government",
    startDate: "2023-03-01",
    endDate: null,
    technologies: ["React", "TypeScript", "Node.js", "PostGIS", "GeoServer", "OpenLayers"],
  },
  waterAssets: {
    name: "Water Network Asset Management",
    description:
      "Asset register and field inspection app for 4,000 km of water mains, replacing paper inspection forms and spreadsheets.",
    client: "Delta Water Utility Company",
    location: "Tanta, Egypt",
    sector: "Utilities",
    startDate: "2021-09-01",
    endDate: "2023-02-28",
    technologies: ["React Native", "Node.js", "PostgreSQL", "PostGIS", "Mapbox GL"],
  },
  smartCity: {
    name: "Smart City Operations Dashboard",
    description:
      "Real-time dashboard combining traffic sensors, street-light status and citizen complaints on a single city map for the operations centre.",
    client: "New Capital City Development Authority",
    location: "New Administrative Capital, Egypt",
    sector: "Smart Cities",
    startDate: "2024-01-15",
    endDate: null,
    technologies: ["React", "TypeScript", "Kafka", "TimescaleDB", "Deck.gl"],
  },
  healthFacilities: {
    name: "Health Facilities Accessibility Study",
    description:
      "Spatial analysis of travel times to primary-care facilities to identify under-served villages and rank sites for new clinics.",
    client: "Regional Health Directorate",
    location: "Assiut, Egypt",
    sector: "Healthcare",
    startDate: "2022-04-01",
    endDate: "2022-11-30",
    technologies: ["Python", "GeoPandas", "PostGIS", "pgRouting", "QGIS"],
  },
  agriMonitoring: {
    name: "Crop Monitoring from Satellite Imagery",
    description:
      "Monthly crop-type and crop-health maps derived from Sentinel-2 imagery, published to a web map for agricultural extension officers.",
    client: "Agricultural Research Centre",
    location: "Giza, Egypt",
    sector: "Agriculture",
    startDate: "2020-05-01",
    endDate: "2021-06-30",
    technologies: ["Python", "Google Earth Engine", "Rasterio", "Leaflet"],
  },
  permits: {
    name: "Online Building Permits System",
    description:
      "End-to-end online submission and review of building permit applications, with plot validation against the zoning map.",
    client: "Alexandria Governorate",
    location: "Alexandria, Egypt",
    sector: "Government",
    startDate: "2019-02-01",
    endDate: "2020-03-31",
    technologies: ["Angular", "Java", "Spring Boot", "Oracle Spatial", "ArcGIS API for JavaScript"],
  },
  fleetTracking: {
    name: "Fleet Tracking Platform",
    description:
      "Live vehicle tracking, geofencing alerts and route-history playback for a logistics fleet of 600 trucks.",
    client: "Nile Logistics Group",
    location: "Cairo, Egypt",
    sector: "Transport & Logistics",
    startDate: "2023-06-01",
    endDate: "2024-03-31",
    technologies: ["Node.js", "TypeScript", "Redis", "PostgreSQL", "MapLibre GL", "Docker"],
  },
  censusMapping: {
    name: "Census Enumeration Area Mapping",
    description:
      "Digitisation and quality control of enumeration-area boundaries, plus a tablet app for field teams to update them during the census.",
    client: "National Statistics Agency",
    location: "Nationwide, Egypt",
    sector: "Government",
    startDate: "2017-01-01",
    endDate: "2018-12-31",
    technologies: ["ArcGIS Pro", "ArcGIS Field Maps", "Python", "SQL Server"],
  },
} as const;

type ProjectKey = keyof typeof DEMO_PROJECTS;

export const DEMO_STAFF: {
  name: string;
  jobTitle: string;
  yearsOfExperience: number;
  summary: string;
  skills: string[];
  email: string;
  phone: string;
  // Background colour of the generated initials avatar.
  avatarColor: string;
  assignments: { project: ProjectKey; role: string; responsibilities: string }[];
}[] = [
  {
    name: "Layla Hassan",
    jobTitle: "GIS Solutions Architect",
    yearsOfExperience: 12,
    summary:
      "Solutions architect with twelve years of experience designing enterprise GIS platforms for government and utility clients. Leads technical proposals, solution design and delivery teams from requirements to handover.",
    skills: ["Solution architecture", "PostGIS", "GeoServer", "ArcGIS Enterprise", "System integration", "Technical proposals", "Team leadership"],
    email: "layla.hassan@example.com",
    phone: "+20 100 123 4501",
    avatarColor: "#0f766e",
    assignments: [
      {
        project: "landRegistry",
        role: "Solutions Architect",
        responsibilities: "- Designed the overall architecture and the parcel data model\n- Led the technical proposal and client workshops\n- Defined the integration with the legacy registry database",
      },
      {
        project: "smartCity",
        role: "Technical Lead",
        responsibilities: "- Designed the real-time data pipeline for sensor feeds\n- Coordinated four integration partners",
      },
      {
        project: "permits",
        role: "GIS Lead",
        responsibilities: "- Built the zoning validation rules on Oracle Spatial\n- Trained governorate staff on the review workflow",
      },
      {
        project: "censusMapping",
        role: "GIS Analyst",
        responsibilities: "- Defined topology rules and quality-control checks for boundaries\n- Supervised a team of twelve digitisers",
      },
    ],
  },
  {
    name: "Omar Farouk",
    jobTitle: "Senior Full-Stack Developer",
    yearsOfExperience: 8,
    summary:
      "Full-stack developer focused on web mapping applications and real-time systems. Comfortable across React front ends, Node.js services and spatial databases, with a strong eye for performance.",
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "MapLibre GL", "Docker", "CI/CD"],
    email: "omar.farouk@example.com",
    phone: "+20 100 123 4502",
    avatarColor: "#1d4ed8",
    assignments: [
      {
        project: "landRegistry",
        role: "Lead Developer",
        responsibilities: "- Built the public search portal and map viewer\n- Implemented the surveyor approval workflow",
      },
      {
        project: "fleetTracking",
        role: "Backend Lead",
        responsibilities: "- Designed the location ingestion service handling 10,000 updates per minute\n- Implemented geofencing alerts with Redis",
      },
      {
        project: "smartCity",
        role: "Senior Developer",
        responsibilities: "- Built the live map layers with Deck.gl\n- Implemented the incident timeline",
      },
      {
        project: "waterAssets",
        role: "Full-Stack Developer",
        responsibilities: "- Built the offline-first inspection app\n- Implemented sync between field devices and the asset register",
      },
    ],
  },
  {
    name: "Nour Adel",
    jobTitle: "Spatial Data Engineer",
    yearsOfExperience: 6,
    summary:
      "Data engineer specialised in spatial analysis and remote sensing. Turns raw survey, sensor and satellite data into clean datasets and decision-ready maps.",
    skills: ["Python", "GeoPandas", "PostGIS", "Remote sensing", "Google Earth Engine", "QGIS", "Data quality"],
    email: "nour.adel@example.com",
    phone: "+20 100 123 4503",
    avatarColor: "#b45309",
    assignments: [
      {
        project: "agriMonitoring",
        role: "Remote Sensing Engineer",
        responsibilities: "- Built the Sentinel-2 processing pipeline in Earth Engine\n- Trained and validated the crop classification model",
      },
      {
        project: "healthFacilities",
        role: "Spatial Analyst",
        responsibilities: "- Built the road network model and travel-time analysis with pgRouting\n- Produced the site-ranking report and maps",
      },
      {
        project: "waterAssets",
        role: "Data Migration Lead",
        responsibilities: "- Migrated and cleaned legacy asset records from CAD drawings and spreadsheets",
      },
      {
        project: "landRegistry",
        role: "Data Engineer",
        responsibilities: "- Built the import and validation pipeline for surveyed parcels",
      },
    ],
  },
  {
    name: "Sara Mansour",
    jobTitle: "Frontend Developer",
    yearsOfExperience: 4,
    summary:
      "Frontend developer building accessible, responsive interfaces for map-heavy applications. Works closely with designers and users to keep complex tools simple to use.",
    skills: ["React", "TypeScript", "Accessibility", "CSS", "OpenLayers", "Testing Library", "Figma"],
    email: "sara.mansour@example.com",
    phone: "+20 100 123 4504",
    avatarColor: "#7c3aed",
    assignments: [
      {
        project: "smartCity",
        role: "Frontend Developer",
        responsibilities: "- Built the dashboard layout and widget system\n- Made the operations screens keyboard- and screen-reader-friendly",
      },
      {
        project: "fleetTracking",
        role: "Frontend Developer",
        responsibilities: "- Built the route-history playback and the alerts inbox",
      },
      {
        project: "landRegistry",
        role: "UI Developer",
        responsibilities: "- Implemented the bilingual (Arabic/English) interface and right-to-left layout",
      },
    ],
  },
];
