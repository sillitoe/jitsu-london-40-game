export const badgeRules = {
  shared: "Every character has one square Jitsu badge on the wearer's right shoulder only.",
  orientation:
    "If a character faces the camera, their right shoulder appears on the viewer's left. If a character faces away from the camera, their right shoulder appears on the viewer's right.",
  examiners: "Red badge with white writing.",
  instructors: "White badge with red writing.",
  students: "White badge with black writing.",
} as const;

export const wardrobeRules = {
  examiners:
    "White judogi, black waistcoat including black sleeves, black hakama.",
  instructors: "White judogi, black waistcoat, black hakama.",
  students: "White judogi with belt colour for grade.",
} as const;

export const characterDirection = {
  examiners: "Steve talks a lot. Gareth says very little.",
  cast: "Students and attackers should vary gender, skin colour, hair colour, body shape, and size.",
} as const;
