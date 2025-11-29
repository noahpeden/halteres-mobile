// Equipment list with IDs matching the web app database
export const equipmentList = [
  { value: 1, label: "Barbell" },
  { value: 2, label: "Bumper Plates" },
  { value: 3, label: "Power Rack" },
  { value: 4, label: "Kettlebell" },
  { value: 46, label: "Rower" },
  { value: 47, label: "Treadmill" },
  { value: 5, label: "Dumbbell" },
  { value: 10, label: "Air Bike" },
  { value: 6, label: "Jump Rope" },
  { value: 7, label: "Medicine Ball" },
  { value: 8, label: "Plyo Box" },
  { value: 11, label: "SkiErg" },
  { value: 12, label: "Wall Ball" },
  { value: 14, label: "Gymnastic Rings" },
  { value: 15, label: "Climbing Rope" },
  { value: 16, label: "Resistance Bands" },
  { value: 17, label: "Sled" },
  { value: 18, label: "Battle Ropes" },
  { value: 19, label: "AbMat" },
  { value: 20, label: "Weight Vest" },
  { value: 21, label: "Hex Bar" },
  { value: 22, label: "Slam Ball" },
  { value: 23, label: "Sandbags" },
  { value: 24, label: "Foam Roller" },
  { value: 25, label: "Lacrosse Ball" },
  { value: 26, label: "PVC Pipe" },
  { value: 27, label: "Yoga Mat" },
  { value: 35, label: "Suspension Trainer" },
  { value: 36, label: "Safety Squat Bar" },
  { value: 37, label: "Swiss Bar" },
  { value: 38, label: "Parallettes" },
  { value: 39, label: "Smith Machine" },
  { value: 40, label: "Leg Press Machine" },
  { value: 41, label: "Dip Machine" },
  { value: 42, label: "GHD Machine" },
  { value: 44, label: "Stationary Bike" },
  { value: 45, label: "Elliptical" },
  { value: 49, label: "Climbing Wall" },
  // Triathlon-specific equipment
  { value: 50, label: "Swimming Pool" },
  { value: 51, label: "Open Water Access" },
  { value: 52, label: "Road Bike" },
  { value: 53, label: "Time Trial/Tri Bike" },
  { value: 54, label: "Bike Trainer/Turbo" },
  { value: 55, label: "Power Meter" },
  { value: 56, label: "Heart Rate Monitor" },
  { value: 57, label: "Wetsuit" },
  { value: 58, label: "Running Track" },
  { value: 59, label: "Trail Access" },
  { value: 60, label: "Bike Computer/GPS" },
  { value: 61, label: "Nutrition/Hydration System" },
  { value: 62, label: "Recovery Tools (Ice Bath/Compression)" },
];

export const goals = [
  { value: "strength", label: "Strength" },
  { value: "endurance", label: "Endurance" },
  { value: "hypertrophy", label: "Hypertrophy" },
  { value: "power", label: "Power" },
  { value: "skill", label: "Skill Development" },
  { value: "conditioning", label: "Conditioning" },
];

export const difficulties = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "elite", label: "Elite" },
];

export const focusAreas = [
  { value: "upper_body", label: "Upper Body" },
  { value: "lower_body", label: "Lower Body" },
  { value: "full_body", label: "Full Body" },
  { value: "core", label: "Core" },
  { value: "posterior_chain", label: "Posterior Chain" },
  { value: "anterior_chain", label: "Anterior Chain" },
];

export const workoutFormats = [
  { value: "standard", label: "Standard Format" },
  { value: "emom", label: "EMOM" },
  { value: "amrap", label: "AMRAP" },
  { value: "for_time", label: "For Time" },
  { value: "tabata", label: "Tabata" },
  { value: "circuit", label: "Circuit Training" },
];

export const programTypes = [
  { value: "linear", label: "Linear Progression" },
  { value: "undulating", label: "Undulating Periodization" },
  { value: "block", label: "Block Periodization" },
  { value: "conjugate", label: "Conjugate Method" },
  { value: "concurrent", label: "Concurrent Training" },
];

export const gymTypes = [
  { value: "Crossfit Box", label: "Crossfit Box" },
  { value: "Commercial Gym", label: "Commercial Gym" },
  { value: "Home Gym", label: "Home Gym" },
  { value: "Minimal Equipment", label: "Minimal Equipment" },
  { value: "Outdoor Space", label: "Outdoor Space" },
  { value: "Powerlifting Gym", label: "Powerlifting Gym" },
  { value: "Olympic Weightlifting Gym", label: "Olympic Weightlifting Gym" },
  { value: "Bodyweight Only", label: "Bodyweight Only" },
  { value: "Studio Gym", label: "Studio Gym" },
  { value: "University Gym", label: "University Gym" },
  { value: "Hotel Gym", label: "Hotel Gym" },
  { value: "Apartment Gym", label: "Apartment Gym" },
  { value: "Boxing/MMA Gym", label: "Boxing/MMA Gym" },
  {
    value: "Triathlon Training Facility",
    label: "Triathlon Training Facility",
  },
  { value: "Multi-Sport Complex", label: "Multi-Sport Complex" },
  { value: "Other", label: "Other" },
];

// Equipment presets based on gym type
export const gymEquipmentPresets: Record<string, number[]> = {
  "Crossfit Box": [
    1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 22, 23, 26,
    46,
  ],
  "Commercial Gym": [1, 2, 3, 4, 5, 16, 24, 27, 39, 40, 41, 42, 44, 45, 46, 47],
  "Home Gym": [4, 5, 6, 16, 24, 27],
  "Minimal Equipment": [4, 5, 6, 16, 27],
  "Outdoor Space": [6, 16, 18, 27],
  "Powerlifting Gym": [1, 2, 3, 5, 16, 21, 24, 27, 36, 37],
  "Olympic Weightlifting Gym": [1, 2, 3, 5, 16, 24, 27],
  "Bodyweight Only": [27, 38],
  "Studio Gym": [4, 5, 6, 16, 27, 35, 44, 45],
  "University Gym": [1, 2, 3, 4, 5, 39, 40, 41, 42, 44, 45, 46, 47],
  "Hotel Gym": [5, 16, 27, 39, 44, 45, 47],
  "Apartment Gym": [5, 16, 27, 44, 45],
  "Boxing/MMA Gym": [5, 6, 7, 16, 17, 18, 22, 27, 35],
  "Triathlon Training Facility": [
    50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 6, 16, 27, 47,
  ],
  "Multi-Sport Complex": [
    50, 52, 54, 55, 56, 58, 60, 61, 1, 2, 3, 4, 5, 6, 16, 27, 44, 45, 46, 47,
  ],
  Other: [],
};

// Day name to number mapping (0 = Sunday, 6 = Saturday)
export const dayNameToNumber: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export const dayNumberToName: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

// Days of week for selection
export const daysOfWeek = [
  { value: "Monday", label: "Mon", number: 1 },
  { value: "Tuesday", label: "Tue", number: 2 },
  { value: "Wednesday", label: "Wed", number: 3 },
  { value: "Thursday", label: "Thu", number: 4 },
  { value: "Friday", label: "Fri", number: 5 },
  { value: "Saturday", label: "Sat", number: 6 },
  { value: "Sunday", label: "Sun", number: 0 },
];
